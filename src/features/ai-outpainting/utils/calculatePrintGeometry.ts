import type { OutpaintingDirection, OutpaintingGeometry, PrintTransform } from '../types/aiOutpaintingTypes';

const EPSILON = 0.5;

const getDirection = (empty: OutpaintingGeometry['empty']): OutpaintingDirection => {
  const top = empty.top > EPSILON;
  const bottom = empty.bottom > EPSILON;
  const sides = empty.left > EPSILON || empty.right > EPSILON;
  if (sides && (top || bottom)) return 'multiple';
  if (sides) return 'sides';
  if (top && bottom) return 'vertical';
  if (top) return 'above';
  if (bottom) return 'below';
  return 'multiple';
};

export const calculatePrintGeometry = (
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  transform: PrintTransform
): OutpaintingGeometry => {
  if ([imageWidth, imageHeight, canvasWidth, canvasHeight].some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new Error('Dimensoes de imagem invalidas.');
  }

  const quarterTurn = Math.abs(transform.rotation % 180) === 90;
  const rotatedWidth = quarterTurn ? imageHeight : imageWidth;
  const rotatedHeight = quarterTurn ? imageWidth : imageHeight;
  const containScale = Math.min(canvasWidth / rotatedWidth, canvasHeight / rotatedHeight);
  const scale = containScale * Math.max(0.05, transform.scale);
  const displayedWidth = rotatedWidth * scale;
  const displayedHeight = rotatedHeight * scale;
  const imageX = (canvasWidth - displayedWidth) / 2 + transform.x;
  const imageY = (canvasHeight - displayedHeight) / 2 + transform.y;
  const empty = {
    top: Math.max(0, imageY),
    right: Math.max(0, canvasWidth - (imageX + displayedWidth)),
    bottom: Math.max(0, canvasHeight - (imageY + displayedHeight)),
    left: Math.max(0, imageX),
  };

  return {
    canvasWidth,
    canvasHeight,
    imageX,
    imageY,
    imageWidth: displayedWidth,
    imageHeight: displayedHeight,
    empty,
    direction: getDirection(empty),
    hasEmptyRegions: Object.values(empty).some((value) => value > EPSILON),
  };
};
