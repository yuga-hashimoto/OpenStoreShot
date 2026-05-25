"use client";

import { create } from "zustand";
import type { Layer, StoreShotProject } from "@openstoreshot/core";
import { demoProject } from "./demoProject";

type HistoryState = {
  past: StoreShotProject[];
  future: StoreShotProject[];
};

type StudioState = {
  project: StoreShotProject;
  selectedSlideId: string;
  selectedArtboardId: string;
  selectedLayerIds: string[];
  zoom: number;
  history: HistoryState;
  selectSlide: (slideId: string) => void;
  addStoreImage: () => void;
  applyStoreImageTemplate: (template: "panorama" | "feature" | "editorial") => void;
  selectLayer: (layerId: string) => void;
  updateLayer: (layerId: string, patch: Partial<Layer>) => void;
  addAsset: (asset: StoreShotProject["assets"][number]) => void;
  createObjectLayersFromAsset: (asset: StoreShotProject["assets"][number], colors: string[]) => void;
  duplicateLayer: (layerId: string) => void;
  deleteLayer: (layerId: string) => void;
  undo: () => void;
  redo: () => void;
  setZoom: (zoom: number) => void;
};

function activeArtboard(project: StoreShotProject, slideId: string, artboardId: string) {
  const slide = project.slides.find((item) => item.id === slideId) ?? project.slides[0]!;
  const artboard = slide.artboards.find((item) => item.id === artboardId) ?? slide.artboards[0]!;
  return { slide, artboard };
}

function commit(state: StudioState, project: StoreShotProject): Partial<StudioState> {
  return { project, history: { past: [...state.history.past, state.project].slice(-40), future: [] } };
}

function fillLayerDefaults(layer: Partial<Layer> & Pick<Layer, "id" | "type">): Layer {
  return {
    x: 0,
    y: 0,
    rotation: 0,
    radius: 0,
    opacity: 1,
    letterSpacing: 0,
    locked: false,
    hidden: false,
    children: [],
    ...layer
  } as Layer;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  project: demoProject,
  selectedSlideId: demoProject.slides[0]!.id,
  selectedArtboardId: demoProject.slides[0]!.artboards[0]!.id,
  selectedLayerIds: ["headline"],
  zoom: 0.2,
  history: { past: [], future: [] },
  selectSlide: (slideId) => {
    const slide = get().project.slides.find((item) => item.id === slideId);
    if (!slide) return;
    set({ selectedSlideId: slideId, selectedArtboardId: slide.artboards[0]?.id ?? "", selectedLayerIds: [] });
  },
  addStoreImage: () => {
    const state = get();
    const project = structuredClone(state.project);
    const sourceSlide = project.slides.find((item) => item.id === state.selectedSlideId) ?? project.slides.at(-1);
    if (!sourceSlide) return;
    const nextNumber = project.slides.length + 1;
    let nextId = `store-image-${String(nextNumber).padStart(2, "0")}`;
    while (project.slides.some((item) => item.id === nextId)) {
      nextId = `store-image-${Date.now()}`;
    }
    const newSlide = structuredClone(sourceSlide);
    newSlide.id = nextId;
    newSlide.title = `新しいストア画像 ${nextNumber}`;
    newSlide.role = "feature";
    newSlide.localeText = {};
    for (const artboard of newSlide.artboards) {
      for (const layer of artboard.layers) {
        if (layer.id === "headline") layer.text = "新しい魅力を伝える";
        if (layer.id === "subtitle") layer.text = "ここにストア画像の補足コピーを入れます。";
        if (layer.type === "device") layer.screenshotAssetId = undefined;
      }
    }
    project.slides.push(newSlide);
    set({
      ...commit(state, project),
      selectedSlideId: newSlide.id,
      selectedArtboardId: newSlide.artboards[0]?.id ?? "",
      selectedLayerIds: ["headline"]
    });
  },
  applyStoreImageTemplate: (template) => {
    const state = get();
    const project = structuredClone(state.project);
    const selectedSlide = project.slides.find((item) => item.id === state.selectedSlideId) ?? project.slides[0];
    if (!selectedSlide) return;

    if (template === "panorama") {
      const titles = ["世界観をひと目で", "操作の流れを自然に", "最後に価値が伝わる"];
      project.slides.slice(0, 3).forEach((slide, slideIndex) => {
        slide.title = `連結パノラマ ${slideIndex + 1}/3`;
        slide.role = slideIndex === 0 ? "benefit" : slideIndex === 1 ? "workflow" : "cta";
        for (const artboard of slide.artboards) {
          artboard.layers = artboard.layers.filter((layer) => !layer.id.startsWith("panorama-"));
          const background = artboard.layers.find((layer) => layer.type === "background");
          if (background) {
            background.fill = { type: "gradient", from: "#ECFEFF", to: "#F8FAFC", angle: 125 };
          }
          const panoramaShape = fillLayerDefaults({
            id: `panorama-ribbon-${slideIndex + 1}`,
            type: "shape",
            name: "連結パノラマ背景",
            x: -artboard.width * (0.58 * slideIndex) + artboard.width * 0.12,
            y: artboard.height * 0.38,
            width: artboard.width * 1.9,
            height: artboard.height * 0.28,
            rotation: -16,
            radius: artboard.width * 0.08,
            opacity: 0.62,
            fill: { type: "gradient", from: "#99F6E4", to: "#FDE68A", angle: 135 }
          });
          const insertIndex = Math.max(1, artboard.layers.findIndex((layer) => layer.type !== "background"));
          artboard.layers.splice(insertIndex, 0, panoramaShape);
          const headline = artboard.layers.find((layer) => layer.id === "headline");
          if (headline) {
            headline.text = titles[slideIndex] ?? "つながる体験";
            headline.y = Math.round(artboard.height * 0.07);
            headline.fontSize = Math.round(Math.min(artboard.width * 0.072, 88));
          }
          const subtitle = artboard.layers.find((layer) => layer.id === "subtitle");
          if (subtitle) subtitle.text = "3枚を横に並べると、ひとつのビジュアルとしてつながります。";
          const device = artboard.layers.find((layer) => layer.type === "device");
          if (device) device.x = Math.round(artboard.width * (0.18 + slideIndex * 0.08));
        }
      });
      const first = project.slides[0];
      set({
        ...commit(state, project),
        selectedSlideId: first?.id ?? state.selectedSlideId,
        selectedArtboardId: first?.artboards[0]?.id ?? state.selectedArtboardId,
        selectedLayerIds: ["headline"]
      });
      return;
    }

    for (const artboard of selectedSlide.artboards) {
      const background = artboard.layers.find((layer) => layer.type === "background");
      if (background) {
        background.fill = template === "editorial"
          ? { type: "gradient", from: "#F8FAFC", to: "#E2E8F0", angle: 160 }
          : { type: "gradient", from: "#DBEAFE", to: "#F0FDFA", angle: 145 };
      }
      const headline = artboard.layers.find((layer) => layer.id === "headline");
      if (headline) {
        headline.text = template === "editorial" ? "余白で魅せる\n上質な印象" : "主要機能を\nひと目で";
        headline.fontFamily = template === "editorial" ? "Hiragino Mincho ProN, Yu Mincho, serif" : "Inter";
        headline.fontSize = Math.round(Math.min(artboard.width * 0.073, 88));
        headline.y = Math.round(artboard.height * 0.07);
      }
      const subtitle = artboard.layers.find((layer) => layer.id === "subtitle");
      if (subtitle) subtitle.text = template === "editorial" ? "短い言葉と余白で、信頼感を伝えます。" : "スクショとコピーを近くに置き、機能理解を速くします。";
      const device = artboard.layers.find((layer) => layer.type === "device");
      if (device) {
        device.x = template === "editorial" ? Math.round(artboard.width * 0.26) : Math.round(artboard.width * 0.16);
        device.y = Math.round(artboard.height * 0.29);
      }
    }
    set({ ...commit(state, project), selectedLayerIds: ["headline"] });
  },
  selectLayer: (layerId) => set({ selectedLayerIds: [layerId] }),
  updateLayer: (layerId, patch) => {
    const state = get();
    const project = structuredClone(state.project);
    const { artboard } = activeArtboard(project, state.selectedSlideId, state.selectedArtboardId);
    const layer = artboard.layers.find((item) => item.id === layerId);
    if (!layer) return;
    Object.assign(layer, patch);
    set(commit(state, project));
  },
  addAsset: (asset) => {
    const state = get();
    const project = structuredClone(state.project);
    project.assets = [asset, ...project.assets.filter((item) => item.id !== asset.id)];
    set(commit(state, project));
  },
  createObjectLayersFromAsset: (asset, colors) => {
    const state = get();
    const project = structuredClone(state.project);
    const { artboard } = activeArtboard(project, state.selectedSlideId, state.selectedArtboardId);
    const timestamp = Date.now();
    const objectWidth = Math.round(artboard.width * 0.48);
    const objectHeight = Math.round(objectWidth * ((asset.height ?? 1) / Math.max(asset.width ?? 1, 1)));
    const imageLayer = fillLayerDefaults({
      id: `object-image-${timestamp}`,
      type: "image",
      name: `${asset.id} オブジェクト画像`,
      assetId: asset.id,
      x: Math.round((artboard.width - objectWidth) / 2),
      y: Math.round(artboard.height * 0.34),
      width: objectWidth,
      height: Math.min(objectHeight, Math.round(artboard.height * 0.46)),
      radius: Math.round(artboard.width * 0.035),
      opacity: 1
    });
    const swatchLayers = colors.slice(0, 5).map((color, index) => fillLayerDefaults({
      id: `object-color-${timestamp}-${index + 1}`,
      type: "shape",
      name: `抽出色 ${index + 1}`,
      x: Math.round(artboard.width * 0.14 + index * artboard.width * 0.075),
      y: Math.round(artboard.height * 0.83),
      width: Math.round(artboard.width * 0.052),
      height: Math.round(artboard.width * 0.052),
      radius: Math.round(artboard.width * 0.026),
      opacity: 0.92,
      fill: { type: "solid", color }
    }));
    const haloLayer = fillLayerDefaults({
      id: `object-halo-${timestamp}`,
      type: "shape",
      name: "画像から作成した背景オブジェクト",
      x: Math.round(artboard.width * 0.12),
      y: Math.round(artboard.height * 0.27),
      width: Math.round(artboard.width * 0.76),
      height: Math.round(artboard.height * 0.46),
      radius: Math.round(artboard.width * 0.09),
      opacity: 0.38,
      fill: { type: "gradient", from: colors[0] ?? "#DBEAFE", to: colors[1] ?? "#F0FDFA", angle: 135 }
    });
    const firstContentIndex = Math.max(1, artboard.layers.findIndex((layer) => layer.type !== "background"));
    artboard.layers.splice(firstContentIndex, 0, haloLayer);
    artboard.layers.push(imageLayer, ...swatchLayers);
    set({ ...commit(state, project), selectedLayerIds: [imageLayer.id] });
  },
  duplicateLayer: (layerId) => {
    const state = get();
    const project = structuredClone(state.project);
    const { artboard } = activeArtboard(project, state.selectedSlideId, state.selectedArtboardId);
    const layer = artboard.layers.find((item) => item.id === layerId);
    if (!layer) return;
    const copy = { ...layer, id: `${layer.id}-copy-${Date.now()}`, x: layer.x + 28, y: layer.y + 28, name: `${layer.name ?? layer.id} copy` };
    artboard.layers.push(copy);
    set({ ...commit(state, project), selectedLayerIds: [copy.id] });
  },
  deleteLayer: (layerId) => {
    const state = get();
    const project = structuredClone(state.project);
    const { artboard } = activeArtboard(project, state.selectedSlideId, state.selectedArtboardId);
    artboard.layers = artboard.layers.filter((item) => item.id !== layerId);
    set({ ...commit(state, project), selectedLayerIds: [] });
  },
  undo: () => {
    const state = get();
    const previous = state.history.past.at(-1);
    if (!previous) return;
    set({ project: previous, history: { past: state.history.past.slice(0, -1), future: [state.project, ...state.history.future] } });
  },
  redo: () => {
    const state = get();
    const next = state.history.future[0];
    if (!next) return;
    set({ project: next, history: { past: [...state.history.past, state.project], future: state.history.future.slice(1) } });
  },
  setZoom: (zoom) => set({ zoom })
}));
