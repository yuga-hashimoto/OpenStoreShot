import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { StoreShotProjectSchema } from "@openstoreshot/core";
import { renderProject } from "./renderProject";

describe("renderProject", () => {
  it("renders a png smoke output", async () => {
    const project = StoreShotProjectSchema.parse({
      schemaVersion: "0.1.0",
      projectId: "demo",
      name: "Demo",
      brand: { colors: { background: "#fff" }, fontFamily: "Inter", tone: "calm" },
      app: { name: "HabitLoop", category: "Productivity", shortDescription: "Habits", targetAudience: "builders" },
      locales: ["en-US"],
      platforms: ["ios"],
      slides: [{ id: "s1", title: "Title", artboards: [{ id: "a1", width: 400, height: 800, platform: "ios", layers: [{ id: "bg", type: "background", fill: { type: "solid", color: "#fff" } }] }] }]
    });
    const dir = await mkdtemp(join(tmpdir(), "storeshot-"));
    const [output] = await renderProject(project, { outputDir: dir });
    expect(output).toBeTruthy();
    expect((await readFile(output!)).length).toBeGreaterThan(100);
  });
});
