import { expect, test } from "@playwright/test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

test.beforeEach(async ({ page }) => {
  // Skip the first-run onboarding wizard so the studio loads directly.
  await page.addInitScript(() => {
    window.localStorage.setItem("openstoreshot.onboarding.dismissed", "true");
  });
});

test("web app loads demo project and editor workflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("あなたのアプリ ストア画像制作")).toBeVisible();
  await expect(page.getByLabel("表示言語")).toBeVisible();
  await expect(page.getByRole("button", { name: /1 習慣づくりを、もっと簡単に/ })).toBeVisible();
  await expect(page.getByTestId("artboard")).toBeVisible();
  await page.getByRole("button", { name: /見出し/ }).click();
  await expect(page.getByTestId("inspector-title")).toContainText("見出し");
  await expect(page.getByTestId("export-button")).toBeVisible();
  await expect(page.getByText(/への依頼を保存/)).toBeVisible();
});

test("reference inspiration flow uses real per-app hints", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await page.getByTestId("nav-references").click();

  const gallery = page.getByTestId("reference-gallery");
  await expect(gallery).toBeVisible();
  await expect(gallery.getByText("抽出するヒント").first()).toBeVisible({ timeout: 15_000 });
  await expect(
    gallery.getByText("1枚目は短い価値訴求、端末は中央、背景は明るめ、長文は避ける"),
  ).toHaveCount(0);
  await expect(gallery.getByText("構成:", { exact: false }).first()).toBeVisible();
  await expect(gallery.getByText("情報設計:", { exact: false }).first()).toBeVisible();

  await page.getByPlaceholder("例: ChatGPT, Notion, 家計簿").fill("ChatGPT");
  await page.getByLabel("件数").selectOption("25");
  await page.getByRole("button", { name: "検索する" }).click();
  await expect(gallery.getByText("ChatGPT").first()).toBeVisible({ timeout: 60_000 });
  await expect(gallery.getByText(/現在: App Store \/ 検索「ChatGPT」 \/ 25件/)).toBeVisible();

  await page.getByRole("button", { name: "ランキングに戻す" }).click();
  await expect(gallery.getByText("トップ無料ランキング")).toBeVisible({ timeout: 20_000 });

  await gallery.getByText("構成だけ参考").first().click();
  await expect(page.getByText("構成ヒントを修正指示に追加しました")).toBeVisible();
  await expect(page.getByText("参考画像はコピーせず")).toBeVisible();
  await expect(page.locator("textarea").last()).toHaveValue(/構成:/);
  await expect(page.locator("textarea").last()).toHaveValue(/コピーせず/);
});

test("creator can edit, upload a screenshot, objectify an asset, and export", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto("/");

  await page.getByRole("button", { name: /見出し/ }).click();
  await page.locator("textarea").first().fill("実ユースケース\n編集済み");
  await expect(page.getByTestId("artboard")).toContainText("実ユースケース");

  await page.getByRole("button", { name: /端末モックアップ/ }).click();
  await page.getByTestId("nav-assets").click();
  await page
    .locator("input[type='file']")
    .setInputFiles(resolve("examples/demo-project/assets/mock-gradient-01.svg"));
  await expect(page.getByText("アップロードしました")).toBeVisible({ timeout: 15_000 });

  await page.getByTestId("nav-storeImages").click();
  await expect(page.getByTestId("artboard").locator("img")).toHaveCount(1);

  await page.getByTestId("nav-assets").click();
  await page.getByRole("button", { name: "画像をオブジェクト化" }).first().click();
  await expect(
    page.getByText(/編集可能なオブジェクトを作成しました|画像レイヤーとして配置しました/),
  ).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("nav-storeImages").click();
  await expect(page.getByText("オブジェクト画像").first()).toBeVisible();

  await page.getByTestId("export-button").click();
  await expect(page.getByText(/書き出し完了: \d+枚/)).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText(".png").first()).toBeVisible();
});

test("studio loads the chosen project directory after generation", async ({ page }) => {
  // Simulate a project the agent generated into a chosen folder.
  const projectDir = mkdtempSync(join(tmpdir(), "storeshot-e2e-"));
  const demo = JSON.parse(
    readFileSync(resolve("examples/demo-project/storeshot.project.json"), "utf8"),
  );
  demo.name = "E2E 生成プロジェクト";
  demo.slides[0].title = "生成された1枚目";
  demo.slides[0].localeText = { "ja-JP": { title: "生成された1枚目" } };
  writeFileSync(join(projectDir, "storeshot.project.json"), JSON.stringify(demo), "utf8");

  await page.addInitScript((dir) => {
    window.localStorage.setItem("openstoreshot.onboarding.dismissed", "true");
    window.localStorage.setItem("openstoreshot.projectDir", dir);
  }, projectDir);

  try {
    await page.goto("/");
    await expect(page.getByText("E2E 生成プロジェクト")).toBeVisible();
    await expect(page.getByRole("button", { name: /生成された1枚目/ })).toBeVisible();
  } finally {
    rmSync(projectDir, { recursive: true, force: true });
  }
});
