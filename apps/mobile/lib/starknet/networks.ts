export type StarknetNetworkId = "sepolia" | "mainnet";

export type StarknetNetworkConfig = {
  id: StarknetNetworkId;
  name: string;
  rpcUrl: string;
  chainIdHex: string;
};

// Public RPC endpoints (no API key) via publicnode.
export const STARKNET_NETWORKS: Record<StarknetNetworkId, StarknetNetworkConfig> =
  {
    sepolia: {
      id: "sepolia",
      name: "Sepolia",
      rpcUrl: "https://starknet-sepolia-rpc.publicnode.com",
      chainIdHex: "0x534e5f5345504f4c4941", // SN_SEPOLIA
    },
    mainnet: {
      id: "mainnet",
      name: "Mainnet",
      rpcUrl: "https://starknet-rpc.publicnode.com",
      chainIdHex: "0x534e5f4d41494e", // SN_MAIN
    },
  };
