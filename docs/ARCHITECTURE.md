# Architecture

## Monorepo

- `apps/web`: Next.js App Router studio UI and server routes.
- `packages/core`: Zod project schema, target definitions, validation, guardrails.
- `packages/renderer`: deterministic HTML/SVG/sharp renderer and export utilities.
- `packages/store-fetch`: App Store and Google Play reference adapters plus fixtures.
- `packages/imagegen`: local preview provider, prompt builder, and guardrails.
- `packages/cli`: `storeshot` commands for init, render, validate, export, references, imagegen.
- `.agents/skills/storeshot-designer`: Codex workflow skill.

## Source of truth

`storeshot.project.json` is the only durable project state. The web app hydrates from it, Codex edits it directly, and renderer/validator/CLI consume it.

## Codex-first asset boundary

OpenStoreShot itself does not require or read image generation API keys. Codex creates or edits local project assets, while the app previews, validates, and exports the project. Local placeholder generation is deterministic and intended for demos/tests.

## Rendering path

Project JSON -> Zod parse -> artboard HTML -> SVG foreignObject -> `sharp` PNG/JPEG export.

This is deterministic and fast for MVP. A later renderer can add Playwright screenshots or a pure SVG/canvas path for broader CSS fidelity.

## Store reference path

Reference adapters return metadata and screenshot URLs. The Reference Board converts those into high-level patterns such as composition, copy length, color mood, device framing, and slide role.

## Tradeoffs

- `sharp` rendering is simple and CI-friendly, but CSS support is narrower than Chromium. The web canvas remains the richer preview.
- Google Play fetching is fixture-first until a maintained scraper adapter is selected.
- Manual editing is stateful in the browser for MVP; saving back to disk is left to Codex/CLI workflows.
