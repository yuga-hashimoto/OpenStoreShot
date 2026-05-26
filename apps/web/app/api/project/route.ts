import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { StoreShotProjectSchema } from "@openstoreshot/core";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const dir = url.searchParams.get("dir");
  if (!dir) {
    return NextResponse.json({ error: "missing_dir" }, { status: 400 });
  }
  let raw: string;
  try {
    raw = await readFile(join(dir, "storeshot.project.json"), "utf8");
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  try {
    const project = StoreShotProjectSchema.parse(JSON.parse(raw));
    return NextResponse.json({ project });
  } catch {
    return NextResponse.json({ error: "invalid_project" }, { status: 422 });
  }
}
