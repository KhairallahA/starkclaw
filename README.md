# Starkclaw

Mobile personal agent with safe financial rails on Starknet (AA session keys + on-chain spend/allow policies).

## Repo Commands

- Dev (mobile): `./scripts/app/dev`
- Check (CI/local): `./scripts/check`
- Contracts tests: `./scripts/contracts/test`
- Declare AgentAccount (Sepolia, one-time): `STARKNET_DEPLOYER_ADDRESS=... STARKNET_DEPLOYER_PRIVATE_KEY=... ./scripts/contracts/declare-agent-account`

## Prereqs

- Node.js + npm
- Expo Go (for fastest mobile iteration)
- Cairo tooling (for contracts):
  - Scarb (`scarb`)
  - Starknet Foundry (`snforge`, `sncast`)

## Notes

- Skills live in `.claude/skills/**`; `.codex` is a symlink to `.claude` to avoid duplication.
- Project spec: `spec.md`
- Milestones: `IMPLEMENTATION_PLAN.md`
- Current status: `STATUS.md`
