# Store Image Playbook

This playbook captures the product lessons taken from the four primary reference OSS projects. It describes mechanisms OpenStoreShot should keep improving, without copying code, assets, or visual templates.

## From `ParthJadhav/app-store-screenshots`

Use deterministic project files and agent-readable instructions.

- Keep `storeshot.project.json` as the shared state.
- Make every store image set reproducible through CLI commands.
- Treat natural-language instructions as changes to structured project data.

## From `YUZU-Hub/appscreen`

Make manual editing obvious and fast.

- Direct canvas selection.
- Right-click local editing for text, background, device, and layer actions.
- Preset layouts for common App Store and Google Play stories.
- Upload real screenshots and place them into device frames.
- Multi-language store copy should be visible and exportable.

## From `fastlane`

Make output automation boring and repeatable.

- Provide short commands for validate, render, export, and CI.
- Keep generated outputs deterministic.
- Make quality gates easy to run locally and in GitHub Actions.
- Prefer scriptable workflows over hidden manual state.

## From `facundoolano/google-play-scraper`

Treat store metadata fetching as replaceable infrastructure.

- Put Google Play access behind an adapter interface.
- Cache and fixture everything useful for local demos.
- Fail honestly in the UI when live fetching breaks.
- Never couple the product to fragile HTML scraping assumptions.

## OpenStoreShot Product Bar

A great store image workflow should support:

- a 5 to 10 image story
- one-image and multi-image panorama compositions
- localized copy and screenshots
- iOS and Google Play targets
- feature graphic creation
- reference browsing without copying
- manual pixel-level polish
- Codex-driven structured edits
- deterministic validation and export
