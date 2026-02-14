const CLASS_HASH_REGEX = /^0x[0-9a-fA-F]{1,64}$/;

function assertValidClassHash(name: string, value: string): string {
  if (!CLASS_HASH_REGEX.test(value)) {
    throw new Error(`${name} must be a 0x-prefixed hex felt (1-64 hex chars)`);
  }
  return `0x${value.slice(2).toLowerCase()}`;
}

// Legacy AgentAccount class hash (kept for deterministic address compatibility
// for wallets created before SessionAccount migration metadata existed).
export const LEGACY_AGENT_ACCOUNT_CLASS_HASH = assertValidClassHash(
  "LEGACY_AGENT_ACCOUNT_CLASS_HASH",
  "0x1d8219165d3a7b773abc50972b6d43a87c7f5859df8cd2f832c29f5ad091cd1"
);

const DEFAULT_SESSION_ACCOUNT_CLASS_HASH = assertValidClassHash(
  "DEFAULT_SESSION_ACCOUNT_CLASS_HASH",
  "0x4c1adc7ae850ce40188692488816042114f055c32b61270f775c98163a69f77"
);

// Canonical class hash for SessionAccount (starknet-agentic session-account lineage).
// Source baseline: keep-starknet-strange/starknet-agentic PR #227.
//
// Can be overridden in app env for test/deploy parity:
// EXPO_PUBLIC_SESSION_ACCOUNT_CLASS_HASH=0x...
export const SESSION_ACCOUNT_CLASS_HASH = process.env.EXPO_PUBLIC_SESSION_ACCOUNT_CLASS_HASH
  ? assertValidClassHash(
    "EXPO_PUBLIC_SESSION_ACCOUNT_CLASS_HASH",
    process.env.EXPO_PUBLIC_SESSION_ACCOUNT_CLASS_HASH.trim()
  )
  : DEFAULT_SESSION_ACCOUNT_CLASS_HASH;

// Backward-compatible alias to avoid broad churn during migration slices.
// Do not use for new code; prefer SESSION_ACCOUNT_CLASS_HASH.
export const AGENT_ACCOUNT_CLASS_HASH = SESSION_ACCOUNT_CLASS_HASH;

export function normalizeOptionalClassHash(
  name: string,
  value: string | null | undefined
): string | null {
  if (!value) return null;
  return assertValidClassHash(name, value.trim());
}
