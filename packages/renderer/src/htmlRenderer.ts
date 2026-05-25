import type { Artboard, Layer, StoreShotProject } from "@openstoreshot/core";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[char] ?? char);
}

function fillToCss(layer: Layer): string {
  if (!layer.fill) return "transparent";
  if (layer.fill.type === "solid") return layer.fill.color;
  if (layer.fill.type === "gradient") return `linear-gradient(${layer.fill.angle ?? 145}deg, ${layer.fill.from}, ${layer.fill.to})`;
  return "#f8fafc";
}

function layerToHtml(layer: Layer, project: StoreShotProject): string {
  if (layer.hidden) return "";
  const common = [
    "position:absolute",
    `left:${layer.x}px`,
    `top:${layer.y}px`,
    layer.width ? `width:${layer.width}px` : "",
    layer.height ? `height:${layer.height}px` : "",
    `opacity:${layer.opacity}`,
    `transform:rotate(${layer.rotation}deg)`,
    "box-sizing:border-box"
  ].filter(Boolean).join(";");

  if (layer.type === "background") {
    return `<div data-layer="${escapeHtml(layer.id)}" style="position:absolute;inset:0;background:${fillToCss(layer)}"></div>`;
  }
  if (layer.type === "text") {
    const fontWeight = layer.fontWeight ?? 700;
    const extremeWeight = fontWeight >= 900 ? ";text-shadow:0.018em 0 currentColor,-0.018em 0 currentColor,0 0.018em currentColor" : "";
    return `<div data-layer="${escapeHtml(layer.id)}" style="${common};font-family:${layer.fontFamily ?? "Inter,Arial,sans-serif"};font-size:${layer.fontSize ?? 56}px;line-height:${layer.lineHeight ?? 1.08};font-weight:${fontWeight};letter-spacing:${layer.letterSpacing}px;color:${layer.color ?? "#111827"};text-align:${layer.align ?? "left"};white-space:pre-wrap${extremeWeight}">${escapeHtml(layer.text ?? "")}</div>`;
  }
  if (layer.type === "shape") {
    return `<div data-layer="${escapeHtml(layer.id)}" style="${common};background:${fillToCss(layer)};border-radius:${layer.radius}px;box-shadow:0 28px 80px rgba(15,23,42,.16)"></div>`;
  }
  if (layer.type === "image" && layer.assetId) {
    const asset = [...project.assets, ...project.generatedImageAssets].find((item) => item.id === layer.assetId);
    return `<div data-layer="${escapeHtml(layer.id)}" style="${common};border-radius:${layer.radius}px;overflow:hidden;box-shadow:0 28px 80px rgba(15,23,42,.16)">${asset ? `<img src="${escapeHtml(asset.path)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block" />` : ""}</div>`;
  }
  if (layer.type === "device") {
    return `<div data-layer="${escapeHtml(layer.id)}" style="${common};border-radius:${layer.radius || 58}px;background:#0f172a;padding:18px;box-shadow:0 36px 90px rgba(15,23,42,.32)"><div style="width:100%;height:100%;border-radius:${Math.max((layer.radius || 58) - 18, 22)}px;background:linear-gradient(160deg,#eef2ff,#ffffff 45%,#d1fae5);display:flex;align-items:center;justify-content:center;color:#475569;font:700 34px Inter,Arial">${escapeHtml(project.app.name)}</div></div>`;
  }
  return `<div data-layer="${escapeHtml(layer.id)}" style="${common};background:${fillToCss(layer)};border-radius:${layer.radius}px"></div>`;
}

export function renderArtboardHtml(project: StoreShotProject, artboard: Artboard): string {
  const body = artboard.layers.map((layer) => layerToHtml(layer, project)).join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:${artboard.width}px;height:${artboard.height}px}.artboard{position:relative;overflow:hidden;width:${artboard.width}px;height:${artboard.height}px;background:${project.brand.colors.background ?? "#fff"}}</style></head><body><main class="artboard">${body}</main></body></html>`;
}
