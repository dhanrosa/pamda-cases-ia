import type { OutpaintingGeometry } from '../types/aiOutpaintingTypes';
import { AI_OUTPAINTING_CONFIG } from '../config/aiOutpaintingConfig';

export const getProtectedImageBounds = (geometry: OutpaintingGeometry) => {
  const overlap = AI_OUTPAINTING_CONFIG.seamOverlapPixels;
  const leftInset = geometry.empty.left > 0 ? overlap : 0;
  const rightInset = geometry.empty.right > 0 ? overlap : 0;
  const topInset = geometry.empty.top > 0 ? overlap : 0;
  const bottomInset = geometry.empty.bottom > 0 ? overlap : 0;

  const x = Math.max(0, geometry.imageX + leftInset);
  const y = Math.max(0, geometry.imageY + topInset);
  const right = Math.min(
    geometry.canvasWidth,
    geometry.imageX + geometry.imageWidth - rightInset
  );
  const bottom = Math.min(
    geometry.canvasHeight,
    geometry.imageY + geometry.imageHeight - bottomInset
  );

  return { x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y) };
};

export const isMaskPixelEditable = (geometry: OutpaintingGeometry, x: number, y: number) => {
  const protectedBounds = getProtectedImageBounds(geometry);
  return x < protectedBounds.x ||
    y < protectedBounds.y ||
    x >= protectedBounds.x + protectedBounds.width ||
    y >= protectedBounds.y + protectedBounds.height;
};

export const buildOutpaintingMask = (geometry: OutpaintingGeometry) => {
  const canvas = document.createElement('canvas');
  canvas.width = geometry.canvasWidth;
  canvas.height = geometry.canvasHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Nao foi possivel criar a mascara.');

  // A API edita pixels transparentes. A regiao da fotografia permanece totalmente opaca.
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#000000';
  const protectedBounds = getProtectedImageBounds(geometry);
  context.fillRect(protectedBounds.x, protectedBounds.y, protectedBounds.width, protectedBounds.height);
  return canvas;
};
