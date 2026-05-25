import { fixtureReferences } from "../fixtures";
import type { ReferenceQuery, StoreReferenceAdapter, StoreReferenceApp } from "../adapters/types";

export class AppStoreAdapter implements StoreReferenceAdapter {
  async search(query: ReferenceQuery): Promise<StoreReferenceApp[]> {
    if (query.fixture || !globalThis.fetch) {
      return fixtureReferences.filter((app) => app.platform === "ios").slice(0, query.limit ?? 20);
    }
    const country = query.country ?? "us";
    const limit = query.limit ?? 20;

    if (query.feed && !query.keyword) {
      const feed = query.feed.replace(/_/g, "-");
      const response = await fetch(`https://rss.applemarketingtools.com/api/v2/${country}/apps/${feed}/${limit}/apps.json`);
      if (!response.ok) return fixtureReferences.filter((app) => app.platform === "ios");
      const json = (await response.json()) as { feed?: { results?: Array<Record<string, unknown>> } };
      const ids = (json.feed?.results ?? []).map((item) => String(item.id ?? "")).filter(Boolean);
      if (ids.length === 0) return fixtureReferences.filter((app) => app.platform === "ios");
      const lookup = await fetch(`https://itunes.apple.com/lookup?country=${country}&id=${ids.join(",")}`);
      if (!lookup.ok) return fixtureReferences.filter((app) => app.platform === "ios");
      const lookupJson = (await lookup.json()) as { results?: Array<Record<string, unknown>> };
      const pageById = new Map((json.feed?.results ?? []).map((item) => [String(item.id ?? ""), String(item.url ?? "")]));
      const apps = this.mapLookupResults(lookupJson.results ?? [], country);
      return Promise.all(apps.map(async (app) => {
        const pageUrl = pageById.get(app.id);
        const appWithUrl = pageUrl ? { ...app, storeUrl: pageUrl } : app;
        if (appWithUrl.screenshotUrls.length > 0) return appWithUrl;
        const screenshotUrls = pageUrl ? await this.fetchPageScreenshots(pageUrl) : [];
        return { ...appWithUrl, screenshotUrls };
      }));
    }

    const term = encodeURIComponent(query.keyword ?? "productivity");
    const response = await fetch(`https://itunes.apple.com/search?country=${country}&entity=software&term=${term}&limit=${limit}`);
    if (!response.ok) return fixtureReferences.filter((app) => app.platform === "ios");
    const json = (await response.json()) as { results?: Array<Record<string, unknown>> };
    return this.mapLookupResults(json.results ?? [], country);
  }

  private mapLookupResults(items: Array<Record<string, unknown>>, country: string): StoreReferenceApp[] {
    return items.map((item) => {
      const app: StoreReferenceApp = {
        id: String(item.trackId ?? item.bundleId ?? item.trackName),
        platform: "ios",
        appName: String(item.trackName ?? "Unknown app"),
        developer: String(item.artistName ?? "Unknown developer"),
        category: String(item.primaryGenreName ?? "Unknown"),
        screenshotUrls: [
          ...(Array.isArray(item.screenshotUrls) ? item.screenshotUrls.filter((url): url is string => typeof url === "string") : []),
          ...(Array.isArray(item.ipadScreenshotUrls) ? item.ipadScreenshotUrls.filter((url): url is string => typeof url === "string") : [])
        ].slice(0, 6),
        country,
        source: "appstore"
      };
      if (typeof item.averageUserRating === "number") app.rating = item.averageUserRating;
      if (typeof item.artworkUrl100 === "string") app.iconUrl = item.artworkUrl100;
      if (typeof item.trackViewUrl === "string") app.storeUrl = item.trackViewUrl;
      return app;
    });
  }

  private async fetchPageScreenshots(pageUrl: string): Promise<string[]> {
    try {
      const response = await fetch(pageUrl);
      if (!response.ok) return [];
      const html = await response.text();
      const urls = Array.from(html.matchAll(/https:\/\/[^"'\s)]+mzstatic\.com\/[^"'\s)]+/g))
        .map((match) => match[0].replace(/\\u002F/g, "/"))
        .filter((url) => {
          const lower = url.toLowerCase();
          if (lower.includes("appicon") || lower.includes("/features") || lower.includes("1200x630")) return false;
          const isStoreScreenshot =
            lower.includes("iphone") ||
            lower.includes("ipad") ||
            lower.includes("appstore") ||
            /\/(?:\d{3,4})x(?:\d{3,4})bb/.test(lower);
          const isSmallArtwork = /\/(?:48|96|157|200|230|300|314|400|460)x(?:48|96|157|200|230|300|314|400|460|498|650|680|996)bb/.test(lower);
          return isStoreScreenshot && !isSmallArtwork;
        })
        .map((url) => url.replace(/\/(?:\d+x\d+|\{w\}x\{h\})[^/"]*$/i, "/600x1298bb.webp"));
      const bySource = new Map<string, string>();
      for (const url of urls) {
        const sourceKey = url.replace(/\/600x1298bb\.webp$/i, "");
        if (!bySource.has(sourceKey)) bySource.set(sourceKey, url);
      }
      return [...bySource.values()].slice(0, 6);
    } catch {
      return [];
    }
  }
}
