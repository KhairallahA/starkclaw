import * as React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useAppTheme } from "./app-theme";

export function AppBackground(props: { children: React.ReactNode }) {
  const t = useAppTheme();
  const dark = t.scheme === "dark";

  const gradient = dark
    ? (["#04060A", "#06121E", "#071C2A", "#04060A"] as const)
    : (["#FFFFFF", "#F4F7FF", "#ECFAFF", "#FFFFFF"] as const);

  const blobA = dark ? "rgba(106,228,215,0.22)" : "rgba(14,142,166,0.16)";
  const blobB = dark ? "rgba(90,169,255,0.20)" : "rgba(36,87,255,0.12)";
  const blobC = dark ? "rgba(255,159,10,0.10)" : "rgba(255,159,10,0.08)";

  const driftA = useSharedValue(0);
  const driftB = useSharedValue(0);
  const driftC = useSharedValue(0);

  React.useEffect(() => {
    driftA.value = withRepeat(
      withTiming(1, { duration: 18_000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    driftB.value = withRepeat(
      withTiming(1, { duration: 22_000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    driftC.value = withRepeat(
      withTiming(1, { duration: 26_000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [driftA, driftB, driftC]);

  const blobAStyle = useAnimatedStyle(() => {
    const dx = interpolate(driftA.value, [0, 1], [-10, 14]);
    const dy = interpolate(driftA.value, [0, 1], [-6, 10]);
    return { transform: [{ translateX: dx }, { translateY: dy }, { rotate: "16deg" }] };
  });

  const blobBStyle = useAnimatedStyle(() => {
    const dx = interpolate(driftB.value, [0, 1], [16, -10]);
    const dy = interpolate(driftB.value, [0, 1], [-12, 16]);
    return { transform: [{ translateX: dx }, { translateY: dy }, { rotate: "22deg" }] };
  });

  const blobCStyle = useAnimatedStyle(() => {
    const dx = interpolate(driftC.value, [0, 1], [-14, 10]);
    const dy = interpolate(driftC.value, [0, 1], [18, -10]);
    return { transform: [{ translateX: dx }, { translateY: dy }, { rotate: "12deg" }] };
  });

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg0 }}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      <Animated.View
        pointerEvents="none"
        style={[styles.blob, blobAStyle, { top: -140, left: -90, width: 340, height: 340, backgroundColor: blobA }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.blob, blobBStyle, { top: 110, right: -150, width: 440, height: 440, backgroundColor: blobB }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.blob, blobCStyle, { bottom: -220, left: -140, width: 560, height: 560, backgroundColor: blobC }]}
      />

      <LinearGradient
        pointerEvents="none"
        colors={
          dark ? (["rgba(255,255,255,0.04)", "rgba(255,255,255,0.00)"] as const) : (["rgba(8,18,32,0.03)", "rgba(8,18,32,0.00)"] as const)
        }
        start={{ x: 0.5, y: 0.0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={
          dark ? (["rgba(0,0,0,0.00)", "rgba(0,0,0,0.55)"] as const) : (["rgba(255,255,255,0.00)", "rgba(8,18,32,0.06)"] as const)
        }
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: "absolute",
    borderRadius: 999,
  },
});
