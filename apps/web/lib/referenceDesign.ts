import type { StoreReferenceApp } from "@openstoreshot/store-fetch";

export type ReferenceDesignPatterns = {
  recommendedPattern: string;
  composition: string;
  copyLength: string;
  colorMood: string;
  deviceFraming: string;
  slideRole: string;
  seriesSystem: string;
  creativeRange: string;
  heroMotif: string;
  appSurfaceDetails: string;
  benchmarkSignals: string;
};

export function referenceDesignPatterns(app: Pick<StoreReferenceApp, "appName" | "developer" | "platform" | "category" | "rating" | "screenshotUrls">): ReferenceDesignPatterns {
  const category = app.category.toLowerCase();
  const appName = app.appName.toLowerCase();
  const developer = (app.developer ?? "").toLowerCase();
  const nameText = `${appName} ${developer}`;
  const screenshotCount = app.screenshotUrls.length;
  const highRated = (app.rating ?? 0) >= 4.5;
  const isAi = /\bai\b|chatgpt|gemini|claude|anthropic|assistant|生成|会話|チャット/.test(nameText);
  const isBrowser = /chrome|browser|ブラウザ|検索/.test(nameText);
  const isOfficial = /myna|マイナ|portal|ポータル|行政|official|government/.test(nameText);
  const isVending = /ジハンピ|vending|自販機|drink|ドリンク/.test(nameText);
  const isAudioLive = category.includes("music") || /livesoul|live|music|audio|radio|concert|音楽|ライブ|配信/.test(nameText);
  const isCoupon = /31club|サーティワン|coupon|クーポン|loyalty|ポイント/.test(nameText) || category.includes("food") || category.includes("drink");
  const isThreadsLike = /threads/.test(nameText);
  const isSocial = category.includes("social") || /threads|setlog|sns|social|feed|動画|写真/.test(nameText);

  const recommendedPattern = isThreadsLike
    ? "dark-premium + message-conversation"
    : isSocial
    ? "three-panel-panorama + multi-screen-collage"
    : isAi
      ? "message-conversation + object-cutout"
      : isBrowser
        ? "feature-infographic + unified-device-series"
        : isAudioLive
          ? "audio-live-gradient + message-conversation"
          : isCoupon
            ? "commerce-coupon + object-cutout"
            : isVending
              ? "feature-infographic + object-cutout"
              : isOfficial
                ? "card-led-dashboard + feature-infographic"
                : category.includes("finance")
                  ? "card-led-dashboard + feature-infographic"
                  : category.includes("photo") || category.includes("graphics") || category.includes("design")
                    ? "editorial-photo + object-cutout"
                    : "unified-device-series + card-led-dashboard";

  const composition = isThreadsLike
    ? "dark feed composition with stacked post cards, conversation snippets, profile chips, and strong black/white contrast; not every social reference needs panorama"
    : isSocial
    ? "three consecutive slides can connect as one wide social/photo collage; keep repeated panorama layers and sticker/photo-card rhythm"
    : isAi
      ? "AI conversation composition with chat input, answer cards, generated preview, summary/output panel, and one large visual asset"
      : isBrowser
        ? "browser feature composition with search bar, search result, image/lens preview, shortcut tiles, tabs, and saved-password/security card"
        : isAudioLive
          ? "dark live/audio composition with neon gradient, waveform bars, album/event card grid, now-playing surface, live badge, and notification stack"
          : isCoupon
            ? "bright coupon campaign composition with ticket surfaces, large readable discount/points numbers, barcode/member card, and confetti accents"
            : isVending
              ? "numbered workflow composition with vending/product board, drink choice chips, 3STEP panels, and a bold time/quantity metric"
              : isOfficial
                ? "official procedure composition with ID card, QR/login panel, timeline, status cards, and calm blue CTA hierarchy"
                : category.includes("finance")
                  ? "finance dashboard composition with large balance/metric number, graph, transaction rows, trust badges, and restrained green/blue palette"
                  : category.includes("productivity") || category.includes("utilities")
                    ? "screenshot-led composition with one large app surface, compact headline, and clear before/after or workflow context"
                    : category.includes("health") || category.includes("fitness")
                      ? "benefit-first composition with spacious copy, soft hierarchy, and progress or habit UI details"
                      : category.includes("photo") || category.includes("graphics") || category.includes("design")
                        ? "visual-output-led composition with a large preview, editing controls, and minimal explanatory copy"
                        : app.platform === "ios"
                          ? "polished App Store composition with generous top headline and a detailed centered app screen"
                          : "Google Play composition with a strong benefit headline and feature detail visible inside the device";

  const colorMood = category.includes("finance")
    ? "calm high-contrast neutrals with one blue or green trust accent"
    : category.includes("health") || category.includes("fitness")
      ? "fresh light background with green, teal, or warm progress accents"
      : category.includes("photo") || category.includes("graphics") || category.includes("design")
        ? "clean creative palette with high contrast controls and one vivid accent"
        : highRated
          ? "premium light palette with controlled contrast and one confident accent"
          : "bright but readable palette, avoiding generic purple-only gradients";

  return {
    recommendedPattern,
    composition,
    copyLength: "short, specific headline; supporting copy should be one concise sentence or omitted when the UI already explains the benefit",
    colorMood,
    deviceFraming: screenshotCount >= 4
      ? "keep the main device scale consistent across the set; vary only intentional crops, edge alignment, overlap, or rotation"
      : "single primary device scale is allowed, but its screen must contain credible fictional UI details",
    slideRole: screenshotCount >= 5
      ? "sequence should feel like a connected store narrative: benefit, feature, workflow, proof, call to action"
      : "each slide needs a distinct role; do not repeat the same headline/device layout",
    seriesSystem: "use one shared brand palette and background system across all slides; vary tint, band, crop, or accent position, not unrelated colors",
    creativeRange: category.includes("photo") || category.includes("graphics") || category.includes("design")
      ? "include at least one visual-output or generated-image composition where the creative result is the hero, not only a phone frame"
      : category.includes("social") || category.includes("food") || category.includes("drink")
        ? "allow collage, sticker-like badges, object cutouts, or card stacks while keeping the app's own fictional UI original"
        : "include one composition that uses floating UI cards, a product object, infographic, or generated visual asset so the set is not only headline plus phone",
    heroMotif: isThreadsLike
      ? "dark feed stack, conversation cards, profile chips, reply badges, and a restrained high-contrast accent"
      : isSocial
      ? "continuous photo/video collage with sticker chips and a phone crossing the wide visual"
      : isAi
        ? "chat thread plus generated image/output card; the output must be the visible hero on at least one slide"
        : isBrowser
          ? "search bar and result cards with lens/search/sync/security tiles"
          : isAudioLive
            ? "neon live stage or album card, waveform bars, now-playing surface, live badge, and notification stack"
            : isCoupon
              ? "coupon ticket, barcode/member card, points or discount number, and bright retail confetti"
              : isVending
                ? "vending machine/product board, drink chips, bold quantity/time numbers, and 3-step flow"
                : isOfficial
                  ? "ID card, QR/login panel, official procedure cards, timeline, and blue CTA"
                  : category.includes("finance")
                    ? "large balance number, graph, transaction list, and trust/proof cards"
                    : "large app-surface fragment or generated visual that is specific to the app",
    appSurfaceDetails: isThreadsLike
      ? "inside or around the device show fictional post cards, reply rows, profile chips, notification badges, and topic threads"
      : isAi
      ? "inside the device show prompt input, answer bubbles, generated preview, summary card, composer, and action button"
      : isBrowser
        ? "inside the device show search pill, result card, image thumbnail, shortcuts, article rows, and bottom tabs"
        : isAudioLive
          ? "inside or around the device show now-playing card, playlist tiles, waveform/equalizer, live chat or notification rows, and join/listen CTA"
          : isCoupon
            ? "inside or around the device show coupon list, member barcode, point balance, ticket cards, and redemption CTA"
            : isOfficial
              ? "inside or around the device show account/status list, QR/login, procedure steps, notification card, and CTA"
              : category.includes("finance")
                ? "inside or around the device show balance card, graph, transaction rows, transfer/status chips, and update badge"
                : isVending
                  ? "inside or around the device show product grid, payment step, pickup state, time metric, and CTA"
                  : "inside the device show app-specific cards, tabs, controls, preview panels, and lower-half content",
    benchmarkSignals: "match the quality bar from the App Store top-10 benchmark: strong first-glance silhouette, repeated series system, reference-specific hero motif, dense fictional app UI, and at least one non-phone-led slide"
  };
}

export function referenceHintLines(app: StoreReferenceApp): string[] {
  const patterns = referenceDesignPatterns(app);
  const screenshotCount = app.screenshotUrls.length;
  return [
    `推奨パターン: ${patterns.recommendedPattern}`,
    `構成: ${patterns.composition}`,
    `文字量: ${patterns.copyLength}`,
    `色: ${patterns.colorMood}`,
    `端末: ${patterns.deviceFraming}`,
    `流れ: ${patterns.slideRole}`,
    `シリーズ感: ${patterns.seriesSystem}`,
    `表現幅: ${patterns.creativeRange}`,
    `主役モチーフ: ${patterns.heroMotif}`,
    `アプリ画面詳細: ${patterns.appSurfaceDetails}`,
    `品質基準: ${patterns.benchmarkSignals}`,
    screenshotCount >= 5
      ? `枚数設計: ${screenshotCount}枚あるため、連続ストーリーとして役割を分ける。`
      : "枚数設計: 少ない枚数でも、1枚ごとの役割を明確にする。"
  ];
}
