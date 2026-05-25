import { detectCopyrightRisk } from "@openstoreshot/core";

const banned = ["mickey", "pokemon", "disney", "marvel", "著作権キャラクター"];

export function assertSafeImagePrompt(prompt: string): void {
  const risks = detectCopyrightRisk(prompt);
  const lower = prompt.toLowerCase();
  for (const token of banned) {
    if (lower.includes(token.toLowerCase())) risks.push(`Potential protected brand/character request: ${token}`);
  }
  if (risks.length) {
    throw new Error(`Image generation refused by guardrails: ${risks.join("; ")}`);
  }
}
