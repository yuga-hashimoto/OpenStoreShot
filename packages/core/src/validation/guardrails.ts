const copyPhrases = [
  "exactly like",
  "identical",
  "copy",
  "clone",
  "完全に同じ",
  "そっくり",
  "丸パクリ",
  "ロゴを真似",
  "キャラクターを真似"
];

const unsupportedClaims = ["No.1", "#1", "Best", "Top", "最高", "一番", "最安"];

export function detectCopyrightRisk(text: string): string[] {
  const normalized = text.toLowerCase();
  const risks: string[] = [];
  for (const phrase of copyPhrases) {
    const needle = phrase.toLowerCase();
    const matched = needle === "copy" ? /\bcopy\b/.test(normalized) : normalized.includes(needle);
    if (matched) {
      risks.push(`Direct-copy language detected: "${phrase}"`);
    }
  }
  return risks;
}

export function detectStoreClaimRisk(text: string): string[] {
  return unsupportedClaims.filter((claim) => text.includes(claim)).map((claim) => `Substantiation needed for claim: ${claim}`);
}
