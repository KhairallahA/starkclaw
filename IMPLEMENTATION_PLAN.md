# Starkclaw Implementation Plan (Agentic-Native)

Status: Draft v1 (2026-02-13)

This plan is optimized for autonomous iteration and frequent integration. It contains no human time estimates; progress is defined only by milestone acceptance criteria.

## Working Style (Non-Negotiable)

- Vertical slices over big design upfront.
- Every slice produces a runnable artifact (app, contract, script) that can be validated automatically.
- Small, frequent commits to `main` with regular pushes.
- Prefer reuse:
  - Starknet AA account baseline from `keep-starknet-strange/starknet-agentic` (`contracts/agent-account`).
  - Inspiration for secure tool boundaries from `nearai/ironclaw`.
  - Agent orchestration ideas from `jlia0/tinyclaw` (team/role patterns), adapted for mobile.

## Agentic-Native Workflow Contract

The repo will be structured so an agent can always do the next unit of work with minimal human intervention:

- All tasks are discoverable from this file plus a single status file (`STATUS.md`).
- All tasks have acceptance checks that can be run via scripts.
- Secrets are never required to commit code; secrets are only needed to run optional live-network actions.
- The "happy path" for each milestone ends with:
  - `git status` clean
  - checks passing
  - commit created
  - push to origin

## Definition Of Done (Per Milestone)

- App builds locally (or in CI) in the intended mode.
- Deterministic checks exist and pass:
  - lint
  - typecheck
  - unit tests where applicable
  - contract build + tests where applicable
- A short, reproducible verification procedure is written in `STATUS.md`.

## Milestones

### M00: Repo Bootstrap (Autonomy First)

Goal: turn this repository into an agent-friendly monorepo skeleton with deterministic commands.

Deliverables:

- `README.md` with single-command setup and run instructions.
- Expo app scaffold (Expo Router, TypeScript).
- Contracts workspace scaffold (Scarb + Starknet Foundry).
- `scripts/` commands for:
  - `scripts/check` (runs all checks)
  - `scripts/app/dev` (run app)
  - `scripts/contracts/test` (run contract tests)
- CI baseline (GitHub Actions) running `scripts/check`.

Acceptance criteria:

- `scripts/check` returns success on a clean clone (without secrets).
- CI runs on push and passes.

Commit boundary:

- One commit that introduces the scaffolding and CI.

### M01: Starknet AA Contracts Integrated (Safe Rails Core)

Goal: bring in the baseline agent account contract and make it build/test in this repo.

Deliverables:

- Contracts vendored or submoduled from `starknet-agentic`:
  - `AgentAccount` contract
  - optional `AgentAccountFactory` contract
- A minimal deployment script for Starknet Sepolia:
  - declare
  - deploy
  - verify addresses are recorded in a checked-in config file
- Contract test suite runs in CI.

Acceptance criteria:

- `scripts/contracts/test` passes.
- `scripts/contracts/deploy` can deploy to Sepolia given RPC + funding.

Commit boundaries:

- One commit for contract import + tests.
- One commit for deploy scripts + config.

### M02: Mobile Wallet Core (Keys, Address, RPC Read)

Goal: prove the signing + RPC stack in Expo (Hermes) works end-to-end for read-only wallet features.

Deliverables:

- Signing stack decision recorded (starknet.js vs RN-focused alternative), with a small deterministic test proving:
  - key generation works
  - public key derivation matches expected format
  - transaction hash/signature formatting matches the chosen account contract
- Secure key storage layer:
  - owner key: biometric gated for signing
  - session key: stored without biometric gating
- RPC client:
  - chain id verification
  - nonce fetch
  - balances for a minimal token set
- UI:
  - Home screen showing address and balances (ETH + 1 stablecoin).

Acceptance criteria:

- App can generate/import an owner key, derive address, and persist it across restarts.
- App can read balances for the generated address on Sepolia.

Commit boundaries:

- One commit for storage + key model.
- One commit for RPC reads + balances UI.

### M03: Deploy Starkclaw Account From Mobile

Goal: allow the mobile app to deploy the Starkclaw AA account contract on Sepolia.

Deliverables:

- App flow:
  - "Create wallet" produces a deployable plan
  - broadcasts `DEPLOY_ACCOUNT` (or factory deployment path)
  - tracks status and finalizes wallet setup
- Funding UX:
  - show faucet instructions and detect funding state.

Acceptance criteria:

- Fresh install can create and deploy an account on Sepolia using only the app.
- App persists deployed account address and can read nonce/balances post-deploy.

Commit boundary:

- One commit for deploy flow + status tracking.

### M04: On-Chain Policy Management UI (Session Keys)

Goal: let the user configure and enforce constrained autonomy via session keys.

Deliverables:

- UI:
  - create session key with policy fields (expiry, spend cap per token)
  - list active/expired keys
  - revoke key
  - emergency revoke all
- On-chain integration:
  - `register_session_key`
  - `revoke_session_key`
  - `emergency_revoke_all`
- Owner gating:
  - policy changes require biometric + explicit confirmation.

Acceptance criteria:

- App can create a session key policy on-chain and then verify it by reading back policy state.
- Revocation works and is reflected in both UI and on-chain checks.

Commit boundaries:

- One commit for on-chain calls + local state model.
- One commit for full UI + biometrics gating.

### M05: Agent Runtime v0 (Chat + Tool Calls)

Goal: integrate an LLM-driven agent loop that can only act through safe tools.

Deliverables:

- Chat UI with streaming responses.
- LLM adapter:
  - supports at least one provider
  - supports pluggable model selection
- Tool runtime:
  - JSON-schema validated tool calls
  - strict allowlist of tools
  - local audit log of tool calls and results
- Tools implemented:
  - balances
  - transfer preparation
  - transaction simulation/fee estimation

Acceptance criteria:

- Agent can answer questions about balances without hallucinating calls.
- Agent can propose a transfer using tool calls and present a deterministic preview card.

Commit boundaries:

- One commit for chat + provider integration.
- One commit for tool runtime + audit logs.

### M06: End-To-End MVP Demo (Constrained Transfer)

Goal: ship the MVP demo scenario from `spec.md` with on-chain enforcement.

Deliverables:

- Execute transfer with session key signature format expected by the account contract.
- Preview card must show:
  - amount, token, recipient
  - policy used (cap, expiry)
  - expected failure modes (cap exceeded, key expired, revoked)
- Error UX:
  - clear denial reason when on-chain policy reverts
  - suggested remediation (reduce amount, extend policy, use owner path)

Acceptance criteria:

- The "over cap" test reliably fails on-chain and is surfaced cleanly in the app.
- Emergency revoke prevents subsequent agent executions immediately.

Commit boundary:

- One commit implementing execution + denial UX and a scripted demo runbook in `STATUS.md`.

### M07: Multi-Target Allowlist (Unblocks Real DeFi Flows)

Goal: extend the on-chain policy model to support multi-contract flows.

Deliverables:

- Contract update:
  - session key policy supports a bounded list of allowed targets (N small, fixed).
  - `__execute__` enforces each call target is within the set.
- Mobile UI update:
  - policy creation supports selecting "Apps" which map to target sets.

Acceptance criteria:

- A session key can be configured to allow token + router targets needed for a swap flow.
- Contract tests cover allow/deny edge cases.

Commit boundaries:

- One commit for contract changes + tests.
- One commit for mobile policy UI integration.

### M08: DeFi Action v1 (Swap via AVNU)

Goal: demonstrate a real economic action under policy constraints.

Deliverables:

- Quote tool using AVNU API.
- Swap tool that:
  - prepares required calls (approvals bounded)
  - simulates
  - executes under session key policy
- UI:
  - swap preview card with min received, slippage, and spend impact.

Acceptance criteria:

- App can perform a token swap on Sepolia with policy enforcement.
- Approvals are bounded and never default to unlimited.

Commit boundary:

- One commit for quote + swap execution + UI.

### M09: Hardening Pass (Security and Reliability)

Goal: reduce failure rates and lock down common agent risks.

Deliverables:

- Stronger injection defenses:
  - deny external content from creating tool calls directly
  - strict tool arguments sanitization
- Network hardening:
  - timeouts, retries, exponential backoff
  - RPC fallback list
- Local audit export:
  - export JSON bundle of tool + tx history.

Acceptance criteria:

- Common network failures produce actionable, non-technical error messages.
- Audit export contains enough data to reconstruct what happened without secrets.

Commit boundary:

- One commit for hardening improvements + regression tests.

## Progress Tracking

Create and maintain `STATUS.md` as the single current state summary:

- Current milestone in progress
- What is done
- What is blocked
- How to verify the current build

## Optional Stretch Milestones (After MVP)

- Gasless transactions via paymaster integration.
- ERC-8004 identity and reputation hooks (agent registry integration).
- Background routines and safe automation (heartbeat model inspired by tinyclaw/ironclaw).
- Mainnet support and a tighter onboarding path.
