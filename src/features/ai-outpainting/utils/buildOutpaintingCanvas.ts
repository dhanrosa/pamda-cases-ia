import { AI_OUTPAINTING_CONFIG } from '../config/aiOutpaintingConfig';
import type { PreparedOutpainting, PrintTransform } from '../types/aiOutpaintingTypes';
import { buildOutpaintingMask } from './buildOutpaintingMask';
import { calculatePrintGeometry } from './calculatePrintGeometry';

const canvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Falha ao preparar PNG.'))), 'image/png')
  );

const loadBrowserImage = (source: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Imagem corrompida ou inacessivel.'));
    image.src = source;
  });

export const buildOutpaintingCanvas = async (
  imageSource: string,
  transform: PrintTransform,
  dimensions: { width: number; height: number } = AI_OUTPAINTING_CONFIG.canvas
): Promise<PreparedOutpainting> => {
  const source = await loadBrowserImage(imageSource);
  const geometry = calculatePrintGeometry(
    source.naturalWidth,
    source.naturalHeight,
    dimensions.width,
    dimensions.height,
    transform
  );
  if (!geometry.hasEmptyRegions) throw new Error('A imagem ja preenche toda a area de impressao.');

  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Nao foi possivel preparar a imagem.');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.translate(canvas.width / 2 + transform.x, canvas.height / 2 + transform.y);
  context.rotate((transform.rotation * Math.PI) / 180);
  context.scale(transform.mirrored ? -1 : 1, 1);
  const quarterTurn = Math.abs(transform.rotation % 180) === 90;
  const rotatedWidth = quarterTurn ? source.naturalHeight : source.naturalWidth;
  const rotatedHeight = quarterTurn ? source.naturalWidth : source.naturalHeight;
  const containScale = Math.min(canvas.width / rotatedWidth, canvas.height / rotatedHeight);
  const scale = containScale * Math.max(0.05, transform.scale);
  context.drawImage(
    source,
    (-source.naturalWidth * scale) / 2,
    (-source.naturalHeight * scale) / 2,
    source.naturalWidth * scale,
    source.naturalHeight * scale
  );
  context.restore();

  const mask = buildOutpaintingMask(geometry);
  const [baseBlob, maskBlob] = await Promise.all([canvasToBlob(canvas), canvasToBlob(mask)]);
  const baseFile = new File([baseBlob], 'outpainting-base.png', { type: 'image/png' });
  const maskFile = new File([maskBlob], 'outpainting-mask.png', { type: 'image/png' });
  return { baseFile, maskFile, previewUrl: URL.createObjectURL(baseBlob), geometry };
};
