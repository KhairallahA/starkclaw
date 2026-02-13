import * as Haptics from "expo-haptics";

export async function haptic(kind: "tap" | "success" | "warn" | "error" = "tap") {
  try {
    if (kind === "tap") {
      await Haptics.selectionAsync();
      return;
    }
    if (kind === "success") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    if (kind === "warn") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Best-effort.
  }
}

