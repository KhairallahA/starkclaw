import { hash } from "starknet";

import { callContract } from "./rpc";
import { bigIntFromU256 } from "./u256";

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

  return bigIntFromU256(result[0], result[1]);
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
