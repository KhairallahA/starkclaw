---
name: mobile-store-orchestrator
version: 1.0.0
description: End-to-end release orchestration for mobile apps (Expo/React Native) targeting Apple App Store + Google Play. Use for submission readiness audits, metadata/ASO generation, screenshot pipelines, and release checklists.
---

# Mobile store orchestrator

Use this skill to run a full release pipeline with minimal manual work.

## Use when
- Preparing a new app submission or update for iOS + Android.
- You need one command flow for readiness, ASO, screenshots, and submission docs.
- You want repeatable output artifacts for many apps.

## Do NOT use when
- Task is only one platform-specific review (use app-store-review-aso or play-store-review-aso).
- Task is product feature development unrelated to store release.

## Inputs expected
- App root path
- Target release type: first release | update
- Locale set (e.g. en-US, fr-FR)
- Monetization model (free, IAP, subscription)

## Pipeline
1. **Static readiness audit**
   - `python3 scripts/store/validate_store_readiness.py --root . --out docs/store/automation/readiness-report.json`
2. **Generate/refresh screenshot assets**
   - `python3 scripts/store/generate_all_store_assets.py --root . --locales en-US`
3. **Generate metadata drafts + ASO variants**
   - `python3 scripts/store/generate_metadata_templates.py --root .`
4. **Produce submission packet**
   - `python3 scripts/store/build_submission_packet.py --root .`

## Required outputs
- `docs/store/automation/readiness-report.json`
- `docs/store/automation/metadata/app-store.*.md`
- `docs/store/automation/metadata/play-store.*.md`
- `docs/store/automation/submission-packet.md`
- `docs/store/screenshots/**` updated

## Success criteria
- No critical blockers in readiness report
- Required metadata fields filled
- Required screenshot slots generated for iPhone/iPad/Play form factors
- Clear reviewer notes + test credentials checklist present
