#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const inputPath = resolve(process.argv[2] ?? "/tmp/appstore-top10-current.json");
const outputRoot = resolve(process.argv[3] ?? `/tmp/openstoreshot-setup-generate-${Date.now()}`);
const baseUrl = process.env.OPENSTORESHOT_BASE_URL ?? "http://localhost:3000";
const agentId = process.env.OPENSTORESHOT_AGENT_ID ?? "codex";
const limit = Number(process.env.OPENSTORESHOT_LIMIT ?? "10");
const startIndex = Number(process.env.OPENSTORESHOT_START ?? "0");
const pollMs = Number(process.env.OPENSTORESHOT_POLL_MS ?? "5000");

const safe = (value) => value.replace(/[\\/:*?"<>|\s]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

function patternsFor(app) {
  const category = String(app.category ?? "").toLowerCase();
  const name = `${app.appName ?? ""} ${app.developer ?? ""}`.toLowerCase();
  if (/threads/.test(name)) {
    return {
      recommendedPattern: "dark-premium + message-conversation",
      heroMotif: "dark feed stack, conversation cards, profile chips, reply badges, and restrained high-contrast accent",
      appSurfaceDetails: "inside or around the device show fictional post cards, reply rows, profile chips, notification badges, and topic threads",
      benchmarkSignals: "App Store top-10 benchmark: unified dark feed campaign, dense fictional social UI, strong silhouette, one non-phone-led feed board"
    };
  }
  if (/setlog|social|sns|feed|動画|写真/.test(`${name} ${category}`)) {
    return {
      recommendedPattern: "three-panel-panorama + multi-screen-collage",
      heroMotif: "continuous photo/video collage, sticker chips, social feed cards, and a phone crossing the wide visual",
      appSurfaceDetails: "inside or around the device show feed cards, media thumbnails, reaction chips, profile rows, and share controls",
      benchmarkSignals: "App Store top-10 benchmark: unified campaign, panorama or collage rhythm, dense fictional social UI, strong silhouette"
    };
  }
  if (/livesoul|music|live|audio|radio|concert|音楽|ライブ|配信/.test(`${name} ${category}`)) {
    return {
      recommendedPattern: "audio-live-gradient + message-conversation",
      heroMotif: "neon live stage or album card, waveform bars, now-playing surface, live badge, and notification stack",
      appSurfaceDetails: "inside or around the device show now-playing card, playlist tiles, waveform/equalizer, live chat or notification rows, and join/listen CTA",
      benchmarkSignals: "App Store top-10 benchmark: dark premium silhouette, repeated waveform motif, dense fictional app UI, one non-phone-led slide"
    };
  }
  if (/chatgpt|gemini|claude|anthropic|ai|assistant|生成|会話|チャット/.test(name)) {
    return {
      recommendedPattern: "message-conversation + object-cutout",
      heroMotif: "chat thread plus generated image/output card; the output must be the visible hero on at least one slide",
      appSurfaceDetails: "inside the device show prompt input, answer bubbles, generated preview, summary card, composer, and action button",
      benchmarkSignals: "App Store top-10 benchmark: AI-specific output card, not a generic phone, with at least one large generated visual"
    };
  }
  if (/chrome|browser|ブラウザ|検索/.test(name)) {
    return {
      recommendedPattern: "feature-infographic + unified-device-series",
      heroMotif: "search bar and result cards with lens/search/sync/security tiles",
      appSurfaceDetails: "inside the device show search pill, result card, image thumbnail, shortcuts, article rows, and bottom tabs",
      benchmarkSignals: "App Store top-10 benchmark: clear browser UI, feature infographic, shared blue grid, and credible utility details"
    };
  }
  if (/31club|サーティワン|coupon|クーポン|loyalty|ポイント/.test(name) || category.includes("food") || category.includes("drink")) {
    return {
      recommendedPattern: "commerce-coupon + object-cutout",
      heroMotif: "coupon ticket, barcode/member card, points or discount number, and bright retail confetti",
      appSurfaceDetails: "inside or around the device show coupon list, member barcode, point balance, ticket cards, and redemption CTA",
      benchmarkSignals: "App Store top-10 benchmark: bright retail campaign, large safe offer card, ticket surfaces, and not only a phone"
    };
  }
  if (/myna|マイナ|portal|ポータル|行政|official|government/.test(name)) {
    return {
      recommendedPattern: "card-led-dashboard + feature-infographic",
      heroMotif: "ID card, QR/login panel, official procedure cards, timeline, and blue CTA",
      appSurfaceDetails: "inside or around the device show account/status list, QR/login, procedure steps, notification card, and CTA",
      benchmarkSignals: "App Store top-10 benchmark: official blue trust system, procedure clarity, ID/QR surfaces, dense but calm UI"
    };
  }
  if (category.includes("finance") || /bank|銀行|通帳|finance/.test(name)) {
    return {
      recommendedPattern: "card-led-dashboard + feature-infographic",
      heroMotif: "large balance number, graph, transaction list, and trust/proof cards",
      appSurfaceDetails: "inside or around the device show balance card, graph, transaction rows, transfer/status chips, and update badge",
      benchmarkSignals: "App Store top-10 benchmark: big readable finance metric, trusted green/blue palette, graph proof, and transaction density"
    };
  }
  return {
    recommendedPattern: "unified-device-series + card-led-dashboard",
    heroMotif: "large app-surface fragment or generated visual that is specific to the app",
    appSurfaceDetails: "inside the device show app-specific cards, tabs, controls, preview panels, and lower-half content",
    benchmarkSignals: "App Store top-10 benchmark: strong first-glance silhouette, repeated series system, dense fictional app UI, and one non-phone-led slide"
  };
}

function intentFor(app, patterns) {
  return [
    `${app.appName} のApp Store上位参考画像に近い品質の3枚構成。`,
    `推奨パターンは ${patterns.recommendedPattern}。`,
    `主役モチーフ: ${patterns.heroMotif}。`,
    `アプリ画面詳細: ${patterns.appSurfaceDetails}。`,
    "単なるスマホと文字ではなく、参考カテゴリ固有の画像/カード/バッジ/ワークフローを見せる。",
    "3枚が同じ広告キャンペーンに見えるよう、背景、文字、余白、アクセント、端末スケールを統一する。"
  ].join("\n");
}

async function jsonFetch(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${response.status} non-json response from ${url}: ${text.slice(0, 200)}`);
  }
  if (!response.ok) throw new Error(`${response.status} response from ${url}: ${JSON.stringify(json).slice(0, 400)}`);
  return json;
}

async function runGenerate(app, index) {
  const slug = `${String(index + 1).padStart(2, "0")}-${safe(app.appName)}`;
  const projectDir = join(outputRoot, slug);
  await mkdir(projectDir, { recursive: true });
  const patterns = patternsFor(app);
  const request = {
    agentId,
    projectDir,
    hasProject: false,
    brief: {
      appName: app.appName,
      intent: intentFor(app, patterns),
      slideCount: 3,
      platforms: ["ios"],
      locale: "ja-JP"
    },
    references: [{
      id: `ref-${safe(app.id ?? app.appName)}`,
      platform: "ios",
      appName: app.appName,
      developer: app.developer,
      category: app.category,
      rating: app.rating,
      source: app.source ?? "appstore-top10",
      storeUrl: app.storeUrl,
      screenshotUrls: app.screenshotUrls ?? [],
      patterns
    }]
  };
  await writeFile(join(projectDir, "request.json"), `${JSON.stringify(request, null, 2)}\n`);

  const started = Date.now();
  const start = await jsonFetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
  await writeFile(join(projectDir, "job-start.json"), `${JSON.stringify(start, null, 2)}\n`);
  if (!start.jobId) throw new Error(`${app.appName}: missing jobId`);

  let latest = start;
  while (latest.running) {
    await new Promise((resolveWait) => setTimeout(resolveWait, pollMs));
    latest = await jsonFetch(`${baseUrl}/api/generate?jobId=${encodeURIComponent(start.jobId)}`);
    const elapsed = Math.round((Date.now() - started) / 1000);
    const lastLog = latest.logs?.at(-1) ?? "";
    console.log(`${index + 1}. ${app.appName}: ${latest.status} ${elapsed}s ${lastLog}`);
    await writeFile(join(projectDir, "job-poll.json"), `${JSON.stringify(latest, null, 2)}\n`);
  }

  const projectPath = join(projectDir, "storeshot.project.json");
  const rendered = existsSync(projectPath);
  if (rendered) {
    execFileSync("pnpm", ["-s", "storeshot", "validate", projectPath], { cwd: resolve(import.meta.dirname, ".."), stdio: "inherit" });
    execFileSync("pnpm", ["-s", "storeshot", "render", projectPath], { cwd: resolve(import.meta.dirname, ".."), stdio: "inherit" });
  }

  return {
    appName: app.appName,
    projectDir,
    ok: latest.ok === true,
    status: latest.status,
    durationSec: Math.round((latest.durationMs ?? Date.now() - started) / 1000),
    issueCount: latest.issues?.length ?? 0,
    errors: (latest.issues ?? []).filter((issue) => issue.severity === "error"),
    warnings: (latest.issues ?? []).filter((issue) => issue.severity === "warning"),
    wrote: latest.wrote,
    rendered
  };
}

async function createContactSheet(summary) {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    sharp = (await import("../node_modules/.pnpm/sharp@0.33.5/node_modules/sharp/lib/index.js")).default;
  }
  const rows = [];
  const rowWidth = 1550;
  const shotHeight = 560;
  const labelWidth = 300;
  const gap = 14;
  const escapeXml = (value) => String(value).replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]);

  for (const result of summary.results) {
    const exportDir = join(result.projectDir, "exports");
    if (!existsSync(exportDir)) continue;
    const files = readdirSync(exportDir).filter((file) => file.endsWith(".png")).sort().map((file) => join(exportDir, file));
    if (!files.length) continue;
    const thumbs = [];
    for (const file of files.slice(0, 3)) {
      thumbs.push(await sharp(file).resize({ height: shotHeight }).jpeg({ quality: 88 }).toBuffer());
    }
    const meta = await sharp(thumbs[0]).metadata();
    const shotWidth = meta.width ?? 260;
    const label = `${result.ok ? "OK" : "NG"} ${result.appName} / ${result.durationSec}s / errors ${result.errors.length}`;
    const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${rowWidth}" height="${shotHeight + 48}"><rect width="100%" height="100%" fill="#E5EBF2"/><text x="18" y="32" font-family="Arial" font-size="24" font-weight="800" fill="#0F172A">${escapeXml(label)}</text></svg>`);
    const composites = [{ input: svg, left: 0, top: 0 }];
    thumbs.forEach((input, thumbIndex) => composites.push({ input, left: labelWidth + thumbIndex * (shotWidth + gap), top: 42 }));
    rows.push(await sharp({ create: { width: rowWidth, height: shotHeight + 48, channels: 3, background: "#E5EBF2" } }).composite(composites).jpeg({ quality: 90 }).toBuffer());
  }
  if (!rows.length) return undefined;
  const rowMeta = await sharp(rows[0]).metadata();
  const output = join(outputRoot, "setup-generate-contact.jpg");
  await sharp({ create: { width: rowMeta.width ?? rowWidth, height: (rowMeta.height ?? shotHeight + 48) * rows.length, channels: 3, background: "#E5EBF2" } })
    .composite(rows.map((input, rowIndex) => ({ input, left: 0, top: rowIndex * (rowMeta.height ?? shotHeight + 48) })))
    .jpeg({ quality: 90 })
    .toFile(output);
  return output;
}

async function main() {
  const data = JSON.parse(await readFile(inputPath, "utf8")).data.slice(startIndex, startIndex + limit);
  await mkdir(outputRoot, { recursive: true });
  const summary = { startedAt: new Date().toISOString(), baseUrl, agentId, inputPath, outputRoot, startIndex, limit, results: [] };
  for (const [offset, app] of data.entries()) {
    const index = startIndex + offset;
    const result = await runGenerate(app, index).catch((error) => ({
      appName: app.appName,
      projectDir: join(outputRoot, `${String(index + 1).padStart(2, "0")}-${safe(app.appName)}`),
      ok: false,
      status: "exception",
      durationSec: 0,
      issueCount: 0,
      errors: [{ severity: "error", message: error instanceof Error ? error.message : String(error) }],
      warnings: [],
      wrote: false,
      rendered: false
    }));
    summary.results.push(result);
    await writeFile(join(outputRoot, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  }
  summary.finishedAt = new Date().toISOString();
  summary.contactSheet = await createContactSheet(summary);
  await writeFile(join(outputRoot, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(JSON.stringify(summary, null, 2));
  if (summary.results.some((result) => !result.ok || result.errors.length > 0)) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
