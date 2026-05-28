#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const inputPath = resolve(process.argv[2] ?? "/tmp/top10.json");
const outputRoot = resolve(process.argv[3] ?? "/tmp/openstoreshot-top10-benchmark");
const refs = JSON.parse(readFileSync(inputPath, "utf8")).data.slice(0, 10);
const imagegenSheet = process.env.OPENSTORESHOT_IMAGEGEN_SHEET ? resolve(process.env.OPENSTORESHOT_IMAGEGEN_SHEET) : undefined;

const W = 1290;
const H = 2796;
const base = { rotation: 0, radius: 0, opacity: 1, letterSpacing: 0, locked: false, hidden: false, children: [] };

const solid = (color) => ({ type: "solid", color });
const grad = (from, to, angle = 145) => ({ type: "gradient", from, to, angle });
const safe = (value) => value.replace(/[\\/:*?"<>|\s]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

function text(id, value, x, y, width, height, fontSize, color, align = "left", fontWeight = 850) {
  return { ...base, id, type: "text", text: value, x, y, width, height, fontSize, fontWeight, lineHeight: 1.03, color, align };
}

function shape(id, x, y, width, height, fill, radius = 36, opacity = 1, rotation = 0) {
  return { ...base, id, type: "shape", x, y, width, height, fill, radius, opacity, rotation };
}

function image(id, assetId, x, y, width, height, radius = 48, opacity = 1, rotation = 0) {
  return { ...base, id, type: "image", assetId, x, y, width, height, radius, opacity, rotation };
}

function device(id, x, y, width = 760, height = 1640) {
  return { ...base, id, type: "device", device: "iphone-6-9", x, y, width, height, radius: 84 };
}

const configs = {
  setlog: { pattern: "playful-social", from: "#FFF7ED", to: "#FDF2F8", accent: "#EC4899", headline: "動画でつながる\n日常を残す", sub: "ステッカーと短い動画カードで楽しく見せる", middle: "写真と動画を\nまとめて共有" },
  "ChatGPT": { pattern: "clean-ai", from: "#E6FAFF", to: "#F7FEFF", accent: "#0EA5E9", headline: "誰もが使える\n画像生成と会話", sub: "淡いブルーと大きな端末で、できることを短く", middle: "会話から\n画像まで" },
  "Google Gemini": { pattern: "logo-visual", from: "#F8FAFC", to: "#EFF6FF", accent: "#2563EB", headline: "生成も検索も\nひとつの画面で", sub: "ロゴグリッドと生成プレビューを主役にする", middle: "ひらめきを\nすぐ形に" },
  "LiveSoul": { pattern: "live-music-gradient", from: "#0F1028", to: "#3B0764", accent: "#F472B6", headline: "ライブの熱量を\nすぐ感じる", sub: "音楽カード、波形、ライブ通知をネオンで見せる", middle: "好きな音に\nすぐ出会える" },
  "Google Chrome - ウェブブラウザ": { pattern: "chrome-feature", from: "#F8FAFC", to: "#EFF6FF", accent: "#2563EB", headline: "検索もログインも\nすばやく続ける", sub: "検索、レンズ、保存、同期をカードで整理", middle: "検索体験を\nもっと快適に" },
  "31Club サーティワン公式アプリ": { pattern: "coupon-festival", from: "#FFF1F2", to: "#FFFBEB", accent: "#EC4899", headline: "おトクなクーポンを\n楽しく見つける", sub: "紙面のようなクーポンと明るい装飾", middle: "限定クーポンを\n逃さない" },
  "Claude by Anthropic": { pattern: "claude-editorial", from: "#C86845", to: "#F3C2A4", accent: "#FFF7ED", headline: "考え続ける\n相棒を手元に", sub: "暖かい背景と紙面カードで落ち着いた知性を表現", middle: "長い文章も\n深く整理" },
  "ジハンピ": { pattern: "jihanpi-steps", from: "#ECFEFF", to: "#F8FAFC", accent: "#06B6D4", headline: "自販機を\nもっと便利に", sub: "3STEPと大きな数字で使い方を説明", middle: "3STEPで\nすぐ使える" },
  Threads: { pattern: "threads-dark", from: "#050505", to: "#111111", accent: "#D4AF37", headline: "新しい視点を\n見つけよう", sub: "黒背景、白いフィード、黄色アクセントで統一", middle: "会話の流れを\n追いやすく" },
  "マイナポータル": { pattern: "official-utility", from: "#EAF6FF", to: "#F8FAFC", accent: "#2563EB", headline: "手続きをスマホで\nすばやく確認", sub: "公的手続きらしい余白と青いCTA", middle: "必要な手続きへ\n迷わず進む" },
  "ゆうちょ通帳アプリ-銀行 アプリ": { pattern: "finance-green", from: "#F0FDF4", to: "#F8FFF4", accent: "#16A34A", headline: "残高と履歴を\nいつでも確認", sub: "大きな数字、明細カード、安心感のある緑", middle: "お金の流れを\nひと目で確認" }
};

function svgAsset(kind, config) {
  const accent = config.accent;
  const dark = config.pattern === "threads-dark";
  if (kind === "social") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><rect width="900" height="700" rx="72" fill="#fff7ed"/><g opacity=".9">${Array.from({ length: 26 }, (_, i) => `<path d="M${40 + (i * 83) % 820} ${35 + (i * 117) % 620}l18 14 20-18 12 24" fill="none" stroke="${i % 2 ? "#f9a8d4" : "#67e8f9"}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}</g><rect x="82" y="72" width="320" height="260" rx="34" fill="#fff" transform="rotate(-8 242 202)"/><rect x="118" y="112" width="248" height="170" rx="26" fill="#111827" transform="rotate(-8 242 202)"/><rect x="510" y="72" width="285" height="258" rx="34" fill="#fff" transform="rotate(7 652 201)"/><rect x="542" y="108" width="220" height="170" rx="26" fill="#334155" transform="rotate(7 652 201)"/><rect x="180" y="360" width="310" height="245" rx="34" fill="#fff" transform="rotate(6 335 482)"/><rect x="214" y="398" width="242" height="155" rx="26" fill="#475569" transform="rotate(6 335 482)"/><rect x="565" y="370" width="250" height="210" rx="34" fill="#fff" transform="rotate(-9 690 475)"/><rect x="592" y="405" width="195" height="130" rx="24" fill="#0f172a" transform="rotate(-9 690 475)"/><circle cx="250" cy="190" r="58" fill="#fbcfe8"/><circle cx="650" cy="175" r="52" fill="#bae6fd"/><text x="455" y="642" text-anchor="middle" font-size="54" font-weight="900" fill="${accent}" font-family="Arial">STORY</text></svg>`;
  }
  if (kind === "coupon") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><rect width="900" height="700" rx="60" fill="#fff"/><g fill="#fde68a">${Array.from({ length: 34 }, (_, i) => `<circle cx="${25 + (i * 79) % 850}" cy="${30 + (i * 131) % 640}" r="${10 + (i % 3) * 4}"/>`).join("")}</g><rect x="90" y="95" width="720" height="470" rx="58" fill="#fdf2f8" stroke="${accent}" stroke-width="12"/><circle cx="90" cy="330" r="38" fill="#fff"/><circle cx="810" cy="330" r="38" fill="#fff"/><text x="450" y="230" text-anchor="middle" font-family="Arial" font-weight="900" font-size="70" fill="#831843">アプリ限定</text><text x="450" y="342" text-anchor="middle" font-family="Arial" font-weight="900" font-size="110" fill="${accent}">100円OFF</text><rect x="225" y="405" width="450" height="82" rx="41" fill="${accent}"/><text x="450" y="460" text-anchor="middle" font-family="Arial" font-weight="900" font-size="42" fill="#fff">COUPON</text><path d="M150 565h600" stroke="#111827" stroke-width="18" stroke-dasharray="28 22" opacity=".18"/></svg>`;
  }
  if (kind === "ai") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><rect width="900" height="700" rx="64" fill="#f8feff"/><rect x="70" y="86" width="350" height="500" rx="52" fill="#fff" stroke="#c7f1fb" stroke-width="10"/><rect x="118" y="138" width="255" height="48" rx="24" fill="${accent}" opacity=".85"/><rect x="118" y="228" width="230" height="30" rx="15" fill="#d8f6fd"/><rect x="118" y="286" width="190" height="30" rx="15" fill="#d8f6fd"/><rect x="480" y="78" width="320" height="320" rx="48" fill="#e0f7ff"/><path d="M574 310c-15-83 38-155 95-158 62-2 112 67 99 143-10 61-71 99-123 92-36-5-63-33-71-77z" fill="#8ee7ff"/><path d="M520 205c68 25 165 34 232-32" fill="none" stroke="#0f9fce" stroke-width="18" stroke-linecap="round" opacity=".55"/><rect x="480" y="444" width="320" height="142" rx="46" fill="#fff" stroke="#bdeeff" stroke-width="8"/><circle cx="548" cy="515" r="28" fill="${accent}"/><rect x="600" y="492" width="142" height="24" rx="12" fill="#94a3b8"/><rect x="600" y="540" width="94" height="20" rx="10" fill="#cbd5e1"/></svg>`;
  }
  if (kind === "browser") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><rect width="900" height="700" rx="58" fill="#fff"/><rect x="94" y="86" width="712" height="96" rx="48" fill="#eff6ff" stroke="#bfdbfe" stroke-width="8"/><circle cx="155" cy="134" r="22" fill="#ef4444"/><circle cx="210" cy="134" r="22" fill="#facc15"/><circle cx="265" cy="134" r="22" fill="#22c55e"/><rect x="330" y="113" width="380" height="42" rx="21" fill="#fff"/><rect x="104" y="250" width="210" height="280" rx="48" fill="#e0f2fe"/><rect x="344" y="250" width="210" height="280" rx="48" fill="#fef9c3"/><rect x="584" y="250" width="210" height="280" rx="48" fill="#dcfce7"/><path d="M158 360h104M398 360h104M638 360h104" stroke="${accent}" stroke-width="26" stroke-linecap="round"/><path d="M150 438h84M390 438h84M630 438h84" stroke="#64748b" stroke-width="18" stroke-linecap="round" opacity=".45"/><circle cx="705" cy="590" r="46" fill="${accent}"/><path d="M735 622l54 54" stroke="${accent}" stroke-width="26" stroke-linecap="round"/></svg>`;
  }
  if (kind === "music") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#312E81"/><stop offset=".48" stop-color="#7E22CE"/><stop offset="1" stop-color="#F472B6"/></linearGradient></defs><rect width="900" height="700" rx="64" fill="url(#g)"/><circle cx="180" cy="160" r="96" fill="#F9A8D4" opacity=".55"/><circle cx="720" cy="170" r="130" fill="#22D3EE" opacity=".35"/><rect x="105" y="105" width="300" height="390" rx="44" fill="#0F172A" opacity=".88"/><rect x="145" y="150" width="220" height="220" rx="34" fill="#F472B6"/><path d="M206 315c55-120 108 65 165-52" fill="none" stroke="#fff" stroke-width="18" stroke-linecap="round"/><rect x="495" y="130" width="300" height="92" rx="46" fill="#fff" opacity=".92"/><circle cx="555" cy="176" r="30" fill="#7E22CE"/><path d="M610 166h120M610 196h72" stroke="#0F172A" stroke-width="16" stroke-linecap="round"/><g>${Array.from({ length: 16 }, (_, i) => `<rect x="${480 + i * 20}" y="${410 - (i % 5) * 24}" width="10" height="${70 + (i % 5) * 36}" rx="5" fill="${i % 2 ? "#F9A8D4" : "#67E8F9"}"/>`).join("")}</g><rect x="180" y="545" width="540" height="78" rx="39" fill="#fff" opacity=".18"/><text x="450" y="596" text-anchor="middle" font-family="Arial" font-size="38" font-weight="900" fill="#fff">LIVE NOW</text></svg>`;
  }
  if (kind === "vending") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><rect width="900" height="700" rx="54" fill="#ecfeff"/><rect x="70" y="80" width="310" height="545" rx="44" fill="#fff" stroke="${accent}" stroke-width="14"/><rect x="118" y="135" width="215" height="285" rx="28" fill="#cffafe"/><g>${Array.from({ length: 12 }, (_, i) => `<rect x="${145 + (i % 3) * 62}" y="${165 + Math.floor(i / 3) * 58}" width="38" height="38" rx="12" fill="${i % 2 ? "#67e8f9" : accent}"/>`).join("")}</g><rect x="145" y="462" width="165" height="64" rx="32" fill="${accent}"/><rect x="128" y="545" width="200" height="34" rx="17" fill="#99f6e4"/><text x="620" y="175" text-anchor="middle" font-family="Arial" font-size="88" font-weight="900" fill="${accent}">14種類</text><text x="620" y="330" text-anchor="middle" font-family="Arial" font-size="88" font-weight="900" fill="#0f172a">3STEP</text><text x="620" y="480" text-anchor="middle" font-family="Arial" font-size="86" font-weight="900" fill="${accent}">1分</text><rect x="480" y="545" width="280" height="70" rx="35" fill="${accent}"/><text x="620" y="593" text-anchor="middle" font-family="Arial" font-size="34" font-weight="900" fill="#fff">すぐ使える</text></svg>`;
  }
  if (kind === "portal") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><rect width="900" height="700" rx="56" fill="#f8fbff"/><rect x="100" y="105" width="700" height="210" rx="42" fill="#dbeafe" stroke="#93c5fd" stroke-width="8"/><rect x="150" y="160" width="170" height="100" rx="24" fill="#fff"/><circle cx="235" cy="205" r="26" fill="${accent}"/><path d="M390 165h300M390 225h210" stroke="${accent}" stroke-width="24" stroke-linecap="round"/><rect x="124" y="390" width="250" height="190" rx="38" fill="#fff" stroke="#bfdbfe" stroke-width="8"/><path d="M168 435h64v64h-64zM265 435h64v64h-64zM168 530h64v20h-64zM265 530h64v20h-64z" fill="${accent}"/><rect x="450" y="390" width="330" height="190" rx="42" fill="#fff"/><rect x="500" y="445" width="230" height="32" rx="16" fill="${accent}"/><rect x="500" y="515" width="150" height="24" rx="12" fill="#cbd5e1"/></svg>`;
  }
  if (kind === "logo") {
    const tiles = Array.from({ length: 8 }, (_, i) => `<rect x="${90 + (i % 4) * 180}" y="${90 + Math.floor(i / 4) * 190}" width="130" height="130" rx="32" fill="${i % 2 ? "#fff" : accent}"/><circle cx="${155 + (i % 4) * 180}" cy="${155 + Math.floor(i / 4) * 190}" r="36" fill="${i % 2 ? accent : "#fff"}"/>`).join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><rect width="900" height="700" rx="44" fill="#050505"/><g>${tiles}</g><rect x="135" y="505" width="630" height="98" rx="49" fill="#111827"/><path d="M230 555h440" stroke="${accent}" stroke-width="18" stroke-linecap="round"/></svg>`;
  }
  if (kind === "editorial") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><rect width="900" height="700" rx="52" fill="#b85b3f"/><ellipse cx="300" cy="360" rx="145" ry="220" fill="#2f241d"/><circle cx="300" cy="185" r="86" fill="#d6a184"/><rect x="500" y="130" width="270" height="420" rx="34" fill="#fff7ed"/><path d="M550 230h150M550 305h170M550 380h125" stroke="#a35b42" stroke-width="20" stroke-linecap="round"/><path d="M408 520c90-40 150-40 240 0" stroke="#fff7ed" stroke-width="18" fill="none"/></svg>`;
  }
  if (kind === "finance") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><rect width="900" height="700" rx="58" fill="#ecfdf5"/><text x="450" y="155" text-anchor="middle" font-family="Arial" font-size="96" font-weight="900" fill="${accent}">1,600万</text><rect x="110" y="220" width="680" height="270" rx="48" fill="#fff" stroke="${accent}" stroke-width="10"/><text x="450" y="315" text-anchor="middle" font-family="Arial" font-size="74" font-weight="900" fill="#166534">¥128,400</text><path d="M190 430c120-125 230-55 330-150 55-52 95-58 160-20" fill="none" stroke="${accent}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/><g>${Array.from({ length: 4 }, (_, i) => `<rect x="145" y="${535 + i * 38}" width="${520 - i * 70}" height="20" rx="10" fill="${i % 2 ? "#86efac" : "#bbf7d0"}"/>`).join("")}</g><circle cx="720" cy="582" r="46" fill="#fde68a"/></svg>`;
  }
  if (kind === "feed") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><rect width="900" height="700" fill="#050505"/><text x="80" y="100" font-family="Arial" font-size="52" font-weight="900" fill="${accent}">見つけよう</text>${Array.from({ length: 5 }, (_, i) => `<rect x="95" y="${150 + i * 98}" width="710" height="74" rx="37" fill="#fff"/><circle cx="145" cy="${187 + i * 98}" r="22" fill="${accent}"/><path d="M195 ${180 + i * 98}h420" stroke="#111" stroke-width="16" stroke-linecap="round"/>`).join("")}</svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700"><rect width="900" height="700" rx="54" fill="${dark ? "#0b1220" : "#fff"}"/><rect x="120" y="130" width="660" height="130" rx="42" fill="${accent}" opacity=".88"/><rect x="170" y="330" width="560" height="52" rx="26" fill="${dark ? "#334155" : "#dbeafe"}"/><rect x="170" y="430" width="420" height="52" rx="26" fill="${dark ? "#334155" : "#dbeafe"}"/><rect x="170" y="530" width="500" height="52" rx="26" fill="${accent}" opacity=".68"/></svg>`;
}

function assetKind(pattern) {
  if (pattern === "playful-social") return "social";
  if (pattern === "clean-ai") return "ai";
  if (pattern === "chrome-feature") return "browser";
  if (pattern === "live-music-gradient") return "music";
  if (pattern === "coupon-festival") return "coupon";
  if (pattern === "logo-visual") return "logo";
  if (pattern === "claude-editorial") return "editorial";
  if (pattern === "jihanpi-steps") return "vending";
  if (pattern === "official-utility") return "portal";
  if (pattern === "finance-green") return "finance";
  if (pattern === "threads-dark") return "feed";
  return "generic";
}

function header(config, dark = false) {
  const ink = dark ? "#F8FAFC" : "#0F172A";
  return [
    { ...base, id: "bg", type: "background", fill: grad(config.from, config.to, 142) },
    shape("series-top-rule", 0, 0, W, 32, solid(config.accent), 0),
    text("headline", config.headline, 92, 150, 1110, 210, 74, ink, "left", 880),
    text("subtitle", config.sub, 92, 410, 1030, 58, 30, dark ? "#CBD5E1" : "#475569", "left", 650)
  ];
}

function phoneUi(prefix, x, y, width, config, dark = false) {
  const card = dark ? "#111827" : "#FFFFFF";
  const muted = dark ? "#1F2937" : "#EAF2F8";
  const ink = dark ? "#E2E8F0" : "#0F172A";
  return [
    shape(`${prefix}-nav`, x + 58, y + 92, width - 116, 92, solid(muted), 34),
    text(`${prefix}-app`, config.pattern.includes("finance") ? "残高" : config.pattern.includes("threads") ? "Feed" : config.pattern.includes("coupon") ? "Coupon" : "Home", x + 92, y + 118, width - 184, 36, 28, ink, "left", 760),
    shape(`${prefix}-hero`, x + 58, y + 240, width - 116, 340, solid(card), 42),
    shape(`${prefix}-accent`, x + 98, y + 308, 240, 42, solid(config.accent), 21),
    shape(`${prefix}-line1`, x + 98, y + 402, width - 290, 28, solid(muted), 14),
    shape(`${prefix}-line2`, x + 98, y + 478, width - 360, 24, solid(muted), 12),
    shape(`${prefix}-list`, x + 58, y + 655, width - 116, 570, solid(card), 42),
    ...Array.from({ length: 5 }, (_, index) => shape(`${prefix}-row-${index}`, x + 100, y + 750 + index * 88, width - 260, 26, solid(index % 2 ? config.accent : muted), 13, index % 2 ? 0.75 : 1)),
    shape(`${prefix}-bottom`, x + 58, y + 1320, width - 116, 250, solid(card), 42),
    shape(`${prefix}-bottom-a`, x + 110, y + 1410, width - 330, 28, solid(config.accent), 14, 0.75),
    shape(`${prefix}-bottom-b`, x + 110, y + 1490, width - 440, 24, solid(muted), 12)
  ];
}

function phoneSlide(number, config, slug, assetId) {
  const dark = config.pattern === "threads-dark";
  const dx = 265;
  const dy = 650;
  const dw = 760;
  const richPatterns = new Set(["playful-social", "clean-ai", "logo-visual", "chrome-feature", "coupon-festival", "claude-editorial", "jihanpi-steps", "threads-dark", "official-utility", "finance-green"]);
  if (richPatterns.has(config.pattern)) {
    const phoneX = number === 1 ? 690 : 105;
    const heroX = number === 1 ? 105 : 425;
    return {
      id: `slide-0${number}`,
      title: `${slug} ${number}`,
      role: number === 1 ? "benefit" : "cta",
      localeText: {},
      artboards: [{
        id: `ios-${slug}-${number}`,
        width: W,
        height: H,
        platform: "ios",
        target: "ios-6-9-portrait",
        layers: [
          ...header(config, dark),
          shape("series-backdrop", 92, 560, 1106, 1780, grad(config.to, config.from, 96), 58, dark ? 0.18 : 0.46),
          image("reference-style-side-hero", assetId, heroX, 700, 700, 760, 64, 1, number === 1 ? -5 : 5),
          shape("side-hero-shadow-card", heroX + 70, 1510, 560, 210, solid(dark ? "#111827" : "#FFFFFF"), 46, 0.92),
          shape("side-hero-line-a", heroX + 125, 1588, 360, 30, solid(config.accent), 15, 0.82),
          shape("side-hero-line-b", heroX + 125, 1668, 260, 24, solid(dark ? "#334155" : "#CBD5E1"), 12),
          device("device", phoneX, 910, 500, 1080),
          ...phoneUi("device", phoneX, 910, 500, config, dark).slice(0, 12),
          shape("floating-pill", phoneX + 240, 830, 245, 72, solid(config.accent), 36),
          text("pill-label", number === 1 ? "注目" : "完了", phoneX + 284, 851, 155, 32, 26, dark ? "#050505" : "#FFFFFF", "center", 840),
          ...(config.pattern === "coupon-festival" ? [
            text("coupon-callout", "100円OFF", 170, 1790, 560, 110, 82, config.accent, "center", 920),
            shape("coupon-dots", 150, 1930, 610, 36, solid(config.accent), 18, 0.18)
          ] : []),
          ...(config.pattern === "finance-green" ? [
            text("finance-callout", "1,600万", 165, 1770, 560, 110, 82, config.accent, "center", 920),
            shape("finance-graph-line", 235, 1920, 420, 28, solid(config.accent), 14, 0.72)
          ] : [])
        ]
      }]
    };
  }
  return {
    id: `slide-0${number}`,
    title: `${slug} ${number}`,
    role: number === 1 ? "benefit" : "cta",
    localeText: {},
    artboards: [{
      id: `ios-${slug}-${number}`,
      width: W,
      height: H,
      platform: "ios",
      target: "ios-6-9-portrait",
      layers: [
        ...header(config, dark),
        shape("series-backdrop", 92, 560, 1106, 1780, grad(config.to, config.from, 96), 58, dark ? 0.18 : 0.46),
        device("device", dx, dy, dw),
        ...phoneUi("device", dx, dy, dw, config, dark),
        shape("floating-pill", 805, 590, 300, 78, solid(config.accent), 39),
        text("pill-label", number === 1 ? "注目ポイント" : "すぐ使える", 848, 612, 215, 34, 27, dark ? "#050505" : "#FFFFFF", "center", 840)
      ]
    }]
  };
}

function middleSlide(config, slug, assetId) {
  const dark = config.pattern === "threads-dark";
  const ink = dark ? "#F8FAFC" : "#0F172A";
  const layers = [
    ...header(config, dark),
    shape("series-backdrop", 92, 560, 1106, 1780, grad(config.to, config.from, 96), 58, dark ? 0.18 : 0.46),
    image("reference-style-hero", assetId, 145, 640, 1000, 920, 58)
  ];
  layers.push(
    shape("hero-chip-primary", 205, 700, 250, 70, solid(config.accent), 35),
    text("hero-chip-primary-label", config.pattern === "threads-dark" ? "LIVE" : "FEATURE", 245, 722, 170, 28, 24, dark ? "#050505" : "#FFFFFF", "center", 820),
    shape("hero-card-note", 760, 742, 310, 150, solid(dark ? "#111827" : "#FFFFFF"), 34, 0.92),
    shape("hero-note-line-1", 805, 800, 220, 22, solid(config.accent), 11, 0.8),
    shape("hero-note-line-2", 805, 855, 160, 18, solid(dark ? "#334155" : "#CBD5E1"), 9),
    shape("hero-swatch-1", 230, 1490, 70, 70, solid(config.accent), 35),
    shape("hero-swatch-2", 330, 1490, 70, 70, solid(config.to), 35),
    shape("hero-swatch-3", 430, 1490, 70, 70, solid(dark ? "#334155" : "#FFFFFF"), 35),
    shape("hero-proof-card", 620, 1460, 430, 130, solid(dark ? "#111827" : "#FFFFFF"), 34, 0.94),
    shape("hero-proof-line", 665, 1515, 300, 24, solid(config.accent), 12, 0.78)
  );

  if (config.pattern === "jihanpi-steps" || config.pattern === "chrome-feature" || config.pattern === "official-utility") {
    for (let index = 0; index < 3; index += 1) {
      layers.push(shape(`step-circle-${index}`, 230, 790 + index * 300, 130, 130, solid(config.accent), 65));
      layers.push(text(`step-num-${index}`, String(index + 1), 274, 825 + index * 300, 44, 48, 44, "#FFFFFF", "center", 900));
      layers.push(shape(`step-card-${index}`, 420, 785 + index * 300, 600, 160, solid(config.to), 38, 0.86));
    }
  }
  if (config.pattern === "coupon-festival") {
    layers.push(text("coupon-big", "100円OFF", 250, 840, 790, 126, 104, config.accent, "center", 920));
  }
  if (config.pattern === "finance-green") {
    layers.push(text("finance-big", "1,600万", 260, 805, 760, 128, 104, config.accent, "center", 920));
  }
  layers.push(text("caption", config.middle, 205, 1760, 880, 150, 58, ink, "center", 860));
  return { id: "slide-02", title: `${slug} 2`, role: "feature", localeText: {}, artboards: [{ id: `ios-${slug}-2`, width: W, height: H, platform: "ios", target: "ios-6-9-portrait", layers }] };
}

function artboard(slug, number, layers) {
  return { id: `ios-${slug}-${number}`, width: W, height: H, platform: "ios", target: "ios-6-9-portrait", layers };
}

function slide(slug, number, role, layers) {
  return { id: `slide-0${number}`, title: `${slug} ${number}`, role, localeText: {}, artboards: [artboard(slug, number, layers)] };
}

function simpleHeader(config, headline, align = "left", dark = false) {
  const ink = dark ? "#F8FAFC" : "#0F172A";
  const x = align === "center" ? 90 : 82;
  return [
    { ...base, id: "bg", type: "background", fill: grad(config.from, config.to, 142) },
    shape("series-top-rule", 0, 0, W, 32, solid(config.accent), 0),
    text("headline", headline, x, 108, align === "center" ? 1110 : 940, 220, 82, ink, align, 920)
  ];
}

function appSurfaceDetails(prefix, x, y, config, dark = false) {
  return [
    shape(`${prefix}-card-a`, x, y, 520, 210, solid(dark ? "#111827" : "#FFFFFF"), 42, 0.96),
    shape(`${prefix}-card-a-line`, x + 46, y + 60, 310, 26, solid(config.accent), 13, 0.86),
    shape(`${prefix}-card-a-row`, x + 46, y + 126, 400, 24, solid(dark ? "#334155" : "#CBD5E1"), 12),
    shape(`${prefix}-card-b`, x + 70, y + 260, 610, 260, solid(dark ? "#0F172A" : "#F8FAFC"), 42, 0.98),
    shape(`${prefix}-card-b-chip`, x + 122, y + 320, 190, 50, solid(config.accent), 25, 0.9),
    shape(`${prefix}-card-b-row-1`, x + 122, y + 420, 390, 24, solid(dark ? "#475569" : "#CBD5E1"), 12),
    shape(`${prefix}-card-b-row-2`, x + 122, y + 478, 290, 24, solid(dark ? "#475569" : "#CBD5E1"), 12)
  ];
}

function aiChatDetails(prefix, x, y, width) {
  return [
    shape(`${prefix}-topbar`, x + 58, y + 88, width - 116, 86, solid("#F1F5F9"), 34),
    text(`${prefix}-title`, "Chat", x + 98, y + 112, 180, 34, 28, "#0F172A", "left", 850),
    shape(`${prefix}-spark`, x + width - 170, y + 108, 54, 54, grad("#7DD3FC", "#FFFFFF", 120), 27),
    shape(`${prefix}-prompt`, x + 78, y + 240, width - 156, 210, solid("#E0F2FE"), 40),
    text(`${prefix}-prompt-text`, "旅行の計画を\n3日分で作って", x + 122, y + 296, width - 244, 78, 32, "#075985", "left", 820),
    shape(`${prefix}-answer`, x + 78, y + 510, width - 156, 430, solid("#FFFFFF"), 40),
    ...Array.from({ length: 5 }, (_, index) => shape(`${prefix}-answer-line-${index}`, x + 128, y + 590 + index * 58, width - 300 - (index % 2) * 75, 22, solid(index === 0 ? "#0EA5E9" : "#CBD5E1"), 11, 0.9)),
    shape(`${prefix}-image-card`, x + 118, y + 990, width - 236, 280, grad("#BAE6FD", "#F8FAFC", 135), 38),
    shape(`${prefix}-image-sun`, x + width - 245, y + 1055, 70, 70, solid("#FDE68A"), 35),
    shape(`${prefix}-image-hill-a`, x + 145, y + 1170, width - 310, 34, solid("#38BDF8"), 17, 0.65, -8),
    shape(`${prefix}-composer`, x + 78, y + 1340, width - 156, 92, solid("#F8FAFC"), 46),
    shape(`${prefix}-composer-dot`, x + width - 170, y + 1360, 54, 54, solid("#0EA5E9"), 27)
  ];
}

function browserDetails(prefix, x, y, width) {
  return [
    shape(`${prefix}-search`, x + 58, y + 86, width - 116, 92, solid("#F8FAFC"), 46),
    shape(`${prefix}-g-dot-1`, x + 100, y + 112, 26, 26, solid("#2563EB"), 13),
    shape(`${prefix}-g-dot-2`, x + 130, y + 112, 26, 26, solid("#EF4444"), 13),
    shape(`${prefix}-query`, x + 180, y + 118, width - 350, 24, solid("#CBD5E1"), 12),
    shape(`${prefix}-hero-result`, x + 58, y + 250, width - 116, 330, solid("#FFFFFF"), 42),
    shape(`${prefix}-image-thumb`, x + 100, y + 300, 160, 190, grad("#DCFCE7", "#DBEAFE", 130), 28),
    shape(`${prefix}-result-line-1`, x + 300, y + 315, width - 430, 24, solid("#2563EB"), 12),
    shape(`${prefix}-result-line-2`, x + 300, y + 380, width - 500, 22, solid("#CBD5E1"), 11),
    shape(`${prefix}-result-line-3`, x + 300, y + 440, width - 470, 22, solid("#CBD5E1"), 11),
    ...Array.from({ length: 3 }, (_, index) => shape(`${prefix}-shortcut-${index}`, x + 85 + index * ((width - 190) / 3), y + 660, 110, 110, solid(index === 0 ? "#DBEAFE" : index === 1 ? "#FEF3C7" : "#DCFCE7"), 36)),
    shape(`${prefix}-article`, x + 58, y + 840, width - 116, 360, solid("#FFFFFF"), 42),
    ...Array.from({ length: 4 }, (_, index) => shape(`${prefix}-article-line-${index}`, x + 105, y + 930 + index * 58, width - 260 - index * 48, 22, solid(index === 0 ? "#2563EB" : "#CBD5E1"), 11)),
    shape(`${prefix}-bottom-tabs`, x + 58, y + 1310, width - 116, 92, solid("#EFF6FF"), 46),
    ...Array.from({ length: 4 }, (_, index) => shape(`${prefix}-tab-${index}`, x + 112 + index * ((width - 260) / 3), y + 1340, 42, 42, solid(index === 1 ? "#2563EB" : "#93C5FD"), 21))
  ];
}

function top10Slides(config, slug, assetId) {
  const dark = config.pattern === "threads-dark";
  if (config.pattern === "playful-social") {
    return [1, 2, 3].map((number) => {
      const offset = (number - 1) * -W;
      const layers = [
        { ...base, id: "bg", type: "background", fill: grad("#FFF7ED", "#FCE7F3", 90) },
        shape("panorama-soft-band", offset, 500, W * 3, 1320, solid("#FFFFFF"), 0, 0.55, -7),
        shape("panorama-ribbon-primary", offset + 240, 1660, W * 2.6, 240, solid("#FBCFE8"), 120, 0.62, -4),
        shape("panorama-ribbon-secondary", offset + 720, 1870, W * 2.2, 180, solid("#A7F3D0"), 90, 0.52, 5),
        shape("series-top-rule", 0, 0, W, 28, solid(config.accent), 0),
        text("headline", number === 1 ? "今日の瞬間を\nまとめて残す" : number === 2 ? "写真も動画も\nカードで共有" : "友だちとの記録を\n楽しく見返す", 90, 120, 910, 190, 68, "#0F172A", "left", 900),
        image("panorama-photo-collage", assetId, offset + 160, 470, Math.round(W * 2.7), 1160, 78, 1, number === 2 ? 2 : -4),
        ...Array.from({ length: 9 }, (_, index) => shape(`panorama-polaroid-${index}`, offset + 260 + index * 330, 690 + (index % 3) * 170, 230, 292, solid(index % 2 ? "#FFFFFF" : "#F8FAFC"), 30, 0.92, index % 2 ? 8 : -8)),
        ...Array.from({ length: 9 }, (_, index) => shape(`panorama-thumb-${index}`, offset + 286 + index * 330, 728 + (index % 3) * 170, 178, 170, solid(index % 2 ? "#111827" : "#334155"), 22, 0.96, index % 2 ? 8 : -8)),
        device("device", number === 2 ? 450 : 650, 1110, 480, 1040),
        ...phoneUi("device", number === 2 ? 450 : 650, 1110, 480, config).slice(0, 12),
        ...Array.from({ length: 8 }, (_, index) => shape(`sticker-${index}`, 100 + ((index * 157 + number * 80) % 900), 1540 + ((index * 103) % 500), 72, 72, solid(index % 2 ? "#A7F3D0" : "#FBCFE8"), 22, 0.88, index % 2 ? -12 : 10)),
        text("bottom-copy", number === 2 ? "投稿前の雰囲気まで伝わる" : "アルバムより軽く、SNSより自分らしく", 120, 2280, 990, 72, 42, "#831843", "center", 800)
      ];
      return slide(slug, number, number === 1 ? "benefit" : number === 2 ? "workflow" : "cta", layers);
    });
  }

  if (config.pattern === "clean-ai") {
    return [
      slide(slug, 1, "benefit", [
        ...simpleHeader(config, "聞きたいことを\nそのまま相談", "left"),
        shape("ai-backdrop", 90, 520, 1110, 1540, solid("#E6FAFF"), 70, 0.8),
        device("device", 110, 600, 720, 1560),
        ...aiChatDetails("chat", 110, 600, 720),
        image("generated-output-preview", assetId, 675, 640, 515, 680, 64, 1, 5),
        shape("voice-orb", 845, 1395, 230, 230, grad("#BAE6FD", "#FFFFFF", 120), 115),
        text("voice-label", "音声でも", 876, 1480, 168, 42, 34, "#075985", "center", 880),
        ...Array.from({ length: 4 }, (_, index) => shape(`ai-capability-${index}`, 675 + (index % 2) * 250, 1700 + Math.floor(index / 2) * 135, 210, 86, solid(index % 2 ? "#FFFFFF" : "#E0F2FE"), 36)),
        text("bottom-copy", "文章、画像、音声をひとつの流れで", 120, 2350, 980, 80, 46, "#075985", "left", 820)
      ]),
      slide(slug, 2, "feature", [
        ...simpleHeader(config, "画像のアイデアも\n会話から作る", "center"),
        image("large-image-result", assetId, 95, 470, 1100, 1220, 78),
        shape("prompt-card", 170, 1510, 950, 260, solid("#FFFFFF"), 52),
        text("prompt-label", "プロンプトから生成案へ", 230, 1580, 620, 60, 48, "#0F172A", "left", 850),
        shape("prompt-input", 230, 1688, 620, 58, solid("#E0F2FE"), 29),
        shape("prompt-cursor", 790, 1703, 8, 32, solid(config.accent), 4),
        ...appSurfaceDetails("ai", 230, 1830, config),
        shape("floating-send", 865, 1825, 160, 76, solid(config.accent), 38),
        text("send-label", "送信", 900, 1848, 92, 34, 28, "#FFFFFF", "center", 850)
      ]),
      slide(slug, 3, "cta", [
        ...simpleHeader(config, "学びも仕事も\nすぐ整理", "left"),
        shape("chat-thread", 100, 560, 660, 1320, solid("#FFFFFF"), 56),
        ...Array.from({ length: 9 }, (_, index) => shape(`bubble-${index}`, 160 + (index % 2) * 150, 650 + index * 124, 320 + (index % 3) * 80, 72, solid(index % 2 ? "#E0F2FE" : "#F1F5F9"), 36)),
        text("summary-card-title", "要点まとめ", 180, 1640, 320, 56, 44, "#075985", "left", 880),
        shape("summary-line-1", 180, 1730, 420, 24, solid(config.accent), 12),
        shape("summary-line-2", 180, 1795, 340, 22, solid("#CBD5E1"), 11),
        device("device", 735, 840, 430, 930),
        ...aiChatDetails("mini-chat", 735, 840, 430).slice(0, 12),
        text("bottom-copy", "要点を残して、次の行動へ", 145, 2140, 920, 80, 48, "#075985", "center", 850)
      ])
    ];
  }

  if (config.pattern === "logo-visual") {
    return [
      slide(slug, 1, "benefit", [
        ...simpleHeader(config, "ひらめきを\nすぐ形に", "left"),
        shape("gemini-dark-panel", 70, 500, 720, 1040, solid("#050505"), 58),
        image("black-logo-board", assetId, 95, 540, 660, 760, 54),
        ...Array.from({ length: 6 }, (_, index) => shape(`gemini-logo-tile-${index}`, 135 + (index % 3) * 190, 1360 + Math.floor(index / 3) * 170, 132, 132, solid(index % 2 ? "#FFFFFF" : config.accent), 32)),
        device("device", 720, 820, 470, 1020),
        ...aiChatDetails("gemini-chat", 720, 820, 470).slice(0, 12),
        shape("gemini-spark", 940, 620, 170, 170, grad("#2563EB", "#FFFFFF", 135), 85),
        text("gemini-spark-label", "AI", 985, 682, 80, 48, 44, "#FFFFFF", "center", 920),
        text("bottom-copy", "検索と生成を横断して使える", 130, 2140, 880, 74, 46, "#1D4ED8", "left", 840)
      ]),
      slide(slug, 2, "feature", [
        { ...base, id: "bg", type: "background", fill: solid("#050505") },
        text("headline", "画像も動画も\nまとめて発想", 90, 130, 940, 190, 70, "#FFFFFF", "left", 900),
        image("creation-grid", assetId, 80, 455, 1130, 1220, 62),
        ...Array.from({ length: 6 }, (_, index) => shape(`preview-tile-${index}`, 160 + (index % 3) * 330, 1540 + Math.floor(index / 3) * 250, 260, 190, solid(index % 2 ? "#111827" : "#1E3A8A"), 36)),
        ...Array.from({ length: 6 }, (_, index) => shape(`preview-glow-${index}`, 190 + (index % 3) * 330, 1605 + Math.floor(index / 3) * 250, 170, 28, solid(index % 2 ? "#60A5FA" : "#FFFFFF"), 14, 0.45)),
        shape("prompt-strip", 150, 2050, 980, 78, solid("#111827"), 39),
        text("prompt-strip-label", "画像・動画・検索をひとつの流れで", 240, 2072, 800, 34, 30, "#DBEAFE", "center", 820),
        text("bottom-copy", "黒背景でも情報が沈まない強いグリッド", 150, 2180, 900, 70, 40, "#DBEAFE", "center", 780)
      ]),
      phoneSlide(3, config, slug, assetId)
    ];
  }

  if (config.pattern === "live-music-gradient") {
    return [
      slide(slug, 1, "benefit", [
        { ...base, id: "bg", type: "background", fill: grad("#111827", "#3B0764", 135) },
        shape("neon-band", -120, 520, 1550, 520, grad("#7E22CE", "#F472B6", 92), 260, 0.38, -8),
        text("headline", "ライブの熱量を\nすぐ感じる", 90, 130, 900, 190, 72, "#FFFFFF", "left", 920),
        image("music-hero-card", assetId, 80, 510, 700, 900, 70, 1, -4),
        device("device", 690, 650, 500, 1080),
        ...phoneUi("device", 690, 650, 500, config, true).slice(0, 13),
        shape("now-live-pill", 165, 1370, 430, 96, solid("#FFFFFF"), 48, 0.94),
        text("now-live-label", "LIVE NOW", 235, 1399, 290, 38, 34, "#7E22CE", "center", 940),
        ...Array.from({ length: 15 }, (_, index) => shape(`wave-bar-${index}`, 165 + index * 42, 1580 - (index % 5) * 34, 22, 86 + (index % 5) * 54, solid(index % 2 ? "#F9A8D4" : "#67E8F9"), 11, 0.82)),
        text("bottom-copy", "音楽カードと波形で、アプリの空気感まで伝える", 130, 2240, 980, 78, 42, "#FCE7F3", "center", 820)
      ]),
      slide(slug, 2, "feature", [
        { ...base, id: "bg", type: "background", fill: grad("#0F1028", "#4C1D95", 110) },
        text("headline", "好きな音に\nすぐ出会える", 90, 130, 900, 190, 72, "#FFFFFF", "left", 920),
        shape("album-grid-bg", 70, 500, 1150, 1280, solid("#111827"), 64, 0.78),
        ...Array.from({ length: 6 }, (_, index) => shape(`album-card-${index}`, 130 + (index % 3) * 340, 590 + Math.floor(index / 3) * 410, 270, 330, grad(index % 2 ? "#F472B6" : "#22D3EE", index % 2 ? "#7E22CE" : "#1E3A8A", 135), 44)),
        ...Array.from({ length: 6 }, (_, index) => shape(`album-shine-${index}`, 172 + (index % 3) * 340, 720 + Math.floor(index / 3) * 410, 180, 24, solid("#FFFFFF"), 12, 0.32)),
        shape("playlist-panel", 170, 1465, 950, 360, solid("#FFFFFF"), 54, 0.94),
        text("playlist-title", "今日のおすすめ", 245, 1550, 510, 58, 48, "#111827", "left", 900),
        ...Array.from({ length: 4 }, (_, index) => shape(`playlist-line-${index}`, 245, 1655 + index * 54, 580 - index * 80, 22, solid(index % 2 ? "#CBD5E1" : config.accent), 11)),
        shape("play-button", 900, 1555, 120, 120, solid(config.accent), 60),
        text("play-icon", "▶", 936, 1593, 54, 54, 46, "#FFFFFF", "center", 900)
      ]),
      slide(slug, 3, "cta", [
        { ...base, id: "bg", type: "background", fill: grad("#220A3A", "#111827", 125) },
        text("headline", "通知で\n聴き逃さない", 90, 130, 850, 190, 72, "#FFFFFF", "left", 920),
        device("device", 130, 610, 560, 1210),
        ...phoneUi("device", 130, 610, 560, config, true),
        shape("notification-stack", 650, 690, 490, 780, solid("#FFFFFF"), 54, 0.93),
        ...Array.from({ length: 4 }, (_, index) => shape(`notify-row-${index}`, 700, 790 + index * 150, 390, 100, solid(index % 2 ? "#FCE7F3" : "#E0F2FE"), 34)),
        ...Array.from({ length: 4 }, (_, index) => shape(`notify-dot-${index}`, 730, 820 + index * 150, 42, 42, solid(index % 2 ? config.accent : "#22D3EE"), 21)),
        ...Array.from({ length: 4 }, (_, index) => shape(`notify-line-${index}`, 795, 826 + index * 150, 220 - index * 28, 22, solid("#111827"), 11, 0.42)),
        shape("live-cta", 710, 1580, 360, 94, solid(config.accent), 47),
        text("live-cta-label", "ライブへ参加", 775, 1609, 230, 36, 32, "#FFFFFF", "center", 900),
        ...Array.from({ length: 11 }, (_, index) => shape(`bottom-wave-${index}`, 720 + index * 31, 1810 - (index % 4) * 22, 15, 70 + (index % 4) * 38, solid(index % 2 ? "#F9A8D4" : "#67E8F9"), 8, 0.82))
      ])
    ];
  }

  if (config.pattern === "chrome-feature") {
    return [
      slide(slug, 1, "benefit", [
        ...simpleHeader(config, "見たいものへ\nすぐ検索", "left"),
        shape("browser-window", 100, 560, 1090, 1060, solid("#FFFFFF"), 58),
        image("browser-feature-board", assetId, 100, 520, 1090, 930, 58),
        shape("search-pill-large", 190, 640, 900, 94, solid("#FFFFFF"), 47),
        shape("search-g-blue", 240, 672, 30, 30, solid("#2563EB"), 15),
        shape("search-g-red", 276, 672, 30, 30, solid("#EF4444"), 15),
        text("search-copy", "気になる画像を検索", 345, 668, 430, 40, 34, "#0F172A", "left", 850),
        device("device", 355, 1380, 560, 1210),
        ...browserDetails("device", 355, 1380, 560).slice(0, 13)
      ]),
      slide(slug, 2, "workflow", [
        ...simpleHeader(config, "検索、保存、同期を\nひとつの流れに", "center"),
        shape("workflow-board", 70, 560, 1150, 1480, solid("#FFFFFF"), 64, 0.72),
        ...Array.from({ length: 3 }, (_, index) => shape(`feature-card-${index}`, 110 + index * 390, 650, 330, 680, solid(index === 0 ? "#DBEAFE" : index === 1 ? "#FEF3C7" : "#DCFCE7"), 48)),
        text("step-1", "検索", 190, 780, 170, 70, 52, "#1D4ED8", "center", 900),
        text("step-2", "レンズ", 575, 780, 170, 70, 52, "#CA8A04", "center", 900),
        text("step-3", "同期", 965, 780, 170, 70, 52, "#16A34A", "center", 900),
        ...Array.from({ length: 3 }, (_, index) => shape(`feature-icon-${index}`, 210 + index * 390, 910, 130, 130, solid(index === 0 ? "#FFFFFF" : index === 1 ? "#FFFBEB" : "#F0FDF4"), 42)),
        ...Array.from({ length: 3 }, (_, index) => shape(`feature-line-${index}`, 170 + index * 390, 1130, 215, 24, solid(index === 0 ? "#2563EB" : index === 1 ? "#CA8A04" : "#16A34A"), 12)),
        ...appSurfaceDetails("browser", 260, 1490, config),
        text("bottom-copy", "普段のブラウズを迷わず続ける", 140, 2220, 980, 80, 46, "#1D4ED8", "center", 840)
      ]),
      slide(slug, 3, "cta", [
        ...simpleHeader(config, "パスワードも\n安全に管理", "left"),
        device("device-main", 110, 610, 560, 1210),
        ...browserDetails("main", 110, 610, 560),
        shape("security-card", 640, 770, 500, 700, solid("#EFF6FF"), 52),
        shape("lock-dot", 815, 880, 150, 150, solid(config.accent), 75),
        text("security-copy", "保存済み情報を\nすばやく呼び出す", 690, 1110, 400, 150, 48, "#0F172A", "center", 850),
        ...Array.from({ length: 4 }, (_, index) => shape(`password-row-${index}`, 700, 1305 + index * 82, 360 - index * 42, 26, solid(index % 2 ? "#93C5FD" : "#FFFFFF"), 13)),
        text("bottom-copy", "必要な情報に、必要な時だけ", 150, 2200, 900, 70, 42, "#1D4ED8", "center", 800)
      ])
    ];
  }

  if (config.pattern === "coupon-festival") {
    return [
      slide(slug, 1, "benefit", [
        ...simpleHeader(config, "アプリ限定\nクーポンを発見", "left"),
        image("coupon-hero", assetId, 75, 450, 1140, 1230, 70, 1, -4),
        shape("coupon-starburst", 170, 1425, 940, 250, solid("#FEF3C7"), 60, 0.92, -3),
        text("coupon-big-copy", "100円OFF", 190, 1490, 900, 140, 116, config.accent, "center", 950),
        text("coupon-sub", "アプリ会員だけの特典", 300, 1630, 680, 56, 42, "#831843", "center", 880),
        ...Array.from({ length: 18 }, (_, index) => shape(`confetti-${index}`, 70 + (index * 103) % 1100, 1780 + (index * 71) % 430, 44, 44, solid(index % 3 === 0 ? "#FDE68A" : index % 3 === 1 ? "#A7F3D0" : "#F9A8D4"), 14, 0.9, index * 9))
      ]),
      slide(slug, 2, "feature", [
        ...simpleHeader(config, "会員証も\nまとめて表示", "center"),
        device("device", 405, 560, 560, 1210),
        ...phoneUi("device", 405, 560, 560, config),
        shape("barcode-ticket", 180, 1360, 930, 360, solid("#FFFFFF"), 52),
        text("barcode-label", "HAPPY TICKET", 260, 1445, 750, 70, 58, config.accent, "center", 900),
        shape("barcode-line", 260, 1580, 730, 42, solid("#0F172A"), 0, 0.18),
        ...Array.from({ length: 9 }, (_, index) => shape(`barcode-stripe-${index}`, 300 + index * 65, 1582, index % 2 ? 24 : 38, 110, solid("#111827"), 0, 0.72)),
        text("member-point", "18,000 pt", 430, 1760, 420, 80, 64, config.accent, "center", 930)
      ]),
      slide(slug, 3, "cta", [
        ...simpleHeader(config, "お店で使える\n特典をチェック", "left"),
        shape("coupon-board", 80, 540, 1130, 1380, solid("#FFFFFF"), 62, 0.78),
        ...Array.from({ length: 4 }, (_, index) => shape(`coupon-card-${index}`, 120 + (index % 2) * 520, 620 + Math.floor(index / 2) * 460, 430, 360, solid(index % 2 ? "#FEF3C7" : "#FDF2F8"), 48, 1, index % 2 ? 4 : -4)),
        text("coupon-label-a", "無料", 205, 760, 260, 80, 72, "#F59E0B", "center", 900),
        text("coupon-label-b", "OFF", 735, 760, 260, 80, 72, config.accent, "center", 900),
        text("coupon-label-c", "100円", 205, 1225, 260, 80, 70, config.accent, "center", 900),
        text("coupon-label-d", "特典", 735, 1225, 260, 80, 70, "#F59E0B", "center", 900),
        ...Array.from({ length: 8 }, (_, index) => shape(`ticket-cut-${index}`, 155 + (index % 4) * 240, 940 + Math.floor(index / 4) * 470, 54, 54, solid("#FFFFFF"), 27)),
        text("bottom-copy", "明るい紙面感で、使う楽しさまで伝える", 130, 2180, 980, 80, 44, "#831843", "center", 840)
      ])
    ];
  }

  if (config.pattern === "claude-editorial") {
    return [
      slide(slug, 1, "benefit", [
        { ...base, id: "bg", type: "background", fill: solid("#B85B3F") },
        image("editorial-person-card", assetId, 60, 430, 760, 1430, 52),
        text("headline", "考え続けよう。", 90, 140, 760, 120, 74, "#FFF7ED", "left", 900),
        shape("paper-note", 680, 760, 500, 760, solid("#FFF7ED"), 42),
        text("paper-title", "Research notes", 735, 840, 360, 50, 36, "#7C2D12", "left", 870),
        ...Array.from({ length: 7 }, (_, index) => shape(`paper-note-line-${index}`, 735, 925 + index * 70, 335 - (index % 3) * 60, 20, solid(index === 0 ? "#B85B3F" : "#D6A184"), 10)),
        shape("paper-cite-card", 740, 1330, 340, 120, solid("#FCD9C2"), 28),
        shape("paper-cite-line", 780, 1380, 240, 18, solid("#A35B42"), 9),
        text("bottom-copy", "長い思考を、読みやすい形に", 120, 2190, 900, 80, 46, "#FFF7ED", "left", 820)
      ]),
      slide(slug, 2, "workflow", [
        { ...base, id: "bg", type: "background", fill: solid("#C86845") },
        text("headline", "資料も会話も\n流れで整理", 90, 130, 900, 180, 70, "#FFF7ED", "left", 900),
        device("device", 140, 610, 520, 1120),
        ...aiChatDetails("claude-chat", 140, 610, 520).slice(0, 12),
        shape("doc-stack-1", 650, 650, 420, 620, solid("#FFF7ED"), 38, 0.95, 5),
        shape("doc-stack-2", 720, 920, 420, 620, solid("#FCD9C2"), 38, 0.95, -4),
        text("doc-label", "PDF要約", 725, 760, 260, 56, 44, "#7C2D12", "center", 900),
        ...Array.from({ length: 5 }, (_, index) => shape(`doc-line-${index}`, 720, 855 + index * 82, 290 - (index % 2) * 55, 20, solid(index % 2 ? "#D6A184" : "#A35B42"), 10)),
        ...appSurfaceDetails("doc", 700, 1430, config)
      ]),
      slide(slug, 3, "cta", [
        { ...base, id: "bg", type: "background", fill: grad("#AA4E35", "#E6A17F", 120) },
        text("headline", "自分のペースで\n深く進める", 110, 160, 900, 180, 70, "#FFF7ED", "left", 900),
        image("editorial-hero", assetId, 125, 450, 1040, 1180, 62),
        shape("answer-card", 180, 1460, 930, 500, solid("#FFF7ED"), 54),
        ...appSurfaceDetails("answer", 260, 1560, config),
        text("bottom-copy", "落ち着いた表現で信頼をつくる", 130, 2220, 930, 70, 42, "#FFF7ED", "center", 800)
      ])
    ];
  }

  if (config.pattern === "jihanpi-steps") {
    return [
      slide(slug, 1, "benefit", [
        ...simpleHeader(config, "自販機を\nアプリでもっと便利に", "left"),
        image("vending-hero", assetId, 70, 450, 1140, 1200, 66),
        ...Array.from({ length: 8 }, (_, index) => shape(`drink-chip-${index}`, 155 + (index % 4) * 245, 1290 + Math.floor(index / 4) * 110, 185, 78, solid(index % 2 ? "#FFFFFF" : "#CFFAFE"), 39)),
        text("large-number", "14種類", 250, 1510, 760, 130, 116, config.accent, "center", 950),
        shape("number-underline", 350, 1645, 560, 32, solid(config.accent), 16, 0.24),
        text("drink-copy", "選べるドリンクをアプリで確認", 240, 1715, 800, 58, 44, "#0E7490", "center", 880),
        text("bottom-copy", "選べる商品を大きく、迷わず伝える", 140, 2180, 960, 80, 44, "#0E7490", "center", 820)
      ]),
      slide(slug, 2, "workflow", [
        ...simpleHeader(config, "3STEPで\nすぐ使える", "center"),
        shape("step-board-bg", 70, 560, 1150, 1360, solid("#ECFEFF"), 56),
        ...Array.from({ length: 3 }, (_, index) => shape(`step-board-${index}`, 120 + index * 370, 610, 310, 930, solid("#FFFFFF"), 48)),
        ...Array.from({ length: 3 }, (_, index) => text(`step-num-${index}`, String(index + 1), 210 + index * 370, 725, 130, 110, 96, config.accent, "center", 940)),
        ...Array.from({ length: 3 }, (_, index) => shape(`step-icon-${index}`, 205 + index * 370, 930, 140, 140, solid("#CFFAFE"), 38)),
        ...Array.from({ length: 3 }, (_, index) => shape(`step-arrow-${index}`, 395 + index * 370, 985, 86, 24, solid(config.accent), 12, index === 2 ? 0 : 0.82)),
        text("step-title-a", "選ぶ", 185, 1120, 180, 62, 52, "#0F172A", "center", 900),
        text("step-title-b", "支払う", 535, 1120, 220, 62, 52, "#0F172A", "center", 900),
        text("step-title-c", "受け取る", 890, 1120, 260, 62, 52, "#0F172A", "center", 900),
        ...Array.from({ length: 6 }, (_, index) => shape(`step-line-${index}`, 178 + (index % 3) * 370, 1255 + Math.floor(index / 3) * 105, 190, 26, solid(index % 2 ? "#CBD5E1" : config.accent), 13, 0.7)),
        text("step-copy", "選ぶ  支払う  受け取る", 170, 1740, 950, 78, 54, "#0F172A", "center", 900)
      ]),
      slide(slug, 3, "cta", [
        ...simpleHeader(config, "ダウンロードから\n最短1分", "left"),
        device("device", 150, 620, 540, 1170),
        ...phoneUi("device", 150, 620, 540, config),
        text("minute", "1分", 720, 820, 360, 170, 134, config.accent, "center", 950),
        shape("cta-pill", 745, 1090, 300, 86, solid(config.accent), 43),
        text("cta-label", "すぐ使える", 795, 1118, 200, 34, 30, "#FFFFFF", "center", 880),
        ...appSurfaceDetails("vending", 680, 1370, config)
      ])
    ];
  }

  if (config.pattern === "threads-dark") {
    return [
      slide(slug, 1, "benefit", [
        { ...base, id: "bg", type: "background", fill: solid("#050505") },
        text("headline", "気になる話題を\nすぐ追える", 90, 130, 920, 180, 68, "#FFFFFF", "left", 900),
        device("device", 250, 560, 720, 1560),
        ...phoneUi("device", 250, 560, 720, config, true),
        image("feed-card", assetId, 620, 900, 560, 780, 52, 1, 4)
      ]),
      slide(slug, 2, "feature", [
        { ...base, id: "bg", type: "background", fill: solid("#050505") },
        text("headline", "新しい視点を\n見つけよう", 90, 130, 920, 180, 68, "#FFFFFF", "left", 900),
        image("feed-hero", assetId, 70, 440, 1150, 1260, 56),
        ...Array.from({ length: 6 }, (_, index) => shape(`feed-bubble-${index}`, 185 + (index % 2) * 180, 1620 + index * 88, 540 - (index % 3) * 80, 54, solid(index % 2 ? "#FFFFFF" : "#111827"), 27)),
        text("bottom-copy", "黒背景に、会話のリズムを強く見せる", 140, 2240, 950, 70, 40, "#D4AF37", "center", 820)
      ]),
      slide(slug, 3, "cta", [
        { ...base, id: "bg", type: "background", fill: solid("#050505") },
        text("headline", "自分に合った\n会話へ", 90, 130, 920, 180, 68, "#FFFFFF", "left", 900),
        shape("thread-stack", 150, 560, 980, 1180, solid("#111111"), 52),
        ...Array.from({ length: 9 }, (_, index) => shape(`thread-row-${index}`, 230 + (index % 2) * 120, 670 + index * 115, 620 - (index % 3) * 90, 62, solid(index % 3 === 0 ? config.accent : "#FFFFFF"), 31)),
        device("device", 700, 1340, 420, 910),
        ...phoneUi("device", 700, 1340, 420, config, true).slice(0, 8)
      ])
    ];
  }

  if (config.pattern === "official-utility") {
    return [
      slide(slug, 1, "benefit", [
        ...simpleHeader(config, "手続きをスマホで\nすばやく確認", "left"),
        shape("official-sky-panel", 70, 520, 1150, 1450, solid("#DFF2FF"), 62, 0.88),
        image("portal-card", assetId, 100, 560, 610, 760, 56),
        device("device", 640, 560, 520, 1120),
        ...phoneUi("device", 640, 560, 520, config),
        shape("official-id-card", 150, 1350, 470, 300, solid("#FFFFFF"), 44),
        shape("official-id-photo", 200, 1428, 130, 130, solid("#DBEAFE"), 28),
        shape("official-id-line-1", 365, 1445, 190, 24, solid(config.accent), 12),
        shape("official-id-line-2", 365, 1502, 150, 20, solid("#CBD5E1"), 10),
        shape("official-id-line-3", 200, 1608, 315, 20, solid("#93C5FD"), 10),
        shape("blue-cta", 690, 1390, 410, 92, solid(config.accent), 46),
        text("blue-cta-label", "手続きへ進む", 756, 1418, 278, 38, 32, "#FFFFFF", "center", 880),
        ...Array.from({ length: 3 }, (_, index) => shape(`official-status-card-${index}`, 155 + index * 315, 1760, 260, 150, solid(index % 2 ? "#FFFFFF" : "#EFF6FF"), 34)),
        ...Array.from({ length: 3 }, (_, index) => shape(`official-status-dot-${index}`, 195 + index * 315, 1808, 46, 46, solid(config.accent), 23)),
        ...Array.from({ length: 3 }, (_, index) => shape(`official-status-line-${index}`, 260 + index * 315, 1818, 100, 22, solid("#93C5FD"), 11)),
        text("bottom-copy", "カード・証明・申請状況を同じ導線で", 140, 2180, 960, 76, 42, "#1D4ED8", "center", 820)
      ]),
      slide(slug, 2, "workflow", [
        ...simpleHeader(config, "必要な情報を\nまとめて表示", "center"),
        shape("official-board-bg", 70, 500, 1150, 1450, solid("#FFFFFF"), 64, 0.78),
        image("official-board", assetId, 90, 530, 540, 660, 52),
        ...Array.from({ length: 6 }, (_, index) => shape(`procedure-card-${index}`, 665 + (index % 2) * 245, 560 + Math.floor(index / 2) * 220, 210, 170, solid(index % 2 ? "#EFF6FF" : "#FFFFFF"), 32)),
        ...Array.from({ length: 6 }, (_, index) => shape(`procedure-icon-${index}`, 715 + (index % 2) * 245, 610 + Math.floor(index / 2) * 220, 55, 55, solid(config.accent), 18)),
        ...Array.from({ length: 6 }, (_, index) => shape(`procedure-line-${index}`, 715 + (index % 2) * 245, 700 + Math.floor(index / 2) * 220, 120, 18, solid(index % 2 ? "#CBD5E1" : config.accent), 9)),
        shape("timeline-rail", 190, 1300, 900, 18, solid("#BFDBFE"), 9),
        ...Array.from({ length: 4 }, (_, index) => shape(`timeline-node-${index}`, 190 + index * 300, 1267, 82, 82, solid(index === 1 ? config.accent : "#FFFFFF"), 41)),
        text("timeline-1", "本人確認", 130, 1405, 210, 52, 34, "#0F172A", "center", 850),
        text("timeline-2", "証明取得", 430, 1405, 210, 52, 34, "#0F172A", "center", 850),
        text("timeline-3", "申請状況", 730, 1405, 210, 52, 34, "#0F172A", "center", 850),
        shape("official-cta", 430, 1690, 430, 88, solid(config.accent), 44),
        text("official-cta-label", "確認へ進む", 505, 1718, 280, 34, 30, "#FFFFFF", "center", 880),
        text("bottom-copy", "本人確認、証明、申請状況を整理", 160, 2220, 950, 76, 44, "#1D4ED8", "center", 820)
      ]),
      slide(slug, 3, "trust", [
        ...simpleHeader(config, "迷わず進める\n公式手続き", "left"),
        shape("qr-panel", 110, 560, 500, 610, solid("#FFFFFF"), 48),
        ...Array.from({ length: 25 }, (_, index) => shape(`qr-cell-${index}`, 175 + (index % 5) * 64, 645 + Math.floor(index / 5) * 64, 40, 40, solid(index % 3 ? config.accent : "#DBEAFE"), 8)),
        text("qr-label", "QRログイン", 215, 1090, 280, 50, 36, "#1D4ED8", "center", 900),
        device("device", 625, 560, 520, 1120),
        ...phoneUi("device", 625, 560, 520, config),
        shape("notice-card", 145, 1280, 950, 230, solid("#FFFFFF"), 44),
        text("notice-title", "通知で見落としを防ぐ", 210, 1360, 680, 56, 46, "#0F172A", "left", 880),
        shape("notice-line", 210, 1448, 520, 22, solid("#93C5FD"), 11),
        ...appSurfaceDetails("portal", 200, 1600, config),
        text("bottom-copy", "公式サービスらしい安心感を、青い導線で統一", 145, 2240, 970, 70, 40, "#1D4ED8", "center", 820)
      ])
    ];
  }

  if (config.pattern === "finance-green") {
    return [
      slide(slug, 1, "benefit", [
        ...simpleHeader(config, "残高と履歴を\nひと目で確認", "left"),
        shape("finance-mint-panel", 70, 505, 1150, 1470, solid("#ECFDF5"), 64, 0.9),
        image("finance-hero", assetId, 90, 520, 590, 760, 58),
        shape("balance-hero-card", 610, 600, 520, 520, solid("#FFFFFF"), 56),
        text("finance-big", "1,600万", 670, 735, 400, 100, 86, config.accent, "center", 940),
        text("finance-caption", "口座登録実績", 705, 855, 330, 50, 34, "#166534", "center", 850),
        shape("finance-graph-a", 690, 1010, 320, 26, solid(config.accent), 13, 0.75, -10),
        shape("finance-graph-b", 760, 960, 250, 24, solid("#86EFAC"), 12, 0.75, 8),
        shape("finance-chip-a", 185, 1365, 250, 72, solid("#DCFCE7"), 36),
        shape("finance-chip-b", 520, 1365, 250, 72, solid("#FFFFFF"), 36),
        shape("finance-chip-c", 855, 1365, 250, 72, solid("#DCFCE7"), 36),
        text("chip-a-label", "残高", 247, 1387, 126, 34, 30, "#166534", "center", 850),
        text("chip-b-label", "入出金", 582, 1387, 126, 34, 30, "#166534", "center", 850),
        text("chip-c-label", "送金", 917, 1387, 126, 34, 30, "#166534", "center", 850),
        shape("finance-proof-card", 235, 1585, 820, 250, solid("#FFFFFF"), 46),
        text("finance-proof-title", "今月の流れ", 315, 1660, 330, 48, 40, "#0F172A", "left", 860),
        shape("finance-proof-line-a", 315, 1750, 500, 26, solid(config.accent), 13),
        shape("finance-proof-line-b", 315, 1810, 330, 22, solid("#BBF7D0"), 11),
        text("bottom-copy", "数字を大きく、安心感はやわらかく", 150, 2180, 930, 76, 44, "#166534", "center", 820)
      ]),
      slide(slug, 2, "feature", [
        ...simpleHeader(config, "いつでも\n残高を確認", "center"),
        shape("phone-halo", 260, 520, 760, 1260, solid("#DCFCE7"), 80, 0.7),
        device("device", 365, 560, 560, 1210),
        ...phoneUi("device", 365, 560, 560, config),
        shape("balance-card", 150, 1510, 990, 360, solid("#FFFFFF"), 54),
        text("balance-number", "¥128,400", 260, 1605, 760, 90, 82, config.accent, "center", 940),
        ...Array.from({ length: 4 }, (_, index) => shape(`mini-balance-row-${index}`, 250, 1740 + index * 55, 590 - index * 65, 20, solid(index % 2 ? "#BBF7D0" : config.accent), 10, 0.75)),
        shape("balance-badge", 820, 1465, 210, 86, solid(config.accent), 43),
        text("balance-badge-label", "更新", 870, 1491, 110, 34, 30, "#FFFFFF", "center", 880)
      ]),
      slide(slug, 3, "trust", [
        ...simpleHeader(config, "送金記録も\nまとめて管理", "left"),
        shape("graph-board", 100, 570, 1090, 850, solid("#FFFFFF"), 54),
        text("graph-value", "¥128,400", 220, 700, 720, 88, 78, config.accent, "center", 940),
        shape("graph-line-a", 230, 1110, 720, 28, solid(config.accent), 14, 0.82, -9),
        shape("graph-line-b", 230, 980, 580, 28, solid("#86EFAC"), 14, 0.82, 8),
        shape("graph-line-c", 300, 1220, 530, 22, solid("#BBF7D0"), 11, 0.9, 4),
        ...Array.from({ length: 6 }, (_, index) => shape(`graph-bar-${index}`, 220 + index * 125, 1260 - index * 35, 60, 90 + index * 35, solid(index % 2 ? "#86EFAC" : config.accent), 18, 0.76)),
        ...Array.from({ length: 6 }, (_, index) => shape(`history-row-${index}`, 170, 1510 + index * 112, 940, 82, solid(index % 2 ? "#DCFCE7" : "#F8FAFC"), 30)),
        ...Array.from({ length: 6 }, (_, index) => shape(`history-dot-${index}`, 218, 1535 + index * 112, 32, 32, solid(config.accent), 16)),
        ...Array.from({ length: 6 }, (_, index) => shape(`history-line-${index}`, 290, 1538 + index * 112, 500 - (index % 2) * 120, 24, solid(index % 2 ? "#86EFAC" : "#CBD5E1"), 12)),
        ...Array.from({ length: 6 }, (_, index) => text(`history-yen-${index}`, index % 2 ? "-1,200" : "+8,000", 840, 1528 + index * 112, 180, 36, 30, index % 2 ? "#166534" : config.accent, "right", 850)),
        text("bottom-copy", "履歴の見落としを減らす設計", 160, 2230, 900, 70, 42, "#166534", "center", 820)
      ])
    ];
  }

  return [phoneSlide(1, config, slug, assetId), middleSlide(config, slug, assetId), phoneSlide(3, config, slug, assetId)];
}

async function main() {
  await mkdir(outputRoot, { recursive: true });
  for (let index = 0; index < refs.length; index += 1) {
    const ref = refs[index];
    const config = configs[ref.appName] ?? { pattern: "clean-ai", from: "#F8FAFC", to: "#EFF6FF", accent: "#2563EB", headline: "価値を伝える", sub: ref.category };
    const slug = safe(`${index + 1}-${ref.appName}`);
    const dir = join(outputRoot, slug);
    const assetDir = join(dir, "assets/generated");
    await mkdir(assetDir, { recursive: true });
    const assetId = `generated-${slug}`;
    const useImagegenSheet = Boolean(imagegenSheet && existsSync(imagegenSheet));
    const assetPath = `assets/generated/${assetId}.${useImagegenSheet ? "png" : "svg"}`;
    const assetWidth = useImagegenSheet ? 900 : 900;
    const assetHeight = useImagegenSheet ? 1200 : 700;
    if (useImagegenSheet && imagegenSheet) {
      execFileSync("python3", [
        "-c",
        [
          "from PIL import Image",
          "import sys",
          "src, idx, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]",
          "im = Image.open(src).convert('RGB')",
          "cols, rows = 5, 2",
          "tw, th = im.width // cols, im.height // rows",
          "col, row = idx % cols, idx // cols",
          "box = (col * tw, row * th, im.width if col == cols - 1 else (col + 1) * tw, im.height if row == rows - 1 else (row + 1) * th)",
          "crop = im.crop(box)",
          "crop = crop.resize((900, 1200), Image.Resampling.LANCZOS)",
          "crop.save(out)"
        ].join("; ")
        ,
        imagegenSheet,
        String(index),
        join(dir, assetPath)
      ]);
    } else {
      await writeFile(join(dir, assetPath), svgAsset(assetKind(config.pattern), config));
    }
    const dark = config.pattern === "threads-dark";
    const project = {
      schemaVersion: "0.1.0",
      projectId: `top10-v3-${slug}`,
      name: `${ref.appName} inspired v3`,
      brand: { colors: { primary: config.accent, background: config.from, accent: config.accent, ink: dark ? "#F8FAFC" : "#0F172A" }, fontFamily: "Inter", tone: "top appstore inspired" },
      app: { name: ref.appName, category: ref.category, shortDescription: `${ref.appName} top10 reconstruction`, targetAudience: "App Store users" },
      locales: ["ja-JP"],
      platforms: ["ios"],
      assets: [],
      generatedImageAssets: [{
        id: assetId,
        type: "generated-image",
        path: assetPath,
        width: assetWidth,
        height: assetHeight,
        alt: `${ref.appName} original reference-style hero`,
        generated: { provider: useImagegenSheet ? "codex-imagegen" : "openstoreshot-local-benchmark", model: useImagegenSheet ? "gpt-imagegen-concept-sheet" : "svg-template-v1", prompt: `Original ${config.pattern} hero inspired by ${ref.appName} high-level App Store pattern`, createdAt: new Date().toISOString(), source: useImagegenSheet ? { sheet: imagegenSheet, tileIndex: index } : {} }
      }],
      referenceInspirations: [{ id: `ref-${ref.id}`, source: ref.storeUrl ?? "appstore", platform: "ios", inspirationOnly: true, appName: ref.appName, patterns: { composition: config.pattern === "playful-social" ? "3枚連結パノラマ / playful social collage" : config.pattern, seriesSystem: "App Store top 10 original reconstruction" } }],
      slides: top10Slides(config, slug, assetId),
      exportTargets: [1, 2, 3].map((number) => ({ id: `ios-ja-${number}`, platform: "ios", locale: "ja-JP", artboardId: `ios-${slug}-${number}`, format: "png", outputDir: "exports/ios" })),
      validationResults: []
    };
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "storeshot.project.json"), `${JSON.stringify(project, null, 2)}\n`);
  }
  console.log(outputRoot);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
