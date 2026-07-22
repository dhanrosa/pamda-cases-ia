import { AI_OUTPAINTING_CONFIG } from '../config/aiOutpaintingConfig';

export type ContainPlacement = {
  scale: number;
  width: number;
  height: number;
  x: number;
  y: number;
};

export type EmptyPrintRegions = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const calculateContainPlacement = (
  imageWidth: number,
  imageHeight: number,
  printWidth: number,
  printHeight: number
): ContainPlacement => {
  if ([imageWidth, imageHeight, printWidth, printHeight].some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error('Dimensoes invalidas para o enquadramento.');
  }
  const scale = Math.min(printWidth / imageWidth, printHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return { scale, width, height, x: (printWidth - width) / 2, y: (printHeight - height) / 2 };
};

export const calculateRenderedImageBounds = (
  placement: ContainPlacement,
  zoomPercent: number,
  position: { x: number; y: number }
) => {
  const zoom = Math.max(0.01, zoomPercent / 100);
  const width = placement.width * zoom;
  const height = placement.height * zoom;
  return {
    x: (placement.x + placement.width / 2) - width / 2 + position.x,
    y: (placement.y + placement.height / 2) - height / 2 + position.y,
    width,
    height,
  };
};

export const calculateEmptyPrintRegions = (
  bounds: { x: number; y: number; width: number; height: number },
  printWidth: number,
  printHeight: number
): EmptyPrintRegions => ({
  top: Math.max(0, bounds.y),
  right: Math.max(0, printWidth - (bounds.x + bounds.width)),
  bottom: Math.max(0, printHeight - (bounds.y + bounds.height)),
  left: Math.max(0, bounds.x),
});

export const shouldSuggestAiOutpainting = (
  regions: EmptyPrintRegions,
  printWidth: number,
  printHeight: number
) => {
  const horizontalTolerance = Math.max(
    AI_OUTPAINTING_CONFIG.emptyRegionTolerance.minimumPixels,
    printWidth * AI_OUTPAINTING_CONFIG.emptyRegionTolerance.dimensionRatio
  );
  const verticalTolerance = Math.max(
    AI_OUTPAINTING_CONFIG.emptyRegionTolerance.minimumPixels,
    printHeight * AI_OUTPAINTING_CONFIG.emptyRegionTolerance.dimensionRatio
  );
  return regions.left > horizontalTolerance || regions.right > horizontalTolerance ||
    regions.top > verticalTolerance || regions.bottom > verticalTolerance;
};

export const calculateCurrentEmptyRegions = (input: {
  imageWidth: number;
  imageHeight: number;
  printWidth: number;
  printHeight: number;
  zoomPercent: number;
  position: { x: number; y: number };
}) => {
  const placement = calculateContainPlacement(input.imageWidth, input.imageHeight, input.printWidth, input.printHeight);
  const bounds = calculateRenderedImageBounds(placement, input.zoomPercent, input.position);
  const regions = calculateEmptyPrintRegions(bounds, input.printWidth, input.printHeight);
  return { placement, bounds, regions, needsOutpainting: shouldSuggestAiOutpainting(regions, input.printWidth, input.printHeight) };
};
