"use client";

import { CheckCircle2 } from "lucide-react";
import type { messagesFor } from "../../lib/i18n";
import { MANUAL_AGENT_ID, type AgentStatus } from "../../lib/agents";

type StudioMessages = ReturnType<typeof messagesFor>;

interface AgentStepProps {
  t: StudioMessages;
  agents: AgentStatus[] | null;
  selectedAgentId: string;
  onSelect: (agentId: string) => void;
}

export function AgentStep({ t, agents, selectedAgentId, onSelect }: AgentStepProps) {
  const agentOptions: Array<{ id: string; name: string; available: boolean; version: string | null; recommended?: boolean }> = [
    ...((agents ?? []).filter((agent) => agent.supportsDesignGeneration)),
    { id: MANUAL_AGENT_ID, name: t["onboarding.agentManual"], available: true, version: null }
  ];

  return (
    <section>
      <div className="mb-1 text-sm font-semibold text-white">{t["onboarding.agentTitle"]}</div>
      <p className="mb-3 text-xs leading-5 text-slate-400">{t["onboarding.agentNote"]}</p>
      <p className="mb-3 rounded-md border border-teal-300/20 bg-teal-300/[0.06] px-3 py-2 text-xs leading-5 text-teal-100">
        {t["onboarding.agentDesignOnly"]}
      </p>
      {agents === null ? (
        <div className="py-3 text-xs text-slate-500">{t["onboarding.agentDetecting"]}</div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2" data-testid="onboarding-agents">
          {agentOptions.map((agent) => {
            const selected = agent.id === selectedAgentId;
            const selectable = agent.available;
            return (
              <button
                key={agent.id}
                type="button"
                disabled={!selectable}
                data-testid={`onboarding-agent-${agent.id}`}
                aria-pressed={selected}
                onClick={() => selectable && onSelect(agent.id)}
                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left transition ${
                  selected
                    ? "border-teal-300/60 bg-teal-300/10"
                    : selectable
                      ? "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                      : "cursor-not-allowed border-white/5 bg-white/[0.02] opacity-50"
                }`}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                    {agent.name}
                    {agent.recommended ? (
                      <span className="rounded bg-teal-300/15 px-1.5 py-0.5 text-[10px] font-semibold text-teal-200">
                        {t["onboarding.agentRecommended"]}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                    {agent.id === MANUAL_AGENT_ID
                      ? ""
                      : agent.available
                        ? agent.version || t["onboarding.agentAvailable"]
                        : t["onboarding.agentMissing"]}
                  </span>
                </span>
                {selected ? <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-300" /> : null}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
