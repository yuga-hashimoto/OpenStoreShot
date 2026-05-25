import type { ReferencePatternBrief, StoreReferenceApp } from "./types";

export function createInspirationBrief(app: StoreReferenceApp): ReferencePatternBrief {
  return {
    source: "reference-board",
    inspirationOnly: true,
    patterns: {
      composition: app.platform === "ios" ? "centered device mockup with generous headline area" : "benefit-first frame with clear feature crop",
      copyLength: "short headline, one to two lines, no long paragraph",
      colorMood: app.category === "Finance" ? "calm high-contrast neutrals with one trust accent" : "bright pastel gradient with soft depth",
      deviceFraming: "single primary device, slightly elevated, screenshot content remains fictional in outputs",
      slideRole: "1 benefit, 2 core feature, 3 workflow, 4 trust, 5 action"
    }
  };
}
