import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/wallet/wallet", () => ({
  loadWallet: vi.fn(),
}));

vi.mock("@/lib/agent/transfer", () => ({
  prepareTransferFromText: vi.fn(),
  executeTransfer: vi.fn(),
}));

vi.mock("@/lib/starknet/balances", () => ({
  getErc20Balance: vi.fn(),
}));

import { executeTransfer, prepareTransferFromText } from "@/lib/agent/transfer";
import { getErc20Balance } from "@/lib/starknet/balances";
import { loadWallet } from "@/lib/wallet/wallet";

import {
  executeTransferTool,
  getBalancesTool,
  prepareTransferTool,
} from "../core-tools";

const loadWalletMock = vi.mocked(loadWallet);
const prepareTransferFromTextMock = vi.mocked(prepareTransferFromText);
const executeTransferMock = vi.mocked(executeTransfer);
const getErc20BalanceMock = vi.mocked(getErc20Balance);

describe("core-tools runtime wiring", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns error when wallet is missing for execute_transfer", async () => {
    loadWalletMock.mockResolvedValue(null);

    const result = await executeTransferTool.handler({
      network: "sepolia",
      tokenSymbol: "USDC",
      amount: "1",
      to: "0x123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Wallet not initialized");
    }
  });

  it("executes transfer and returns signer correlation fields", async () => {
    loadWalletMock.mockResolvedValue({
      networkId: "sepolia",
      rpcUrl: "https://rpc.example",
      chainIdHex: "0x534e5f5345504f4c4941",
      ownerPublicKey: "0xaaa",
      accountAddress: "0xabc",
    });
    prepareTransferFromTextMock.mockResolvedValue({
      kind: "erc20_transfer",
      tokenSymbol: "USDC",
      tokenAddress: "0xusdc",
      to: "0x123",
      amount: "1",
      amountBaseUnits: "1000000",
      balanceBaseUnits: "2000000",
      calldata: ["0x123", "0xf4240", "0x0"],
      sessionPublicKey: "0xsession",
      warnings: [],
      policy: {
        spendingLimitBaseUnits: "5000000",
        validUntil: Math.floor(Date.now() / 1000) + 3600,
      },
    });
    executeTransferMock.mockResolvedValue({
      txHash: "0xtx",
      executionStatus: "SUCCEEDED",
      revertReason: null,
      signerMode: "remote",
      signerRequestId: "req-123",
      mobileActionId: "mobile_action_1",
    });

    const result = await executeTransferTool.handler({
      network: "sepolia",
      tokenSymbol: "USDC",
      amount: "1",
      to: "0x123",
      mobileActionId: "mobile_action_1",
    });

    expect(result.ok).toBe(true);
    expect(prepareTransferFromTextMock).toHaveBeenCalledTimes(1);
    expect(executeTransferMock).toHaveBeenCalledTimes(1);
    if (result.ok) {
      expect(result.data).toMatchObject({
        txHash: "0xtx",
        signerMode: "remote",
        signerRequestId: "req-123",
        mobileActionId: "mobile_action_1",
      });
    }
  });

  it("returns network mismatch error for get_balances", async () => {
    loadWalletMock.mockResolvedValue({
      networkId: "sepolia",
      rpcUrl: "https://rpc.example",
      chainIdHex: "0x534e5f5345504f4c4941",
      ownerPublicKey: "0xaaa",
      accountAddress: "0xabc",
    });

    const result = await getBalancesTool.handler({ network: "mainnet" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Wallet network mismatch");
    }
  });

  it("loads balances through getErc20Balance", async () => {
    loadWalletMock.mockResolvedValue({
      networkId: "sepolia",
      rpcUrl: "https://rpc.example",
      chainIdHex: "0x534e5f5345504f4c4941",
      ownerPublicKey: "0xaaa",
      accountAddress: "0xabc",
    });
    getErc20BalanceMock.mockResolvedValue(123n);

    const result = await getBalancesTool.handler({ network: "sepolia" });
    expect(result.ok).toBe(true);
    expect(getErc20BalanceMock).toHaveBeenCalled();
    if (result.ok) {
      expect(result.data).toMatchObject({
        network: "sepolia",
        accountAddress: "0xabc",
      });
    }
  });

  it("prepare_transfer delegates to transfer preparation", async () => {
    loadWalletMock.mockResolvedValue({
      networkId: "sepolia",
      rpcUrl: "https://rpc.example",
      chainIdHex: "0x534e5f5345504f4c4941",
      ownerPublicKey: "0xaaa",
      accountAddress: "0xabc",
    });
    prepareTransferFromTextMock.mockResolvedValue({
      kind: "erc20_transfer",
      tokenSymbol: "USDC",
      tokenAddress: "0xusdc",
      to: "0x123",
      amount: "1",
      amountBaseUnits: "1000000",
      balanceBaseUnits: "2000000",
      calldata: ["0x123", "0xf4240", "0x0"],
      sessionPublicKey: "0xsession",
      warnings: [],
      policy: {
        spendingLimitBaseUnits: "5000000",
        validUntil: Math.floor(Date.now() / 1000) + 3600,
      },
    });

    const result = await prepareTransferTool.handler({
      network: "sepolia",
      tokenSymbol: "USDC",
      amount: "1",
      to: "0x123",
    });

    expect(result.ok).toBe(true);
    expect(prepareTransferFromTextMock).toHaveBeenCalledTimes(1);
  });
});
