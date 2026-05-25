---
name: storeshot-designer
description: Edit OpenStoreShot projects through storeshot.project.json, render, validate, export, and keep reference usage inspiration-only.
---

# StoreShot Designer Skill

Use this skill when working on an OpenStoreShot project.

## Check the project

1. Find `storeshot.project.json`.
2. Parse it with `pnpm storeshot validate <path>`.
3. Inspect `slides`, `artboards`, `layers`, `locales`, `platforms`, and `exportTargets`.

## Editing rules

- Treat `storeshot.project.json` as the source of truth.
- Keep IDs stable and readable.
- Add slides by duplicating a similar slide structure and changing original text, roles, and layer positions.
- Edit layers by changing `text`, `x`, `y`, `width`, `height`, `fontSize`, `fontWeight`, `fill`, `device`, `locked`, or `hidden`.
- Keep headlines above device frames unless the requested composition intentionally changes that.
- Do not use competitor screenshots as templates.

## Render and validate

```bash
pnpm storeshot validate examples/demo-project/storeshot.project.json
pnpm storeshot render examples/demo-project/storeshot.project.json
pnpm storeshot export examples/demo-project/storeshot.project.json --platform ios --locale ja-JP
pnpm storeshot export examples/demo-project/storeshot.project.json --platform android --locale ja-JP
```

Check generated files under `examples/demo-project/exports`.

## Safe references

When a user asks to use a popular app as reference, convert it to high-level patterns:

- composition
- copy length
- color mood
- device framing
- slide role

Never copy logos, UI, screenshots, characters, or distinctive visual expression.

## Codex-first asset workflow

OpenStoreShot itself does not use API keys. Use Codex to create or update local assets and `storeshot.project.json`, then use the app to review the result. The `pnpm storeshot imagegen background ...` command is a local placeholder helper for demo/test assets, not a remote generation client. Prompts must still avoid direct-copy language, famous logos, and copyrighted characters.

## Example requests

- このアプリの5枚構成のiOS/Androidストア画像を作成して
- 人気の生産性アプリを参考に、3つのオリジナル方向性を提案して
- 選択した方向性からGoogle Play feature graphicを生成して
- 日本語版をもっと短く、高級感のある表現にして
- すべての見出しをデバイスフレームより上に配置して再出力して
- validation errorを直して再レンダリングして

## Reporting

Report edited slides/layers, validation results, render/export commands, output paths, and any remaining warnings or mock behavior.
