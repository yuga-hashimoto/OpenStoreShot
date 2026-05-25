import { z } from "zod";

export const PlatformSchema = z.enum(["ios", "android"]);
export const LayerTypeSchema = z.enum([
  "background",
  "text",
  "image",
  "shape",
  "device",
  "group"
]);

const FillSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("solid"), color: z.string() }),
  z.object({ type: z.literal("gradient"), from: z.string(), to: z.string(), angle: z.number().optional() }),
  z.object({ type: z.literal("image"), assetId: z.string(), fit: z.enum(["cover", "contain"]).default("cover") })
]);

export const LayerSchema = z.object({
  id: z.string().min(1),
  type: LayerTypeSchema,
  name: z.string().optional(),
  text: z.string().optional(),
  assetId: z.string().optional(),
  screenshotAssetId: z.string().optional(),
  device: z.enum(["iphone-6-9", "iphone-ipad", "android-phone", "android-tablet"]).optional(),
  fill: FillSchema.optional(),
  x: z.number().default(0),
  y: z.number().default(0),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  rotation: z.number().default(0),
  radius: z.number().default(0),
  opacity: z.number().min(0).max(1).default(1),
  fontSize: z.number().positive().optional(),
  lineHeight: z.number().positive().optional(),
  fontWeight: z.number().optional(),
  fontFamily: z.string().optional(),
  color: z.string().optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  letterSpacing: z.number().default(0),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
  children: z.array(z.string()).default([])
});

export const ArtboardSchema = z.object({
  id: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  platform: PlatformSchema,
  target: z.string().optional(),
  layers: z.array(LayerSchema)
});

export const SlideSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  role: z.string().optional(),
  localeText: z.record(z.record(z.string())).default({}),
  artboards: z.array(ArtboardSchema)
});

export const AssetSchema = z.object({
  id: z.string(),
  type: z.enum(["image", "generated-image", "screenshot", "icon"]),
  path: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  alt: z.string().optional(),
  generated: z
    .object({
      provider: z.string(),
      model: z.string(),
      prompt: z.string(),
      createdAt: z.string(),
      source: z.record(z.unknown()).default({})
    })
    .optional()
});

export const ReferenceInspirationSchema = z.object({
  id: z.string(),
  source: z.string(),
  platform: PlatformSchema,
  inspirationOnly: z.literal(true),
  appName: z.string().optional(),
  patterns: z.record(z.string())
});

export const ExportTargetSchema = z.object({
  id: z.string(),
  platform: PlatformSchema,
  locale: z.string(),
  artboardId: z.string(),
  format: z.enum(["png", "jpeg"]).default("png"),
  outputDir: z.string().default("exports")
});

export const StoreShotProjectSchema = z.object({
  schemaVersion: z.literal("0.1.0"),
  projectId: z.string(),
  name: z.string(),
  brand: z.object({
    colors: z.record(z.string()),
    fontFamily: z.string(),
    tone: z.string()
  }),
  app: z.object({
    name: z.string(),
    category: z.string(),
    shortDescription: z.string(),
    targetAudience: z.string()
  }),
  locales: z.array(z.string()).min(1),
  platforms: z.array(PlatformSchema).min(1),
  assets: z.array(AssetSchema).default([]),
  generatedImageAssets: z.array(AssetSchema).default([]),
  referenceInspirations: z.array(ReferenceInspirationSchema).default([]),
  slides: z.array(SlideSchema).min(1),
  exportTargets: z.array(ExportTargetSchema).default([]),
  validationResults: z.array(z.record(z.unknown())).default([])
});

export type StoreShotProject = z.infer<typeof StoreShotProjectSchema>;
export type Artboard = z.infer<typeof ArtboardSchema>;
export type Layer = z.infer<typeof LayerSchema>;
export type ExportTarget = z.infer<typeof ExportTargetSchema>;
