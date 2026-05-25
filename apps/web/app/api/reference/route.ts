import { NextResponse } from "next/server";
import { AppStoreAdapter, GooglePlayAdapter } from "@openstoreshot/store-fetch";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const platform = url.searchParams.get("platform") ?? "ios";
  const adapter = platform === "android" ? new GooglePlayAdapter() : new AppStoreAdapter();
  const feed = url.searchParams.get("feed");
  const category = url.searchParams.get("category");
  const keyword = url.searchParams.get("keyword");
  const data = await adapter.search({
    fixture: url.searchParams.get("fixture") !== "false",
    country: url.searchParams.get("country") ?? "jp",
    ...(feed ? { feed } : {}),
    ...(category ? { category } : {}),
    ...(keyword ? { keyword } : {}),
    limit: Number(url.searchParams.get("limit") ?? 20)
  });
  return NextResponse.json({ data });
}
