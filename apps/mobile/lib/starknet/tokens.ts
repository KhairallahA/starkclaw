export type StarknetToken = {
  symbol: "ETH" | "STRK";
  name: string;
  address: string;
  decimals: number;
};

// Canonical token addresses are stable across Starknet networks for core assets.
export const TOKENS: StarknetToken[] = [
  {
    symbol: "ETH",
    name: "Ether",
    address:
      "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    decimals: 18,
  },
  {
    symbol: "STRK",
    name: "Starknet Token",
    address:
      "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    decimals: 18,
  },
];

