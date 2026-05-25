import { describe, expect, it } from "vitest";
import { detectCopyrightRisk } from "./guardrails";
import { validateProject } from "./validateProject";
import { StoreShotProjectSchema } from "../schema/project";

describe("validation", () => {
  it("detects copy instructions", () => {
    expect(detectCopyrightRisk("Make it exactly like that app")).toHaveLength(1);
  });

  it("detects target dimension mismatch", () => {
    const project = StoreShotProjectSchema.parse({
      schemaVersion: "0.1.0",
      projectId: "demo",
      name: "Demo",
      brand: { colors: { primary: "#000" }, fontFamily: "Inter", tone: "calm" },
      app: { name: "HabitLoop", category: "Productivity", shortDescription: "Habits", targetAudience: "builders" },
      locales: ["en-US"],
      platforms: ["ios"],
      slides: [{ id: "s1", title: "Title", artboards: [{ id: "a1", target: "ios-6-9-portrait", width: 100, height: 100, platform: "ios", layers: [] }] }]
    });
    expect(validateProject(project).some((issue) => issue.code === "TARGET_DIMENSION_MISMATCH")).toBe(true);
  });
});
