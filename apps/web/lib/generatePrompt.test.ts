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
});
