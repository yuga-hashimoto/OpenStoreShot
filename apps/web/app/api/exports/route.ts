import { readdir } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";
import { NextResponse } from "next/server";

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
    } else if ([".png", ".jpg", ".jpeg"].includes(extname(entry.name).toLowerCase())) {
      files.push({ path: relative(root, fullPath), name: entry.name });
    }
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export async function GET() {
  const outputDir = resolve(repoRoot(), "examples/demo-project/exports");
  return NextResponse.json({ files: await listOutputs(outputDir) });
}
