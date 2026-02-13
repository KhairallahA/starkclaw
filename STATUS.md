# Starkclaw Status

Last updated: 2026-02-13

## Current Milestone

M00: Repo Bootstrap (Autonomy First)

## Completed

- Expanded spec written in `spec.md`.
- Implementation plan and milestones written in `IMPLEMENTATION_PLAN.md`.
- Original draft preserved in `spec.draft.md`.
- M00 bootstrap: Expo app scaffold + Cairo sanity package + deterministic scripts + CI.

## In Progress

- M01: Import Starknet AA Agent Account contract (baseline safety rails)

## Next Up

1. Finalize M01: wire `contracts/agent-account` into deploy + config flow.
2. M02: Mobile signing stack decision + wallet read-only flows.
3. M03: Deploy Starkclaw account from mobile on Sepolia.

## How To Verify

- Repo checks: `./scripts/check`
- Mobile dev server: `./scripts/app/dev`
- Contracts tests: `./scripts/contracts/test`
