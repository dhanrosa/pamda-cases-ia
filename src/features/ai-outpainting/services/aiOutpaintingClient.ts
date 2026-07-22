import { AI_OUTPAINTING_CONFIG, isAiOutpaintingMockEnabled } from '../config/aiOutpaintingConfig';
import type { OutpaintingDirection } from '../types/aiOutpaintingTypes';
import type { CameraArea } from '../types/aiOutpaintingTypes';

const ERROR_MESSAGES: Record<string, string> = {
  FILE_TOO_LARGE: 'O arquivo e muito grande. Escolha uma imagem menor.',
  UNSUPPORTED_FORMAT: 'Formato nao aceito. Use PNG, JPEG ou WebP.',
  CORRUPT_IMAGE: 'A imagem parece estar corrompida.',
  INVALID_MASK: 'Nao foi possivel preparar a area que sera completada.',
  DIMENSION_MISMATCH: 'A imagem e a mascara possuem dimensoes diferentes.',
  NETWORK_ERROR: 'Conexao indisponivel. Verifique sua internet e tente novamente.',
  MISSING_API_KEY: 'O servico de imagem ainda nao foi configurado.',
  SERVER_DISABLED: 'A ferramenta de IA esta desativada neste ambiente.',
  SAFETY_BLOCKED: 'O resultado foi bloqueado pelos filtros de seguranca.',
  RATE_LIMITED: 'O limite de uso foi atingido. Aguarde e tente novamente.',
  EMPTY_RESPONSE: 'O servico nao devolveu uma imagem. Tente novamente.',
  UNKNOWN: 'Nao foi possivel completar a imagem. Tente novamente.',
};

export const findOpaqueBounds = (
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  alphaThreshold = 16
) => {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] <= alphaThreshold) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return maxX < minX || maxY < minY
    ? null
    : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
};

const canvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Nao foi possivel criar o resultado simulado.'));
    }, 'image/png');
  });

const buildMockOutpainting = async (imageFile: File) => {
  if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') return imageFile;

  const bitmap = await createImageBitmap(imageFile);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Nao foi possivel preparar o preenchimento simulado.');

    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const bounds = findOpaqueBounds(pixels, canvas.width, canvas.height);
    if (!bounds) return imageFile;

    context.clearRect(0, 0, canvas.width, canvas.height);
    const coverScale = Math.max(canvas.width / bounds.width, canvas.height / bounds.height) * 1.08;
    const backgroundWidth = bounds.width * coverScale;
    const backgroundHeight = bounds.height * coverScale;

    context.save();
    context.filter = 'blur(32px) saturate(0.88) brightness(0.96)';
    context.globalAlpha = 0.92;
    context.drawImage(
      bitmap,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      (canvas.width - backgroundWidth) / 2,
      (canvas.height - backgroundHeight) / 2,
      backgroundWidth,
      backgroundHeight
    );
    context.restore();

    // Reaplica a composicao original sem qualquer filtro, preservando seus pixels.
    context.drawImage(bitmap, 0, 0);
    return await canvasToBlob(canvas);
  } finally {
    bitmap.close();
  }
};

export const requestOutpainting = async (input: {
  image: File;
  mask: File;
  direction: OutpaintingDirection;
  storeCode: string;
  cameraArea?: CameraArea;
  signal?: AbortSignal;
  mock?: boolean;
}) => {
  if (input.mock ?? isAiOutpaintingMockEnabled()) {
    await new Promise((resolve) => window.setTimeout(resolve, AI_OUTPAINTING_CONFIG.mockDelayMs));
    const mockResult = await buildMockOutpainting(input.image);
    return URL.createObjectURL(mockResult);
  }

  const form = new FormData();
  form.append('image', input.image);
  form.append('mask', input.mask);
  form.append('direction', input.direction);
  form.append('storeCode', input.storeCode);
  if (input.cameraArea) form.append('cameraArea', JSON.stringify(input.cameraArea));
  const response = await fetch(AI_OUTPAINTING_CONFIG.endpoint, { method: 'POST', body: form, signal: input.signal });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || ERROR_MESSAGES[payload.code] || ERROR_MESSAGES.UNKNOWN);
  if (!payload.imageBase64) throw new Error(ERROR_MESSAGES.EMPTY_RESPONSE);
  const binary = atob(payload.imageBase64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: payload.mimeType || 'image/png' }));
};
