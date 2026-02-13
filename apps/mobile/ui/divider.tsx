import * as React from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAppTheme } from "./app-theme";

export function Divider(props: { style?: StyleProp<ViewStyle> }) {
  const t = useAppTheme();
  const a = t.scheme === "dark" ? "rgba(255,255,255,0.00)" : "rgba(8,18,32,0.00)";
  const b = t.scheme === "dark" ? "rgba(255,255,255,0.18)" : "rgba(8,18,32,0.10)";
  return (
    <LinearGradient
      colors={[a, b, a]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[{ height: 1, borderRadius: 999 }, props.style]}
    />
  );
}

