import { mkdir, appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";

const CodexRequestSchema = z.object({
  projectId: z.string(),
  projectName: z.string(),
  slideId: z.string(),
  slideTitle: z.string(),
  artboardId: z.string(),
  selectedLayerId: z.string().optional(),
  selectedLayerName: z.string().optional(),
  instruction: z.string().min(1),
  context: z.string().optional()
});

export async function POST(request: Request): Promise<Response> {
  const parsed = CodexRequestSchema.parse(await request.json());
  const entry = {
    id: `codex-request-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "queued",
    source: "openstoreshot-studio",
    ...parsed
  };
  const dir = resolve(process.cwd(), "../../.storeshot");
  await mkdir(dir, { recursive: true });
  await appendFile(resolve(dir, "codex-requests.jsonl"), `${JSON.stringify(entry)}\n`, "utf8");
  return NextResponse.json({ ok: true, request: entry });
}
