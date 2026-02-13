import * as React from "react";
import { ScrollView } from "react-native";

import { Text, View } from "@/components/Themed";

export default function AgentScreen() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      <View style={{ padding: 20, gap: 10 }}>
        <Text style={{ fontSize: 24, fontWeight: "700" }}>Agent</Text>
        <Text style={{ opacity: 0.7 }}>
          Next: chat UI + tool runtime that can only act through session keys.
        </Text>
      </View>
    </ScrollView>
  );
}
