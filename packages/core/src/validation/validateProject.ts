import type { StoreShotProject } from "../schema/project";
import { allTargets } from "./targets";
import { detectCopyrightRisk, detectStoreClaimRisk } from "./guardrails";

export type ValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  slideId?: string;
  artboardId?: string;
  layerId?: string;
};

export function validateProject(project: StoreShotProject): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const targetById = new Map(allTargets.map((target) => [target.id, target]));

  for (const slide of project.slides) {
    for (const artboard of slide.artboards) {
      const target = artboard.target ? targetById.get(artboard.target) : undefined;
      if (target && (target.width !== artboard.width || target.height !== artboard.height)) {
        issues.push({
          severity: "error",
          code: "TARGET_DIMENSION_MISMATCH",
          message: `${artboard.id} is ${artboard.width}x${artboard.height}, expected ${target.width}x${target.height}.`,
          slideId: slide.id,
          artboardId: artboard.id
        });
      }
      if (artboard.platform === "android" && artboard.target === "play-feature-graphic") {
        const text = artboard.layers.filter((layer) => layer.type === "text").map((layer) => layer.text ?? "").join(" ");
        if (text.length > 90) {
          issues.push({ severity: "warning", code: "FEATURE_GRAPHIC_TEXT_DENSE", message: "Feature graphic text may be too dense.", slideId: slide.id, artboardId: artboard.id });
        }
      }
      for (const layer of artboard.layers) {
        const text = layer.text ?? "";
        for (const risk of detectCopyrightRisk(text)) {
          issues.push({ severity: "warning", code: "COPYRIGHT_REFERENCE_RISK", message: risk, slideId: slide.id, artboardId: artboard.id, layerId: layer.id });
        }
        for (const risk of detectStoreClaimRisk(text)) {
          issues.push({ severity: "warning", code: "UNSUBSTANTIATED_STORE_CLAIM", message: risk, slideId: slide.id, artboardId: artboard.id, layerId: layer.id });
        }
      }
    }
  }

  for (const locale of project.locales) {
    for (const platform of project.platforms) {
      const count = project.slides.filter((slide) => slide.artboards.some((a) => a.platform === platform)).length;
      if (platform === "ios" && (count < 1 || count > 10)) {
        issues.push({ severity: "error", code: "IOS_SCREENSHOT_COUNT", message: `${locale} iOS listing should have 1 to 10 screenshots.` });
      }
      if (platform === "android" && (count < 2 || count > 8)) {
        issues.push({ severity: "warning", code: "PLAY_SCREENSHOT_COUNT", message: `${locale} Google Play phone listing usually needs 2 to 8 screenshots.` });
      }
    }
  }

  return issues;
}
