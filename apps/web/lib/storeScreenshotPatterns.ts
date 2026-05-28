export type StoreScreenshotPattern = {
  id: string;
  name: string;
  structure: string;
  useWhen: string;
  requiredSignals: string[];
  layoutRules: string[];
  avoid: string[];
};

export const storeScreenshotPatterns: StoreScreenshotPattern[] = [
  {
    id: "unified-device-series",
    name: "Unified device series",
    structure: "Repeated headline block, same device scale/baseline, shared palette, one feature state per slide.",
    useWhen: "The app value is best proven by realistic app screens.",
    requiredSignals: ["same phone size", "same headline grid", "screen-specific UI details"],
    layoutRules: ["Slide 1 should be the strongest value prop with a large device screen", "Slide 2 should show a cropped app surface or board, not another identical phone", "Slide 3 should use the same grid with a CTA/proof state"],
    avoid: ["three centered phones with only changed copy", "blank device interiors", "unrelated background colors"]
  },
  {
    id: "three-panel-panorama",
    name: "Three-panel panorama",
    structure: "Three consecutive screenshots form one wide visual with continuous bands, background geometry, or object movement across panel boundaries.",
    useWhen: "The store gallery should feel premium or cinematic when users swipe horizontally.",
    requiredSignals: ["shared panorama layer", "left/middle/right continuity", "consistent crop rule"],
    layoutRules: ["Use at least two repeated panorama-* layers across slides 1-3", "The same layer IDs must move left from slide 1 to 2 to 3", "Each panel must still work alone with its own headline and local focal point"],
    avoid: ["three separate backgrounds", "a single thin ribbon pretending to be panorama", "panel seams caused by different fills"]
  },
  {
    id: "card-led-dashboard",
    name: "Card-led dashboard",
    structure: "Large floating cards, charts, status chips, and proof panels are the hero; the phone is secondary or cropped.",
    useWhen: "The app is operational, finance, analytics, AI agent, productivity, or workflow-heavy.",
    requiredSignals: ["large non-phone card system", "metric/proof cards", "same spacing scale"],
    layoutRules: ["Make one large board occupy roughly the middle half of the screenshot", "Use 2-4 major cards with readable numbers/status labels", "Use small device fragments only as supporting context"],
    avoid: ["large empty white board", "many tiny unreadable rows", "phone as the largest object on every slide"]
  },
  {
    id: "object-cutout",
    name: "Object cutout hero",
    structure: "A generated or imported object/mascot/product cutout anchors the slide with editable badges and UI fragments around it.",
    useWhen: "The app benefits from a memorable object, brand character, product artifact, receipt, coupon, file, or media item.",
    requiredSignals: ["large image/object layer", "editable badges", "brand-matched halo or shadow"],
    layoutRules: ["Use one large generatedImageAssets image as the visual anchor", "Add separate editable labels, chips, arrows, or cards on top of/around it", "Keep the object scale consistent as a recurring motif"],
    avoid: ["baking all text into the bitmap", "tiny decorative image with no role", "copied logos, characters, or reference screenshots"]
  },
  {
    id: "editorial-photo",
    name: "Editorial photo background",
    structure: "Full or partial generated bitmap background with restrained typography and foreground UI overlays.",
    useWhen: "Lifestyle, travel, education, health, food, creative, or premium consumer apps need emotional context.",
    requiredSignals: ["image/background layer", "readable overlay", "subtle repeated motif"],
    layoutRules: ["Keep headline on a clean solid/soft overlay area", "Use foreground cards or devices with strong contrast", "Repeat the same photo treatment or crop language across the set"],
    avoid: ["busy photo behind small text", "stock-photo atmosphere unrelated to the app", "different photo styles every slide"]
  },
  {
    id: "feature-infographic",
    name: "Feature infographic",
    structure: "Numbered steps, arrows, badges, and simplified UI cards explain a workflow without relying on a full phone frame.",
    useWhen: "The setup, scan, compare, approve, export, or automation flow matters.",
    requiredSignals: ["numbered steps", "directional rhythm", "large legible labels"],
    layoutRules: ["Use 3 or fewer large steps", "Each step should have an icon-like shape plus a short label", "Use a rail, arrow, or connector that guides the eye across the screenshot"],
    avoid: ["dense manuals", "tiny arrows", "step labels longer than a short phrase"]
  },
  {
    id: "multi-screen-collage",
    name: "Multi-screen collage",
    structure: "Two or three cropped devices or app surfaces overlap with a consistent shadow and shared baseline.",
    useWhen: "The app has multiple modes, before/after states, or cross-device sync.",
    requiredSignals: ["multiple surfaces", "consistent shadows", "clear state labels"],
    layoutRules: ["Use one dominant surface and one or two secondary surfaces", "Label state changes with small but readable chips", "Keep shadows, radii, and scale rules consistent"],
    avoid: ["random phone sizes", "too many overlapping screens", "unclear focal hierarchy"]
  },
  {
    id: "message-conversation",
    name: "Conversation or feed story",
    structure: "Chat bubbles, feed cards, notifications, or timeline snippets create a narrative around the app screen.",
    useWhen: "Social, messaging, AI assistant, support, community, or content apps are referenced.",
    requiredSignals: ["bubble/feed grammar", "same spacing rhythm", "no copied real content"],
    layoutRules: ["Show a sequence: input/post -> response/thread -> action", "Use dense fictional cards that remain readable at thumbnail scale", "For AI, one slide must make the generated output canvas larger than the phone"],
    avoid: ["generic chat bubbles with no output", "real user content", "tiny preview trapped inside the phone"]
  },
  {
    id: "commerce-coupon",
    name: "Commerce coupon board",
    structure: "Coupon tickets, price cards, barcode panels, offer badges, or receipt-like surfaces form a bright retail composition.",
    useWhen: "Shopping, restaurant, loyalty, price comparison, ticketing, or deal apps are referenced.",
    requiredSignals: ["ticket/card motif", "safe non-absolute claims", "high-contrast CTA chip"],
    layoutRules: ["Make ticket/card shapes the hero, not just phone decoration", "Use one large safe number or member/status card", "Use barcode/receipt/point motifs as editable shape layers"],
    avoid: ["unverified No.1 or 最安 claims", "confetti that overwhelms text", "all offers hidden inside a phone"]
  },
  {
    id: "dark-premium",
    name: "Dark premium system",
    structure: "Dark or high-contrast background with luminous cards, terminal/log panels, or neon accents repeated across slides.",
    useWhen: "Developer tools, AI agents, security, pro utilities, finance, or gaming-adjacent apps need depth.",
    requiredSignals: ["consistent dark palette", "glow used sparingly", "legible large text"],
    layoutRules: ["Use black/deep neutral as a stable campaign base", "Use one accent color family for all chips/buttons", "Use luminous cards or feed stacks as the repeated motif"],
    avoid: ["muddy low-contrast text", "rainbow neon", "generic dark phone with empty screen"]
  },
  {
    id: "audio-live-gradient",
    name: "Audio or live event gradient",
    structure: "Neon or cinematic gradient system with album/event cards, waveform bars, live badges, notification stacks, and one dark app surface.",
    useWhen: "Music, live streaming, events, audio, radio, creator, or fan community apps need emotion and motion without copying real media.",
    requiredSignals: ["waveform or rhythm motif", "album/event card grid", "live notification or now-playing surface"],
    layoutRules: ["Use waveform/equalizer layers as the repeated series language", "Include one event/album board outside the phone", "Keep live badges and notification stacks readable"],
    avoid: ["plain gradient without audio objects", "real album art", "tiny waveform decoration only"]
  }
];

export function screenshotPatternPromptBlock(): string {
  return storeScreenshotPatterns
    .map((pattern, index) => [
      `${index + 1}. ${pattern.id} — ${pattern.name}`,
      `   - structure: ${pattern.structure}`,
      `   - use when: ${pattern.useWhen}`,
      `   - required signals: ${pattern.requiredSignals.join(", ")}`,
      `   - layout rules: ${pattern.layoutRules.join("; ")}`,
      `   - avoid: ${pattern.avoid.join("; ")}`
    ].join("\n"))
    .join("\n");
}
