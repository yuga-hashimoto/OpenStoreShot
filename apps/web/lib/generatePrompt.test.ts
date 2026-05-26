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
});
