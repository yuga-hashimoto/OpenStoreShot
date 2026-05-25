import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import type { GeneratedImage, ImageGenerationProvider, ImageGenOptions } from "./provider";
import { assertSafeImagePrompt } from "./guardrails";

function parseSize(size = "1024x1024") {
  const [width, height] = size.split("x").map(Number);
  return { width: width || 1024, height: height || 1024 };
}

export class MockImageGenerationProvider implements ImageGenerationProvider {
  async generateImage(prompt: string, options: ImageGenOptions = {}): Promise<GeneratedImage> {
    assertSafeImagePrompt(prompt);
    const { width, height } = parseSize(options.size);
    const outputDir = options.outputDir ?? "examples/demo-project/assets/generated";
    await mkdir(outputDir, { recursive: true });
    const id = `mock-${Date.now()}`;
    const path = join(outputDir, `${id}.png`);
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#ccfbf1"/><stop offset=".55" stop-color="#eef2ff"/><stop offset="1" stop-color="#fef3c7"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${width * 0.78}" cy="${height * 0.2}" r="${Math.min(width, height) * 0.18}" fill="#14b8a6" opacity=".18"/><circle cx="${width * 0.18}" cy="${height * 0.82}" r="${Math.min(width, height) * 0.24}" fill="#f59e0b" opacity=".14"/><text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-family="Inter,Arial" font-size="${Math.max(22, width / 28)}" font-weight="800" fill="#0f172a">Mock Imagegen</text></svg>`;
    await sharp(Buffer.from(svg)).png().toFile(path);
    return { id, path, width, height, provider: "mock", model: "mock-gradient-v1", prompt, createdAt: new Date().toISOString(), metadata: options.metadata ?? {} };
  }

  async editImage(_inputImage: string, prompt: string, options?: ImageGenOptions): Promise<GeneratedImage> {
    return this.generateImage(`Edited mock: ${prompt}`, options);
  }

  async createVariations(inputImage: string, options?: ImageGenOptions): Promise<GeneratedImage[]> {
    return Promise.all([0, 1, 2].map((index) => this.generateImage(`Variation ${index + 1} of ${inputImage}`, options)));
  }
}
