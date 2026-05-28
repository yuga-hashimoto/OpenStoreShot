import type { Artboard, Layer, StoreShotProject } from "@openstoreshot/core";

export type DesignQualityIssue = {
  severity: "error" | "warning";
  message: string;
};

function isDetailLayer(layer: Layer) {
  if (layer.hidden || layer.type === "background" || layer.type === "device") return false;
  if (["headline", "subtitle", "title", "caption"].includes(layer.id)) return false;
  return layer.type === "shape" || layer.type === "text" || layer.type === "image";
}

function overlaps(a: Required<Pick<Layer, "x" | "y">> & { width: number; height: number }, b: Required<Pick<Layer, "x" | "y">> & { width: number; height: number }) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function layerBox(layer: Layer, artboard: Artboard) {
  return {
    x: layer.x,
    y: layer.y,
    width: layer.width ?? artboard.width,
    height: layer.height ?? artboard.height
  };
}

function visibleLayerBox(layer: Layer, artboard: Artboard) {
  const box = layerBox(layer, artboard);
  const x = Math.max(0, box.x);
  const y = Math.max(0, box.y);
  return {
    x,
    y,
    width: Math.max(0, Math.min(artboard.width, box.x + box.width) - x),
    height: Math.max(0, Math.min(artboard.height, box.y + box.height) - y)
  };
}

function area(box: { width: number; height: number }) {
  return Math.max(0, box.width) * Math.max(0, box.height);
}

function primaryImageSurface(artboard: Artboard) {
  const artboardArea = artboard.width * artboard.height;
  return artboard.layers.find((layer) => {
    if (layer.hidden || layer.type !== "image") return false;
    const box = layerBox(layer, artboard);
    return area(box) >= artboardArea * 0.2;
  });
}

function primaryShapeSurface(artboard: Artboard) {
  const artboardArea = artboard.width * artboard.height;
  return artboard.layers.find((layer) => {
    if (layer.hidden || layer.type !== "shape") return false;
    if (layer.id === "series-soft-band" || layer.id === "series-top-rule" || layer.id.startsWith("panorama-ribbon")) return false;
    const box = layerBox(layer, artboard);
    return area(box) >= artboardArea * 0.08;
  });
}

function largestNonDeviceSurfaceRatio(artboard: Artboard) {
  const artboardArea = artboard.width * artboard.height;
  return Math.max(
    0,
    ...artboard.layers
      .filter((layer) => {
        if (layer.hidden || layer.type === "background" || layer.type === "device") return false;
        if (layer.id === "headline" || layer.id === "subtitle") return false;
        return layer.type === "shape" || layer.type === "image";
      })
      .map((layer) => area(layerBox(layer, artboard)) / artboardArea)
  );
}

function visibleDeviceAreaRatio(artboard: Artboard, device: Layer) {
  return area(visibleLayerBox(device, artboard)) / (artboard.width * artboard.height);
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function hasIntentionalSecondaryDevicePlacement(artboard: Artboard, device: Layer) {
  const visibleDeviceArea = visibleDeviceAreaRatio(artboard, device);
  const largestNonDevice = largestNonDeviceSurfaceRatio(artboard);
  const bottom = device.y + (device.height ?? 0);
  const edgeCropped = device.y < -artboard.height * 0.04 || bottom > artboard.height + artboard.height * 0.04;
  const namedSecondary = /secondary|mini|crop|fragment|edge/i.test(device.id);
  return (edgeCropped || namedSecondary) && largestNonDevice >= 0.24 && largestNonDevice >= visibleDeviceArea * 1.35;
}

function detailLayersForArtboard(artboard: Artboard) {
  const device = artboard.layers.find((layer) => layer.type === "device" && !layer.hidden);
  const imageSurface = primaryImageSurface(artboard);
  const shapeSurface = primaryShapeSurface(artboard);
  const detailLayers = artboard.layers.filter(isDetailLayer);
  if (!device) return { device, imageSurface, shapeSurface, detailLayers, deviceDetailLayers: [] };
  const deviceBox = layerBox(device, artboard);
  const deviceDetailLayers = detailLayers.filter((layer) =>
    overlaps(
      {
        x: layer.x,
        y: layer.y,
        width: layer.width ?? 0,
        height: layer.height ?? 0
      },
      deviceBox
    )
  );
  const deepestDeviceDetail = deviceDetailLayers.reduce((max, layer) => Math.max(max, layer.y + (layer.height ?? 0)), 0);
  const visibleDeviceBox = visibleLayerBox(device, artboard);
  return { device, imageSurface, shapeSurface, detailLayers, deviceDetailLayers, deepestDeviceDetail, deviceBox, visibleDeviceBox };
}

function fillColors(layer: Layer): string[] {
  if (!layer.fill) return [];
  if (layer.fill.type === "solid") return [layer.fill.color];
  if (layer.fill.type === "gradient") return [layer.fill.from, layer.fill.to];
  return [];
}

function fillSignature(layer: Layer | undefined): string {
  if (!layer?.fill) return "none";
  if (layer.fill.type === "solid") return `solid:${layer.fill.color}`;
  if (layer.fill.type === "gradient") return `gradient:${layer.fill.from}:${layer.fill.to}:${layer.fill.angle ?? 0}`;
  return "unknown";
}

function hexToHueFamily(color: string): string | undefined {
  const match = color.match(/^#?([0-9a-f]{6})$/i);
  if (!match) return undefined;
  const value = match[1]!;
  const red = parseInt(value.slice(0, 2), 16) / 255;
  const green = parseInt(value.slice(2, 4), 16) / 255;
  const blue = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  if (delta < 0.08) return "neutral";
  let hue = 0;
  if (max === red) hue = ((green - blue) / delta) % 6;
  else if (max === green) hue = (blue - red) / delta + 2;
  else hue = (red - green) / delta + 4;
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;
  return String(Math.round(hue / 45) * 45);
}

function artboardLayoutSignature(artboard: Artboard) {
  const device = artboard.layers.find((layer) => layer.type === "device" && !layer.hidden);
  const headline = artboard.layers.find((layer) => layer.id === "headline" && !layer.hidden);
  const surface = device ?? primaryImageSurface(artboard);
  const headlineBand = headline ? Math.round((headline.y / artboard.height) * 4) : "none";
  const surfaceX = surface ? Math.round((surface.x / artboard.width) * 4) : "none";
  const surfaceSize = surface && surface.width && surface.height ? Math.round((area(layerBox(surface, artboard)) / (artboard.width * artboard.height)) * 10) : "none";
  return `${headlineBand}:${surfaceX}:${surfaceSize}`;
}

function dominantCompositionArchetype(artboard: Artboard) {
  const devices = artboard.layers.filter((layer) => layer.type === "device" && !layer.hidden);
  if (artboard.layers.some((layer) => !layer.hidden && layer.id.startsWith("panorama-"))) return "panorama";
  if (devices.length >= 2) return "multi-device";

  const artboardArea = artboard.width * artboard.height;
  const largeImage = artboard.layers.find((layer) => !layer.hidden && layer.type === "image" && area(layerBox(layer, artboard)) >= artboardArea * 0.14);
  const largeShape = artboard.layers.find((layer) => {
    if (layer.hidden || layer.type !== "shape") return false;
    if (layer.id === "series-backdrop" || layer.id === "series-soft-band" || layer.id === "series-top-rule") return false;
    return area(layerBox(layer, artboard)) >= artboardArea * 0.12;
  });
  if (largeImage && devices.length === 0) return "image-led";
  if (largeImage && devices.length === 1) {
    const device = devices[0]!;
    const imageBox = layerBox(largeImage, artboard);
    return imageBox.width * imageBox.height > (device.width ?? 0) * (device.height ?? 0) * 0.55 ? "image-device-hybrid" : "device-with-image";
  }
  if (largeShape && devices.length === 0) return "card-led";
  if (largeShape && devices.length === 1) return "device-card-hybrid";

  const device = devices[0];
  if (!device) return "surface-fragment";
  const center = device.x + (device.width ?? 0) / 2;
  if (center < artboard.width * 0.42) return "device-left";
  if (center > artboard.width * 0.58) return "device-right";
  return "device-center";
}

function outsideRatio(layer: Layer, artboard: Artboard, device?: Layer) {
  if (!device) return 1;
  const layerArea = area(layerBox(layer, artboard));
  if (layerArea <= 0) return 0;
  const overlapBox = {
    x: Math.max(layer.x, device.x),
    y: Math.max(layer.y, device.y),
    width: Math.max(0, Math.min(layer.x + (layer.width ?? 0), device.x + (device.width ?? 0)) - Math.max(layer.x, device.x)),
    height: Math.max(0, Math.min(layer.y + (layer.height ?? 0), device.y + (device.height ?? 0)) - Math.max(layer.y, device.y))
  };
  return 1 - area(overlapBox) / layerArea;
}

function hasNonPhoneHero(artboard: Artboard) {
  const artboardArea = artboard.width * artboard.height;
  const device = artboard.layers.find((layer) => layer.type === "device" && !layer.hidden);
  const heroLayer = artboard.layers.find((layer) => {
    if (layer.hidden || layer.type === "background" || layer.type === "device" || layer.id === "headline" || layer.id === "subtitle") return false;
    if (layer.type !== "shape" && layer.type !== "image") return false;
    const layerArea = area(layerBox(layer, artboard));
    return layerArea >= artboardArea * 0.1 && outsideRatio(layer, artboard, device) >= 0.55;
  });
  const floatingDetails = artboard.layers.filter((layer) => {
    if (!isDetailLayer(layer)) return false;
    const layerArea = area(layerBox(layer, artboard));
    return layerArea >= artboardArea * 0.015 && outsideRatio(layer, artboard, device) >= 0.7;
  });
  return Boolean(heroLayer) || floatingDetails.length >= 4;
}

function hasPanoramaContinuity(artboards: Artboard[]) {
  return panoramaContinuityCount(artboards) > 0;
}

function panoramaContinuityCount(artboards: Artboard[]) {
  if (artboards.length < 3) return 0;
  const firstThree = artboards.slice(0, 3);
  const widePanoramaIds = new Set<string>();
  for (const artboard of firstThree) {
    for (const layer of artboard.layers) {
      if (layer.hidden) continue;
      if (!layer.id.startsWith("panorama-") && !layer.name?.toLowerCase().includes("panorama")) continue;
      if ((layer.width ?? 0) >= artboard.width * 1.8) widePanoramaIds.add(layer.id);
    }
  }

  return [...widePanoramaIds].filter((id) => {
    const matches = firstThree.map((artboard) => artboard.layers.find((layer) => !layer.hidden && layer.id === id && (layer.width ?? 0) >= artboard.width * 1.8));
    if (matches.some((layer) => !layer)) return false;
    const xPositions = matches.map((layer) => layer!.x);
    const minStep = firstThree[0]!.width * 0.35;
    return xPositions[1]! <= xPositions[0]! - minStep && xPositions[2]! <= xPositions[1]! - minStep;
  }).length;
}

function hasAudioLiveVariation(artboards: Artboard[]) {
  if (artboards.length < 3) return false;
  return artboards.every((artboard) => artboard.layers.some((layer) => /wave|album|live|music|event|notify|notification|now/i.test(layer.id))) &&
    artboards.some((artboard) => artboard.layers.some((layer) => /wave/i.test(layer.id))) &&
    artboards.some((artboard) => artboard.layers.some((layer) => /album|event/i.test(layer.id))) &&
    artboards.some((artboard) => artboard.layers.some((layer) => /notify|notification|now/i.test(layer.id)));
}

function aiOutputVisualStats(artboards: Artboard[], generatedAssetIds: Set<string>) {
  let hasLargeOutputSurface = false;
  let maxGeneratedImageArea = 0;
  let maxOutputBoardArea = 0;
  let maxOutputDetailCount = 0;

  for (const artboard of artboards) {
    const artboardArea = artboard.width * artboard.height;
    const device = artboard.layers.find((layer) => layer.type === "device" && !layer.hidden);
    const outputSurface = artboard.layers.find((layer) => {
      if (layer.hidden || (layer.type !== "shape" && layer.type !== "image")) return false;
      if (!/ai|answer|output|generated|preview|canvas|prompt|result|board/i.test(layer.id)) return false;
      const layerArea = area(layerBox(layer, artboard)) / artboardArea;
      if (layerArea >= 0.08 && outsideRatio(layer, artboard, device) >= 0.35) {
        maxOutputBoardArea = Math.max(maxOutputBoardArea, layerArea);
        return true;
      }
      return false;
    });
    if (outputSurface) hasLargeOutputSurface = true;

    const detailCount = artboard.layers.filter((layer) => {
      if (!isDetailLayer(layer)) return false;
      if (!/ai|answer|output|generated|preview|canvas|prompt|result|board|composer|action|summary/i.test(layer.id)) return false;
      return outsideRatio(layer, artboard, device) >= 0.25;
    }).length;
    maxOutputDetailCount = Math.max(maxOutputDetailCount, detailCount);

    for (const layer of artboard.layers) {
      if (layer.hidden || layer.type !== "image" || !layer.assetId || !generatedAssetIds.has(layer.assetId)) continue;
      const layerArea = area(layerBox(layer, artboard)) / artboardArea;
      if (/ai|answer|output|generated|preview|canvas|prompt|result|board|hero/i.test(layer.id)) {
        maxGeneratedImageArea = Math.max(maxGeneratedImageArea, layerArea);
      }
    }
  }

  return {
    hasLargeOutputSurface,
    maxGeneratedImageArea,
    maxOutputBoardArea,
    maxOutputDetailCount,
    isRich:
      hasLargeOutputSurface &&
      (
        maxGeneratedImageArea >= 0.18 ||
        (maxOutputBoardArea >= 0.35 && maxGeneratedImageArea >= 0.12 && maxOutputDetailCount >= 14)
      )
  };
}

function hasLargeAiOutputVisual(artboards: Artboard[], generatedAssetIds: Set<string>) {
  return aiOutputVisualStats(artboards, generatedAssetIds).isRich;
}

function hasThreeSlideBackgroundSystem(artboards: Artboard[]) {
  const firstThree = artboards.slice(0, 3);
  if (firstThree.length < 3) return true;
  const signatures = firstThree.map((artboard) => fillSignature(artboard.layers.find((layer) => layer.type === "background" && !layer.hidden)));
  return new Set(signatures).size === 1;
}

function hasRepeatedSeriesMotif(artboards: Artboard[]) {
  if (artboards.length < 3) return true;
  const idCounts = new Map<string, number>();
  for (const artboard of artboards.slice(0, 3)) {
    const ids = new Set(
      artboard.layers
        .filter((layer) => !layer.hidden && isDetailLayer(layer))
        .map((layer) => layer.id.replace(/[-_]?(0?[1-9]|1[0-9])$/g, "").replace(/slide[-_]?\d+/gi, "slide"))
    );
    for (const id of ids) idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
  }
  return [...idCounts.entries()].filter(([id, count]) => {
    if (count < 3) return false;
    return /series|campaign|brand|motif|accent|badge|band|rail|hero|board|card|strip|panorama|wave|ticket|feed|output|preview/i.test(id);
  }).length >= 2;
}

function hasEditableBitmapPairing(project: StoreShotProject, artboards: Artboard[]) {
  const generatedAssetIds = new Set(project.generatedImageAssets.map((asset) => asset.id));
  if (generatedAssetIds.size === 0) return true;
  return artboards.some((artboard) => {
    const artboardArea = artboard.width * artboard.height;
    const generatedImage = artboard.layers.find((layer) => {
      if (layer.hidden || layer.type !== "image" || !layer.assetId || !generatedAssetIds.has(layer.assetId)) return false;
      return area(layerBox(layer, artboard)) >= artboardArea * 0.12;
    });
    if (!generatedImage) return false;
    const imageBox = layerBox(generatedImage, artboard);
    const overlays = artboard.layers.filter((layer) => {
      if (layer.hidden || (layer.type !== "shape" && layer.type !== "text")) return false;
      if (layer.id === "headline" || layer.id === "subtitle") return false;
      return overlaps(
        { x: layer.x, y: layer.y, width: layer.width ?? 0, height: layer.height ?? 0 },
        imageBox
      );
    });
    return overlays.length >= 3;
  });
}

function compactHeadlineLength(text: string) {
  return text.replace(/\s+/g, "").length;
}

function largestHeroAreaRatio(artboard: Artboard) {
  const artboardArea = artboard.width * artboard.height;
  const visualLayers = artboard.layers.filter((layer) => !layer.hidden && layer.type !== "background" && layer.id !== "headline" && layer.id !== "subtitle");
  return Math.max(
    0,
    ...visualLayers.map((layer) => area(layerBox(layer, artboard)) / artboardArea)
  );
}

function addSeriesIssues(project: StoreShotProject, issues: DesignQualityIssue[]) {
  const artboardsByPlatform = new Map<string, Artboard[]>();
  for (const slide of project.slides) {
    for (const artboard of slide.artboards) {
      artboardsByPlatform.set(artboard.platform, [...(artboardsByPlatform.get(artboard.platform) ?? []), artboard]);
    }
  }

  for (const [platform, artboards] of artboardsByPlatform) {
    const panoramaContinuityLayers = panoramaContinuityCount(artboards);
    const panoramaContinuous = panoramaContinuityLayers > 0;
    const audioLivePattern = project.referenceInspirations.some((ref) => {
      const patternText = Object.values(ref.patterns).join(" ").toLowerCase();
      return /audio-live|music|live|waveform|now playing|音楽|ライブ|波形/.test(patternText);
    });
    const aiOutputPattern = project.referenceInspirations.some((ref) => {
      const patternText = `${project.app.name} ${project.app.category} ${Object.values(ref.patterns).join(" ")}`.toLowerCase();
      return /\bai\b|assistant|chatgpt|gemini|claude|anthropic|生成ai|ai生成|会話ai|チャットai|output card|generated image|generated preview/.test(patternText);
    });
    const audioLiveVaried = audioLivePattern && hasAudioLiveVariation(artboards);
    const generatedAssetIds = new Set(project.generatedImageAssets.map((asset) => asset.id));
    const generatedHeroUses = artboards.filter((artboard) => {
      const artboardArea = artboard.width * artboard.height;
      return artboard.layers.some((layer) => {
        if (layer.hidden || layer.type !== "image" || !layer.assetId || !generatedAssetIds.has(layer.assetId)) return false;
        return area(layerBox(layer, artboard)) >= artboardArea * 0.1;
      });
    });

    const referencesNeedStrongVisuals = project.referenceInspirations.some((ref) => {
      const patternText = Object.values(ref.patterns).join(" ").toLowerCase();
      return /photo|image|visual|object|coupon|editorial|feed|panorama|collage|logo|生成|画像|写真|クーポン|紙面|人物|フィード|パノラマ|コラージュ/.test(patternText);
    });
    if (artboards.length >= 3 && referencesNeedStrongVisuals && generatedHeroUses.length === 0) {
      issues.push({ severity: "error", message: `${platform}: reference pattern calls for strong visuals, but no generatedImageAssets are used as large hero layers.` });
    } else if (artboards.length >= 3 && project.generatedImageAssets.length > 0 && generatedHeroUses.length === 0) {
      issues.push({ severity: "warning", message: `${platform}: generatedImageAssets exist but are not used as large visible hero layers.` });
    }
    if (artboards.length >= 3 && aiOutputPattern && !hasLargeAiOutputVisual(artboards, generatedAssetIds)) {
      const stats = aiOutputVisualStats(artboards, generatedAssetIds);
      issues.push({ severity: "error", message: `${platform}: AI reference needs a rich generated output hero: use a generatedImageAsset at least 18% of the artboard, or a 35%+ output board paired with a 12%+ generated visual and dense editable output details. Current generated image area=${stats.maxGeneratedImageArea.toFixed(2)}, output board area=${stats.maxOutputBoardArea.toFixed(2)}.` });
    }

    const headlineLayers = artboards
      .map((artboard) => artboard.layers.find((layer) => layer.id === "headline" && !layer.hidden))
      .filter((layer): layer is Layer => Boolean(layer));
    if (headlineLayers.length >= 3) {
      const fontSizes = headlineLayers.map((layer) => layer.fontSize ?? 0).filter((value) => value > 0);
      if (fontSizes.length >= 3 && Math.max(...fontSizes) / Math.min(...fontSizes) > 1.18) {
        issues.push({ severity: "error", message: `${platform}: headline font sizes vary too much. Store screenshot sets need one repeated typography system.` });
      }
      const yPositions = headlineLayers.map((layer) => layer.y);
      if (Math.max(...yPositions) - Math.min(...yPositions) > artboards[0]!.height * 0.08) {
        issues.push({ severity: "warning", message: `${platform}: headline positions feel inconsistent. Keep a repeated title block unless the whole set uses a clear alternate rule.` });
      }
      const alignments = new Set(headlineLayers.map((layer) => layer.align ?? "left"));
      if (alignments.size > 2) {
        issues.push({ severity: "warning", message: `${platform}: headline alignment changes too often. Use one series rule for text alignment.` });
      }
    }

    const firstArtboard = artboards[0];
    const firstHeadline = firstArtboard?.layers.find((layer) => layer.id === "headline" && !layer.hidden && layer.type === "text");
    if (firstArtboard && firstHeadline) {
      const minHeadlineSize = firstArtboard.width * 0.045;
      if ((firstHeadline.fontSize ?? 0) > 0 && (firstHeadline.fontSize ?? 0) < minHeadlineSize) {
        issues.push({ severity: "error", message: `${platform}: first screenshot headline is too small for App Store thumbnail scanning. Make the core value readable at 25% scale.` });
      }
      if (typeof firstHeadline.text === "string" && compactHeadlineLength(firstHeadline.text) > 34) {
        issues.push({ severity: "warning", message: `${platform}: first screenshot headline is long. Top screenshots should use one short benefit statement, not a paragraph.` });
      }
      if (largestHeroAreaRatio(firstArtboard) < 0.16) {
        issues.push({ severity: "error", message: `${platform}: first screenshot lacks a strong visual anchor. The first App Store screenshot needs a large phone, output, object, board, or panorama motif.` });
      }
    }

    const hasMultiDeviceCollage = artboards.some((artboard) => artboard.layers.filter((layer) => layer.type === "device" && !layer.hidden).length >= 2);
    const deviceAreas = artboards
      .map((artboard) => artboard.layers.filter((layer) => layer.type === "device" && !layer.hidden).sort((a, b) => area(layerBox(b, artboard)) - area(layerBox(a, artboard)))[0])
      .filter((layer): layer is Layer => Boolean(layer?.width && layer.height))
      .map((layer) => (layer.width ?? 0) * (layer.height ?? 0));
    if (!hasMultiDeviceCollage && deviceAreas.length >= 3) {
      const min = Math.min(...deviceAreas);
      const max = Math.max(...deviceAreas);
      if (min > 0 && max / min > 1.35) {
        issues.push({ severity: "error", message: `${platform}: primary device sizes vary too much across the set. Keep phone scale consistent unless a slide is an explicit close-up or panorama.` });
      } else if (min > 0 && max / min > 1.12) {
        issues.push({ severity: "warning", message: `${platform}: device size rhythm is loose. Store sets usually keep phone scale within a tight range.` });
      }
    }

    const devicesWithArtboards = artboards
      .map((artboard) => ({
        artboard,
        device: artboard.layers.find((layer) => layer.type === "device" && !layer.hidden && layer.width && layer.height)
      }))
      .filter((item): item is { artboard: Artboard; device: Layer } => Boolean(item.device));
    if (devicesWithArtboards.length >= 3) {
      const bottoms = devicesWithArtboards.map(({ device }) => device.y + (device.height ?? 0));
      const tops = devicesWithArtboards.map(({ device }) => device.y);
      const topRange = Math.max(...tops) - Math.min(...tops);
      const bottomRange = Math.max(...bottoms) - Math.min(...bottoms);
      const height = devicesWithArtboards[0]!.artboard.height;
      const hasCroppedDevice = devicesWithArtboards.some(({ artboard, device }) => device.y < -height * 0.04 || device.y + (device.height ?? 0) > artboard.height + height * 0.04);
      const medianTop = median(tops);
      const medianBottom = median(bottoms);
      const driftingItems = devicesWithArtboards.filter(({ device }) =>
        Math.abs(device.y - medianTop) > height * 0.1 ||
        Math.abs(device.y + (device.height ?? 0) - medianBottom) > height * 0.1
      );
      const driftIsIntentionalSecondaryCrop = driftingItems.length > 0 && driftingItems.every(({ artboard, device }) => hasIntentionalSecondaryDevicePlacement(artboard, device));
      if (topRange > height * 0.16 && bottomRange > height * 0.16) {
        if (!driftIsIntentionalSecondaryCrop) {
          issues.push({
            severity: panoramaContinuous || hasCroppedDevice ? "warning" : "error",
            message: `${platform}: device top and baseline both drift across the set. Keep phone placement on one consistent grid.`
          });
        }
      } else if (bottomRange > height * 0.1 && !driftIsIntentionalSecondaryCrop) {
        issues.push({ severity: "warning", message: `${platform}: device baselines are inconsistent. Align the main phone bottoms or crop them with a repeated rule.` });
      }
    }

    const backgroundFamilies = new Set<string>();
    for (const artboard of artboards) {
      const background = artboard.layers.find((layer) => layer.type === "background" && !layer.hidden);
      for (const color of fillColors(background ?? ({} as Layer))) {
        const family = hexToHueFamily(color);
        if (family) backgroundFamilies.add(family);
      }
    }
    if (artboards.length >= 3 && backgroundFamilies.size > 3) {
      issues.push({ severity: "error", message: `${platform}: backgrounds use too many unrelated color families. Use a shared brand palette and vary tint, band position, or accent placement instead of changing the whole background per slide.` });
    }
    if (artboards.length >= 3 && !panoramaContinuous && !hasThreeSlideBackgroundSystem(artboards)) {
      issues.push({ severity: "error", message: `${platform}: first three slides do not share a clear background system. Store screenshot sets should feel unified before they vary.` });
    }
    if (artboards.length >= 3 && !panoramaContinuous && !hasRepeatedSeriesMotif(artboards)) {
      issues.push({ severity: "error", message: `${platform}: repeated series motifs are weak. Reuse at least two motif layer families across the first three slides so the set reads as one campaign.` });
    }
    if (artboards.length >= 3 && !hasEditableBitmapPairing(project, artboards)) {
      issues.push({ severity: "error", message: `${platform}: generated bitmap visuals must be paired with editable shape/text overlays; otherwise the tool cannot revise the design object-by-object after generation.` });
    }

    const signatures = artboards.map(artboardLayoutSignature);
    const mostCommonCount = Math.max(0, ...[...new Set(signatures)].map((signature) => signatures.filter((item) => item === signature).length));
    if (artboards.length >= 3 && !panoramaContinuous && !audioLiveVaried && mostCommonCount / artboards.length >= 0.75) {
      issues.push({ severity: "error", message: `${platform}: composition is too repetitive. Add a card-led, cropped, object-led, infographic, or panoramic slide while keeping the same brand system.` });
    }

    const archetypes = artboards.map(dominantCompositionArchetype);
    const archetypeCount = new Set(archetypes).size;
    const allPhonePlacementOnly = archetypes.every((archetype) => archetype.startsWith("device-") || archetype === "device-with-image");
    if (artboards.length >= 3 && archetypeCount < 2 && archetypes[0] !== "panorama" && !audioLiveVaried) {
      issues.push({ severity: "error", message: `${platform}: all slides use the same composition archetype (${archetypes[0]}). Vary the structural idea, not only text, colors, or card positions.` });
    } else if (artboards.length >= 5 && !panoramaContinuous && archetypeCount < 3) {
      issues.push({ severity: "warning", message: `${platform}: the set uses too few composition archetypes for its length. Add an object-led, panorama, collage, or infographic slide.` });
    }
    if (artboards.length >= 3 && allPhonePlacementOnly && !audioLiveVaried) {
      issues.push({ severity: "error", message: `${platform}: slides are still phone-plus-copy variations. Include at least one structurally different visual such as a full card board, object/image hero, panorama, or multi-screen collage.` });
    }

    if (artboards.length >= 3 && !artboards.some(hasNonPhoneHero)) {
      issues.push({ severity: "error", message: `${platform}: set is too phone-led. At least one slide must use a large non-phone visual system such as floating UI cards, generated image/object, infographic, panorama band, or app-surface fragment.` });
    }

    const requestedPanorama = project.referenceInspirations.some((ref) =>
      Object.values(ref.patterns).some((value) => /panorama|パノラマ|連結|横断|continuous|wide\s+visual|wide\s+image/i.test(value))
    ) || project.slides.some((slide) => `${slide.role ?? ""} ${slide.title}`.toLowerCase().includes("panorama") || `${slide.role ?? ""} ${slide.title}`.includes("パノラマ"));
    if (requestedPanorama && !hasPanoramaContinuity(artboards)) {
      issues.push({ severity: "error", message: `${platform}: panorama pattern was requested but slides 1-3 do not contain repeated panorama-* continuity layers.` });
    } else if (requestedPanorama && panoramaContinuityLayers < 2) {
      issues.push({ severity: "error", message: `${platform}: panorama pattern needs at least two repeated continuity layers, such as a background band plus a hero collage/object layer, so three exports read as one wide image.` });
    } else if (requestedPanorama) {
      const firstThreeBackgrounds = artboards.slice(0, 3).map((artboard) => fillSignature(artboard.layers.find((layer) => layer.type === "background" && !layer.hidden)));
      if (new Set(firstThreeBackgrounds).size > 1) {
        issues.push({ severity: "error", message: `${platform}: panorama slides need the same background fill on slides 1-3; otherwise the exported images show visible seams instead of one wide image.` });
      }
    }
  }
}

export function designQualityIssues(project: StoreShotProject): DesignQualityIssue[] {
  const issues: DesignQualityIssue[] = [];
  for (const slide of project.slides) {
    for (const artboard of slide.artboards) {
      const visibleLayers = artboard.layers.filter((layer) => !layer.hidden);
      const { device, imageSurface, shapeSurface, detailLayers, deviceDetailLayers, deepestDeviceDetail, deviceBox, visibleDeviceBox } = detailLayersForArtboard(artboard);
      const label = `${slide.id}/${artboard.id}`;

      if (!device && !imageSurface && !shapeSurface) {
        issues.push({ severity: "error", message: `${label}: store screenshot must include a device or app-surface layer.` });
        continue;
      }
      if (visibleLayers.length < 10) {
        issues.push({ severity: "error", message: `${label}: too simple. Add layered UI details, badges, panels, or screenshot-like cards beyond background/headline/device.` });
      }
      if (detailLayers.length < 6) {
        issues.push({ severity: "error", message: `${label}: needs at least 6 non-generic visual detail layers derived from the brief/reference pattern.` });
      }
      if (device && deviceDetailLayers.length < 4 && !device.screenshotAssetId) {
        issues.push({ severity: "error", message: `${label}: device screen is generic. Add fictional UI details inside or overlapping the device instead of relying on the placeholder phone.` });
      }
      if (device && deviceBox && visibleDeviceBox && !device.screenshotAssetId) {
        const detailDepthTarget = visibleDeviceBox.y + Math.max(visibleDeviceBox.height, deviceBox.height * 0.45) * 0.66;
        if (deepestDeviceDetail < detailDepthTarget) {
          issues.push({ severity: "error", message: `${label}: device UI is too sparse. Extend meaningful UI details into the lower half of the device screen.` });
        }
      }
    }
  }
  addSeriesIssues(project, issues);
  return issues;
}
