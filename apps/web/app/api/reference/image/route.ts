import { NextResponse } from "next/server";

const allowedHosts = new Set(["is1-ssl.mzstatic.com", "is2-ssl.mzstatic.com", "is3-ssl.mzstatic.com", "is4-ssl.mzstatic.com", "is5-ssl.mzstatic.com"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const source = url.searchParams.get("url");
  if (!source) return NextResponse.json({ error: "url is required" }, { status: 400 });

  const parsed = new URL(source);
  if (parsed.protocol !== "https:" || !allowedHosts.has(parsed.hostname)) {
    return NextResponse.json({ error: "unsupported image host" }, { status: 400 });
  }

  const response = await fetch(parsed, { headers: { "User-Agent": "OpenStoreShot/0.1 reference-preview" } });
  if (!response.ok || !response.body) {
    return NextResponse.json({ error: "image fetch failed" }, { status: 502 });
  }

  return new Response(await response.arrayBuffer(), {
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400"
    }
  });
}
