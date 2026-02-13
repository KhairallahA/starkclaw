import * as Crypto from "expo-crypto";
import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";
import {
  SignerInterface,
  num,
  type Call,
  type DeclareSignerDetails,
  type DeployAccountSignerDetails,
  type InvocationsSignerDetails,
  type Signature,
  type TypedData,
} from "starknet";

export type KeyringProxySignerConfig = {
  proxyUrl: string;
  accountAddress: string;
  clientId: string;
  hmacSecret: string;
  requestTimeoutMs: number;
  validUntil: number;
  keyId?: string;
  requester: string;
  tool: string;
  mobileActionId: string;
  reason?: string;
};

type KeyringSignResponse = {
  signature: unknown[];
  sessionPublicKey?: string;
  requestId?: string;
  request_id?: string;
  messageHash?: string;
  message_hash?: string;
};

function toFeltHex(value: string | bigint | number): string {
  if (typeof value === "string" && value.startsWith("0x")) {
    return value.toLowerCase();
  }
  return num.toHex(value as string | bigint | number).toLowerCase();
}

function feltEqualsHex(a: string, b: string): boolean {
  try {
    return BigInt(a) === BigInt(b);
  } catch {
    return false;
  }
}

function isHexFelt(value: unknown): value is string {
  return typeof value === "string" && /^0x[0-9a-fA-F]+$/.test(value);
}

function sha256Hex(input: string): string {
  return bytesToHex(sha256(utf8ToBytes(input)));
}

function hmacHex(secret: string, payload: string): string {
  return bytesToHex(hmac(sha256, utf8ToBytes(secret), utf8ToBytes(payload)));
}

function buildHmacPayload(args: {
  timestamp: string;
  nonce: string;
  method: string;
  path: string;
  rawBody: string;
}): string {
  return `${args.timestamp}.${args.nonce}.${args.method.toUpperCase()}.${args.path}.${sha256Hex(
    args.rawBody
  )}`;
}

function formatProxyError(status: number, rawText: string): string {
  if (!rawText) {
    return `Keyring proxy error (${status})`;
  }
  try {
    const parsed = JSON.parse(rawText) as { error?: string; message?: string };
    const detail = parsed.message || parsed.error;
    if (detail) return `Keyring proxy error (${status}): ${detail}`;
  } catch {
    // Keep raw body fallback.
  }
  return `Keyring proxy error (${status}): ${rawText}`;
}

async function randomNonceHex(byteLength: number): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(byteLength);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export class KeyringProxySigner extends SignerInterface {
  private readonly endpointPath = "/v1/sign/session-transaction";
  private readonly config: KeyringProxySignerConfig;
  private cachedSessionPublicKey?: string;
  private lastRequestId?: string;
  private lastMessageHash?: string;

  constructor(config: KeyringProxySignerConfig) {
    super();
    this.config = config;
  }

  getLastRequestId(): string | undefined {
    return this.lastRequestId;
  }

  getLastMessageHash(): string | undefined {
    return this.lastMessageHash;
  }

  async getPubKey(): Promise<string> {
    if (this.cachedSessionPublicKey) return this.cachedSessionPublicKey;
    throw new Error("Session public key unavailable before first successful proxy signature");
  }

  async signMessage(_typedData: TypedData, _accountAddress: string): Promise<Signature> {
    throw new Error("KeyringProxySigner does not support signMessage");
  }

  async signDeployAccountTransaction(
    _transaction: DeployAccountSignerDetails
  ): Promise<Signature> {
    throw new Error("KeyringProxySigner cannot sign deploy account transactions");
  }

  async signDeclareTransaction(_transaction: DeclareSignerDetails): Promise<Signature> {
    throw new Error("KeyringProxySigner cannot sign declare transactions");
  }

  async signTransaction(
    transactions: Call[],
    transactionsDetail: InvocationsSignerDetails
  ): Promise<Signature> {
    const nowSec = Math.floor(Date.now() / 1000);
    if (this.config.validUntil <= nowSec) {
      throw new Error("Remote signer validUntil is already expired");
    }

    const requestPayload = {
      accountAddress: this.config.accountAddress,
      keyId: this.config.keyId,
      chainId: toFeltHex(transactionsDetail.chainId),
      nonce: toFeltHex(transactionsDetail.nonce),
      validUntil: this.config.validUntil,
      calls: transactions.map((call) => ({
        contractAddress: call.contractAddress,
        entrypoint: call.entrypoint,
        calldata: Array.isArray(call.calldata)
          ? call.calldata.map((value: unknown) => {
              if (typeof value === "string") return value;
              if (typeof value === "number" || typeof value === "bigint") {
                return num.toHex(value);
              }
              return String(value);
            })
          : [],
      })),
      context: {
        requester: this.config.requester,
        tool: this.config.tool,
        reason: this.config.reason ?? "starkclaw mobile transfer execution",
        client_id: this.config.clientId,
        mobile_action_id: this.config.mobileActionId,
      },
    };

    const rawBody = JSON.stringify(requestPayload);
    const timestamp = Date.now().toString();
    const nonce = await randomNonceHex(16);
    const url = new URL(this.endpointPath, this.config.proxyUrl);
    const payload = buildHmacPayload({
      timestamp,
      nonce,
      method: "POST",
      path: `${url.pathname}${url.search}`,
      rawBody,
    });
    const signature = hmacHex(this.config.hmacSecret, payload);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-keyring-client-id": this.config.clientId,
          "x-keyring-timestamp": timestamp,
          "x-keyring-nonce": nonce,
          "x-keyring-signature": signature,
        },
        body: rawBody,
        signal: controller.signal,
      });

      if (!response.ok) {
        const rawText = await response.text();
        throw new Error(formatProxyError(response.status, rawText));
      }

      const parsed = (await response.json()) as KeyringSignResponse;
      if (!Array.isArray(parsed.signature) || parsed.signature.length !== 4) {
        throw new Error("Invalid keyring signature response: expected [pubkey, r, s, valid_until]");
      }
      if (!parsed.signature.every(isHexFelt)) {
        throw new Error("Invalid keyring signature response: all signature felts must be hex");
      }

      const normalizedSignature = parsed.signature.map((felt) => num.toHex(BigInt(felt)));
      const signaturePubKey = normalizedSignature[0];
      const signatureValidUntil = normalizedSignature[3];
      const expectedValidUntil = num.toHex(this.config.validUntil);
      const responseSessionPublicKey = parsed.sessionPublicKey
        ? num.toHex(BigInt(parsed.sessionPublicKey))
        : signaturePubKey;

      if (parsed.sessionPublicKey && !feltEqualsHex(parsed.sessionPublicKey, signaturePubKey)) {
        throw new Error(
          "Invalid keyring signature response: sessionPublicKey does not match signature pubkey"
        );
      }
      if (!feltEqualsHex(signatureValidUntil, expectedValidUntil)) {
        throw new Error(
          "Invalid keyring signature response: signature valid_until does not match requested window"
        );
      }
      if (
        this.cachedSessionPublicKey &&
        !feltEqualsHex(this.cachedSessionPublicKey, responseSessionPublicKey)
      ) {
        throw new Error(
          "Invalid keyring signature response: session public key changed unexpectedly"
        );
      }

      this.cachedSessionPublicKey = responseSessionPublicKey;
      this.lastRequestId = parsed.requestId ?? parsed.request_id;
      this.lastMessageHash = parsed.messageHash ?? parsed.message_hash;

      return normalizedSignature;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Keyring proxy request timed out");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
