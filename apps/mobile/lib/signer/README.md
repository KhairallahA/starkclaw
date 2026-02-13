# SISNA Signer Client

**Issue:** #54
**Status:** Groundwork + runtime execution wiring

## Overview

Typed HTTP client for remote session transaction signing via SISNA (Starknet Independent Session Network Architecture).

This folder now has two layers:

- `client.ts`: generic typed HTTP client + error mapping (groundwork).
- `keyring-proxy-signer.ts`: Starknet `SignerInterface` implementation that signs through SISNA keyring proxy with HMAC headers.
- `runtime-config.ts`: remote/local mode config loader with production transport guards.

Execution wiring uses `keyring-proxy-signer.ts` in remote mode.

## Module Contract

### Request Flow

```
App → createSignerClient(config) → client.signSessionTransaction(request) → Remote Signer
```

### Response/Error Flow

```
Remote Signer → 200 + signature → SignSessionTransactionResponse
             → 4xx/5xx → mapHttpErrorToSignerError → SignerClientError
             → network timeout → mapNetworkErrorToSignerError → SignerClientError
```

## Runtime Usage

```typescript
import { getSignerMode, loadRemoteSignerRuntimeConfig } from "@/lib/signer/runtime-config";
import { KeyringProxySigner } from "@/lib/signer/keyring-proxy-signer";

if (getSignerMode() === "remote") {
  const cfg = await loadRemoteSignerRuntimeConfig();

  const signer = new KeyringProxySigner({
    proxyUrl: cfg.proxyUrl,
    accountAddress: "0x...",
    clientId: cfg.clientId,
    hmacSecret: cfg.hmacSecret,
    requestTimeoutMs: cfg.requestTimeoutMs,
    validUntil: 1735689600,
    keyId: cfg.keyId,
    requester: cfg.requester,
    tool: "execute_transfer",
    mobileActionId: "mobile_action_123",
  });
}
```

## Legacy Groundwork Usage

```typescript
import { createSignerClient } from '@/lib/signer/client';

const client = createSignerClient({
  baseUrl: 'https://signer.example.com',
  apiKey: process.env.SIGNER_API_KEY,
  endpointPath: '/v1/sign/session-transaction',
  timeout: 5000,
});

try {
  const result = await client.signSessionTransaction({
    sessionKey: '0x02da7b78f10600379a00f4104ec9045c60b2e7c0494b00ee944f9c75179f29ad',
    transaction: {
      contractAddress: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
      entrypoint: 'transfer',
      calldata: ['0xrecipient', '0x100', '0x0'],
    },
    metadata: {
      requester: 'starkclaw-mobile',
      tool: 'transfer',
      correlationId: 'txn-456',
    },
  });

  console.log('Signature:', result.signature);
  console.log('Request ID:', result.requestId);
} catch (error) {
  if (error instanceof SignerClientError) {
    if (error.isPolicyError()) {
      console.error('Policy denied:', error.message);
    } else if (error.isRetryable()) {
      console.error('Retryable error:', error.code);
    }
  }
}
```

## Error Codes

| Code | HTTP Status | Description | Retryable |
|------|-------------|-------------|-----------|
| `REPLAY_NONCE` | 401 | Nonce already used | No |
| `INVALID_AUTH` | 401 | Invalid signature/auth | No |
| `POLICY_DENIED` | 403 | Policy rejected transaction | No |
| `SERVER_ERROR` | 5xx | Server-side error | Yes |
| `UNAVAILABLE` | 503 | Service unavailable | Yes |
| `TIMEOUT` | - | Request timeout | Yes |
| `NETWORK_ERROR` | - | Network/transport error | Yes |
| `UNKNOWN_ERROR` | * | Unmapped status code | Maybe |
| `VALIDATION_ERROR` | - | Request validation failed | No |

## Type Definitions

### `SignSessionTransactionRequest`

```typescript
{
  sessionKey: string;           // Session key pubkey (0x...)
  transaction: {
    contractAddress: string;
    entrypoint: string;
    calldata: string[];
  };
  metadata: {
    requester: string;          // App identifier
    tool: string;               // Operation name
    correlationId?: string;     // Optional trace ID
  };
}
```

### `SignSessionTransactionResponse`

```typescript
{
  signature: string[];          // Signature components
  requestId: string;            // Signer-generated request ID
}
```

### `SignerClientError`

```typescript
class SignerClientError extends Error {
  code: SignerErrorCode;
  status: number;
  rawBody?: SignerErrorResponse;

  isRetryable(): boolean;
  isPolicyError(): boolean;
  isAuthError(): boolean;
}
```

## Out of Scope

This module explicitly does **NOT** include:

- ❌ Session signature format migration logic itself (owned by #51)
- ❌ `contracts/agent-account/**` modifications
- ❌ mTLS certificate handling in mobile client runtime (enforced server-side; client enforces transport policy only)

## Testing

```bash
# Run signer client tests only
./scripts/test/signer-client.sh

# Run with coverage
npm --prefix apps/mobile test -- --run --coverage lib/signer
```

## Migration Context

See [SESSION_ACCOUNT_MIGRATION_MAP.md](../../../../docs/security/SESSION_ACCOUNT_MIGRATION_MAP.md) for the full API mapping from `agent-account` to `session-account` and integration points after #51 merges.

## Architecture

```
┌─────────────────────────┐
│  Starkclaw Mobile App   │
│  (execution layer)      │
└───────────┬─────────────┘
            │
            │ execute_transfer
            ▼
┌─────────────────────────┐
│  KeyringProxySigner     │
│  • HMAC auth headers    │
│  • 4-felt response      │
│  • request correlation  │
└───────────┬─────────────┘
            │
            │ HTTPS + HMAC
            ▼
┌─────────────────────────┐
│  Remote SISNA Signer    │
│  • Policy enforcement   │
│  • Signature generation │
│  • Audit logging        │
└─────────────────────────┘
```

## Contributing

- All changes must include tests (TDD-first)
- Error mappings must be deterministic
- Keep commits small and auditable

## References

- Issue #54: https://github.com/keep-starknet-strange/starkclaw/issues/54
- Migration context: #53
- Signature work (separate stream): #51
- Breaking points: PR #44, PR #43
