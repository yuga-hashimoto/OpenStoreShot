export interface GenerationReference {
  appName: string;
  category: string;
  rating?: number | undefined;
  screenshotUrls: string[];
}

export interface GenerationContext {
  references: GenerationReference[];
  hasProject: boolean;
}

export function buildGenerationPrompt({ references, hasProject }: GenerationContext): string {
  const referenceLines =
    references.length > 0
      ? references
          .map(
            (ref, index) =>
              `${index + 1}. ${ref.appName} — ${ref.category}${ref.rating ? `, rating ${ref.rating}` : ""} (${ref.screenshotUrls.length} screenshots)`
          )
          .join("\n")
      : "(none selected)";

  return [
    "You are a senior App Store / Google Play screenshot designer working inside OpenStoreShot.",
    "",
    `Task: ${hasProject ? "Refine the existing project by editing" : "Create a new project by writing"} the file \`storeshot.project.json\` in the current working directory.`,
    hasProject
      ? "Read the existing storeshot.project.json first and improve its slides and copy."
      : "Infer the app's name, category, and value proposition from any README or metadata in this directory; otherwise use clear placeholders the user can edit.",
    "",
    "File format (OpenStoreShot schema, JSON):",
    "- schemaVersion, projectId, name",
    "- brand: { colors: { primary, background, accent, ink }, fontFamily, tone }",
    "- app: { name, category, shortDescription, targetAudience }",
    '- locales (e.g. ["ja-JP"]), platforms (e.g. ["ios","android"])',
    "- slides: each { id, title, role (benefit|feature|workflow|trust|cta), artboards: [{ id, width, height, platform, target, layers: [...] }] }",
    "- layer types: background (fill solid/gradient), text (text, fontSize, fontWeight, color, align, x, y, width, height), device, image, shape; include x, y, rotation, radius, opacity.",
    "",
    "Design references — INSPIRATION ONLY. Never copy their images, logos, text, or exact layouts; only borrow composition, copy length, and color mood:",
    referenceLines,
    "",
    "Requirements:",
    "- Produce 5 slides telling a benefit → feature → workflow → trust → cta story.",
    "- Keep copy short. Write copy in the project's locale (Japanese if unspecified).",
    "- Output MUST be valid JSON that parses against the schema.",
    "- Write only ./storeshot.project.json; do not touch unrelated files."
  ].join("\n");
}
