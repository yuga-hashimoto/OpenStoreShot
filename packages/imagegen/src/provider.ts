export type ImageGenOptions = {
  size?: "1024x1024" | "1024x500" | "1290x2796" | "1080x1920";
  model?: string;
  outputDir?: string;
  metadata?: Record<string, unknown>;
};

export type GeneratedImage = {
  id: string;
  path: string;
  width: number;
  height: number;
  provider: string;
  model: string;
  prompt: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export interface ImageGenerationProvider {
  generateImage(prompt: string, options?: ImageGenOptions): Promise<GeneratedImage>;
  editImage(inputImage: string, prompt: string, options?: ImageGenOptions): Promise<GeneratedImage>;
  createVariations(inputImage: string, options?: ImageGenOptions): Promise<GeneratedImage[]>;
}
