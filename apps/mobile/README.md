# Starkclaw Mobile App

This is the Expo (React Native) app that demonstrates Starkclaw end-to-end:

- Deterministic Starknet account address (fund first, deploy later)
- Deploy the AA account contract on Sepolia
- Create and register session keys with on-chain spend caps
- Execute ERC-20 transfers via a session key (with an explicit “Execute” step)
- Show **on-chain denial** when a transfer exceeds the policy cap

The product story lives in the repo root `README.md`. This file is for people hacking on the app.

## Stack

- Expo SDK 54 + Expo Router
- TypeScript
- Key storage: `expo-secure-store`
- Owner confirmations: `expo-local-authentication` (best-effort; falls back if unavailable)
- Starknet: `starknet` (starknet.js) + direct JSON-RPC calls

## Run

From repo root:

```bash
./scripts/app/dev
```

Or from this folder:

```bash
npm ci
npm run dev
```

## Checks

From repo root:

```bash
./scripts/check
```

Or from this folder:

```bash
npm run lint
npm run typecheck
```

## App Tour (Where To Look)

- Home screen: `app/(tabs)/index.tsx`
  - wallet create/reset
  - balances
  - deploy account
- Policies screen: `app/(tabs)/policies.tsx`
  - create/register/revoke/emergency revoke session keys
- Agent screen: `app/(tabs)/agent.tsx`
  - deterministic parsing + preview + execute
- Activity screen: `app/(tabs)/activity.tsx`
  - local activity log + StarkScan links

Core logic:

- Wallet derivation + persistence: `lib/wallet/wallet.ts`
- RPC client: `lib/starknet/rpc.ts`
- Default networks: `lib/starknet/networks.ts`
- Token list: `lib/starknet/tokens.ts`
- Session key storage + on-chain policy calls: `lib/policy/session-keys.ts`
- Session-key signing (prepends pubkey): `lib/starknet/session-signer.ts`
- Transfer preparation + execution: `lib/agent/transfer.ts`
- Local activity log: `lib/activity/activity.ts`

## Sepolia Prerequisite (Important)

The app deploys the `AgentAccount` class by class hash. That class must be **declared on Sepolia** at least once
by a funded deployer account before *any* user can deploy an instance.

From repo root:

```bash
STARKNET_DEPLOYER_ADDRESS=0x... \
STARKNET_DEPLOYER_PRIVATE_KEY=0x... \
./scripts/contracts/declare-agent-account
```

## Security Notes (MVP Reality)

- Experimental software. Not audited.
- Do not use mainnet funds.
- The security claim here is **bounded authority** via on-chain policy, not “the agent is safe”.
- Private keys should never be put in logs, prompts, screenshots, or issues.

