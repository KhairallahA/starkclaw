import * as React from "react";
import { Text, type TextProps } from "react-native";

import { useAppTheme } from "./app-theme";

export function Display(props: TextProps) {
  const t = useAppTheme();
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: t.font.display,
          fontSize: 40,
          lineHeight: 48,
          letterSpacing: -0.2,
          color: t.colors.text,
          includeFontPadding: false,
        },
        props.style,
      ]}
    />
  );
}

export function H1(props: TextProps) {
  const t = useAppTheme();
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: t.font.bodySemibold,
          fontSize: 24,
          lineHeight: 30,
          letterSpacing: -0.2,
          color: t.colors.text,
          includeFontPadding: false,
        },
        props.style,
      ]}
    />
  );
}

export function H2(props: TextProps) {
  const t = useAppTheme();
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: t.font.bodySemibold,
          fontSize: 18,
          lineHeight: 24,
          letterSpacing: -0.1,
          color: t.colors.text,
          includeFontPadding: false,
        },
        props.style,
      ]}
    />
  );
}

export function Body(props: TextProps) {
  const t = useAppTheme();
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: t.font.body,
          fontSize: 15,
          lineHeight: 21,
          color: t.colors.text,
          includeFontPadding: false,
        },
        props.style,
      ]}
    />
  );
}

export function Metric(props: TextProps) {
  const t = useAppTheme();
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: t.font.bodySemibold,
          fontSize: 32,
          lineHeight: 38,
          letterSpacing: -0.4,
          fontVariant: ["tabular-nums"],
          color: t.colors.text,
          includeFontPadding: false,
        },
        props.style,
      ]}
    />
  );
}

export function Muted(props: TextProps) {
  const t = useAppTheme();
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: t.font.body,
          fontSize: 13,
          lineHeight: 18,
          color: t.colors.muted,
          includeFontPadding: false,
        },
        props.style,
      ]}
    />
  );
}

export function Mono(props: TextProps) {
  const t = useAppTheme();
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: t.font.mono,
          fontSize: 12,
          lineHeight: 16,
          color: t.colors.muted,
          includeFontPadding: false,
        },
        props.style,
      ]}
    />
  );
}
