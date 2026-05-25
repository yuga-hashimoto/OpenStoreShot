# Open Design Learnings

Open Design was reviewed as an architecture reference. Its useful pattern for OpenStoreShot is not "put a model API inside the product." The stronger pattern is:

- Keep the UI local-first.
- Treat the user's existing coding agent CLI as the design engine.
- Use a daemon or bridge as the privileged local process.
- Store artifacts on disk.
- Render artifacts in a sandboxed preview.
- Stream or queue requests so the user can redirect work without losing context.
- Make skills and design systems explicit, portable files.

## Applied to OpenStoreShot

OpenStoreShot should be the review and control surface for store assets:

- Codex edits `storeshot.project.json` and project assets.
- OpenStoreShot previews the current project.
- The user selects a slide/layer and writes a correction.
- The app stores that correction in `.storeshot/codex-requests.jsonl`.
- Codex reads the queue, applies the change, validates, renders, and reports back.

This keeps API keys out of the app and matches local-agent usage.

## License note

Open Design is Apache-2.0. OpenStoreShot does not copy its source code or assets; it uses the architecture pattern as research input only.
