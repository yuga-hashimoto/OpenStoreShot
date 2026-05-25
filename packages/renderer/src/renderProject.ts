import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import sharp from "sharp";
import type { Artboard, Layer, StoreShotProject } from "@openstoreshot/core";
import { renderArtboardHtml } from "./htmlRenderer";

export type RenderOptions = {
  outputDir: string;
  format?: "png" | "jpeg";
  platform?: "ios" | "android";
  locale?: string;
};

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[char] ?? char);
}

function svgFill(layer: Layer, index: number): { defs: string; fill: string } {
  if (!layer.fill) return { defs: "", fill: "transparent" };
  if (layer.fill.type === "solid") return { defs: "", fill: layer.fill.color };
  if (layer.fill.type === "gradient") {
    const id = `g-${layer.id}-${index}`.replace(/[^a-zA-Z0-9-_]/g, "");
    return {
      defs: `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${layer.fill.from}"/><stop offset="100%" stop-color="${layer.fill.to}"/></linearGradient>`,
      fill: `url(#${id})`
    };
  }
  return { defs: "", fill: "#f8fafc" };
}

function mimeFor(path: string) {
  const ext = extname(path).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

function resolveAssetPath(assetPath: string, outputDir: string) {
  const candidates = [
    assetPath.startsWith("/") ? assetPath : "",
    resolve(process.env.INIT_CWD ?? process.cwd(), assetPath),
    resolve(dirname(outputDir), assetPath)
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate));
}

function assetDataUris(project: StoreShotProject, outputDir: string) {
  const entries = [...project.assets, ...project.generatedImageAssets].flatMap((asset) => {
    const resolved = resolveAssetPath(asset.path, outputDir);
    if (!resolved) return [];
    const data = readFileSync(resolved).toString("base64");
    return [[asset.id, `data:${mimeFor(asset.path)};base64,${data}`] as const];
  });
  return new Map(entries);
}

function layerToSvg(layer: Layer, artboard: Artboard, index: number, assets: Map<string, string>, appName: string): { defs: string; body: string } {
  if (layer.hidden) return { defs: "", body: "" };
  const width = layer.width ?? artboard.width;
  const height = layer.height ?? artboard.height;
  const transform = layer.rotation ? ` transform="rotate(${layer.rotation} ${layer.x + width / 2} ${layer.y + height / 2})"` : "";
  if (layer.type === "background") {
    const fill = svgFill(layer, index);
    return { defs: fill.defs, body: `<rect x="0" y="0" width="${artboard.width}" height="${artboard.height}" fill="${fill.fill}" opacity="${layer.opacity}"/>` };
  }
  if (layer.type === "text") {
    const lines = (layer.text ?? "").split("\n");
    const fontSize = layer.fontSize ?? 56;
    const fontWeight = layer.fontWeight ?? 700;
    const lineHeight = fontSize * (layer.lineHeight ?? 1.08);
    const anchor = layer.align === "center" ? "middle" : layer.align === "right" ? "end" : "start";
    const x = layer.align === "center" ? layer.x + width / 2 : layer.align === "right" ? layer.x + width : layer.x;
    const extremeStroke = fontWeight >= 900 ? ` stroke="${escapeXml(layer.color ?? "#111827")}" stroke-width="1.4" paint-order="stroke fill"` : "";
    const tspans = lines.map((line, lineIndex) => `<tspan x="${x}" dy="${lineIndex === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`).join("");
    return {
      defs: "",
      body: `<text x="${x}" y="${layer.y + fontSize}" width="${width}" font-family="${escapeXml(layer.fontFamily ?? "Inter, Arial, sans-serif")}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${layer.color ?? "#111827"}"${extremeStroke} text-anchor="${anchor}" letter-spacing="${layer.letterSpacing}" opacity="${layer.opacity}"${transform}>${tspans}</text>`
    };
  }
  if (layer.type === "device") {
    const innerRadius = Math.max((layer.radius || 58) - 18, 22);
    const screenshot = layer.screenshotAssetId ? assets.get(layer.screenshotAssetId) : undefined;
    const clipId = `clip-${layer.id}-${index}`.replace(/[^a-zA-Z0-9-_]/g, "");
    const screenX = layer.x + 18;
    const screenY = layer.y + 18;
    const screenWidth = width - 36;
    const screenHeight = height - 36;
    const screen = screenshot
      ? `<defs><clipPath id="${clipId}"><rect x="${screenX}" y="${screenY}" width="${screenWidth}" height="${screenHeight}" rx="${innerRadius}"/></clipPath></defs><image href="${screenshot}" x="${screenX}" y="${screenY}" width="${screenWidth}" height="${screenHeight}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>`
      : `<rect x="${screenX}" y="${screenY}" width="${screenWidth}" height="${screenHeight}" rx="${innerRadius}" fill="#f8fafc"/><text x="${layer.x + width / 2}" y="${layer.y + height / 2}" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="800" fill="#64748b" text-anchor="middle">${escapeXml(appName)}</text><rect x="${layer.x + 58}" y="${layer.y + 110}" width="${width - 116}" height="140" rx="34" fill="#ccfbf1" opacity=".65"/><rect x="${layer.x + 58}" y="${layer.y + 290}" width="${width - 116}" height="32" rx="16" fill="#0f766e" opacity=".35"/><rect x="${layer.x + 58}" y="${layer.y + 345}" width="${width - 210}" height="32" rx="16" fill="#f59e0b" opacity=".28"/>`;
    return {
      defs: "",
      body: `<g opacity="${layer.opacity}"${transform}><rect x="${layer.x}" y="${layer.y}" width="${width}" height="${height}" rx="${layer.radius || 58}" fill="#0f172a"/>${screen}</g>`
    };
  }
  if (layer.type === "image" && layer.assetId && assets.has(layer.assetId)) {
    return {
      defs: "",
      body: `<image href="${assets.get(layer.assetId)}" x="${layer.x}" y="${layer.y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" opacity="${layer.opacity}"${transform}/>`
    };
  }
  const fill = svgFill(layer, index);
  return { defs: fill.defs, body: `<rect x="${layer.x}" y="${layer.y}" width="${width}" height="${height}" rx="${layer.radius}" fill="${fill.fill}" opacity="${layer.opacity}"${transform}/>` };
}

function svgForArtboard(project: StoreShotProject, slideIndex: number, artboardIndex: number, outputDir: string) {
  const slide = project.slides[slideIndex];
  const artboard = slide?.artboards[artboardIndex];
  if (!slide || !artboard) throw new Error("Invalid artboard index");
  const assets = assetDataUris(project, outputDir);
  const layers = artboard.layers.map((layer, index) => layerToSvg(layer, artboard, index, assets, project.app.name));
  return `<svg width="${artboard.width}" height="${artboard.height}" viewBox="0 0 ${artboard.width} ${artboard.height}" xmlns="http://www.w3.org/2000/svg"><defs>${layers.map((layer) => layer.defs).join("")}</defs><rect width="100%" height="100%" fill="${project.brand.colors.background ?? "#fff"}"/>${layers.map((layer) => layer.body).join("")}</svg>`;
}

export async function renderProject(project: StoreShotProject, options: RenderOptions): Promise<string[]> {
  await mkdir(options.outputDir, { recursive: true });
  const outputs: string[] = [];
  for (let slideIndex = 0; slideIndex < project.slides.length; slideIndex += 1) {
    const slide = project.slides[slideIndex];
    if (!slide) continue;
    for (let artboardIndex = 0; artboardIndex < slide.artboards.length; artboardIndex += 1) {
      const artboard = slide.artboards[artboardIndex];
      if (!artboard || (options.platform && artboard.platform !== options.platform)) continue;
      const format = options.format ?? "png";
      const basename = `${slide.id}-${artboard.id}-${options.locale ?? project.locales[0]}.${format === "jpeg" ? "jpg" : "png"}`;
      const outputPath = join(options.outputDir, basename);
      const svg = svgForArtboard(project, slideIndex, artboardIndex, options.outputDir);
      await sharp(Buffer.from(svg)).toFormat(format).toFile(outputPath);
      outputs.push(outputPath);
    }
  }
  return outputs;
}

export async function writePreviewHtml(project: StoreShotProject, outputPath: string): Promise<void> {
  const first = project.slides[0]?.artboards[0];
  if (!first) throw new Error("Project has no artboard");
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderArtboardHtml(project, first), "utf8");
}
