import { spawn } from "node:child_process";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, extname, join } from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { StoreShotProjectSchema, validateProject } from "@openstoreshot/core";
import type { StoreShotProject } from "@openstoreshot/core";
import { designQualityIssues } from "../../../lib/designQuality";
import { backfillGeneratedVisuals } from "../../../lib/generatedVisualBackfill";
import { agentDefs, buildAgentInvocation, type AgentInvocation } from "../../../lib/agents";
import { buildGenerationPrompt } from "../../../lib/generatePrompt";

const BriefSchema = z
  .object({
    appName: z.string().optional(),
    intent: z.string().optional(),
    slideCount: z.number().int().min(1).max(20).optional(),
    platforms: z.array(z.enum(["ios", "android"])).optional(),
    locale: z.string().optional()
  })
  .optional();

const GenerateSchema = z.object({
  agentId: z.string(),
  projectDir: z.string().min(1),
  hasProject: z.boolean().default(false),
  brief: BriefSchema,
  references: z
    .array(
      z.object({
        id: z.string().optional(),
        platform: z.enum(["ios", "android"]).optional(),
        appName: z.string(),
        developer: z.string().optional(),
        category: z.string(),
        rating: z.number().optional(),
        source: z.string().optional(),
        storeUrl: z.string().optional(),
        screenshotUrls: z.array(z.string()).default([]),
        patterns: z.record(z.string()).optional()
      })
    )
    .default([])
});

const GENERATION_TIMEOUT_MS = 300_000;
const REPAIR_TIMEOUT_MS = 180_000;
const PROGRESS_HEARTBEAT_MS = 15_000;

function tail(text: string, max = 4000): string {
  return text.length > max ? text.slice(-max) : text;
}

function stripAnsi(text: string): string {
  return text.replace(/\u001b\[[0-9;]*m/g, "");
}

function extractJsonObject(text: string): string | null {
  const clean = stripAnsi(text).trim();
  const fenced = clean.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? clean;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return candidate.slice(start, end + 1);
}

function escapeControlCharactersInJsonStrings(text: string): string {
  let repaired = "";
  let inString = false;
  let escaped = false;
  for (const char of text) {
    if (inString && char === "\n") {
      repaired += "\\n";
      escaped = false;
      continue;
    }
    if (inString && char === "\r") {
      repaired += "\\r";
      escaped = false;
      continue;
    }
    if (char === '"' && !escaped) inString = !inString;
    repaired += char;
    escaped = char === "\\" && !escaped;
    if (char !== "\\") escaped = false;
  }
  return repaired;
}

function repairAgentJsonText(text: string): string {
  return escapeControlCharactersInJsonStrings(
    text.replace(/("(?:x|y|width|height|radius|fontSize|fontWeight|lineHeight|opacity|angle)"\s*:\s*-?\d+(?:\.\d+)?)"(\s*[,}])/g, "$1$2")
  )
    .replace(/,\s*([}\]])/g, "$1");
}

function parseAgentJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (firstError) {
    try {
      return JSON.parse(repairAgentJsonText(text));
    } catch {
      throw firstError;
    }
  }
}

function normalizeFill(fill: unknown): unknown {
  if (typeof fill === "string") return { type: "solid", color: fill };
  if (fill && typeof fill === "object") {
    const record = fill as Record<string, unknown>;
    if (record.type === "gradient" && typeof record.from !== "string" && typeof record.to !== "string") {
      const colors = Array.isArray(record.colors) ? record.colors : [];
      return {
        ...record,
        from: typeof colors[0] === "string" ? colors[0] : "#E0F2FE",
        to: typeof colors[1] === "string" ? colors[1] : "#F8FAFC"
      };
    }
  }
  return fill;
}

function normalizeProjectCandidate(candidate: unknown, locale: string): unknown {
  if (!candidate || typeof candidate !== "object") return candidate;
  const project = candidate as Record<string, unknown>;
  project.schemaVersion = "0.1.0";

  const generatedImageAssets = Array.isArray(project.generatedImageAssets) ? project.generatedImageAssets : [];
  project.generatedImageAssets = generatedImageAssets
    .filter((asset): asset is Record<string, unknown> => Boolean(asset && typeof asset === "object"))
    .map((asset, index) => {
      const id = typeof asset.id === "string" && asset.id ? asset.id : `generated-image-${index + 1}`;
      const generated = asset.generated && typeof asset.generated === "object" ? asset.generated as Record<string, unknown> : undefined;
      return {
        ...asset,
        id,
        type: typeof asset.type === "string" ? asset.type : "generated-image",
        path: typeof asset.path === "string" ? asset.path : `assets/generated/${id}.svg`,
        width: typeof asset.width === "number" ? asset.width : 900,
        height: typeof asset.height === "number" ? asset.height : 1200,
        ...(generated
          ? {
              generated: {
                provider: typeof generated.provider === "string" ? generated.provider : "setup-guide-agent",
                model: typeof generated.model === "string" ? generated.model : "agent-generated-asset",
                prompt: typeof generated.prompt === "string" ? generated.prompt : typeof asset.prompt === "string" ? asset.prompt : `Original generated visual for ${id}`,
                createdAt: typeof generated.createdAt === "string" ? generated.createdAt : new Date().toISOString(),
                source: generated.source && typeof generated.source === "object" ? generated.source : {}
              }
            }
          : typeof asset.prompt === "string"
            ? {
                generated: {
                  provider: "setup-guide-agent",
                  model: typeof asset.style === "string" ? asset.style : "agent-generated-asset",
                  prompt: asset.prompt,
                  createdAt: new Date().toISOString(),
                  source: { normalizedFromPromptOnlyAsset: true }
                }
              }
            : {})
      };
    });

  const references = Array.isArray(project.referenceInspirations) ? project.referenceInspirations : [];
  project.referenceInspirations = references
    .filter((ref): ref is Record<string, unknown> => Boolean(ref && typeof ref === "object"))
    .map((ref, index) => ({
      ...ref,
      id: typeof ref.id === "string" ? ref.id : `reference-${index + 1}`,
      source: typeof ref.source === "string" ? ref.source : "setup-guide",
      platform: ref.platform === "android" ? "android" : "ios",
      inspirationOnly: true,
      patterns: ref.patterns && typeof ref.patterns === "object" ? ref.patterns : { composition: "reference-inspired layout" }
    }));

  const slides = Array.isArray(project.slides) ? project.slides : [];
  for (const slide of slides) {
    if (!slide || typeof slide !== "object") continue;
    const slideRecord = slide as Record<string, unknown>;
    const localeText = slideRecord.localeText;
    if (localeText && typeof localeText === "object" && !Array.isArray(localeText)) {
      const localeRecord = localeText as Record<string, unknown>;
      const hasDirectStrings = Object.values(localeRecord).some((value) => typeof value === "string");
      if (hasDirectStrings) {
        slideRecord.localeText = {
          [locale]: Object.fromEntries(Object.entries(localeRecord).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
        };
      }
    }
    const artboards = Array.isArray(slideRecord.artboards) ? slideRecord.artboards : [];
    for (const artboard of artboards) {
      if (!artboard || typeof artboard !== "object") continue;
      const artboardRecord = artboard as Record<string, unknown>;
      const layers = Array.isArray(artboardRecord.layers) ? artboardRecord.layers : [];
      for (const layer of layers) {
        if (!layer || typeof layer !== "object") continue;
        const layerRecord = layer as Record<string, unknown>;
        for (const field of ["x", "y", "width", "height", "radius", "fontSize", "fontWeight", "lineHeight", "opacity"] as const) {
          if (typeof layerRecord[field] === "string" && layerRecord[field].trim() !== "") {
            const numericValue = Number(layerRecord[field]);
            if (Number.isFinite(numericValue)) layerRecord[field] = numericValue;
          }
        }
        if (typeof layerRecord.text === "string") {
          layerRecord.text = layerRecord.text
            .replaceAll("最安値", "ネット価格")
            .replaceAll("最安候補", "価格候補")
            .replaceAll("最安", "ネット価格");
        }
        if (typeof layerRecord.fontWeight === "string") {
          layerRecord.fontWeight = layerRecord.fontWeight.toLowerCase() === "bold" ? 700 : Number(layerRecord.fontWeight);
        }
        if (Number.isNaN(layerRecord.fontWeight)) delete layerRecord.fontWeight;
        if ("fill" in layerRecord) layerRecord.fill = normalizeFill(layerRecord.fill);
      }
    }
  }

  const devicesByPlatform = new Map<string, Array<Record<string, unknown> & { _artboardWidth?: number }>>();
  for (const slide of slides) {
    if (!slide || typeof slide !== "object") continue;
    const artboards = Array.isArray((slide as Record<string, unknown>).artboards) ? (slide as Record<string, unknown>).artboards as unknown[] : [];
    for (const artboard of artboards) {
      if (!artboard || typeof artboard !== "object") continue;
      const artboardRecord = artboard as Record<string, unknown>;
      const platform = typeof artboardRecord.platform === "string" ? artboardRecord.platform : "unknown";
      const artboardWidth = typeof artboardRecord.width === "number" ? artboardRecord.width : undefined;
      const layers = Array.isArray(artboardRecord.layers) ? artboardRecord.layers : [];
      for (const layer of layers) {
        if (!layer || typeof layer !== "object") continue;
        const layerRecord = layer as Record<string, unknown> & { _artboardWidth?: number };
        if (layerRecord.type === "device" && typeof layerRecord.width === "number" && typeof layerRecord.height === "number") {
          if (typeof artboardWidth === "number") layerRecord._artboardWidth = artboardWidth;
          devicesByPlatform.set(platform, [...(devicesByPlatform.get(platform) ?? []), layerRecord]);
        }
      }
    }
  }
  for (const devices of devicesByPlatform.values()) {
    if (devices.length < 3) continue;
    const areas = devices.map((device) => Number(device.width) * Number(device.height)).filter((value) => Number.isFinite(value) && value > 0);
    if (areas.length < 3 || Math.max(...areas) / Math.min(...areas) <= 1.12) continue;
    const sortedWidths = devices.map((device) => Number(device.width)).sort((a, b) => a - b);
    const sortedHeights = devices.map((device) => Number(device.height)).sort((a, b) => a - b);
    const targetWidth = sortedWidths[Math.floor(sortedWidths.length / 2)];
    const targetHeight = sortedHeights[Math.floor(sortedHeights.length / 2)];
    if (!targetWidth || !targetHeight) continue;
    for (const device of devices) {
      const centerX = Number(device.x ?? 0) + Number(device.width) / 2;
      device.width = targetWidth;
      device.height = targetHeight;
      device.x = Math.round(Math.max(0, Math.min((device._artboardWidth ?? centerX + targetWidth / 2) - targetWidth, centerX - targetWidth / 2)));
      delete device._artboardWidth;
    }
  }

  const exportTargets = Array.isArray(project.exportTargets) ? project.exportTargets : [];
  project.exportTargets = exportTargets.map((target, index) => {
    if (!target || typeof target !== "object") return target;
    const targetRecord = target as Record<string, unknown>;
    return {
      ...targetRecord,
      id: typeof targetRecord.id === "string" ? targetRecord.id : `${targetRecord.platform ?? "platform"}-${targetRecord.locale ?? locale}-${index + 1}`
    };
  });

  return project;
}

function fallbackGeneratedAssetSvg(project: StoreShotProject, assetId: string) {
  const accent = project.brand.colors.accent ?? project.brand.colors.primary ?? "#0EA5E9";
  const primary = project.brand.colors.primary ?? accent;
  const ink = project.brand.colors.ink ?? "#0F172A";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200"><rect width="900" height="1200" rx="72" fill="#f8fafc"/><rect x="78" y="110" width="744" height="980" rx="68" fill="#ffffff" stroke="#dbeafe" stroke-width="12"/><g opacity=".88"><rect x="135" y="185" width="290" height="220" rx="36" fill="${primary}"/><rect x="475" y="185" width="290" height="220" rx="36" fill="#e0f2fe"/><rect x="135" y="455" width="630" height="170" rx="42" fill="#f1f5f9"/><rect x="135" y="690" width="630" height="250" rx="48" fill="#ecfeff"/></g><path d="M205 555h390M205 780h310M205 850h430" stroke="${accent}" stroke-width="30" stroke-linecap="round"/><circle cx="690" cy="820" r="70" fill="${accent}"/><text x="450" y="1040" text-anchor="middle" font-family="Arial" font-size="58" font-weight="900" fill="${ink}">${project.app.name}</text><text x="450" y="1120" text-anchor="middle" font-family="Arial" font-size="32" font-weight="700" fill="#475569">${assetId}</text></svg>`;
}

async function ensureGeneratedAssetFiles(project: StoreShotProject, projectDir: string) {
  for (const asset of project.generatedImageAssets) {
    let assetPath = join(projectDir, asset.path);
    let exists = await access(assetPath, constants.F_OK).then(
      () => true,
      () => false
    );
    if (exists) continue;

    if (extname(asset.path).toLowerCase() !== ".svg") {
      asset.path = asset.path.replace(/\.[^.\/]+$/, "") + ".svg";
      assetPath = join(projectDir, asset.path);
      exists = await access(assetPath, constants.F_OK).then(
        () => true,
        () => false
      );
      if (exists) continue;
    }

    await mkdir(dirname(assetPath), { recursive: true });
    await writeFile(assetPath, fallbackGeneratedAssetSvg(project, asset.id), "utf8");
  }
}

type GenerateResult = {
  ok: boolean;
  wrote: boolean;
  exitCode: number | null;
  timedOut: boolean;
  durationMs: number;
  issues: Array<{ severity: "error" | "warning"; message: string }>;
  parseError?: string;
  project?: StoreShotProject;
  stdout: string;
  stderr: string;
};

type GenerateJob = {
  id: string;
  status: "running" | "done" | "error";
  startedAt: number;
  projectDir: string;
  locale: string;
  stdout: string;
  stderr: string;
  logs: string[];
  child?: ChildProcessWithoutNullStreams;
  result?: GenerateResult;
};

const globalForJobs = globalThis as typeof globalThis & { __openStoreShotGenerateJobs?: Map<string, GenerateJob> };
const jobs = globalForJobs.__openStoreShotGenerateJobs ?? new Map<string, GenerateJob>();
globalForJobs.__openStoreShotGenerateJobs = jobs;

function appendLog(job: GenerateJob, text: string) {
  const clean = stripAnsi(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.length < 240)
    .filter((line) => !line.startsWith("- "))
    .filter((line) => !line.startsWith('"') && !line.startsWith("`"))
    .filter((line) => !line.startsWith("{") && !line.endsWith("}"))
    .filter((line) => !line.includes("schemaVersion") && !line.includes("exportTargets") && !line.includes("artboardId") && !line.includes("outputDir"))
    .filter((line) => !line.includes("REFERENCE TEMPLATE") && !line.includes("SCHEMA GOTCHAS") && !line.includes("referenceInspirations"))
    .filter((line) => !line.includes("Store screenshot pattern catalog") && !line.includes("Reference fidelity bar") && !line.includes("Reference pattern fields"))
    .filter((line) => !line.includes("User brief") && !line.includes("Setup-guide contract") && !line.includes("Design references"))
    .filter((line) => !line.includes("Do not call tools") && !line.includes("Use the brief below") && !line.includes("Do not browse the web"))
    .filter((line) => !line.includes("You are a senior App Store") && !line.includes("Task: Return the complete") && !line.includes("This is a generation-only job"))
    .filter((line) => !line.includes("Final response: raw JSON only"))
    .filter((line) => !line.startsWith("session id:") && !line.startsWith("provider:"))
    .filter((line) => !line.startsWith("> "))
    .filter((line) => !line.match(/^\d+\.\s.+—.+\(\d+\s+screenshots\)$/))
    .filter((line) => !line.match(/^\d+\.\s[a-z-]+\s—\s/))
    .filter((line) => !["provider:", "approval: never", "sandbox: danger-full-access", "reasoning effort: none", "reasoning summaries: none", "--------"].includes(line))
    .filter((line) => !["user", "assistant", "codex"].includes(line.toLowerCase()))
    .filter((line) => !line.toLowerCase().includes("tokens used") && !line.match(/^\d{1,3}(?:,\d{3})+$/))
    .filter((line) => !["]", "],", "},", "```", "Requirements:", "Visual quality bar — this is mandatory:"].includes(line))
    .filter((line) => !line.includes("WARN codex_core_skills::loader") && !line.includes("WARN codex_core_plugins::startup_sync"))
    .filter((line) => !line.startsWith("OpenAI Codex") && !line.startsWith("workdir:") && !line.startsWith("model:"))
    .filter((line) => !line.startsWith("diff --git") && !line.startsWith("index ") && !line.startsWith("@@"));
  job.logs.push(...clean);
  job.logs = job.logs.slice(-80);
}

function appendStatus(job: GenerateJob, message: string) {
  job.logs.push(message);
  job.logs = job.logs.slice(-80);
}

function createProgressHeartbeat(job: GenerateJob) {
  const messages = [
    "構成方針、参考パターン、スライド構成をエージェントが組み立てています。",
    "スキーマ-validなJSON応答を待っています。完了後にアプリ側で正規化します。",
    "参照デザインのモチーフ、アプリ画面詳細、非スマホ主役レイアウトを反映中です。",
    "生成が長めです。完了後に画像アセット補完、スキーマ検証、品質ゲートを順に実行します。"
  ];
  let tick = 0;
  return setInterval(() => {
    if (job.status !== "running") return;
    const elapsed = Math.round((Date.now() - job.startedAt) / 1000);
    appendStatus(job, `${messages[Math.min(tick, messages.length - 1)]} (${elapsed}s)`);
    tick += 1;
  }, PROGRESS_HEARTBEAT_MS);
}

async function validateGeneratedProject(projectPath: string): Promise<Pick<GenerateResult, "issues" | "parseError" | "project">> {
  try {
    const raw = await readFile(projectPath, "utf8");
    const project = StoreShotProjectSchema.parse(JSON.parse(raw));
    const issues = validateProject(project).map((issue) => ({
      severity: issue.severity,
      message: issue.message
    }));
    issues.push(...designQualityIssues(project));
    return { issues, project };
  } catch (error) {
    return { issues: [], parseError: error instanceof Error ? error.message : String(error) };
  }
}

async function normalizeAndBackfillProjectFile(projectPath: string, projectDir: string, locale: string): Promise<void> {
  const raw = await readFile(projectPath, "utf8");
  const normalized = StoreShotProjectSchema.parse(normalizeProjectCandidate(JSON.parse(raw), locale));
  await ensureGeneratedAssetFiles(normalized, projectDir);
  const backfilled = await backfillGeneratedVisuals(normalized, projectDir);
  await writeFile(projectPath, `${JSON.stringify(backfilled.project, null, 2)}\n`, "utf8");
}

function buildQualityRepairPrompt(issues: GenerateResult["issues"], locale: string, attempt: number) {
  const issueLines = issues.map((issue, index) => `${index + 1}. [${issue.severity}] ${issue.message}`).join("\n");
  const strictStructuralRepair =
    attempt >= 2 || issues.some((issue) => /same composition archetype|phone-plus-copy|too phone-led|composition is too repetitive/i.test(issue.message));
  const panoramaRepair = issues.some((issue) => /panorama/i.test(issue.message));
  const aiOutputRepair = issues.some((issue) => /AI reference|generated output|output visual|tiny phone preview/i.test(issue.message));
  const seriesRepair = issues.some((issue) => /background system|series motifs|one campaign|unified/i.test(issue.message));
  return [
    "You are repairing an OpenStoreShot storeshot.project.json that is already schema-valid but failed the store screenshot quality gate.",
    "Edit ./storeshot.project.json directly. Do not return the full JSON in chat.",
    "Read only ./storeshot.project.json if needed. Do not browse the web. Do not inspect unrelated files. Do not copy reference screenshots, logos, proprietary UI, or exact compositions.",
    "",
    "Repair goal:",
    "- Keep the same app, locale, slide count, platforms, export targets, and referenceInspirations.",
    "- Fix every error below. Warnings should be improved when easy, but errors are mandatory.",
    "- Preserve one unified campaign system: shared background palette, headline grid, typography, accent motif, and primary device scale.",
    "- Do not solve repetition only by changing copy or colors. At least one slide must become structurally non-phone-led: large card board, object/image hero, infographic, panorama/collage band, or app-surface fragment outside the phone.",
    "- Keep all copy short and in " + locale + ". Avoid unsubstantiated claims such as 最安, No.1, 最高, 必ず, guaranteed, or best.",
    "- The repaired project must remain valid for schemaVersion 0.1.0. `fontWeight` must be numeric and `fill` must be an object.",
    panoramaRepair
      ? [
          "",
          "Panorama repair required:",
          "- If referenceInspirations or roles request panorama/連結/continuous, slides 1-3 must read as one wide image when exported side-by-side.",
          "- Add at least two repeated `panorama-*` layer IDs to the first three slides for each failing platform.",
          "- One repeated panorama layer should be a continuous background/band; another should be the hero motif such as a collage strip, workflow rail, object trail, card river, or app-surface strip.",
          "- Each repeated panorama layer must be at least 1.8x the artboard width.",
          "- Move the same layer ID left across slides: slide-01 near x=0, slide-02 roughly -0.5x to -0.7x artboard width, slide-03 roughly another -0.5x to -0.7x left.",
          "- Keep the headline grid, exact background fill object, palette, crop height, and motif scale identical across the three slides so adjacent PNGs visually connect."
        ].join("\n")
      : "",
    aiOutputRepair
      ? [
          "",
          "AI output repair required:",
          "- Rework at least one slide into an AI-output-led composition.",
          "- The hero must be a large generated image/result canvas plus an editable output board outside the phone.",
          "- Use `generatedImageAssets` for an original vivid output visual. Place it as an image layer occupying at least 18% of the artboard area, or pair a 12%+ generated image with a board occupying at least 35% of the artboard area.",
          "- Show prompt to output as visible app-specific UI: prompt input, answer bubble, generated visual/output canvas, summary/action card, and composer or CTA.",
          "- Add at least fourteen output-specific editable details with IDs such as `output-*`, `result-*`, `prompt-*`, `answer-*`, `composer-*`, `summary-*`, or `action-*`.",
          "- Do not leave the hero as a mostly white empty rectangle. Use color, image-like preview content, annotations, and action chips so the result reads at thumbnail scale.",
          "- A phone can remain, but it must not be the only meaningful visual. Do not satisfy this by adding a tiny preview inside the phone."
        ].join("\n")
      : "",
    strictStructuralRepair
      ? [
          "",
          "Strict structural repair required:",
          "- Rework slide-02 for each failing platform into a clearly non-phone-led composition.",
          "- The main visual on slide-02 must be a large editable board outside the phone: workflow board, official card stack, coupon board, browser result board, AI output canvas, timeline, chart/proof panel, or app-surface fragment.",
          "- The slide-02 board should occupy at least 45% of the artboard height and 55% of the artboard width.",
          "- If the failure mentions `image-device-hybrid`, `device-card-hybrid`, or `same composition archetype`, do not keep slide-02 as a phone composition. Remove, hide, or shrink every slide-02 `device` layer so the board/image/canvas is unambiguously the largest visual.",
          "- If a phone remains on slide-02, it must be secondary: below 18% of artboard area, edge-cropped, or partially off-canvas. Do not let it be the largest layer.",
          "- Add at least six board-specific detail layers outside the phone with IDs that include `board`, `workflow`, `proof`, `ticket`, `result`, `timeline`, `id-card`, `qr`, or another app-specific motif.",
          "- Keep slide-01 and slide-03 in the same campaign style, but make slide-02 structurally different enough that it is not classified like the other two."
        ].join("\n")
      : "",
    seriesRepair
      ? [
          "",
          "Series-system repair required:",
          "- Make slides 1-3 read as one campaign before any individual variation.",
          "- Use the exact same background `fill` object on slides 1-3 for each failing platform, then vary only bands, motifs, cards, or crop positions.",
          "- Add at least two repeated motif layer families across slides 1-3. Use stable ID prefixes such as `series-band-*`, `campaign-accent-*`, `motif-chip-*`, `brand-rail-*`, `waveform-*`, `feed-stack-*`, `ticket-*`, or `output-*`.",
          "- The repeated motifs must be visible, not hidden behind the phone. They should support the category: waveform for live/audio, feed chips for social, output cards for AI, coupon/ticket surfaces for retail, search/result chips for browser.",
          "- Keep headline size and y-position consistent. Keep the main device scale/baseline consistent unless slide-02 is intentionally a non-phone board."
        ].join("\n")
      : "",
    "",
    "Quality gate failures to fix:",
    issueLines || "(none)",
    "",
    "Write only ./storeshot.project.json. Keep it schema-valid."
  ].join("\n");
}

async function runQualityRepair(job: GenerateJob, agentId: string, issues: GenerateResult["issues"], attempt: number): Promise<{ code: number | null; timedOut: boolean; parseError?: string }> {
  const projectPath = join(job.projectDir, "storeshot.project.json");
  const invocation = buildAgentInvocation(agentId, buildQualityRepairPrompt(issues, job.locale, attempt), { jsonResponse: false });
  if (!invocation) return { code: null, timedOut: false, parseError: "Could not build repair agent invocation." };

  appendStatus(job, `品質ゲートの指摘をエージェントへ渡し、修正生成 ${attempt}/2 を実行しています。`);
  let timedOut = false;
  let code: number | null = null;
  const child = spawn(invocation.bin, invocation.args, { cwd: job.projectDir });
  job.child = child;
  const timer = setTimeout(() => {
    timedOut = true;
    appendLog(job, `Repair exceeded ${Math.round(REPAIR_TIMEOUT_MS / 1000)}s; stopping agent.`);
    child.kill("SIGKILL");
  }, REPAIR_TIMEOUT_MS);

  await new Promise<void>((resolve) => {
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      job.stdout += text;
      appendLog(job, text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      job.stderr += text;
      appendLog(job, text);
    });
    child.on("error", (error) => {
      job.stderr += String(error);
      appendLog(job, String(error));
      resolve();
    });
    child.on("close", (exitCode) => {
      code = exitCode;
      resolve();
    });
    if (invocation.input) child.stdin.write(invocation.input);
    child.stdin.end();
  });
  clearTimeout(timer);

  appendStatus(job, "修正後の storeshot.project.json を正規化しています。");
  await normalizeAndBackfillProjectFile(projectPath, job.projectDir, job.locale);
  return { code, timedOut };
}

async function finishJob(job: GenerateJob, agentId: string, invocation: AgentInvocation, code: number | null, timedOut: boolean) {
  appendStatus(job, "エージェントの出力を受信しました。");
  const projectPath = join(job.projectDir, "storeshot.project.json");
  let wrote = await access(projectPath, constants.F_OK).then(
    () => true,
    () => false
  );

  let agentJsonParseError: string | undefined;
  if (!wrote && invocation.outputFile) {
    appendStatus(job, "JSONを抽出して storeshot.project.json に保存しています。");
    const outputPath = join(job.projectDir, invocation.outputFile);
    const outputText = await readFile(outputPath, "utf8").catch(() => `${job.stdout}\n${job.stderr}`);
    const jsonText = extractJsonObject(outputText || `${job.stdout}\n${job.stderr}`);
    if (jsonText) {
      try {
        const parsedProject = StoreShotProjectSchema.parse(normalizeProjectCandidate(parseAgentJson(jsonText), job.locale));
        await writeFile(projectPath, `${JSON.stringify(parsedProject, null, 2)}\n`, "utf8");
        wrote = true;
      } catch (error) {
        agentJsonParseError = error instanceof Error ? error.message : String(error);
      }
    } else {
      agentJsonParseError = "Agent did not return a JSON object.";
    }
  }

  if (wrote) {
    appendStatus(job, "必要に応じて画像主役の generatedImageAssets を補完しています。");
    await normalizeAndBackfillProjectFile(projectPath, job.projectDir, job.locale).catch((error) => {
      agentJsonParseError = error instanceof Error ? error.message : String(error);
    });
  }

  let validation: Pick<GenerateResult, "issues" | "parseError" | "project"> = wrote
    ? await validateGeneratedProject(projectPath)
    : { issues: [], ...(agentJsonParseError ? { parseError: agentJsonParseError } : {}) };
  appendStatus(job, "スキーマとストア画像品質ゲートを検証しています。");
  let parseError = validation.parseError ?? agentJsonParseError;
  let errorCount = validation.issues.filter((issue) => issue.severity === "error").length;
  let repairCode: number | null | undefined;
  let repairTimedOut = false;
  for (let repairAttempt = 1; wrote && !parseError && errorCount > 0 && repairAttempt <= 2; repairAttempt += 1) {
    const repairResult = await runQualityRepair(job, agentId, validation.issues.filter((issue) => issue.severity === "error"), repairAttempt);
    repairCode = repairResult.code;
    repairTimedOut = repairResult.timedOut;
    parseError = repairResult.parseError;
    appendStatus(job, "修正後プロジェクトを再検証しています。");
    validation = parseError ? { issues: [], parseError } : await validateGeneratedProject(projectPath);
    parseError = validation.parseError ?? parseError;
    errorCount = validation.issues.filter((issue) => issue.severity === "error").length;
  }
  const durationMs = Date.now() - job.startedAt;
  const result: GenerateResult = {
    ok: wrote && !parseError && errorCount === 0,
    wrote,
    exitCode: code,
    timedOut: timedOut || repairTimedOut,
    durationMs,
    issues: validation.issues,
    ...(parseError ? { parseError } : {}),
    ...(validation.project && !parseError ? { project: validation.project } : {}),
    stdout: tail(job.stdout),
    stderr: tail(job.stderr)
  };
  job.result = result;
  job.status = result.ok ? "done" : "error";
  appendStatus(job, result.ok ? `生成完了: ${Math.round(durationMs / 1000)}秒で valid なプロジェクトを保存しました。` : `生成失敗: ${Math.round(durationMs / 1000)}秒で終了しました。出力と検証結果を確認してください。`);
}

function jobResponse(job: GenerateJob) {
  return {
    jobId: job.id,
    status: job.status,
    running: job.status === "running",
    durationMs: Date.now() - job.startedAt,
    logs: job.logs,
    stdout: tail(job.stdout),
    stderr: tail(job.stderr),
    ...(job.result ?? {})
  };
}

export async function GET(request: Request): Promise<Response> {
  const jobId = new URL(request.url).searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "missing_job_id" }, { status: 400 });
  const job = jobs.get(jobId);
  if (!job) return NextResponse.json({ error: "job_not_found" }, { status: 404 });
  return NextResponse.json(jobResponse(job));
}

export async function POST(request: Request): Promise<Response> {
  const parsed = GenerateSchema.parse(await request.json());

  let dirStat;
  try {
    dirStat = await stat(parsed.projectDir);
  } catch {
    return NextResponse.json({ error: "dir_not_found" }, { status: 400 });
  }
  if (!dirStat.isDirectory()) {
    return NextResponse.json({ error: "not_a_directory" }, { status: 400 });
  }
  try {
    await access(parsed.projectDir, constants.W_OK);
  } catch {
    return NextResponse.json({ error: "not_writable" }, { status: 400 });
  }

  const prompt = buildGenerationPrompt({
    references: parsed.references,
    hasProject: parsed.hasProject,
    brief: parsed.brief,
    outputMode: parsed.agentId === "codex" ? "json-response" : "write-file"
  });
  const agent = agentDefs.find((def) => def.id === parsed.agentId);
  if (!agent?.supportsDesignGeneration) {
    return NextResponse.json({ error: "unsupported_design_agent", prompt }, { status: 400 });
  }
  const invocation = buildAgentInvocation(parsed.agentId, prompt, { jsonResponse: parsed.agentId === "codex" });
  if (!invocation) {
    return NextResponse.json({ error: "manual_agent", prompt }, { status: 400 });
  }

  const job: GenerateJob = {
    id: crypto.randomUUID(),
    status: "running",
    startedAt: Date.now(),
    projectDir: parsed.projectDir,
    locale: parsed.brief?.locale ?? "ja-JP",
    stdout: "",
    stderr: "",
    logs: [
      `${agent.name} を起動しました。`,
      "セットアップ内容、選択参考、スキーマ制約、品質条件をエージェントへ渡しました。",
      parsed.agentId === "codex" ? "Codex JSON応答モードで、ファイル保存前にアプリ側で正規化・検証します。" : "エージェントに storeshot.project.json の作成を依頼しています。",
      "エージェントの最終JSON出力を待っています。"
    ]
  };
  jobs.set(job.id, job);

  const child = spawn(invocation.bin, invocation.args, { cwd: parsed.projectDir });
  job.child = child;
  let timedOut = false;
  const progressTimer = createProgressHeartbeat(job);
  const timer = setTimeout(() => {
    timedOut = true;
    appendLog(job, `Generation exceeded ${Math.round(GENERATION_TIMEOUT_MS / 1000)}s; stopping agent.`);
    child.kill("SIGKILL");
  }, GENERATION_TIMEOUT_MS);
  child.stdout.on("data", (chunk) => {
    const text = chunk.toString();
    job.stdout += text;
    appendLog(job, text);
  });
  child.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    job.stderr += text;
    appendLog(job, text);
  });
  child.on("error", (error) => {
    clearTimeout(timer);
    clearInterval(progressTimer);
    job.stderr += String(error);
    appendLog(job, String(error));
    void finishJob(job, parsed.agentId, invocation, null, timedOut);
  });
  child.on("close", (code) => {
    clearTimeout(timer);
    clearInterval(progressTimer);
    void finishJob(job, parsed.agentId, invocation, code, timedOut);
  });
  if (invocation.input) child.stdin.write(invocation.input);
  child.stdin.end();

  return NextResponse.json(jobResponse(job), { status: 202 });
}
