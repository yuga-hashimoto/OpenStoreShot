import { describe, expect, it } from "vitest";
import { referenceDesignPatterns, referenceHintLines } from "./referenceDesign";

const baseReference = {
  id: "ref",
  source: "appstore" as const,
  platform: "ios" as const,
  appName: "Reference App",
  developer: "Reference Studio",
  category: "Productivity",
  rating: 4.8,
  country: "jp",
  storeUrl: "https://example.com",
  screenshotUrls: ["https://example.com/1.png", "https://example.com/2.png", "https://example.com/3.png"]
};

describe("referenceDesignPatterns", () => {
  it("turns AI references into concrete conversation and generated-output guidance", () => {
    const patterns = referenceDesignPatterns({ ...baseReference, appName: "ChatGPT", category: "Productivity" });
    expect(patterns.recommendedPattern).toContain("message-conversation");
    expect(patterns.heroMotif).toContain("generated image");
    expect(patterns.appSurfaceDetails).toContain("prompt input");
  });

  it("turns browser references into browser-specific UI requirements", () => {
    const patterns = referenceDesignPatterns({ ...baseReference, appName: "Google Chrome - ウェブブラウザ", category: "Utilities" });
    expect(patterns.recommendedPattern).toContain("feature-infographic");
    expect(patterns.composition).toContain("search bar");
    expect(patterns.appSurfaceDetails).toContain("bottom tabs");
  });

  it("turns live music references into neon audio-specific UI requirements", () => {
    const patterns = referenceDesignPatterns({ ...baseReference, appName: "LiveSoul", category: "Music" });
    expect(patterns.recommendedPattern).toContain("audio-live-gradient");
    expect(patterns.composition).toContain("waveform bars");
    expect(patterns.heroMotif).toContain("now-playing");
    expect(patterns.appSurfaceDetails).toContain("playlist tiles");
  });

  it("does not force every social feed reference into a panorama pattern", () => {
    const threads = referenceDesignPatterns({ ...baseReference, appName: "Threads", category: "Social Networking" });
    const setlog = referenceDesignPatterns({ ...baseReference, appName: "setlog", category: "Social Networking" });
    expect(threads.recommendedPattern).toContain("dark-premium");
    expect(threads.recommendedPattern).not.toContain("three-panel-panorama");
    expect(threads.heroMotif).toContain("dark feed stack");
    expect(setlog.recommendedPattern).toContain("three-panel-panorama");
  });

  it("turns coupon and finance references into distinct art directions", () => {
    const coupon = referenceDesignPatterns({ ...baseReference, appName: "31Club サーティワン公式アプリ", category: "Food & Drink" });
    const finance = referenceDesignPatterns({ ...baseReference, appName: "ゆうちょ通帳アプリ", category: "Finance" });
    expect(coupon.recommendedPattern).toContain("commerce-coupon");
    expect(coupon.heroMotif).toContain("barcode");
    expect(finance.recommendedPattern).toContain("card-led-dashboard");
    expect(finance.heroMotif).toContain("large balance number");
  });

  it("includes benchmark-quality lines for setup guide reference hints", () => {
    const lines = referenceHintLines({ ...baseReference, appName: "setlog", category: "Social Networking" });
    expect(lines.some((line) => line.startsWith("推奨パターン:"))).toBe(true);
    expect(lines.some((line) => line.startsWith("主役モチーフ:"))).toBe(true);
    expect(lines.some((line) => line.startsWith("品質基準:"))).toBe(true);
    expect(lines.join("\n")).toContain("App Store top-10 benchmark");
  });
});
