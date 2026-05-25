# OpenStoreShot

OpenStoreShotは、Codexと一緒にApp Store / Google Play向けストア画像を確認・編集・検証・書き出しできる、ローカルファーストなOSSスタジオです。

<p><a href="README.md">English</a> · <b>日本語</b> · <a href="docs/I18N.md">翻訳ガイド</a></p>

![OpenStoreShot Studio editor](docs/screenshots/studio-editor.png)

## 何ができるか

- ブラウザ上でストア画像を確認し、文字・背景・端末モック・素材を微修正できます。
- 実際に撮ったスクショをアップロードし、端末フレーム内へ配置できます。
- AI生成画像やアップロード画像を、画像レイヤー・抽出色・背景図形オブジェクトに変換できます。
- App Store / Google Playの参考情報を見て、構成や文字量だけを参考にできます。
- Codexに自然言語で修正を依頼し、`storeshot.project.json` を編集、検証、書き出しできます。
- iOS / Android向けのPNG/JPEGを書き出せます。
- APIキーなしでローカル・デモ・CIが動きます。

## 画面

| エディタ | 参考ギャラリー | プロジェクトJSON |
| --- | --- | --- |
| ![Manual editor](docs/screenshots/studio-editor.png) | ![Reference Gallery](docs/screenshots/reference-gallery.png) | ![Project JSON](docs/screenshots/project-json.png) |

## クイックスタート

clone直後から起動まで:

```bash
git clone https://github.com/yuga-hashimoto/OpenStoreShot.git
cd OpenStoreShot
corepack enable
pnpm install
pnpm run doctor
pnpm demo
```

`http://127.0.0.1:3100` を開きます。

詳しい初回手順は [docs/QUICKSTART.md](docs/QUICKSTART.md) を見てください。
ローカルagentの選び方は [docs/AGENT_SETUP.md](docs/AGENT_SETUP.md) を見てください。

```bash
pnpm validate:demo
pnpm render:demo
pnpm quality
pnpm storeshot export examples/demo-project/storeshot.project.json --platform ios --locale ja-JP
pnpm storeshot export examples/demo-project/storeshot.project.json --platform android --locale ja-JP
```

## Codexとの使い方

OpenStoreShot本体はクラウドAIサービスではありません。基本の流れは次の通りです。

1. Studioでストア画像を見る。
2. 人間が少し手で直す。
3. 直したい内容をCodexに依頼する。
4. Codexが `storeshot.project.json` とローカル素材を編集する。
5. Codexが検証・レンダー・書き出しを実行する。
6. Studioで結果を確認する。

画像生成APIキーはブラウザに出しません。デモやテスト用の生成はローカルのplaceholderです。

`pnpm run doctor` はPATH上のローカルAI agent CLIを確認します。特定のagentを前提にはしません。

## 多言語対応

初期UIは `ja-JP`, `en`, `zh-CN`, `zh-TW`, `ko`, `es`, `fr`, `de`, `pt-BR` をサポートします。詳しくは [docs/I18N.md](docs/I18N.md) を見てください。

## 参考画像ポリシー

参考アプリの画像は、構成・文字量・色の雰囲気・端末配置などを分析するためだけに使います。競合アプリのスクショ、ロゴ、UI、キャラクター、独自表現、似すぎた構図はコピーしません。

## 開発

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

## コントリビュート

[CONTRIBUTING.md](CONTRIBUTING.md) を読んでください。翻訳、ストア仕様チェック、端末フレーム、Reference Gallery、レンダラー改善、アクセシビリティ改善を歓迎します。

## ライセンス

MIT。詳しくは [LICENSE](LICENSE) を見てください。
