import { beforeEach, describe, expect, it, vi } from "vitest";
import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";

vi.mock("expo-crypto", () => ({
  getRandomBytesAsync: vi.fn(async (size: number) => new Uint8Array(size).fill(1)),
}));

import * as Crypto from "expo-crypto";

import { KeyringProxySigner } from "../keyring-proxy-signer";

const randomBytesMock = vi.mocked(Crypto.getRandomBytesAsync);

function sha256Hex(input: string): string {
  return bytesToHex(sha256(utf8ToBytes(input)));
}

function hmacHex(secret: string, payload: string): string {
  return bytesToHex(hmac(sha256, utf8ToBytes(secret), utf8ToBytes(payload)));
}

describe("KeyringProxySigner", () => {
  const validUntil = Math.floor(Date.now() / 1000) + 3600;

  beforeEach(() => {
    vi.restoreAllMocks();
    randomBytesMock.mockResolvedValue(new Uint8Array(16).fill(1));
  });

  it("signs transaction through keyring endpoint with HMAC headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        requestId: "req-123",
        messageHash: "0xabc",
        signature: ["0x11", "0x22", "0x33", `0x${validUntil.toString(16)}`],
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const signer = new KeyringProxySigner({
      proxyUrl: "https://signer.internal:8545",
      accountAddress: "0x1234",
      clientId: "mobile-client",
      hmacSecret: "super-secret",
      requestTimeoutMs: 5_000,
      validUntil,
      keyId: "default",
      requester: "starkclaw-mobile",
      tool: "execute_transfer",
      mobileActionId: "mobile_action_1",
    });

    const signature = await signer.signTransaction(
      [{ contractAddress: "0x99", entrypoint: "transfer", calldata: ["0x1", "0x2", "0x0"] }],
      { chainId: "0x534e5f5345504f4c4941", nonce: "0x7" } as never
    );

    expect(signature).toEqual(["0x11", "0x22", "0x33", `0x${validUntil.toString(16)}`]);
    expect(signer.getLastRequestId()).toBe("req-123");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://signer.internal:8545/v1/sign/session-transaction");
    const body = String(init.body);
    const parsedBody = JSON.parse(body);
    expect(parsedBody.accountAddress).toBe("0x1234");
    expect(parsedBody.context.requester).toBe("starkclaw-mobile");
    expect(parsedBody.context.tool).toBe("execute_transfer");
    expect(parsedBody.context.client_id).toBe("mobile-client");
    expect(parsedBody.context.mobile_action_id).toBe("mobile_action_1");

    const headers = init.headers as Record<string, string>;
    expect(headers["x-keyring-client-id"]).toBe("mobile-client");
    expect(headers["x-keyring-nonce"]).toBe("01010101010101010101010101010101");
    expect(headers["x-keyring-timestamp"]).toBeDefined();
    expect(headers["x-keyring-signature"]).toBeDefined();

    const hmacPayload = `${headers["x-keyring-timestamp"]}.${headers["x-keyring-nonce"]}.POST./v1/sign/session-transaction.${sha256Hex(
      body
    )}`;
    expect(headers["x-keyring-signature"]).toBe(hmacHex("super-secret", hmacPayload));
  });

  it("surfaces policy denial from signer endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => JSON.stringify({ error: "policy denied" }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const signer = new KeyringProxySigner({
      proxyUrl: "https://signer.internal:8545",
      accountAddress: "0x1234",
      clientId: "mobile-client",
      hmacSecret: "super-secret",
      requestTimeoutMs: 5_000,
      validUntil,
      requester: "starkclaw-mobile",
      tool: "execute_transfer",
      mobileActionId: "mobile_action_2",
    });

    await expect(
      signer.signTransaction(
        [{ contractAddress: "0x99", entrypoint: "transfer", calldata: ["0x1", "0x2", "0x0"] }],
        { chainId: "0x534e5f5345504f4c4941", nonce: "0x7" } as never
      )
    ).rejects.toThrow(/Keyring proxy error \(422\)/);
  });

  it("rejects malformed signature response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        signature: ["0x11", "0x22", "0x33"], // missing valid_until
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const signer = new KeyringProxySigner({
      proxyUrl: "https://signer.internal:8545",
      accountAddress: "0x1234",
      clientId: "mobile-client",
      hmacSecret: "super-secret",
      requestTimeoutMs: 5_000,
      validUntil,
      requester: "starkclaw-mobile",
      tool: "execute_transfer",
      mobileActionId: "mobile_action_3",
    });

    await expect(
      signer.signTransaction(
        [{ contractAddress: "0x99", entrypoint: "transfer", calldata: ["0x1", "0x2", "0x0"] }],
        { chainId: "0x534e5f5345504f4c4941", nonce: "0x7" } as never
      )
    ).rejects.toThrow(/expected \[pubkey, r, s, valid_until\]/i);
  });

  it("times out when signer endpoint does not respond", async () => {
    const fetchMock = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        const abortSignal = init.signal;
        abortSignal?.addEventListener("abort", () => {
          const err = new Error("aborted");
          (err as Error & { name: string }).name = "AbortError";
          reject(err);
        });
      });
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const signer = new KeyringProxySigner({
      proxyUrl: "https://signer.internal:8545",
      accountAddress: "0x1234",
      clientId: "mobile-client",
      hmacSecret: "super-secret",
      requestTimeoutMs: 1,
      validUntil,
      requester: "starkclaw-mobile",
      tool: "execute_transfer",
      mobileActionId: "mobile_action_4",
    });

    await expect(
      signer.signTransaction(
        [{ contractAddress: "0x99", entrypoint: "transfer", calldata: ["0x1", "0x2", "0x0"] }],
        { chainId: "0x534e5f5345504f4c4941", nonce: "0x7" } as never
      )
    ).rejects.toThrow(/timed out/i);
  });
});
