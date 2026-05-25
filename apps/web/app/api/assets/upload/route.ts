import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";
import { NextResponse } from "next/server";

function repoRoot() {
  return resolve(process.env.INIT_CWD ?? process.cwd(), process.env.INIT_CWD ? "." : "../..");
}

function safeName(name: string) {
  const ext = extname(name).toLowerCase();
  const stem = basename(name, ext).replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "screenshot";
  return `${Date.now()}-${stem}${ext || ".png"}`;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "image files only" }, { status: 400 });
  }

  const filename = safeName(file.name);
  const relativePath = `assets/uploads/${filename}`;
  const outputPath = resolve(repoRoot(), "examples/demo-project", relativePath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({
    asset: {
      id: `screenshot-${Date.now()}`,
      type: "screenshot",
      path: relativePath,
      alt: file.name
    }
  });
}
