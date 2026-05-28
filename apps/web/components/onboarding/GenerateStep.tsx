"use client";

import { AlertTriangle, CheckCircle2, Cpu, FolderOpen, Library, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { StoreReferenceApp } from "@openstoreshot/store-fetch";
import type { StoreShotProject } from "@openstoreshot/core";
import type { messagesFor } from "../../lib/i18n";
import { MANUAL_AGENT_ID } from "../../lib/agents";
import { referenceDesignPatterns } from "../../lib/referenceDesign";
import type { BriefState } from "./BriefStep";

type StudioMessages = ReturnType<typeof messagesFor>;

interface GenerateStepProps {
  t: StudioMessages;
  agentId: string;
  agentName: string | null;
  projectDir: string | null;
  hasProject: boolean;
  references: StoreReferenceApp[];
  brief: BriefState;
  onGenerated: (project?: StoreShotProject) => void;
}

interface ValidationIssue {
  severity: "error" | "warning";
  message: string;
}

interface GenerateResult {
  ok?: boolean;
  wrote?: boolean;
  exitCode?: number | null;
  stdout?: string;
  stderr?: string;
  error?: string;
  issues?: ValidationIssue[];
  parseError?: string;
  project?: StoreShotProject;
  timedOut?: boolean;
  durationMs?: number;
  jobId?: string;
  running?: boolean;
  status?: "running" | "done" | "error";
  logs?: string[];
}

export function GenerateStep({ t, agentId, agentName, projectDir, hasProject, references, brief, onGenerated }: GenerateStepProps) {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const isManual = agentId === MANUAL_AGENT_ID;
  const canGenerate = !isManual && projectDir !== null && status !== "running";

  useEffect(() => {
    if (status !== "running") return;
    setElapsedSeconds(0);
    const id = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [status]);

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
          brief,
          references: references.map((ref) => ({
            id: ref.id,
            platform: ref.platform,
            appName: ref.appName,
            developer: ref.developer,
            category: ref.category,
            rating: ref.rating,
            source: ref.source,
            storeUrl: ref.storeUrl,
            screenshotUrls: ref.screenshotUrls,
            patterns: referenceDesignPatterns(ref)
          }))
        })
      });
      const json = (await response.json()) as GenerateResult;
      if (json.jobId && json.running) {
        setResult(json);
        pollJob(json.jobId);
        return;
      }
      finishFromResult(json);
    } catch {
      setResult({ error: "request_failed" });
      setStatus("error");
    }
  }

  function finishFromResult(json: GenerateResult) {
    setResult(json);
    const errorCount = (json.issues ?? []).filter((issue) => issue.severity === "error").length;
    if (json.ok && errorCount === 0) {
      setStatus("done");
      onGenerated(json.project);
    } else {
      setStatus("error");
    }
  }

  async function pollJob(jobId: string) {
    try {
      while (true) {
        await new Promise((resolve) => window.setTimeout(resolve, 1500));
        const response = await fetch(`/api/generate?jobId=${encodeURIComponent(jobId)}`);
        const json = (await response.json()) as GenerateResult;
        setResult(json);
        if (!json.running) {
          finishFromResult(json);
          return;
        }
      }
    } catch {
      setResult({ error: "poll_failed" });
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
        <div className="mt-3 space-y-2">
          <p className="text-xs leading-5 text-slate-400">
            {t["onboarding.generateWait"]} ({elapsedSeconds}s)
          </p>
          {(result?.logs ?? []).length > 0 ? (
            <pre className="max-h-40 overflow-auto rounded-md bg-black/40 p-2 text-[11px] leading-4 text-slate-300" data-testid="generate-progress-log">
              {result!.logs!.slice(-12).join("\n")}
            </pre>
          ) : null}
        </div>
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
          {(result?.issues ?? []).length > 0 ? (
            <ul className="max-h-32 overflow-auto rounded-md bg-black/30 p-2 text-[11px] leading-4">
              {result!.issues!.slice(0, 8).map((issue, index) => (
                <li
                  key={index}
                  className={issue.severity === "error" ? "text-red-200" : "text-amber-200"}
                  data-testid={`generate-issue-${issue.severity}`}
                >
                  {issue.severity.toUpperCase()}: {issue.message}
                </li>
              ))}
            </ul>
          ) : null}
          {result?.timedOut ? (
            <div className="rounded-md bg-black/30 p-2 text-[11px] leading-4 text-red-200">
              Agent timed out after {Math.round((result.durationMs ?? 0) / 1000)}s before producing a valid project.
            </div>
          ) : null}
          {result?.parseError ? (
            <pre className="max-h-24 overflow-auto rounded-md bg-black/40 p-2 text-[11px] leading-4 text-red-200">
              {result.parseError}
            </pre>
          ) : null}
          {result?.stderr || result?.stdout ? (
            <pre className="max-h-32 overflow-auto rounded-md bg-black/40 p-2 text-[11px] leading-4 text-slate-400">
              {[
                result.durationMs ? `elapsed: ${Math.round(result.durationMs / 1000)}s` : null,
                (result.stderr || result.stdout || "").trim()
              ].filter(Boolean).join("\n\n")}
            </pre>
          ) : null}
          {result?.wrote ? (
            <button
              type="button"
              data-testid="generate-open-anyway"
              onClick={() => onGenerated(result?.project)}
              className="mt-2 inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/8"
            >
              {t["onboarding.generateOpenAnyway"]}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
