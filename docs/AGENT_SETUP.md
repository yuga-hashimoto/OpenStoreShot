# Agent Setup Guide

OpenStoreShot is designed like Open Design in one important way: the app does not bundle an AI model or force one provider. It works with the coding agent that already runs on your machine.

## Recommended First Setup

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

Then use your preferred local agent in this repository and ask it to edit:

```text
examples/demo-project/storeshot.project.json
```

## Supported Local Agent CLIs

`pnpm run doctor` checks your `PATH` for:

| Agent | Binary | Role |
| --- | --- | --- |
| Codex CLI | `codex` | Compatible local coding agent |
| Claude Code | `claude` | Compatible local coding agent |
| Gemini CLI | `gemini` | Compatible local coding agent |
| OpenCode | `opencode` | Compatible local coding agent |
| Cursor Agent | `cursor-agent` | Compatible local coding agent |
| Qwen Code | `qwen` | Compatible local coding agent |
| Qoder CLI | `qodercli` | Compatible local coding agent |
| GitHub Copilot CLI | `copilot` | Compatible local coding agent |

OpenStoreShot currently ships a Codex-style skill file because Codex is the environment used to develop this repo:

```text
.agents/skills/storeshot-designer/SKILL.md
```

Other agents should use the same project file, CLI commands, and docs. The workflow is not Codex-only.

## How the Loop Works

1. The Studio shows the current store images.
2. The user reviews the screen and makes small manual edits.
3. The user asks their local agent for a larger change.
4. The agent edits `storeshot.project.json` and local assets.
5. The agent runs:

```bash
pnpm validate:demo
pnpm render:demo
```

6. The user reloads or reopens the Studio to inspect the result.

## Choosing an Agent

Use this default order:

1. Any local coding agent already authenticated and available on `PATH`.
2. The agent your team already trusts for repository edits.
3. Manual editing plus CLI render/validate if no agent is installed.

OpenStoreShot intentionally does not ask for API keys in the browser. If an agent or image tool needs credentials, configure that tool locally outside the Studio.

## PATH Troubleshooting

If `pnpm run doctor` says no agent was found:

- Confirm the CLI runs in the same terminal:

```bash
codex --version
claude --version
gemini --version
```

- If the command works in one terminal but not another, check your shell `PATH`.
- On macOS, GUI apps and terminal shells can have different `PATH` values. Start the agent from the same repository folder when possible.
- Rerun:

```bash
pnpm run doctor
```

## First Agent Prompts

```text
OpenStoreShotのdemo projectを確認して、5枚のApp Store / Google Play画像をより高級感のある構成にしてください。validateとrenderまで実行してください。
```

```text
参考ギャラリーの構成だけを参考に、競合画像をコピーせず、1枚目を短い価値訴求にしてください。
```

```text
日本語版の見出しを短くして、iOS 6.9インチとGoogle Play phone向けに再書き出ししてください。
```
