import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { NextResponse } from "next/server";

function repoRoot() {
  return resolve(process.env.INIT_CWD ?? process.cwd(), process.env.INIT_CWD ? "." : "../..");
}

function contentType(path: string) {
  const ext = extname(path).toLowerCase();
  return ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "path is required" }, { status: 400 });
  const base = resolve(repoRoot(), "examples/demo-project/exports");
  const resolved = resolve(base, path);
  if (!resolved.startsWith(base)) return NextResponse.json({ error: "invalid path" }, { status: 400 });
  const bytes = await readFile(resolved);
  return new Response(bytes, { headers: { "Content-Type": contentType(path), "Cache-Control": "no-store" } });
}
