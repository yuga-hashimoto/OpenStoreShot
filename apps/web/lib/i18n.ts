export const locales = [
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
] as const;

export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, string> = {
  "ja-JP": "日本語",
  en: "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  ko: "한국어",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  "pt-BR": "Português",
  it: "Italiano",
  ru: "Русский",
  id: "Bahasa Indonesia",
  hi: "हिन्दी"
};

const ja = {
  "nav.storeImages": "ストア画像",
  "nav.assets": "素材",
  "nav.references": "参考",
  "nav.brand": "ブランド",
  "nav.json": "JSON",
  "top.preview": "プレビュー",
  "top.validate": "検証",
  "top.export": "書き出し",
  "top.exporting": "書き出し中",
  "sidebar.addStoreImage": "ストア画像を追加",
  "sidebar.layer": "レイヤー",
  "templates.title": "構成タイプ",
  "templates.description": "1枚完結だけでなく、複数枚で世界観を作るストア画像も作れます。",
  "templates.panorama": "3枚連結パノラマ",
  "templates.feature": "機能訴求",
  "templates.editorial": "プレミアム余白",
  "manual.title": "手動調整",
  "manual.empty": "キャンバスかレイヤー一覧で、見出し・補足コピー・端末を選ぶと編集できます。",
  "codex.title": "Codexへの修正指示",
  "codex.description": "手動で少し直してもいいし、言葉で依頼してCodexに直させてもいいです。",
  "assets.title": "素材",
  "assets.upload": "スクショをアップロード",
  "references.title": "参考ギャラリー",
  "brand.title": "ブランド",
  "json.title": "プロジェクトJSON",
  "json.description": "現在のストア画像データを確認できます。細かい修正をCodexに依頼するときの確認用です。",
  "right.title": "出力チェック",
  "right.selected": "選択中",
  "right.summary": "検証サマリー",
  "right.errors": "エラー",
  "right.warnings": "警告",
  "footer.noFatal": "致命的な検証エラーはありません",
  "language.label": "表示言語"
} as const;

type MessageKey = keyof typeof ja;
type Messages = Record<MessageKey, string>;

const partialMessages: Record<Exclude<Locale, "ja-JP">, Partial<Messages>> = {
  en: {
    "nav.storeImages": "Store images",
    "nav.assets": "Assets",
    "nav.references": "References",
    "nav.brand": "Brand",
    "nav.json": "JSON",
    "top.preview": "Preview",
    "top.validate": "Validate",
    "top.export": "Export",
    "top.exporting": "Exporting",
    "sidebar.addStoreImage": "Add store image",
    "sidebar.layer": "Layers",
    "templates.title": "Layout types",
    "templates.description": "Build single images or connected multi-image store stories.",
    "templates.panorama": "3-image panorama",
    "templates.feature": "Feature story",
    "templates.editorial": "Premium editorial",
    "manual.title": "Manual edits",
    "manual.empty": "Select a headline, copy, device, or background on the canvas or layer list.",
    "codex.title": "Ask Codex to revise",
    "codex.description": "Make small manual edits here, or describe the change and let Codex revise the project.",
    "assets.title": "Assets",
    "assets.upload": "Upload screenshot",
    "references.title": "Reference Gallery",
    "brand.title": "Brand",
    "json.title": "Project JSON",
    "json.description": "Inspect the current store image data. Useful when asking Codex for precise edits.",
    "right.title": "Output checks",
    "right.selected": "Selected",
    "right.summary": "Validation summary",
    "right.errors": "Errors",
    "right.warnings": "Warnings",
    "footer.noFatal": "No fatal validation errors",
    "language.label": "Language"
  },
  "zh-CN": {
    "nav.storeImages": "商店图片",
    "nav.assets": "素材",
    "nav.references": "参考",
    "nav.brand": "品牌",
    "top.preview": "预览",
    "top.validate": "校验",
    "top.export": "导出",
    "assets.upload": "上传截图",
    "references.title": "参考图库",
    "json.title": "项目 JSON",
    "language.label": "界面语言"
  },
  "zh-TW": {
    "nav.storeImages": "商店圖片",
    "nav.assets": "素材",
    "nav.references": "參考",
    "nav.brand": "品牌",
    "top.preview": "預覽",
    "top.validate": "驗證",
    "top.export": "匯出",
    "assets.upload": "上傳截圖",
    "references.title": "參考圖庫",
    "json.title": "專案 JSON",
    "language.label": "介面語言"
  },
  ko: {
    "nav.storeImages": "스토어 이미지",
    "nav.assets": "에셋",
    "nav.references": "레퍼런스",
    "nav.brand": "브랜드",
    "top.preview": "미리보기",
    "top.validate": "검증",
    "top.export": "내보내기",
    "assets.upload": "스크린샷 업로드",
    "references.title": "레퍼런스 갤러리",
    "json.title": "프로젝트 JSON",
    "language.label": "표시 언어"
  },
  es: {
    "nav.storeImages": "Imágenes",
    "nav.assets": "Recursos",
    "nav.references": "Referencias",
    "nav.brand": "Marca",
    "top.preview": "Vista previa",
    "top.validate": "Validar",
    "top.export": "Exportar",
    "assets.upload": "Subir captura",
    "references.title": "Galería de referencias",
    "json.title": "JSON del proyecto",
    "language.label": "Idioma"
  },
  fr: {
    "nav.storeImages": "Images store",
    "nav.assets": "Ressources",
    "nav.references": "Références",
    "nav.brand": "Marque",
    "top.preview": "Aperçu",
    "top.validate": "Valider",
    "top.export": "Exporter",
    "assets.upload": "Importer une capture",
    "references.title": "Galerie de références",
    "json.title": "JSON du projet",
    "language.label": "Langue"
  },
  de: {
    "nav.storeImages": "Store-Bilder",
    "nav.assets": "Assets",
    "nav.references": "Referenzen",
    "nav.brand": "Marke",
    "top.preview": "Vorschau",
    "top.validate": "Prüfen",
    "top.export": "Exportieren",
    "assets.upload": "Screenshot hochladen",
    "references.title": "Referenzgalerie",
    "json.title": "Projekt-JSON",
    "language.label": "Sprache"
  },
  "pt-BR": {
    "nav.storeImages": "Imagens da loja",
    "nav.assets": "Assets",
    "nav.references": "Referências",
    "nav.brand": "Marca",
    "top.preview": "Prévia",
    "top.validate": "Validar",
    "top.export": "Exportar",
    "assets.upload": "Enviar screenshot",
    "references.title": "Galeria de referências",
    "json.title": "JSON do projeto",
    "language.label": "Idioma"
  },
  it: {
    "nav.storeImages": "Immagini store",
    "nav.assets": "Risorse",
    "nav.references": "Riferimenti",
    "nav.brand": "Brand",
    "top.preview": "Anteprima",
    "top.validate": "Valida",
    "top.export": "Esporta",
    "assets.upload": "Carica screenshot",
    "references.title": "Galleria riferimenti",
    "json.title": "JSON progetto",
    "language.label": "Lingua"
  },
  ru: {
    "nav.storeImages": "Изображения",
    "nav.assets": "Материалы",
    "nav.references": "Референсы",
    "nav.brand": "Бренд",
    "top.preview": "Предпросмотр",
    "top.validate": "Проверить",
    "top.export": "Экспорт",
    "assets.upload": "Загрузить скриншот",
    "references.title": "Галерея референсов",
    "json.title": "JSON проекта",
    "language.label": "Язык"
  },
  id: {
    "nav.storeImages": "Gambar toko",
    "nav.assets": "Aset",
    "nav.references": "Referensi",
    "nav.brand": "Brand",
    "top.preview": "Pratinjau",
    "top.validate": "Validasi",
    "top.export": "Ekspor",
    "assets.upload": "Unggah screenshot",
    "references.title": "Galeri referensi",
    "json.title": "JSON proyek",
    "language.label": "Bahasa"
  },
  hi: {
    "nav.storeImages": "स्टोर इमेज",
    "nav.assets": "एसेट",
    "nav.references": "रेफरेंस",
    "nav.brand": "ब्रांड",
    "top.preview": "प्रीव्यू",
    "top.validate": "जांचें",
    "top.export": "एक्सपोर्ट",
    "assets.upload": "स्क्रीनशॉट अपलोड करें",
    "references.title": "रेफरेंस गैलरी",
    "json.title": "प्रोजेक्ट JSON",
    "language.label": "भाषा"
  }
};

export function messagesFor(locale: Locale): Messages {
  if (locale === "ja-JP") return ja;
  return { ...ja, ...partialMessages[locale] };
}

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
