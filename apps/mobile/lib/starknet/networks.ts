export type StarknetNetworkId = "sepolia" | "mainnet";

export type StarknetNetworkConfig = {
  id: StarknetNetworkId;
  name: string;
  rpcUrl: string;
  chainIdHex: string;
};

// Public RPC endpoints (no API key) via Lava.
export const STARKNET_NETWORKS: Record<StarknetNetworkId, StarknetNetworkConfig> =
  {
    sepolia: {
      id: "sepolia",
      name: "Sepolia",
      rpcUrl: "https://rpc.starknet-testnet.lava.build/rpc/v0_9",
      chainIdHex: "0x534e5f5345504f4c4941", // SN_SEPOLIA
    },
    mainnet: {
      id: "mainnet",
      name: "Mainnet",
      rpcUrl: "https://rpc.starknet.lava.build/rpc/v0_9",
      chainIdHex: "0x534e5f4d41494e", // SN_MAIN
    },
  };

