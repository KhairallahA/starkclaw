import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/storage/secure-store", () => ({
  secureGet: vi.fn(),
  secureSet: vi.fn(),
  secureDelete: vi.fn(),
}));

import { secureGet } from "@/lib/storage/secure-store";

import {
  SignerRuntimeConfigError,
  getSignerMode,
  loadRemoteSignerRuntimeConfig,
} from "../runtime-config";

const secureGetMock = vi.mocked(secureGet);
const originalEnv = process.env;

function resetEnv() {
  process.env = {
    ...originalEnv,
    NODE_ENV: "test",
  };
  delete process.env.EXPO_PUBLIC_SIGNER_MODE;
  delete process.env.EXPO_PUBLIC_SISNA_PROXY_URL;
  delete process.env.EXPO_PUBLIC_SISNA_MTLS_REQUIRED;
  delete process.env.EXPO_PUBLIC_SISNA_REQUEST_TIMEOUT_MS;
  delete process.env.EXPO_PUBLIC_SISNA_REQUESTER;
}

describe("runtime-config", () => {
  beforeEach(() => {
    resetEnv();
    secureGetMock.mockReset();
  });

  it("defaults signer mode to local", () => {
    expect(getSignerMode()).toBe("local");
  });

  it("returns remote signer mode when explicitly configured", () => {
    process.env.EXPO_PUBLIC_SIGNER_MODE = "remote";
    expect(getSignerMode()).toBe("remote");
  });

  it("fails remote mode when proxy url is missing", async () => {
    await expect(loadRemoteSignerRuntimeConfig()).rejects.toMatchObject({
      name: "SignerRuntimeConfigError",
      code: "MISSING_PROXY_URL",
    } satisfies Partial<SignerRuntimeConfigError>);
  });

  it("rejects non-https non-loopback transport", async () => {
    process.env.EXPO_PUBLIC_SISNA_PROXY_URL = "http://signer.internal:8545";
    secureGetMock.mockResolvedValue(
      JSON.stringify({
        clientId: "mobile-client",
        hmacSecret: "super-secret",
      })
    );

    await expect(loadRemoteSignerRuntimeConfig()).rejects.toMatchObject({
      code: "INSECURE_TRANSPORT",
    } satisfies Partial<SignerRuntimeConfigError>);
  });

  it("requires mtls marker in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.EXPO_PUBLIC_SISNA_PROXY_URL = "https://signer.internal:8545";
    process.env.EXPO_PUBLIC_SISNA_MTLS_REQUIRED = "false";
    secureGetMock.mockResolvedValue(
      JSON.stringify({
        clientId: "mobile-client",
        hmacSecret: "super-secret",
      })
    );

    await expect(loadRemoteSignerRuntimeConfig()).rejects.toMatchObject({
      code: "MTLS_REQUIRED",
    } satisfies Partial<SignerRuntimeConfigError>);
  });

  it("loads validated remote config with secure-store credentials", async () => {
    process.env.EXPO_PUBLIC_SISNA_PROXY_URL = "https://signer.internal:8545";
    process.env.EXPO_PUBLIC_SISNA_MTLS_REQUIRED = "true";
    process.env.EXPO_PUBLIC_SISNA_REQUEST_TIMEOUT_MS = "9000";
    process.env.EXPO_PUBLIC_SISNA_REQUESTER = "starkclaw-tests";
    secureGetMock.mockResolvedValue(
      JSON.stringify({
        clientId: "mobile-client",
        hmacSecret: "super-secret",
        keyId: "ops",
      })
    );

    await expect(loadRemoteSignerRuntimeConfig()).resolves.toEqual({
      proxyUrl: "https://signer.internal:8545/",
      clientId: "mobile-client",
      hmacSecret: "super-secret",
      keyId: "ops",
      requestTimeoutMs: 9000,
      requester: "starkclaw-tests",
      mtlsRequired: true,
    });
  });
});
