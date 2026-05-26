"use client";

import { AlertTriangle, CheckCircle2, Cpu, FolderOpen, Library, Sparkles } from "lucide-react";
import { useState } from "react";
import type { StoreReferenceApp } from "@openstoreshot/store-fetch";
import type { messagesFor } from "../../lib/i18n";
import { MANUAL_AGENT_ID } from "../../lib/agents";

type StudioMessages = ReturnType<typeof messagesFor>;

interface GenerateStepProps {
  t: StudioMessages;
  agentId: string;
  agentName: string | null;
  projectDir: string | null;
  hasProject: boolean;
  references: StoreReferenceApp[];
  onGenerated: () => void;
}

interface GenerateResult {
  ok?: boolean;
  wrote?: boolean;
  exitCode?: number | null;
  stdout?: string;
  stderr?: string;
  error?: string;
}

export function GenerateStep({ t, agentId, agentName, projectDir, hasProject, references, onGenerated }: GenerateStepProps) {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<GenerateResult | null>(null);

  const isManual = agentId === MANUAL_AGENT_ID;
  const canGenerate = !isManual && projectDir !== null && status !== "running";

  async function generate() {
    if (!projectDir) return;
    setStatus("running");
    setResult(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          projectDir,
          hasProject,
          references: references.map((ref) => ({
            appName: ref.appName,
            category: ref.category,
            rating: ref.rating,
            screenshotUrls: ref.screenshotUrls
          }))
        })
      });
      const json = (await response.json()) as GenerateResult;
      setResult(json);
      if (json.ok) {
        setStatus("done");
        onGenerated();
      } else {
        setStatus("error");
      }
    } catch {
      setResult({ error: "request_failed" });
      setStatus("error");
    }
  }

  return (
    <section>
      <div className="mb-1 text-sm font-semibold text-white">{t["onboarding.generateTitle"]}</div>
      <p className="mb-4 text-xs leading-5 text-slate-400">{t["onboarding.generateNote"]}</p>

      <dl className="mb-4 space-y-2 rounded-lg border border-white/10 bg-black/20 p-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Cpu className="h-4 w-4 shrink-0 text-teal-300" />
          <span className="text-slate-500">{t["onboarding.stepAgent"]}:</span>
          <span className="truncate text-white">{agentName ?? t["onboarding.agentManual"]}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <FolderOpen className="h-4 w-4 shrink-0 text-teal-300" />
          <span className="text-slate-500">{t["onboarding.stepProject"]}:</span>
          <span className="truncate text-white">{projectDir ?? "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <Library className="h-4 w-4 shrink-0 text-teal-300" />
          <span className="text-slate-500">{t["onboarding.stepReferences"]}:</span>
          <span className="text-white">{t["onboarding.referencesSelected"].replace("{count}", String(references.length))}</span>
        </div>
      </dl>

      {isManual ? (
        <div className="rounded-md border border-amber-300/30 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-100">
          {t["onboarding.generateManual"]}
        </div>
      ) : (
        <button
          type="button"
          data-testid="generate-run"
          disabled={!canGenerate}
          onClick={generate}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-teal-300 px-4 py-2.5 text-sm font-semibold text-slate-950 enabled:hover:bg-teal-200 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {status === "running" ? t["onboarding.generateRunning"] : t["onboarding.generateRun"]}
        </button>
      )}

      {status === "running" ? (
        <p className="mt-3 text-xs leading-5 text-slate-400">{t["onboarding.generateWait"]}</p>
      ) : null}

      {status === "done" ? (
        <div className="mt-3 flex items-center gap-2 text-xs text-teal-200">
          <CheckCircle2 className="h-4 w-4" />
          {t["onboarding.generateDone"]}
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-xs text-red-200">
            <AlertTriangle className="h-4 w-4" />
            {t["onboarding.generateError"]}
          </div>
          {result?.stderr || result?.stdout ? (
            <pre className="max-h-32 overflow-auto rounded-md bg-black/40 p-2 text-[11px] leading-4 text-slate-400">
              {(result.stderr || result.stdout || "").trim()}
            </pre>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
