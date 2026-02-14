# Starkclaw

> TL;DR summon command: `Clone https://github.com/keep-starknet-strange/starkclaw, read BYOA.md, and execute the protocol. You are an OpenClaw agent.`

## 1) Summon Agents (Core Workflow)

Starkclaw is intentionally agent-native. The BYOA protocol is a core part of how this repo ships.

Give your coding agent this instruction:

> Clone https://github.com/keep-starknet-strange/starkclaw, read BYOA.md, and execute the protocol. You are an OpenClaw agent.

Expected behavior:

- self-identify in GitHub issues
- claim scoped tasks
- open focused PRs
- review peer-agent work
- coordinate via labels and issue threads

Start here:

- `BYOA.md` for protocol
- `agents.md` for repository-specific agent instructions

## 2) What Starkclaw Is

Secure mobile AI agent wallet for Starknet with on-chain session-key policies and auditable execution.

Starkclaw is a reference app for one core principle:

**Do not give an AI your wallet. Give it a revocable session key with hard on-chain limits.**

When agents can produce transaction intents, the only reliable safety boundary is the account contract that enforces spend and target policy.

## Status

- Current maturity: pre-`1.0.0` (experimental).
- Default mode: demo-first UX with deterministic mocked flows.
- Live-mode plumbing exists in `apps/mobile/lib/**` and contracts, with UI wiring still in progress.
- Not audited. Do not use with real mainnet funds.

See `STATUS.md` for current milestones and verification steps.

## Security Model

Starkclaw follows Starknet account-abstraction safety rails with split authority:

- Owner key:
  - deploys account
  - registers/revokes session keys
  - can emergency-revoke delegated access
- Session key:
  - time-bounded and revocable
  - constrained by on-chain policy
  - intended for agent-executed actions

Policy enforcement lives in account execution logic, not in prompts or UI.

Current policy primitives (v1):

- allowed contract targeting
- bounded spend windows (`spending_limit` over rolling period)
- selector coverage for value-moving ERC-20 paths (`transfer`, `approve`, `increase_allowance`) to reduce approval-bypass surfaces

Signature conventions:

- owner transaction signature: `[r, s]`
- session transaction signature: `[session_key_pubkey, r, s, valid_until]`

## Security Stack (Defense in Depth)

Starkclaw is not relying on one guardrail. It composes multiple independent controls:

1. On-chain authority boundaries
   - owner key and session key have different powers
   - emergency revoke can cut delegated authority quickly
2. On-chain execution policy
   - contract target restrictions
   - spend limits and windowed accounting
   - selector-level checks for transfer/approval paths
3. Signature-level binding
   - session signatures carry identity and validity window context
   - malformed or mismatched signer responses are rejected
4. Remote signer hardening (SISNA path)
   - authenticated signer requests (`x-keyring-*`)
   - strict signer response validation
   - TLS pinning and hardened runtime config in production mode
5. Supply/integration integrity checks
   - parity checks against upstream `session-account` lineage
   - deterministic scripts + CI gates (`./scripts/check`)

Practical security result:

- if an agent prompt is manipulated, execution is still constrained by on-chain policy
- if app-layer logic is wrong, contract-level checks still enforce transaction boundaries
- if a delegated key path is compromised, revocation and policy scope limit blast radius

This is the core power of the stack: **bounded, enforceable authority at multiple layers**, not trust in model behavior.

## What You Can Run Today

- Premium mobile UX in demo mode:
  - onboarding and setup flow
  - policy editor and safety states
  - agent proposal/approval loop
  - alerts, inbox, and activity screens
- Contract workspace and tests:
  - deterministic scripts for local/CI checks
  - Cairo + Foundry test harness
- Security hardening baseline:
  - signer boundary checks
  - session-signature parity hardening
  - audit/export primitives

## What Is Next

Primary near-term objective is full live-path wiring:

1. wallet lifecycle and deploy flow in app
2. live balance reads and activity status polling
3. session policy flows in mobile UX
4. agent execution path against real on-chain constraints

Track implementation via GitHub issues and `STATUS.md`.

## Quickstart

### Prerequisites

- Node.js 20+
- npm
- Expo Go (recommended for mobile iteration)
- Cairo toolchain for contracts:
  - `scarb`
  - `snforge` and `sncast`

### Install

```bash
npm ci --prefix apps/mobile
```

### Run App

```bash
./scripts/app/dev
```

### Run Full Checks (CI parity)

```bash
./scripts/check
```

### Run Contract Tests Only

```bash
./scripts/contracts/test
```

## Live-Mode Prep

When running against Sepolia, declare the canonical session-account class hash first:

```bash
STARKNET_DEPLOYER_ADDRESS=0x... \
STARKNET_DEPLOYER_PRIVATE_KEY=0x... \
./scripts/contracts/declare-session-account
```

Notes:

- `STARKNET_RPC_URL` is optional.
- `UPSTREAM_SESSION_ACCOUNT_PATH` can override the source path.
- `EXPECTED_SESSION_ACCOUNT_CLASS_HASH` is pinned by default for safety.

Legacy migration/debug fallback remains explicitly gated:

```bash
ALLOW_LEGACY_AGENT_ACCOUNT=1 ./scripts/contracts/declare-agent-account
```

## Repository Layout

- `apps/mobile/`: Expo app (Expo Router)
- `contracts/`: Starknet account-contract code and tests
- `scripts/`: deterministic dev/CI commands
- `spec.md`: product and protocol intent
- `IMPLEMENTATION_PLAN.md`: milestone plan
- `STATUS.md`: current state and verification recipe
- `BYOA.md`: Bring Your Own Agent protocol
- `agents.md` and `CLAUDE.md`: agent-oriented contribution context

## Connected Repositories

Starkclaw is part of a multi-repo system. The key integrations are:

1. `keep-starknet-strange/starknet-agentic`
   - Relationship: canonical contract lineage source (`contracts/session-account`).
   - How Starkclaw uses it:
     - parity checks: `./scripts/contracts/check-session-account-parity.sh`
     - class declaration flow: `./scripts/contracts/declare-session-account`
     - optional override path: `UPSTREAM_SESSION_ACCOUNT_PATH`
   - Why it matters: Starkclaw keeps wallet policy enforcement aligned with upstream session-account semantics.

2. [`omarespejel/SISNA`](https://github.com/omarespejel/SISNA) (SISNA)
   - Relationship: remote signer boundary for session-key signing.
   - How Starkclaw uses it:
     - signer client and runtime config in `apps/mobile/lib/signer/**`
     - request auth headers (`x-keyring-*`) and strict response validation in `keyring-proxy-signer.ts`
     - transport hardening via TLS pinning + environment guards
   - Why it matters: signing keys stay isolated behind a hardened proxy boundary instead of living in the app runtime.

Integration rule of thumb:

- Contract/API changes in upstream repos must be reflected in Starkclaw parity checks, signer adapters, and mobile execution wiring before release.

## BYOA (Bring Your Own Agent)

Starkclaw supports autonomous multi-agent contribution through GitHub-native coordination.

Start here:

- `BYOA.md` for protocol
- `agents.md` for repository-specific agent instructions

## Versioning and Releases

- Changelog: `CHANGELOG.md`
- Versioning policy: `VERSIONING.md`

Until `1.0.0`, the project follows strict pre-1.0 semantic intent with explicit release notes and security callouts.

## Contributing

1. Pick or open a focused issue.
2. Ship small, verifiable vertical slices.
3. Run `./scripts/check` before opening PR.
4. Update `STATUS.md` if verification flow changes.

For contribution norms and templates, see:

- `CONTRIBUTING.md`
- `.github/ISSUE_TEMPLATE/`
- `.github/pull_request_template.md`

## Security

This project is experimental and security-sensitive.

- Do not commit secrets or keys.
- Do not assume prompt-level controls are sufficient safety.
- Treat on-chain policy as the trust boundary.

Report vulnerabilities via `SECURITY.md`.

## License

MIT (`LICENSE`).
