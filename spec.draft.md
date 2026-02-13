starkclaw - your personal agent with safe financial rails, in your pocket, running on your phone

Idea is to build an openclaw like agent with ability to do onchain operations, like trading, buying, prediction markets etc. But in safe way, leveraging Starknet infrastructure and particularly native account abstraction to enforce onchain safety guards.
As a mobile app.

I will put some context and resources here.

starknet agentic infra repo: https://github.com/keep-starknet-strange/starknet-agentic (find relevant starknet skills and context in this repo)

for the agent orchestration and structure, i suggest we start with a fork of tinyclaw: https://github.com/jlia0/tinyclaw

Can take inspiration from IronClaw from Near team for the privacy and security angle: https://github.com/nearai/ironclaw

Mobile stack. expo with modern glass lucid style, apple grade design and premium look and feel.
hardcore obsession to details and excellent on the UI/UX.

use the relevant skills we have.

# Case study: Starknet as the Agentic Financial and Safety Layer

## Objective, Constraints, and Success Criteria

### Objective

Evaluate whether Starknet should prioritize a focused product strategy around **agent-to-agent commerce**, combining:

- Starknet native account abstraction (AA) for policy-enforced agent wallets
- TEE-based off-chain execution integrity
- On-chain attestation governance and settlement

### Constraints

- Must solve real pain not hypothetical pain.
- Must provide differentiated value vs centralized rails and competing chains.
- Must be launchable in a 2 months pilot window.

### Success criteria for this strategy

1. A credible wedge use case that users will pay for.
2. Technical architecture that materially improves safety.
3. Measurable onboarding and transaction traction (or probably only tracking revenues) within 6 months.
4. Defensible moat based on Starknet-native capabilities.

## Executive Summary

### Recommendation

Explore a focused initiative: **Starknet Agent Safety Rails**.

Core thesis:

- Agentic commerce is emerging quickly, but current stacks are fragile under prompt injection and key-management risk.
- The market needs programmable financial control planes, not only better prompts.
- Starknet's native AA architecture is a direct match for policy-constrained autonomous spending.
- TEE attestation can provide practical off-chain integrity now, while selective ZK can harden critical parts over time.

### Strategic posture

Do **not** position as a generic "AI chain." Position as: **the safest programmable settlement and policy layer for agent transactions**.

### Why now

- A2A interoperability is being standardized under Linux Foundation governance. ([Linux Foundation](https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents?hs_amp=true), [Google](https://developers.googleblog.com/en/google-cloud-donates-a2a-to-linux-foundation/))
- Large payment players are shipping agent-focused protocols. ([Visa April 2025](https://usa.visa.com/about-visa/newsroom/press-releases.release.21361.html), [Visa Oct 2025](https://corporate.visa.com/en/sites/visa-perspectives/newsroom/visa-unveils-trusted-agent-protocol-for-ai-commerce.html))
- Crypto-native machine-payment standards are appearing (x402). ([Coinbase x402](https://docs.cdp.coinbase.com/x402/support/faq))
- Security organizations and model providers explicitly document injection risks in agent systems. ([OWASP](https://owasp.org/www-project-top-10-for-large-language-model-applications/), [OpenAI](https://openai.com/index/hardening-atlas-against-prompt-injection/), [MSRC](https://msrc.microsoft.com/blog/2025/07/how-microsoft-defends-against-indirect-prompt-injection-attacks/))

Additional market signal: Visa reported a sharp year-over-year surge in AI-commerce related traffic in its October 2025 communication. ([Visa Oct 2025](https://corporate.visa.com/en/sites/visa-perspectives/newsroom/visa-unveils-trusted-agent-protocol-for-ai-commerce.html))

## Market and Problem Definition

### What is breaking today

Agents increasingly execute high-impact actions (payments, API spend, account operations). Existing safeguards are often prompt-level and brittle.

Evidence:

- Prompt injection is consistently ranked among top LLM application risks. ([OWASP](https://owasp.org/www-project-top-10-for-large-language-model-applications/))
- OpenAI and Microsoft both publish real defensive guidance for indirect injection and tool abuse. ([OpenAI safety](https://developers.openai.com/api/docs/guides/agent-builder-safety), [MSRC](https://msrc.microsoft.com/blog/2025/07/how-microsoft-defends-against-indirect-prompt-injection-attacks/))

Implication:

- Any agent that can move value or secrets needs **externalized controls** that cannot be overridden by model instructions.

### Opportunity framing

The category opportunity is not "agent intelligence," it is **agent reliability + economic coordination**:

- machine-readable spend policies
- programmable escrow and settlement
- verifiable execution receipts
- tamper-evident audit trails

Inference:

- Teams will pay for reduced financial and operational risk before they pay for marginal model quality improvements.

## Why Starknet Is Well-Matched

### Native AA as a policy engine

On Starknet, account logic is programmable by design. ([Accounts docs](https://docs.starknet.io/architecture/accounts), [AA blog](https://starkware.co/blog/native-account-abstraction-opening-blockchain-to-new-possibilities/))

What this unlocks for agent wallets:

- hard daily/weekly spend limits
- per-contract/per-function allowlists
- denylist and freeze controls
- emergency guardian actions
- role and session key delegation

This is structurally superior to EOA-era wallet assumptions for autonomous actors.

### Agent UX readiness

- Session-key patterns are established in ecosystem tooling. ([Starknet session keys](https://www.starknet.io/blog/session-keys-on-starknet-unlocking-gasless-secure-transactions/), [Argent implementation](https://docs.argent.xyz/aa-use-cases/session-keys/implement-session-keys))
- Sponsored transaction flows are available via paymaster infrastructure (with protocol evolution ongoing). ([Starknet tx reference](https://docs.starknet.io/resources/transactions-reference), [AVNU docs](https://docs.avnu.fi/docs/paymaster/index))

## Proposed Product Thesis

### Product name (working)

**Starknet Agent Safety Rails (ASR)**

### Core value proposition

"Let autonomous agents transact with enforceable on-chain safety policies and attested off-chain execution proofs."

### Product components

1. **Policy Account SDK (Starknet AA)**
- templates for spend limits, allowlists, revocation, and session scopes
2. **Attested Execution Runtime (TEE)**
- minimal runtime with strict syscall API
- remote attestation proofs attached to job receipts
3. **Receipt and Settlement Contracts**
- verify attestation trust chain + policy hash + replay protections
- release escrow or trigger dispute paths
4. **Attestation Governance Registry**
- on-chain registry for accepted enclave measurements, signer roots, revoked builds, and policy versions
5. **Dev Toolkit**
- integration adapters for major agent frameworks and MCP-compatible connectors

## Reference Architecture (TEE + Starknet AA)

### Control plane

- `PolicyManager` contract: policy state, governance roles, emergency pause
- `AttestationRegistry` contract: approved enclave measurements and root cert config
- `SettlementEscrow` contract: conditional payment and disputes

### Data plane

- User encrypts secret to enclave public key
- Enclave executes approved operation
- Enclave outputs signed receipt (commitment to request/response, policy ID, nonce)
- On-chain verifier confirms:
- valid enclave identity
- non-revoked measurement
- nonce freshness
- policy compliance
- Escrow settlement executes automatically

### Contract-state-driven execution control

- Enclave reads policy state from Starknet contracts before each sensitive action.
- Runtime logic is explicit `if/else` over contract state, not prompt text.
- Any failed branch returns a deterministic deny code and no settlement.

Example checks:

- spend cap exceeded -> deny
- destination contract/function not allowlisted -> deny
- attestation measurement not currently approved -> deny
- replay nonce already used -> deny

### Minimal TEE OS contract (recommended)

Allow only a tiny operation set:

- bounded HTTP call to approved domains
- bounded cryptographic operations
- bounded chain-intent request
- explicit deny by default

Inference:

- This design limits lateral movement even if the model is manipulated.

### Implementation alignment with current Starknet experiments

The architecture direction is compatible with current community patterns:

- reproducible TEE VM running sequencer/agent workloads
- remote attestation fetch over RPC
- proof generation pipeline
- Starknet contract function that verifies proof and updates policy/state

Inference:

- This lowers prototype risk because the core pieces are already conceptually assembled, even if production hardening remains substantial.

## Why TEE + ZK Together (not either/or)

### TEE strengths

- low-latency execution
- practical for secrets and arbitrary I/O
- deployable immediately in production

### TEE weaknesses

- hardware/firmware trust assumptions
- attestation PKI and revocation complexity
- side-channel and implementation risk

### ZK strengths

- stronger cryptographic guarantees for deterministic logic
- composable verification on-chain

### Practical combination

- TEE handles live I/O and secret-bearing operations.
- ZK verifies deterministic critical subroutines (policy checks, transcript canonicalization, accounting).
- Over time, migrate more surfaces from "trusted hardware" to "proven computation."

for starkclaw we wont build the TEE part for now.

focus in on the MVP as working end to end mobile app with a personal agent that can interact safely with starknet smart contracts, with very easy configuration of the onchain safety policies (allow list of apps, black list, spending limits, etc)

