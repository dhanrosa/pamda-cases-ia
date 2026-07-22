export type AiOutpaintingStatus =
  | 'original'
  | 'preparing'
  | 'generating'
  | 'ready'
  | 'error'
  | 'approved'
  | 'discarded';

export type OutpaintingDirection = 'above' | 'below' | 'vertical' | 'sides' | 'multiple';

export type PrintTransform = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  mirrored?: boolean;
};

export type CameraArea = { x: number; y: number; width: number; height: number };

export type OutpaintingGeometry = {
  canvasWidth: number;
  canvasHeight: number;
  imageX: number;
  imageY: number;
  imageWidth: number;
  imageHeight: number;
  empty: { top: number; right: number; bottom: number; left: number };
  direction: OutpaintingDirection;
  hasEmptyRegions: boolean;
};

export type PreparedOutpainting = {
  baseFile: File;
  maskFile: File;
  previewUrl: string;
  geometry: OutpaintingGeometry;
};

export type AiOutpaintingErrorCode =
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FORMAT'
  | 'CORRUPT_IMAGE'
  | 'INVALID_MASK'
  | 'DIMENSION_MISMATCH'
  | 'NETWORK_ERROR'
  | 'MISSING_API_KEY'
  | 'SERVER_DISABLED'
  | 'SAFETY_BLOCKED'
  | 'RATE_LIMITED'
  | 'EMPTY_RESPONSE'
  | 'UNKNOWN';
