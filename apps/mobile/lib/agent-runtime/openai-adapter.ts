/**
 * OpenAI adapter — streaming chat completions via SSE.
 *
 * The API key is injected at construction time (caller reads from SecureStore).
 * No key is ever logged or included in error messages.
 */

import type {
  ChatStream,
  LlmProvider,
  ModelInfo,
  StreamChunk,
  StreamOptions,
} from "./types";

const OPENAI_BASE = "https://api.openai.com/v1";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MODEL = "gpt-4o-mini";

// ---------------------------------------------------------------------------
// SSE line parser
// ---------------------------------------------------------------------------

/** Accumulator for tool call arguments - passed as parameter to avoid module-level state */
function parseSseLine(line: string, toolCallBuffers: Map<string, string>): StreamChunk[] {
  if (!line.startsWith("data: ")) return [];
  const data = line.slice(6).trim();
  if (data === "[DONE]") return [{ type: "done", finishReason: "stop" }];

  try {
    const json = JSON.parse(data);
    const delta = json?.choices?.[0]?.delta;
    const finishReason = json?.choices?.[0]?.finish_reason;

    if (finishReason === "stop" || finishReason === "length") {
      return [{ type: "done", finishReason }];
    }

    const text = delta?.content;
    if (typeof text === "string" && text.length > 0) {
      return [{ type: "delta", text }];
    }

    // Check for tool calls
    const toolCalls = delta?.tool_calls;
    if (Array.isArray(toolCalls) && toolCalls.length > 0) {
      const results: StreamChunk[] = [];
      
      for (const tc of toolCalls) {
        if (tc?.id && tc?.function?.name) {
          const tcId = tc.id;
          const funcName = tc.function.name;
          const newArgsFragment = tc.function.arguments || "";
          
          // Get or create accumulator for this tool call ID
          let buffer = toolCallBuffers.get(tcId);
          if (!buffer) {
            buffer = "";
            toolCallBuffers.set(tcId, buffer);
          }
          
          // Append the new fragment
          buffer += newArgsFragment;
          toolCallBuffers.set(tcId, buffer);
          
          // Try to parse accumulated arguments
          let args = {};
          if (buffer) {
            try {
              // Only parse if it looks like complete JSON
              if (buffer.startsWith("{") && buffer.endsWith("}")) {
                args = JSON.parse(buffer);
                // Clear buffer after successful parse
                toolCallBuffers.delete(tcId);
              }
            } catch {
              // Partial arguments - will be completed in next chunk
            }
          }
          
          // Only emit if we have valid args
          if (Object.keys(args).length > 0 || !buffer) {
            results.push({
              type: "tool_call",
              toolCall: {
                id: tcId,
                name: funcName,
                arguments: args,
              },
            });
          }
        }
      }
      
      // Return all tool calls instead of just the first one
      if (results.length > 0) {
        return results;
      }
    }
  } catch {
    // Malformed JSON — skip.
  }

  return [];
}

// ---------------------------------------------------------------------------
// Streaming fetch
// ---------------------------------------------------------------------------

async function* streamSse(
  url: string,
  body: Record<string, unknown>,
  apiKey: string,
  timeoutMs: number,
  signal: AbortSignal
): AsyncGenerator<StreamChunk> {
  const controller = new AbortController();
  const combinedSignal = signal;

  // Timeout via setTimeout
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const abortOnParent = () => controller.abort();
  combinedSignal.addEventListener("abort", abortOnParent);

  // Create fresh buffer for this stream - avoids shared state between calls
  const toolCallBuffers = new Map<string, string>();

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      // Scrub: never include apiKey in error messages.
      const safeMsg = scrubApiKey(text, apiKey);
      throw new ProviderError(`OpenAI API error (HTTP ${res.status})`, safeMsg);
    }

    if (!res.body) {
      throw new ProviderError("OpenAI returned no response body", "");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    
    // Create fresh buffer for this stream - avoids shared state between calls
    const toolCallBuffers = new Map<string, string>();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep incomplete last line in buffer.
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const chunks = parseSseLine(trimmed, toolCallBuffers);
        for (const chunk of chunks) {
          yield chunk;
          if (chunk.type === "done") {
            toolCallBuffers.clear();
            return;
          }
        }
      }
    }

    // Process any remaining buffer.
    if (buffer.trim()) {
      const chunks = parseSseLine(buffer.trim(), toolCallBuffers);
      for (const chunk of chunks) {
        yield chunk;
      }
    }

    // If we never received [DONE], emit one.
    yield { type: "done", finishReason: "stop" };
  } finally {
    clearTimeout(timeoutId);
    combinedSignal.removeEventListener("abort", abortOnParent);
    toolCallBuffers.clear();
  }
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class ProviderError extends Error {
  readonly detail: string;
  constructor(message: string, detail: string) {
    super(message);
    this.name = "ProviderError";
    this.detail = detail;
  }
}

function scrubApiKey(text: string, apiKey: string): string {
  if (!apiKey) return text;
  return text.replaceAll(apiKey, "[REDACTED]");
}

// ---------------------------------------------------------------------------
// OpenAI provider
// ---------------------------------------------------------------------------

export function createOpenAiProvider(apiKey: string): LlmProvider {
  if (!apiKey) {
    throw new ProviderError("OpenAI API key is required", "");
  }

  return {
    name: "OpenAI",
    id: "openai",

    streamChat(opts: StreamOptions): ChatStream {
      const model = opts.model || DEFAULT_MODEL;
      const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      const abortController = new AbortController();

      const messages = [
        ...(opts.systemPrompt
          ? [{ role: "system" as const, content: opts.systemPrompt }]
          : []),
        ...opts.messages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const body: Record<string, unknown> = {
        model,
        messages,
        stream: true,
      };
      if (opts.maxTokens != null) body.max_tokens = opts.maxTokens;
      if (opts.temperature != null) body.temperature = opts.temperature;
      if (opts.tools != null) body.tools = opts.tools;

      const generator = streamSse(
        `${OPENAI_BASE}/chat/completions`,
        body,
        apiKey,
        timeoutMs,
        abortController.signal
      );

      const stream: ChatStream = Object.assign(generator, {
        cancel: () => abortController.abort(),
      });

      return stream;
    },

    async listModels(): Promise<ModelInfo[]> {
      try {
        const res = await fetch(`${OPENAI_BASE}/models`, {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(10_000),
        });

        if (!res.ok) return [];

        const json = (await res.json()) as { data?: Array<{ id: string }> };
        return (json.data ?? [])
          .filter((m) => m.id.startsWith("gpt-"))
          .map((m) => ({ id: m.id, name: m.id }))
          .sort((a, b) => a.id.localeCompare(b.id));
      } catch {
        return [];
      }
    },
  };
}
