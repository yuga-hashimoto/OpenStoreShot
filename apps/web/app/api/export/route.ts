import { execFile } from "node:child_process";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { extname, join, relative, resolve } from "node:path";
import { NextResponse } from "next/server";
import { StoreShotProjectSchema } from "@openstoreshot/core";

const execFileAsync = promisify(execFile);

function repoRoot() {
  return resolve(process.env.INIT_CWD ?? process.cwd(), process.env.INIT_CWD ? "." : "../..");
}

async function listOutputs(dir: string, root = dir): Promise<Array<{ path: string; name: string }>> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files: Array<{ path: string; name: string }> = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listOutputs(fullPath, root));
      continue;
    }
    if ([".png", ".jpg", ".jpeg"].includes(extname(entry.name).toLowerCase())) {
      files.push({ path: relative(root, fullPath), name: entry.name });
    }
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export async function POST(request: Request) {
  const body = await request.json();
  const project = StoreShotProjectSchema.parse(body.project);
  const root = repoRoot();
  const runtimeDir = resolve(root, ".storeshot");
  const projectPath = resolve(runtimeDir, "runtime-project.json");
  const outputDir = resolve(root, "examples/demo-project/exports");
  await mkdir(runtimeDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });
  await writeFile(projectPath, JSON.stringify(project, null, 2), "utf8");

  const args = ["--filter", "@openstoreshot/cli", "storeshot", "render", projectPath, "-o", outputDir];
  const { stdout, stderr } = await execFileAsync("pnpm", args, { cwd: root, timeout: 120_000, maxBuffer: 1024 * 1024 * 4 });
  const files = await listOutputs(outputDir);
  return NextResponse.json({ ok: true, stdout, stderr, files });
}
