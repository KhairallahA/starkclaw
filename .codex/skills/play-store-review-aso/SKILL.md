---
name: play-store-review-aso
version: 1.0.0
description: Google Play submission hardening + ASO workflow for Android apps. Optimized for policy compliance, listing quality, and conversion.
---

# Play Store review + ASO

## Use when
- Preparing Android release for Google Play review.
- Auditing policy, target API, and listing compliance.
- Writing short/full descriptions and visual asset strategy.

## High-priority rejection / suspension checks
1. Target API compliance and release integrity
2. Misleading metadata or policy-violating claims
3. Permissions/data safety mismatch
4. Broken core functionality / unstable release
5. Missing required contact/support info
6. Inaccurate declarations and content ratings

## Google Play metadata constraints
- App name: 30 chars
- Short description: 80 chars
- Full description: 4000 chars
- App icon: 512x512 PNG
- Feature graphic: 1024x500
- Phone + 7-inch + 10-inch screenshots recommended for broad surfaces

## ASO framework
- Put core value in first line of short description
- Avoid keyword stuffing and rank bait terms ("best", "#1", etc.)
- Align screenshots with main jobs-to-be-done and user intent
- Localize copy and visuals per market

## Commands
- `python3 scripts/store/validate_store_readiness.py --platform android --root . --out docs/store/automation/readiness-android.json`
- `python3 scripts/store/generate_metadata_templates.py --platform android --root .`
- `python3 scripts/store/generate_all_store_assets.py --platform android --root .`

## Output
- `docs/store/automation/readiness-android.json`
- `docs/store/automation/metadata/play-store.primary.md`
- `docs/store/automation/metadata/play-store.alt-a.md`
- `docs/store/automation/metadata/play-store.alt-b.md`
