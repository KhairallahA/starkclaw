import * as React from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAppTheme } from "./app-theme";
import { Body } from "./typography";

type Tone = "neutral" | "accent" | "good" | "warn" | "danger";

export function Chip(props: {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useAppTheme();
  const selected = !!props.selected;
  const tone = props.tone ?? "neutral";

  const fill =
    selected && tone === "danger"
      ? "rgba(255,69,58,0.12)"
      : selected && tone === "warn"
        ? "rgba(255,159,10,0.12)"
        : selected && tone === "good"
          ? "rgba(48,209,88,0.12)"
          : selected && tone === "accent"
            ? t.scheme === "dark"
              ? "rgba(90,169,255,0.14)"
              : "rgba(36,87,255,0.12)"
            : t.scheme === "dark"
              ? "rgba(255,255,255,0.05)"
              : "rgba(255,255,255,0.60)";

  const borderA =
    selected && tone === "danger"
      ? "rgba(255,69,58,0.40)"
      : selected && tone === "warn"
        ? "rgba(255,159,10,0.40)"
        : selected && tone === "good"
          ? "rgba(48,209,88,0.40)"
          : selected && tone === "accent"
            ? "rgba(90,169,255,0.38)"
            : t.scheme === "dark"
              ? "rgba(255,255,255,0.20)"
              : "rgba(255,255,255,0.92)";

  const borderB = t.scheme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(8,18,32,0.10)";

  const content = (
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
          paddingVertical: 9,
          paddingHorizontal: 12,
          backgroundColor: fill,
        }}
      >
        <Body style={{ fontFamily: t.font.bodyMedium, fontSize: 13, lineHeight: 17 }}>{props.label}</Body>
      </View>
    </LinearGradient>
  );

  if (!props.onPress) return content;

  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {content}
    </Pressable>
  );
}

