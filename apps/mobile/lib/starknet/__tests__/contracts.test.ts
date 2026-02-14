import { afterEach, describe, expect, it, vi } from "vitest";

const DEFAULT_SESSION_ACCOUNT_CLASS_HASH =
  "0x4c1adc7ae850ce40188692488816042114f055c32b61270f775c98163a69f77";
const LEGACY_AGENT_ACCOUNT_CLASS_HASH =
  "0x1d8219165d3a7b773abc50972b6d43a87c7f5859df8cd2f832c29f5ad091cd1";

async function loadContractsModule() {
  vi.resetModules();
  return import("../contracts");
}

describe("starknet/contracts", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses default canonical hash when env override is absent", async () => {
    vi.stubEnv("EXPO_PUBLIC_SESSION_ACCOUNT_CLASS_HASH", undefined);
    const mod = await loadContractsModule();
    expect(mod.SESSION_ACCOUNT_CLASS_HASH).toBe(DEFAULT_SESSION_ACCOUNT_CLASS_HASH);
    expect(mod.AGENT_ACCOUNT_CLASS_HASH).toBe(DEFAULT_SESSION_ACCOUNT_CLASS_HASH);
    expect(mod.LEGACY_AGENT_ACCOUNT_CLASS_HASH).toBe(LEGACY_AGENT_ACCOUNT_CLASS_HASH);
  });

  it("normalizes a valid env override", async () => {
    vi.stubEnv(
      "EXPO_PUBLIC_SESSION_ACCOUNT_CLASS_HASH",
      "  0xABCDEF1234  "
    );
    const mod = await loadContractsModule();
    expect(mod.SESSION_ACCOUNT_CLASS_HASH).toBe("0xabcdef1234");
  });

  it("rejects invalid env override format", async () => {
    vi.stubEnv("EXPO_PUBLIC_SESSION_ACCOUNT_CLASS_HASH", "not-a-felt");
    await expect(loadContractsModule()).rejects.toThrow(
      "EXPO_PUBLIC_SESSION_ACCOUNT_CLASS_HASH must be a 0x-prefixed hex felt"
    );
  });
});
