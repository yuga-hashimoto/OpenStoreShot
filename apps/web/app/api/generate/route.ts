import { spawn } from "node:child_process";
import { access, readFile, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { StoreShotProjectSchema, validateProject } from "@openstoreshot/core";
import { buildAgentInvocation, type AgentInvocation } from "../../../lib/agents";
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
        appName: z.string(),
        category: z.string(),
        rating: z.number().optional(),
        screenshotUrls: z.array(z.string()).default([])
      })
    )
    .default([])
});

const GENERATION_TIMEOUT_MS = 600_000;

function runAgent(invocation: AgentInvocation, cwd: string): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(invocation.bin, invocation.args, { cwd });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), GENERATION_TIMEOUT_MS);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ code: null, stdout, stderr: `${stderr}${String(error)}` });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
    if (invocation.input) child.stdin.write(invocation.input);
    child.stdin.end();
  });
}

function tail(text: string, max = 4000): string {
  return text.length > max ? text.slice(-max) : text;
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
    brief: parsed.brief
  });
  const invocation = buildAgentInvocation(parsed.agentId, prompt);
  if (!invocation) {
    return NextResponse.json({ error: "manual_agent", prompt }, { status: 400 });
  }

  const result = await runAgent(invocation, parsed.projectDir);
  const projectPath = join(parsed.projectDir, "storeshot.project.json");
  const wrote = await access(projectPath, constants.F_OK).then(
    () => true,
    () => false
  );

  let issues: Array<{ severity: "error" | "warning"; message: string }> = [];
  let parseError: string | undefined;
  if (wrote) {
    try {
      const raw = await readFile(projectPath, "utf8");
      const project = StoreShotProjectSchema.parse(JSON.parse(raw));
      issues = validateProject(project).map((issue) => ({
        severity: issue.severity,
        message: issue.message
      }));
    } catch (error) {
      parseError = error instanceof Error ? error.message : String(error);
    }
  }
  const errorCount = issues.filter((issue) => issue.severity === "error").length;

  return NextResponse.json({
    ok: result.code === 0 && wrote && !parseError && errorCount === 0,
    wrote,
    exitCode: result.code,
    issues,
    parseError,
    stdout: tail(result.stdout),
    stderr: tail(result.stderr)
  });
}
