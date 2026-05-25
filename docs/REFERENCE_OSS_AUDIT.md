# Reference OSS Audit

OpenStoreShot uses the projects below as product and architecture references only. No source code, templates, screenshots, icons, app assets, or visual designs were copied into this repository.

## Audited repositories

| Project | Commit inspected | License | What we learned | Reuse decision |
| --- | --- | --- | --- | --- |
| `ParthJadhav/app-store-screenshots` | `27ff898` | MIT | Codex-friendly project files, multi-platform screenshot generation, template-oriented batch output. | Design principles only. |
| `YUZU-Hub/appscreen` | `27c7667` | MIT in `package.json` | Browser editor patterns for background, text, device mockup, export/import, and fast local use. | UI/UX ideas only. |
| `fastlane/fastlane` | `47c965c` | MIT | `snapshot`/`frameit` automation mindset, deterministic output, CI-oriented CLI workflows. | Automation concepts only. |
| `facundoolano/google-play-scraper` | `df5df78` | MIT | Google Play metadata and screenshot fetching can work but is brittle against store HTML changes. | Wrapped behind replaceable adapter; initial live adapter falls back to fixtures. |
| `nexu-io/open-design` | local reference clone | Apache-2.0 | Multilingual README/docs, translation guide, screenshot-heavy OSS README, issue/PR scaffolding, agent-native local design workflow. | Secondary OSS growth reference only; no code or assets copied. |

## License compatibility

All inspected projects are MIT-compatible. This repository remains MIT. Reference repositories are not vendored into shipped packages and are ignored as research material.

## Product decisions

- A deterministic `storeshot.project.json` is the source of truth.
- Store fetching is adapter-based. App Store can use public JSON endpoints; Google Play is intentionally replaceable because scraping can break.
- Reference Gallery produces high-level briefs instead of copying screenshots or templates.
- Rendering, validation, Web preview, and Codex workflows all consume the same project schema.
- Asset generation is Codex-first; OpenStoreShot keeps only local placeholder generation for demos and tests.
- OSS growth needs product screenshots, a translation guide, issue/PR templates, and CI from the start.
- The public quickstart should be one obvious path: `corepack enable`, `pnpm install`, `pnpm run doctor`, `pnpm demo`.
- Open Design's agent-selection setup pattern maps to OpenStoreShot as `pnpm run doctor`: recommend Codex when available, detect other local agent CLIs on `PATH`, and document fallback/manual workflows instead of asking for browser API keys.
