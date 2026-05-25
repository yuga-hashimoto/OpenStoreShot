# Store Spec

This document captures the MVP validation targets. Store requirements can change, so targets are data-driven in `packages/core/src/validation/targets.ts`.

## iOS App Store

- iPhone 6.9 inch portrait: `1290x2796`
- iPhone 6.5 inch portrait: `1242x2688`
- iPad portrait: `2048x2732`
- Localized listing screenshot count: 1 to 10.

## Google Play

- Phone portrait: `1080x1920`
- 7 inch tablet portrait: `1200x1920`
- 10 inch tablet portrait: `1600x2560`
- Feature graphic: `1024x500`

## Google Play warnings

OpenStoreShot warns on:

- Feature graphic text that is too dense.
- Unsupported ranking claims such as `No.1`, `Top`, or `Best`.
- Strong price or sale language that should be reviewed before upload.
- Dimension mismatch against target data.
