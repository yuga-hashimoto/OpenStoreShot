"use client";

import { CheckCircle2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { StoreReferenceApp } from "@openstoreshot/store-fetch";
import { fixtureReferences } from "@openstoreshot/store-fetch";
import type { messagesFor } from "../../lib/i18n";

type StudioMessages = ReturnType<typeof messagesFor>;

interface ReferenceStepProps {
  t: StudioMessages;
  selected: StoreReferenceApp[];
  onToggle: (app: StoreReferenceApp) => void;
}

function referenceImageUrl(url: string) {
  return `/api/reference/image?url=${encodeURIComponent(url)}`;
}

export function ReferenceStep({ t, selected, onToggle }: ReferenceStepProps) {
  const [apps, setApps] = useState<StoreReferenceApp[]>(fixtureReferences);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [platform, setPlatform] = useState<"ios" | "android">("ios");
  const [keyword, setKeyword] = useState("");

  async function load(next?: { platform?: "ios" | "android"; keyword?: string }) {
    const nextPlatform = next?.platform ?? platform;
    const nextKeyword = next?.keyword ?? keyword;
    setStatus("loading");
    setPlatform(nextPlatform);
    try {
      const params = new URLSearchParams({ platform: nextPlatform, country: "jp", limit: "12", fixture: "false" });
      if (nextKeyword.trim()) params.set("keyword", nextKeyword.trim());
      else params.set("feed", "top-free");
      const response = await fetch(`/api/reference?${params.toString()}`);
      if (!response.ok) throw new Error("reference fetch failed");
      const json = (await response.json()) as { data: StoreReferenceApp[] };
      setApps(json.data.length > 0 ? json.data : fixtureReferences);
      setStatus("ready");
    } catch {
      setApps(fixtureReferences);
      setStatus("error");
    }
  }

  useEffect(() => {
    void load({ platform: "ios" });
  }, []);

  const selectedIds = new Set(selected.map((app) => app.id));

  return (
    <section>
      <div className="mb-1 text-sm font-semibold text-white">{t["onboarding.referencesTitle"]}</div>
      <p className="mb-3 text-xs leading-5 text-slate-400">{t["onboarding.referencesNote"]}</p>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-white/10 bg-black/20 p-0.5">
          {(["ios", "android"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => load({ platform: value })}
              className={`rounded px-2.5 py-1 text-xs font-medium ${platform === value ? "bg-teal-300/15 text-teal-200" : "text-slate-400 hover:text-white"}`}
            >
              {value === "ios" ? "iOS" : "Android"}
            </button>
          ))}
        </div>
        <form
          className="flex min-w-0 flex-1 items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void load();
          }}
        >
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={t["onboarding.referencesSearch"]}
            className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs text-white outline-none focus:border-teal-300/60"
          />
          <button type="submit" className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/10 text-slate-300 hover:bg-white/8">
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      {status === "loading" ? (
        <div className="py-10 text-center text-xs text-slate-500">{t["onboarding.referencesLoading"]}</div>
      ) : (
        <div className="grid max-h-72 grid-cols-2 gap-2 overflow-auto sm:grid-cols-3" data-testid="reference-grid">
          {apps.map((app) => {
            const isSelected = selectedIds.has(app.id);
            const thumb = app.screenshotUrls[0] ?? app.iconUrl;
            return (
              <button
                key={app.id}
                type="button"
                data-testid={`reference-${app.id}`}
                aria-pressed={isSelected}
                onClick={() => onToggle(app)}
                className={`relative overflow-hidden rounded-lg border text-left transition ${isSelected ? "border-teal-300/70 ring-1 ring-teal-300/50" : "border-white/10 hover:border-white/25"}`}
              >
                <div className="aspect-[9/16] w-full bg-black/30">
                  {thumb ? <img src={referenceImageUrl(thumb)} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                {isSelected ? (
                  <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-teal-300 text-slate-950">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                ) : null}
                <div className="truncate px-2 py-1.5 text-[11px] font-medium text-slate-200">{app.appName}</div>
              </button>
            );
          })}
        </div>
      )}

      {status === "error" ? <div className="mt-2 text-xs text-amber-200">{t["onboarding.referencesError"]}</div> : null}

      <div className="mt-3 text-xs text-teal-200" data-testid="reference-selected-count">
        {t["onboarding.referencesSelected"].replace("{count}", String(selected.length))}
      </div>
    </section>
  );
}
