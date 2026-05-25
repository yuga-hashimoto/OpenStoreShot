import type { StoreReferenceApp } from "./adapters/types";

export const fixtureReferences: StoreReferenceApp[] = [
  {
    id: "fixture-ios-focus",
    platform: "ios",
    appName: "Focus Garden",
    developer: "Fictional Labs",
    category: "Productivity",
    rating: 4.8,
    country: "jp",
    source: "fixture",
    storeUrl: "https://apps.apple.com/",
    iconUrl: "/fixtures/focus-icon.svg",
    screenshotUrls: ["/fixtures/ref-ios-1.svg", "/fixtures/ref-ios-2.svg", "/fixtures/ref-ios-3.svg"]
  },
  {
    id: "fixture-play-budget",
    platform: "android",
    appName: "Budget Trail",
    developer: "Example Studio",
    category: "Finance",
    rating: 4.6,
    country: "jp",
    source: "fixture",
    storeUrl: "https://play.google.com/store/apps",
    iconUrl: "/fixtures/budget-icon.svg",
    screenshotUrls: ["/fixtures/ref-play-1.svg", "/fixtures/ref-play-2.svg", "/fixtures/ref-play-3.svg"]
  }
];
