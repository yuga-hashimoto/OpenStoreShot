import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { agentDefs, type AgentStatus } from "../../../lib/agents";

const run = promisify(execFile);

async function probeVersion(bin: string): Promise<string | null> {
  try {
    const { stdout } = await run(bin, ["--version"], { timeout: 4000 });
    return stdout.trim().split("\n")[0] ?? "";
  } catch {
    return null;
  }
}

export async function GET(): Promise<Response> {
  const agents: AgentStatus[] = await Promise.all(
    agentDefs.map(async (def) => {
      const version = await probeVersion(def.bin);
      return { ...def, available: version !== null, version };
    })
  );
  return NextResponse.json({ agents });
}
