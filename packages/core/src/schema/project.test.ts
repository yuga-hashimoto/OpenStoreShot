import { describe, expect, it } from "vitest";
import { StoreShotProjectSchema } from "./project";

describe("StoreShotProjectSchema", () => {
  it("parses a minimal project", () => {
    const parsed = StoreShotProjectSchema.parse({
      schemaVersion: "0.1.0",
      projectId: "demo",
      name: "Demo",
      brand: { colors: { primary: "#000" }, fontFamily: "Inter", tone: "calm" },
      app: { name: "HabitLoop", category: "Productivity", shortDescription: "Habits", targetAudience: "builders" },
      locales: ["en-US"],
      platforms: ["ios"],
      slides: [{ id: "s1", title: "Title", artboards: [{ id: "a1", width: 1290, height: 2796, platform: "ios", layers: [] }] }]
    });
    expect(parsed.slides[0]?.artboards[0]?.width).toBe(1290);
  });
});
