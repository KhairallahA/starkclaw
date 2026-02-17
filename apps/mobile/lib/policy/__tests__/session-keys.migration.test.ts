import { beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => {
  const store = new Map<string, string>();
  const execute = vi.fn();
  const waitForTransaction = vi.fn();
  const callContract = vi.fn();

  return {
    store,
    execute,
    waitForTransaction,
    callContract,
  };
});

vi.mock("@/lib/starknet/account", () => ({
  createOwnerAccount: () => ({
    execute: hoisted.execute,
    waitForTransaction: hoisted.waitForTransaction,
  }),
}));

vi.mock("expo-crypto", () => ({
  getRandomBytesAsync: vi.fn(),
}));

vi.mock("@/lib/starknet/rpc", () => ({
  callContract: hoisted.callContract,
}));

vi.mock("@/lib/storage/secure-store", () => ({
  secureGet: vi.fn(async (key: string) => hoisted.store.get(key) ?? null),
  secureSet: vi.fn(async (key: string, value: string) => {
    hoisted.store.set(key, value);
  }),
  secureDelete: vi.fn(async (key: string) => {
    hoisted.store.delete(key);
  }),
}));

import {
  isSessionKeyValidOnchain,
  registerSessionKeyOnchain,
} from "@/lib/policy/session-keys";
import type { StoredSessionKey } from "@/lib/policy/session-keys";

const SESSION_KEYS_INDEX_ID = "starkclaw.session_keys.v1";

const wallet = {
  networkId: "sepolia" as const,
  rpcUrl: "https://rpc.example",
  chainIdHex: "0x534e5f5345504f4c4941",
  ownerPublicKey: "0x1",
  accountAddress: "0xabc123",
};

const session: StoredSessionKey = {
  key: "0x222",
  tokenSymbol: "STRK",
  tokenAddress: "0x333",
  spendingLimit: "1000",
  validAfter: 100,
  validUntil: 2000,
  allowedContracts: [], // Empty: entrypoint-only restrictions (supported by session-account API)
  createdAt: 100,
};

describe("session-keys migration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.store.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-14T00:00:00.000Z"));
  });

  it("registers session key with add_or_update_session_key entrypoint and SessionData", async () => {
    hoisted.execute.mockResolvedValue({ transaction_hash: "0xdeadbeef" });
    hoisted.waitForTransaction.mockResolvedValue(undefined);
    hoisted.store.set(SESSION_KEYS_INDEX_ID, JSON.stringify([session]));

    const out = await registerSessionKeyOnchain({
      wallet,
      ownerPrivateKey: "0xowner",
      session,
    });

    expect(out).toEqual({ txHash: "0xdeadbeef" });
    expect(hoisted.execute).toHaveBeenCalledTimes(1);
    expect(hoisted.waitForTransaction).toHaveBeenCalledWith("0xdeadbeef", {
      retries: 60,
      retryInterval: 3_000,
    });

    const calls = hoisted.execute.mock.calls[0]?.[0] as Array<{
      entrypoint: string;
      calldata: string[];
    }>;

    // Single add_or_update_session_key call with new API
    expect(calls).toHaveLength(1);
    expect(calls[0].entrypoint).toBe("add_or_update_session_key");
    
    // Calldata: [key, valid_until, max_calls, entrypoints_len, ...entrypoints]
    expect(calls[0].calldata[0]).toBe(session.key);
    expect(calls[0].calldata[1]).toBe(session.validUntil.toString()); // valid_until
    expect(calls[0].calldata[2]).toBe("100"); // max_calls
    // Calldata[3] is entrypoints_len, followed by entrypoint selectors

    const persisted = JSON.parse(
      hoisted.store.get(SESSION_KEYS_INDEX_ID) ?? "[]"
    ) as StoredSessionKey[];
    expect(persisted[0].lastTxHash).toBe("0xdeadbeef");
    expect(persisted[0].registeredAt).toBe(Math.floor(Date.now() / 1000));
  });

  it("validates session key by get_session_data fields", async () => {
    hoisted.callContract.mockResolvedValueOnce(["0x7fffffff", "0x64", "0x1", "0x1"]);
    const valid = await isSessionKeyValidOnchain({
      rpcUrl: wallet.rpcUrl,
      accountAddress: wallet.accountAddress,
      sessionPublicKey: session.key,
    });
    expect(valid).toBe(true);
    expect(hoisted.callContract).toHaveBeenCalledWith(wallet.rpcUrl, {
      contract_address: wallet.accountAddress,
      entry_point_selector: expect.stringMatching(/^0x[0-9a-f]+$/),
      calldata: [session.key],
    });

    hoisted.callContract.mockResolvedValueOnce(["0x1", "0x64", "0x64", "0x1"]);
    const exhausted = await isSessionKeyValidOnchain({
      rpcUrl: wallet.rpcUrl,
      accountAddress: wallet.accountAddress,
      sessionPublicKey: session.key,
    });
    expect(exhausted).toBe(false);

    hoisted.callContract.mockResolvedValueOnce(["0x0", "0x64", "0x0", "0x1"]);
    const expired = await isSessionKeyValidOnchain({
      rpcUrl: wallet.rpcUrl,
      accountAddress: wallet.accountAddress,
      sessionPublicKey: session.key,
    });
    expect(expired).toBe(false);
  });

  it("returns false when get_session_data call fails", async () => {
    hoisted.callContract.mockRejectedValueOnce(new Error("rpc error"));
    const valid = await isSessionKeyValidOnchain({
      rpcUrl: wallet.rpcUrl,
      accountAddress: wallet.accountAddress,
      sessionPublicKey: session.key,
    });
    expect(valid).toBe(false);
  });
});
