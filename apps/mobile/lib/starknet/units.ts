export function parseUnits(input: string, decimals: number): bigint {
  const s = input.trim();
  if (decimals < 0) throw new Error("Invalid decimals");

  const match = s.match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) throw new Error("Invalid number");

  const whole = match[1];
  const fracRaw = match[2] ?? "";

  if (fracRaw.length > decimals) {
    throw new Error(`Too many decimal places (max ${decimals})`);
  }

  const base = 10n ** BigInt(decimals);
  const frac = fracRaw.padEnd(decimals, "0");
  const fracValue = frac.length ? BigInt(frac) : 0n;

  return BigInt(whole) * base + fracValue;
}

