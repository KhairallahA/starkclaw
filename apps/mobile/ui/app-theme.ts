import { DarkTheme, DefaultTheme, type Theme } from "@react-navigation/native";
import { useColorScheme } from "@/components/useColorScheme";

export type AppColorScheme = "light" | "dark";

export type AppTheme = {
  scheme: AppColorScheme;
  colors: {
    bg0: string;
    bg1: string;
    glassFill: string;
    glassBorder: string;
    text: string;
    muted: string;
    faint: string;
    accent: string;
    accent2: string;
    good: string;
    warn: string;
    bad: string;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  shadow: {
    card: string;
    lift: string;
  };
  font: {
    display: string;
    body: string;
    bodyMedium: string;
    bodySemibold: string;
    mono: string;
  };
};

export function useAppTheme(): AppTheme {
  const scheme = (useColorScheme() ?? "dark") as AppColorScheme;

  if (scheme === "light") {
    return {
      scheme,
      colors: {
        bg0: "#F4F6FB",
        bg1: "#FFFFFF",
        glassFill: "rgba(255,255,255,0.66)",
        glassBorder: "rgba(8,18,32,0.10)",
        text: "#0B1220",
        muted: "rgba(11,18,32,0.72)",
        faint: "rgba(11,18,32,0.12)",
        accent: "#0E8EA6",
        accent2: "#2457FF",
        good: "#248A3D",
        warn: "#B25000",
        bad: "#D70015",
      },
      radius: { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 },
      shadow: {
        card: "0 16px 40px rgba(8,18,32,0.14)",
        lift: "0 22px 60px rgba(8,18,32,0.16)",
      },
      font: {
        display: "InstrumentSerif_400Regular",
        body: "InstrumentSans_400Regular",
        bodyMedium: "InstrumentSans_500Medium",
        bodySemibold: "InstrumentSans_600SemiBold",
        mono: "SpaceMono",
      },
    };
  }

  return {
    scheme,
    colors: {
      bg0: "#05070A",
      bg1: "#07121B",
      glassFill: "rgba(9,12,16,0.40)",
      glassBorder: "rgba(255,255,255,0.14)",
      text: "#EAF0F6",
      muted: "rgba(234,240,246,0.74)",
      faint: "rgba(234,240,246,0.12)",
      accent: "#6AE4D7",
      accent2: "#5AA9FF",
      good: "#30D158",
      warn: "#FF9F0A",
      bad: "#FF453A",
    },
    radius: { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 },
    shadow: {
      card: "0 22px 70px rgba(0,0,0,0.55)",
      lift: "0 30px 90px rgba(0,0,0,0.60)",
    },
    font: {
      display: "InstrumentSerif_400Regular",
      body: "InstrumentSans_400Regular",
      bodyMedium: "InstrumentSans_500Medium",
      bodySemibold: "InstrumentSans_600SemiBold",
      mono: "SpaceMono",
    },
  };
}

export function navThemeFromAppTheme(t: AppTheme): Theme {
  const base = t.scheme === "dark" ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: t.colors.accent2,
      background: t.colors.bg0,
      card: t.colors.bg1,
      text: t.colors.text,
      border: t.colors.glassBorder,
      notification: t.colors.accent,
    },
  };
}

