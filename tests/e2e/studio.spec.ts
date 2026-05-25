import { expect, test } from "@playwright/test";

test("web app loads demo project and editor workflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("あなたのアプリ ストア画像制作")).toBeVisible();
  await expect(page.getByLabel("表示言語")).toBeVisible();
  await expect(page.getByRole("button", { name: /1 習慣づくりを、もっと簡単に/ })).toBeVisible();
  await expect(page.getByTestId("artboard")).toBeVisible();
  await page.getByRole("button", { name: /見出し/ }).click();
  await expect(page.getByTestId("inspector-title")).toContainText("見出し");
  await expect(page.getByTestId("export-button")).toBeVisible();
  await expect(page.getByText("Codex依頼キューに追加")).toBeVisible();
});
