import { type ImageItem } from "@/context/app-context";
import { saveAs } from "file-saver";

import { encodeCmykJpeg } from "@/lib/cmyk-jpeg";

export const CM_TO_PX = 37.7952755906;
export const PX_TO_CM = 1 / CM_TO_PX;

export const ARTBOARD_WIDTH_PX = 150 * CM_TO_PX;
export const GAP_PX = 6 * CM_TO_PX;
export const UI_PREVIEW_SCALE = 0.12;
const MAX_PACKING_HEIGHT_PX = 1000000;
const EPSILON = 0.01;
const SEARCH_IMAGE_LIMIT = 10;
const MAX_SEARCH_STATES = 50000;
const MAX_CANDIDATES_PER_STEP = 32;

const PACKING_HEURISTICS = ["height", "shortSide", "longSide", "area"] as const;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PackedImage extends ImageItem {
  left: number;
  top: number;
  renderW: number;
  renderH: number;
  isRotated: boolean;
  sourceX: number;
  sourceY: number;
  sourceW: number;
  sourceH: number;
}

type PackingHeuristic = (typeof PACKING_HEURISTICS)[number];
type PackingScore = [number, number, number, number];

interface Orientation {
  renderW: number;
  renderH: number;
  isRotated: boolean;
}

interface PackingCandidate extends Orientation {
  left: number;
  top: number;
  score: PackingScore;
}

export interface PackingResult {
  packedImages: PackedImage[];
  canvasHeight: number;
}

function hasUsableSize(image: ImageItem) {
  return (
    Number.isFinite(image.naturalWidth) &&
    Number.isFinite(image.naturalHeight) &&
    image.naturalWidth > 0 &&
    image.naturalHeight > 0
  );
}

function hasUsableCrop(image: ImageItem) {
  return (
    Number.isFinite(image.cropWidth) &&
    Number.isFinite(image.cropHeight) &&
    image.cropWidth > EPSILON &&
    image.cropHeight > EPSILON
  );
}

function getSourceRect(image: ImageItem): Rect {
  if (!hasUsableCrop(image)) {
    return {
      x: 0,
      y: 0,
      w: image.naturalWidth,
      h: image.naturalHeight,
    };
  }

  const sourceW = Math.min(image.cropWidth, image.naturalWidth);
  const sourceH = Math.min(image.cropHeight, image.naturalHeight);

  return {
    x: Math.max(0, Math.min(image.cropX, image.naturalWidth - sourceW)),
    y: Math.max(0, Math.min(image.cropY, image.naturalHeight - sourceH)),
    w: sourceW,
    h: sourceH,
  };
}

function getOrientations(image: ImageItem): Orientation[] {
  const source = getSourceRect(image);
  const orientations: Orientation[] = [
    {
      renderW: source.w,
      renderH: source.h,
      isRotated: false,
    },
  ];

  if (Math.abs(source.w - source.h) > EPSILON) {
    orientations.push({
      renderW: source.h,
      renderH: source.w,
      isRotated: true,
    });
  }

  return orientations;
}

function imageArea(image: ImageItem) {
  const source = getSourceRect(image);
  return source.w * source.h;
}

function imageMaxSide(image: ImageItem) {
  const source = getSourceRect(image);
  return Math.max(source.w, source.h);
}

function imageMinSide(image: ImageItem) {
  const source = getSourceRect(image);
  return Math.min(source.w, source.h);
}

function imagePerimeter(image: ImageItem) {
  const source = getSourceRect(image);
  return source.w + source.h;
}

function buildPackingOrders(images: ImageItem[]) {
  return [
    [...images].sort((a, b) => imageArea(b) - imageArea(a)),
    [...images].sort((a, b) => imageMaxSide(b) - imageMaxSide(a)),
    [...images].sort((a, b) => imageMinSide(b) - imageMinSide(a)),
    [...images].sort((a, b) => imagePerimeter(b) - imagePerimeter(a)),
    [...images].sort((a, b) => getSourceRect(b).h - getSourceRect(a).h),
    [...images].sort((a, b) => getSourceRect(b).w - getSourceRect(a).w),
    images,
  ];
}

function splitFreeRect(free: Rect, used: Rect): Rect[] {
  const freeRight = free.x + free.w;
  const freeBottom = free.y + free.h;
  const usedRight = used.x + used.w;
  const usedBottom = used.y + used.h;

  if (
    used.x >= freeRight ||
    usedRight <= free.x ||
    used.y >= freeBottom ||
    usedBottom <= free.y
  ) {
    return [free];
  }

  const result: Rect[] = [];

  if (used.y > free.y) {
    result.push({ x: free.x, y: free.y, w: free.w, h: used.y - free.y });
  }

  if (usedBottom < freeBottom) {
    result.push({
      x: free.x,
      y: usedBottom,
      w: free.w,
      h: freeBottom - usedBottom,
    });
  }

  if (used.x > free.x) {
    result.push({ x: free.x, y: free.y, w: used.x - free.x, h: free.h });
  }

  if (usedRight < freeRight) {
    result.push({
      x: usedRight,
      y: free.y,
      w: freeRight - usedRight,
      h: free.h,
    });
  }

  return result.filter((rect) => rect.w > EPSILON && rect.h > EPSILON);
}

function containsRect(outer: Rect, inner: Rect) {
  return (
    inner.x >= outer.x - EPSILON &&
    inner.y >= outer.y - EPSILON &&
    inner.x + inner.w <= outer.x + outer.w + EPSILON &&
    inner.y + inner.h <= outer.y + outer.h + EPSILON
  );
}

function areSameRect(a: Rect, b: Rect) {
  return (
    Math.abs(a.x - b.x) < EPSILON &&
    Math.abs(a.y - b.y) < EPSILON &&
    Math.abs(a.w - b.w) < EPSILON &&
    Math.abs(a.h - b.h) < EPSILON
  );
}

function pruneFreeRects(rects: Rect[]) {
  const uniqueRects: Rect[] = [];

  for (const rect of rects) {
    if (
      rect.w <= EPSILON ||
      rect.h <= EPSILON ||
      uniqueRects.some((existingRect) => areSameRect(existingRect, rect))
    ) {
      continue;
    }
    uniqueRects.push(rect);
  }

  return uniqueRects.filter(
    (rect, index) =>
      !uniqueRects.some(
        (otherRect, otherIndex) =>
          index !== otherIndex && containsRect(otherRect, rect)
      )
  );
}

function scorePlacement(
  free: Rect,
  orientation: Orientation,
  heuristic: PackingHeuristic
): PackingScore {
  const leftoverW = free.w - orientation.renderW;
  const leftoverH = free.h - orientation.renderH;
  const shortSideFit = Math.min(leftoverW, leftoverH);
  const longSideFit = Math.max(leftoverW, leftoverH);
  const bottom = free.y + orientation.renderH;
  const right = free.x + orientation.renderW;
  const areaFit = free.w * free.h - orientation.renderW * orientation.renderH;

  if (heuristic === "height") return [bottom, shortSideFit, longSideFit, right];
  if (heuristic === "shortSide")
    return [shortSideFit, longSideFit, bottom, right];
  if (heuristic === "longSide")
    return [longSideFit, shortSideFit, bottom, right];
  return [areaFit, bottom, shortSideFit, right];
}

function compareScores(a: PackingScore, b: PackingScore) {
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i] - b[i]) > EPSILON) return a[i] - b[i];
  }
  return 0;
}

function findBestCandidate(
  image: ImageItem,
  freeRects: Rect[],
  heuristic: PackingHeuristic
) {
  let bestCandidate: PackingCandidate | null = null;

  for (const orientation of getOrientations(image)) {
    for (const free of freeRects) {
      if (
        orientation.renderW > free.w + EPSILON ||
        orientation.renderH > free.h + EPSILON
      )
        continue;

      const candidate: PackingCandidate = {
        ...orientation,
        left: free.x,
        top: free.y,
        score: scorePlacement(free, orientation, heuristic),
      };

      if (
        !bestCandidate ||
        compareScores(candidate.score, bestCandidate.score) < 0
      ) {
        bestCandidate = candidate;
      }
    }
  }
  return bestCandidate;
}

function findPlacementCandidates(
  image: ImageItem,
  freeRects: Rect[],
  heuristic: PackingHeuristic
) {
  const candidates: PackingCandidate[] = [];

  for (const orientation of getOrientations(image)) {
    for (const free of freeRects) {
      if (
        orientation.renderW > free.w + EPSILON ||
        orientation.renderH > free.h + EPSILON
      )
        continue;
      candidates.push({
        ...orientation,
        left: free.x,
        top: free.y,
        score: scorePlacement(free, orientation, heuristic),
      });
    }
  }

  const uniqueCandidates: PackingCandidate[] = [];
  for (const candidate of candidates) {
    if (
      uniqueCandidates.some(
        (existingCandidate) =>
          Math.abs(existingCandidate.left - candidate.left) < EPSILON &&
          Math.abs(existingCandidate.top - candidate.top) < EPSILON &&
          Math.abs(existingCandidate.renderW - candidate.renderW) < EPSILON &&
          Math.abs(existingCandidate.renderH - candidate.renderH) < EPSILON
      )
    )
      continue;
    uniqueCandidates.push(candidate);
  }

  return uniqueCandidates
    .sort((a, b) => {
      const scoreComparison = compareScores(a.score, b.score);
      if (scoreComparison !== 0) return scoreComparison;
      if (Math.abs(a.top - b.top) > EPSILON) return a.top - b.top;
      return a.left - b.left;
    })
    .slice(0, MAX_CANDIDATES_PER_STEP);
}

function createSpacingRect(candidate: PackingCandidate): Rect {
  return {
    x: candidate.left - GAP_PX,
    y: candidate.top - GAP_PX,
    w: candidate.renderW + GAP_PX * 2,
    h: candidate.renderH + GAP_PX * 2,
  };
}

function createPackedImage(
  image: ImageItem,
  candidate: PackingCandidate
): PackedImage {
  const source = getSourceRect(image);

  return {
    ...image,
    left: candidate.left,
    top: candidate.top,
    renderW: candidate.renderW,
    renderH: candidate.renderH,
    isRotated: candidate.isRotated,
    sourceX: source.x,
    sourceY: source.y,
    sourceW: source.w,
    sourceH: source.h,
  };
}

function packImageOrderGreedy(
  images: ImageItem[],
  heuristic: PackingHeuristic
): PackingResult | null {
  let maxY = GAP_PX;
  let freeRects: Rect[] = [
    {
      x: GAP_PX,
      y: GAP_PX,
      w: ARTBOARD_WIDTH_PX - GAP_PX * 2,
      h: MAX_PACKING_HEIGHT_PX,
    },
  ];
  const packedImages: PackedImage[] = [];

  for (const image of images) {
    const candidate = findBestCandidate(image, freeRects, heuristic);
    if (!candidate) return null;

    packedImages.push(createPackedImage(image, candidate));

    const occupied = createSpacingRect(candidate);
    const splitRects = freeRects.flatMap((freeRect) =>
      splitFreeRect(freeRect, occupied)
    );
    freeRects = pruneFreeRects(splitRects);
    maxY = Math.max(maxY, candidate.top + candidate.renderH);
  }

  return { packedImages, canvasHeight: maxY + GAP_PX };
}

function packImageOrderSearch(
  images: ImageItem[],
  heuristic: PackingHeuristic,
  bestKnownHeight: number
): PackingResult | null {
  if (images.length > SEARCH_IMAGE_LIMIT) return null;

  const currentPacked: PackedImage[] = [];
  const initialFreeRects: Rect[] = [
    {
      x: GAP_PX,
      y: GAP_PX,
      w: ARTBOARD_WIDTH_PX - GAP_PX * 2,
      h: MAX_PACKING_HEIGHT_PX,
    },
  ];
  let bestPacking: PackingResult | null = null;
  let bestHeight = bestKnownHeight;
  let searchedStates = 0;

  const search = (index: number, freeRects: Rect[], currentMaxY: number) => {
    searchedStates += 1;
    if (
      searchedStates > MAX_SEARCH_STATES ||
      currentMaxY + GAP_PX >= bestHeight - EPSILON
    )
      return;

    if (index === images.length) {
      const canvasHeight = currentMaxY + GAP_PX;
      if (canvasHeight < bestHeight - EPSILON) {
        bestHeight = canvasHeight;
        bestPacking = { packedImages: [...currentPacked], canvasHeight };
      }
      return;
    }

    const image = images[index];
    const candidates = findPlacementCandidates(image, freeRects, heuristic);
    for (const candidate of candidates) {
      const occupied = createSpacingRect(candidate);
      const nextFreeRects = pruneFreeRects(
        freeRects.flatMap((freeRect) => splitFreeRect(freeRect, occupied))
      );
      currentPacked.push(createPackedImage(image, candidate));
      search(
        index + 1,
        nextFreeRects,
        Math.max(currentMaxY, candidate.top + candidate.renderH)
      );
      currentPacked.pop();
    }
  };

  search(0, initialFreeRects, GAP_PX);
  return bestPacking;
}

function isBetterPacking(
  candidate: PackingResult,
  current: PackingResult | null
) {
  if (!current) return true;
  if (Math.abs(candidate.canvasHeight - current.canvasHeight) > EPSILON)
    return candidate.canvasHeight < current.canvasHeight;
  const candidateRight = Math.max(
    ...candidate.packedImages.map((image) => image.left + image.renderW)
  );
  const currentRight = Math.max(
    ...current.packedImages.map((image) => image.left + image.renderW)
  );
  return candidateRight < currentRight;
}

function stackImages(images: ImageItem[]): PackingResult {
  let nextTop = GAP_PX;
  const packedImages = images.map((image) => {
    const orientation = getOrientations(image).reduce((best, current) =>
      current.renderW < best.renderW ? current : best
    );
    const packedImage = createPackedImage(image, {
      ...orientation,
      left: GAP_PX,
      top: nextTop,
      score: [0, 0, 0, 0],
    });
    nextTop += orientation.renderH + GAP_PX;
    return packedImage;
  });
  return { packedImages, canvasHeight: Math.max(nextTop, GAP_PX * 2) };
}

export function packImages(images: ImageItem[]): PackingResult {
  const packableImages = images.filter(hasUsableSize);
  if (packableImages.length === 0)
    return { packedImages: [], canvasHeight: GAP_PX * 2 };

  let bestPacking: PackingResult | null = null;
  for (const order of buildPackingOrders(packableImages)) {
    for (const heuristic of PACKING_HEURISTICS) {
      const candidate = packImageOrderGreedy(order, heuristic);
      if (candidate && isBetterPacking(candidate, bestPacking))
        bestPacking = candidate;
    }
  }

  for (const order of buildPackingOrders(packableImages)) {
    for (const heuristic of PACKING_HEURISTICS) {
      const candidate = packImageOrderSearch(
        order,
        heuristic,
        bestPacking?.canvasHeight ?? Infinity
      );
      if (candidate && isBetterPacking(candidate, bestPacking))
        bestPacking = candidate;
    }
  }

  return bestPacking ?? stackImages(packableImages);
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image for export."));
    image.src = src;
  });
}

export async function savePackedImagesAsCmykJpeg(
  packedImages: PackedImage[],
  canvasHeight: number,
  includeLabels: boolean
) {
  const exportWidth = Math.ceil(ARTBOARD_WIDTH_PX);
  const exportHeight = Math.ceil(canvasHeight);
  const canvas = document.createElement("canvas");
  canvas.width = exportWidth;
  canvas.height = exportHeight;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Could not create export canvas.");

  const loadedImages = await Promise.all(
    packedImages.map(async (image) => ({
      id: image.id,
      element: await loadImageElement(image.url),
    }))
  );
  const imageElementsById = new Map(
    loadedImages.map((image) => [image.id, image.element])
  );

  context.fillStyle = "white";
  context.fillRect(0, 0, exportWidth, exportHeight);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  for (const image of packedImages) {
    const imageElement = imageElementsById.get(image.id);
    if (!imageElement) continue;

    const sourceScaleX = imageElement.naturalWidth / image.naturalWidth;
    const sourceScaleY = imageElement.naturalHeight / image.naturalHeight;
    const sourceX = image.sourceX * sourceScaleX;
    const sourceY = image.sourceY * sourceScaleY;
    const sourceW = image.sourceW * sourceScaleX;
    const sourceH = image.sourceH * sourceScaleY;

    if (image.isRotated) {
      context.save();
      context.translate(image.left + image.renderW, image.top);
      context.rotate(Math.PI / 2);
      context.drawImage(
        imageElement,
        sourceX,
        sourceY,
        sourceW,
        sourceH,
        0,
        0,
        image.sourceW,
        image.sourceH
      );
      context.restore();
    } else {
      context.drawImage(
        imageElement,
        sourceX,
        sourceY,
        sourceW,
        sourceH,
        image.left,
        image.top,
        image.renderW,
        image.renderH
      );
    }

    if (includeLabels) {
      context.fillStyle = "black";
      context.font = "42px monospace";
      context.textBaseline = "top";
      const wCm = (image.sourceW * PX_TO_CM).toFixed(2);
      const hCm = (image.sourceH * PX_TO_CM).toFixed(2);
      context.fillText(
        `W: ${wCm} cm | H: ${hCm} cm`,
        image.left,
        image.top + image.renderH + 8
      );
    }
  }

  const imageData = context.getImageData(0, 0, exportWidth, exportHeight);
  const jpegBytes = encodeCmykJpeg(
    imageData.data,
    exportWidth,
    exportHeight,
    0.9
  );
  const blob = new Blob([jpegBytes], { type: "image/jpeg" });
  saveAs(blob, `tiles-cmyk-${Date.now()}.jpg`);
}
