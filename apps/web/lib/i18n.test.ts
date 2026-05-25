import { describe, expect, it } from "vitest";
import { localeLabels, locales, messagesFor } from "./i18n";

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
});
