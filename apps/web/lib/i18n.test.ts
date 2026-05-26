import { describe, expect, it } from "vitest";
import { localeLabels, locales, messagesFor, resolveBrowserLocale } from "./i18n";

describe("web i18n", () => {
  it("registers the major launch locales", () => {
    expect(locales).toEqual([
      "ja-JP",
      "en",
      "zh-CN",
      "zh-TW",
      "ko",
      "es",
      "fr",
      "de",
      "pt-BR",
      "it",
      "ru",
      "id",
      "hi"
    ]);
    expect(locales).toHaveLength(13);
    expect(localeLabels["ja-JP"]).toBe("日本語");
    expect(localeLabels.en).toBe("English");
    expect(localeLabels["zh-CN"]).toBe("简体中文");
    expect(localeLabels.ko).toBe("한국어");
    expect(localeLabels.hi).toBe("हिन्दी");
  });

  it("falls back to Japanese for untranslated secondary strings", () => {
    expect(messagesFor("en")["top.export"]).toBe("Export");
    expect(messagesFor("fr")["templates.description"]).toBe("1枚完結だけでなく、複数枚で世界観を作るストア画像も作れます。");
  });

  it("translates onboarding strings into every locale (no Japanese fallback)", () => {
    const onboardingKeys = [
      "onboarding.title",
      "onboarding.subtitle",
      "onboarding.setupTitle",
      "onboarding.setupNote",
      "onboarding.workflowTitle",
      "onboarding.agentTitle",
      "onboarding.agentNote",
      "onboarding.agentDetecting",
      "onboarding.agentManual",
      "onboarding.agentRecommended",
      "onboarding.agentAvailable",
      "onboarding.agentMissing",
      "onboarding.step1",
      "onboarding.step2",
      "onboarding.step3",
      "onboarding.step4",
      "onboarding.step5",
      "onboarding.step6",
      "onboarding.dontShowAgain",
      "onboarding.start"
    ] as const;
    const ja = messagesFor("ja-JP");
    for (const locale of locales) {
      const messages = messagesFor(locale);
      for (const key of onboardingKeys) {
        expect(messages[key], `${locale} / ${key}`).toBeTruthy();
        if (locale !== "ja-JP") {
          expect(messages[key], `${locale} / ${key} should not fall back to Japanese`).not.toBe(ja[key]);
        }
      }
    }
  });

  it("resolves the studio locale from browser language tags", () => {
    expect(resolveBrowserLocale("ja")).toBe("ja-JP");
    expect(resolveBrowserLocale("en-US")).toBe("en");
    expect(resolveBrowserLocale("zh-CN")).toBe("zh-CN");
    expect(resolveBrowserLocale("zh-Hant-TW")).toBe("zh-TW");
    expect(resolveBrowserLocale("pt-PT")).toBe("pt-BR");
    expect(resolveBrowserLocale("ko-KR")).toBe("ko");
    expect(resolveBrowserLocale("xx")).toBe("ja-JP");
    expect(resolveBrowserLocale(undefined)).toBe("ja-JP");
  });
});
