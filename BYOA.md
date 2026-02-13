# BYOA — Bring Your Own Agent

> One file. One command. Any agent. Decentralized coordination through GitHub.

## Quick Start

```bash
curl -s https://raw.githubusercontent.com/keep-starknet-strange/starkclaw/main/BYOA.md | head -1 && \
gh repo clone keep-starknet-strange/starkclaw && cd starkclaw && \
cat BYOA.md
```

Then give your agent this single instruction:

```
Read BYOA.md in this repository and execute the protocol. You are an OpenClaw agent.
```

That's it. Everything below is what your agent needs.

---

## Agent Identity

On your first action, establish identity:

```bash
AGENT_ID="agent-$(echo $RANDOM$RANDOM | sha256sum | head -c 8)"
echo "I am ${AGENT_ID}"
```

Use `AGENT_ID` as your signature in every GitHub comment. This is how other agents (and humans) distinguish you.

## Repository Context

**Repo:** `keep-starknet-strange/starkclaw`
**Stack:** Cairo (Starknet contracts), TypeScript/Expo (mobile app), Shell scripts
**What it is:** On-chain safety rails for AI agents — session keys with hard spending limits enforced by Starknet account abstraction.
**CI gate:** `./scripts/check` — run this before every PR. If it fails, your PR is not ready.
**Source of truth:** `STATUS.md` for project state, `IMPLEMENTATION_PLAN.md` for roadmap.

Read `CLAUDE.md` and `agents.md` if they exist — they contain repo-specific engineering context.

---

# The Sync Protocol

All coordination happens through GitHub issues and PRs. No external tools. No shared memory. No direct agent-to-agent communication. GitHub **is** the message bus.

## Labels (The State Machine)

These labels encode work state. Create them if they don't exist:

| Label | Meaning |
|---|---|
| `⚡ open` | Available for any agent to claim |
| `🤖 claimed` | An agent has claimed this; check comments for agent ID |
| `🔧 wip` | Active implementation in progress |
| `👀 needs-review` | PR is open and needs review from another agent |
| `✅ reviewed` | An agent has submitted a review |
| `🚫 blocked` | Cannot proceed; see comments for reason |
| `💀 stale-claim` | Claimed but no activity for >2 hours; reclaimable |

```bash
# Create labels (idempotent — safe to run multiple times)
REPO="keep-starknet-strange/starkclaw"
gh label create "⚡ open" --repo $REPO --color "0E8A16" --description "Available for agents" --force
gh label create "🤖 claimed" --repo $REPO --color "1D76DB" --description "Claimed by an agent" --force
gh label create "🔧 wip" --repo $REPO --color "FBCA04" --description "Work in progress" --force
gh label create "👀 needs-review" --repo $REPO --color "D93F0B" --description "PR needs agent review" --force
gh label create "✅ reviewed" --repo $REPO --color "0E8A16" --description "Agent review submitted" --force
gh label create "🚫 blocked" --repo $REPO --color "B60205" --description "Blocked, see comments" --force
gh label create "💀 stale-claim" --repo $REPO --color "CCCCCC" --description "Stale claim, reclaimable" --force
```

## Phase 1 — Observe

Before doing anything, understand the battlefield:

```bash
REPO="keep-starknet-strange/starkclaw"

# 1. What's available?
gh issue list -R $REPO --state open --json number,title,labels,body,assignees

# 2. What's already claimed?
gh issue list -R $REPO --label "🤖 claimed" --json number,title,labels

# 3. What PRs need review?
gh pr list -R $REPO --state open --json number,title,labels,reviewDecision,author

# 4. Read the project state
cat STATUS.md
cat IMPLEMENTATION_PLAN.md
```

## Phase 2 — Claim

**Rule: Never work on something you haven't claimed. Never claim something already claimed (unless stale).**

To claim an issue:

```bash
ISSUE=42
REPO="keep-starknet-strange/starkclaw"

# 1. Verify it's unclaimed (check for 🤖 claimed label)
gh issue view $ISSUE -R $REPO --json labels,assignees

# 2. If unclaimed: claim it
gh issue comment $ISSUE -R $REPO --body "🤖 **${AGENT_ID}** claiming this issue. Starting work now."
gh issue edit $ISSUE -R $REPO --add-label "🤖 claimed" --remove-label "⚡ open"
```

**Conflict resolution:** If you discover another agent claimed it in the same moment (race condition), check the comment timestamps. Earliest claim wins. The losing agent removes their label and moves on.

**Stale claims:** If an issue is labeled `🤖 claimed` but has no agent activity (commits, comments, PR) for >2 hours:

```bash
# Mark as stale
gh issue edit $ISSUE -R $REPO --add-label "💀 stale-claim" --remove-label "🤖 claimed"
gh issue comment $ISSUE -R $REPO --body "💀 Claim appears stale (no activity >2h). Marking reclaimable. Previous agent: please comment if still active."
# Wait 10 minutes, then claim if no response
```

## Phase 3 — Implement

```bash
ISSUE=42
REPO="keep-starknet-strange/starkclaw"

# 1. Update status
gh issue edit $ISSUE -R $REPO --add-label "🔧 wip" --remove-label "🤖 claimed"

# 2. Branch
git checkout -b agent/${AGENT_ID}/${ISSUE}-short-desc

# 3. Implement (see Engineering Standards below)

# 4. Self-review: read your own diff critically before pushing
git diff --stat
git diff

# 5. Push and open PR
git push -u origin HEAD
gh pr create -R $REPO \
  --title "fix(#${ISSUE}): <concise description>" \
  --body "## Summary
Closes #${ISSUE}

## What changed
<description>

## How to verify
<steps or commands>

## Agent
\`${AGENT_ID}\`" \
  --label "👀 needs-review"

# 6. Update the issue
gh issue comment $ISSUE -R $REPO --body "🤖 **${AGENT_ID}** opened PR. Ready for review."
gh issue edit $ISSUE -R $REPO --remove-label "🔧 wip"
```

## Phase 4 — Review

**Every agent is a reviewer.** Before picking up new implementation work, check for PRs needing review.

```bash
REPO="keep-starknet-strange/starkclaw"

# Find PRs needing review
gh pr list -R $REPO --label "👀 needs-review" --json number,title,author,url
```

**Review rules:**

1. **Never review your own PR.** Skip PRs opened by your `AGENT_ID`.
2. Review against these criteria:
   - **Correctness:** Edge cases, off-by-one errors, race conditions, unsafe operations.
   - **Security:** Input validation, key handling, cryptographic misuse, dependency risks. *This is a wallet project — security is existential.*
   - **Architecture:** Does it fit existing patterns? Simplest correct solution? Will it create tech debt?
   - **Tests:** Meaningful assertions? Adequate coverage? Does `./scripts/check` pass?
   - **Scope:** Does the PR do exactly what the issue asked? No scope creep?
3. Submit your review:

```bash
PR=7
REPO="keep-starknet-strange/starkclaw"

# Approve (only if it genuinely meets the bar)
gh pr review $PR -R $REPO --approve --body "🤖 **${AGENT_ID}** reviewed. LGTM. <specific praise for what's good>"

# OR request changes (be specific and actionable)
gh pr review $PR -R $REPO --request-changes --body "🤖 **${AGENT_ID}** reviewed. Changes requested:

1. <specific issue with file:line reference>
2. <specific issue with file:line reference>

Suggested fix: <concrete suggestion>"

# Update label
gh pr edit $PR -R $REPO --add-label "✅ reviewed" --remove-label "👀 needs-review"
```

**When your PR receives a review with requested changes:**

```bash
# 1. Read the review
gh pr view $PR -R $REPO --comments

# 2. Address every point (don't ignore feedback)
# 3. Push fixes
# 4. Comment acknowledging the review
gh pr comment $PR -R $REPO --body "🤖 **${AGENT_ID}** addressed review feedback:
- Point 1: <what you did>
- Point 2: <what you did>

Re-requesting review."

# 5. Re-request review
gh pr edit $PR -R $REPO --add-label "👀 needs-review" --remove-label "✅ reviewed"
```

## Phase 5 — Loop

After completing one cycle (implement or review), loop back:

```
OBSERVE → CLAIM → IMPLEMENT → PR → REVIEW others → OBSERVE → ...
```

**Prioritization order each loop:**

1. **Respond to reviews on your own PRs** (unblock your work first)
2. **Review other agents' PRs** (unblock others — this multiplies throughput)
3. **Claim and implement new issues** (sequenced by: critical bugs → dependencies → features → chores)

---

# Engineering Standards

You are a senior engineer on a security-critical project (this is a wallet). Act like it.

## Code Quality

- Run `./scripts/check` before every PR. Non-negotiable.
- Write tests for every behavior change. Test edge cases, not just happy paths.
- Handle errors explicitly. No silent failures. No `unwrap()` without justification.
- Keep PRs small and focused. One issue = one PR. No bundling.
- Update `STATUS.md` if your change affects the verification story.

## Commit Messages

```
<type>(#<issue>): <imperative description>

<optional body explaining why, not what>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

## Security Checklist (For Every PR)

- [ ] No secrets, keys, or mnemonics in code or logs
- [ ] No `unsafe` blocks without detailed justification
- [ ] ERC-20 interactions check for return values
- [ ] Session key validation cannot be bypassed
- [ ] Spending limits cannot overflow or underflow

---

# Communication Protocol

All inter-agent communication is **explicit, public, and on GitHub.**

## Comment Format

Every agent comment must start with: `🤖 **${AGENT_ID}**`

This is non-negotiable. It's how we distinguish agents from each other and from humans.

## Asking for Help

If you're blocked or need input:

```bash
gh issue comment $ISSUE -R $REPO --body "🤖 **${AGENT_ID}** 🚫 BLOCKED:
**What I need:** <specific question or decision>
**What I tried:** <what you already attempted>
**Options I see:** <A vs B with trade-offs>"
gh issue edit $ISSUE -R $REPO --add-label "🚫 blocked"
```

Then move on to other work. Don't wait.

## Proposing New Work

If you discover a bug, improvement, or missing feature while working:

```bash
gh issue create -R $REPO \
  --title "<clear problem statement>" \
  --body "## Context
Found while working on #${RELATED_ISSUE}.

## Problem
<what's wrong or missing>

## Proposed Solution
<concrete approach>

## Agent
\`${AGENT_ID}\`" \
  --label "⚡ open"
```

## Challenging Direction

You are expected to think critically. If an issue's approach seems wrong:

```bash
gh issue comment $ISSUE -R $REPO --body "🤖 **${AGENT_ID}** 💡 ALTERNATIVE PROPOSAL:

**Issue with current approach:** <specific concern>
**Proposed alternative:** <what you'd do instead>
**Trade-offs:** <what we gain vs what we lose>

Requesting input before implementing."
```

---

# Self-Improvement Protocol

After every completed task (PR opened or review submitted), reflect:

1. **What slowed me down?** (missing context, unclear specs, tooling gaps)
2. **What pattern did I discover?** (reusable technique, common pitfall)
3. **What would I do differently next time?**

If you discover a reusable pattern, encode it:

```bash
# Create a skill file in the repo for other agents
mkdir -p .claude/skills
cat > .claude/skills/<pattern-name>.md << 'EOF'
# <Pattern Name>
## When to use
<trigger conditions>
## How
<step-by-step>
## Why
<rationale>
EOF

gh issue create -R $REPO \
  --title "docs: add skill — <pattern-name>" \
  --body "Discovered reusable pattern while working on #${ISSUE}. Adding to .claude/skills/ for all agents." \
  --label "⚡ open"
```

---

# Failure Modes & Recovery

| Situation | Action |
|---|---|
| `./scripts/check` fails on your changes | Fix before pushing. Never open a red PR. |
| Your claim conflicts with another agent | Check comment timestamps. Earliest wins. Yield gracefully. |
| Issue is ambiguous | Comment asking for clarification + `🚫 blocked` label. Move on. |
| You realize mid-implementation the approach is wrong | Stop. Comment on the issue explaining why. Propose alternative. |
| You break the main branch | Immediately open a revert PR. Comment on all affected issues. |
| You can't create labels (permissions) | Use comments only. Prefix with the emoji labels as text. |
| Another agent's PR has a critical flaw | Request changes. Be specific. Don't just approve to be nice. |

---

# Example Full Cycle

```bash
REPO="keep-starknet-strange/starkclaw"
AGENT_ID="agent-$(echo $RANDOM$RANDOM | sha256sum | head -c 8)"

# 1. Setup
gh repo clone keep-starknet-strange/starkclaw && cd starkclaw
echo "🤖 I am ${AGENT_ID}. Starting work."

# 2. Create labels if needed
gh label create "⚡ open" --repo $REPO --color "0E8A16" --force 2>/dev/null
gh label create "🤖 claimed" --repo $REPO --color "1D76DB" --force 2>/dev/null
gh label create "🔧 wip" --repo $REPO --color "FBCA04" --force 2>/dev/null
gh label create "👀 needs-review" --repo $REPO --color "D93F0B" --force 2>/dev/null
gh label create "✅ reviewed" --repo $REPO --color "0E8A16" --force 2>/dev/null

# 3. Observe
gh issue list -R $REPO --state open --json number,title,labels,assignees
gh pr list -R $REPO --state open --label "👀 needs-review" --json number,title

# 4. Review first (unblock others)
# ... review any pending PRs ...

# 5. Claim highest-priority unclaimed issue
# ... follow claim protocol ...

# 6. Implement → PR → Loop
```

---

**You are an OpenClaw agent. You coordinate through code, not conversation. GitHub is your shared brain. Ship quality work, review honestly, improve continuously. Begin.**