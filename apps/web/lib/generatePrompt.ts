import { screenshotPatternPromptBlock } from "./storeScreenshotPatterns";

export interface GenerationReference {
  id?: string | undefined;
  platform?: "ios" | "android" | undefined;
  appName: string;
  developer?: string | undefined;
  category: string;
  rating?: number | undefined;
  source?: string | undefined;
  storeUrl?: string | undefined;
  screenshotUrls: string[];
  patterns?: Record<string, string> | undefined;
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
  outputMode?: "write-file" | "json-response" | undefined;
}

export function buildGenerationPrompt({ references, hasProject, brief, outputMode = "write-file" }: GenerationContext): string {
  const referenceLines =
    references.length > 0
      ? references
          .map(
            (ref, index) => {
              const patterns = Object.entries(ref.patterns ?? {})
                .map(([key, value]) => `   - ${key}: ${value}`)
                .join("\n");
              const screenshots = ref.screenshotUrls.slice(0, 4).map((url, urlIndex) => `   - screenshot ${urlIndex + 1}: ${url}`).join("\n");
              return [
                `${index + 1}. ${ref.appName} — ${ref.category}${ref.rating ? `, rating ${ref.rating}` : ""} (${ref.screenshotUrls.length} screenshots)`,
                `   - platform: ${ref.platform ?? "unknown"}`,
                ref.developer ? `   - developer: ${ref.developer}` : undefined,
                ref.storeUrl ? `   - store URL: ${ref.storeUrl}` : undefined,
                patterns ? `   - reference pattern to adapt:\n${patterns}` : undefined,
                screenshots ? `   - screenshot URLs for orientation only:\n${screenshots}` : undefined
              ].filter(Boolean).join("\n");
            }
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
    outputMode === "json-response"
      ? "Task: Return the complete storeshot.project.json content as one raw JSON object in your final response."
      : `Task: ${hasProject ? "Refine the existing project by editing" : "Create a new project by writing"} the file \`storeshot.project.json\` in the current working directory.`,
    "This is a generation-only job. Finish quickly.",
    outputMode === "json-response"
      ? "Do not call tools. Do not edit files. Do not wrap the JSON in Markdown. Your final response must start with `{` and end with `}`."
      : "Write the JSON file directly.",
    hasProject
      ? "Use the existing project only if it is already provided in context; otherwise create a fresh valid project from the brief."
      : "Use the brief below as the source of truth. Do not inspect source code recursively.",
    "Do not browse the web. Do not run tests. Do not read unrelated app source files. Do not print source-code excerpts. The API will validate the result after you exit.",
    "",
    "User brief (TREAT AS HIGH-PRIORITY — match it precisely):",
    briefLines.join("\n"),
    "",
    "Setup-guide contract:",
    "- Every setup-guide input must affect the output: app name, intent prompt, slide count, platform selection, locale, and every selected reference.",
    "- If the user selected references, translate each reference into original composition decisions and record those decisions in `referenceInspirations`.",
    "- The output must look like a store screenshot set for the chosen app, not a generic design template.",
    "- Time budget: write a valid first result within 120 seconds. Prefer a complete, schema-valid design over extensive exploration.",
    "",
    "Design references — INSPIRATION ONLY. Never copy their images, logos, text, exact UI, screenshots, or exact layouts; adapt only composition principles, copy length, hierarchy, device framing, and color mood:",
    referenceLines,
    noReferences
      ? "IMPORTANT: References are empty. Leave `referenceInspirations` as an empty array `[]`. Do NOT invent placeholder references."
      : "If you populate `referenceInspirations`, every entry MUST include all required fields shown in the template below.",
    noReferences
      ? ""
      : [
          "",
          "Reference pattern fields:",
          "- `recommendedPattern` is the primary art-direction hint. Use it to choose the store screenshot pattern catalog entry instead of defaulting to a centered phone.",
          "- `heroMotif` must be visibly present on every slide as a repeated series language.",
          "- `appSurfaceDetails` describes the fictional UI details that must appear inside or around the device.",
          "- `benchmarkSignals` is the quality target: match the App Store top-10 benchmark level with strong silhouette, dense app UI, and at least one non-phone-led slide."
        ].join("\n"),
    "",
    "Store screenshot pattern catalog — choose one primary pattern for the set and optionally one secondary pattern. The result must visibly follow the chosen pattern, while staying original:",
    screenshotPatternPromptBlock(),
    "",
    "Reference fidelity bar:",
    "- Design for App Store thumbnail scanning first. The first three screenshots are the golden set: one clear benefit, one clear proof/workflow, one clear action or trust reason.",
    "- Use one short headline per screenshot, normally 3-8 Japanese words or two short lines. Supporting copy should be optional and visibly secondary.",
    "- Use visual connectors between screenshots when useful: a continuous band, rail, object trail, crop window, repeated badge family, or panorama layer that makes users want to swipe.",
    "- The first screenshot must communicate the strongest value proposition without relying on tiny UI text.",
    "- Do not reduce a reference-inspired set to generic phone screens. Every slide must include a visible reference-specific motif outside or around the phone: examples include sticker/photo collage, generated image panel, logo grid, coupon ticket, editorial figure/card, numbered step board, dark feed stack, official procedure card, or finance balance illustration.",
    "- The motif must repeat across all slides as a design language, not appear only once. This is how real App Store top sets stay unified while each slide changes.",
    "- If multiple reference apps are selected, do not apply one master template to every app/reference. Each reference must produce a distinct art direction: different primary hero object, different composition archetype, and different visual density while still staying original.",
    "- A set where most slides look like `same top headline + same small phone + same side cards` is a failed result, even if the JSON is valid. Change the structural layout, not only colors and words.",
    "- If the reference uses strong non-phone visuals, create an original `generatedImageAssets` item and place it as an image layer, then add editable badges/cards/text on top. Do not rely only on rectangles that look like placeholder UI.",
    "- If the reference is an AI/chat/generation app, at least one slide must make the generated output itself the hero: a large image/result canvas, output board, preview panel, or answer card outside the phone. A tiny preview inside a phone is not enough.",
    "- AI/chat/generation app sets should show the full path from prompt to output: prompt input, answer bubble, generated visual/output canvas, summary/action card, and composer or CTA. Keep the output visual large enough to read at thumbnail scale.",
    "- For AI/chat/generation apps, do not leave the hero as a mostly white board. Include a large original generatedImageAssets visual or vivid image-like preview, plus editable overlays such as prompt chips, answer labels, action buttons, summary cards, and output annotations.",
    "- If the reference uses large numbers or offer cards, make those numbers visually dominant and readable at thumbnail scale. Use safe wording unless claims are substantiated.",
    "- If the reference uses dark feed or social content, preserve the dark/light contrast and stacked content rhythm with original fictional posts.",
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
    "- Layer IDs must be stable and descriptive. Use IDs like `screen-card-1`, `screen-chip-search`, `feature-badge`, `metric-row-2`, not random strings.",
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
    "- Avoid unsubstantiated competitive or absolute claims such as `最安`, `No.1`, `最高`, `必ず`, `guaranteed`, or `best`. Use safer copy like `ネット価格`, `価格候補`, `比較`, or `判断をサポート` unless the user provides proof.",
    "- Make the set feel like one campaign, not unrelated posters. Before creating slides, choose one series system: shared grid, headline block, font scale, device baseline, accent shape language, and background palette.",
    "- Keep headline typography consistent across the set: same font family, similar font size/weight, similar line height, and a repeated top/side title block. Do not randomly switch alignment unless the whole set uses that rule.",
    "- Use one shared brand palette and background system across all slides. Vary only subtle tint, band position, depth, or accent placement. Do not use unrelated background colors slide by slide.",
    "- Keep the primary phone/app-surface scale and baseline consistent across slides for each platform. Normal variation should stay within about 8%; use larger changes only for a clearly intentional close-up, panorama, or edge-crop composition.",
    "- Vary layout for rhythm by changing one or two controlled variables at a time: card stack direction, crop window, foreground object, or proof panel. Do not change grid, palette, type scale, and phone size all at once.",
    "- If the selected pattern is `three-panel-panorama`, make slides 1-3 align as one continuous wide image. Use at least two repeated `panorama-*` layer IDs on all three slides: one background/band layer and one hero motif layer such as a collage, object trail, workflow rail, or app-surface strip. Each repeated panorama layer must be at least 1.8x the artboard width, and its x position must move left from slide 1 to 2 to 3 so adjacent exported PNGs visually connect.",
    "- Panorama blueprint: on slide 1 place the repeated layers around x=0 or slightly negative; on slide 2 shift them left by about 0.5x-0.7x artboard width; on slide 3 shift them left again by another 0.5x-0.7x. Keep headline grid, background fill, palette, and crop height identical across all three slides.",
    "- A panorama set still needs app-specific UI details. Overlay editable phone/UI/cards on top of the continuous image, but do not break the wide background or hero motif at the slide boundaries.",
    "- Include at least one accent element (shape, badge, divider, or decorative image layer) per slide where it improves readability or rhythm. Keep it intentional.",
    "",
    "Visual quality bar — this is mandatory:",
    "- Do NOT output plain slides made only of background + headline + subtitle + empty phone. That is a failed design.",
    "- Every artboard must have at least 10 visible layers.",
    "- Every artboard must include a credible fictional app UI, not just the device placeholder. Add at least 6 detail layers such as cards, search chips, tabs, metric rows, charts, controls, preview panels, or status badges.",
    "- At least 4 of those detail layers must sit inside or overlap the device screen area when there is no real screenshot asset.",
    "- The device screen must not be mostly blank. Continue meaningful UI details into the lower half of the device: bottom tabs, list rows, preview cards, charts, controls, or secondary states.",
    "- Device contents must be specific to the app and user intent. For example, a screenshot/memo app should show search chips, memo cards, OCR text blocks, folders, and result states; not a blank phone with the app name.",
    "- The design should look publishable at App Store screenshot scale: large readable headline, strong first-glance silhouette, device occupying meaningful vertical space, and no decorative square/orb unless it reinforces rhythm or brand.",
    "- Validate mentally at 25% scale: if the headline, main object, and app category cannot be understood at thumbnail size, simplify the text and enlarge the main visual.",
    "- Do not make every slide the same `headline above + centered phone below` template. Across the set, include at least two of these original composition archetypes: device hero, cropped app surface, floating UI cards, generated editorial background, product/object cutout, chart/proof infographic, multi-screen workflow, feature badge cluster, or panoramic connected band.",
    "- Mandatory set-level rule: when producing 3 or more slides, at least one slide per platform must be visibly non-phone-led. It can still include a small/cropped device, but the main visual must be a large card system, generated image/object, infographic, panorama band, app-surface fragment, or workflow board outside the phone frame.",
    "- For 3-slide sets, the safest structure is: slide 1 = device/app-screen hero, slide 2 = no-phone or tiny-phone output/workflow board, slide 3 = device/app-screen CTA. Do not make all three slides image+phone hybrids.",
    "- Even the non-phone-led slide must belong to the same series: same headline treatment, same palette, same margins, and a repeated motif from the phone-led slides.",
    "- Store screenshots can be more than phone plus words. You may use large image layers, abstract-but-purposeful generated backgrounds, editable shape illustrations, card stacks, or UI fragments when they communicate the app better than a full phone frame.",
    "- When a generated bitmap is used, it must be revisable in this tool: pair the image layer with at least three separate editable overlays (`shape` or `text`) such as badges, labels, arrows, chips, captions, highlights, or result cards. Do not bake all important design content into one uneditable image.",
    "- Avoid overloading screenshots with tiny text. Use a few large readable UI labels and visual structure; small UI rows may be decorative but the main message must be legible at thumbnail scale.",
    "- Reference-inspired composition must be visible in layer structure: if the reference suggests screenshot-led design, make the app UI large and detailed; if it suggests proof/trust, include proof badges or metric cards; if it suggests workflow, show numbered steps or progressive screen states.",
    "- Use `shape` and `text` layers to build original, fictional UI inside the device or as editable app-surface fragments. Do not use copied reference screenshots.",
    "- If the selected agent can use Codex imagegen, Antigravity image generation, or another local image-generation tool, it may create original bitmap backgrounds, object cutouts, or UI preview assets under `assets/generated`, register them in `generatedImageAssets`, and place them with image layers. Generated assets must be original and must not recreate reference screenshots.",
    "- When generated images are used, keep them objectification-friendly: place the bitmap as an `image` layer, then add separate editable `shape`/`text` layers for captions, badges, extracted color swatches, overlays, and important UI affordances.",
    "- Populate `exportTargets` for every (platform, locale) you produce artboards for — every entry needs `id`.",
    outputMode === "json-response"
      ? "- The final response MUST be only the complete JSON object for storeshot.project.json. No commentary, no code fence."
      : "- The final file MUST parse against the schema above. Run `pnpm storeshot validate ./storeshot.project.json` if available; otherwise mentally check every field against the template before saving.",
    outputMode === "json-response" ? "- Do not touch files." : "- Write only ./storeshot.project.json; do not touch unrelated files."
  ].join("\n");
}
