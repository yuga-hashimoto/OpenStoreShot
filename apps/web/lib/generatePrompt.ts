export interface GenerationReference {
  appName: string;
  category: string;
  rating?: number | undefined;
  screenshotUrls: string[];
}

export interface GenerationBrief {
  appName?: string | undefined;
  intent?: string | undefined;
  slideCount?: number | undefined;
  platforms?: ("ios" | "android")[] | undefined;
  locale?: string | undefined;
}

export interface GenerationContext {
  references: GenerationReference[];
  hasProject: boolean;
  brief?: GenerationBrief | undefined;
}

export function buildGenerationPrompt({ references, hasProject, brief }: GenerationContext): string {
  const referenceLines =
    references.length > 0
      ? references
          .map(
            (ref, index) =>
              `${index + 1}. ${ref.appName} — ${ref.category}${ref.rating ? `, rating ${ref.rating}` : ""} (${ref.screenshotUrls.length} screenshots)`
          )
          .join("\n")
      : "(none selected)";

  const noReferences = references.length === 0;
  const slideCount = brief?.slideCount ?? 5;
  const platforms = brief?.platforms?.length ? brief.platforms : ["ios", "android"];
  const locale = brief?.locale ?? "ja-JP";
  const briefLines: string[] = [];
  if (brief?.appName) briefLines.push(`- App name: ${brief.appName}`);
  if (brief?.intent) briefLines.push(`- Intent / what the user wants emphasized:\n${brief.intent.split("\n").map((l) => `  > ${l}`).join("\n")}`);
  briefLines.push(`- Slide count: exactly ${slideCount}`);
  briefLines.push(`- Platforms to produce artboards for: ${platforms.join(", ")}`);
  briefLines.push(`- Primary copy locale: ${locale}`);

  return [
    "You are a senior App Store / Google Play screenshot designer working inside OpenStoreShot.",
    "",
    `Task: ${hasProject ? "Refine the existing project by editing" : "Create a new project by writing"} the file \`storeshot.project.json\` in the current working directory.`,
    hasProject
      ? "Read the existing storeshot.project.json first and improve its slides and copy."
      : "Infer the app's name, category, and value proposition from any README or metadata in this directory; otherwise use clear placeholders the user can edit.",
    "",
    "User brief (TREAT AS HIGH-PRIORITY — match it precisely):",
    briefLines.join("\n"),
    "",
    "Design references — INSPIRATION ONLY. Never copy their images, logos, text, or exact layouts; only borrow composition, copy length, and color mood:",
    referenceLines,
    noReferences
      ? "IMPORTANT: References are empty. Leave `referenceInspirations` as an empty array `[]`. Do NOT invent placeholder references."
      : "If you populate `referenceInspirations`, every entry MUST include all required fields shown in the template below.",
    "",
    "═══ CRITICAL — SCHEMA GOTCHAS (most failures come from these) ═══",
    '- `schemaVersion` MUST be exactly the string "0.1.0". Do not invent newer versions.',
    "- `fontWeight` is a NUMBER (e.g. 500, 700, 850). NEVER a string like \"bold\" or \"700\".",
    '- `fill` is ALWAYS an OBJECT, never a bare color string. Use one of:',
    '    { "type": "solid", "color": "#0F172A" }',
    '    { "type": "gradient", "from": "#E0F2FE", "to": "#F8FAFC", "angle": 145 }',
    "- `exportTargets[]` entries REQUIRE `id` (string), `platform`, `locale`, `artboardId` — do not omit `id`.",
    "- `referenceInspirations[]` entries REQUIRE `id`, `source`, `platform`, `inspirationOnly: true`, `patterns` (record of string). Omit the array if you have nothing real to add.",
    '- `device` must be one of: "iphone-6-9", "iphone-ipad", "android-phone", "android-tablet".',
    '- `align` must be one of: "left", "center", "right".',
    "- `opacity` is a number between 0 and 1.",
    "",
    "═══ REFERENCE TEMPLATE (valid minimum — copy the SHAPE exactly) ═══",
    "```json",
    JSON.stringify(
      {
        schemaVersion: "0.1.0",
        projectId: "your-project-id",
        name: "プロジェクト名",
        brand: {
          colors: { primary: "#4F46E5", background: "#F8FAFC", accent: "#0EA5E9", ink: "#0F172A" },
          fontFamily: "Inter",
          tone: "modern, trustworthy"
        },
        app: {
          name: "アプリ名",
          category: "Productivity",
          shortDescription: "アプリの短い説明",
          targetAudience: "ターゲットユーザー"
        },
        locales: [locale],
        platforms,
        assets: [],
        generatedImageAssets: [],
        referenceInspirations: [],
        slides: [
          {
            id: "slide-01",
            title: "見出し",
            role: "benefit",
            localeText: {},
            artboards: [
              {
                id: "ios-6-9-portrait",
                width: 1290,
                height: 2796,
                platform: "ios",
                target: "ios-6-9-portrait",
                layers: [
                  {
                    id: "bg",
                    type: "background",
                    fill: { type: "gradient", from: "#E0F2FE", to: "#F8FAFC", angle: 145 }
                  },
                  {
                    id: "headline",
                    type: "text",
                    text: "見出しテキスト",
                    x: 96,
                    y: 170,
                    width: 1098,
                    height: 230,
                    fontSize: 86,
                    fontWeight: 850,
                    lineHeight: 1.05,
                    color: "#0F172A",
                    align: "center"
                  },
                  {
                    id: "device",
                    type: "device",
                    device: "iphone-6-9",
                    x: 250,
                    y: 690,
                    width: 790,
                    height: 1710,
                    radius: 86
                  }
                ]
              }
            ]
          }
        ],
        exportTargets: [
          {
            id: "ios-ja",
            platform: "ios",
            locale,
            artboardId: "ios-6-9-portrait",
            format: "png",
            outputDir: "exports/ios"
          }
        ]
      },
      null,
      2
    ),
    "```",
    "",
    "Requirements:",
    `- Produce exactly ${slideCount} slides. If the count makes the benefit→feature→workflow→trust→cta arc lopsided, distribute roles sensibly (e.g. 3 = benefit, feature, cta; 7 = add a second feature and a second workflow).`,
    `- Produce artboards for these platforms only: ${platforms.join(", ")}.`,
    `- Write all copy in ${locale}.`,
    "- Keep copy short and specific. Each slide's copy must advance the narrative — do NOT just restate the role label.",
    "- Vary layout, composition, and background across slides for visual rhythm. Alternate alignment, headline placement, device size or framing, and use distinct background palettes per slide.",
    "- Include at least one accent element (shape, badge, divider, or decorative image layer) per slide where it improves readability or rhythm. Keep it minimal and intentional.",
    "- Populate `exportTargets` for every (platform, locale) you produce artboards for — every entry needs `id`.",
    "- The final file MUST parse against the schema above. Run `pnpm storeshot validate ./storeshot.project.json` if available; otherwise mentally check every field against the template before saving.",
    "- Write only ./storeshot.project.json; do not touch unrelated files."
  ].join("\n");
}
