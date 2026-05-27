"use client";

import { CheckCircle2, FolderCheck, FolderOpen } from "lucide-react";
import { useState } from "react";
import type { messagesFor } from "../../lib/i18n";

type StudioMessages = ReturnType<typeof messagesFor>;

interface PickResult {
  path?: string;
  writable?: boolean;
  hasProject?: boolean;
  canceled?: boolean;
  error?: string;
}

interface ProjectStepProps {
  t: StudioMessages;
  selectedDir: string | null;
  selectedHasProject: boolean;
  onSelect: (dir: string, hasProject: boolean) => void;
  onUseExisting: () => void;
}

export function ProjectStep({ t, selectedDir, selectedHasProject, onSelect, onUseExisting }: ProjectStepProps) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notWritable, setNotWritable] = useState(false);

  async function pickFolder() {
    setOpening(true);
    setError(null);
    try {
      const response = await fetch("/api/fs", { method: "POST" });
      const result = (await response.json()) as PickResult;
      if (result.error || !response.ok) {
        setError(t["onboarding.projectUnsupported"]);
        return;
      }
      if (result.canceled || !result.path) return;
      setNotWritable(result.writable === false);
      onSelect(result.path, Boolean(result.hasProject));
    } catch {
      setError(t["onboarding.projectError"]);
    } finally {
      setOpening(false);
    }
  }

  return (
    <section>
      <div className="mb-1 text-sm font-semibold text-white">{t["onboarding.projectTitle"]}</div>
      <p className="mb-4 text-xs leading-5 text-slate-400">{t["onboarding.projectNote"]}</p>

      <button
        type="button"
        data-testid="fs-pick-folder"
        disabled={opening}
        onClick={pickFolder}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/[0.03] px-4 py-8 text-sm font-medium text-slate-200 hover:bg-white/[0.06] disabled:opacity-50"
      >
        <FolderOpen className="h-5 w-5 text-teal-300" />
        {opening ? t["onboarding.projectOpening"] : t["onboarding.projectChoose"]}
      </button>

      {error ? <div className="mt-3 text-xs text-red-200">{error}</div> : null}

      {selectedDir ? (
        <div className="mt-4 rounded-md border border-teal-300/30 bg-teal-300/[0.06] px-3 py-2.5">
          <div className="flex items-center gap-2 text-xs text-teal-100">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="truncate" data-testid="fs-selected-dir">{selectedDir}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-3 pl-6 text-[11px]">
            {selectedHasProject ? (
              <span className="inline-flex items-center gap-1 text-teal-200">
                <FolderCheck className="h-3.5 w-3.5" />
                {t["onboarding.projectHasProject"]}
              </span>
            ) : (
              <span className="text-slate-500">{t["onboarding.projectNew"]}</span>
            )}
            {notWritable ? <span className="text-amber-200">{t["onboarding.projectNotWritable"]}</span> : null}
          </div>
        </div>
      ) : null}

      {selectedDir && selectedHasProject ? (
        <div className="mt-3 rounded-md border border-white/10 bg-white/[0.03] p-3" data-testid="existing-project-prompt">
          <p className="text-xs leading-5 text-slate-300">{t["onboarding.projectExistingFound"]}</p>
          <button
            type="button"
            data-testid="use-existing-project"
            onClick={onUseExisting}
            className="mt-2.5 inline-flex items-center justify-center gap-2 rounded-md bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-200"
          >
            {t["onboarding.projectUseExisting"]}
          </button>
          <p className="mt-2 text-[11px] text-slate-500">{t["onboarding.projectRegenerateHint"]}</p>
        </div>
      ) : null}
    </section>
  );
}
