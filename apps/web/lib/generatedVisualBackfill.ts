import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Artboard, Layer, StoreShotProject } from "@openstoreshot/core";

const baseLayer = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };

function area(layer: Pick<Layer, "width" | "height">, artboard: Artboard) {
  return (layer.width ?? artboard.width) * (layer.height ?? artboard.height);
}

function strongVisualText(project: StoreShotProject) {
  return [
    project.app.name,
    project.app.category,
    ...project.referenceInspirations.flatMap((ref) => Object.values(ref.patterns))
  ].join(" ").toLowerCase();
}

function needsStrongVisual(project: StoreShotProject) {
  return /photo|image|visual|object|coupon|editorial|feed|panorama|collage|logo|social|food|drink|finance|生成|画像|写真|クーポン|紙面|人物|フィード|パノラマ|コラージュ|金融|銀行|自販機/.test(strongVisualText(project));
}

function hasGeneratedHero(project: StoreShotProject) {
  const generatedIds = new Set(project.generatedImageAssets.map((asset) => asset.id));
  const minArea = visualKind(project) === "ai" ? 0.18 : 0.1;
  return project.slides.some((slide) =>
    slide.artboards.some((artboard) =>
      artboard.layers.some((layer) => layer.type === "image" && layer.assetId && generatedIds.has(layer.assetId) && area(layer, artboard) >= artboard.width * artboard.height * minArea)
    )
  );
}

function visualKind(project: StoreShotProject) {
  const text = strongVisualText(project);
  if (/coupon|food|drink|クーポン|紙面|サーティワン/.test(text)) return "coupon";
  if (/feed|social|threads|フィード|交流|sns/.test(text)) return "feed";
  if (/finance|bank|銀行|金融|残高|通帳/.test(text)) return "finance";
  if (/official|utility|government|行政|手続|ポータル/.test(text)) return "official";
  if (/\bai\b|assistant|chat|生成|claude|chatgpt|gemini/.test(text)) return "ai";
  if (/panorama|collage|photo|写真|コラージュ/.test(text)) return "collage";
  return "cards";
}

function heroSvg(project: StoreShotProject, kind: string) {
  const accent = project.brand.colors.accent ?? project.brand.colors.primary ?? "#0EA5E9";
  const primary = project.brand.colors.primary ?? accent;
  const ink = project.brand.colors.ink ?? "#0F172A";
  if (kind === "coupon") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><rect width="900" height="1200" rx="72" fill="#fff7ed"/><g fill="#fde68a">${Array.from({ length: 42 }, (_, i) => `<circle cx="${35 + (i * 97) % 830}" cy="${45 + (i * 151) % 1080}" r="${10 + (i % 3) * 5}"/>`).join("")}</g><rect x="90" y="170" width="720" height="560" rx="62" fill="#fdf2f8" stroke="${accent}" stroke-width="14" transform="rotate(-5 450 450)"/><circle cx="100" cy="450" r="40" fill="#fff7ed"/><circle cx="800" cy="450" r="40" fill="#fff7ed"/><text x="450" y="340" text-anchor="middle" font-family="Arial" font-size="74" font-weight="900" fill="#831843">アプリ限定</text><text x="450" y="485" text-anchor="middle" font-family="Arial" font-size="138" font-weight="900" fill="${accent}">OFF</text><rect x="220" y="570" width="460" height="92" rx="46" fill="${accent}"/><text x="450" y="630" text-anchor="middle" font-family="Arial" font-size="44" font-weight="900" fill="#fff">COUPON</text><rect x="130" y="820" width="285" height="170" rx="34" fill="#fff"/><rect x="485" y="820" width="285" height="170" rx="34" fill="#fff"/><text x="272" y="925" text-anchor="middle" font-family="Arial" font-size="58" font-weight="900" fill="${accent}">10%</text><text x="627" y="925" text-anchor="middle" font-family="Arial" font-size="48" font-weight="900" fill="${primary}">特典</text></svg>`;
  }
  if (kind === "feed") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><rect width="900" height="1200" rx="72" fill="#050505"/><text x="80" y="135" font-family="Arial" font-size="64" font-weight="900" fill="#fff">新しい話題を発見</text><g>${Array.from({ length: 7 }, (_, i) => `<rect x="${105 + (i % 2) * 115}" y="${210 + i * 118}" width="${610 - (i % 3) * 95}" height="82" rx="41" fill="${i % 3 === 0 ? accent : "#ffffff"}"/><circle cx="${150 + (i % 2) * 115}" cy="${251 + i * 118}" r="24" fill="${i % 3 === 0 ? "#111" : accent}"/>`).join("")}</g><rect x="140" y="875" width="620" height="220" rx="46" fill="#111827" stroke="${accent}" stroke-width="8"/><path d="M205 970h420M205 1030h310" stroke="#fff" stroke-width="26" stroke-linecap="round"/></svg>`;
  }
  if (kind === "finance") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><rect width="900" height="1200" rx="72" fill="#ecfdf5"/><text x="450" y="185" text-anchor="middle" font-family="Arial" font-size="92" font-weight="900" fill="${accent}">¥1,234,567</text><rect x="105" y="270" width="690" height="420" rx="58" fill="#fff" stroke="${accent}" stroke-width="12"/><path d="M185 570c120-160 250-55 360-170 60-62 110-70 180-28" fill="none" stroke="${accent}" stroke-width="30" stroke-linecap="round"/><g>${Array.from({ length: 6 }, (_, i) => `<rect x="140" y="${780 + i * 55}" width="${610 - i * 50}" height="28" rx="14" fill="${i % 2 ? "#86efac" : "#bbf7d0"}"/>`).join("")}</g></svg>`;
  }
  if (kind === "official") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><rect width="900" height="1200" rx="72" fill="#f8fbff"/><rect x="100" y="150" width="700" height="270" rx="54" fill="#dbeafe" stroke="#93c5fd" stroke-width="10"/><rect x="155" y="215" width="180" height="120" rx="28" fill="#fff"/><circle cx="245" cy="275" r="32" fill="${accent}"/><path d="M405 225h280M405 295h210" stroke="${accent}" stroke-width="28" stroke-linecap="round"/><rect x="115" y="520" width="300" height="250" rx="44" fill="#fff"/><path d="M165 580h64v64h-64zM270 580h64v64h-64zM165 685h64v64h-64zM270 685h64v64h-64z" fill="${accent}"/><rect x="475" y="520" width="310" height="250" rx="44" fill="#fff"/><path d="M535 590h190M535 665h130" stroke="${accent}" stroke-width="28" stroke-linecap="round"/><rect x="230" y="880" width="440" height="95" rx="48" fill="${accent}"/><text x="450" y="940" text-anchor="middle" font-family="Arial" font-size="42" font-weight="900" fill="#fff">手続きへ進む</text></svg>`;
  }
  if (kind === "ai") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ecfeff"/><stop offset=".48" stop-color="#dbeafe"/><stop offset="1" stop-color="#f5d0fe"/></linearGradient><linearGradient id="p" x1="0" x2="1"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="${primary}"/></linearGradient></defs><rect width="900" height="1200" rx="72" fill="url(#g)"/><circle cx="735" cy="175" r="132" fill="${accent}" opacity=".18"/><circle cx="145" cy="1000" r="160" fill="${primary}" opacity=".14"/><rect x="92" y="128" width="716" height="888" rx="74" fill="#ffffff" stroke="#7dd3fc" stroke-width="12"/><rect x="142" y="188" width="472" height="92" rx="46" fill="#eef2ff"/><text x="178" y="248" font-family="Arial" font-size="34" font-weight="900" fill="${ink}">夏の旅行プランを作って</text><rect x="234" y="326" width="520" height="116" rx="58" fill="url(#p)"/><text x="494" y="398" text-anchor="middle" font-family="Arial" font-size="42" font-weight="900" fill="#fff">3つの案を生成</text><rect x="142" y="505" width="616" height="322" rx="54" fill="#0f172a"/><path d="M190 745c72-132 155-55 218-138 72-95 142 58 212-55 38-62 76-74 120-32" fill="none" stroke="#67e8f9" stroke-width="26" stroke-linecap="round"/><circle cx="248" cy="605" r="64" fill="#fbbf24"/><rect x="182" y="854" width="238" height="78" rx="39" fill="#ecfeff"/><rect x="454" y="854" width="252" height="78" rx="39" fill="#f5d0fe"/><path d="M214 896h142M486 896h154" stroke="${ink}" stroke-width="18" stroke-linecap="round"/><rect x="170" y="1060" width="560" height="56" rx="28" fill="#fff" opacity=".78"/><text x="450" y="1099" text-anchor="middle" font-family="Arial" font-size="32" font-weight="900" fill="${ink}">Prompt -> Answer -> Visual</text></svg>`;
  }
  if (kind === "collage") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><rect width="900" height="1200" rx="72" fill="#fff7ed"/><g opacity=".9">${Array.from({ length: 32 }, (_, i) => `<path d="M${40 + (i * 87) % 810} ${40 + (i * 131) % 1080}l18 14 20-18 12 24" fill="none" stroke="${i % 2 ? "#f9a8d4" : "#67e8f9"}" stroke-width="7" stroke-linecap="round"/>`).join("")}</g>${Array.from({ length: 6 }, (_, i) => `<rect x="${90 + (i % 2) * 360}" y="${130 + Math.floor(i / 2) * 285}" width="300" height="230" rx="34" fill="#fff" transform="rotate(${i % 2 ? 7 : -7} ${240 + (i % 2) * 360} ${245 + Math.floor(i / 2) * 285})"/><rect x="${122 + (i % 2) * 360}" y="${165 + Math.floor(i / 2) * 285}" width="236" height="145" rx="24" fill="${i % 3 === 0 ? "#111827" : i % 3 === 1 ? "#334155" : accent}" transform="rotate(${i % 2 ? 7 : -7} ${240 + (i % 2) * 360} ${245 + Math.floor(i / 2) * 285})"/>`).join("")}<text x="450" y="1070" text-anchor="middle" font-family="Arial" font-size="62" font-weight="900" fill="${accent}">STORY</text></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><rect width="900" height="1200" rx="72" fill="#f8fafc"/><rect x="120" y="150" width="660" height="230" rx="58" fill="${accent}" opacity=".9"/><rect x="140" y="480" width="620" height="210" rx="48" fill="#fff"/><rect x="140" y="760" width="500" height="210" rx="48" fill="#fff"/><path d="M210 570h350M210 845h250" stroke="${primary}" stroke-width="30" stroke-linecap="round"/><text x="450" y="1100" text-anchor="middle" font-family="Arial" font-size="56" font-weight="900" fill="${ink}">${project.app.name}</text></svg>`;
}

function generatedHeroLayer(id: string, assetId: string, artboard: Artboard, index: number): Layer {
  const width = Math.round(artboard.width * 0.86);
  const height = Math.round(artboard.height * 0.44);
  return {
    ...baseLayer,
    id,
    type: "image",
    assetId,
    x: Math.round((artboard.width - width) / 2 + (index % 2 === 0 ? -artboard.width * 0.015 : artboard.width * 0.015)),
    y: Math.round(artboard.height * 0.18),
    width,
    height,
    radius: Math.round(artboard.width * 0.045)
  };
}

export async function backfillGeneratedVisuals(project: StoreShotProject, projectDir: string): Promise<{ project: StoreShotProject; changed: boolean }> {
  if (!needsStrongVisual(project) || hasGeneratedHero(project)) return { project, changed: false };

  const assetId = "generated-visual-hero";
  const assetPath = `assets/generated/${assetId}.svg`;
  await mkdir(join(projectDir, "assets/generated"), { recursive: true });
  await writeFile(join(projectDir, assetPath), heroSvg(project, visualKind(project)), "utf8");

  const next: StoreShotProject = {
    ...project,
    generatedImageAssets: [
      ...project.generatedImageAssets.filter((asset) => asset.id !== assetId),
      {
        id: assetId,
        type: "generated-image",
        path: assetPath,
        width: 900,
        height: 1200,
        alt: `${project.app.name} original store screenshot hero`,
        generated: {
          provider: "openstoreshot-visual-backfill",
          model: "svg-hero-v1",
          prompt: `Original high-density store screenshot hero for ${project.app.name}; kind=${visualKind(project)}`,
          createdAt: new Date().toISOString(),
          source: { automaticBackfill: true }
        }
      }
    ],
    slides: project.slides.map((slide, slideIndex) => ({
      ...slide,
      artboards: slide.artboards.map((artboard) => {
        if (artboard.layers.some((layer) => layer.type === "image" && layer.assetId === assetId)) return artboard;
        const insertIndex = Math.max(1, artboard.layers.findIndex((layer) => layer.type !== "background"));
        const heroLayer = generatedHeroLayer(`generated-visual-hero-${slideIndex + 1}`, assetId, artboard, slideIndex);
        return {
          ...artboard,
          layers: [
            ...artboard.layers.slice(0, insertIndex),
            heroLayer,
            ...artboard.layers.slice(insertIndex)
          ]
        };
      })
    }))
  };

  return { project: next, changed: true };
}
