import * as React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAppTheme } from "./app-theme";
import { Body } from "./typography";

type Tone = "neutral" | "accent" | "good" | "warn" | "danger";

export function Badge(props: {
  label: string;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
  left?: React.ReactNode;
}) {
  const t = useAppTheme();
  const tone = props.tone ?? "neutral";

  const fill =
    tone === "good"
      ? "rgba(48,209,88,0.12)"
      : tone === "warn"
        ? "rgba(255,159,10,0.12)"
        : tone === "danger"
          ? "rgba(255,69,58,0.12)"
          : tone === "accent"
            ? t.scheme === "dark"
              ? "rgba(90,169,255,0.14)"
              : "rgba(36,87,255,0.12)"
            : t.scheme === "dark"
              ? "rgba(255,255,255,0.06)"
              : "rgba(255,255,255,0.60)";

  const borderA =
    tone === "good"
      ? "rgba(48,209,88,0.40)"
      : tone === "warn"
        ? "rgba(255,159,10,0.40)"
        : tone === "danger"
          ? "rgba(255,69,58,0.40)"
          : tone === "accent"
            ? "rgba(90,169,255,0.38)"
            : t.scheme === "dark"
              ? "rgba(255,255,255,0.22)"
              : "rgba(255,255,255,0.92)";

  const borderB = t.scheme === "dark" ? "rgba(255,255,255,0.10)" : "rgba(8,18,32,0.10)";

  const text =
    tone === "good" ? t.colors.good : tone === "warn" ? t.colors.warn : tone === "danger" ? t.colors.bad : t.colors.text;

  return (
    <LinearGradient
      colors={[borderA, borderB]}
      start={{ x: 0.1, y: 0.0 }}
      end={{ x: 0.9, y: 1 }}
      style={[{ borderRadius: 999, borderCurve: "continuous", padding: 1 }, props.style]}
    >
      <View
        style={{
          borderRadius: 999,
          borderCurve: "continuous",
          paddingVertical: 6,
          paddingHorizontal: 10,
          backgroundColor: fill,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        {props.left ? props.left : null}
        <Body
          style={{
            fontFamily: t.font.bodyMedium,
            fontSize: 12,
            lineHeight: 16,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: text,
          }}
        >
          {props.label}
        </Body>
      </View>
    </LinearGradient>
  );
}

