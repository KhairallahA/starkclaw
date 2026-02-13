import { hash } from "starknet";

import { callContract } from "./rpc";

function u256ToBigInt(lowHex: string, highHex: string): bigint {
  const low = BigInt(lowHex);
  const high = BigInt(highHex);
  return low + (high << 128n);
}

export async function getErc20Balance(
  rpcUrl: string,
  tokenAddress: string,
  accountAddress: string
): Promise<bigint> {
  const selector = hash.getSelectorFromName("balanceOf");

  const result = await callContract(rpcUrl, {
    contract_address: tokenAddress,
    entry_point_selector: selector,
    calldata: [accountAddress],
  });

  if (result.length < 2) {
    throw new Error("Unexpected balanceOf result shape");
  }

  return u256ToBigInt(result[0], result[1]);
}

export function formatUnits(value: bigint, decimals: number): string {
  if (decimals <= 0) return value.toString();

  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = value % base;

  if (fraction === 0n) return whole.toString();

  const fractionStr = fraction.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole.toString()}.${fractionStr}`;
}

