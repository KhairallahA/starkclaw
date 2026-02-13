import * as React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAppTheme } from "./app-theme";

export function AppBackground(props: { children: React.ReactNode }) {
  const t = useAppTheme();
  const dark = t.scheme === "dark";

  const gradient = dark
    ? (["#05070A", "#061622", "#071B2A", "#05070A"] as const)
    : (["#FFFFFF", "#F1F5FF", "#EAF7FF", "#FFFFFF"] as const);

  const blobA = dark ? "rgba(106,228,215,0.22)" : "rgba(14,142,166,0.16)";
  const blobB = dark ? "rgba(90,169,255,0.20)" : "rgba(36,87,255,0.12)";
  const blobC = dark ? "rgba(255,159,10,0.10)" : "rgba(255,159,10,0.08)";

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg0 }}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      <View pointerEvents="none" style={[styles.blob, { top: -140, left: -90, width: 320, height: 320, backgroundColor: blobA }]} />
      <View pointerEvents="none" style={[styles.blob, { top: 120, right: -140, width: 420, height: 420, backgroundColor: blobB }]} />
      <View pointerEvents="none" style={[styles.blob, { bottom: -210, left: -120, width: 520, height: 520, backgroundColor: blobC }]} />

      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: "absolute",
    borderRadius: 999,
    transform: [{ rotate: "18deg" }],
  },
});
