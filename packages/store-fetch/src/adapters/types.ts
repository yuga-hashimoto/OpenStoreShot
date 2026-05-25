export type StorePlatform = "ios" | "android";

export type StoreReferenceApp = {
  id: string;
  platform: StorePlatform;
  appName: string;
  developer: string;
  category: string;
  rating?: number;
  iconUrl?: string;
  storeUrl?: string;
  screenshotUrls: string[];
  country: string;
  source: "fixture" | "appstore" | "googleplay";
};

export type ReferenceQuery = {
  country?: string;
  feed?: string;
  category?: string;
  keyword?: string;
  limit?: number;
  fixture?: boolean;
};

export type ReferencePatternBrief = {
  source: "reference-board";
  inspirationOnly: true;
  patterns: {
    composition: string;
    copyLength: string;
    colorMood: string;
    deviceFraming: string;
    slideRole: string;
  };
};

export interface StoreReferenceAdapter {
  search(query: ReferenceQuery): Promise<StoreReferenceApp[]>;
}
