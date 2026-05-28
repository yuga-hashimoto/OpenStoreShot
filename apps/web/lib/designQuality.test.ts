import { describe, expect, it } from "vitest";
import type { StoreShotProject } from "@openstoreshot/core";
import { designQualityIssues } from "./designQuality";

function baseProject(layers: StoreShotProject["slides"][number]["artboards"][number]["layers"]): StoreShotProject {
  return {
    schemaVersion: "0.1.0",
    projectId: "quality-test",
    name: "Quality Test",
    brand: {
      colors: { primary: "#0F766E", background: "#F8FAFC", accent: "#14B8A6", ink: "#0F172A" },
      fontFamily: "Inter",
      tone: "clean"
    },
    app: {
      name: "MemoApp",
      category: "Productivity",
      shortDescription: "Memo app",
      targetAudience: "testers"
    },
    locales: ["ja-JP"],
    platforms: ["ios"],
    assets: [],
    generatedImageAssets: [],
    referenceInspirations: [],
    slides: [
      {
        id: "slide-01",
        title: "Slide",
        role: "benefit",
        localeText: {},
        artboards: [
          {
            id: "ios-slide-01",
            width: 1290,
            height: 2796,
            platform: "ios",
            target: "ios-6-9-portrait",
            layers
          }
        ]
      }
    ],
    exportTargets: [],
    validationResults: []
  };
}

function multiSlideProject(artboards: StoreShotProject["slides"][number]["artboards"]): StoreShotProject {
  const project = baseProject(artboards[0]!.layers);
  project.slides = artboards.map((artboard, index) => ({
    id: `slide-${index + 1}`,
    title: `Slide ${index + 1}`,
    role: index === 0 ? "benefit" : "feature",
    localeText: {},
    artboards: [artboard]
  }));
  return project;
}

describe("designQualityIssues", () => {
  it("flags a generic phone-only design", () => {
    const issues = designQualityIssues(baseProject([
      { id: "bg", type: "background", fill: { type: "solid", color: "#fff" }, x: 0, y: 0, rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] },
      { id: "headline", type: "text", text: "見出し", x: 96, y: 120, width: 1000, height: 120, rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] },
      { id: "subtitle", type: "text", text: "説明", x: 96, y: 260, width: 1000, height: 80, rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] },
      { id: "device", type: "device", device: "iphone-6-9", x: 250, y: 600, width: 790, height: 1710, rotation: 0, radius: 86, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] }
    ]));
    expect(issues.some((issue) => issue.message.includes("too simple"))).toBe(true);
    expect(issues.some((issue) => issue.message.includes("device screen is generic"))).toBe(true);
  });

  it("passes a layered app-surface design", () => {
    const baseLayer = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };
    const issues = designQualityIssues(baseProject([
      { ...baseLayer, id: "bg", type: "background", fill: { type: "solid", color: "#fff" }, x: 0, y: 0 },
      { ...baseLayer, id: "headline", type: "text", text: "見出し", x: 96, y: 120, width: 1000, height: 120 },
      { ...baseLayer, id: "subtitle", type: "text", text: "説明", x: 96, y: 260, width: 1000, height: 80 },
      { ...baseLayer, id: "device", type: "device", device: "iphone-6-9", x: 250, y: 600, width: 790, height: 1710, radius: 86 },
      { ...baseLayer, id: "screen-card-1", type: "shape", fill: { type: "solid", color: "#fff" }, x: 320, y: 760, width: 650, height: 180, radius: 32 },
      { ...baseLayer, id: "screen-card-title", type: "text", text: "検索結果", x: 360, y: 800, width: 570, height: 70 },
      { ...baseLayer, id: "screen-chip-1", type: "shape", fill: { type: "solid", color: "#CCFBF1" }, x: 350, y: 980, width: 220, height: 72, radius: 36 },
      { ...baseLayer, id: "screen-chip-label", type: "text", text: "OCR", x: 380, y: 998, width: 120, height: 32 },
      { ...baseLayer, id: "screen-row-2", type: "shape", fill: { type: "solid", color: "#ECFEFF" }, x: 320, y: 1120, width: 650, height: 160, radius: 32 },
      { ...baseLayer, id: "screen-lower-list", type: "shape", fill: { type: "solid", color: "#F1F5F9" }, x: 320, y: 1780, width: 650, height: 260, radius: 32 },
      { ...baseLayer, id: "screen-bottom-tab", type: "shape", fill: { type: "solid", color: "#E0F2FE" }, x: 360, y: 2100, width: 570, height: 90, radius: 36 },
      { ...baseLayer, id: "feature-badge", type: "shape", fill: { type: "solid", color: "#14B8A6" }, x: 820, y: 430, width: 240, height: 76, radius: 38 }
    ]));
    expect(issues).toEqual([]);
  });

  it("flags inconsistent device sizing across a set", () => {
    const baseLayer = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };
    const makeArtboard = (index: number, deviceWidth: number, deviceHeight: number) => ({
      id: `ios-slide-${index}`,
      width: 1290,
      height: 2796,
      platform: "ios" as const,
      target: "ios-6-9-portrait",
      layers: [
        { ...baseLayer, id: "bg", type: "background" as const, fill: { type: "solid" as const, color: "#F8FAFC" }, x: 0, y: 0 },
        { ...baseLayer, id: "headline", type: "text" as const, text: "見出し", x: 96, y: 120, width: 1000, height: 120 },
        { ...baseLayer, id: "device", type: "device" as const, device: "iphone-6-9" as const, x: 250, y: 600, width: deviceWidth, height: deviceHeight, radius: 86, screenshotAssetId: `shot-${index}` },
        ...Array.from({ length: 7 }, (_, detailIndex) => ({
          ...baseLayer,
          id: `detail-${index}-${detailIndex}`,
          type: "shape" as const,
          fill: { type: "solid" as const, color: "#E0F2FE" },
          x: 320,
          y: 760 + detailIndex * 120,
          width: 650,
          height: 80,
          radius: 24
        }))
      ]
    });
    const issues = designQualityIssues(multiSlideProject([
      makeArtboard(1, 790, 1710),
      makeArtboard(2, 790, 1710),
      makeArtboard(3, 480, 1040)
    ]));
    expect(issues.some((issue) => issue.severity === "error" && issue.message.includes("device sizes vary too much"))).toBe(true);
  });

  it("allows a secondary cropped device when a non-phone board is the clear hero", () => {
    const baseLayer = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };
    const makeArtboard = (index: number, secondary = false) => ({
      id: `ios-device-crop-${index}`,
      width: 1290,
      height: 2796,
      platform: "ios" as const,
      target: "ios-6-9-portrait",
      layers: [
        { ...baseLayer, id: "bg", type: "background" as const, fill: { type: "solid" as const, color: "#F8FAFC" }, x: 0, y: 0 },
        { ...baseLayer, id: "headline", type: "text" as const, text: "見出し", x: 96, y: 120, width: 1000, height: 120, fontSize: 86 },
        { ...baseLayer, id: "series-band", type: "shape" as const, fill: { type: "solid" as const, color: "#DBEAFE" }, x: 0, y: 460, width: 1290, height: 500, radius: 0 },
        ...(secondary
          ? [
              { ...baseLayer, id: "workflow-board-main", type: "shape" as const, fill: { type: "solid" as const, color: "#FFFFFF" }, x: 120, y: 650, width: 1040, height: 1220, radius: 56 },
              { ...baseLayer, id: "secondary-device-edge-crop", type: "device" as const, device: "iphone-6-9" as const, x: 600, y: 2140, width: 790, height: 1710, radius: 86 }
            ]
          : [{ ...baseLayer, id: "device", type: "device" as const, device: "iphone-6-9" as const, x: 250, y: 700, width: 790, height: 1710, radius: 86 }]),
        ...Array.from({ length: 10 }, (_, detailIndex) => ({
          ...baseLayer,
          id: `${secondary ? "board" : "screen"}-detail-${index}-${detailIndex}`,
          type: "shape" as const,
          fill: { type: "solid" as const, color: detailIndex % 2 ? "#E0F2FE" : "#FFFFFF" },
          x: secondary ? 170 + (detailIndex % 2) * 430 : 330,
          y: secondary ? 760 + detailIndex * 86 : 860 + detailIndex * 110,
          width: secondary ? 360 : 620,
          height: 64,
          radius: 24
        }))
      ]
    });
    const issues = designQualityIssues(multiSlideProject([makeArtboard(1), makeArtboard(2, true), makeArtboard(3)]));
    expect(issues.some((issue) => issue.message.includes("device top and baseline both drift"))).toBe(false);
  });

  it("flags a multi-slide set that is only phone-led", () => {
    const baseLayer = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };
    const makeArtboard = (index: number) => ({
      id: `ios-phone-led-${index}`,
      width: 1290,
      height: 2796,
      platform: "ios" as const,
      target: "ios-6-9-portrait",
      layers: [
        { ...baseLayer, id: "bg", type: "background" as const, fill: { type: "solid" as const, color: "#F8FAFC" }, x: 0, y: 0 },
        { ...baseLayer, id: "headline", type: "text" as const, text: "見出し", x: 96, y: 120, width: 1000, height: 120 },
        { ...baseLayer, id: "device", type: "device" as const, device: "iphone-6-9" as const, x: 250, y: 600, width: 790, height: 1710, radius: 86, screenshotAssetId: `shot-${index}` },
        ...Array.from({ length: 7 }, (_, detailIndex) => ({
          ...baseLayer,
          id: `screen-detail-${index}-${detailIndex}`,
          type: "shape" as const,
          fill: { type: "solid" as const, color: "#E0F2FE" },
          x: 330,
          y: 760 + detailIndex * 120,
          width: 620,
          height: 80,
          radius: 24
        }))
      ]
    });
    const issues = designQualityIssues(multiSlideProject([makeArtboard(1), makeArtboard(2), makeArtboard(3)]));
    expect(issues.some((issue) => issue.severity === "error" && issue.message.includes("too phone-led"))).toBe(true);
  });

  it("flags a set without a repeated typography system", () => {
    const baseLayer = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };
    const makeArtboard = (index: number, fontSize: number) => ({
      id: `ios-type-${index}`,
      width: 1290,
      height: 2796,
      platform: "ios" as const,
      target: "ios-6-9-portrait",
      layers: [
        { ...baseLayer, id: "bg", type: "background" as const, fill: { type: "solid" as const, color: "#F8FAFC" }, x: 0, y: 0 },
        { ...baseLayer, id: "headline", type: "text" as const, text: "見出し", x: 96, y: 120, width: 1000, height: 120, fontSize },
        { ...baseLayer, id: "hero-card", type: "shape" as const, fill: { type: "solid" as const, color: "#FFFFFF" }, x: 140, y: 650, width: 980, height: 640, radius: 48 },
        ...Array.from({ length: 7 }, (_, detailIndex) => ({
          ...baseLayer,
          id: `detail-${index}-${detailIndex}`,
          type: "shape" as const,
          fill: { type: "solid" as const, color: "#E0F2FE" },
          x: 180 + (detailIndex % 2) * 420,
          y: 760 + detailIndex * 100,
          width: 360,
          height: 70,
          radius: 24
        }))
      ]
    });
    const issues = designQualityIssues(multiSlideProject([
      makeArtboard(1, 86),
      makeArtboard(2, 62),
      makeArtboard(3, 98)
    ]));
    expect(issues.some((issue) => issue.severity === "error" && issue.message.includes("headline font sizes"))).toBe(true);
  });

  it("flags a first screenshot headline that is too small for thumbnails", () => {
    const baseLayer = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };
    const makeArtboard = (index: number) => ({
      id: `ios-thumb-${index}`,
      width: 1290,
      height: 2796,
      platform: "ios" as const,
      target: "ios-6-9-portrait",
      layers: [
        { ...baseLayer, id: "bg", type: "background" as const, fill: { type: "solid" as const, color: "#F8FAFC" }, x: 0, y: 0 },
        { ...baseLayer, id: "headline", type: "text" as const, text: "すぐ使える", x: 96, y: 120, width: 1000, height: 120, fontSize: index === 1 ? 42 : 86 },
        { ...baseLayer, id: "hero-board", type: "shape" as const, fill: { type: "solid" as const, color: "#FFFFFF" }, x: 140, y: 650, width: 980, height: 940, radius: 48 },
        ...Array.from({ length: 9 }, (_, detailIndex) => ({
          ...baseLayer,
          id: `board-detail-${index}-${detailIndex}`,
          type: "shape" as const,
          fill: { type: "solid" as const, color: "#E0F2FE" },
          x: 180 + (detailIndex % 2) * 420,
          y: 760 + detailIndex * 92,
          width: 360,
          height: 58,
          radius: 24
        }))
      ]
    });
    const issues = designQualityIssues(multiSlideProject([makeArtboard(1), makeArtboard(2), makeArtboard(3)]));
    expect(issues.some((issue) => issue.severity === "error" && issue.message.includes("headline is too small"))).toBe(true);
  });

  it("allows a large image app surface without a phone frame", () => {
    const baseLayer = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };
    const issues = designQualityIssues(baseProject([
      { ...baseLayer, id: "bg", type: "background", fill: { type: "solid", color: "#F8FAFC" }, x: 0, y: 0 },
      { ...baseLayer, id: "headline", type: "text", text: "見出し", x: 96, y: 120, width: 1000, height: 120 },
      { ...baseLayer, id: "hero-generated-visual", type: "image", assetId: "generated-hero", x: 130, y: 520, width: 1030, height: 1250 },
      { ...baseLayer, id: "caption", type: "text", text: "生成した背景", x: 160, y: 580, width: 760, height: 80 },
      ...Array.from({ length: 7 }, (_, index) => ({
        ...baseLayer,
        id: `floating-card-${index}`,
        type: "shape" as const,
        fill: { type: "solid" as const, color: index % 2 ? "#ECFEFF" : "#FFFFFF" },
        x: 180 + (index % 2) * 420,
        y: 760 + index * 130,
        width: 360,
        height: 90,
        radius: 28
      }))
    ]));
    expect(issues.some((issue) => issue.message.includes("must include a device"))).toBe(false);
  });

  it("flags requested panorama sets without continuity layers", () => {
    const baseLayer = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };
    const makeArtboard = (index: number) => ({
      id: `ios-panorama-${index}`,
      width: 1290,
      height: 2796,
      platform: "ios" as const,
      target: "ios-6-9-portrait",
      layers: [
        { ...baseLayer, id: "bg", type: "background" as const, fill: { type: "solid" as const, color: "#F8FAFC" }, x: 0, y: 0 },
        { ...baseLayer, id: "headline", type: "text" as const, text: "見出し", x: 96, y: 120, width: 1000, height: 120, fontSize: 86 },
        { ...baseLayer, id: "hero-card", type: "shape" as const, fill: { type: "solid" as const, color: "#FFFFFF" }, x: 140, y: 650, width: 980, height: 640, radius: 48 },
        ...Array.from({ length: 7 }, (_, detailIndex) => ({
          ...baseLayer,
          id: `detail-${index}-${detailIndex}`,
          type: "shape" as const,
          fill: { type: "solid" as const, color: "#E0F2FE" },
          x: 180 + (detailIndex % 2) * 420,
          y: 760 + detailIndex * 100,
          width: 360,
          height: 70,
          radius: 24
        }))
      ]
    });
    const project = multiSlideProject([makeArtboard(1), makeArtboard(2), makeArtboard(3)]);
    project.referenceInspirations = [{
      id: "reference-panorama",
      source: "test",
      platform: "ios",
      inspirationOnly: true,
      patterns: { composition: "3枚連結パノラマ" }
    }];
    const issues = designQualityIssues(project);
    expect(issues.some((issue) => issue.severity === "error" && issue.message.includes("panorama pattern was requested"))).toBe(true);
  });

  it("does not treat ordinary 3-slide wording as a panorama request", () => {
    const baseLayer = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };
    const makeArtboard = (index: number) => ({
      id: `ios-three-slide-${index}`,
      width: 1290,
      height: 2796,
      platform: "ios" as const,
      target: "ios-6-9-portrait",
      layers: [
        { ...baseLayer, id: "bg", type: "background" as const, fill: { type: "solid" as const, color: "#10051F" }, x: 0, y: 0 },
        { ...baseLayer, id: "headline", type: "text" as const, text: "見出し", x: 96, y: 120, width: 1000, height: 120, fontSize: 86 },
        { ...baseLayer, id: "stage-image", type: "image" as const, assetId: "stage", x: 130, y: 520, width: 1030, height: 900 },
        ...Array.from({ length: 7 }, (_, detailIndex) => ({
          ...baseLayer,
          id: `wave-detail-${index}-${detailIndex}`,
          type: "shape" as const,
          fill: { type: "solid" as const, color: detailIndex % 2 ? "#F472B6" : "#22D3EE" },
          x: 180 + (detailIndex % 2) * 420,
          y: 760 + detailIndex * 100,
          width: 360,
          height: 70,
          radius: 24
        }))
      ]
    });
    const project = multiSlideProject([makeArtboard(1), makeArtboard(2), makeArtboard(3)]);
    project.referenceInspirations = [{
      id: "reference-three-slides",
      source: "test",
      platform: "ios",
      inspirationOnly: true,
      patterns: { compositionDecision: "3枚目は通知と参加CTAを前景化する" }
    }];
    const issues = designQualityIssues(project);
    expect(issues.some((issue) => issue.message.includes("panorama pattern was requested"))).toBe(false);
  });

  it("allows audio-live campaigns to repeat a stage hero when waveform, event, and notification motifs vary", () => {
    const baseLayer = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };
    const makeArtboard = (index: number, includeDevice: boolean, motif: "wave" | "album" | "notification") => ({
      id: `ios-live-${index}`,
      width: 1290,
      height: 2796,
      platform: "ios" as const,
      target: "ios-6-9-portrait",
      layers: [
        { ...baseLayer, id: "bg", type: "background" as const, fill: { type: "solid" as const, color: "#10051F" }, x: 0, y: 0 },
        { ...baseLayer, id: "headline", type: "text" as const, text: "ライブ", x: 96, y: 120, width: 1000, height: 120, fontSize: 86 },
        { ...baseLayer, id: "stage-image", type: "image" as const, assetId: "stage", x: 130, y: 520, width: 1030, height: 900 },
        ...(includeDevice ? [{ ...baseLayer, id: "device", type: "device" as const, device: "iphone-6-9" as const, x: 650, y: 850, width: 430, height: 930, radius: 60, screenshotAssetId: `shot-${index}` }] : []),
        ...Array.from({ length: 7 }, (_, detailIndex) => ({
          ...baseLayer,
          id: `${motif}-detail-${index}-${detailIndex}`,
          type: "shape" as const,
          fill: { type: "solid" as const, color: detailIndex % 2 ? "#F472B6" : "#22D3EE" },
          x: 180 + (detailIndex % 2) * 420,
          y: 760 + detailIndex * 100,
          width: 360,
          height: 70,
          radius: 24
        }))
      ]
    });
    const project = multiSlideProject([
      makeArtboard(1, true, "wave"),
      makeArtboard(2, false, "album"),
      makeArtboard(3, true, "notification")
    ]);
    project.generatedImageAssets = [{ id: "stage", type: "generated-image", path: "assets/generated/stage.png", width: 900, height: 1200 }];
    project.referenceInspirations = [{
      id: "reference-live",
      source: "test",
      platform: "ios",
      inspirationOnly: true,
      patterns: { composition: "audio-live-gradient with waveform, album event cards, and notification stack" }
    }];
    const issues = designQualityIssues(project);
    expect(issues.some((issue) => issue.message.includes("composition is too repetitive"))).toBe(false);
    expect(issues.some((issue) => issue.message.includes("AI reference needs"))).toBe(false);
  });

  it("requires requested panorama sets to have more than one continuous repeated layer", () => {
    const baseLayer = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };
    const makeArtboard = (index: number) => ({
      id: `ios-panorama-thin-${index}`,
      width: 1290,
      height: 2796,
      platform: "ios" as const,
      target: "ios-6-9-portrait",
      layers: [
        { ...baseLayer, id: "bg", type: "background" as const, fill: { type: "solid" as const, color: "#F8FAFC" }, x: 0, y: 0 },
        { ...baseLayer, id: "headline", type: "text" as const, text: "見出し", x: 96, y: 120, width: 1000, height: 120, fontSize: 86 },
        { ...baseLayer, id: "panorama-wide-board", type: "shape" as const, fill: { type: "solid" as const, color: "#FFFFFF" }, x: -(index - 1) * 760, y: 650, width: 3500, height: 820, radius: 48 },
        ...Array.from({ length: 7 }, (_, detailIndex) => ({
          ...baseLayer,
          id: `detail-${index}-${detailIndex}`,
          type: "shape" as const,
          fill: { type: "solid" as const, color: detailIndex % 2 ? "#E0F2FE" : "#14B8A6" },
          x: 180 + (detailIndex % 2) * 420,
          y: 760 + detailIndex * 100,
          width: 360,
          height: 70,
          radius: 24
        }))
      ]
    });
    const project = multiSlideProject([makeArtboard(1), makeArtboard(2), makeArtboard(3)]);
    project.referenceInspirations = [{
      id: "reference-panorama",
      source: "test",
      platform: "ios",
      inspirationOnly: true,
      patterns: { composition: "3枚連結パノラマ" }
    }];
    const issues = designQualityIssues(project);
    expect(issues.some((issue) => issue.severity === "error" && issue.message.includes("at least two repeated continuity layers"))).toBe(true);
  });

  it("accepts requested panorama sets with two wide repeated layers shifted across three slides", () => {
    const baseLayer = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };
    const makeArtboard = (index: number) => ({
      id: `ios-panorama-ok-${index}`,
      width: 1290,
      height: 2796,
      platform: "ios" as const,
      target: "ios-6-9-portrait",
      layers: [
        { ...baseLayer, id: "bg", type: "background" as const, fill: { type: "solid" as const, color: "#F8FAFC" }, x: 0, y: 0 },
        { ...baseLayer, id: "headline", type: "text" as const, text: "見出し", x: 96, y: 120, width: 1000, height: 120, fontSize: 86 },
        { ...baseLayer, id: "panorama-wide-board", type: "shape" as const, fill: { type: "solid" as const, color: "#FFFFFF" }, x: -(index - 1) * 760, y: 650, width: 3500, height: 820, radius: 48 },
        { ...baseLayer, id: "panorama-hero-strip", type: "shape" as const, fill: { type: "solid" as const, color: "#CCFBF1" }, x: -(index - 1) * 760 + 180, y: 930, width: 3100, height: 320, radius: 44 },
        ...Array.from({ length: 7 }, (_, detailIndex) => ({
          ...baseLayer,
          id: `panorama-detail-${index}-${detailIndex}`,
          type: "shape" as const,
          fill: { type: "solid" as const, color: detailIndex % 2 ? "#E0F2FE" : "#14B8A6" },
          x: 180 + (detailIndex % 2) * 420,
          y: 760 + detailIndex * 100,
          width: 360,
          height: 70,
          radius: 24
        })),
        { ...baseLayer, id: "caption", type: "text" as const, text: "連続する横長の見せ方", x: 180, y: 1660, width: 880, height: 80, fontSize: 44 }
      ]
    });
    const project = multiSlideProject([makeArtboard(1), makeArtboard(2), makeArtboard(3)]);
    project.referenceInspirations = [{
      id: "reference-panorama",
      source: "test",
      platform: "ios",
      inspirationOnly: true,
      patterns: { composition: "3枚連結パノラマ" }
    }];
    const issues = designQualityIssues(project);
    expect(issues.some((issue) => issue.severity === "error" && issue.message.includes("panorama pattern was requested"))).toBe(false);
  });

  it("requires generated visual hero layers for strong visual references", () => {
    const baseLayer = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };
    const makeArtboard = (index: number) => ({
      id: `ios-visual-${index}`,
      width: 1290,
      height: 2796,
      platform: "ios" as const,
      target: "ios-6-9-portrait",
      layers: [
        { ...baseLayer, id: "bg", type: "background" as const, fill: { type: "solid" as const, color: "#F8FAFC" }, x: 0, y: 0 },
        { ...baseLayer, id: "headline", type: "text" as const, text: "見出し", x: 96, y: 120, width: 1000, height: 120, fontSize: 86 },
        { ...baseLayer, id: "hero-card", type: "shape" as const, fill: { type: "solid" as const, color: "#FFFFFF" }, x: 140, y: 650, width: 980, height: 640, radius: 48 },
        ...Array.from({ length: 7 }, (_, detailIndex) => ({
          ...baseLayer,
          id: `detail-${index}-${detailIndex}`,
          type: "shape" as const,
          fill: { type: "solid" as const, color: "#E0F2FE" },
          x: 180 + (detailIndex % 2) * 420,
          y: 760 + detailIndex * 100,
          width: 360,
          height: 70,
          radius: 24
        }))
      ]
    });
    const project = multiSlideProject([makeArtboard(1), makeArtboard(2), makeArtboard(3)]);
    project.referenceInspirations = [{
      id: "reference-visual",
      source: "test",
      platform: "ios",
      inspirationOnly: true,
      patterns: { composition: "editorial photo background with image hero" }
    }];
    const issues = designQualityIssues(project);
    expect(issues.some((issue) => issue.severity === "error" && issue.message.includes("no generatedImageAssets"))).toBe(true);
  });

  it("flags AI reference sets that only show tiny generated previews", () => {
    const baseLayer = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };
    const makeArtboard = (index: number) => ({
      id: `ios-ai-tiny-${index}`,
      width: 1290,
      height: 2796,
      platform: "ios" as const,
      target: "ios-6-9-portrait",
      layers: [
        { ...baseLayer, id: "bg", type: "background" as const, fill: { type: "solid" as const, color: "#F8FAFC" }, x: 0, y: 0 },
        { ...baseLayer, id: "headline", type: "text" as const, text: "聞きたいことを相談", x: 96, y: 120, width: 1000, height: 120, fontSize: 86 },
        { ...baseLayer, id: "device", type: "device" as const, device: "iphone-6-9" as const, x: 250, y: 620, width: 790, height: 1710, radius: 86 },
        { ...baseLayer, id: "screen-prompt", type: "shape" as const, fill: { type: "solid" as const, color: "#E0F2FE" }, x: 330, y: 780, width: 620, height: 120, radius: 32 },
        { ...baseLayer, id: "screen-answer", type: "shape" as const, fill: { type: "solid" as const, color: "#FFFFFF" }, x: 330, y: 960, width: 620, height: 220, radius: 32 },
        { ...baseLayer, id: "screen-generated-preview", type: "image" as const, assetId: "tiny-preview", x: 430, y: 1260, width: 300, height: 180, radius: 24 },
        ...Array.from({ length: 8 }, (_, detailIndex) => ({
          ...baseLayer,
          id: `screen-ai-line-${index}-${detailIndex}`,
          type: "shape" as const,
          fill: { type: "solid" as const, color: detailIndex % 2 ? "#BAE6FD" : "#CBD5E1" },
          x: 350,
          y: 1500 + detailIndex * 86,
          width: 560 - detailIndex * 30,
          height: 28,
          radius: 14
        }))
      ]
    });
    const project = multiSlideProject([makeArtboard(1), makeArtboard(2), makeArtboard(3)]);
    project.generatedImageAssets = [{ id: "tiny-preview", type: "generated-image", path: "assets/generated/tiny.png", width: 300, height: 180 }];
    project.referenceInspirations = [{
      id: "reference-ai",
      source: "test",
      platform: "ios",
      inspirationOnly: true,
      patterns: { recommendedPattern: "message-conversation + object-cutout", heroMotif: "chat thread plus generated image/output card" }
    }];
    const issues = designQualityIssues(project);
    expect(issues.some((issue) => issue.severity === "error" && issue.message.includes("AI reference needs a rich generated output hero"))).toBe(true);
  });

  it("accepts AI reference sets with a large generated output visual and editable details", () => {
    const baseLayer = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };
    const makeArtboard = (index: number, hero = false) => ({
      id: `ios-ai-rich-${index}`,
      width: 1290,
      height: 2796,
      platform: "ios" as const,
      target: "ios-6-9-portrait",
      layers: [
        { ...baseLayer, id: "bg", type: "background" as const, fill: { type: "solid" as const, color: "#F8FAFC" }, x: 0, y: 0 },
        { ...baseLayer, id: "headline", type: "text" as const, text: "相談から完成まで", x: 96, y: 120, width: 1000, height: 120, fontSize: 86 },
        ...(hero
          ? [
              { ...baseLayer, id: "output-board", type: "shape" as const, fill: { type: "solid" as const, color: "#FFFFFF" }, x: 120, y: 620, width: 1050, height: 1220, radius: 56 },
              { ...baseLayer, id: "output-generated-hero", type: "image" as const, assetId: "ai-output", x: 170, y: 700, width: 950, height: 720, radius: 44 }
            ]
          : [{ ...baseLayer, id: "device", type: "device" as const, device: "iphone-6-9" as const, x: 250, y: 620, width: 790, height: 1710, radius: 86 }]),
        ...Array.from({ length: 16 }, (_, detailIndex) => ({
          ...baseLayer,
          id: `output-detail-${index}-${detailIndex}`,
          type: detailIndex % 3 === 0 ? "text" as const : "shape" as const,
          text: detailIndex % 3 === 0 ? "生成結果" : undefined,
          fill: detailIndex % 3 === 0 ? undefined : { type: "solid" as const, color: detailIndex % 2 ? "#DBEAFE" : "#A5F3FC" },
          x: hero ? 180 + (detailIndex % 2) * 450 : 330,
          y: hero ? 1460 + detailIndex * 32 : 780 + detailIndex * 86,
          width: hero ? 360 : 620,
          height: hero ? 28 : 56,
          radius: 14
        }))
      ]
    });
    const project = multiSlideProject([makeArtboard(1), makeArtboard(2, true), makeArtboard(3)]);
    project.generatedImageAssets = [{ id: "ai-output", type: "generated-image", path: "assets/generated/ai-output.png", width: 900, height: 1200 }];
    project.referenceInspirations = [{
      id: "reference-ai",
      source: "test",
      platform: "ios",
      inspirationOnly: true,
      patterns: { recommendedPattern: "message-conversation + object-cutout", heroMotif: "chat thread plus generated image/output card" }
    }];
    const issues = designQualityIssues(project);
    expect(issues.some((issue) => issue.severity === "error" && issue.message.includes("AI reference needs a rich generated output hero"))).toBe(false);
  });

  it("flags generated bitmap visuals without editable overlay objects", () => {
    const baseLayer = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };
    const makeArtboard = (index: number) => ({
      id: `ios-bitmap-${index}`,
      width: 1290,
      height: 2796,
      platform: "ios" as const,
      target: "ios-6-9-portrait",
      layers: [
        { ...baseLayer, id: "bg", type: "background" as const, fill: { type: "solid" as const, color: "#F8FAFC" }, x: 0, y: 0 },
        { ...baseLayer, id: "headline", type: "text" as const, text: "画像主役", x: 96, y: 120, width: 1000, height: 120, fontSize: 86 },
        { ...baseLayer, id: "hero-generated-image", type: "image" as const, assetId: "bitmap", x: 130, y: 540, width: 1030, height: 900, radius: 48 },
        ...Array.from({ length: 7 }, (_, detailIndex) => ({
          ...baseLayer,
          id: `screen-detail-${index}-${detailIndex}`,
          type: "shape" as const,
          fill: { type: "solid" as const, color: "#E0F2FE" },
          x: 180 + (detailIndex % 2) * 420,
          y: 1600 + detailIndex * 95,
          width: 360,
          height: 70,
          radius: 24
        }))
      ]
    });
    const project = multiSlideProject([makeArtboard(1), makeArtboard(2), makeArtboard(3)]);
    project.generatedImageAssets = [{ id: "bitmap", type: "generated-image", path: "assets/generated/bitmap.png", width: 900, height: 1200 }];
    const issues = designQualityIssues(project);
    expect(issues.some((issue) => issue.severity === "error" && issue.message.includes("generated bitmap visuals must be paired"))).toBe(true);
  });
});
