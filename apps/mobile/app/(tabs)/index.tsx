import * as React from "react";
import { ActivityIndicator, Pressable, ScrollView } from "react-native";

import { Text, View } from "@/components/Themed";
import { formatUnits, getErc20Balance } from "@/lib/starknet/balances";
import { getChainId } from "@/lib/starknet/rpc";
import { TOKENS } from "@/lib/starknet/tokens";
import { createWallet, loadWallet, resetWallet, type WalletSnapshot } from "@/lib/wallet/wallet";

type BalanceRow = {
  symbol: string;
  display: string;
};

export default function TabOneScreen() {
  const [wallet, setWallet] = React.useState<WalletSnapshot | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [rpcChainId, setRpcChainId] = React.useState<string | null>(null);
  const [balances, setBalances] = React.useState<BalanceRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async (w: WalletSnapshot) => {
    setError(null);
    setBalances(null);

    const chainId = await getChainId(w.rpcUrl);
    setRpcChainId(chainId);

    const rows: BalanceRow[] = [];
    for (const t of TOKENS) {
      const raw = await getErc20Balance(w.rpcUrl, t.address, w.accountAddress);
      rows.push({ symbol: t.symbol, display: formatUnits(raw, t.decimals) });
    }
    setBalances(rows);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setBusy(true);
      try {
        const w = await loadWallet();
        if (cancelled) return;
        setWallet(w);
        if (w) await refresh(w);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const onCreate = React.useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const w = await createWallet("sepolia");
      setWallet(w);
      await refresh(w);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const onReset = React.useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await resetWallet();
      setWallet(null);
      setRpcChainId(null);
      setBalances(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View style={{ padding: 20, gap: 16 }}>
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 28, fontWeight: "700" }}>Starkclaw</Text>
          <Text style={{ opacity: 0.7 }}>
            Your agent wallet address is deterministic. Fund it, then deploy the account.
          </Text>
        </View>

        {error ? (
          <Text selectable style={{ color: "#ff3b30" }}>
            {error}
          </Text>
        ) : null}

        {wallet ? (
          <View style={{ gap: 12 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 13, opacity: 0.7 }}>Network</Text>
              <Text selectable style={{ fontSize: 16, fontWeight: "600" }}>
                {wallet.networkId} (expected chainId {wallet.chainIdHex})
              </Text>
              {rpcChainId ? (
                <Text selectable style={{ fontSize: 12, opacity: 0.7 }}>
                  RPC chainId: {rpcChainId}
                </Text>
              ) : null}
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 13, opacity: 0.7 }}>Account Address</Text>
              <Text selectable style={{ fontSize: 14 }}>
                {wallet.accountAddress}
              </Text>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 13, opacity: 0.7 }}>Owner Public Key</Text>
              <Text selectable style={{ fontSize: 14 }}>
                {wallet.ownerPublicKey}
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 13, opacity: 0.7 }}>Balances</Text>
              {balances ? (
                <View style={{ gap: 6 }}>
                  {balances.map((b) => (
                    <View
                      key={b.symbol}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: "600" }}>{b.symbol}</Text>
                      <Text selectable style={{ fontSize: 16, fontVariant: ["tabular-nums"] }}>
                        {b.display}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ opacity: 0.7 }}>Fetching...</Text>
              )}
            </View>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                disabled={busy}
                onPress={() => wallet && refresh(wallet)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.12)",
                  backgroundColor: "rgba(0,0,0,0.04)",
                }}
              >
                <Text style={{ textAlign: "center", fontWeight: "600" }}>Refresh</Text>
              </Pressable>

              <Pressable
                disabled={busy}
                onPress={onReset}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "rgba(255,59,48,0.35)",
                  backgroundColor: "rgba(255,59,48,0.08)",
                }}
              >
                <Text style={{ textAlign: "center", fontWeight: "600", color: "#ff3b30" }}>
                  Reset
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            disabled={busy}
            onPress={onCreate}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderRadius: 16,
              backgroundColor: "#111",
              boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
            }}
          >
            <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
              Create Wallet
            </Text>
          </Pressable>
        )}

        {busy ? <ActivityIndicator /> : null}
      </View>
    </ScrollView>
  );
}
