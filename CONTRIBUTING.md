# Contributing to OpenStoreShot

OpenStoreShot welcomes product, design, localization, renderer, and store-platform contributions.

## Local Setup

```bash
pnpm install
pnpm dev
```

Open `http://127.0.0.1:3000` or the port printed by Next.js.

## Quality Checks

Run the relevant checks before opening a PR:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm storeshot validate examples/demo-project/storeshot.project.json
pnpm storeshot render examples/demo-project/storeshot.project.json
```

## Contribution Areas

- **Editor UX**: canvas editing, right-click actions, keyboard shortcuts, accessibility.
- **Renderer**: deterministic PNG/JPEG output, target sizing, typography fidelity.
- **Store adapters**: App Store and Google Play metadata behind replaceable adapters.
- **Validation**: platform rules, copy-density warnings, feature graphic checks.
- **Localization**: UI dictionaries, README translations, locale-specific store copy.
- **Codex workflow**: skills, examples, safe local asset generation, request queues.

## Reference and Copyright Rules

Reference apps are inspiration only. Do not commit competitor screenshots, logos, UI, characters, proprietary visual treatments, or copied layouts. Reference Gallery should convert examples into high-level briefs such as headline length, device framing, color mood, and slide role.

## Pull Request Expectations

- Keep changes focused.
- Add or update tests when behavior changes.
- Include screenshots for visible UI changes.
- Update docs when commands, workflows, or supported platforms change.
- Prefer MIT or Apache-2.0 compatible dependencies.
