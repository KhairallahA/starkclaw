import { describe, expect, it } from "vitest";

import { resolveWalletAccountClassHash } from "../class-hash";

describe("wallet class hash resolution", () => {
  it("falls back to legacy hash when no persisted class hash exists", () => {
    expect(resolveWalletAccountClassHash(null)).toBe(
      "0x1d8219165d3a7b773abc50972b6d43a87c7f5859df8cd2f832c29f5ad091cd1"
    );
  });

  it("normalizes valid persisted class hash", () => {
    expect(resolveWalletAccountClassHash(" 0xABC123 ")).toBe("0xabc123");
  });

  it("rejects invalid persisted class hash", () => {
    expect(() => resolveWalletAccountClassHash("bad-hash")).toThrow(
      "stored wallet class hash must be a 0x-prefixed hex felt"
    );
  });
});
