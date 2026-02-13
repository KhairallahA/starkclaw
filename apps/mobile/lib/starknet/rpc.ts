type JsonRpcSuccess<T> = {
  jsonrpc: "2.0";
  id: number;
  result: T;
};

type JsonRpcError = {
  jsonrpc: "2.0";
  id: number | null;
  error: { code: number; message: string; data?: unknown };
};

type JsonRpcResponse<T> = JsonRpcSuccess<T> | JsonRpcError;

export class StarknetRpcError extends Error {
  readonly code?: number;
  readonly data?: unknown;

  constructor(message: string, opts?: { code?: number; data?: unknown }) {
    super(message);
    this.name = "StarknetRpcError";
    this.code = opts?.code;
    this.data = opts?.data;
  }
}

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function starknetRpc<T>(
  rpcUrl: string,
  method: string,
  params: unknown[] = [],
  opts?: { timeoutMs?: number }
): Promise<T> {
  const timeoutMs = opts?.timeoutMs ?? 15_000;

  const res = await fetchJsonWithTimeout(
    rpcUrl,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    },
    timeoutMs
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new StarknetRpcError(`HTTP ${res.status} from RPC`, { data: text });
  }

  const json = (await res.json()) as JsonRpcResponse<T>;
  if ("error" in json) {
    throw new StarknetRpcError(json.error.message, {
      code: json.error.code,
      data: json.error.data,
    });
  }

  return json.result;
}

export async function getChainId(rpcUrl: string): Promise<string> {
  return starknetRpc<string>(rpcUrl, "starknet_chainId", []);
}

export type StarknetCallRequest = {
  contract_address: string;
  entry_point_selector: string;
  calldata: string[];
};

export async function callContract(
  rpcUrl: string,
  req: StarknetCallRequest,
  blockId: "latest" | "pending" = "latest"
): Promise<string[]> {
  return starknetRpc<string[]>(rpcUrl, "starknet_call", [req, blockId]);
}

export async function getClassHashAt(
  rpcUrl: string,
  contractAddress: string,
  blockId: "latest" | "pending" = "latest"
): Promise<string> {
  return starknetRpc<string>(rpcUrl, "starknet_getClassHashAt", [blockId, contractAddress]);
}

export async function isContractDeployed(
  rpcUrl: string,
  contractAddress: string
): Promise<boolean> {
  try {
    const classHash = await getClassHashAt(rpcUrl, contractAddress, "latest");
    return BigInt(classHash) !== 0n;
  } catch (e) {
    // Avoid masking random network issues by only treating "not found" as false.
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.toLowerCase().includes("contract not found")) return false;
    if (msg.toLowerCase().includes("requested contract address")) return false;
    if (msg.toLowerCase().includes("invalid contract address")) return false;
    throw e;
  }
}
