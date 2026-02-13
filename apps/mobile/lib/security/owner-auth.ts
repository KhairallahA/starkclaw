import * as LocalAuthentication from "expo-local-authentication";

export class OwnerAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OwnerAuthError";
  }
}

export async function requireOwnerAuth(opts?: { reason?: string }): Promise<void> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  // In simulator / unsupported devices, don't hard-block MVP flows.
  if (!hasHardware || !isEnrolled) return;

  const res = await LocalAuthentication.authenticateAsync({
    promptMessage: opts?.reason ?? "Confirm owner action",
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
  });

  if (!res.success) {
    throw new OwnerAuthError(res.error ?? "Owner authentication failed");
  }
}

