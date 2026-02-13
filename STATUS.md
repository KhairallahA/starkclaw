# Starkclaw Status

Last updated: 2026-02-13

## Current Milestone

M00: Repo Bootstrap (Autonomy First)

## Completed

- Expanded spec written in `spec.md`.
- Implementation plan and milestones written in `IMPLEMENTATION_PLAN.md`.
- Original draft preserved in `spec.draft.md`.
- M00 bootstrap: Expo app scaffold + Cairo sanity package + deterministic scripts + CI.
- M01 baseline safety rails: vendored `contracts/agent-account` and wired into `scripts/contracts/test`.

## In Progress

- M02: Mobile wallet core (keys + deterministic address + RPC read)

## Next Up

1. Add a minimal in-app onboarding flow (funding + deploy) and wire to Sepolia (M03).
2. Add session key policy management UI + on-chain calls (M04).
3. Add agent chat + tool runtime (M05).

## How To Verify

- Repo checks: `./scripts/check`
- Mobile dev server: `./scripts/app/dev`
- Contracts tests: `./scripts/contracts/test`
