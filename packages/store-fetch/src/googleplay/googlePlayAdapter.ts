import { fixtureReferences } from "../fixtures";
import type { ReferenceQuery, StoreReferenceAdapter, StoreReferenceApp } from "../adapters/types";

export class GooglePlayAdapter implements StoreReferenceAdapter {
  async search(query: ReferenceQuery): Promise<StoreReferenceApp[]> {
    if (query.fixture) {
      return fixtureReferences.filter((app) => app.platform === "android").slice(0, query.limit ?? 20);
    }
    return fixtureReferences.filter((app) => app.platform === "android").map((app) => ({
      ...app,
      source: "fixture",
      developer: `${app.developer} (fixture fallback: live Google Play adapter is replaceable)`
    }));
  }
}
