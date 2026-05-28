import { expect, test } from "@playwright/test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const designAgentMocks = [
  { id: "codex", name: "Codex CLI", bin: "codex", recommended: true, supportsDesignGeneration: true, available: true, version: "codex-test" },
  { id: "claude", name: "Claude Code", bin: "claude", available: true, version: "claude-test" },
  { id: "antigravity", name: "Antigravity CLI", bin: "agy", supportsDesignGeneration: true, available: true, version: "agy-test" },
  { id: "gemini", name: "Gemini CLI", bin: "gemini", available: true, version: "gemini-test" }
];

function qualityProject(appName: string, category: string, slideCount: number, platforms: ("ios" | "android")[]) {
  const artboardFor = (platform: "ios" | "android", index: number) => {
    const width = platform === "ios" ? 1290 : 1080;
    const height = platform === "ios" ? 2796 : 1920;
    const deviceX = platform === "ios" ? 245 : 170;
    const deviceY = platform === "ios" ? 730 : 460;
    const deviceWidth = platform === "ios" ? 800 : 740;
    const deviceHeight = platform === "ios" ? 1710 : 1240;
    const prefix = `${platform}-${index + 1}`;
    return {
      id: `${prefix}-portrait`,
      width,
      height,
      platform,
      target: platform === "ios" ? "ios-6-9-portrait" : "play-phone-portrait",
      layers: [
        { id: `${prefix}-bg`, type: "background", fill: { type: "gradient", from: "#EFF6FF", to: "#F8FAFC", angle: 145 } },
        { id: `${prefix}-accent-band`, type: "shape", x: 0, y: Math.round(height * 0.62), width, height: Math.round(height * 0.22), radius: 0, fill: { type: "solid", color: "#DBEAFE" }, opacity: 0.72 },
        { id: `${prefix}-headline`, type: "text", text: `${appName}で\n迷わず進める`, x: 72, y: 130, width: width - 144, height: 210, fontSize: platform === "ios" ? 82 : 62, fontWeight: 850, lineHeight: 1.08, color: "#0F172A", align: index % 2 === 0 ? "center" : "left" },
        { id: `${prefix}-subcopy`, type: "text", text: `${category}の主要操作を、1画面で確認。`, x: 96, y: platform === "ios" ? 390 : 300, width: width - 192, height: 90, fontSize: platform === "ios" ? 38 : 30, fontWeight: 600, lineHeight: 1.25, color: "#334155", align: index % 2 === 0 ? "center" : "left" },
        { id: `${prefix}-proof-badge`, type: "shape", x: width - 360, y: platform === "ios" ? 548 : 368, width: 250, height: 70, radius: 35, fill: { type: "solid", color: "#0F172A" } },
        { id: `${prefix}-proof-text`, type: "text", text: "すぐ使える導線", x: width - 338, y: platform === "ios" ? 566 : 386, width: 206, height: 34, fontSize: platform === "ios" ? 28 : 22, fontWeight: 750, color: "#F8FAFC", align: "center" },
        { id: `${prefix}-device`, type: "device", device: platform === "ios" ? "iphone-6-9" : "android-phone", x: deviceX, y: deviceY, width: deviceWidth, height: deviceHeight, radius: platform === "ios" ? 86 : 54 },
        { id: `${prefix}-screen-card-main`, type: "shape", x: deviceX + 88, y: deviceY + 220, width: deviceWidth - 176, height: 245, radius: 42, fill: { type: "solid", color: "#FFFFFF" } },
        { id: `${prefix}-screen-title`, type: "text", text: "今日の注目", x: deviceX + 126, y: deviceY + 260, width: deviceWidth - 252, height: 58, fontSize: platform === "ios" ? 36 : 28, fontWeight: 800, color: "#0F172A", align: "left" },
        { id: `${prefix}-screen-chip`, type: "shape", x: deviceX + 126, y: deviceY + 350, width: 270, height: 64, radius: 32, fill: { type: "solid", color: "#E0F2FE" } },
        { id: `${prefix}-screen-chip-text`, type: "text", text: "提案を確認", x: deviceX + 152, y: deviceY + 368, width: 218, height: 30, fontSize: platform === "ios" ? 25 : 20, fontWeight: 750, color: "#0369A1", align: "center" },
        { id: `${prefix}-screen-row-1`, type: "shape", x: deviceX + 88, y: deviceY + 520, width: deviceWidth - 176, height: 96, radius: 28, fill: { type: "solid", color: "#F1F5F9" } },
        { id: `${prefix}-screen-row-2`, type: "shape", x: deviceX + 88, y: deviceY + 650, width: deviceWidth - 240, height: 96, radius: 28, fill: { type: "solid", color: "#ECFEFF" } }
      ]
    };
  };
  return {
    schemaVersion: "0.1.0",
    projectId: `${appName.toLowerCase()}-e2e`,
    name: `${appName} ストア画像`,
    brand: { colors: { primary: "#2563EB", background: "#F8FAFC", accent: "#06B6D4", ink: "#0F172A" }, fontFamily: "Inter", tone: "clear, useful" },
    app: { name: appName, category, shortDescription: `${category}向けアプリ`, targetAudience: "ja-JP users" },
    locales: ["ja-JP"],
    platforms,
    assets: [],
    generatedImageAssets: [],
    referenceInspirations: [
      { id: "ref-main", source: "fixture", platform: platforms[0], inspirationOnly: true, appName: `${appName} Reference`, patterns: { composition: "large detailed device with compact headline", colorMood: "clean light background with blue accent" } }
    ],
    slides: Array.from({ length: slideCount }, (_, index) => ({
      id: `slide-${String(index + 1).padStart(2, "0")}`,
      title: `${appName} ${index + 1}`,
      role: index === 0 ? "benefit" : index === slideCount - 1 ? "cta" : "feature",
      localeText: { "ja-JP": { title: `${appName} ${index + 1}` } },
      artboards: platforms.map((platform) => artboardFor(platform, index))
    })),
    exportTargets: platforms.map((platform) => ({
      id: `${platform}-ja`,
      platform,
      locale: "ja-JP",
      artboardId: `${platform}-1-portrait`,
      format: "png",
      outputDir: `exports/${platform}`
    }))
  };
}

test.beforeEach(async ({ page }) => {
  // Skip the first-run onboarding wizard so the studio loads directly.
  const demoDir = resolve("examples/demo-project");
  await page.addInitScript(() => {
    window.localStorage.setItem("openstoreshot.onboarding.dismissed", "true");
  });
  await page.addInitScript((dir) => {
    window.localStorage.setItem("openstoreshot.projectDir", dir);
  }, demoDir);
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
  await expect(gallery.getByText("文字量:", { exact: false }).first()).toBeVisible();
  await expect(gallery.getByText("端末:", { exact: false }).first()).toBeVisible();

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
    await page.close();
    rmSync(projectDir, { recursive: true, force: true });
  }
});

test("studio displays generated image assets from the chosen project and objectifies them", async ({ page }) => {
  const projectDir = mkdtempSync(join(tmpdir(), "storeshot-generated-assets-"));
  mkdirSync(join(projectDir, "assets/generated"), { recursive: true });
  writeFileSync(
    join(projectDir, "assets/generated/generated-visual-hero.svg"),
    `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><rect width="900" height="1200" fill="#FDF2F8"/><rect x="100" y="180" width="700" height="520" rx="64" fill="#EC4899"/><text x="450" y="480" text-anchor="middle" font-family="Arial" font-size="96" font-weight="900" fill="#fff">COUPON</text></svg>`,
    "utf8",
  );
  const demo = JSON.parse(
    readFileSync(resolve("examples/demo-project/storeshot.project.json"), "utf8"),
  );
  demo.name = "Generated Asset Display Test";
  demo.assets = [];
  demo.generatedImageAssets = [{
    id: "generated-visual-hero",
    type: "generated-image",
    path: "assets/generated/generated-visual-hero.svg",
    width: 900,
    height: 1200,
    alt: "generated coupon hero",
    generated: {
      provider: "test",
      model: "fixture",
      prompt: "coupon hero",
      createdAt: new Date().toISOString(),
      source: {}
    }
  }];
  demo.slides[0].artboards[0].layers.splice(1, 0, {
    id: "generated-visual-hero-layer",
    type: "image",
    assetId: "generated-visual-hero",
    x: 120,
    y: 520,
    width: 1040,
    height: 1200,
    radius: 56,
    rotation: 0,
    opacity: 1,
    letterSpacing: 0,
    locked: false,
    hidden: false,
    children: []
  });
  writeFileSync(join(projectDir, "storeshot.project.json"), JSON.stringify(demo), "utf8");

  await page.addInitScript((dir) => {
    window.localStorage.setItem("openstoreshot.onboarding.dismissed", "true");
    window.localStorage.setItem("openstoreshot.projectDir", dir);
  }, projectDir);

  try {
    await page.goto(`/?projectDir=${encodeURIComponent(projectDir)}`);
    await expect(page.getByText("Generated Asset Display Test")).toBeVisible();
    await expect(page.getByTestId("artboard").locator("img")).toHaveCount(1);
    await expect(page.getByTestId("artboard").locator("img")).toHaveAttribute("src", new RegExp(`dir=${encodeURIComponent(projectDir).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));

    await page.getByTestId("nav-assets").click();
    await expect(page.locator("img").filter({ hasNotText: "" }).first()).toBeVisible();
    await page.getByRole("button", { name: "画像をオブジェクト化" }).first().click();
    await expect(
      page.getByText(/編集可能なオブジェクトを作成しました|画像レイヤーとして配置しました/),
    ).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("nav-storeImages").click();
    await expect(page.getByText("オブジェクト画像").first()).toBeVisible();
  } finally {
    await page.close();
    rmSync(projectDir, { recursive: true, force: true });
  }
});

test("onboarding detects an existing project and opens it for editing", async ({ page }) => {
  const projectDir = mkdtempSync(join(tmpdir(), "storeshot-existing-"));
  const demo = JSON.parse(
    readFileSync(resolve("examples/demo-project/storeshot.project.json"), "utf8"),
  );
  demo.name = "既存プロジェクト読込テスト";
  demo.slides[0].title = "既存から開いた1枚目";
  demo.slides[0].localeText = { "ja-JP": { title: "既存から開いた1枚目" } };
  writeFileSync(join(projectDir, "storeshot.project.json"), JSON.stringify(demo), "utf8");
  await page.route("**/api/project", async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.has("dir")) {
      await route.continue();
      return;
    }
    await route.fulfill({ status: 404, json: { error: "not_found" } });
  });
  // Mock the OS-native folder picker to return a folder that already has a project.
  await page.route("**/api/fs", async (route) => {
    await route.fulfill({ json: { path: projectDir, writable: true, hasProject: true } });
  });
  // This test needs the wizard, so undo the beforeEach dismissal.
  await page.addInitScript(() => {
    window.localStorage.removeItem("openstoreshot.onboarding.dismissed");
    window.localStorage.removeItem("openstoreshot.projectDir");
  });

  try {
    await page.goto("/");
    await expect(page.getByTestId("onboarding-overlay")).toBeVisible();
    await page.getByTestId("onboarding-next").click(); // agent -> project
    await page.getByTestId("fs-pick-folder").click();
    await expect(page.getByTestId("existing-project-prompt")).toBeVisible();
    await page.getByTestId("use-existing-project").click();

    await expect(page.getByTestId("onboarding-overlay")).toBeHidden();
    await expect(page.getByText("既存プロジェクト読込テスト")).toBeVisible();
    await expect(page.getByRole("button", { name: /既存から開いた1枚目/ })).toBeVisible();
    await expect(page.evaluate(() => window.localStorage.getItem("openstoreshot.onboarding.dismissed"))).resolves.toBe("true");
  } finally {
    await page.close();
    rmSync(projectDir, { recursive: true, force: true });
  }
});

[
  {
    appName: "家計ナビ",
    category: "Finance",
    intent: "家計を自動分類して、今月の使いすぎをすぐ見つけたい。参考画像のように数字と信頼感を強める。",
    slideCount: 5,
    platforms: ["ios", "android"] as ("ios" | "android")[],
    reference: {
      id: "money-ref",
      platform: "ios",
      source: "app-store",
      appName: "Finance Reference",
      developer: "Reference Inc.",
      category: "Finance",
      rating: 4.8,
      storeUrl: "https://example.com/finance",
      screenshotUrls: ["https://example.com/finance-1.png", "https://example.com/finance-2.png"]
    }
  },
  {
    appName: "写真メモ",
    category: "Productivity",
    intent: "撮影したスクショからメモを作る。スクショ中心で、カード・検索・OCR結果が見えるデザインにする。",
    slideCount: 7,
    platforms: ["ios"] as ("ios" | "android")[],
    reference: {
      id: "memo-ref",
      platform: "ios",
      source: "app-store",
      appName: "Notes Reference",
      developer: "Reference Studio",
      category: "Productivity",
      rating: 4.7,
      storeUrl: "https://example.com/notes",
      screenshotUrls: ["https://example.com/notes-1.png"]
    }
  },
  {
    appName: "睡眠ケア",
    category: "Health & Fitness",
    intent: "睡眠記録をやさしく続ける。落ち着いた雰囲気、推移グラフ、朝の振り返りを強調する。",
    slideCount: 3,
    platforms: ["android"] as ("ios" | "android")[],
    reference: {
      id: "sleep-ref",
      platform: "android",
      source: "google-play",
      appName: "Sleep Reference",
      developer: "Reference Health",
      category: "Health & Fitness",
      rating: 4.6,
      storeUrl: "https://example.com/sleep",
      screenshotUrls: ["https://example.com/sleep-1.png", "https://example.com/sleep-2.png"]
    }
  }
].forEach((scenario) => {
  test(`setup guide generates a reference-aware store image project for ${scenario.category}`, async ({ page }) => {
    const projectDir = mkdtempSync(join(tmpdir(), "storeshot-setup-e2e-"));
    let generateBody: {
      agentId: string;
      projectDir: string;
      brief: { appName: string; intent: string; slideCount: number; platforms: ("ios" | "android")[]; locale: string };
      references: Array<{ id?: string; platform?: "ios" | "android"; screenshotUrls: string[]; patterns?: Record<string, string> }>;
    } | null = null;

    await page.addInitScript(() => {
      window.localStorage.removeItem("openstoreshot.onboarding.dismissed");
      window.localStorage.removeItem("openstoreshot.projectDir");
    });
    await page.route("**/api/project", async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.has("dir")) {
        await route.continue();
        return;
      }
      await route.fulfill({ status: 404, json: { error: "not_found" } });
    });
    await page.route("**/api/agents", async (route) => {
      await route.fulfill({ json: { agents: designAgentMocks } });
    });
    await page.route("**/api/fs", async (route) => {
      await route.fulfill({ json: { path: projectDir, writable: true, hasProject: false } });
    });
    await page.route("**/api/reference/image**", async (route) => {
      await route.fulfill({ status: 204 });
    });
    await page.route("**/api/reference?**", async (route) => {
      await route.fulfill({ json: { data: [scenario.reference] } });
    });
    await page.route("**/api/generate", async (route) => {
      generateBody = await route.request().postDataJSON();
      await route.fulfill({
        json: {
          ok: true,
          wrote: true,
          exitCode: 0,
          issues: [],
          project: qualityProject(scenario.appName, scenario.category, scenario.slideCount, scenario.platforms)
        }
      });
    });

    try {
      await page.goto("/");
      await expect(page.getByTestId("onboarding-overlay")).toBeVisible();
      await expect(page.getByTestId("onboarding-agent-codex")).toBeVisible();
      await expect(page.getByTestId("onboarding-agent-antigravity")).toBeVisible();
      await expect(page.getByTestId("onboarding-agent-claude")).toHaveCount(0);
      await expect(page.getByTestId("onboarding-agent-gemini")).toHaveCount(0);

      await page.getByTestId("onboarding-next").click();
      await page.getByTestId("fs-pick-folder").click();
      await expect(page.getByTestId("fs-selected-dir")).toContainText(projectDir);
      await page.getByTestId("onboarding-next").click();

      await page.getByTestId("brief-app-name").fill(scenario.appName);
      await page.getByTestId("brief-intent").fill(scenario.intent);
      await page.getByTestId("brief-slide-count").selectOption(String(scenario.slideCount));
      if (!scenario.platforms.includes("ios")) await page.getByTestId("brief-platform-ios").click();
      if (!scenario.platforms.includes("android")) await page.getByTestId("brief-platform-android").click();
      await page.getByTestId("brief-locale").selectOption("ja-JP");
      await page.getByTestId("onboarding-next").click();

      await expect(page.getByTestId(`reference-${scenario.reference.id}`)).toBeVisible();
      await page.getByTestId(`reference-${scenario.reference.id}`).click();
      await expect(page.getByTestId("reference-selected-count")).toContainText("1");
      await page.getByTestId("onboarding-next").click();

      await page.getByTestId("generate-run").click();
      await expect(page.getByTestId("onboarding-overlay")).toBeHidden();
      await expect(page.getByText(`${scenario.appName} ストア画像`)).toBeVisible();
      await expect(page.getByRole("button", { name: new RegExp(`${scenario.appName} 1`) })).toBeVisible();

      expect(generateBody).not.toBeNull();
      expect(generateBody!.agentId).toBe("codex");
      expect(generateBody!.projectDir).toBe(projectDir);
      expect(generateBody!.brief.appName).toBe(scenario.appName);
      expect(generateBody!.brief.intent).toBe(scenario.intent);
      expect(generateBody!.brief.slideCount).toBe(scenario.slideCount);
      expect(generateBody!.brief.platforms).toEqual(scenario.platforms);
      expect(generateBody!.brief.locale).toBe("ja-JP");
      expect(generateBody!.references[0]?.id).toBe(scenario.reference.id);
      expect(generateBody!.references[0]?.platform).toBe(scenario.reference.platform);
      expect(generateBody!.references[0]?.screenshotUrls).toEqual(scenario.reference.screenshotUrls);
      expect(generateBody!.references[0]?.patterns?.composition).toBeTruthy();
      expect(generateBody!.references[0]?.patterns?.colorMood).toBeTruthy();
      expect(generateBody!.references[0]?.patterns?.deviceFraming).toBeTruthy();
      expect(generateBody!.references[0]?.patterns?.recommendedPattern).toBeTruthy();
      expect(generateBody!.references[0]?.patterns?.heroMotif).toBeTruthy();
      expect(generateBody!.references[0]?.patterns?.appSurfaceDetails).toBeTruthy();
      expect(generateBody!.references[0]?.patterns?.benchmarkSignals).toContain("App Store top-10 benchmark");
    } finally {
      rmSync(projectDir, { recursive: true, force: true });
    }
  });
});
