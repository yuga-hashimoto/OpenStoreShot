import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MockImageGenerationProvider } from "./mockProvider";

describe("MockImageGenerationProvider", () => {
  it("creates a placeholder image", async () => {
    const dir = await mkdtemp(join(tmpdir(), "imagegen-"));
    const image = await new MockImageGenerationProvider().generateImage("soft original background", { outputDir: dir, size: "1024x500" });
    expect(image.width).toBe(1024);
    expect(image.path.endsWith(".png")).toBe(true);
  });
});
