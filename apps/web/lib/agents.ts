export interface AgentDef {
  id: string;
  name: string;
  bin: string;
  recommended?: boolean;
  supportsDesignGeneration?: boolean;
}

export const agentDefs: AgentDef[] = [
  { id: "codex", name: "Codex CLI", bin: "codex", recommended: true, supportsDesignGeneration: true },
  { id: "claude", name: "Claude Code", bin: "claude" },
  { id: "antigravity", name: "Antigravity CLI", bin: "agy", supportsDesignGeneration: true },
  { id: "gemini", name: "Gemini CLI", bin: "gemini" },
  { id: "opencode", name: "OpenCode", bin: "opencode" },
  { id: "cursor-agent", name: "Cursor Agent", bin: "cursor-agent" },
  { id: "qwen", name: "Qwen Code", bin: "qwen" },
  { id: "qodercli", name: "Qoder CLI", bin: "qodercli" },
  { id: "copilot", name: "GitHub Copilot CLI", bin: "copilot" }
];

export interface AgentStatus extends AgentDef {
  available: boolean;
  version: string | null;
}

export const MANUAL_AGENT_ID = "manual";

export function agentNameById(id: string | null | undefined): string | null {
  if (!id || id === MANUAL_AGENT_ID) return null;
  return agentDefs.find((agent) => agent.id === id)?.name ?? null;
}

export interface AgentInvocation {
  bin: string;
  args: string[];
  /** When set, the prompt is delivered via stdin instead of an argv entry. */
  input?: string;
  outputFile?: string;
}

/**
 * Non-interactive ("headless") invocation that auto-approves file edits so the
 * agent can write storeshot.project.json without prompting. Returns null for
 * manual mode or unknown agents.
 */
export function buildAgentInvocation(agentId: string, prompt: string, options?: { jsonResponse?: boolean }): AgentInvocation | null {
  const codexOutputFile = ".storeshot-agent-output.txt";
  switch (agentId) {
    case "claude":
      return { bin: "claude", args: ["-p", "--dangerously-skip-permissions"], input: prompt };
    case "antigravity":
      return { bin: "agy", args: ["-p", "--dangerously-skip-permissions"], input: prompt };
    case "codex":
      return {
        bin: "codex",
        args: [
          "exec",
          "--dangerously-bypass-approvals-and-sandbox",
          "--skip-git-repo-check",
          "--ignore-user-config",
          "--ignore-rules",
          "--ephemeral",
          ...(options?.jsonResponse ? ["--output-last-message", codexOutputFile] : []),
          "-"
        ],
        input: prompt,
        ...(options?.jsonResponse ? { outputFile: codexOutputFile } : {})
      };
    case "gemini":
      return { bin: "gemini", args: ["--yolo", "-p", prompt] };
    case "qwen":
      return { bin: "qwen", args: ["--yolo", "-p", prompt] };
    case "opencode":
      return { bin: "opencode", args: ["run", prompt] };
    case "cursor-agent":
      return { bin: "cursor-agent", args: ["-p", prompt] };
    case "copilot":
      return { bin: "copilot", args: ["-p", prompt] };
    case "qodercli":
      return { bin: "qodercli", args: ["-p", prompt] };
    default:
      return null;
  }
}
