import type { StarknetNetworkId } from "./networks";

export type StarknetTokenSymbol = "ETH" | "STRK" | "USDC";

export type StarknetToken = {
  symbol: StarknetTokenSymbol;
  name: string;
  decimals: number;
  addressByNetwork: Record<StarknetNetworkId, string>;
};

// Core asset addresses are stable across networks (ETH, STRK). Stablecoins are not.
export const TOKENS: StarknetToken[] = [
  {
    symbol: "ETH",
    name: "Ether",
    decimals: 18,
    addressByNetwork: {
      sepolia: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
      mainnet: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    },
  },
  {
    symbol: "STRK",
    name: "Starknet Token",
    decimals: 18,
    addressByNetwork: {
      sepolia: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
      mainnet: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    },
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    addressByNetwork: {
      // Circle native USDC on Starknet Sepolia.
      sepolia: "0x0512feac6339ff7889822cb5aa2a86c848e9d392bb0e3e237c008674feed8343",
      // Circle native USDC on Starknet Mainnet.
      mainnet: "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb",
    },
  },
];
