# AGENTS.md

## Install

```bash
pnpm install
```

## Development

```bash
pnpm dev
pnpm --filter @openstoreshot/web dev
```

## Testing

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

## Rendering and validation

```bash
pnpm storeshot validate examples/demo-project/storeshot.project.json
pnpm storeshot render examples/demo-project/storeshot.project.json
pnpm storeshot export examples/demo-project/storeshot.project.json --platform ios --locale ja-JP
pnpm storeshot export examples/demo-project/storeshot.project.json --platform android --locale ja-JP
```

## Project schema guidance

`storeshot.project.json` is the source of truth. Edit slides, artboards, layers, generated assets, reference inspirations, and export targets there. Keep IDs stable and deterministic. Validate after edits.

## Copyright and reference policy

Use reference apps only for high-level analysis. Do not copy screenshots, logos, UI, characters, proprietary visual treatments, or exact composition. If a user asks for a direct copy, refuse that part and create an original alternative.

## Codex-first editing

OpenStoreShot does not need API keys. Use Codex to edit `storeshot.project.json`, create or replace local assets, render, validate, and export. The app is the visual review surface where the user can identify what to change next.

## Quality bar

Outputs should look publishable, not like script output. Check target dimensions, text density, headline placement, safe areas, platform-specific expectations, and locale readability before final export.
