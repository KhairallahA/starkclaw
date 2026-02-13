const MASK_128 = (1n << 128n) - 1n;

export type U256Parts = { low: string; high: string };

function toHex(value: bigint): string {
  if (value < 0n) throw new Error("Expected non-negative bigint");
  return `0x${value.toString(16)}`;
}

export function u256FromBigInt(value: bigint): U256Parts {
  if (value < 0n) throw new Error("Expected non-negative bigint");
  const low = value & MASK_128;
  const high = value >> 128n;
  return { low: toHex(low), high: toHex(high) };
}

export function bigIntFromU256(lowHex: string, highHex: string): bigint {
  const low = BigInt(lowHex);
  const high = BigInt(highHex);
  return low + (high << 128n);
}

