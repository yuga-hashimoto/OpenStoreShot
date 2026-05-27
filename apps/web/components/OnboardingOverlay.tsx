"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { messagesFor } from "../lib/i18n";
import type { StoreReferenceApp } from "@openstoreshot/store-fetch";
import { agentDefs, agentNameById, MANUAL_AGENT_ID, type AgentStatus } from "../lib/agents";
import { resolveBrowserLocale, type Locale } from "../lib/i18n";
import { AgentStep } from "./onboarding/AgentStep";
import { ProjectStep } from "./onboarding/ProjectStep";
import { BriefStep, type BriefState } from "./onboarding/BriefStep";
import { ReferenceStep } from "./onboarding/ReferenceStep";
import { GenerateStep } from "./onboarding/GenerateStep";

type StudioMessages = ReturnType<typeof messagesFor>;

export interface OnboardingResult {
  agentId: string;
  projectDir: string | null;
  projectHasProject: boolean;
  references: StoreReferenceApp[];
  brief: BriefState;
}

interface OnboardingOverlayProps {
  t: StudioMessages;
  onComplete: (result: OnboardingResult) => void;
}

type StepId = "agent" | "project" | "brief" | "references" | "generate";
const STEP_ORDER: StepId[] = ["agent", "project", "brief", "references", "generate"];

function defaultBrief(): BriefState {
  const locale: Locale = typeof window === "undefined" ? "ja-JP" : resolveBrowserLocale(window.navigator.language);
  return {
    appName: "",
    intent: "",
    slideCount: 5,
    platforms: ["ios", "android"],
    locale
  };
}

function pickDefaultAgent(agents: AgentStatus[]): string {
  const recommended = agents.find((agent) => agent.recommended && agent.available);
  if (recommended) return recommended.id;
  const firstAvailable = agents.find((agent) => agent.available);
  if (firstAvailable) return firstAvailable.id;
  return MANUAL_AGENT_ID;
}

export function OnboardingOverlay({ t, onComplete }: OnboardingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [agents, setAgents] = useState<AgentStatus[] | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(MANUAL_AGENT_ID);
  const [projectDir, setProjectDir] = useState<string | null>(null);
  const [projectHasProject, setProjectHasProject] = useState(false);
  const [brief, setBrief] = useState<BriefState>(defaultBrief);
  const [references, setReferences] = useState<StoreReferenceApp[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/agents")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("agent probe failed"))))
      .then((json: { agents: AgentStatus[] }) => {
        if (!active) return;
        setAgents(json.agents);
        setSelectedAgentId(pickDefaultAgent(json.agents));
      })
      .catch(() => {
        if (!active) return;
        setAgents(agentDefs.map((def) => ({ ...def, available: false, version: null })));
        setSelectedAgentId(MANUAL_AGENT_ID);
      });
    return () => {
      active = false;
    };
  }, []);

  const stepLabels: Record<StepId, string> = {
    agent: t["onboarding.stepAgent"],
    project: t["onboarding.stepProject"],
    brief: t["onboarding.stepBrief"],
    references: t["onboarding.stepReferences"],
    generate: t["onboarding.stepGenerate"]
  };
  const currentStep = STEP_ORDER[stepIndex]!;
  const isLastStep = stepIndex === STEP_ORDER.length - 1;
  const canProceed = currentStep === "project" ? projectDir !== null : true;

  function finish(overrides?: Partial<OnboardingResult>) {
    onComplete({ agentId: selectedAgentId, projectDir, projectHasProject, references, brief, ...overrides });
  }

  function goNext() {
    if (isLastStep) {
      finish();
    } else {
      setStepIndex((index) => index + 1);
    }
  }

  function toggleReference(app: StoreReferenceApp) {
    setReferences((current) =>
      current.some((item) => item.id === app.id) ? current.filter((item) => item.id !== app.id) : [...current, app]
    );
  }

  return (
    <div
      data-testid="onboarding-overlay"
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-auto bg-studio-ink/95 p-6 backdrop-blur"
    >
      <div className="my-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-[#0c1422] p-8 shadow-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300/80">OPENSTORESHOT</div>
        <h1 className="mt-3 text-2xl font-semibold leading-tight text-white">{t["onboarding.title"]}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{t["onboarding.subtitle"]}</p>

        <ol className="mt-6 flex items-center gap-2" data-testid="onboarding-stepper">
          {STEP_ORDER.map((step, index) => {
            const active = index === stepIndex;
            const done = index < stepIndex;
            return (
              <li key={step} className="flex items-center gap-2">
                <span
                  className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                    active
                      ? "bg-teal-300/15 text-teal-200"
                      : done
                        ? "text-teal-300/70"
                        : "text-slate-500"
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold ${
                      active ? "bg-teal-300 text-slate-950" : done ? "bg-teal-300/30 text-teal-100" : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {index + 1}
                  </span>
                  {stepLabels[step]}
                </span>
                {index < STEP_ORDER.length - 1 ? <span className="h-px w-5 bg-white/10" /> : null}
              </li>
            );
          })}
        </ol>

        <div className="mt-6 min-h-[18rem]">
          {currentStep === "agent" ? (
            <AgentStep t={t} agents={agents} selectedAgentId={selectedAgentId} onSelect={setSelectedAgentId} />
          ) : null}
          {currentStep === "project" ? (
            <ProjectStep
              t={t}
              selectedDir={projectDir}
              selectedHasProject={projectHasProject}
              onSelect={(dir, hasProject) => {
                setProjectDir(dir);
                setProjectHasProject(hasProject);
              }}
              onUseExisting={() => finish({ projectHasProject: true, references: [] })}
            />
          ) : null}
          {currentStep === "brief" ? (
            <BriefStep t={t} value={brief} onChange={setBrief} />
          ) : null}
          {currentStep === "references" ? (
            <ReferenceStep t={t} selected={references} onToggle={toggleReference} />
          ) : null}
          {currentStep === "generate" ? (
            <GenerateStep
              t={t}
              agentId={selectedAgentId}
              agentName={agentNameById(selectedAgentId)}
              projectDir={projectDir}
              hasProject={projectHasProject}
              references={references}
              brief={brief}
              onGenerated={() => finish({ projectHasProject: true })}
            />
          ) : null}
        </div>

        <div className="mt-7 flex items-center justify-end gap-2">
          <div className="flex items-center gap-2">
            {stepIndex > 0 ? (
              <button
                type="button"
                data-testid="onboarding-back"
                onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
                className="inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/8"
              >
                <ArrowLeft className="h-4 w-4" />
                {t["onboarding.back"]}
              </button>
            ) : null}
            <button
              type="button"
              data-testid={isLastStep ? "onboarding-start" : "onboarding-next"}
              disabled={!canProceed}
              onClick={goNext}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-300 px-5 py-2.5 text-sm font-semibold text-slate-950 enabled:hover:bg-teal-200 disabled:opacity-40"
            >
              {isLastStep ? t["onboarding.start"] : t["onboarding.next"]}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
