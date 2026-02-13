import * as React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Image } from "expo-image";

type FaName = React.ComponentProps<typeof FontAwesome>["name"];

export function AppIcon(props: {
  ios: string;
  fa?: FaName;
  color: string;
  size: number;
  style?: any;
}) {
  const os = process.env.EXPO_OS;
  if (os === "ios") {
    return (
      <Image
        source={`sf:${props.ios}`}
        style={[{ width: props.size, height: props.size, tintColor: props.color }, props.style]}
        contentFit="contain"
      />
    );
  }

  if (props.fa) {
    return <FontAwesome name={props.fa} size={props.size} color={props.color} style={props.style} />;
  }

  return (
    <Image
      source={`sf:${props.ios}`}
      style={[{ width: props.size, height: props.size, tintColor: props.color }, props.style]}
      contentFit="contain"
    />
  );
}

