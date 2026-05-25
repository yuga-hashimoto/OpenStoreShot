import { NextResponse } from "next/server";
import { assertSafeImagePrompt } from "@openstoreshot/imagegen/guardrails";

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as { prompt?: string; size?: "1024x1024" | "1024x500" };
  const prompt = body.prompt ?? "Codexで作成した背景案をプレビューする";
  assertSafeImagePrompt(prompt);
  const [width, height] = (body.size ?? "1024x1024").split("x").map(Number);
  return NextResponse.json({
    image: {
      id: `codex-preview-${Date.now()}`,
      path: "/codex-preview-placeholder",
      width,
      height,
      provider: "codex-local-preview",
      model: "local-placeholder-v1",
      prompt,
      createdAt: new Date().toISOString(),
      metadata: { requestedFrom: "web-route", apiKeyRequired: false }
    },
    mock: true,
    message: "OpenStoreShot本体はAPIキーを使いません。Codexで作った案をローカルで確認するためのプレビューです。"
  });
}
