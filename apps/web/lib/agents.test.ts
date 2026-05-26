import { describe, expect, it } from "vitest";
import { agentDefs, agentNameById, buildAgentInvocation, MANUAL_AGENT_ID } from "./agents";

describe("agent registry", () => {
  it("ships the supported local coding agents with unique ids", () => {
    const ids = agentDefs.map((agent) => agent.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("codex");
    expect(ids).toContain("claude");
    expect(ids).toContain("gemini");
  });

  it("marks exactly one agent as recommended", () => {
    expect(agentDefs.filter((agent) => agent.recommended)).toHaveLength(1);
  });

  it("resolves agent display names by id", () => {
    expect(agentNameById("claude")).toBe("Claude Code");
    expect(agentNameById(MANUAL_AGENT_ID)).toBeNull();
    expect(agentNameById(null)).toBeNull();
    expect(agentNameById("not-an-agent")).toBeNull();
  });

  it("builds non-interactive invocations for known agents", () => {
    const claude = buildAgentInvocation("claude", "PROMPT");
    expect(claude).toEqual({ bin: "claude", args: ["-p", "--dangerously-skip-permissions"], input: "PROMPT" });

    const agy = buildAgentInvocation("antigravity", "PROMPT");
    expect(agy?.bin).toBe("agy");
    expect(agy?.input).toBe("PROMPT");

    const codex = buildAgentInvocation("codex", "PROMPT");
    expect(codex?.args).toContain("exec");

    const gemini = buildAgentInvocation("gemini", "PROMPT");
    expect(gemini?.args).toContain("PROMPT");
    expect(gemini?.input).toBeUndefined();
  });

  it("returns null for manual and unknown agents", () => {
    expect(buildAgentInvocation(MANUAL_AGENT_ID, "x")).toBeNull();
    expect(buildAgentInvocation("nope", "x")).toBeNull();
  });
});
