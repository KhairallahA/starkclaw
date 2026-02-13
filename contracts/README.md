# Starkclaw Contracts

This folder contains the on-chain “safety rails” that make Starkclaw meaningful.

If the app UI and the agent logic are compromised, the contracts are still the final gatekeeper for what can execute.

## Packages

- `agent-account/`: Starknet AA account contract with session keys + policy enforcement

## What The Account Enforces (MVP)

The `AgentAccount` contract supports two signer modes:

- **Owner signature**: unrestricted account execution
- **Session key signature**: restricted execution (policy enforced in `__execute__`)

Session key policy fields (see `agent-account/src/interfaces.cairo`):

- `valid_after`, `valid_until`
- `spending_token`, `spending_limit` (24h rolling window)
- `allowed_contract` (v1: single allowed target; `0` means “any”)

To prevent common bypasses, the spending limiter debits not just `transfer`, but also approval-like selectors
(`approve`, `increase_allowance`, `increaseAllowance`) so a session key can’t escape via unlimited approvals.

## Run Tests

From repo root:

```bash
./scripts/contracts/test
```

Or inside the package:

```bash
cd agent-account
scarb build
snforge test
```

## Deploy / Declare (Sepolia)

The mobile app deploys the account using a pinned class hash. For Sepolia, that class must be declared first.

From repo root:

```bash
STARKNET_DEPLOYER_ADDRESS=0x... \
STARKNET_DEPLOYER_PRIVATE_KEY=0x... \
./scripts/contracts/declare-agent-account
```

If you change the Cairo code:

1. Rebuild and re-declare the class on Sepolia.
2. Update the pinned hash in `apps/mobile/lib/starknet/contracts.ts`.

## Safety Notes

- Experimental contracts. Not audited.
- Don’t deploy to mainnet with real funds.
- Review any change to `__validate__` / `__execute__` like it’s a wallet implementation, because it is.

