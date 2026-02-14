import {
  LEGACY_AGENT_ACCOUNT_CLASS_HASH,
  normalizeOptionalClassHash,
} from "../starknet/contracts";

export function resolveWalletAccountClassHash(
  persistedClassHash: string | null | undefined
): string {
  const normalized = normalizeOptionalClassHash(
    "stored wallet class hash",
    persistedClassHash
  );
  return normalized ?? LEGACY_AGENT_ACCOUNT_CLASS_HASH;
}
