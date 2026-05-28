import { describe, expect, it } from "vitest";
import { buildGenerationPrompt } from "./generatePrompt";

describe("buildGenerationPrompt", () => {
  it("instructs creating a new project when none exists", () => {
    const prompt = buildGenerationPrompt({ references: [], hasProject: false });
    expect(prompt).toContain("storeshot.project.json");
    expect(prompt.toLowerCase()).toContain("create");
    expect(prompt).toContain("(none selected)");
  });

  it("instructs refining when a project already exists", () => {
    const prompt = buildGenerationPrompt({ references: [], hasProject: true });
    expect(prompt.toLowerCase()).toContain("refine");
  });

  it("lists references and keeps an inspiration-only policy", () => {
    const prompt = buildGenerationPrompt({
      references: [{ appName: "Calm", category: "Health", rating: 4.8, screenshotUrls: ["a", "b"] }],
      hasProject: false
    });
    expect(prompt).toContain("Calm");
    expect(prompt).toContain("Health");
    expect(prompt).toContain("INSPIRATION ONLY");
  });

  it("carries reference design patterns into the agent prompt", () => {
    const prompt = buildGenerationPrompt({
      references: [
        {
          appName: "ScreenFlow",
          category: "Productivity",
          platform: "ios",
          rating: 4.7,
          screenshotUrls: ["https://example.com/1.png"],
          patterns: {
            recommendedPattern: "message-conversation + object-cutout",
            composition: "screenshot-led composition with compact headline",
            colorMood: "light neutral with teal accent",
            deviceFraming: "large detailed app surface",
            heroMotif: "chat thread plus generated image/output card",
            appSurfaceDetails: "prompt input, answer bubbles, generated preview"
          }
        }
      ],
      hasProject: false
    });
    expect(prompt).toContain("reference pattern to adapt");
    expect(prompt).toContain("recommendedPattern");
    expect(prompt).toContain("Reference pattern fields");
    expect(prompt).toContain("heroMotif");
    expect(prompt).toContain("appSurfaceDetails");
    expect(prompt).toContain("screenshot-led composition");
    expect(prompt).toContain("light neutral with teal accent");
    expect(prompt).toContain("https://example.com/1.png");
  });

  it("forbids inventing references when none were selected", () => {
    const prompt = buildGenerationPrompt({ references: [], hasProject: false });
    expect(prompt).toContain("Do NOT invent placeholder references");
  });

  it("embeds the user brief — intent, slide count, platforms, locale", () => {
    const prompt = buildGenerationPrompt({
      references: [],
      hasProject: false,
      brief: {
        appName: "HabitLoop",
        intent: "Emphasize the 30-second log flow. Calm tone.",
        slideCount: 7,
        platforms: ["ios"],
        locale: "en"
      }
    });
    expect(prompt).toContain("HabitLoop");
    expect(prompt).toContain("30-second log flow");
    expect(prompt).toContain("exactly 7 slides");
    expect(prompt).toContain("Platforms to produce artboards for: ios");
    expect(prompt).toContain("platforms only: ios.");
    expect(prompt).toContain("Write all copy in en");
  });

  it("falls back to sensible defaults when brief is absent", () => {
    const prompt = buildGenerationPrompt({ references: [], hasProject: false });
    expect(prompt).toContain("exactly 5 slides");
    expect(prompt).toContain("ios, android");
    expect(prompt).toContain("ja-JP");
  });

  it("pins the schema gotchas that the agent commonly hallucinates", () => {
    const prompt = buildGenerationPrompt({ references: [], hasProject: false });
    // schemaVersion is a literal
    expect(prompt).toContain('"0.1.0"');
    // fontWeight number, not string
    expect(prompt).toContain("fontWeight` is a NUMBER");
    // fill object shape, both variants
    expect(prompt).toContain('"type": "solid"');
    expect(prompt).toContain('"type": "gradient"');
    // exportTargets need id
    expect(prompt).toContain("REQUIRE `id`");
    // template contains a valid skeleton
    expect(prompt).toContain('"schemaVersion": "0.1.0"');
  });

  it("rejects generic phone-only screenshot designs", () => {
    const prompt = buildGenerationPrompt({ references: [], hasProject: false });
    expect(prompt).toContain("Do NOT output plain slides");
    expect(prompt).toContain("at least 10 visible layers");
    expect(prompt).toContain("credible fictional app UI");
    expect(prompt).toContain("inside or overlap the device screen");
    expect(prompt).toContain("one shared brand palette");
    expect(prompt).toContain("primary phone/app-surface scale and baseline consistent");
    expect(prompt).toContain("composition archetypes");
    expect(prompt).toContain("visibly non-phone-led");
    expect(prompt).toContain("Codex imagegen");
    expect(prompt).toContain("generatedImageAssets");
  });

  it("includes the store screenshot catalog including panorama and live audio patterns", () => {
    const prompt = buildGenerationPrompt({ references: [], hasProject: false });
    expect(prompt).toContain("Store screenshot pattern catalog");
    expect(prompt).toContain("three-panel-panorama");
    expect(prompt).toContain("at least two repeated `panorama-*` layer IDs");
    expect(prompt).toContain("at least 1.8x the artboard width");
    expect(prompt).toContain("Panorama blueprint");
    expect(prompt).toContain("x position must move left from slide 1 to 2 to 3");
    expect(prompt).toContain("card-led-dashboard");
    expect(prompt).toContain("commerce-coupon");
    expect(prompt).toContain("dark-premium");
    expect(prompt).toContain("audio-live-gradient");
  });

  it("requires reference-specific motifs across every slide", () => {
    const prompt = buildGenerationPrompt({ references: [], hasProject: false });
    expect(prompt).toContain("Reference fidelity bar");
    expect(prompt).toContain("reference-specific motif");
    expect(prompt).toContain("repeat across all slides");
    expect(prompt).toContain("`generatedImageAssets` item");
    expect(prompt).toContain("AI/chat/generation app");
    expect(prompt).toContain("generated output itself the hero");
  });
});
