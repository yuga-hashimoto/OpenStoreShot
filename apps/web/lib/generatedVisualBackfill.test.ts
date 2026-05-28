import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import type { StoreShotProject } from "@openstoreshot/core";
import { backfillGeneratedVisuals } from "./generatedVisualBackfill";

const baseLayer = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };

function projectFixture(): StoreShotProject {
  return {
    schemaVersion: "0.1.0",
    projectId: "visual-backfill-test",
    name: "Visual Backfill Test",
    brand: { colors: { primary: "#EC4899", background: "#FFF7ED", accent: "#EC4899", ink: "#0F172A" }, fontFamily: "Inter", tone: "bright" },
    app: { name: "CouponApp", category: "Food & Drink", shortDescription: "Coupons", targetAudience: "shoppers" },
    locales: ["ja-JP"],
    platforms: ["ios"],
    assets: [],
    generatedImageAssets: [],
    referenceInspirations: [{
      id: "ref-coupon",
      source: "test",
      platform: "ios",
      inspirationOnly: true,
      patterns: { composition: "commerce coupon board with image hero" }
    }],
    slides: [1, 2, 3].map((number) => ({
      id: `slide-0${number}`,
      title: `Slide ${number}`,
      role: number === 1 ? "benefit" : "feature",
      localeText: {},
      artboards: [{
        id: `ios-${number}`,
        width: 1290,
        height: 2796,
        platform: "ios",
        target: "ios-6-9-portrait",
        layers: [
          { ...baseLayer, id: "bg", type: "background", x: 0, y: 0, fill: { type: "solid", color: "#FFF7ED" } },
          { ...baseLayer, id: "headline", type: "text", text: "クーポン", x: 96, y: 120, width: 1000, height: 130, fontSize: 84, fontWeight: 900, color: "#0F172A", align: "left" },
          { ...baseLayer, id: "device", type: "device", device: "iphone-6-9", x: 300, y: 760, width: 690, height: 1500, radius: 86 },
          ...Array.from({ length: 7 }, (_, index) => ({
            ...baseLayer,
            id: `detail-${number}-${index}`,
            type: "shape" as const,
            x: 360,
            y: 900 + index * 130,
            width: 570,
            height: 80,
            radius: 28,
            fill: { type: "solid" as const, color: index % 2 ? "#FDF2F8" : "#FFFFFF" }
          }))
        ]
      }]
    })),
    exportTargets: [],
    validationResults: []
  };
}

describe("backfillGeneratedVisuals", () => {
  it("adds a generated image hero asset for strong visual references", async () => {
    const dir = await mkdtemp(join(tmpdir(), "storeshot-backfill-"));
    try {
      const result = await backfillGeneratedVisuals(projectFixture(), dir);
      expect(result.changed).toBe(true);
      expect(result.project.generatedImageAssets.map((asset) => asset.id)).toContain("generated-visual-hero");
      expect(result.project.slides[0]?.artboards[0]?.layers.some((layer) => layer.type === "image" && layer.assetId === "generated-visual-hero")).toBe(true);
      await expect(readFile(join(dir, "assets/generated/generated-visual-hero.svg"), "utf8")).resolves.toContain("<svg");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("does not duplicate an existing generated hero", async () => {
    const dir = await mkdtemp(join(tmpdir(), "storeshot-backfill-"));
    try {
      const project = projectFixture();
      project.generatedImageAssets = [{ id: "existing", type: "generated-image", path: "assets/generated/existing.svg", width: 900, height: 1200 }];
      project.slides[0]!.artboards[0]!.layers.push({ ...baseLayer, id: "existing-hero", type: "image", assetId: "existing", x: 80, y: 500, width: 1120, height: 1200, radius: 56 });
      const result = await backfillGeneratedVisuals(project, dir);
      expect(result.changed).toBe(false);
      expect(result.project.generatedImageAssets).toHaveLength(1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
