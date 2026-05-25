export function buildBackgroundPrompt(input: { appName: string; category: string; style: string; tone: string }): string {
  return [
    `Create an original ${input.style} abstract background for a ${input.category} app store screenshot.`,
    `App: ${input.appName}. Tone: ${input.tone}.`,
    "Avoid competitor brand marks, borrowed interface designs, copyrighted characters, and readable brand names.",
    "Leave clean negative space for headline and device mockup."
  ].join(" ");
}
