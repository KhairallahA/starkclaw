import * as React from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useDemo } from "@/lib/demo/demo-store";
import { PrimaryButton } from "@/ui/buttons";
import { GlassCard } from "@/ui/glass-card";
import { haptic } from "@/ui/haptics";
import { useAppTheme } from "@/ui/app-theme";
import { AppBackground } from "@/ui/app-background";
import { Body, Display, H2, Muted } from "@/ui/typography";

export default function WelcomeScreen() {
  const t = useAppTheme();
  const router = useRouter();
  const { actions } = useDemo();

  const onReset = React.useCallback(async () => {
    await haptic("warn");
    actions.reset();
  }, [actions]);

  return (
    <AppBackground>
      <View style={{ flex: 1, paddingHorizontal: 18, paddingTop: 42, paddingBottom: 28, justifyContent: "space-between", gap: 16 }}>
        <View style={{ gap: 14 }}>
          <Animated.View entering={FadeInDown.duration(500)}>
            <View style={{ alignSelf: "flex-start", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: t.colors.glassBorder, backgroundColor: t.scheme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)" }}>
              <Muted style={{ color: t.colors.muted }}>Demo mode • UI-only</Muted>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60).duration(520)} style={{ gap: 10 }}>
            <Display>Starkclaw</Display>
            <Body style={{ color: t.colors.muted }}>
              A calm, policy-first wallet where an agent can trade and spend, but only within your rules.
            </Body>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(520)} style={{ gap: 12 }}>
            <GlassCard padding={14}>
              <View style={{ gap: 10 }}>
                <H2>What you’ll see</H2>
                <View style={{ gap: 8 }}>
                  <RowLine title="Onboarding" body="Set limits, turn on alerts, and “create” your agent account." />
                  <RowLine title="Trading simulator" body="Preview swaps with policy checks and clean confirmations." />
                  <RowLine title="Policies" body="Spend caps, allowlists, contract trust settings, emergency lockdown." />
                  <RowLine title="Agent inbox" body="Proposals you can approve or reject with full context." />
                </View>
              </View>
            </GlassCard>

            <GlassCard padding={14} intensity={t.scheme === "dark" ? 16 : 50}>
              <View style={{ gap: 8 }}>
                <H2>Zero network calls</H2>
                <Body style={{ color: t.colors.muted }}>
                  Everything is mocked so the UX can be reviewed end-to-end without wallets, RPCs, or contracts.
                </Body>
              </View>
            </GlassCard>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(220).duration(520)} style={{ gap: 10 }}>
          <PrimaryButton
            label="Get started"
            onPress={async () => {
              await haptic("tap");
              router.push("/(onboarding)/profile");
            }}
          />

          <Pressable
            onPress={onReset}
            style={({ pressed }) => ({
              paddingVertical: 12,
              borderRadius: 16,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Body style={{ textAlign: "center", color: t.colors.muted }}>Reset demo state</Body>
          </Pressable>
        </Animated.View>
      </View>
    </AppBackground>
  );
}

function RowLine(props: { title: string; body: string }) {
  const t = useAppTheme();
  return (
    <View style={{ gap: 2 }}>
      <Body style={{ fontFamily: t.font.bodySemibold }}>{props.title}</Body>
      <Muted>{props.body}</Muted>
    </View>
  );
}

