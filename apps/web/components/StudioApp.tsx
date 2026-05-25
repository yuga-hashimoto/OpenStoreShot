"use client";

import {
  Braces,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  Image as ImageIcon,
  Layers3,
  Library,
  Palette,
  Plus,
  Redo2,
  Search,
  Sparkles,
  Trash2,
  Undo2
} from "lucide-react";
import { validateProject, type Layer, type StoreShotProject } from "@openstoreshot/core";
import { fixtureReferences } from "@openstoreshot/store-fetch";
import type { StoreReferenceApp } from "@openstoreshot/store-fetch";
import { useStudioStore } from "../lib/store";
import { isLocale, localeLabels, locales, messagesFor, type Locale } from "../lib/i18n";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { LucideIcon } from "lucide-react";

type ActivePanel = "ストア画像" | "素材" | "参考" | "ブランド" | "JSON";
type StudioMessages = ReturnType<typeof messagesFor>;

const navItems: Array<[ActivePanel, LucideIcon]> = [
  ["ストア画像", Layers3],
  ["素材", ImageIcon],
  ["参考", Library],
  ["ブランド", Palette],
  ["JSON", Braces]
];

function navLabelKey(label: ActivePanel) {
  const keys: Record<ActivePanel, keyof StudioMessages> = {
    "ストア画像": "nav.storeImages",
    "素材": "nav.assets",
    "参考": "nav.references",
    "ブランド": "nav.brand",
    JSON: "nav.json"
  };
  return keys[label];
}

const roleLabels: Record<string, string> = {
  benefit: "価値訴求",
  feature: "機能紹介",
  workflow: "使い方",
  trust: "安心感",
  cta: "行動喚起"
};

const layerTypeLabels: Record<string, string> = {
  background: "背景",
  text: "テキスト",
  image: "画像",
  shape: "図形",
  device: "端末",
  group: "グループ"
};

const fontOptions = [
  { label: "Inter", value: "Inter" },
  { label: "System UI", value: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" },
  { label: "ヒラギノ角ゴ", value: "Hiragino Sans, Hiragino Kaku Gothic ProN, sans-serif" },
  { label: "游ゴシック", value: "Yu Gothic, YuGothic, sans-serif" },
  { label: "Noto Sans JP", value: "Noto Sans JP, sans-serif" },
  { label: "明朝", value: "Hiragino Mincho ProN, Yu Mincho, serif" },
  { label: "Rounded", value: "Arial Rounded MT Bold, Hiragino Maru Gothic ProN, sans-serif" },
  { label: "Serif", value: "Georgia, Times New Roman, serif" },
  { label: "Mono", value: "SFMono-Regular, Menlo, Consolas, monospace" }
];

const fontWeightOptions = [
  { label: "標準", value: 500 },
  { label: "太字", value: 750 },
  { label: "極太", value: 950 }
];

type ExportFile = { path: string; name: string };
type LayerMenuState = { layerId: string; x: number; y: number };

function assetUrl(path: string) {
  return `/api/assets/file?path=${encodeURIComponent(path)}`;
}

function referenceImageUrl(url: string) {
  return `/api/reference/image?url=${encodeURIComponent(url)}`;
}

function referenceHintLines(app: StoreReferenceApp) {
  const category = app.category.toLowerCase();
  const screenshotCount = app.screenshotUrls.length;
  const lines: string[] = [];

  if (category.includes("productivity") || category.includes("utilities")) {
    lines.push("構成: 価値訴求のあとに、主要操作と具体的な利用場面を順に見せる。");
    lines.push("情報設計: UIのスクショを大きく置き、見出しは機能名より成果ベースにする。");
  } else if (category.includes("social")) {
    lines.push("構成: 使う人・会話・共有体験が伝わる順番で、最初に世界観を出す。");
    lines.push("情報設計: 画面説明よりも参加したくなる短いコピーを優先する。");
  } else if (category.includes("food")) {
    lines.push("構成: すぐ使える便益、注文や発見の手軽さ、安心感の順に見せる。");
    lines.push("情報設計: 写真や色の食欲感を参考にしつつ、ロゴや固有UIはコピーしない。");
  } else if (category.includes("shopping")) {
    lines.push("構成: お得感、探しやすさ、購入前の安心材料を分けて見せる。");
    lines.push("情報設計: バッジ表現は根拠がある場合だけ使い、価格訴求に寄せすぎない。");
  } else {
    lines.push("構成: 1枚目でベネフィット、次に主要機能、最後に信頼や行動喚起を置く。");
    lines.push("情報設計: コピーは短く、端末内の情報と見出しが重複しすぎないようにする。");
  }

  lines.push(screenshotCount >= 5 ? `枚数設計: ${screenshotCount}枚あるため、連続ストーリーとして役割を分ける。` : "枚数設計: 少ない枚数でも、1枚ごとの役割を明確にする。");
  lines.push((app.rating ?? 0) >= 4.5 ? "トーン: 高評価アプリらしく、信頼感と完成度を前面に出す。" : "トーン: 過度な実績訴求より、使い方の分かりやすさを優先する。");
  return lines;
}

function layerDisplayName(id: string, name?: string) {
  const labels: Record<string, string> = {
    headline: "見出し",
    subtitle: "補足コピー",
    device: "端末モックアップ",
    bg: "背景"
  };
  return labels[id] ?? name ?? id;
}

export function StudioApp() {
  const state = useStudioStore();
  const [activePanel, setActivePanel] = useState<ActivePanel>("ストア画像");
  const [referenceApps, setReferenceApps] = useState(fixtureReferences);
  const [referenceStatus, setReferenceStatus] = useState<"fixture" | "loading" | "live" | "error">("fixture");
  const [referencePlatform, setReferencePlatform] = useState<"ios" | "android">("ios");
  const [referenceKeyword, setReferenceKeyword] = useState("");
  const [referenceLimit, setReferenceLimit] = useState(12);
  const [referenceMode, setReferenceMode] = useState<"ranking" | "search">("ranking");
  const [inspirationNotice, setInspirationNotice] = useState<string | null>(null);
  const [reviewInstruction, setReviewInstruction] = useState("見出しをもう少し短くして、端末モックアップとの余白を広げたい。");
  const [requestStatus, setRequestStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [exportStatus, setExportStatus] = useState<"idle" | "rendering" | "done" | "error">("idle");
  const [exportFiles, setExportFiles] = useState<ExportFile[]>([]);
  const [layerMenu, setLayerMenu] = useState<LayerMenuState | null>(null);
  const [locale, setLocale] = useState<Locale>("ja-JP");
  const t = messagesFor(locale);
  const { project, selectedSlideId, selectedArtboardId, selectedLayerIds, zoom } = state;
  const slide = project.slides.find((item) => item.id === selectedSlideId) ?? project.slides[0]!;
  const artboard = slide.artboards.find((item) => item.id === selectedArtboardId) ?? slide.artboards[0]!;
  const selectedLayer = artboard.layers.find((item) => item.id === selectedLayerIds[0]);
  const issues = validateProject(project);
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  const selectedLayerName = selectedLayer ? layerDisplayName(selectedLayer.id, selectedLayer.name) : "未選択";
  const contextLayer = layerMenu ? artboard.layers.find((layer) => layer.id === layerMenu.layerId) : undefined;
  const codexInstruction = [
    `対象: ${project.name} / ${slide.title} / ${selectedLayerName}`,
    `依頼: ${reviewInstruction}`,
    "方針: 競合画像はコピーせず、storeshot.project.jsonを編集してvalidate/renderまで確認してください。"
  ].join("\n");

  async function submitCodexRequest() {
    setRequestStatus("saving");
    try {
      const response = await fetch("/api/codex-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.projectId,
          projectName: project.name,
          slideId: slide.id,
          slideTitle: slide.title,
          artboardId: artboard.id,
          selectedLayerId: selectedLayer?.id,
          selectedLayerName,
          instruction: reviewInstruction,
          context: codexInstruction
        })
      });
      if (!response.ok) throw new Error("Failed to queue Codex request");
      setRequestStatus("saved");
    } catch {
      setRequestStatus("error");
    }
  }

  async function fetchReferences(options?: { mode?: "ranking" | "search"; keyword?: string; limit?: number; platform?: "ios" | "android" }) {
    const nextMode = options?.mode ?? referenceMode;
    const nextKeyword = options?.keyword ?? referenceKeyword;
    const nextLimit = options?.limit ?? referenceLimit;
    const nextPlatform = options?.platform ?? referencePlatform;
    setReferenceStatus("loading");
    setReferenceMode(nextMode);
    setReferenceLimit(nextLimit);
    setReferencePlatform(nextPlatform);
    try {
      const params = new URLSearchParams({
        platform: nextPlatform,
        country: "jp",
        limit: String(nextLimit),
        fixture: "false"
      });
      if (nextMode === "search" && nextKeyword.trim()) {
        params.set("keyword", nextKeyword.trim());
      } else {
        params.set("feed", "top-free");
      }
      const response = await fetch(`/api/reference?${params.toString()}`);
      if (!response.ok) throw new Error("reference fetch failed");
      const json = (await response.json()) as { data: typeof fixtureReferences };
      setReferenceApps(json.data.length > 0 ? json.data : fixtureReferences);
      setReferenceStatus("live");
    } catch {
      setReferenceApps(fixtureReferences);
      setReferenceStatus("error");
    }
  }

  useEffect(() => {
    if (activePanel === "参考" && referenceStatus === "fixture") {
      void fetchReferences({ mode: "ranking" });
    }
  }, [activePanel, referenceStatus]);

  async function exportProject() {
    setExportStatus("rendering");
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project })
      });
      if (!response.ok) throw new Error("export failed");
      const json = (await response.json()) as { files: ExportFile[] };
      setExportFiles(json.files);
      setExportStatus("done");
      setActivePanel("素材");
    } catch {
      setExportStatus("error");
    }
  }

  function openLayerMenu(event: MouseEvent, layerId: string) {
    event.preventDefault();
    event.stopPropagation();
    state.selectLayer(layerId);
    setActivePanel("ストア画像");
    setLayerMenu({ layerId, x: event.clientX, y: event.clientY });
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-studio-ink text-slate-100">
      <aside className="flex w-[52px] flex-col items-center gap-2 border-r border-white/10 bg-[#09111f] py-4 xl:w-[68px]">
        {navItems.map(([label, Icon]) => (
          <button
            key={label}
            data-testid={`nav-${navLabelKey(label).replace("nav.", "")}`}
            title={t[navLabelKey(label)]}
            onClick={() => setActivePanel(label)}
            className={`grid h-10 w-10 place-items-center rounded-md transition xl:h-11 xl:w-11 ${activePanel === label ? "bg-teal-300/15 text-teal-200" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </aside>

      <section className="flex w-[250px] shrink-0 flex-col border-r border-white/10 bg-studio-rail xl:w-[282px]">
        <div className="border-b border-white/10 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">OPENSTORESHOT</div>
          <h1 className="mt-1 text-lg font-semibold tracking-normal text-white">{project.name}</h1>
          <label className="mt-3 block">
            <span className="mb-1 block text-[11px] font-medium text-slate-500">{t["language.label"]}</span>
            <select
              value={locale}
              onChange={(event) => {
                if (isLocale(event.target.value)) setLocale(event.target.value);
              }}
              className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-slate-100"
            >
              {locales.map((item) => <option key={item} value={item}>{localeLabels[item]}</option>)}
            </select>
          </label>
        </div>
        <div className="flex-1 overflow-auto p-3">
          {activePanel === "ストア画像" ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-200">{t["nav.storeImages"]}</div>
                <button title={t["sidebar.addStoreImage"]} onClick={state.addStoreImage} className="rounded-md bg-white/8 p-1.5 text-slate-300 hover:bg-white/12"><Plus className="h-4 w-4" /></button>
              </div>
              <div className="space-y-2">
                {project.slides.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => state.selectSlide(item.id)}
                    className={`w-full rounded-lg border p-2 text-left transition ${item.id === selectedSlideId ? "border-teal-300/50 bg-teal-300/10" : "border-white/8 bg-white/[0.03] hover:bg-white/[0.06]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-16 w-10 place-items-center rounded bg-slate-100 text-xs font-bold text-slate-900">{index + 1}</div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-white">{item.title}</div>
                        <div className="mt-1 text-xs text-slate-500">{roleLabels[item.role ?? ""] ?? "ストア画像"} · {item.artboards.length}枚</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <TemplatePanel applyTemplate={state.applyStoreImageTemplate} t={t} />
              <LayerList artboardLayers={artboard.layers} selectedLayerIds={selectedLayerIds} selectLayer={state.selectLayer} title={t["sidebar.layer"]} />
              <ManualAdjustPanel selectedLayer={selectedLayer} updateLayer={state.updateLayer} duplicateLayer={state.duplicateLayer} deleteLayer={state.deleteLayer} t={t} />
              <CodexRequestPanel
                t={t}
                requestStatus={requestStatus}
                inspirationNotice={inspirationNotice}
                reviewInstruction={reviewInstruction}
                selectedLayerName={selectedLayerName}
                setReviewInstruction={setReviewInstruction}
                submitCodexRequest={submitCodexRequest}
              />
            </>
          ) : null}

          {activePanel === "素材" ? (
            <AssetsPanel
              project={project}
              t={t}
              selectedLayer={selectedLayer}
              updateLayer={state.updateLayer}
              addAsset={state.addAsset}
              createObjectLayersFromAsset={state.createObjectLayersFromAsset}
              exportFiles={exportFiles}
              setExportFiles={setExportFiles}
            />
          ) : null}
          {activePanel === "参考" ? (
            <ReferencePanel
              referenceApps={referenceApps}
              referenceStatus={referenceStatus}
              referencePlatform={referencePlatform}
              referenceKeyword={referenceKeyword}
              referenceLimit={referenceLimit}
              referenceMode={referenceMode}
              setReferenceKeyword={setReferenceKeyword}
              setReferenceLimit={setReferenceLimit}
              setReferencePlatform={setReferencePlatform}
              fetchReferences={fetchReferences}
              t={t}
              useInspiration={(app) => {
                const hint = referenceHintLines(app).join("\n");
                setReviewInstruction(`${app.appName}の参考から、コピーせずに以下の構成ヒントだけを取り入れたい。\n${hint}`);
                setInspirationNotice(`${app.appName}の構成ヒントを修正指示に追加しました。参考画像はコピーせず、文字量・端末配置・色の雰囲気だけを使います。`);
                setActivePanel("ストア画像");
              }}
            />
          ) : null}
          {activePanel === "ブランド" ? <BrandPanel project={project} title={t["brand.title"]} /> : null}
          {activePanel === "JSON" ? <JsonPanel project={project} t={t} /> : null}
        </div>
      </section>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-white/10 bg-[#0c1422]/95 px-4">
          <div className="flex items-center gap-2">
            <button title="元に戻す" onClick={state.undo} className="rounded-md p-2 text-slate-300 hover:bg-white/8"><Undo2 className="h-4 w-4" /></button>
            <button title="やり直す" onClick={state.redo} className="rounded-md p-2 text-slate-300 hover:bg-white/8"><Redo2 className="h-4 w-4" /></button>
            <select value={zoom} onChange={(event) => state.setZoom(Number(event.target.value))} className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-slate-200">
              <option value={0.2}>20%</option>
              <option value={0.27}>27%</option>
              <option value={0.34}>34%</option>
              <option value={0.45}>45%</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/8"><Eye className="h-4 w-4" />{t["top.preview"]}</button>
            <button className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/8"><CheckCircle2 className="h-4 w-4" />{t["top.validate"]}</button>
            <button onClick={exportProject} data-testid="export-button" className="inline-flex items-center gap-2 rounded-md bg-teal-300 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-teal-200"><Download className="h-4 w-4" />{exportStatus === "rendering" ? t["top.exporting"] : t["top.export"]}</button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <section className="relative flex flex-1 items-center justify-center overflow-auto bg-[#111827] p-4 checkerboard xl:p-10">
            <div className="absolute left-5 top-5 rounded-md border border-white/10 bg-black/30 px-3 py-2 text-xs text-slate-300">
              {artboard.platform === "ios" ? "iOS" : "Google Play"} · {artboard.width}x{artboard.height} · セーフエリア表示中
            </div>
            <div
              data-testid="artboard"
              className="relative overflow-hidden bg-white shadow-2xl ring-1 ring-black/20"
              style={{ width: artboard.width * zoom, height: artboard.height * zoom }}
            >
              {artboard.layers.map((layer) => {
                if (layer.hidden) return null;
                const style = {
                  left: layer.x * zoom,
                  top: layer.y * zoom,
                  width: (layer.width ?? artboard.width) * zoom,
                  height: (layer.height ?? artboard.height) * zoom,
                  opacity: layer.opacity,
                  transform: `rotate(${layer.rotation}deg)`,
                  borderRadius: layer.radius * zoom
                } as React.CSSProperties;
                if (layer.type === "background") {
                  const background = layer.fill?.type === "gradient" ? `linear-gradient(${layer.fill.angle ?? 145}deg, ${layer.fill.from}, ${layer.fill.to})` : layer.fill?.type === "solid" ? layer.fill.color : "#fff";
                  return <div key={layer.id} onClick={() => state.selectLayer(layer.id)} onContextMenu={(event) => openLayerMenu(event, layer.id)} className="absolute inset-0" style={{ background }} />;
                }
                if (layer.type === "text") {
                  const textWeight = layer.fontWeight ?? 700;
                  return (
                    <button
                      key={layer.id}
                      onClick={() => state.selectLayer(layer.id)}
                      onContextMenu={(event) => openLayerMenu(event, layer.id)}
                      className={`absolute whitespace-pre-wrap text-left ${selectedLayerIds.includes(layer.id) ? "outline outline-2 outline-teal-400" : ""}`}
                      style={{
                        ...style,
                        color: layer.color,
                        fontFamily: layer.fontFamily ?? project.brand.fontFamily,
                        fontSize: (layer.fontSize ?? 60) * zoom,
                        lineHeight: layer.lineHeight ?? 1.08,
                        fontWeight: textWeight,
                        textAlign: layer.align as "left",
                        textShadow: textWeight >= 900 ? "0.018em 0 currentColor, -0.018em 0 currentColor, 0 0.018em currentColor" : undefined,
                        paintOrder: textWeight >= 900 ? "stroke fill" : undefined
                      }}
                    >
                      {layer.text}
                    </button>
                  );
                }
                if (layer.type === "device") {
                  const screenshot = project.assets.find((asset) => asset.id === layer.screenshotAssetId);
                  return (
                    <button key={layer.id} onClick={() => state.selectLayer(layer.id)} onContextMenu={(event) => openLayerMenu(event, layer.id)} className={`absolute bg-slate-950 p-1.5 shadow-xl ${selectedLayerIds.includes(layer.id) ? "outline outline-2 outline-teal-400" : ""}`} style={style}>
                      <div className="grid h-full w-full place-items-center overflow-hidden rounded-[inherit] bg-gradient-to-br from-indigo-50 via-white to-emerald-100 text-slate-500">
                        {screenshot ? <img src={assetUrl(screenshot.path)} alt="" className="h-full w-full object-cover" /> : <span className="text-[10px] font-bold">{project.app.name}</span>}
                      </div>
                    </button>
                  );
                }
                if (layer.type === "image" && layer.assetId) {
                  const asset = [...project.assets, ...project.generatedImageAssets].find((item) => item.id === layer.assetId);
                  return (
                    <button key={layer.id} onClick={() => state.selectLayer(layer.id)} onContextMenu={(event) => openLayerMenu(event, layer.id)} className={`absolute overflow-hidden shadow-xl ${selectedLayerIds.includes(layer.id) ? "outline outline-2 outline-teal-400" : ""}`} style={style}>
                      {asset ? <img src={assetUrl(asset.path)} alt="" className="h-full w-full object-cover" /> : null}
                    </button>
                  );
                }
                return <button key={layer.id} onClick={() => state.selectLayer(layer.id)} onContextMenu={(event) => openLayerMenu(event, layer.id)} className="absolute shadow-lg" style={{ ...style, background: layer.fill?.type === "solid" ? layer.fill.color : "linear-gradient(135deg,#99f6e4,#fde68a)" }} />;
              })}
              <div className="pointer-events-none absolute inset-x-[7%] top-[4%] h-[9%] border border-dashed border-teal-500/40" />
            </div>
          </section>

          <aside className="hidden w-[336px] flex-col border-l border-white/10 bg-studio-panel xl:flex">
            <div className="border-b border-white/10 p-4">
              <div className="text-sm font-semibold text-white">{t["right.title"]}</div>
              <div className="mt-1 text-xs text-slate-500" data-testid="inspector-title">{t["right.selected"]}: {selectedLayer ? layerDisplayName(selectedLayer.id, selectedLayer.name) : "なし"}</div>
            </div>
            <div className="flex-1 space-y-4 overflow-auto p-4">
              <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><CheckCircle2 className="h-4 w-4 text-teal-300" />{t["right.summary"]}</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-black/20 p-2">
                    <div className="text-slate-500">{t["right.errors"]}</div>
                    <div className={errors.length === 0 ? "mt-1 text-lg font-semibold text-teal-200" : "mt-1 text-lg font-semibold text-red-200"}>{errors.length}</div>
                  </div>
                  <div className="rounded-md bg-black/20 p-2">
                    <div className="text-slate-500">{t["right.warnings"]}</div>
                    <div className="mt-1 text-lg font-semibold text-amber-200">{warnings.length}</div>
                  </div>
                </div>
                <div className="mt-3 rounded-md bg-black/20 p-2 text-xs leading-5 text-slate-300">
                  {artboard.platform === "ios" ? "App Store" : "Google Play"} / {artboard.width} x {artboard.height}
                </div>
              </section>

              <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Download className="h-4 w-4 text-teal-300" />書き出し</div>
                <p className="text-xs leading-5 text-slate-400">編集は左側、ここでは検証結果と出力状態だけを確認します。</p>
                <button onClick={exportProject} className="mt-3 w-full rounded-md bg-teal-300 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200">
                  {exportStatus === "rendering" ? "書き出し中..." : "現在の状態を書き出す"}
                </button>
                {exportStatus === "done" ? <div className="mt-2 text-xs text-teal-200">{exportFiles.length}枚を書き出しました。</div> : null}
                {exportStatus === "error" ? <div className="mt-2 text-xs text-red-200">書き出しに失敗しました。</div> : null}
              </section>

              <section className="rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-100"><Search className="h-4 w-4" />参考利用ポリシー</div>
                <p className="text-xs leading-5 text-slate-400">参考ギャラリーは左の「参考」メニューに集約しました。競合画像は構成・文字量・色の雰囲気だけを参考にし、ロゴやUIのコピーはしません。</p>
              </section>
            </div>
          </aside>
        </div>

        <footer className="flex h-[92px] items-center gap-4 border-t border-white/10 bg-[#0c1422] px-4">
          <div className="flex gap-2">
            {["en-US", "ja-JP"].map((locale) => <button key={locale} className="rounded-md bg-white/8 px-3 py-1.5 text-xs text-slate-200">{locale}</button>)}
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {errors.length === 0 ? <span className="inline-flex items-center gap-2 text-sm text-teal-200"><CheckCircle2 className="h-4 w-4" />{t["footer.noFatal"]}</span> : <span className="text-sm text-red-200">{errors.length}件のエラー</span>}
            <span className="text-sm text-amber-200">{warnings.length}件の警告</span>
            {exportStatus === "done" ? <span className="text-sm text-teal-200">書き出し完了: {exportFiles.length}枚</span> : null}
            {exportStatus === "error" ? <span className="text-sm text-red-200">書き出しに失敗しました</span> : null}
          </div>
          <div className="flex gap-2 overflow-hidden">
            {project.generatedImageAssets.map((asset) => <div key={asset.id} className="h-14 w-24 shrink-0 rounded-md border border-white/10 bg-gradient-to-br from-teal-200 to-amber-200" title={asset.alt} />)}
          </div>
        </footer>
      </main>
      {layerMenu && contextLayer ? (
        <LayerContextMenu
          layer={contextLayer}
          x={layerMenu.x}
          y={layerMenu.y}
          updateLayer={state.updateLayer}
          duplicateLayer={state.duplicateLayer}
          deleteLayer={state.deleteLayer}
          close={() => setLayerMenu(null)}
        />
      ) : null}
    </div>
  );
}

function LayerList({
  artboardLayers,
  selectedLayerIds,
  selectLayer,
  title
}: {
  artboardLayers: Layer[];
  selectedLayerIds: string[];
  selectLayer: (layerId: string) => void;
  title: string;
}) {
  return (
    <div className="mt-6">
      <div className="mb-3 text-sm font-semibold text-slate-200">{title}</div>
      <div className="space-y-1.5">
        {artboardLayers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => selectLayer(layer.id)}
            className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-sm ${selectedLayerIds.includes(layer.id) ? "bg-teal-300/12 text-teal-100" : "text-slate-300 hover:bg-white/[0.06]"}`}
          >
            <span className="truncate">{layerDisplayName(layer.id, layer.name)}</span>
            <span className="text-xs text-slate-500">{layerTypeLabels[layer.type] ?? layer.type}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function fillColor(layer: Layer, side: "from" | "to" | "solid") {
  if (layer.fill?.type === "solid") return layer.fill.color;
  if (layer.fill?.type === "gradient") return side === "to" ? layer.fill.to : layer.fill.from;
  return side === "to" ? "#F8FAFC" : "#E0F2FE";
}

function gradientFill(layer: Layer) {
  return {
    type: "gradient" as const,
    from: fillColor(layer, "from"),
    to: fillColor(layer, "to"),
    angle: layer.fill?.type === "gradient" ? layer.fill.angle : 145
  };
}

function LayerContextMenu({
  layer,
  x,
  y,
  updateLayer,
  duplicateLayer,
  deleteLayer,
  close
}: {
  layer: Layer;
  x: number;
  y: number;
  updateLayer: (layerId: string, patch: Partial<Layer>) => void;
  duplicateLayer: (layerId: string) => void;
  deleteLayer: (layerId: string) => void;
  close: () => void;
}) {
  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 900 : window.innerHeight;
  const menuStyle = {
    left: Math.max(8, Math.min(x, viewportWidth - 280)),
    top: Math.max(8, Math.min(y, viewportHeight - 430))
  };
  return (
    <>
      <button aria-label="右クリックメニューを閉じる" className="fixed inset-0 z-40 cursor-default bg-transparent" onClick={close} />
      <div data-testid="layer-context-menu" className="fixed z-50 w-[260px] rounded-lg border border-white/10 bg-[#111827] p-2 text-slate-100 shadow-2xl" style={menuStyle}>
        <div className="border-b border-white/10 px-2 pb-2">
          <div className="text-sm font-semibold">{layerDisplayName(layer.id, layer.name)}</div>
          <div className="mt-0.5 text-xs text-slate-500">{layerTypeLabels[layer.type]}</div>
        </div>

        {layer.type === "text" ? (
          <div className="space-y-2 border-b border-white/10 py-2">
            <label className="block px-2">
              <span className="mb-1 block text-xs text-slate-400">フォント</span>
              <select
                value={layer.fontFamily ?? fontOptions[0]!.value}
                onChange={(event) => updateLayer(layer.id, { fontFamily: event.target.value })}
                className="w-full rounded-md border border-white/10 bg-black/25 px-2 py-1.5 text-xs text-white"
              >
                {fontOptions.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2 px-2">
              <button onClick={() => updateLayer(layer.id, { fontSize: Math.max(8, (layer.fontSize ?? 32) - 4) })} className="rounded-md border border-white/10 px-2 py-1.5 text-xs hover:bg-white/8">文字を小さく</button>
              <button onClick={() => updateLayer(layer.id, { fontSize: (layer.fontSize ?? 32) + 4 })} className="rounded-md border border-white/10 px-2 py-1.5 text-xs hover:bg-white/8">文字を大きく</button>
            </div>
            <div className="grid grid-cols-3 gap-1.5 px-2">
              {fontWeightOptions.map((weight) => (
                <button
                  key={weight.value}
                  onClick={() => updateLayer(layer.id, { fontWeight: weight.value })}
                  className={`rounded-md border px-2 py-1.5 text-xs hover:bg-white/8 ${layer.fontWeight === weight.value ? "border-teal-300 bg-teal-300/10 text-teal-100" : "border-white/10"}`}
                >
                  {weight.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5 px-2">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => updateLayer(layer.id, { align })}
                  className={`rounded-md border px-2 py-1.5 text-xs hover:bg-white/8 ${layer.align === align ? "border-teal-300 bg-teal-300/10 text-teal-100" : "border-white/10"}`}
                >
                  {align === "left" ? "左" : align === "center" ? "中央" : "右"}
                </button>
              ))}
            </div>
            <label className="block px-2">
              <span className="mb-1 block text-xs text-slate-400">文字色</span>
              <input
                type="color"
                value={layer.color ?? "#0F172A"}
                onInput={(event) => updateLayer(layer.id, { color: event.currentTarget.value })}
                onChange={(event) => updateLayer(layer.id, { color: event.target.value })}
                className="h-9 w-full rounded-md border border-white/10 bg-black/25 p-1"
              />
            </label>
          </div>
        ) : null}

        {layer.type === "background" || layer.type === "shape" ? (
          <div className="space-y-2 border-b border-white/10 py-2">
            <div className="grid grid-cols-2 gap-2 px-2">
              <button onClick={() => updateLayer(layer.id, { fill: { type: "solid", color: fillColor(layer, "solid") } })} className="rounded-md border border-white/10 px-2 py-1.5 text-xs hover:bg-white/8">単色</button>
              <button onClick={() => updateLayer(layer.id, { fill: gradientFill(layer) })} className="rounded-md border border-white/10 px-2 py-1.5 text-xs hover:bg-white/8">グラデ</button>
            </div>
            <div className="grid grid-cols-2 gap-2 px-2">
              <label className="block">
                <span className="mb-1 block text-xs text-slate-400">開始</span>
                <input
                  type="color"
                  value={fillColor(layer, "from")}
                  onInput={(event) => updateLayer(layer.id, { fill: { ...gradientFill(layer), from: event.currentTarget.value } })}
                  onChange={(event) => updateLayer(layer.id, { fill: { ...gradientFill(layer), from: event.target.value } })}
                  className="h-9 w-full rounded-md border border-white/10 bg-black/25 p-1"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-slate-400">終了</span>
                <input
                  type="color"
                  value={fillColor(layer, "to")}
                  onInput={(event) => updateLayer(layer.id, { fill: { ...gradientFill(layer), to: event.currentTarget.value } })}
                  onChange={(event) => updateLayer(layer.id, { fill: { ...gradientFill(layer), to: event.target.value } })}
                  className="h-9 w-full rounded-md border border-white/10 bg-black/25 p-1"
                />
              </label>
            </div>
          </div>
        ) : null}

        {layer.type !== "background" ? (
          <div className="border-b border-white/10 py-2">
            <div className="mb-1 px-2 text-xs text-slate-400">位置を微調整</div>
            <div className="grid grid-cols-4 gap-1.5 px-2">
              <button onClick={() => updateLayer(layer.id, { x: Math.max(0, layer.x - 8) })} className="rounded-md border border-white/10 px-2 py-1.5 text-xs hover:bg-white/8">左</button>
              <button onClick={() => updateLayer(layer.id, { x: layer.x + 8 })} className="rounded-md border border-white/10 px-2 py-1.5 text-xs hover:bg-white/8">右</button>
              <button onClick={() => updateLayer(layer.id, { y: Math.max(0, layer.y - 8) })} className="rounded-md border border-white/10 px-2 py-1.5 text-xs hover:bg-white/8">上</button>
              <button onClick={() => updateLayer(layer.id, { y: layer.y + 8 })} className="rounded-md border border-white/10 px-2 py-1.5 text-xs hover:bg-white/8">下</button>
            </div>
          </div>
        ) : null}

        <div className="space-y-1 pt-2">
          {layer.type !== "background" ? (
            <>
              <button onClick={() => { duplicateLayer(layer.id); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-white/8"><Copy className="h-3.5 w-3.5" />複製</button>
              <button onClick={() => { deleteLayer(layer.id); close(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-red-200 hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" />削除</button>
            </>
          ) : null}
          <button onClick={close} className="w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-400 hover:bg-white/8">閉じる</button>
        </div>
      </div>
    </>
  );
}

function TemplatePanel({ applyTemplate, t }: { applyTemplate: (template: "panorama" | "feature" | "editorial") => void; t: StudioMessages }) {
  const templates: Array<{ id: "panorama" | "feature" | "editorial"; title: string; note: string }> = [
    { id: "panorama", title: t["templates.panorama"], note: "複数枚でひとつの大きなビジュアルに見せる" },
    { id: "feature", title: t["templates.feature"], note: "機能理解を速くする定番構成" },
    { id: "editorial", title: t["templates.editorial"], note: "上質感と信頼感を前面に出す" }
  ];
  return (
    <section className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-2 text-sm font-semibold text-white">{t["templates.title"]}</div>
      <p className="mb-3 text-xs leading-5 text-slate-400">{t["templates.description"]}</p>
      <div className="space-y-2">
        {templates.map((template) => (
          <button key={template.id} onClick={() => applyTemplate(template.id)} className="w-full rounded-md border border-white/10 bg-black/15 px-3 py-2 text-left hover:bg-white/[0.06]">
            <div className="text-xs font-semibold text-slate-100">{template.title}</div>
            <div className="mt-1 text-[11px] leading-4 text-slate-500">{template.note}</div>
          </button>
        ))}
      </div>
    </section>
  );
}

function ManualAdjustPanel({
  selectedLayer,
  updateLayer,
  duplicateLayer,
  deleteLayer,
  t
}: {
  selectedLayer: Layer | undefined;
  updateLayer: (layerId: string, patch: Partial<Layer>) => void;
  duplicateLayer: (layerId: string) => void;
  deleteLayer: (layerId: string) => void;
  t: StudioMessages;
}) {
  if (!selectedLayer) {
    return (
      <section className="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-2 text-sm font-semibold text-white">{t["manual.title"]}</div>
        <p className="text-xs leading-5 text-slate-400">{t["manual.empty"]}</p>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-white">{t["manual.title"]}</div>
          <div className="mt-0.5 text-xs text-slate-500">{layerDisplayName(selectedLayer.id, selectedLayer.name)}を編集中</div>
        </div>
        <span className="rounded bg-teal-300/10 px-2 py-1 text-xs text-teal-200">{layerTypeLabels[selectedLayer.type]}</span>
      </div>

      {selectedLayer.type === "text" ? (
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-medium text-slate-400">表示テキスト</span>
          <textarea
            value={selectedLayer.text ?? ""}
            onChange={(event) => updateLayer(selectedLayer.id, { text: event.target.value })}
            className="min-h-24 w-full rounded-md border border-white/10 bg-black/20 p-2 text-sm leading-5 text-white outline-none focus:border-teal-300/70"
          />
        </label>
      ) : null}

      {selectedLayer.type === "background" || selectedLayer.type === "shape" ? (
        <section className="mt-3 rounded-md border border-white/10 bg-black/15 p-3">
          <div className="mb-3 text-xs font-semibold text-slate-300">{selectedLayer.type === "background" ? "背景" : "図形"}の色</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateLayer(selectedLayer.id, { fill: { type: "solid", color: fillColor(selectedLayer, "solid") } })}
              className={`rounded-md border px-2 py-1.5 text-xs ${selectedLayer.fill?.type === "solid" ? "border-teal-300 bg-teal-300/10 text-teal-100" : "border-white/10 text-slate-300 hover:bg-white/8"}`}
            >
              単色
            </button>
            <button
              onClick={() => updateLayer(selectedLayer.id, { fill: { type: "gradient", from: fillColor(selectedLayer, "from"), to: fillColor(selectedLayer, "to"), angle: 145 } })}
              className={`rounded-md border px-2 py-1.5 text-xs ${selectedLayer.fill?.type === "gradient" ? "border-teal-300 bg-teal-300/10 text-teal-100" : "border-white/10 text-slate-300 hover:bg-white/8"}`}
            >
              グラデーション
            </button>
          </div>
          {selectedLayer.fill?.type === "solid" ? (
            <label className="mt-3 block">
              <span className="mb-1 block text-xs font-medium text-slate-400">背景色</span>
              <input
                type="color"
                value={selectedLayer.fill.color}
                onInput={(event) => updateLayer(selectedLayer.id, { fill: { type: "solid", color: event.currentTarget.value } })}
                onChange={(event) => updateLayer(selectedLayer.id, { fill: { type: "solid", color: event.target.value } })}
                className="h-10 w-full rounded-md border border-white/10 bg-black/20 p-1"
              />
            </label>
          ) : null}
          {selectedLayer.fill?.type === "gradient" ? (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-400">開始色</span>
                  <input
                    type="color"
                    value={selectedLayer.fill.from}
                    onInput={(event) => updateLayer(selectedLayer.id, { fill: { ...gradientFill(selectedLayer), from: event.currentTarget.value } })}
                    onChange={(event) => updateLayer(selectedLayer.id, { fill: { ...gradientFill(selectedLayer), from: event.target.value } })}
                    className="h-10 w-full rounded-md border border-white/10 bg-black/20 p-1"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-400">終了色</span>
                  <input
                    type="color"
                    value={selectedLayer.fill.to}
                    onInput={(event) => updateLayer(selectedLayer.id, { fill: { ...gradientFill(selectedLayer), to: event.currentTarget.value } })}
                    onChange={(event) => updateLayer(selectedLayer.id, { fill: { ...gradientFill(selectedLayer), to: event.target.value } })}
                    className="h-10 w-full rounded-md border border-white/10 bg-black/20 p-1"
                  />
                </label>
              </div>
              <Field
                label="角度"
                value={selectedLayer.fill.angle ?? 145}
                onChange={(value) => updateLayer(selectedLayer.id, { fill: { ...gradientFill(selectedLayer), angle: value } })}
              />
            </>
          ) : null}
        </section>
      ) : null}

      {selectedLayer.type !== "background" ? <div className="mt-3 grid grid-cols-2 gap-2">
        <Field label="X位置" value={selectedLayer.x} onChange={(value) => updateLayer(selectedLayer.id, { x: value })} />
        <Field label="Y位置" value={selectedLayer.y} onChange={(value) => updateLayer(selectedLayer.id, { y: value })} />
        <Field label="幅" value={selectedLayer.width ?? 0} onChange={(value) => updateLayer(selectedLayer.id, { width: Math.max(1, value) })} />
        <Field label="高さ" value={selectedLayer.height ?? 0} onChange={(value) => updateLayer(selectedLayer.id, { height: Math.max(1, value) })} />
      </div> : null}

      {selectedLayer.type === "text" ? (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Field label="文字サイズ" value={selectedLayer.fontSize ?? 32} onChange={(value) => updateLayer(selectedLayer.id, { fontSize: Math.max(8, value) })} />
            <Field label="太さ" value={selectedLayer.fontWeight ?? 700} onChange={(value) => updateLayer(selectedLayer.id, { fontWeight: value })} />
          </div>
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-medium text-slate-400">フォント</span>
            <select
              value={selectedLayer.fontFamily ?? fontOptions[0]!.value}
              onChange={(event) => updateLayer(selectedLayer.id, { fontFamily: event.target.value })}
              className="w-full rounded-md border border-white/10 bg-black/20 px-2 py-2 text-sm text-white outline-none focus:border-teal-300/70"
            >
              {fontOptions.map((font) => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </select>
          </label>
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-medium text-slate-400">文字色</span>
            <input
              type="color"
              value={selectedLayer.color ?? "#0F172A"}
              onInput={(event) => updateLayer(selectedLayer.id, { color: event.currentTarget.value })}
              onChange={(event) => updateLayer(selectedLayer.id, { color: event.target.value })}
              className="h-10 w-full rounded-md border border-white/10 bg-black/20 p-1"
            />
          </label>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["left", "center", "right"] as const).map((align) => (
              <button
                key={align}
                onClick={() => updateLayer(selectedLayer.id, { align })}
                className={`rounded-md border px-2 py-1.5 text-xs ${selectedLayer.align === align ? "border-teal-300 bg-teal-300/10 text-teal-100" : "border-white/10 text-slate-300 hover:bg-white/8"}`}
              >
                {align === "left" ? "左" : align === "center" ? "中央" : "右"}
              </button>
            ))}
          </div>
        </>
      ) : null}

      {selectedLayer.type !== "background" ? <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => duplicateLayer(selectedLayer.id)} className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/8"><Copy className="h-4 w-4" />複製</button>
        <button onClick={() => deleteLayer(selectedLayer.id)} className="inline-flex items-center justify-center gap-2 rounded-md border border-red-400/30 px-3 py-2 text-sm text-red-200 hover:bg-red-500/10"><Trash2 className="h-4 w-4" />削除</button>
      </div> : null}
    </section>
  );
}

function CodexRequestPanel({
  t,
  requestStatus,
  inspirationNotice,
  reviewInstruction,
  selectedLayerName,
  setReviewInstruction,
  submitCodexRequest
}: {
  t: StudioMessages;
  requestStatus: "idle" | "saving" | "saved" | "error";
  inspirationNotice: string | null;
  reviewInstruction: string;
  selectedLayerName: string;
  setReviewInstruction: (value: string) => void;
  submitCodexRequest: () => void;
}) {
  return (
    <section className="mt-6 rounded-lg border border-teal-300/20 bg-teal-300/[0.06] p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal-100"><Sparkles className="h-4 w-4" />{t["codex.title"]}</div>
      <p className="mb-3 text-xs leading-5 text-slate-400">{t["codex.description"]}</p>
      {inspirationNotice ? (
        <div className="mb-3 rounded-md border border-amber-300/30 bg-amber-300/10 p-2 text-xs leading-5 text-amber-100">
          {inspirationNotice}
        </div>
      ) : null}
      <textarea
        value={reviewInstruction}
        onChange={(event) => setReviewInstruction(event.target.value)}
        className="min-h-24 w-full rounded-md border border-white/10 bg-black/20 p-2 text-xs leading-5 text-white outline-none focus:border-teal-300/70"
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        {["短くする", "高級感", "上に移動", "検証修正"].map((label) => (
          <button
            key={label}
            onClick={() => setReviewInstruction(`${selectedLayerName}を「${label}」方向で調整したい。`)}
            className="rounded-md border border-white/10 px-2 py-1.5 text-xs text-slate-200 hover:bg-white/8"
          >
            {label}
          </button>
        ))}
      </div>
      <button onClick={submitCodexRequest} className="mt-3 w-full rounded-md bg-teal-300 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200">
        {requestStatus === "saving" ? "依頼を保存中..." : "Codex依頼キューに追加"}
      </button>
      {requestStatus === "saved" ? <div className="mt-2 text-xs text-teal-200">依頼を保存しました。Codexがこの内容を読んで修正できます。</div> : null}
      {requestStatus === "error" ? <div className="mt-2 text-xs text-red-200">依頼の保存に失敗しました。</div> : null}
    </section>
  );
}

async function extractImagePalette(src: string): Promise<string[]> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image load failed"));
  });
  image.src = src;
  const loadedImage = await loaded;
  const canvas = document.createElement("canvas");
  const size = 48;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("canvas unavailable");
  context.drawImage(loadedImage, 0, 0, size, size);
  const pixels = context.getImageData(0, 0, size, size).data;
  const buckets = new Map<string, number>();
  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] ?? 0;
    if (alpha < 180) continue;
    const red = pixels[index] ?? 0;
    const green = pixels[index + 1] ?? 0;
    const blue = pixels[index + 2] ?? 0;
    const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
    if (red + green + blue > 735 || red + green + blue < 36 || saturation < 12) continue;
    const key = [red, green, blue].map((value) => Math.round(value / 32) * 32).join(",");
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const colors = [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([key]) => {
      const [red = 0, green = 0, blue = 0] = key.split(",").map(Number);
      return `#${[red, green, blue].map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0")).join("")}`;
    });
  return colors.length > 0 ? colors : ["#DBEAFE", "#CCFBF1", "#FDE68A"];
}

function AssetsPanel({
  project,
  t,
  selectedLayer,
  updateLayer,
  addAsset,
  createObjectLayersFromAsset,
  exportFiles,
  setExportFiles
}: {
  project: StoreShotProject;
  t: StudioMessages;
  selectedLayer: Layer | undefined;
  updateLayer: (layerId: string, patch: Partial<Layer>) => void;
  addAsset: (asset: StoreShotProject["assets"][number]) => void;
  createObjectLayersFromAsset: (asset: StoreShotProject["assets"][number], colors: string[]) => void;
  exportFiles: ExportFile[];
  setExportFiles: (files: ExportFile[]) => void;
}) {
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [objectifyStatus, setObjectifyStatus] = useState<string | null>(null);
  const assets = [...project.assets, ...project.generatedImageAssets];

  useEffect(() => {
    fetch("/api/exports")
      .then((response) => response.json())
      .then((json: { files: ExportFile[] }) => setExportFiles(json.files))
      .catch(() => setExportFiles([]));
  }, [setExportFiles]);

  async function uploadScreenshot(file: File) {
    setUploadStatus("uploading");
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await fetch("/api/assets/upload", { method: "POST", body: form });
      if (!response.ok) throw new Error("upload failed");
      const json = (await response.json()) as { asset: StoreShotProject["assets"][number] };
      addAsset(json.asset);
      if (selectedLayer?.type === "device") {
        updateLayer(selectedLayer.id, { screenshotAssetId: json.asset.id });
      }
      setUploadStatus("done");
    } catch {
      setUploadStatus("error");
    }
  }

  async function objectifyAsset(asset: StoreShotProject["assets"][number]) {
    setObjectifyStatus(`${asset.id} を解析中...`);
    try {
      const colors = await extractImagePalette(assetUrl(asset.path));
      createObjectLayersFromAsset(asset, colors);
      setObjectifyStatus(`${asset.id} から編集可能なオブジェクトを作成しました。`);
    } catch {
      createObjectLayersFromAsset(asset, ["#DBEAFE", "#CCFBF1", "#FDE68A"]);
      setObjectifyStatus(`${asset.id} を画像レイヤーとして配置しました。色抽出はできませんでした。`);
    }
  }

  return (
    <section>
      <div className="mb-3 text-sm font-semibold text-slate-200">{t["assets.title"]}</div>
      <p className="mb-3 text-xs leading-5 text-slate-400">実機で撮ったスクショをここからアップロードできます。端末レイヤーを選んでから入れると、その端末内に配置されます。</p>
      <label className="mb-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-teal-300/40 bg-teal-300/[0.06] px-4 py-5 text-center hover:bg-teal-300/[0.1]">
        <ImageIcon className="mb-2 h-5 w-5 text-teal-200" />
        <span className="text-sm font-semibold text-teal-100">{t["assets.upload"]}</span>
        <span className="mt-1 text-xs text-slate-400">PNG / JPG / WebPを選択</span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadScreenshot(file);
            event.currentTarget.value = "";
          }}
        />
      </label>
      {uploadStatus === "done" ? <div className="mb-3 rounded-md border border-teal-300/30 bg-teal-300/10 p-2 text-xs text-teal-100">アップロードしました。端末を選んでいた場合は自動配置済みです。</div> : null}
      {uploadStatus === "error" ? <div className="mb-3 rounded-md border border-red-300/30 bg-red-300/10 p-2 text-xs text-red-100">アップロードに失敗しました。</div> : null}
      <div className="mb-3 rounded-md border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-slate-400">
        画像をオブジェクト化すると、画像レイヤー、抽出色のスウォッチ、背景用の図形レイヤーを作ります。AI生成背景やアップロード画像を手で微修正しやすくするための入口です。
      </div>
      {objectifyStatus ? <div className="mb-3 rounded-md border border-teal-300/30 bg-teal-300/10 p-2 text-xs text-teal-100">{objectifyStatus}</div> : null}
      <div className="space-y-2">
        {assets.map((asset) => (
          <div key={`${asset.id}-${asset.path}`} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex gap-3">
              <img src={assetUrl(asset.path)} alt="" className="h-14 w-14 shrink-0 rounded-md border border-white/10 object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{asset.id}</div>
                <div className="mt-1 break-all text-xs text-slate-500">{asset.path}</div>
                <div className="mt-2 text-xs text-slate-400">{asset.width ?? "-"} x {asset.height ?? "-"} · {asset.type}</div>
              </div>
            </div>
            {selectedLayer?.type === "device" && asset.type === "screenshot" ? (
              <button onClick={() => updateLayer(selectedLayer.id, { screenshotAssetId: asset.id })} className="mt-3 w-full rounded-md border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/8">選択中の端末に配置</button>
            ) : null}
            <button onClick={() => void objectifyAsset(asset)} className="mt-2 w-full rounded-md border border-teal-300/30 bg-teal-300/[0.06] px-3 py-2 text-xs font-semibold text-teal-100 hover:bg-teal-300/[0.1]">画像をオブジェクト化</button>
          </div>
        ))}
      </div>

      <div className="mt-6 mb-3 text-sm font-semibold text-slate-200">過去の書き出し</div>
      {exportFiles.length === 0 ? <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-slate-400">まだ書き出し画像がありません。上部の「書き出し」を押すとここに表示されます。</div> : null}
      <div className="grid grid-cols-2 gap-2">
        {exportFiles.slice(0, 12).map((file) => (
          <a key={file.path} href={`/api/exports/file?path=${encodeURIComponent(file.path)}`} target="_blank" className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]" rel="noreferrer">
            <img src={`/api/exports/file?path=${encodeURIComponent(file.path)}`} alt="" className="h-28 w-full object-cover transition group-hover:scale-[1.02]" />
            <div className="truncate px-2 py-1.5 text-[11px] text-slate-400">{file.name}</div>
          </a>
        ))}
      </div>
    </section>
  );
}

function ReferencePanel({
  referenceApps,
  referenceStatus,
  referencePlatform,
  referenceKeyword,
  referenceLimit,
  referenceMode,
  setReferenceKeyword,
  setReferenceLimit,
  setReferencePlatform,
  fetchReferences,
  t,
  useInspiration
}: {
  referenceApps: StoreReferenceApp[];
  referenceStatus: "fixture" | "loading" | "live" | "error";
  referencePlatform: "ios" | "android";
  referenceKeyword: string;
  referenceLimit: number;
  referenceMode: "ranking" | "search";
  setReferenceKeyword: (value: string) => void;
  setReferenceLimit: (value: number) => void;
  setReferencePlatform: (value: "ios" | "android") => void;
  fetchReferences: (options?: { mode?: "ranking" | "search"; keyword?: string; limit?: number; platform?: "ios" | "android" }) => void;
  t: StudioMessages;
  useInspiration: (app: StoreReferenceApp) => void;
}) {
  const keywordInputRef = useRef<HTMLInputElement>(null);
  function runReferenceSearch() {
    const keyword = keywordInputRef.current?.value ?? referenceKeyword;
    setReferenceKeyword(keyword);
    void fetchReferences({ mode: keyword.trim() ? "search" : "ranking", keyword, platform: referencePlatform, limit: referenceLimit });
  }

  return (
    <section data-testid="reference-gallery">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200"><Search className="h-4 w-4 text-amber-300" />{t["references.title"]}</div>
        <span className="rounded bg-white/8 px-2 py-1 text-xs text-slate-400">{referenceStatus === "live" ? "App Store" : referenceStatus === "loading" ? "取得中" : "デモ"}</span>
      </div>
      <p className="mb-3 text-xs leading-5 text-slate-400">人気アプリのストア画像は、コピーではなく構成・文字量・端末配置・色の雰囲気を分析するために使います。</p>
      <form
        className="mb-3 rounded-lg border border-white/10 bg-black/20 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          runReferenceSearch();
        }}
      >
        <div className="grid gap-2">
          <label className="text-xs text-slate-400">
            アプリ名・キーワード
            <input
              name="keyword"
              ref={keywordInputRef}
              defaultValue={referenceKeyword}
              onInput={(event) => setReferenceKeyword(event.currentTarget.value)}
              placeholder="例: ChatGPT, Notion, 家計簿"
              className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-teal-300/70"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-400">
              ストア
              <select
                name="platform"
                value={referencePlatform}
                onChange={(event) => setReferencePlatform(event.target.value as "ios" | "android")}
                className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-2 text-sm text-white"
              >
                <option value="ios">App Store</option>
                <option value="android">Google Play</option>
              </select>
            </label>
            <label className="text-xs text-slate-400">
              件数
              <select
                name="limit"
                value={referenceLimit}
                onChange={(event) => setReferenceLimit(Number(event.target.value))}
                className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-2 py-2 text-sm text-white"
              >
                <option value={12}>12件</option>
                <option value={25}>25件</option>
                <option value={50}>50件</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="submit" className="rounded-md bg-teal-300 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-teal-200">
              検索する
            </button>
            <button
              type="button"
              onClick={() => {
                setReferenceKeyword("");
                if (keywordInputRef.current) keywordInputRef.current.value = "";
                void fetchReferences({ mode: "ranking", keyword: "" });
              }}
              className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/8"
            >
              ランキングに戻す
            </button>
          </div>
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          現在: {referencePlatform === "ios" ? "App Store" : "Google Play"} / {referenceMode === "search" ? `検索「${referenceKeyword || "未入力"}」` : "トップ無料ランキング"} / {referenceLimit}件
        </div>
      </form>
      {referenceStatus === "loading" ? <div className="mb-3 rounded-md border border-white/10 bg-white/[0.04] p-2 text-xs text-slate-300">App Storeランキングから参考画像を取得しています...</div> : null}
      {referenceStatus === "error" ? <div className="mb-3 rounded-md border border-amber-300/30 bg-amber-300/10 p-2 text-xs text-amber-100">ライブ取得に失敗したため、デモ参考を表示しています。</div> : null}
      {referencePlatform === "android" ? <div className="mb-3 rounded-md border border-amber-300/30 bg-amber-300/10 p-2 text-xs text-amber-100">Google Playは現在replaceable adapterのfixture fallbackです。ライブ取得実装を差し替え可能な構造にしています。</div> : null}
      <div className="space-y-3">
        {referenceApps.map((app) => {
          const hints = referenceHintLines(app);
          return (
          <article key={app.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex gap-3">
              {app.iconUrl ? <ReferenceImage src={app.iconUrl} className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-200 to-amber-200" />}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{app.appName}</div>
                <div className="truncate text-xs text-slate-500">{app.developer}</div>
                <div className="mt-1 text-xs text-slate-400">{app.platform === "ios" ? "iOS" : "Android"} · {app.category} · 評価 {app.rating ?? "-"}</div>
              </div>
            </div>
            {app.screenshotUrls.length > 0 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {app.screenshotUrls.slice(0, 4).map((url, index) => (
                  <ReferenceImage key={`${app.id}-${url}-${index}`} src={url} className="h-24 w-14 shrink-0 rounded border border-white/10 object-cover" />
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-md border border-dashed border-white/10 bg-black/15 px-3 py-4 text-center text-xs text-slate-500">このアプリは取得可能なストア画像がありません</div>
            )}
            <div className="mt-3 rounded-md bg-black/20 p-2 text-xs leading-5 text-slate-300">
              <div className="mb-1 font-semibold text-slate-200">抽出するヒント</div>
              <ul className="space-y-1">
                {hints.map((hint) => <li key={hint}>{hint}</li>)}
              </ul>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => useInspiration(app)} className="rounded-md bg-white/8 px-3 py-2 text-xs font-semibold text-white hover:bg-white/12">構成だけ参考</button>
              {app.storeUrl ? (
                <a href={app.storeUrl} target="_blank" rel="noreferrer" className="rounded-md border border-white/10 px-3 py-2 text-center text-xs font-semibold text-slate-200 hover:bg-white/8">ストアで見る</a>
              ) : (
                <span className="rounded-md border border-white/8 px-3 py-2 text-center text-xs text-slate-500">リンクなし</span>
              )}
            </div>
          </article>
          );
        })}
      </div>
    </section>
  );
}

function BrandPanel({ project, title }: { project: StoreShotProject; title: string }) {
  return (
    <section>
      <div className="mb-3 text-sm font-semibold text-slate-200">{title}</div>
      <div className="space-y-3">
        {Object.entries(project.brand.colors).map(([name, color]) => (
          <div key={name} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="h-9 w-9 rounded-md border border-white/10" style={{ background: color }} />
            <div>
              <div className="text-sm text-white">{name}</div>
              <div className="text-xs text-slate-500">{color}</div>
            </div>
          </div>
        ))}
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-300">
          <div className="text-xs text-slate-500">フォント</div>
          <div className="mt-1 text-white">{project.brand.fontFamily}</div>
          <div className="mt-3 text-xs text-slate-500">トーン</div>
          <div className="mt-1 leading-5">{project.brand.tone}</div>
        </div>
      </div>
    </section>
  );
}

function ReferenceImage({ src, className }: { src: string; className: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <div className={`grid place-items-center bg-black/20 text-[10px] text-slate-500 ${className}`}>画像なし</div>;
  }
  return <img src={src.startsWith("/") ? src : referenceImageUrl(src)} alt="" className={className} onError={() => setFailed(true)} loading="lazy" />;
}

function JsonPanel({ project, t }: { project: StoreShotProject; t: StudioMessages }) {
  return (
    <section>
      <div className="mb-3 text-sm font-semibold text-slate-200">{t["json.title"]}</div>
      <p className="mb-3 text-xs leading-5 text-slate-400">{t["json.description"]}</p>
      <pre className="max-h-[70vh] overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-[11px] leading-5 text-slate-300">{JSON.stringify(project, null, 2)}</pre>
    </section>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
      <input value={value} onChange={(event) => onChange(Number(event.target.value))} type="number" className="w-full rounded-md border border-white/10 bg-black/20 px-2 py-2 text-sm text-white outline-none focus:border-teal-300/70" />
    </label>
  );
}
