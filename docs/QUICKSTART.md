# Quickstart

The shortest path from a fresh clone to a running OpenStoreShot Studio:

```bash
git clone https://github.com/yuga-hashimoto/OpenStoreShot.git
cd OpenStoreShot
corepack enable
pnpm install
pnpm run doctor
pnpm demo
```

Open:

```text
http://127.0.0.1:3100
```

## What `pnpm run doctor` Checks

- Node.js version
- pnpm availability
- installed dependencies
- demo project presence
- web app presence
- Codex skill presence

## First Useful Commands

```bash
pnpm validate:demo
pnpm render:demo
pnpm quality
```

## Recommended First Workflow

1. Run `pnpm demo`.
2. Open `http://127.0.0.1:3100`.
3. Select a text or background layer.
4. Right-click the canvas to edit font, weight, alignment, color, or background.
5. Open the Reference Gallery for inspiration-only store examples.
6. Ask Codex to revise `storeshot.project.json`.
7. Run `pnpm validate:demo` and `pnpm render:demo`.

## Codex-Friendly Workflow

OpenStoreShot is designed so Codex can work on real local files:

- project source: `examples/demo-project/storeshot.project.json`
- skill: `.agents/skills/storeshot-designer/SKILL.md`
- render command: `pnpm render:demo`
- validation command: `pnpm validate:demo`

The app is the visual review surface. Codex edits local files and runs the commands.
