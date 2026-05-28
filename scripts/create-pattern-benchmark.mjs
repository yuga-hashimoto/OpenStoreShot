#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const outputRoot = resolve(process.argv[2] ?? "/tmp/openstoreshot-pattern-benchmark");
const W = 1290;
const H = 2796;
const baseLayer = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };

const patterns = [
  ["unified-device-series", "統一端末", "#EAF5FF", "#F7FBFF", "#2563EB", "画面の価値を揃えて見せる"],
  ["three-panel-panorama", "連結パノラマ", "#E6FAFF", "#F7FEFF", "#06B6D4", "3枚でひとつの世界観"],
  ["card-led-dashboard", "カード主役", "#ECFEFF", "#F8FAFC", "#0F766E", "重要な数字を大きく"],
  ["object-cutout", "オブジェクト主役", "#FFF7ED", "#FFFBEB", "#F97316", "記憶に残る主役を置く"],
  ["editorial-photo", "編集ビジュアル", "#F5F3FF", "#FFF7ED", "#7C3AED", "雰囲気と機能を両立"],
  ["feature-infographic", "手順図解", "#F0FDF4", "#F7FEE7", "#16A34A", "流れを一瞬で伝える"],
  ["multi-screen-collage", "複数画面", "#EFF6FF", "#F8FAFC", "#2563EB", "複数状態を比較する"],
  ["message-conversation", "会話ストーリー", "#FDF2F8", "#FFF1F2", "#DB2777", "やり取りで価値を見せる"],
  ["commerce-coupon", "クーポン訴求", "#FFFBEB", "#FFF7ED", "#EA580C", "買う理由を明快に"],
  ["dark-premium", "ダーク高級感", "#07111F", "#111827", "#22D3EE", "プロ向けの深さを出す"]
];

const solid = (color) => ({ type: "solid", color });
const grad = (from, to, angle = 145) => ({ type: "gradient", from, to, angle });
const text = (id, value, x, y, width, height, fontSize, color, align = "left", fontWeight = 850) => ({
  ...baseLayer,
  id,
  type: "text",
  text: value,
  x,
  y,
  width,
  height,
  fontSize,
  fontWeight,
  lineHeight: 1.04,
  color,
  align
});
const shape = (id, x, y, width, height, fill, radius = 36, opacity = 1) => ({
  ...baseLayer,
  id,
  type: "shape",
  x,
  y,
  width,
  height,
  fill,
  radius,
  opacity
});
const device = (id, x, y, width = 760, height = 1640) => ({
  ...baseLayer,
  id,
  type: "device",
  device: "iphone-6-9",
  x,
  y,
  width,
  height,
  radius: 84
});

function header(name, tagline, from, to, accent, dark) {
  const ink = dark ? "#F8FAFC" : "#0F172A";
  return [
    { ...baseLayer, id: "bg", type: "background", fill: grad(from, to, 142) },
    shape("series-top-rule", 0, 0, W, 28, solid(accent), 0),
    shape("series-title-mark", 96, 142, 86, 16, solid(accent), 8),
    text("headline", `${name}\n${tagline}`, 96, 182, 1098, 210, 74, ink, "left", 880),
    text("subtitle", "同じ余白・同じ書体・同じアクセントで統一", 96, 430, 980, 54, 30, dark ? "#CBD5E1" : "#475569", "left", 650)
  ];
}

function screenDetails(prefix, x, y, width, accent, dark) {
  const card = dark ? "#111827" : "#FFFFFF";
  const muted = dark ? "#1F2937" : "#EAF2F8";
  const ink = dark ? "#E2E8F0" : "#0F172A";
  return [
    shape(`${prefix}-nav`, x + 64, y + 96, width - 128, 92, solid(muted), 34),
    text(`${prefix}-nav-title`, "Dashboard", x + 98, y + 122, width - 196, 36, 28, ink, "left", 760),
    shape(`${prefix}-hero-card`, x + 64, y + 250, width - 128, 330, solid(card), 42),
    shape(`${prefix}-hero-accent`, x + 104, y + 315, 220, 40, solid(accent), 20),
    shape(`${prefix}-hero-line-1`, x + 104, y + 400, width - 300, 24, solid(muted), 12),
    shape(`${prefix}-hero-line-2`, x + 104, y + 464, width - 380, 22, solid(muted), 11),
    shape(`${prefix}-list-card`, x + 64, y + 660, width - 128, 500, solid(card), 42),
    shape(`${prefix}-chip-a`, x + 110, y + 735, 188, 58, solid(accent), 29),
    shape(`${prefix}-chip-b`, x + 330, y + 735, 180, 58, solid(muted), 29),
    ...[0, 1, 2].flatMap((index) => [
      shape(`${prefix}-row-${index}`, x + 110, y + 850 + index * 100, width - 260, 26, solid(index === 1 ? accent : muted), 13, index === 1 ? 0.72 : 1),
      shape(`${prefix}-dot-${index}`, x + width - 200, y + 842 + index * 100, 44, 44, solid(index === 1 ? accent : muted), 22)
    ]),
    shape(`${prefix}-bottom-panel`, x + 64, y + 1260, width - 128, 250, solid(card), 42),
    shape(`${prefix}-bottom-bar-a`, x + 116, y + 1350, width - 330, 28, solid(accent), 14, 0.76),
    shape(`${prefix}-bottom-bar-b`, x + 116, y + 1430, width - 430, 24, solid(muted), 12)
  ];
}

function phoneSlide(index, id, name, tagline, from, to, accent, dark) {
  const dx = 265;
  const dy = 650;
  const dw = 760;
  return {
    id: `slide-0${index}`,
    title: `${name} ${index}`,
    role: index === 1 ? "benefit" : "cta",
    localeText: {},
    artboards: [{
      id: `ios-${id}-${index}`,
      width: W,
      height: H,
      platform: "ios",
      target: "ios-6-9-portrait",
      layers: [
        ...header(name, tagline, from, to, accent, dark),
        shape("series-backdrop", 96, 560, 1098, 1780, grad(to, from, 96), 54, dark ? 0.24 : 0.52),
        device("device", dx, dy, dw),
        ...screenDetails("device", dx, dy, dw, accent, dark),
        shape("floating-badge", 815, 585, 280, 78, solid(accent), 39),
        text("floating-badge-label", index === 1 ? "一目で理解" : "次に進める", 855, 607, 200, 36, 28, dark ? "#07111F" : "#FFFFFF", "center", 820)
      ]
    }]
  };
}

function middleSlide(id, name, tagline, from, to, accent, dark) {
  const ink = dark ? "#F8FAFC" : "#0F172A";
  const layers = [
    ...header(name, tagline, from, to, accent, dark),
    shape("series-backdrop", 96, 560, 1098, 1780, grad(to, from, 96), 54, dark ? 0.24 : 0.52)
  ];
  if (id === "three-panel-panorama") {
    layers.push(shape("panorama-ribbon-2", -420, 820, 2200, 540, grad("#BAE6FD", "#A7F3D0", 105), 88, 0.86));
    layers.push(shape("panorama-card-2", 260, 780, 820, 500, solid("#FFFFFF"), 48));
    layers.push(shape("panorama-flow-card", 330, 1480, 660, 260, solid("#FFFFFF"), 44));
  } else if (id === "multi-screen-collage") {
    layers.push(device("device-left", 125, 760, 555, 1200), ...screenDetails("left", 125, 760, 555, accent, dark).slice(0, 12));
    layers.push(device("device-right", 625, 690, 590, 1280), ...screenDetails("right", 625, 690, 590, accent, dark).slice(0, 12));
  } else {
    const panelFill = dark ? solid("#101827") : solid("#FFFFFF");
    layers.push(shape(`${id}-hero-surface`, 145, 650, 1000, 990, panelFill, 58));
    if (id === "object-cutout") {
      layers.push(shape("object-halo", 395, 770, 500, 500, grad("#FED7AA", "#FEF3C7", 120), 250));
      layers.push(shape("object-main", 455, 850, 380, 380, solid(accent), 96));
    } else if (id === "commerce-coupon") {
      layers.push(shape("coupon-strip", 145, 650, 1000, 150, solid(accent), 58));
      layers.push(shape("coupon-ticket-hole-l", 115, 980, 80, 80, solid(to), 40));
      layers.push(shape("coupon-ticket-hole-r", 1095, 980, 80, 80, solid(to), 40));
    } else if (id === "feature-infographic") {
      for (let i = 0; i < 3; i++) {
        layers.push(shape(`step-circle-${i + 1}`, 230, 800 + i * 250, 116, 116, solid(accent), 58));
        layers.push(text(`step-num-${i + 1}`, String(i + 1), 269, 829 + i * 250, 40, 46, 42, "#FFFFFF", "center", 850));
        layers.push(shape(`step-card-${i + 1}`, 390, 792 + i * 250, 630, 132, solid(dark ? "#172033" : "#ECFDF5"), 34));
      }
    } else if (id === "message-conversation") {
      for (let i = 0; i < 7; i++) layers.push(shape(`bubble-${i}`, 220 + (i % 2) * 210, 760 + i * 116, 690 - (i % 2) * 180, 78, solid(i % 2 ? "#FCE7F3" : "#E0F2FE"), 39));
    } else if (id === "editorial-photo") {
      layers.push(shape("generated-image-hero", 245, 760, 800, 620, grad("#DDD6FE", "#FDE68A", 125), 78));
      layers.push(shape("subject-cutout", 500, 865, 290, 360, solid(accent), 145, 0.76));
    } else if (id === "dark-premium") {
      layers.push(shape("terminal-glow", 225, 770, 840, 130, solid(accent), 65, 0.22));
      layers.push(shape("log-panel", 240, 960, 810, 460, solid("#0B1220"), 38));
    } else {
      layers.push(shape("metric-a", 225, 770, 380, 260, solid(to), 36));
      layers.push(shape("metric-b", 665, 770, 360, 260, solid(dark ? "#0B1220" : "#FFFFFF"), 36));
      layers.push(shape("chart-panel", 225, 1110, 800, 360, solid(dark ? "#0F172A" : "#EEF6FF"), 44));
    }
  }
  for (let i = 0; i < 9; i++) {
    layers.push(shape(`shared-detail-${i}`, 230 + (i % 2) * 420, 820 + i * 92, 330, 34, solid(i % 3 === 0 ? accent : dark ? "#334155" : "#CBD5E1"), 17, i % 3 === 0 ? 0.86 : 1));
  }
  layers.push(text("card-caption", "スマホ画面だけに頼らず、価値を大きく見せる", 205, 1830, 880, 70, 38, ink, "center", 760));
  return {
    id: "slide-02",
    title: `${name} 2`,
    role: id === "three-panel-panorama" ? "panorama" : "feature",
    localeText: {},
    artboards: [{ id: `ios-${id}-2`, width: W, height: H, platform: "ios", target: "ios-6-9-portrait", layers }]
  };
}

async function main() {
  await mkdir(outputRoot, { recursive: true });
  for (const [id, name, from, to, accent, tagline] of patterns) {
    const dark = id === "dark-premium";
    const slides = [
      phoneSlide(1, id, name, tagline, from, to, accent, dark),
      middleSlide(id, name, tagline, from, to, accent, dark),
      phoneSlide(3, id, name, tagline, from, to, accent, dark)
    ];
    if (id === "three-panel-panorama") {
      slides[0].artboards[0].layers.splice(6, 0, shape("panorama-ribbon-1", 140, 820, 2200, 540, grad("#BAE6FD", "#A7F3D0", 105), 88, 0.86));
      slides[2].artboards[0].layers.splice(6, 0, shape("panorama-ribbon-3", -980, 820, 2200, 540, grad("#BAE6FD", "#A7F3D0", 105), 88, 0.86));
    }
    const project = {
      schemaVersion: "0.1.0",
      projectId: `pattern-${id}`,
      name: `${name} サンプル`,
      brand: { colors: { primary: accent, background: from, accent, ink: dark ? "#F8FAFC" : "#0F172A" }, fontFamily: "Inter", tone: "publishable store screenshot" },
      app: { name, category: "Productivity", shortDescription: "10 pattern quality sample", targetAudience: "App Store reviewers" },
      locales: ["ja-JP"],
      platforms: ["ios"],
      assets: [],
      generatedImageAssets: [],
      referenceInspirations: [{ id: `ref-${id}`, source: "local-pattern-catalog", platform: "ios", inspirationOnly: true, patterns: { composition: id === "three-panel-panorama" ? "3枚連結パノラマ" : id, seriesSystem: "same grid, type scale, palette, and motif" } }],
      slides,
      exportTargets: [1, 2, 3].map((index) => ({ id: `ios-ja-${index}`, platform: "ios", locale: "ja-JP", artboardId: `ios-${id}-${index}`, format: "png", outputDir: "exports/ios" })),
      validationResults: []
    };
    const dir = join(outputRoot, id);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "storeshot.project.json"), `${JSON.stringify(project, null, 2)}\n`);
  }
  console.log(outputRoot);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
