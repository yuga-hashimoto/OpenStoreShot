type Platform = "ios" | "android";

export type StoreTarget = {
  id: string;
  platform: Platform;
  label: string;
  width: number;
  height: number;
  minCount?: number;
  maxCount?: number;
  required?: boolean;
  notes?: string;
};

export const iosTargets: StoreTarget[] = [
  { id: "ios-6-9-portrait", platform: "ios", label: "iPhone 6.9 inch portrait", width: 1290, height: 2796, minCount: 1, maxCount: 10 },
  { id: "ios-6-5-portrait", platform: "ios", label: "iPhone 6.5 inch portrait", width: 1242, height: 2688, minCount: 1, maxCount: 10 },
  { id: "ios-ipad-portrait", platform: "ios", label: "iPad portrait", width: 2048, height: 2732, minCount: 1, maxCount: 10 }
];

export const androidTargets: StoreTarget[] = [
  { id: "play-phone-portrait", platform: "android", label: "Google Play phone portrait", width: 1080, height: 1920, minCount: 2, maxCount: 8 },
  { id: "play-7-tablet-portrait", platform: "android", label: "Google Play 7 inch tablet", width: 1200, height: 1920, minCount: 1, maxCount: 8 },
  { id: "play-10-tablet-portrait", platform: "android", label: "Google Play 10 inch tablet", width: 1600, height: 2560, minCount: 1, maxCount: 8 },
  { id: "play-feature-graphic", platform: "android", label: "Google Play feature graphic", width: 1024, height: 500, required: true }
];

export const allTargets = [...iosTargets, ...androidTargets];
