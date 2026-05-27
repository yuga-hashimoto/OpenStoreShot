"use client";

import { ChangeEvent } from "react";
import type { messagesFor } from "../../lib/i18n";
import { locales, type Locale, localeLabels } from "../../lib/i18n";

type StudioMessages = ReturnType<typeof messagesFor>;

export interface BriefState {
  appName: string;
  intent: string;
  slideCount: number;
  platforms: ("ios" | "android")[];
  locale: Locale;
}

interface BriefStepProps {
  t: StudioMessages;
  value: BriefState;
  onChange: (next: BriefState) => void;
}

const SLIDE_COUNT_OPTIONS = [3, 5, 7, 10];

export function BriefStep({ t, value, onChange }: BriefStepProps) {
  function patch<K extends keyof BriefState>(key: K, next: BriefState[K]) {
    onChange({ ...value, [key]: next });
  }

  function togglePlatform(platform: "ios" | "android") {
    const enabled = value.platforms.includes(platform);
    const next = enabled
      ? value.platforms.filter((item) => item !== platform)
      : [...value.platforms, platform];
    // Always keep at least one platform selected.
    if (next.length === 0) return;
    patch("platforms", next);
  }

  return (
    <section className="space-y-4">
      <div>
        <div className="mb-1 text-sm font-semibold text-white">{t["onboarding.briefTitle"]}</div>
        <p className="text-xs leading-5 text-slate-400">{t["onboarding.briefNote"]}</p>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-300">{t["onboarding.briefIntent"]}</span>
        <textarea
          data-testid="brief-intent"
          value={value.intent}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => patch("intent", event.target.value)}
          placeholder={t["onboarding.briefIntentPlaceholder"]}
          rows={5}
          className="w-full rounded-md border border-white/10 bg-black/20 p-2.5 text-sm leading-5 text-white outline-none focus:border-teal-300/70"
        />
        <span className="mt-1 block text-[11px] text-slate-500">{t["onboarding.briefIntentHint"]}</span>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-300">{t["onboarding.briefAppName"]}</span>
        <input
          data-testid="brief-app-name"
          value={value.appName}
          onChange={(event) => patch("appName", event.target.value)}
          placeholder={t["onboarding.briefAppNamePlaceholder"]}
          className="w-full rounded-md border border-white/10 bg-black/20 px-2.5 py-2 text-sm text-white outline-none focus:border-teal-300/70"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-300">{t["onboarding.briefSlideCount"]}</span>
          <select
            data-testid="brief-slide-count"
            value={value.slideCount}
            onChange={(event) => patch("slideCount", Number(event.target.value))}
            className="w-full rounded-md border border-white/10 bg-black/20 px-2.5 py-2 text-sm text-white outline-none focus:border-teal-300/70"
          >
            {SLIDE_COUNT_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>

        <div className="block">
          <span className="mb-1 block text-xs font-medium text-slate-300">{t["onboarding.briefPlatforms"]}</span>
          <div className="flex gap-2" data-testid="brief-platforms">
            {(["ios", "android"] as const).map((platform) => {
              const enabled = value.platforms.includes(platform);
              return (
                <button
                  key={platform}
                  type="button"
                  data-testid={`brief-platform-${platform}`}
                  aria-pressed={enabled}
                  onClick={() => togglePlatform(platform)}
                  className={`flex-1 rounded-md border px-2.5 py-2 text-xs font-medium ${enabled ? "border-teal-300/60 bg-teal-300/10 text-teal-100" : "border-white/10 text-slate-300 hover:bg-white/8"}`}
                >
                  {platform === "ios" ? "iOS" : "Android"}
                </button>
              );
            })}
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-300">{t["onboarding.briefLocale"]}</span>
          <select
            data-testid="brief-locale"
            value={value.locale}
            onChange={(event) => patch("locale", event.target.value as Locale)}
            className="w-full rounded-md border border-white/10 bg-black/20 px-2.5 py-2 text-sm text-white outline-none focus:border-teal-300/70"
          >
            {locales.map((locale) => (
              <option key={locale} value={locale}>
                {localeLabels[locale]}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
