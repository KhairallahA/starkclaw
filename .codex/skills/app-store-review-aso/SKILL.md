---
name: app-store-review-aso
version: 1.0.0
description: App Store submission hardening + ASO workflow for iOS apps. Optimized to minimize rejection risk and maximize listing conversion.
---

# App Store review + ASO

## Use when
- Preparing iOS build for App Store review.
- Auditing compliance against Apple guidelines before submission.
- Writing App Store metadata (name, subtitle, keywords, promo text, description).

## High-priority rejection checks
1. Crashes / incomplete flows
2. In-app purchase compliance + restore purchases
3. Privacy policy URL + data disclosure + permission purpose strings
4. Account deletion available in-app (if account creation exists)
5. Review access: demo credentials and backend reachable
6. Metadata accuracy (no misleading claims, no irrelevant keywords)

## Apple metadata constraints
- Name: 30 chars
- Subtitle: 30 chars
- Promotional text: 170 chars
- Keywords: 100 chars comma-separated
- Up to 10 screenshots per device class

## Required submission artifacts
- App Review notes with:
  - test account
  - non-obvious flows explanation
  - IAP test guidance
  - region/hardware dependencies
- Privacy policy URL + support URL
- "What’s New" draft
- iPhone + iPad screenshots

## ASO framework
- One core intent per screenshot
- First 3 screenshots should communicate value immediately
- Keyword set = high intent + medium competition + brand-safe
- Avoid competitor names/trademarks in keywords

## Commands
- `python3 scripts/store/validate_store_readiness.py --platform ios --root . --out docs/store/automation/readiness-ios.json`
- `python3 scripts/store/generate_metadata_templates.py --platform ios --root .`

## Output
- `docs/store/automation/readiness-ios.json`
- `docs/store/automation/metadata/app-store.primary.md`
- `docs/store/automation/metadata/app-store.alt-a.md`
- `docs/store/automation/metadata/app-store.alt-b.md`
