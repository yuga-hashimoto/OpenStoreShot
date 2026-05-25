import { describe, expect, it } from "vitest";
import { AppStoreAdapter } from "../appstore/appstoreAdapter";
import { createInspirationBrief } from "./analyzeReference";

describe("reference fixtures", () => {
  it("parses fixture references", async () => {
    const [app] = await new AppStoreAdapter().search({ fixture: true });
    expect(app?.screenshotUrls.length).toBeGreaterThan(0);
    expect(createInspirationBrief(app!).inspirationOnly).toBe(true);
  });
});
