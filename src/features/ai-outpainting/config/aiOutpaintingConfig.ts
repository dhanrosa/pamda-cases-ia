export const AI_OUTPAINTING_CONFIG = {
  canvas: { width: 816, height: 1744 },
  maxFileBytes: 10 * 1024 * 1024,
  acceptedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
  generationCooldownMs: 12_000,
  mockDelayMs: 1_500,
  cameraSafeInsetRatio: 0.035,
  seamOverlapPixels: 5,
  emptyRegionTolerance: { dimensionRatio: 0.01, minimumPixels: 4 },
  endpoint: '/api/ai/outpaint',
} as const;

export const isAiOutpaintingFeatureEnabled = () =>
  import.meta.env.VITE_ENABLE_AI_OUTPAINTING === 'true';

export const isAiOutpaintingMockEnabled = () =>
  import.meta.env.VITE_AI_OUTPAINTING_MOCK === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_AI_OUTPAINTING_MOCK !== 'false');

export const isAiOutpaintingAvailable = (
  featureEnabled: boolean,
  serverEnabled: boolean,
  mockEnabled = false
) => featureEnabled && (mockEnabled || serverEnabled);
