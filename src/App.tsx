/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import './image.css';
import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  X,
  Download,
  Camera,
  ChevronRight,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  Type,
  FlipHorizontal,
  RotateCw,
  Bold,
  Italic,
  Underline,
  Check,
  ShoppingCart,
  Trash2,
  Plus,
  LogOut,
  Store,
  LayoutGrid,
  SlidersHorizontal,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { PhoneModel } from './constants';
import { CatalogoImagens } from './components/CatalogoImagens';
import { listarCatalogoStorage } from './lib/catalogoStorage';
import { AiOutpaintingModal } from './features/ai-outpainting/components/AiOutpaintingModal';
import { AiOutpaintingSuggestion } from './features/ai-outpainting/components/AiOutpaintingSuggestion';
import { useAiOutpainting } from './features/ai-outpainting/hooks/useAiOutpainting';
import { calculateCurrentEmptyRegions } from './features/ai-outpainting/utils/calculateContainPlacement';
import heroBannerUrl from './public/BANNERS SITE/heroi.mp4';
import catalogBannerUrl from './public/BANNERS SITE/bannercatalogo.jpg';
import fathersDayBannerUrl from './public/BANNERS SITE/bannerpais.mp4';
import saturdayBannerUrl from './public/BANNERS SITE/bannersabados.jpg';
import bikeBannerUrl from './public/BANNERS SITE/bike.jpg';
import motoboyBannerUrl from './public/BANNERS SITE/MOTOBOY.jpg';
import loginPandaBackgroundUrl from './public/login-panda-bg.jpg';

const TesteCatalogo = lazy(() => import('./pages/TesteCatalogo'));

const GOOGLE_FONTS = [
  { name: 'Lexend', value: "'Lexend', sans-serif" },
  { name: 'Arial', value: 'sans-serif' },
  { name: 'Roboto', value: "'Roboto', sans-serif" },
  { name: 'Open Sans', value: "'Open Sans', sans-serif" },
  { name: 'Montserrat', value: "'Montserrat', sans-serif" },
  { name: 'Playfair Display', value: "'Playfair Display', serif" },
  { name: 'Oswald', value: "'Oswald', sans-serif" },
  { name: 'Lora', value: "'Lora', serif" },
  { name: 'Comfortaa', value: "'Comfortaa', cursive" },
  { name: 'Caveat', value: "'Caveat', cursive" },
  { name: 'Pacifico', value: "'Pacifico', cursive" },
  { name: 'Dancing Script', value: "'Dancing Script', cursive" },
  { name: 'Satisfy', value: "'Satisfy', cursive" },
  { name: 'Great Vibes', value: "'Great Vibes', cursive" },
  { name: 'Indie Flower', value: "'Indie Flower', cursive" },
  { name: 'Permanent Marker', value: "'Permanent Marker', cursive" },
  { name: 'Shadows Into Light', value: "'Shadows Into Light', cursive" },
  { name: 'Amatic SC', value: "'Amatic SC', cursive" },
  { name: 'Special Elite', value: "'Special Elite', cursive" },
  { name: 'Bangers', value: "'Bangers', cursive" },
  { name: 'Lobster', value: "'Lobster', cursive" },
  { name: 'Sacramento', value: "'Sacramento', cursive" },
  { name: 'Cookie', value: "'Cookie', cursive" },
];
const OPTIONAL_GOOGLE_FONTS_STYLESHEET_ID = 'pamda-editor-fonts';
const OPTIONAL_GOOGLE_FONTS_STYLESHEET_URL =
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&family=Montserrat:wght@400;700&family=Playfair+Display:wght@400;700&family=Oswald:wght@400;700&family=Lora:wght@400;700&family=Caveat:wght@400;700&family=Pacifico&family=Dancing+Script:wght@400;700&family=Satisfy&family=Great+Vibes&family=Comfortaa:wght@400;700&family=Indie+Flower&family=Permanent+Marker&family=Shadows+Into+Light&family=Amatic+SC:wght@400;700&family=Special+Elite&family=Bangers&family=Lobster&family=Sacramento&family=Cookie&display=swap';

const TEXT_COLOR_PRESETS = [
  '#000000',
  '#ffffff',
  '#435446',
  '#6b7280',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#0ea5e9',
  '#6366f1',
  '#ec4899',
  '#7c3aed',
];

const MAX_CUSTOM_TEXT_LENGTH = 80;
const EXPORT_WIDTH = 405;
const EXPORT_HEIGHT = 720;
const PREVIEW_ASPECT_RATIO = EXPORT_WIDTH / EXPORT_HEIGHT;
const IMAGE_AREA_VERTICAL_INSET = 0.035;
const FINAL_PRINT_ASPECT_RATIO = 816 / 1744;
const IMAGE_AREA_HORIZONTAL_INSET =
  (1 - FINAL_PRINT_ASPECT_RATIO * ((EXPORT_HEIGHT * (1 - IMAGE_AREA_VERTICAL_INSET * 2)) / EXPORT_WIDTH)) / 2;
const IMAGE_AREA_ASPECT_RATIO =
  (EXPORT_WIDTH * (1 - IMAGE_AREA_HORIZONTAL_INSET * 2)) /
  (EXPORT_HEIGHT * (1 - IMAGE_AREA_VERTICAL_INSET * 2));
const MOBILE_LAYOUT_MAX_WIDTH = 1180;
const MOBILE_LAYOUT_MIN_HEIGHT = 820;
const MOBILE_HEADER_ESTIMATED_HEIGHT = 84;
const MOBILE_BOTTOM_BAR_ESTIMATED_HEIGHT = 108;
const MOBILE_STEP_PROGRESS_ESTIMATED_HEIGHT = 48;
const PANDA_LOGO_URL =
  'https://res.cloudinary.com/dwexdk5pp/image/upload/v1773958801/logo_pamda_te76in.png';
const TEXT_CENTER_SNAP_DISTANCE = 32;
const CASE_LOGO_DESKTOP_POSITION = {
  top: 625,
  right: 170,
  size: 60,
};
const LOGO_POSITION_SAFE_INSET_X = 0.15;
const LOGO_POSITION_SAFE_INSET_Y = 0.05;
const CASE_LOGO_DEFAULT_POSITION = {
  x: Math.min(
    EXPORT_WIDTH * (1 - LOGO_POSITION_SAFE_INSET_X) - CASE_LOGO_DESKTOP_POSITION.size,
    Math.max(
      EXPORT_WIDTH * LOGO_POSITION_SAFE_INSET_X,
      EXPORT_WIDTH - CASE_LOGO_DESKTOP_POSITION.right - CASE_LOGO_DESKTOP_POSITION.size
    )
  ),
  y: Math.min(
    EXPORT_HEIGHT * (1 - LOGO_POSITION_SAFE_INSET_Y) - CASE_LOGO_DESKTOP_POSITION.size,
    Math.max(EXPORT_HEIGHT * LOGO_POSITION_SAFE_INSET_Y, CASE_LOGO_DESKTOP_POSITION.top)
  ),
};
const PENDING_PREVIEW_ASSET_STORAGE_KEY = 'pamda:pending-preview-asset';
const PENDING_PREVIEW_MODEL_STORAGE_KEY = 'pamda:pending-preview-model';
const PENDING_PREVIEW_ARTWORK_STORAGE_KEY = 'pamda:pending-preview-artwork';
const STORE_ACCESS_STORAGE_KEY = 'pamda:store-access';
const ADMIN_ACCESS_CODE = '1806';
const MAX_ARTWORK_GAP_PERCENT = 1;
const DEFAULT_ARTWORK_BACKGROUND = 'transparent';
const ARTWORK_BACKGROUND_PRESETS = ['#ffffff', '#000000', '#e7e2d7', '#435446', '#ef4444', '#0ea5e9'];
const ARTWORK_CONTEXT_DB_NAME = 'pamda-artwork-context';
const ARTWORK_CONTEXT_STORE_NAME = 'pending-context';
const ARTWORK_CONTEXT_KEY = 'catalog-return';
const DESKTOP_BANNERS: Array<{ src: string; alt: string; type: 'image' | 'video' }> = [
  { src: heroBannerUrl, alt: 'Video heroi Pamda Cases', type: 'video' },
  { src: catalogBannerUrl, alt: 'Banner do catalogo Pamda Cases', type: 'image' },
  { src: fathersDayBannerUrl, alt: 'Banner de Dia dos Pais Pamda Cases', type: 'video' },
  { src: saturdayBannerUrl, alt: 'Banner de sabados Pamda Cases', type: 'image' },
  { src: bikeBannerUrl, alt: 'Banner promocional Pamda Cases', type: 'image' },
  { src: motoboyBannerUrl, alt: 'Banner de entrega Pamda Cases', type: 'image' },
];
const DESKTOP_BANNER_INTERVAL_MS = 15000;
const PAMDA_WHATSAPP_NUMBER = '5541997431129';
const STORE_CODE_REQUEST_WHATSAPP_MESSAGE =
  'Olá, gostaria de solicitar o código da minha loja para acessar o site de capinhas.';

const getPamdaWhatsAppUrl = (message: string) =>
  `https://wa.me/${PAMDA_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

const normalizeCatalogSearchText = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const getEquivalentCatalogSearchQueries = (query: string) => {
  const normalizedQuery = normalizeCatalogSearchText(query);
  const queries = new Set([normalizedQuery]);

  if (normalizedQuery.includes('coxa')) {
    queries.add(normalizedQuery.replace(/\bcoxa\b/g, 'coritiba'));
    queries.add('coritiba');
  }

  if (normalizedQuery.includes('coritiba')) {
    queries.add(normalizedQuery.replace(/\bcoritiba\b/g, 'coxa'));
    queries.add('coxa');
  }

  return [...queries].filter(Boolean);
};

type ItemCarrinho = {
  id: string;
  marca: string;
  modelo: string;
  layout?: string;
  quantidade: number;
  texto?: string;
  corTexto?: string;
  fonteTexto?: string;
  tamanhoTexto?: number;
  espacamentoTexto?: number;
  negrito?: boolean;
  italico?: boolean;
  sublinhado?: boolean;
  imagemPreviewUrl?: string;
  imagemArteFinalUrl?: string;
  previewLocal?: string;
  resumo?: string;
  temImagem: boolean;
  modoSomenteTexto: boolean;
};

type CatalogImageAsset = {
  id: string;
  name: string;
  publicId: string;
  url: string;
  thumbnail?: string;
  categoria?: string;
  subcategoria?: string;
  caminho?: string;
  width?: number;
  height?: number;
};

type LayoutSlotArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ArtworkLayout = {
  id: string;
  name: string;
  slots: LayoutSlotArea[];
};

type ArtworkImageSlot = {
  image: string | null;
  imageRatio: number | null;
  position: { x: number; y: number };
  zoom: number;
  rotation: number;
  mirrored: boolean;
};

type ModelPreviewCorrection = {
  x?: number;
  y?: number;
  scale?: number;
};

const DEFAULT_MODEL_PREVIEW_CORRECTION: Required<ModelPreviewCorrection> = {
  x: 0,
  y: 0,
  scale: 1,
};

const MODEL_PREVIEW_CORRECTIONS: Record<string, ModelPreviewCorrection> = {
  // Exemplo: 'apple|iphone 15 pro': { x: -4, y: 2, scale: 1.01 },
};

const normalizeModelCorrectionKey = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const getModelCorrectionKey = (model: Pick<PhoneModel, 'brand' | 'name'>) =>
  `${normalizeModelCorrectionKey(model.brand)}|${normalizeModelCorrectionKey(model.name)}`;

const getModelPreviewCorrection = (model: PhoneModel | null): Required<ModelPreviewCorrection> => {
  if (!model) return DEFAULT_MODEL_PREVIEW_CORRECTION;

  const correction = model.previewCorrection || MODEL_PREVIEW_CORRECTIONS[getModelCorrectionKey(model)];

  return {
    x: correction?.x ?? DEFAULT_MODEL_PREVIEW_CORRECTION.x,
    y: correction?.y ?? DEFAULT_MODEL_PREVIEW_CORRECTION.y,
    scale: correction?.scale ?? DEFAULT_MODEL_PREVIEW_CORRECTION.scale,
  };
};

const getResolvedModelPreviewCorrection = (
  model: PhoneModel | null,
  automaticCorrection?: Required<ModelPreviewCorrection>
) => {
  const fixedCorrection = getModelPreviewCorrection(model);
  const automaticX = automaticCorrection?.x ?? 0;
  const automaticY = automaticCorrection?.y ?? 0;
  const automaticScale = automaticCorrection?.scale ?? 1;

  return {
    x: fixedCorrection.x + automaticX,
    y: fixedCorrection.y + automaticY,
    scale: fixedCorrection.scale * automaticScale,
  };
};

const getModelLayerCorrectionStyle = (
  model: PhoneModel | null,
  dimensions = { width: EXPORT_WIDTH, height: EXPORT_HEIGHT },
  correctionOverride?: Required<ModelPreviewCorrection>
): React.CSSProperties => {
  const correction = correctionOverride || getModelPreviewCorrection(model);
  const scaleX = dimensions.width / EXPORT_WIDTH;
  const scaleY = dimensions.height / EXPORT_HEIGHT;

  return {
    transform: `translate(${correction.x * scaleX}px, ${correction.y * scaleY}px) scale(${correction.scale})`,
    transformOrigin: 'center center',
  };
};

const loadImageElement = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const imageElement = new Image();
    imageElement.crossOrigin = 'anonymous';
    imageElement.onload = () => resolve(imageElement);
    imageElement.onerror = () => reject(new Error('Nao foi possivel carregar a imagem do modelo.'));
    imageElement.src = src;
  });

const computeAutomaticModelPreviewCorrection = async (
  imageUrl: string
): Promise<Required<ModelPreviewCorrection>> => {
  if (typeof document === 'undefined' || !imageUrl) return DEFAULT_MODEL_PREVIEW_CORRECTION;

  const imageElement = await loadImageElement(imageUrl);
  const width = imageElement.naturalWidth || imageElement.width;
  const height = imageElement.naturalHeight || imageElement.height;
  if (!width || !height) return DEFAULT_MODEL_PREVIEW_CORRECTION;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return DEFAULT_MODEL_PREVIEW_CORRECTION;

  context.drawImage(imageElement, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  const getCorrectionFromBounds = (bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  }) => {
    const visibleCenterX = ((bounds.minX + bounds.maxX + 1) / 2 / width) * EXPORT_WIDTH;
    const visibleCenterY = ((bounds.minY + bounds.maxY + 1) / 2 / height) * EXPORT_HEIGHT;
    const x = Number((EXPORT_WIDTH / 2 - visibleCenterX).toFixed(1));
    const y = Number((EXPORT_HEIGHT / 2 - visibleCenterY).toFixed(1));

    return {
      x: Math.abs(x) < 0.5 ? 0 : x,
      y: Math.abs(y) < 0.5 ? 0 : y,
      scale: 1,
    };
  };
  const getPixel = (x: number, y: number) => {
    const offset = (y * width + x) * 4;
    return {
      r: pixels[offset],
      g: pixels[offset + 1],
      b: pixels[offset + 2],
      a: pixels[offset + 3],
    };
  };
  const cornerInset = Math.max(1, Math.floor(Math.min(width, height) * 0.02));
  const backgroundSamples = [
    getPixel(cornerInset, cornerInset),
    getPixel(width - cornerInset - 1, cornerInset),
    getPixel(cornerInset, height - cornerInset - 1),
    getPixel(width - cornerInset - 1, height - cornerInset - 1),
  ];
  const backgroundColor = backgroundSamples.reduce(
    (acc, sample) => ({
      r: acc.r + sample.r / backgroundSamples.length,
      g: acc.g + sample.g / backgroundSamples.length,
      b: acc.b + sample.b / backgroundSamples.length,
    }),
    { r: 0, g: 0, b: 0 }
  );
  const backgroundDistanceThreshold = 10;
  const alphaThreshold = 12;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const alpha = pixels[offset + 3];
      if (alpha <= alphaThreshold) continue;
      const redDistance = pixels[offset] - backgroundColor.r;
      const greenDistance = pixels[offset + 1] - backgroundColor.g;
      const blueDistance = pixels[offset + 2] - backgroundColor.b;
      const backgroundDistance = Math.sqrt(
        redDistance * redDistance + greenDistance * greenDistance + blueDistance * blueDistance
      );
      if (backgroundDistance <= backgroundDistanceThreshold) continue;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) return DEFAULT_MODEL_PREVIEW_CORRECTION;

  return getCorrectionFromBounds({ minX, minY, maxX, maxY });
};

const createEmptyArtworkSlot = (): ArtworkImageSlot => ({
  image: null,
  imageRatio: null,
  position: { x: 0, y: 0 },
  zoom: 100,
  rotation: 0,
  mirrored: false,
});

const ARTWORK_LAYOUTS: ArtworkLayout[] = [
  { id: 'single', name: '1 foto', slots: [{ x: 0, y: 0, width: 100, height: 100 }] },
  {
    id: 'two-horizontal',
    name: '2 fotos',
    slots: [
      { x: 0, y: 0, width: 100, height: 49.5 },
      { x: 0, y: 50.5, width: 100, height: 49.5 },
    ],
  },
  {
    id: 'three-horizontal',
    name: '3 fotos',
    slots: [
      { x: 0, y: 0, width: 100, height: 32.7 },
      { x: 0, y: 33.7, width: 100, height: 32.6 },
      { x: 0, y: 67.3, width: 100, height: 32.7 },
    ],
  },
  {
    id: 'four-grid',
    name: '4 fotos',
    slots: [
      { x: 0, y: 0, width: 49.5, height: 49.5 },
      { x: 50.5, y: 0, width: 49.5, height: 49.5 },
      { x: 0, y: 50.5, width: 49.5, height: 49.5 },
      { x: 50.5, y: 50.5, width: 49.5, height: 49.5 },
    ],
  },
  {
    id: 'five-featured',
    name: '5 fotos - centro',
    slots: [
      { x: 0, y: 0, width: 49.5, height: 32.7 },
      { x: 50.5, y: 0, width: 49.5, height: 32.7 },
      { x: 0, y: 33.7, width: 100, height: 32.6 },
      { x: 0, y: 67.3, width: 49.5, height: 32.7 },
      { x: 50.5, y: 67.3, width: 49.5, height: 32.7 },
    ],
  },
  {
    id: 'five-featured-top',
    name: '5 fotos - topo',
    slots: [
      { x: 0, y: 0, width: 100, height: 32.7 },
      { x: 0, y: 33.7, width: 49.5, height: 32.6 },
      { x: 50.5, y: 33.7, width: 49.5, height: 32.6 },
      { x: 0, y: 67.3, width: 49.5, height: 32.7 },
      { x: 50.5, y: 67.3, width: 49.5, height: 32.7 },
    ],
  },
  {
    id: 'five-featured-bottom',
    name: '5 fotos - base',
    slots: [
      { x: 0, y: 0, width: 49.5, height: 32.7 },
      { x: 50.5, y: 0, width: 49.5, height: 32.7 },
      { x: 0, y: 33.7, width: 49.5, height: 32.6 },
      { x: 50.5, y: 33.7, width: 49.5, height: 32.6 },
      { x: 0, y: 67.3, width: 100, height: 32.7 },
    ],
  },
  {
    id: 'six-grid',
    name: '6 fotos',
    slots: [
      { x: 0, y: 0, width: 49.5, height: 32.7 },
      { x: 50.5, y: 0, width: 49.5, height: 32.7 },
      { x: 0, y: 33.7, width: 49.5, height: 32.6 },
      { x: 50.5, y: 33.7, width: 49.5, height: 32.6 },
      { x: 0, y: 67.3, width: 49.5, height: 32.7 },
      { x: 50.5, y: 67.3, width: 49.5, height: 32.7 },
    ],
  },
];

const interpolate = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;

const getGaplessSlotArea = (area: LayoutSlotArea): LayoutSlotArea => {
  const startMap = new Map([
    [50.5, 50],
    [33.7, 100 / 3],
    [67.3, (100 / 3) * 2],
  ]);
  const sizeMap = new Map([
    [49.5, 50],
    [32.7, 100 / 3],
    [32.6, 100 / 3],
  ]);

  return {
    x: startMap.get(area.x) ?? area.x,
    y: startMap.get(area.y) ?? area.y,
    width: sizeMap.get(area.width) ?? area.width,
    height: sizeMap.get(area.height) ?? area.height,
  };
};

const getAdjustedSlotArea = (area: LayoutSlotArea, gapPercent: number): LayoutSlotArea => {
  const gapless = getGaplessSlotArea(area);
  const amount = clampNumber(gapPercent / MAX_ARTWORK_GAP_PERCENT, 0, 1);

  return {
    x: interpolate(gapless.x, area.x, amount),
    y: interpolate(gapless.y, area.y, amount),
    width: interpolate(gapless.width, area.width, amount),
    height: interpolate(gapless.height, area.height, amount),
  };
};

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const openArtworkContextDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(ARTWORK_CONTEXT_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(ARTWORK_CONTEXT_STORE_NAME)) {
        request.result.createObjectStore(ARTWORK_CONTEXT_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const setPendingArtworkContext = async (context: unknown) => {
  const db = await openArtworkContextDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(ARTWORK_CONTEXT_STORE_NAME, 'readwrite');
    transaction.objectStore(ARTWORK_CONTEXT_STORE_NAME).put(context, ARTWORK_CONTEXT_KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
};

const takePendingArtworkContext = async <T,>() => {
  const db = await openArtworkContextDb();
  const context = await new Promise<T | null>((resolve, reject) => {
    const transaction = db.transaction(ARTWORK_CONTEXT_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(ARTWORK_CONTEXT_STORE_NAME);
    const request = store.get(ARTWORK_CONTEXT_KEY);
    request.onsuccess = () => {
      store.delete(ARTWORK_CONTEXT_KEY);
      resolve((request.result as T | undefined) || null);
    };
    request.onerror = () => reject(request.error);
  });
  db.close();
  return context;
};

type StoreAccess = {
  code: string;
  name: string;
  freight?: string;
  isAdmin?: boolean;
};

type AuthorizedStore = {
  code: string;
  name: string;
  freight?: string;
};

const STORE_CODE_PATTERN = /^\d{3,4}$/;
const normalizeStoreCode = (value: string) => value.trim();
const sanitizeStoreCodeInput = (value: string) => value.replace(/\D/g, '').slice(0, 4);
const isPickupOnlyFreight = (value?: string) =>
  String(value || '').trim().toUpperCase() === 'RETIRADA';
const parseFreightAmount = (value?: string) => {
  if (!value || isPickupOnlyFreight(value)) return 0;

  const normalizedValue = String(value)
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const amount = Number.parseFloat(normalizedValue);

  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
};
const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const requestStoreAccess = async <T,>(
  action: string,
  options: {
    method?: 'GET' | 'POST';
    body?: Record<string, string>;
    query?: Record<string, string>;
  } = {}
) => {
  const method = options.method || 'GET';
  const url = new URL('/api/store-access', window.location.origin);
  url.searchParams.set('action', action);
  Object.entries(options.query || {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    method,
    headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
    body: method === 'POST' ? JSON.stringify({ action, ...options.body }) : undefined,
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error || 'Nao foi possivel consultar os acessos.');
  }

  return data;
};

const getStoredStoreAccess = (): StoreAccess | null => {
  if (typeof window === 'undefined') return null;

  try {
    const storedAccess = JSON.parse(
      window.localStorage.getItem(STORE_ACCESS_STORAGE_KEY) || 'null'
    ) as StoreAccess | null;

    if (!storedAccess?.code || !storedAccess?.name) return null;

    const code = normalizeStoreCode(storedAccess.code);
    return {
      code,
      name: storedAccess.name,
      freight: storedAccess.freight,
      isAdmin: code === ADMIN_ACCESS_CODE,
    };
  } catch {
    return null;
  }
};

function MainApp({ storeAccess }: { storeAccess: StoreAccess }) {
  const [image, setImage] = useState<string | null>(null);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null);
  const [artworkSlots, setArtworkSlots] = useState<ArtworkImageSlot[]>([]);
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);
  const [artworkBackground, setArtworkBackground] = useState(DEFAULT_ARTWORK_BACKGROUND);
  const [artworkGapPercent, setArtworkGapPercent] = useState(MAX_ARTWORK_GAP_PERCENT);
  const [movingSlotIndex, setMovingSlotIndex] = useState<number | null>(null);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogAllAssets, setCatalogAllAssets] = useState<CatalogImageAsset[]>([]);
  const [catalogAssets, setCatalogAssets] = useState<CatalogImageAsset[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<string[]>([]);
  const [catalogSubcategories, setCatalogSubcategories] = useState<string[]>([]);
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('');
  const [catalogSubcategoryFilter, setCatalogSubcategoryFilter] = useState('');
  const [isCatalogSearchOpen, setIsCatalogSearchOpen] = useState(false);
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);
  const [catalogSearchError, setCatalogSearchError] = useState('');
  const [selectedCatalogAssetId, setSelectedCatalogAssetId] = useState<string | null>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [logoPosition, setLogoPosition] = useState(CASE_LOGO_DEFAULT_POSITION);
  const [isCaseLogoVisible, setIsCaseLogoVisible] = useState(true);
  const [imageRatio, setImageRatio] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragLimits, setDragLimits] = useState({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  });

  const [isUploadingOrder, setIsUploadingOrder] = useState(false);
  const [isGeneratingPreviewPrint, setIsGeneratingPreviewPrint] = useState(false);
  const [previewPrintMessage, setPreviewPrintMessage] = useState('');
  const [zoom, setZoom] = useState(100);
  const [phoneModels, setPhoneModels] = useState<PhoneModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelLoadError, setModelLoadError] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<PhoneModel | null>(null);
  const [automaticModelCorrection, setAutomaticModelCorrection] =
    useState<Required<ModelPreviewCorrection>>(DEFAULT_MODEL_PREVIEW_CORRECTION);
  const [searchQuery, setSearchQuery] = useState('');

  const [textOnlyMode, setTextOnlyMode] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);

  const [customText, setCustomText] = useState('');
  const [textColor, setTextColor] = useState('#000000');
  const [textFont, setTextFont] = useState(GOOGLE_FONTS[0].value);
  const [textSize, setTextSize] = useState(24);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [textCenterGuide, setTextCenterGuide] = useState({
    vertical: false,
    horizontal: false,
  });
  const [isTextDragging, setIsTextDragging] = useState(false);
  const [textResetKey, setTextResetKey] = useState(0);
  const [textRotation, setTextRotation] = useState(0);
  const [imageRotation, setImageRotation] = useState(0);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textStroke, setTextStroke] = useState(0);
  const [textStrokeColor, setTextStrokeColor] = useState('#000000');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const productionRef = useRef<HTMLDivElement>(null);
  const imageAreaRef = useRef<HTMLDivElement>(null);
  const imageDragGestureRef = useRef<{
    pointerId: number;
    startPointer: { x: number; y: number };
    startPosition: { x: number; y: number };
  } | null>(null);
  const mobileInspectViewportRef = useRef<HTMLDivElement>(null);
  const initialDevicePixelRatioRef = useRef(
    typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  );
  const mobileInspectGestureRef = useRef({
    mode: 'none' as 'none' | 'pan' | 'pinch',
    startDistance: 0,
    startScale: 1,
    startOffset: { x: 0, y: 0 },
    startTouch: { x: 0, y: 0 },
    startMidpoint: { x: 0, y: 0 },
  });
  const mobileTextGestureRef = useRef({
    startDistance: 0,
    startSize: 24,
  });
  const textDragStartPositionRef = useRef({ x: 0, y: 0 });

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'delivery' | 'pickup'>(() =>
    isPickupOnlyFreight(storeAccess.freight) ? 'pickup' : 'delivery'
  );
  const [customerProvidesCases, setCustomerProvidesCases] = useState(false);
  const [customerProvidedCasesQuantity, setCustomerProvidedCasesQuantity] = useState(0);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [isArtworkApproved, setIsArtworkApproved] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [desktopStep, setDesktopStep] = useState(1);
  const [skipTextStep, setSkipTextStep] = useState(false);
  const [imageResetKey, setImageResetKey] = useState(0);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [mobileBrandSearchQuery, setMobileBrandSearchQuery] = useState('');
  const [isBrandSearchMode, setIsBrandSearchMode] = useState(false);
  const [isMobileImageEditing, setIsMobileImageEditing] = useState(false);
  const [isMobileTextModalOpen, setIsMobileTextModalOpen] = useState(false);
  const [isMobileTextEditing, setIsMobileTextEditing] = useState(false);
  const [isMobileFullscreenPreviewOpen, setIsMobileFullscreenPreviewOpen] = useState(false);
  const [mobileInspectScale, setMobileInspectScale] = useState(1);
  const [mobileInspectOffset, setMobileInspectOffset] = useState({ x: 0, y: 0 });
  const [activeDesktopBannerIndex, setActiveDesktopBannerIndex] = useState(0);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));
  const [pageZoomScale, setPageZoomScale] = useState(1);
  const [isMobileLayout, setIsMobileLayout] = useState(() =>
    typeof window !== 'undefined'
      ? typeof window.matchMedia === 'function' &&
        window.matchMedia('(pointer: coarse)').matches
      : false
  );
  const [previewRenderSize, setPreviewRenderSize] = useState({
    width: EXPORT_WIDTH,
    height: EXPORT_HEIGHT,
  });
  const [mobileEditorReferenceSize, setMobileEditorReferenceSize] = useState({
    width: EXPORT_WIDTH,
    height: EXPORT_HEIGHT,
  });

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const getLogoBounds = (frameDimensions = { width: EXPORT_WIDTH, height: EXPORT_HEIGHT }) => {
    const frameScaleX = frameDimensions.width / EXPORT_WIDTH;
    const frameScaleY = frameDimensions.height / EXPORT_HEIGHT;
    const logoWidth = CASE_LOGO_DESKTOP_POSITION.size * frameScaleX;
    const logoHeight = CASE_LOGO_DESKTOP_POSITION.size * frameScaleY;
    const insetX = frameDimensions.width * LOGO_POSITION_SAFE_INSET_X;
    const insetY = frameDimensions.height * LOGO_POSITION_SAFE_INSET_Y;

    return {
      left: insetX,
      right: Math.max(insetX, frameDimensions.width - insetX - logoWidth),
      top: insetY,
      bottom: Math.max(insetY, frameDimensions.height - insetY - logoHeight),
    };
  };

  const clampLogoPosition = (
    nextPosition: { x: number; y: number },
    frameDimensions = { width: EXPORT_WIDTH, height: EXPORT_HEIGHT }
  ) => {
    const bounds = getLogoBounds(frameDimensions);
    const frameScaleX = frameDimensions.width / EXPORT_WIDTH;
    const frameScaleY = frameDimensions.height / EXPORT_HEIGHT;

    return {
      x: clamp(nextPosition.x, bounds.left / frameScaleX, bounds.right / frameScaleX),
      y: clamp(nextPosition.y, bounds.top / frameScaleY, bounds.bottom / frameScaleY),
    };
  };

  const brands = useMemo(() => {
    return [...new Set(phoneModels.map((model) => model.brand).filter(Boolean))];
  }, [phoneModels]);

  const normalizedRotation = ((imageRotation % 360) + 360) % 360;
  const isQuarterTurn = normalizedRotation === 90 || normalizedRotation === 270;

  const effectiveRatio = imageRatio
    ? isQuarterTurn
      ? 1 / imageRatio
      : imageRatio
    : 1;
  const selectedLayout =
    ARTWORK_LAYOUTS.find((layout) => layout.id === selectedLayoutId) || null;
  const isMultiImageLayout = Boolean(selectedLayout && selectedLayout.slots.length > 1);
  const activeSlotArea = selectedLayout?.slots[activeSlotIndex]
    ? getAdjustedSlotArea(selectedLayout.slots[activeSlotIndex], artworkGapPercent)
    : { x: 0, y: 0, width: 100, height: 100 };
  const activeSlotAspectRatio =
    IMAGE_AREA_ASPECT_RATIO * (activeSlotArea.width / activeSlotArea.height);
  const shouldFitImageToHeight = effectiveRatio >= activeSlotAspectRatio;
  // O editor principal usa contain por padrao. O fluxo antigo vive em outra copia
  // e nao deve mais ser reativado silenciosamente por ausencia de variavel de ambiente.
  const containImageOnInitialPlacement = true;
  const minimumManualZoom = containImageOnInitialPlacement ? 50 : 100;
  const activePrintWidth = EXPORT_WIDTH * (1 - IMAGE_AREA_HORIZONTAL_INSET * 2) * (activeSlotArea.width / 100);
  const activePrintHeight = EXPORT_HEIGHT * (1 - IMAGE_AREA_VERTICAL_INSET * 2) * (activeSlotArea.height / 100);
  const outpaintingCanvasDimensions = {
    width: 816,
    height: 1744,
  };
  const currentEmptyAnalysis = image && imageRatio
    ? calculateCurrentEmptyRegions({
        imageWidth: isQuarterTurn ? 1000 : imageRatio * 1000,
        imageHeight: isQuarterTurn ? imageRatio * 1000 : 1000,
        printWidth: activePrintWidth,
        printHeight: activePrintHeight,
        zoomPercent: zoom,
        position,
      })
    : null;
  const needsAiOutpainting = Boolean(containImageOnInitialPlacement && currentEmptyAnalysis?.needsOutpainting);
  const activeZoom = zoom;
  const aiOutpaintingVisible = true;
  const aiOutpainting = useAiOutpainting({
    image,
    canvasDimensions: outpaintingCanvasDimensions,
    storeCode: storeAccess.code,
    transform: {
      x: position.x * (outpaintingCanvasDimensions.width / activePrintWidth),
      y: position.y * (outpaintingCanvasDimensions.height / activePrintHeight),
      scale: zoom / 100,
      rotation: imageRotation,
      mirrored: isMirrored,
    },
    onApprove: (nextImage) => {
      if (image?.startsWith('blob:') && image !== nextImage) URL.revokeObjectURL(image);
      setImage(nextImage);
      setImageRatio(outpaintingCanvasDimensions.width / outpaintingCanvasDimensions.height);
      setPosition({ x: 0, y: 0 });
      setZoom(100);
      setImageRotation(0);
      setIsMirrored(false);
      setImageResetKey((value) => value + 1);
    },
  });
  const filledArtworkSlots = artworkSlots
    .slice(0, selectedLayout?.slots.length || 0)
    .filter((slot) => Boolean(slot.image)).length;
  const missingArtworkSlots = Math.max(0, (selectedLayout?.slots.length || 0) - filledArtworkSlots);
  const hasArtworkImages = filledArtworkSlots > 0;
  const hasAllLayoutImages = Boolean(selectedLayout && missingArtworkSlots === 0);

  const applySlotToActiveEditor = (slot: ArtworkImageSlot) => {
    setImage(slot.image);
    setImageRatio(slot.imageRatio);
    setPosition(slot.position);
    setZoom(slot.zoom);
    setImageRotation(slot.rotation);
    setIsMirrored(slot.mirrored);
    setImageResetKey((prev) => prev + 1);
  };

  const getCurrentActiveSlot = (): ArtworkImageSlot => ({
    image,
    imageRatio,
    position,
    zoom,
    rotation: imageRotation,
    mirrored: isMirrored,
  });

  const swapArtworkSlots = (sourceIndex: number, targetIndex: number) => {
    if (sourceIndex === targetIndex) {
      setMovingSlotIndex(null);
      return;
    }

    const nextSlots = artworkSlots.map((slot, index) =>
      index === activeSlotIndex ? getCurrentActiveSlot() : slot
    );
    const sourceSlot = nextSlots[sourceIndex] || createEmptyArtworkSlot();
    nextSlots[sourceIndex] = nextSlots[targetIndex] || createEmptyArtworkSlot();
    nextSlots[targetIndex] = sourceSlot;

    setArtworkSlots(nextSlots);
    setActiveSlotIndex(targetIndex);
    applySlotToActiveEditor(nextSlots[targetIndex]);
    setMovingSlotIndex(null);
  };

  const selectArtworkSlot = (index: number) => {
    if (movingSlotIndex !== null) {
      swapArtworkSlots(movingSlotIndex, index);
      return;
    }

    const nextSlot = artworkSlots[index];
    if (!nextSlot) return;

    setActiveSlotIndex(index);
    applySlotToActiveEditor(nextSlot);
    setSelectedCatalogAssetId(null);
    setIsCatalogSearchOpen(false);
  };

  const selectArtworkLayout = (layout: ArtworkLayout) => {
    const nextSlots = Array.from(
      { length: Math.max(6, artworkSlots.length) },
      (_, index) => artworkSlots[index] || createEmptyArtworkSlot()
    );
    const nextActiveIndex = Math.min(activeSlotIndex, layout.slots.length - 1);

    setSelectedLayoutId(layout.id);
    setArtworkSlots(nextSlots);
    setActiveSlotIndex(nextActiveIndex);
    applySlotToActiveEditor(nextSlots[nextActiveIndex]);
  };

  useEffect(() => {
    if (!selectedLayout || !artworkSlots[activeSlotIndex]) return;

    setArtworkSlots((prev) =>
      prev.map((slot, index) =>
        index === activeSlotIndex
          ? {
              image,
              imageRatio,
              position,
              zoom,
              rotation: imageRotation,
              mirrored: isMirrored,
            }
          : slot
      )
    );
  }, [
    activeSlotIndex,
    image,
    imageRatio,
    imageRotation,
    isMirrored,
    position,
    selectedLayoutId,
    zoom,
  ]);

  const getScaledStroke = (fontSize: number) => {
    if (textStroke <= 0) return 0;
    return Math.max(0.6, Number(((fontSize / 24) * textStroke).toFixed(2)));
  };

  const buildExternalTextShadow = (strokeSize: number, strokeColor: string) => {
    if (strokeSize <= 0) {
      return '0 2px 4px rgba(0,0,0,0.18)';
    }

    const layers: string[] = [];
    const maxRadius = Math.max(1, Math.ceil(strokeSize));
    const angleStep = 20;

    for (let radius = 1; radius <= maxRadius; radius += 1) {
      for (let angle = 0; angle < 360; angle += angleStep) {
        const radians = (angle * Math.PI) / 180;
        const x = Number((Math.cos(radians) * radius).toFixed(2));
        const y = Number((Math.sin(radians) * radius).toFixed(2));
        layers.push(`${x}px ${y}px 0 ${strokeColor}`);
      }
    }

    layers.push('0 2px 4px rgba(0,0,0,0.18)');
    return layers.join(', ');
  };

  const getDirectImageUrl = (url: string) => {
    if (!url || typeof url !== 'string') return '';
    const trimmedUrl = url.trim();

    if (trimmedUrl.includes('drive.google.com')) {
      const idMatch =
        trimmedUrl.match(/\/d\/([^\/]+)/) || trimmedUrl.match(/id=([^&]+)/);

      if (idMatch && idMatch[1]) {
        return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
      }
    }

    return trimmedUrl;
  };

  const inferCameraLayoutFromModelName = (
    modelName: string
  ): PhoneModel['cameraLayout'] => {
    const normalized = modelName.trim().toLowerCase();

    if (normalized.includes('iphone 11')) return 'iphone-11';
    if (
      normalized.includes('pro max') ||
      normalized.includes('promax') ||
      normalized.includes('xs max') ||
      normalized.includes('max')
    ) {
      return 'triple-square-left';
    }
    if (normalized.includes('pro')) return 'triple-square-left';
    if (normalized.includes('x') || normalized.includes('xs') || normalized.includes('xr')) {
      return 'dual-vertical-left';
    }
    if (normalized.includes('plus')) return 'dual-vertical-left';
    if (normalized.startsWith('iphone')) return 'single-top-left';
    if (normalized.startsWith('galaxy')) return 'vertical-strip-left';
    if (normalized.startsWith('moto') || normalized.startsWith('edge')) {
      return 'dual-vertical-left';
    }
    if (
      normalized.startsWith('redmi') ||
      normalized.startsWith('poco') ||
      normalized.startsWith('xiaomi')
    ) {
      return 'vertical-strip-left';
    }

    return 'single-top-left';
  };

  useEffect(() => {
    async function loadModelsFromSheet() {
      setIsLoadingModels(true);
      setModelLoadError('');

      try {
        const response = await fetch('/api/modelos');
        const data = (await response.json().catch(() => ({}))) as {
          models?: Array<{ brand: string; name: string; bodyUrl: string; maskUrl: string }>;
          error?: string;
        };
        if (!response.ok) throw new Error(data.error || 'Nao foi possivel carregar os modelos.');

        const allModels: PhoneModel[] = (data.models || []).map((model) => ({
          id: `${model.brand}-${model.name}`.toLowerCase().replace(/\s+/g, '-'),
          name: model.name,
          brand: model.brand,
          col2: getDirectImageUrl(model.bodyUrl),
          col3: getDirectImageUrl(model.maskUrl),
          color: '#1a1a1a',
          cameraLayout: inferCameraLayoutFromModelName(model.name),
          hasLogo: model.brand === 'APPLE',
        }));

        setPhoneModels(allModels);

        if (allModels.length > 0) {
          const pendingModelId =
            typeof window !== 'undefined'
              ? window.sessionStorage.getItem(PENDING_PREVIEW_MODEL_STORAGE_KEY)
              : null;
          const restoredModel = pendingModelId
            ? allModels.find((model) => model.id === pendingModelId)
            : null;
          const initialModel = restoredModel ?? allModels[0];

          setSelectedBrand((currentBrand) => currentBrand || initialModel.brand);
          setSelectedModel((currentModel) => currentModel ?? initialModel);

          if (restoredModel) {
            window.sessionStorage.removeItem(PENDING_PREVIEW_MODEL_STORAGE_KEY);
          }
        } else {
          setSelectedBrand('');
          setSelectedModel(null);
        }
      } catch (error) {
        setPhoneModels([]);
        setSelectedBrand('');
        setSelectedModel(null);
        setModelLoadError(
          error instanceof Error
            ? error.message
            : 'Nao foi possivel carregar os modelos. Verifique a configuracao da planilha.'
        );
      } finally {
        setIsLoadingModels(false);
      }
    }

    loadModelsFromSheet();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const visualViewport = window.visualViewport;
      const baseDevicePixelRatio = initialDevicePixelRatioRef.current || 1;
      const devicePixelRatioScale =
        (window.devicePixelRatio || baseDevicePixelRatio) / baseDevicePixelRatio;
      const visualViewportScale = visualViewport?.scale ?? 1;
      const nextPageZoomScale = clamp(
        devicePixelRatioScale * visualViewportScale,
        0.25,
        4
      );
      const nextViewport = {
        width: Math.round(visualViewport?.width ?? window.innerWidth),
        height: Math.round(visualViewport?.height ?? window.innerHeight),
      };
      const isCoarsePointer =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(pointer: coarse)').matches;

      setViewport(nextViewport);
      setPageZoomScale(nextPageZoomScale);
      setIsMobileLayout(isCoarsePointer);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('scroll', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  useEffect(() => {
    const updatePreviewRenderSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const computedStyle = window.getComputedStyle(container);
      const width =
        parseFloat(computedStyle.width) ||
        container.offsetWidth ||
        container.getBoundingClientRect().width * pageZoomScale;
      const height =
        parseFloat(computedStyle.height) ||
        container.offsetHeight ||
        container.getBoundingClientRect().height * pageZoomScale;

      if (!width || !height) return;

      setPreviewRenderSize({
        width,
        height,
      });
    };

    updatePreviewRenderSize();

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updatePreviewRenderSize);
      return () => window.removeEventListener('resize', updatePreviewRenderSize);
    }

    const observer = new ResizeObserver(() => updatePreviewRenderSize());
    observer.observe(container);
    window.addEventListener('resize', updatePreviewRenderSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePreviewRenderSize);
    };
  }, [currentStep, customText, image, isMobileLayout, pageZoomScale, selectedModel?.id]);

  useEffect(() => {
    if (!isMobileLayout || (currentStep !== 4 && currentStep !== 5)) return;
    if (!previewRenderSize.width || !previewRenderSize.height) return;

    setMobileEditorReferenceSize(previewRenderSize);
  }, [currentStep, isMobileLayout, previewRenderSize]);

  useEffect(() => {
    if (!imageAreaRef.current || !image || !effectiveRatio) return;

    const updateLimits = () => {
      const areaRect = imageAreaRef.current?.getBoundingClientRect();
      if (!areaRect) return;

      const scaleSafePageZoom = Math.max(pageZoomScale, 0.01);
      const areaWidth = areaRect.width * scaleSafePageZoom;
      const areaHeight = areaRect.height * scaleSafePageZoom;

      let fittedWidth = 0;
      let fittedHeight = 0;

      if (containImageOnInitialPlacement) {
        if (shouldFitImageToHeight) {
          fittedWidth = areaWidth;
          fittedHeight = areaWidth / effectiveRatio;
        } else {
          fittedHeight = areaHeight;
          fittedWidth = areaHeight * effectiveRatio;
        }
      } else if (shouldFitImageToHeight) {
        fittedHeight = areaHeight;
        fittedWidth = areaHeight * effectiveRatio;
      } else {
        fittedWidth = areaWidth;
        fittedHeight = areaWidth / effectiveRatio;
      }

      const scaleMultiplier = (activeZoom / 100) * (isQuarterTurn ? 1.02 : 1);
      const finalWidth = fittedWidth * scaleMultiplier;
      const finalHeight = fittedHeight * scaleMultiplier;

      const overflowX = containImageOnInitialPlacement
        ? Math.abs(finalWidth - areaWidth) / 2
        : Math.max(0, (finalWidth - areaWidth) / 2);
      const overflowY = containImageOnInitialPlacement
        ? Math.abs(finalHeight - areaHeight) / 2
        : Math.max(0, (finalHeight - areaHeight) / 2);

      setDragLimits({
        left: -overflowX,
        right: overflowX,
        top: -overflowY,
        bottom: overflowY,
      });

      setPosition((prev) => ({
        x: Math.max(-overflowX, Math.min(overflowX, prev.x)),
        y: Math.max(-overflowY, Math.min(overflowY, prev.y)),
      }));
    };

    const raf = requestAnimationFrame(updateLimits);
    window.addEventListener('resize', updateLimits);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateLimits);
    };
  }, [
    activeSlotArea.height,
    activeSlotArea.width,
    activeSlotIndex,
    activeZoom,
    effectiveRatio,
    image,
    isQuarterTurn,
    pageZoomScale,
    selectedLayoutId,
    selectedModel?.id,
    shouldFitImageToHeight,
    containImageOnInitialPlacement,
  ]);

  useEffect(() => {
    if (!image && (currentStep === 4 || currentStep === 5)) {
      setIsMobileImageEditing(false);
    }
  }, [currentStep, image]);

  useEffect(() => {
    if (!customText.trim()) {
      setIsMobileTextEditing(false);
    }
  }, [customText]);

  useEffect(() => {
    if (!isMobileFullscreenPreviewOpen) {
      setMobileInspectScale(1);
      setMobileInspectOffset({ x: 0, y: 0 });
      mobileInspectGestureRef.current.mode = 'none';
    }
  }, [isMobileFullscreenPreviewOpen]);

  useEffect(() => {
    let isCurrentModel = true;
    setAutomaticModelCorrection(DEFAULT_MODEL_PREVIEW_CORRECTION);

    const modelImageUrl = selectedModel?.col3 || selectedModel?.col2 || '';
    if (!modelImageUrl) return () => {
      isCurrentModel = false;
    };

    computeAutomaticModelPreviewCorrection(modelImageUrl)
      .then((correction) => {
        if (isCurrentModel) setAutomaticModelCorrection(correction);
      })
      .catch(() => {
        if (isCurrentModel) setAutomaticModelCorrection(DEFAULT_MODEL_PREVIEW_CORRECTION);
      });

    return () => {
      isCurrentModel = false;
    };
  }, [selectedModel?.id, selectedModel?.col2, selectedModel?.col3]);

  useEffect(() => {
    if (isMobileLayout || DESKTOP_BANNERS.length < 2) return;

    const interval = window.setInterval(() => {
      setActiveDesktopBannerIndex((prev) => (prev + 1) % DESKTOP_BANNERS.length);
    }, DESKTOP_BANNER_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [isMobileLayout]);

  useEffect(() => {
    const isTextEditorVisible =
      (isMobileLayout && currentStep === 5) || (!isMobileLayout && desktopStep === 4);
    if (!isTextEditorVisible || document.getElementById(OPTIONAL_GOOGLE_FONTS_STYLESHEET_ID)) {
      return;
    }

    const stylesheet = document.createElement('link');
    stylesheet.id = OPTIONAL_GOOGLE_FONTS_STYLESHEET_ID;
    stylesheet.rel = 'stylesheet';
    stylesheet.href = OPTIONAL_GOOGLE_FONTS_STYLESHEET_URL;
    document.head.appendChild(stylesheet);
  }, [currentStep, desktopStep, isMobileLayout]);

  useEffect(() => {
    if (!isCatalogSearchOpen) {
      return;
    }

    let isCancelled = false;
    const loadSupabaseCatalog = async () => {
      setIsSearchingCatalog(true);
      setCatalogSearchError('');

      try {
        const assets = await listarCatalogoStorage();
        if (!isCancelled) {
          setCatalogAllAssets(assets);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setCatalogAllAssets([]);
        setCatalogAssets([]);
        setCatalogSearchError(
          error instanceof Error ? error.message : 'Nao foi possivel carregar o catalogo do Supabase.'
        );
      } finally {
        if (!isCancelled) {
          setIsSearchingCatalog(false);
        }
      }
    };

    loadSupabaseCatalog();

    return () => {
      isCancelled = true;
    };
  }, [isCatalogSearchOpen]);

  useEffect(() => {
    const query = normalizeCatalogSearchText(catalogSearchQuery);
    const equivalentQueries = getEquivalentCatalogSearchQueries(query);

    const filteredAssets = catalogAllAssets.filter((asset) => {
      const searchTarget = normalizeCatalogSearchText(
        `${asset.name} ${asset.categoria || ''} ${asset.subcategoria || ''} ${asset.caminho || ''}`
      );
      const matchesSearch =
        !query || equivalentQueries.some((term) => searchTarget.includes(term));
      const matchesCategory = !catalogCategoryFilter || asset.categoria === catalogCategoryFilter;
      const matchesSubcategory =
        !catalogSubcategoryFilter || asset.subcategoria === catalogSubcategoryFilter;

      return matchesSearch && matchesCategory && matchesSubcategory;
    });

    const categories: string[] = Array.from(
      new Set(
        catalogAllAssets
          .map((asset) => asset.categoria)
          .filter((value): value is string => Boolean(value))
      )
    );
    const subcategorySource = catalogCategoryFilter
      ? catalogAllAssets.filter((asset) => asset.categoria === catalogCategoryFilter)
      : catalogAllAssets;
    const subcategories: string[] = Array.from(
      new Set(
        subcategorySource
          .map((asset) => asset.subcategoria)
          .filter((value): value is string => Boolean(value))
      )
    );

    setCatalogAssets(filteredAssets);
    setCatalogCategories(categories.sort((a, b) => a.localeCompare(b, 'pt-BR')));
    setCatalogSubcategories(subcategories.sort((a, b) => a.localeCompare(b, 'pt-BR')));
  }, [catalogAllAssets, catalogCategoryFilter, catalogSearchQuery, catalogSubcategoryFilter]);

  const isHeicFile = (file: File) => {
    const fileName = file.name.toLowerCase();
    return (
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      fileName.endsWith('.heic') ||
      fileName.endsWith('.heif')
    );
  };

  const preparePreviewFile = async (file: File) => {
    if (!isHeicFile(file)) {
      return file;
    }

    const { default: heic2any } = await import('heic2any');
    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92,
    });

    const convertedBlob = Array.isArray(converted) ? converted[0] : converted;

    return new File(
      [convertedBlob as BlobPart],
      file.name.replace(/\.(heic|heif)$/i, '.jpg'),
      { type: 'image/jpeg' }
    );
  };

  const resetImageTransform = () => {
    setPosition({ x: 0, y: 0 });
    setZoom(100);
    setImageRotation(0);
    setIsMirrored(false);
    setImageResetKey((prev) => prev + 1);
  };

  const loadFile = async (file: File) => {
    const previewFile = await preparePreviewFile(file);
    setOriginalFile(file);
    setSelectedCatalogAssetId(null);
    setIsCatalogSearchOpen(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;

      const img = new Image();
      img.onload = () => {
        setImageRatio(img.width / img.height);
      };

      img.src = imageData;
      resetImageTransform();
      setImage(imageData);
    };

    reader.readAsDataURL(previewFile);
  };

  const loadCatalogImage = async (asset: CatalogImageAsset) => {
    try {
      setSelectedCatalogAssetId(asset.id);

      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setImageRatio(img.width / img.height);
          resolve();
        };
        img.onerror = () => reject(new Error('Nao foi possivel abrir essa imagem do catalogo.'));
        img.src = asset.url;
      });

      setOriginalFile(null);
      setImage(asset.url);
      setIsCatalogSearchOpen(false);
      resetImageTransform();

      if (isMobileLayout) {
        openMobileImageEditor();
      }
    } catch {
      setSelectedCatalogAssetId(null);
      alert('Nao foi possivel abrir essa imagem do catalogo. Tente outra imagem.');
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || phoneModels.length === 0) {
      return;
    }

    const pendingAssetRaw = window.sessionStorage.getItem(
      PENDING_PREVIEW_ASSET_STORAGE_KEY
    );

    if (!pendingAssetRaw) {
      return;
    }

    window.sessionStorage.removeItem(PENDING_PREVIEW_ASSET_STORAGE_KEY);

    const restorePendingAsset = async () => {
    try {
      const pendingAsset = JSON.parse(pendingAssetRaw) as CatalogImageAsset;
      const pendingArtworkRaw = window.sessionStorage.getItem(
        PENDING_PREVIEW_ARTWORK_STORAGE_KEY
      );
      const pendingArtworkFromDb = await takePendingArtworkContext<{
        selectedLayoutId?: string;
        artworkSlots?: ArtworkImageSlot[];
        activeSlotIndex?: number;
        artworkBackground?: string;
        artworkGapPercent?: number;
      }>().catch(() => null);

      if (!pendingAsset?.url) {
        return;
      }

      setCurrentStep(4);
      setDesktopStep(3);
      if (pendingArtworkFromDb || pendingArtworkRaw) {
        const pendingArtwork = pendingArtworkFromDb || JSON.parse(pendingArtworkRaw || '{}') as {
          selectedLayoutId?: string;
          artworkSlots?: ArtworkImageSlot[];
          activeSlotIndex?: number;
          artworkBackground?: string;
          artworkGapPercent?: number;
        };
        const restoredLayout =
          ARTWORK_LAYOUTS.find((layout) => layout.id === pendingArtwork.selectedLayoutId) ||
          ARTWORK_LAYOUTS[0];
        const restoredSlots = Array.from(
          { length: 6 },
          (_, index) => pendingArtwork.artworkSlots?.[index] || createEmptyArtworkSlot()
        );
        const restoredActiveIndex = Math.min(
          Math.max(0, pendingArtwork.activeSlotIndex || 0),
          restoredLayout.slots.length - 1
        );

        setSelectedLayoutId(restoredLayout.id);
        setArtworkSlots(restoredSlots);
        setActiveSlotIndex(restoredActiveIndex);
        applySlotToActiveEditor(restoredSlots[restoredActiveIndex]);
        setArtworkBackground(pendingArtwork.artworkBackground || DEFAULT_ARTWORK_BACKGROUND);
        setArtworkGapPercent(
          clampNumber(
            pendingArtwork.artworkGapPercent ?? MAX_ARTWORK_GAP_PERCENT,
            0,
            MAX_ARTWORK_GAP_PERCENT
          )
        );
      } else {
        selectArtworkLayout(ARTWORK_LAYOUTS[0]);
      }
      window.sessionStorage.removeItem(PENDING_PREVIEW_ARTWORK_STORAGE_KEY);
      setSkipTextStep(false);
      setCarrinhoAberto(false);
      setOrderCompleted(false);
      setIsArtworkApproved(false);

      void loadCatalogImage({
        id: pendingAsset.id || pendingAsset.url,
        name: pendingAsset.name || 'Imagem do catalogo',
        publicId: pendingAsset.publicId || pendingAsset.url,
        url: pendingAsset.url,
        thumbnail: pendingAsset.thumbnail || pendingAsset.url,
        categoria: pendingAsset.categoria,
        subcategoria: pendingAsset.subcategoria,
        caminho: pendingAsset.caminho,
      });
    } catch {
    }
    };

    void restorePendingAsset();
  }, [phoneModels.length]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await loadFile(file);
        if (isMobileLayout) {
          openMobileImageEditor();
        }
      } catch {
        alert('Nao foi possivel abrir essa imagem. Tente outro arquivo.');
      } finally {
        e.target.value = '';
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    const isImageFile =
      file &&
      (file.type.startsWith('image/') ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif'));

    if (file && isImageFile) {
      try {
        await loadFile(file);
        if (isMobileLayout) {
          openMobileImageEditor();
        }
      } catch {
        alert('Nao foi possivel abrir essa imagem. Tente outro arquivo.');
      }
    }
  };

  const resetTransform = () => {
    setZoom(100);
    setPosition({ x: 0, y: 0 });
    setCustomText('');
    setTextPosition({ x: 0, y: 0 });
    setTextSize(24);
    setTextColor('#000000');
    setTextFont(GOOGLE_FONTS[0].value);
    setTextRotation(0);
    setImageRotation(0);
    setTextOnlyMode(false);
    setIsMirrored(false);
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setLetterSpacing(0);
    setTextStroke(0);
    setTextStrokeColor('#000000');
  };

  const resetArtwork = () => {
    clearAllImages();
    clearText();
    setLogoPosition(CASE_LOGO_DEFAULT_POSITION);
    setIsCaseLogoVisible(true);
    setSkipTextStep(false);
    resetTransform();
    setIsMobileImageEditing(false);
    setArtworkBackground(DEFAULT_ARTWORK_BACKGROUND);
    setArtworkGapPercent(MAX_ARTWORK_GAP_PERCENT);
    setMovingSlotIndex(null);
  };

  const clearImage = () => {
    setImage(null);
    setOriginalFile(null);
    setSelectedCatalogAssetId(null);
    setIsCatalogSearchOpen(false);
    setIsMobileImageEditing(false);
    setImageRatio(null);
    setPosition({ x: 0, y: 0 });
    setZoom(100);
    setImageRotation(0);
    setIsMirrored(false);
  };

  const clearAllImages = () => {
    setArtworkSlots((prev) => prev.map(() => createEmptyArtworkSlot()));
    clearImage();
  };

  const clearText = () => {
    setCustomText('');
    setTextPosition({ x: 0, y: 0 });
    setTextSize(24);
    setTextColor('#000000');
    setTextFont(GOOGLE_FONTS[0].value);
    setTextRotation(0);
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setLetterSpacing(0);
    setTextStroke(0);
    setTextStrokeColor('#000000');
    setTextOnlyMode(false);
    setIsMobileTextEditing(false);
    setIsMobileTextModalOpen(false);
  };

  const openMobileImageEditor = () => {
    setIsMobileTextModalOpen(false);
    setIsMobileTextEditing(false);
    setIsMobileImageEditing(true);
  };

  const openMobileTextEditor = () => {
    setIsMobileImageEditing(false);
    setIsMobileTextEditing(false);
    setIsMobileTextModalOpen(true);
  };

  const moveText = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 18;

    setTextPosition((prev) => {
      const next = { ...prev };

      if (direction === 'up') next.y -= step;
      if (direction === 'down') next.y += step;
      if (direction === 'left') next.x -= step;
      if (direction === 'right') next.x += step;

      const snapped = snapTextToCenter(next);
      updateTextCenterGuide(snapped);
      if (snapped.x !== next.x || snapped.y !== next.y) {
        setTextResetKey((prevKey) => prevKey + 1);
      }
      return snapped;
    });
  };

  const moveImage = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 30;

    setPosition((prev) => {
      let newX = prev.x;
      let newY = prev.y;

      if (direction === 'up') newY -= step;
      if (direction === 'down') newY += step;
      if (direction === 'left') newX -= step;
      if (direction === 'right') newX += step;

      return {
        x: Math.max(dragLimits.left, Math.min(dragLimits.right, newX)),
        y: Math.max(dragLimits.top, Math.min(dragLimits.bottom, newY)),
      };
    });
  };

  const waitForImagesToLoad = async (root: HTMLElement) => {
    const images = Array.from(root.querySelectorAll('img'));

    await Promise.all(
      images.map((img) => {
        if (img.complete && img.naturalWidth > 0) {
          return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        });
      })
    );

    if ('fonts' in document) {
      await (document as Document & { fonts: FontFaceSet }).fonts.ready;
    }

    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await new Promise((resolve) => setTimeout(resolve, 120));
  };

  const generateBlobFromElement = async (
    element: HTMLElement,
    options?: {
      format?: 'image/png' | 'image/jpeg';
      quality?: number;
      scale?: number;
      maxBytes?: number;
    }
  ): Promise<Blob> => {
    const { format = 'image/jpeg', quality = 0.9, scale = 1, maxBytes } = options || {};

    await waitForImagesToLoad(element);
    const { default: html2canvas } = await import('html2canvas-pro');

    const renderCanvas = async (scaleValue: number) => {
      return html2canvas(element, {
        backgroundColor: null,
        useCORS: true,
        scale: scaleValue,
        imageTimeout: 15000,
        logging: false,
      });
    };

    let currentScale = scale;
    let canvas = await renderCanvas(currentScale);

    const canvasToBlob = async (
      currentCanvas: HTMLCanvasElement,
      mimeType: 'image/png' | 'image/jpeg',
      q?: number
    ) => {
      return new Promise<Blob>((resolve, reject) => {
        currentCanvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Nao foi possivel gerar a imagem.'));
            return;
          }
          resolve(blob);
        }, mimeType, q);
      });
    };

    if (format === 'image/jpeg') {
      return canvasToBlob(canvas, 'image/jpeg', quality);
    }

    let blob = await canvasToBlob(canvas, 'image/png');

    while (maxBytes && blob.size > maxBytes && currentScale > 1) {
      currentScale = Math.max(1, Number((currentScale - 0.25).toFixed(2)));
      canvas = await renderCanvas(currentScale);
      blob = await canvasToBlob(canvas, 'image/png');

      if (currentScale === 1) break;
    }

    if (maxBytes && blob.size > maxBytes) {
      throw new Error(
        `A arte final em PNG passou do limite de 10 MB. Tamanho atual: ${(blob.size / 1024 / 1024).toFixed(2)} MB`
      );
    }

    return blob;
  };

  const generatePreviewBlob = async (): Promise<Blob> => {
    if (!exportRef.current) {
      throw new Error('Area de preview nao encontrada.');
    }

    return generateBlobFromElement(exportRef.current, {
      format: 'image/png',
      quality: 0.9,
      scale: 2,
    });
  };

  const getPreviewPrintFileName = () => {
    const safeModelName = (selectedModel?.name || 'capinha')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    return `print-preview-${safeModelName || 'capinha'}.png`;
  };

  const showPreviewPrintMessage = (message: string) => {
    setPreviewPrintMessage(message);
    window.setTimeout(() => {
      setPreviewPrintMessage('');
    }, 2600);
  };

  const handleCopyPreviewPrint = async () => {
    if (!selectedModel || isGeneratingPreviewPrint) return;

    try {
      setIsGeneratingPreviewPrint(true);
      const blob = await generatePreviewBlob();

      if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
        throw new Error('Clipboard API indisponivel neste navegador.');
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);

      showPreviewPrintMessage('Imagem copiada para a area de transferencia.');
    } catch (error) {
      console.error('Erro ao copiar print do preview:', error);
      alert('Nao foi possivel copiar a imagem. Tente usar o botao de download.');
    } finally {
      setIsGeneratingPreviewPrint(false);
    }
  };

  const handleDownloadPreviewPrint = async () => {
    if (!selectedModel || isGeneratingPreviewPrint) return;

    try {
      setIsGeneratingPreviewPrint(true);
      const blob = await generatePreviewBlob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = downloadUrl;
      link.download = getPreviewPrintFileName();
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Erro ao gerar print do preview:', error);
      alert('Nao foi possivel gerar o print do preview. Tente novamente.');
    } finally {
      setIsGeneratingPreviewPrint(false);
    }
  };

  const generateProductionBlob = async (): Promise<Blob> => {
    if (!productionRef.current) {
      throw new Error('Area de arte final nao encontrada.');
    }

    return generateBlobFromElement(productionRef.current, {
      format: 'image/png',
      scale: 3,
      maxBytes: 10 * 1024 * 1024,
    });
  };

  const CLOUDINARY_CLOUD_NAME = 'dwexdk5pp';
  const CLOUDINARY_UPLOAD_PRESET = 'pamda_unsigned';

  const uploadToCloudinary = async (
    file: File | Blob,
    folder: string,
    fileName?: string
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);

    if (fileName) {
      formData.append('public_id', fileName);
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error?.message || 'Erro ao enviar imagem para o Cloudinary.'
      );
    }

    return data.secure_url as string;
  };

  const uploadOrderAssets = async () => {
    const productionBlob = await generateProductionBlob();
    const previewBlob = await generatePreviewBlob();

    const productionImageUrl = await uploadToCloudinary(
      productionBlob,
      'pamda-pedidos/arte-final',
      `arte-final-${Date.now()}`
    );

    const previewImageUrl = await uploadToCloudinary(
      previewBlob,
      'pamda-pedidos/preview',
      `preview-${Date.now()}`
    );

    return {
      productionImageUrl,
      previewImageUrl,
      previewBlob,
    };
  };

  const standardUnitPrice = 25.0;
  const customerProvidedCaseDiscount = 5.0;
  const unitPrice = standardUnitPrice;
  const totalPrice = unitPrice * quantity;
  const hasAdminCheckoutFeatures = storeAccess.code === ADMIN_ACCESS_CODE;
  const pickupOnly =
    hasAdminCheckoutFeatures && isPickupOnlyFreight(storeAccess.freight);
  const configuredFreightAmount = parseFreightAmount(storeAccess.freight);
  const getFreightAmount = (totalUnits: number) =>
    hasAdminCheckoutFeatures &&
    fulfillmentMethod === 'delivery' &&
    !pickupOnly &&
    totalUnits < 5
      ? configuredFreightAmount
      : 0;
  const getCustomerProvidedCasesQuantity = (totalUnits: number) =>
    hasAdminCheckoutFeatures && customerProvidesCases
      ? Math.min(Math.max(0, customerProvidedCasesQuantity), totalUnits)
      : 0;
  const getOrderPricing = (totalUnits: number) => {
    const subtotal = totalUnits * unitPrice;
    const providedCasesQuantity = getCustomerProvidedCasesQuantity(totalUnits);
    const discount = providedCasesQuantity * customerProvidedCaseDiscount;

    return {
      subtotal,
      providedCasesQuantity,
      discount,
      discountedSubtotal: subtotal - discount,
    };
  };
  const quantidadeItensCarrinho = useMemo(
    () => carrinho.reduce((total, item) => total + item.quantidade, 0),
    [carrinho]
  );

  useEffect(() => {
    if (pickupOnly) {
      setFulfillmentMethod('pickup');
    }
  }, [pickupOnly]);

  const navigateToWhatsApp = (whatsappUrl: string) => {
    window.location.href = whatsappUrl;
  };

  const blobParaDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ''));
      reader.onerror = () =>
        reject(new Error('Nao foi possivel gerar a previa local do item.'));
      reader.readAsDataURL(blob);
    });

  const validarItemAtual = () => {
    if (!selectedModel) {
      alert('Selecione o modelo do celular.');
      return false;
    }

    if (!hasArtworkImages && !customText.trim()) {
      alert('Envie uma imagem ou adicione um texto para personalizar.');
      return false;
    }

    return true;
  };

  const gerarResumoItemAtual = () => {
    const partes: string[] = [];

    partes.push(customText.trim() ? `Texto: ${customText.trim()}` : 'Sem texto');
    partes.push(hasArtworkImages ? `${filledArtworkSlots} imagem(ns) personalizada(s)` : 'Sem imagem');
    if (selectedLayout) {
      partes.push(`Layout: ${selectedLayout.name}`);
      if (selectedLayout.slots.length > 1) {
        partes.push(`Fundo: ${artworkBackground}`);
        partes.push(`Distancia entre fotos: ${artworkGapPercent.toFixed(1)}%`);
      }
    }

    if (textOnlyMode) {
      partes.push('Modo somente texto ativo');
    }

    return partes.join(' • ');
  };

  const montarItemCarrinhoAtual = async (): Promise<ItemCarrinho> => {
    if (!selectedModel) {
      throw new Error('Selecione o modelo do celular.');
    }

    const { productionImageUrl, previewImageUrl, previewBlob } = await uploadOrderAssets();
    const previewLocal = await blobParaDataUrl(previewBlob);

    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      marca: selectedBrand,
      modelo: selectedModel.name,
      layout: selectedLayout?.name,
      quantidade: quantity,
      texto: customText.trim() || undefined,
      corTexto: customText.trim() ? textColor : undefined,
      fonteTexto: customText.trim() ? textFont : undefined,
      tamanhoTexto: customText.trim() ? textSize : undefined,
      espacamentoTexto: customText.trim() ? letterSpacing : undefined,
      negrito: customText.trim() ? isBold : undefined,
      italico: customText.trim() ? isItalic : undefined,
      sublinhado: customText.trim() ? isUnderline : undefined,
      imagemPreviewUrl: previewImageUrl,
      imagemArteFinalUrl: productionImageUrl,
      previewLocal,
      resumo: gerarResumoItemAtual(),
      temImagem: hasArtworkImages,
      modoSomenteTexto: textOnlyMode,
    };
  };

  const resetarEditorParaNovoItem = () => {
    clearAllImages();
    clearText();
    resetTransform();
    setQuantity(1);
    setOrderCompleted(false);
    setIsArtworkApproved(false);
    setSearchQuery('');
    setMobileBrandSearchQuery('');
    setIsMobileSearchActive(false);
    setIsBrandSearchMode(false);
    setIsMobileImageEditing(false);
    setIsMobileTextModalOpen(false);
    setDesktopStep(1);
    setSkipTextStep(false);
    setSelectedLayoutId(null);
    setArtworkSlots([]);
    setActiveSlotIndex(0);
    setArtworkBackground(DEFAULT_ARTWORK_BACKGROUND);
    setArtworkGapPercent(MAX_ARTWORK_GAP_PERCENT);
    setMovingSlotIndex(null);
  };

  const voltarParaPrimeiraEtapa = () => {
    setCurrentStep(1);
  };

  const adicionarItemAoCarrinho = async () => {
    if (!validarItemAtual()) return;

    try {
      setIsUploadingOrder(true);
      const novoItem = await montarItemCarrinhoAtual();
      setCarrinho((prev) => [...prev, novoItem]);
      resetarEditorParaNovoItem();
      voltarParaPrimeiraEtapa();
      setCarrinhoAberto(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Nao foi possivel adicionar o item ao carrinho.'
      );
    } finally {
      setIsUploadingOrder(false);
    }
  };

  const removerItemDoCarrinho = (id: string) => {
    setCarrinho((prev) => prev.filter((item) => item.id !== id));
  };

  const fazerNovaCapinha = () => {
    resetarEditorParaNovoItem();
    voltarParaPrimeiraEtapa();
    setCarrinhoAberto(false);
  };

  const gerarMensagemWhatsAppCarrinho = (itens: ItemCarrinho[]) => {
    const totalQuantidade = itens.reduce((total, item) => total + item.quantidade, 0);
    const freightAmount = getFreightAmount(totalQuantidade);
    const pricing = getOrderPricing(totalQuantidade);
    const totalGeral = pricing.discountedSubtotal + freightAmount;
    const fulfillmentDescription =
      fulfillmentMethod === 'pickup' ? 'Retirada na loja' : 'Entrega';

    const itensFormatados = itens
      .map((item, index) => {
        const linhas = [
          `*Item ${index + 1}*`,
          `- Marca: ${item.marca}`,
          `- Modelo: ${item.modelo}`,
          `- Layout: ${item.layout || 'Nao informado'}`,
          `- Quantidade: ${item.quantidade}`,
          `- Texto: ${item.texto || 'Sem texto'}`,
          `- Observacoes: ${item.resumo || 'Sem observacoes adicionais'}`,
        ];

        if (item.texto) {
          linhas.push(`- Fonte: ${item.fonteTexto || 'Nao informada'}`);
          linhas.push(`- Cor do texto: ${item.corTexto || 'Nao informada'}`);
          linhas.push(`- Tamanho do texto: ${item.tamanhoTexto || 0}px`);
        }

        if (item.imagemArteFinalUrl) {
          linhas.push(`- Arte final: ${item.imagemArteFinalUrl}`);
        }

        if (item.imagemPreviewUrl) {
          linhas.push(`- Previa: ${item.imagemPreviewUrl}`);
        }

        return linhas.join('\n');
      })
      .join('\n\n');

    const checkoutDetails = hasAdminCheckoutFeatures
      ? `\n- Capinhas enviadas pela loja: ${pricing.providedCasesQuantity}\n- Valor unitario: ${formatCurrency(unitPrice)}\n- Subtotal: ${formatCurrency(pricing.subtotal)}\n- Desconto pelas capinhas enviadas: ${pricing.discount > 0 ? `- ${formatCurrency(pricing.discount)}` : 'Sem desconto'}\n- Forma de recebimento: ${fulfillmentDescription}\n- Frete: ${freightAmount > 0 ? formatCurrency(freightAmount) : 'Sem cobranca'}\n- Valor total: ${formatCurrency(totalGeral)}`
      : `\n- Valor estimado: ${formatCurrency(totalGeral)}`;

    return `*Pedido de Capinhas Personalizadas - Pamda Cases*\n\n*Loja:* ${storeAccess.name}\n*Código da loja:* ${storeAccess.code}\n\n${itensFormatados}\n\n*Resumo*\n- Total de modelos: ${itens.length}\n- Total de unidades: ${totalQuantidade}${checkoutDetails}`;
  };

  const finalizarPedidoCarrinho = async () => {
    const temItemAtual = Boolean(selectedModel && (hasArtworkImages || customText.trim()));

    if (!carrinho.length && !temItemAtual) {
      alert('Adicione ao menos uma capinha ao carrinho ou conclua a personalizacao atual.');
      return;
    }

    try {
      setIsUploadingOrder(true);

      const itensParaFinalizar = [...carrinho];

      if (temItemAtual) {
        if (!validarItemAtual()) return;
        const itemAtual = await montarItemCarrinhoAtual();
        itensParaFinalizar.push(itemAtual);
      }

      const message = gerarMensagemWhatsAppCarrinho(itensParaFinalizar);
      const whatsappUrl = `https://wa.me/${PAMDA_WHATSAPP_NUMBER}?text=${encodeURIComponent(
        message
      )}`;

      setOrderCompleted(true);
      navigateToWhatsApp(whatsappUrl);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Nao foi possivel finalizar o pedido.';
      alert(errorMessage);
    } finally {
      setIsUploadingOrder(false);
    }
  };

  /*
  const legacyHandleFinish = async () => {
    return finalizarPedidoCarrinho();
    try {
      if (!selectedModel) {
        alert('Selecione o modelo do celular.');
        return;
      }

      if (!image && !customText.trim()) {
        alert('Envie uma imagem ou adicione um texto para personalizar.');
        return;
      }

      setIsUploadingOrder(true);

      const { productionImageUrl, previewImageUrl } = await uploadOrderAssets();

      const message = `
*Novo pedido - Pamda Cases*
Loja: ${storeAccess.name}
Codigo da loja: ${storeAccess.code}
Modelo: ${selectedModel.name}
Marca: ${selectedBrand}
Texto personalizado: ${customText.trim() || 'Sem texto'}
Fonte: ${textFont}
Tamanho do texto: ${textSize}px
Cor do texto: ${textColor}
Negrito: ${isBold ? 'Sim' : 'Nao'}
Italico: ${isItalic ? 'Sim' : 'Nao'}
Sublinhado: ${isUnderline ? 'Sim' : 'Nao'}
Espacamento: ${letterSpacing}px
Borda do texto: ${textStroke}px
Cor da borda: ${textStrokeColor}
Rotacao do texto: ${textRotation}°
Rotacao da imagem: ${imageRotation}°
Espelhado: ${isMirrored ? 'Sim' : 'Nao'}
Modo somente texto: ${textOnlyMode ? 'Sim' : 'Nao'}
Quantidade: ${quantity}
Valor unitario: R$ ${unitPrice.toFixed(2)}
Valor total: R$ ${totalPrice.toFixed(2)}

Arte final:
${productionImageUrl}

Previa final:
${previewImageUrl}
      `;

      const whatsappUrl = `https://wa.me/${PAMDA_WHATSAPP_NUMBER}?text=${encodeURIComponent(
        message
      )}`;

      setOrderCompleted(true);
      navigateToWhatsApp(whatsappUrl);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Nao foi possivel finalizar o pedido.';
      alert(errorMessage);
    } finally {
      setIsUploadingOrder(false);
    }
  };
  */

  const handleFinish = async () => {
    if (!isArtworkApproved) {
      alert('Confirme que a arte foi aprovada pelo cliente antes de finalizar o pedido.');
      return;
    }

    return finalizarPedidoCarrinho();
  };

  const buildTextStyle = (
    fontSize: number,
    styleScale = 1
  ): React.CSSProperties => {
    const scaledStroke = getScaledStroke(fontSize);
    const preservesManualLineBreaks = customText.includes('\n');

    return {
      fontFamily: textFont,
      color: textColor,
      fontSize: `${fontSize}px`,
      letterSpacing: `${letterSpacing * styleScale}px`,
      fontWeight: isBold ? 700 : 400,
      fontStyle: isItalic ? 'italic' : 'normal',
      textDecoration: isUnderline ? 'underline' : 'none',
      WebkitTextStroke: undefined,
      textStroke: undefined,
      textShadow: buildExternalTextShadow(scaledStroke, textStrokeColor),
      lineHeight: 1.2,
      textAlign: 'center',
      whiteSpace: preservesManualLineBreaks ? 'pre-wrap' : 'pre',
      wordBreak: 'normal',
      overflowWrap: 'normal',
    };
  };

  const handleCustomTextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const nextValue = e.target.value.slice(0, MAX_CUSTOM_TEXT_LENGTH);
    setCustomText(nextValue);

    if (nextValue.trim()) {
      setSkipTextStep(false);
    }
  };

  const getEditorTextareaFontSize = (value: string, baseSize: number) => {
    const limitedValue = value.slice(0, MAX_CUSTOM_TEXT_LENGTH);
    const lines = limitedValue.split('\n');
    const estimatedLineCount = lines.reduce((total, line) => {
      const visualLength = line.trim().length || line.length;
      return total + Math.max(1, Math.ceil(Math.max(visualLength, 1) / 16));
    }, 0);

    const sizePenalty =
      Math.max(0, limitedValue.length - 12) * 0.2 +
      Math.max(0, estimatedLineCount - 2) * 3.6;

    return Math.max(14, Math.min(42, baseSize + 12 - sizePenalty));
  };

  const textRenderStyle = buildTextStyle(textSize);
  const exportScaleX = EXPORT_WIDTH / previewRenderSize.width;
  const exportScaleY = EXPORT_HEIGHT / previewRenderSize.height;
  const exportStyleScale = (exportScaleX + exportScaleY) / 2;
  const exportTextRenderStyle = buildTextStyle(
    textSize * exportStyleScale,
    exportStyleScale
  );
  const exportTextPosition = {
    x: textPosition.x * exportScaleX,
    y: textPosition.y * exportScaleY,
  };
  const editorTextareaFontSize = getEditorTextareaFontSize(customText, textSize);
  const mobileEditorStrokeSize = getScaledStroke(editorTextareaFontSize);
  const canFinish = Boolean(selectedModel && (hasArtworkImages || customText.trim()));
  const canSubmitCurrentItem = canFinish;
  const canSubmitApprovedItem = canSubmitCurrentItem && isArtworkApproved;
  const checkoutQuantity = quantidadeItensCarrinho + (canFinish ? quantity : 0);
  const checkoutPricing = getOrderPricing(checkoutQuantity);
  const checkoutFreightAmount = getFreightAmount(checkoutQuantity);
  const checkoutTotal = checkoutPricing.discountedSubtotal + checkoutFreightAmount;
  const totalSteps = 6;

  useEffect(() => {
    if (!customerProvidesCases) {
      setCustomerProvidedCasesQuantity(0);
      return;
    }

    setCustomerProvidedCasesQuantity((prev) =>
      Math.min(Math.max(1, prev), checkoutQuantity)
    );
  }, [checkoutQuantity, customerProvidesCases]);

  const normalizeSearchValue = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\bifone\b/g, 'iphone')
      .replace(/\biphon\b/g, 'iphone')
      .replace(/\bxaomi\b/g, 'xiaomi')
      .replace(/\bxiomi\b/g, 'xiaomi')
      .replace(/\s+/g, ' ')
      .trim();

  const getLevenshteinDistance = (source: string, target: string) => {
    if (source === target) return 0;
    if (!source.length) return target.length;
    if (!target.length) return source.length;

    const matrix = Array.from({ length: source.length + 1 }, () =>
      Array<number>(target.length + 1).fill(0)
    );

    for (let i = 0; i <= source.length; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= target.length; j += 1) matrix[0][j] = j;

    for (let i = 1; i <= source.length; i += 1) {
      for (let j = 1; j <= target.length; j += 1) {
        const cost = source[i - 1] === target[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[source.length][target.length];
  };

  const getRankedModels = (
    rawQuery: string,
    models: PhoneModel[],
    limit?: number
  ) => {
    const query = normalizeSearchValue(rawQuery);
    if (!query) return typeof limit === 'number' ? models.slice(0, limit) : models;

    const ranked = models
      .map((model) => {
        const haystack = normalizeSearchValue(`${model.brand} ${model.name}`);
        const tokens = haystack.split(' ');
        const queryTokens = query.split(' ');
        const allTokensMatch = queryTokens.every((queryToken) =>
          tokens.some((token) => {
            const distance = getLevenshteinDistance(token, queryToken);
            const maxDistance = queryToken.length <= 4 ? 1 : 2;
            return (
              token.includes(queryToken) ||
              queryToken.includes(token) ||
              distance <= maxDistance
            );
          })
        );

        if (!allTokensMatch && !haystack.includes(query)) {
          return null;
        }

        const score = haystack.includes(query)
          ? 1000 - haystack.length
          : queryTokens.reduce((total, queryToken) => {
              const bestDistance = Math.min(
                ...tokens.map((token) => getLevenshteinDistance(token, queryToken))
              );
              return total - bestDistance;
            }, 0);

        return { model, score };
      })
      .filter((item): item is { model: PhoneModel; score: number } => Boolean(item))
      .sort((a, b) => b.score - a.score)
      .map(({ model }) => model);

    return typeof limit === 'number' ? ranked.slice(0, limit) : ranked;
  };

  const mobileSuggestions = useMemo(
    () => getRankedModels(mobileBrandSearchQuery, phoneModels, 6),
    [mobileBrandSearchQuery, phoneModels]
  );

  const filteredModels = useMemo(() => {
    const brandModels = selectedBrand
      ? phoneModels.filter((model) => model.brand === selectedBrand)
      : phoneModels;

    return searchQuery.trim()
      ? getRankedModels(searchQuery, phoneModels)
      : brandModels;
  }, [getRankedModels, phoneModels, searchQuery, selectedBrand]);

  const mobileModelResults = useMemo(() => {
    const brandModels = phoneModels.filter((model) => model.brand === selectedBrand);
    return getRankedModels(searchQuery, brandModels);
  }, [phoneModels, searchQuery, selectedBrand]);

  const mobileStepConfig = [
    { step: 1, title: 'Marca', description: 'Escolha a marca ou pesquise o aparelho.' },
    { step: 2, title: 'Modelo', description: 'Selecione o modelo exato da sua capinha.' },
    { step: 3, title: 'Layout', description: 'Escolha a composicao das fotos.' },
    { step: 4, title: 'Imagem', description: 'Preencha os espacos com suas imagens.' },
    { step: 5, title: 'Texto', description: 'Edite o texto ou siga sem inserir.' },
    { step: 6, title: 'Confirmacao', description: 'Revise o pedido e finalize.' },
  ] as const;

  const currentStepMeta =
    mobileStepConfig.find((item) => item.step === currentStep) ?? mobileStepConfig[0];

  const canProceedFromStep = () => {
    if (currentStep === 1) return Boolean(selectedBrand);
    if (currentStep === 2) return Boolean(selectedModel);
    if (currentStep === 3) return Boolean(selectedLayout);
    if (currentStep === 4) return hasAllLayoutImages;
    if (currentStep === 5) return canSubmitCurrentItem;
    return canSubmitCurrentItem;
  };

  const nextStep = () => {
    if (!canProceedFromStep()) return;
    if (currentStep === 4 || currentStep === 5) {
      lockMobileEditorTransforms();
    }

    setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const returnToMobileEditor = () => {
    setCurrentStep(4);

    if (image) {
      openMobileImageEditor();
      return;
    }

    if (customText.trim()) {
      openMobileTextEditor();
    }
  };

  const selectBrand = (
    brand: string,
    options?: { presetFirstModel?: boolean; advance?: boolean }
  ) => {
    const { presetFirstModel = true, advance = false } = options || {};
    setSelectedBrand(brand);
    setSearchQuery('');
    setMobileBrandSearchQuery('');
    setIsBrandSearchMode(false);

    if (presetFirstModel) {
      const firstModelOfBrand = phoneModels.find((model) => model.brand === brand);
      if (firstModelOfBrand) {
        setSelectedModel(firstModelOfBrand);
      }
    } else {
      setSelectedModel(null);
    }

    if (advance) {
      setCurrentStep(2);
    }
  };

  const selectModelForFlow = (model: PhoneModel, advance = false) => {
    setSelectedBrand(model.brand);
    setSelectedModel(model);
    if (advance) {
      setCurrentStep(3);
    }
  };

  const snapTextToCenter = (position: { x: number; y: number }) => {
    return {
      x: Math.abs(position.x) <= TEXT_CENTER_SNAP_DISTANCE ? 0 : position.x,
      y: Math.abs(position.y) <= TEXT_CENTER_SNAP_DISTANCE ? 0 : position.y,
    };
  };

  const updateTextCenterGuide = (position: { x: number; y: number }) => {
    setTextCenterGuide({
      vertical: Math.abs(position.x) <= TEXT_CENTER_SNAP_DISTANCE,
      horizontal: Math.abs(position.y) <= TEXT_CENTER_SNAP_DISTANCE,
    });
  };

  const hideTextCenterGuide = () => {
    setIsTextDragging(false);
    setTextCenterGuide({
      vertical: false,
      horizontal: false,
    });
  };

  const renderCaseLogo = (
    frameDimensions = { width: EXPORT_WIDTH, height: EXPORT_HEIGHT },
    interactive = false
  ) => {
    if (!isCaseLogoVisible) return null;

    const frameScaleX = frameDimensions.width / EXPORT_WIDTH;
    const frameScaleY = frameDimensions.height / EXPORT_HEIGHT;
    const dragScale = Math.max(pageZoomScale, 0.01);
    const scaledLogoPosition = {
      x: logoPosition.x * frameScaleX,
      y: logoPosition.y * frameScaleY,
    };
    const logoBounds = getLogoBounds(frameDimensions);

    const logoStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: `${CASE_LOGO_DESKTOP_POSITION.size * frameScaleX}px`,
      height: `${CASE_LOGO_DESKTOP_POSITION.size * frameScaleY}px`,
      zIndex: 50,
      opacity: 0.9,
      pointerEvents: interactive ? 'auto' : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      cursor: interactive ? 'move' : 'default',
      touchAction: interactive ? 'none' : 'auto',
    };

    return (
      <motion.div
        drag={interactive}
        dragConstraints={logoBounds}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={(_, info) => {
          if (!interactive) return;

          setLogoPosition((prev) =>
            clampLogoPosition(
              {
                x: prev.x + (info.offset.x * dragScale) / frameScaleX,
                y: prev.y + (info.offset.y * dragScale) / frameScaleY,
              },
              frameDimensions
            )
          );
        }}
        style={{
          ...logoStyle,
          x: scaledLogoPosition.x,
          y: scaledLogoPosition.y,
        }}
      >
        <img
          src={PANDA_LOGO_URL}
          crossOrigin="anonymous"
          alt="Logo Panda Cases"
          className="h-full w-full object-contain"
          draggable={false}
        />
      </motion.div>
    );
  };

  const renderModelSelector = (mobile = false) => (
    <section className={mobile ? 'flex h-full min-h-0 flex-col gap-4' : 'flex h-full min-h-0 flex-col gap-3.5'}>
      <>
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
          Selecione seu Aparelho
        </label>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar modelo"
            className={`w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 text-zinc-700 outline-none transition-all ${
              mobile
                ? 'text-sm focus:ring-2 focus:ring-[#435446]'
                : 'text-[15px] focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500'
            }`}
          />
        </div>
      </>

      <div
        className={`gap-2 custom-scrollbar ${
          mobile
            ? 'flex shrink-0 flex-wrap overflow-visible pb-1'
            : 'grid shrink-0 grid-cols-6 overflow-visible pb-1'
        }`}
      >
        {brands.map((brand, index) => (
          <button
            key={brand}
            onClick={() => selectBrand(brand)}
            className={`whitespace-nowrap rounded-full font-medium transition-all ${
              selectedBrand === brand
                ? mobile
                  ? 'bg-zinc-900 px-4 py-2 text-sm text-white shadow-md'
                  : 'bg-indigo-600 px-3.5 py-2 text-sm text-white shadow-md'
                : mobile
                  ? 'bg-zinc-100 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-200'
                  : 'bg-zinc-100 px-3 py-2 text-center text-sm text-zinc-600 hover:bg-zinc-200'
            } ${!mobile ? `col-span-2 ${index === 3 ? 'col-start-2' : ''}` : ''}`}
          >
            {brand}
          </button>
        ))}
      </div>

      <div
        className={`grid grid-cols-1 gap-2 overflow-y-auto custom-scrollbar ${
          mobile ? 'min-h-0 flex-1 content-start pr-1' : 'min-h-0 flex-1 content-start pr-2'
        }`}
        style={mobile ? { overscrollBehavior: 'contain' } : undefined}
      >
        {isLoadingModels && (
          <p className="rounded-xl bg-white px-3 py-3 text-sm text-zinc-500">
            Carregando modelos...
          </p>
        )}
        {!isLoadingModels && modelLoadError && (
          <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-3 text-sm text-red-600">
            {modelLoadError}
          </p>
        )}
        {filteredModels.map((model) => {
          const selected = selectedModel?.id === model.id;

          return (
            <button
              key={model.id}
              onClick={() => {
                setSelectedBrand(model.brand);
                setSelectedModel(model);
              }}
              onDoubleClick={() => {
                setSelectedBrand(model.brand);
                setSelectedModel(model);
                if (!mobile) {
                  setDesktopStep(2);
                }
              }}
              className={`flex items-center justify-between rounded-xl border text-left transition-all ${
                mobile
                  ? selected
                    ? 'border-zinc-900 bg-zinc-900 p-3 text-white'
                    : 'border-zinc-200 bg-white p-3 text-zinc-700'
                  : selected
                    ? 'border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-indigo-700'
                    : 'border border-zinc-100 bg-white px-3 py-2.5 text-zinc-700 hover:border-zinc-300'
              }`}
            >
              <div className="flex flex-col">
                <span className={`${mobile ? 'text-sm' : 'text-[15px]'} font-medium`}>
                  {model.name}
                </span>
                {searchQuery.trim() && (
                  <span className={`text-xs ${selected ? 'text-zinc-300' : 'text-zinc-400'}`}>
                    {model.brand}
                  </span>
                )}
              </div>
              {selected && <ChevronRight className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
    </section>
  );

  const renderCatalogImageSearch = (mobile = false) => (
    <CatalogoImagens
      mobile={mobile}
      aberto={isCatalogSearchOpen}
      busca={catalogSearchQuery}
      categorias={catalogCategories}
      subcategorias={catalogSubcategories}
      categoriaSelecionada={catalogCategoryFilter}
      subcategoriaSelecionada={catalogSubcategoryFilter}
      imagens={catalogAssets}
      carregando={isSearchingCatalog}
      erro={catalogSearchError}
      imagemSelecionadaId={selectedCatalogAssetId}
      onToggle={() => setIsCatalogSearchOpen((prev) => !prev)}
      onBuscaChange={setCatalogSearchQuery}
      onCategoriaChange={(value) => {
        setCatalogCategoryFilter(value);
        setCatalogSubcategoryFilter('');
      }}
      onSubcategoriaChange={setCatalogSubcategoryFilter}
      onUsarImagem={loadCatalogImage}
      onOpenCatalog={async () => {
        if (typeof window === 'undefined') {
          return;
        }

        if (selectedModel) {
          window.sessionStorage.setItem(PENDING_PREVIEW_MODEL_STORAGE_KEY, selectedModel.id);
        } else {
          window.sessionStorage.removeItem(PENDING_PREVIEW_MODEL_STORAGE_KEY);
        }

        const nextSlots = artworkSlots.map((slot, index) =>
          index === activeSlotIndex ? getCurrentActiveSlot() : slot
        );

        const context = {
          selectedLayoutId,
          artworkSlots: nextSlots,
          activeSlotIndex,
          artworkBackground,
          artworkGapPercent,
        };

        await setPendingArtworkContext(context).catch(() => undefined);

        try {
          window.sessionStorage.setItem(
            PENDING_PREVIEW_ARTWORK_STORAGE_KEY,
            JSON.stringify(context)
          );
        } catch {
          window.sessionStorage.removeItem(PENDING_PREVIEW_ARTWORK_STORAGE_KEY);
        }
      }}
    />
  );

  const renderUploadCard = (
    mobile = false,
    options?: { roomy?: boolean; showCatalog?: boolean }
  ) => {
    const roomy = options?.roomy ?? false;
    const showCatalog = options?.showCatalog ?? true;

    return (
      <div className={mobile ? '' : 'space-y-3'}>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`relative cursor-pointer border-2 border-dashed text-center transition-all ${
            mobile
              ? `flex min-h-12 w-full items-center justify-between rounded-xl px-3 py-2 text-left ${
                  isDragging
                    ? 'border-zinc-900 bg-zinc-100'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                }`
              : `group flex flex-col items-center justify-center rounded-2xl ${
                  roomy ? 'min-h-[172px] gap-3 px-4 py-6' : 'gap-1 px-3 py-2'
                } ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                }`
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.heic,.heif"
            className="hidden"
          />

          <div
            className={`flex items-center justify-center rounded-full bg-zinc-100 ${
              mobile
                ? 'h-8 w-8 shrink-0'
                : roomy
                  ? 'h-12 w-12 transition-transform group-hover:scale-110'
                  : 'h-7 w-7 transition-transform group-hover:scale-110'
            }`}
          >
            <Upload className={`${mobile ? 'h-4 w-4 text-zinc-700' : roomy ? 'h-5 w-5 text-zinc-500' : 'h-4 w-4 text-zinc-500'}`} />
          </div>

          <div className={mobile ? 'min-w-0 flex-1 px-3' : ''}>
            <p className={`${mobile ? 'truncate text-sm' : roomy ? 'text-sm' : 'text-xs'} font-medium text-zinc-700`}>
              {mobile ? 'Toque para enviar sua imagem' : 'Carregar Foto'}
            </p>
            {!mobile && (
              <p className={`${roomy ? 'mt-1 text-xs' : 'text-[11px]'} text-zinc-400`}>
                PNG, JPG ate 10MB
              </p>
            )}
          </div>

          {mobile && <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />}
        </div>

        {showCatalog && renderCatalogImageSearch(mobile)}
      </div>
    );
  };

  const renderLayoutSelector = (mobile = false) => (
    <section className="flex h-full min-h-0 flex-col">
      <div>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#435446]">
          <LayoutGrid className="h-4 w-4" />
          Composicao da arte
        </p>
        <h3 className="mt-2 text-lg font-bold text-zinc-900">Escolha o layout</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Cada espaco recebera uma imagem independente.
        </p>
      </div>
      <div
        className={`mt-5 grid min-h-0 flex-1 content-start gap-3 overflow-y-auto pr-1 custom-scrollbar ${
          mobile ? 'grid-cols-3' : 'grid-cols-2'
        }`}
      >
        {ARTWORK_LAYOUTS.map((layout) => {
          const selected = selectedLayoutId === layout.id;

          return (
            <button
              key={layout.id}
              type="button"
              onClick={() => selectArtworkLayout(layout)}
              onDoubleClick={() => {
                selectArtworkLayout(layout);
                if (isMobileLayout) {
                  setCurrentStep(4);
                } else {
                  setDesktopStep(3);
                }
              }}
              className={`rounded-lg border p-3 text-left transition ${
                selected
                  ? 'border-[#435446] bg-[#e4ebe1] shadow-sm'
                  : 'border-zinc-200 bg-white hover:border-[#92a18d]'
              }`}
            >
              <span className="text-xs font-bold text-zinc-700">{layout.name}</span>
              <span className="relative mt-3 block aspect-[0.62] overflow-hidden rounded bg-zinc-100">
                {layout.slots.map((slot, index) => (
                  <span
                    key={`${layout.id}-${index}`}
                    className="absolute block border border-white bg-zinc-400"
                    style={{
                      left: `${slot.x}%`,
                      top: `${slot.y}%`,
                      width: `${slot.width}%`,
                      height: `${slot.height}%`,
                    }}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );

  const renderArtworkSlotSelector = (mobile = false) => {
    if (!selectedLayout) return null;

    return (
      <div className={mobile ? 'mb-2 mt-3' : 'mb-3'}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
            Imagens do layout
          </p>
          <p className="text-xs font-semibold text-[#435446]">
            {missingArtworkSlots
              ? `Faltam ${missingArtworkSlots}`
              : 'Layout preenchido'}
          </p>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {selectedLayout.slots.map((_, index) => {
            const slot = artworkSlots[index];
            const selected = index === activeSlotIndex;

            return (
              <button
                key={`${selectedLayout.id}-slot-${index}`}
                type="button"
                onClick={() => selectArtworkSlot(index)}
                draggable={Boolean(slot?.image)}
                onDragStart={(event) => {
                  if (!slot?.image) {
                    event.preventDefault();
                    return;
                  }
                  event.dataTransfer.setData('text/plain', String(index));
                  event.dataTransfer.effectAllowed = 'move';
                  setMovingSlotIndex(index);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const sourceIndex = Number(event.dataTransfer.getData('text/plain'));
                  if (Number.isInteger(sourceIndex)) {
                    swapArtworkSlots(sourceIndex, index);
                  }
                }}
                onDragEnd={() => setMovingSlotIndex(null)}
                className={`flex aspect-square items-center justify-center overflow-hidden border text-xs font-bold transition ${
                  mobile ? 'rounded-md' : 'rounded-lg'
                } ${
                  selected
                    ? 'border-[#435446] bg-[#e4ebe1] text-[#435446] ring-2 ring-[#435446]/15'
                    : 'border-zinc-200 bg-white text-zinc-400'
                }`}
                aria-label={`Selecionar imagem ${index + 1}`}
              >
                {slot?.image ? (
                  <img src={slot.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  index + 1
                )}
              </button>
            );
          })}
        </div>
        {movingSlotIndex !== null ? (
          <div className={`mt-2 flex items-center justify-between gap-2 rounded-lg bg-[#e4ebe1] px-3 text-xs font-semibold text-[#435446] ${mobile ? 'py-1.5' : 'py-2'}`}>
            <span>Escolha o destino para mover ou trocar.</span>
            <button type="button" onClick={() => setMovingSlotIndex(null)} className="underline">
              Cancelar
            </button>
          </div>
        ) : artworkSlots[activeSlotIndex]?.image && selectedLayout.slots.length > 1 ? (
          <button
            type="button"
            onClick={() => setMovingSlotIndex(activeSlotIndex)}
            className={`mt-2 w-full rounded-lg border border-[#6d7b6b]/15 bg-white px-3 text-xs font-semibold text-[#435446] ${mobile ? 'py-1.5' : 'py-2'}`}
          >
            Mover ou trocar imagem selecionada
          </button>
        ) : null}
      </div>
    );
  };

  const renderArtworkAppearanceControls = (mobile = false) => {
    if (!isMultiImageLayout) return null;

    const controls = (
      <>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
            Cor de fundo
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ARTWORK_BACKGROUND_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setArtworkBackground(color)}
                aria-label={`Selecionar fundo ${color}`}
                className={`h-7 w-7 rounded-full border transition ${
                  artworkBackground === color
                    ? 'border-[#435446] ring-2 ring-[#435446]/25'
                    : 'border-zinc-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <button
              type="button"
              onClick={() => setArtworkBackground(DEFAULT_ARTWORK_BACKGROUND)}
              aria-label="Remover cor de fundo"
              title="Sem fundo"
              className={`flex h-7 items-center justify-center rounded-full border px-2 text-[10px] font-semibold text-zinc-500 transition ${
                artworkBackground === DEFAULT_ARTWORK_BACKGROUND
                  ? 'border-[#435446] ring-2 ring-[#435446]/25'
                  : 'border-zinc-300'
              }`}
            >
              Sem fundo
            </button>
            <input
              type="color"
              value={artworkBackground === DEFAULT_ARTWORK_BACKGROUND ? '#ffffff' : artworkBackground}
              onChange={(event) => setArtworkBackground(event.target.value)}
              aria-label="Escolher cor de fundo personalizada"
              className="h-7 w-7 cursor-pointer rounded-full border border-zinc-300 bg-white p-0.5"
            />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
              Distancia entre fotos
            </p>
            <span className="text-xs font-semibold text-[#435446]">
              {artworkGapPercent.toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={MAX_ARTWORK_GAP_PERCENT}
            step="0.1"
            value={artworkGapPercent}
            onChange={(event) => setArtworkGapPercent(Number(event.target.value))}
            className="mt-2 w-full accent-[#435446]"
          />
        </div>
      </>
    );

    if (mobile) {
      return (
        <details className="group mb-2 rounded-xl border border-zinc-200 bg-white/85">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-[#435446]">
            <span className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Fundo e espacamento
            </span>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-zinc-100 px-3 py-3">{controls}</div>
        </details>
      );
    }

    return (
      <section className="mb-3 rounded-lg border border-zinc-200 bg-white/85 p-3">
        {controls}
      </section>
    );
  };

  const getPreviewFrameDimensions = (
    mobile = false,
    options?: { fullscreen?: boolean }
  ) => {
    const stableViewport = {
      width: viewport.width * pageZoomScale,
      height: viewport.height * pageZoomScale,
    };

    if (mobile) {
      const fullscreen = options?.fullscreen ?? false;
      if (fullscreen) {
        const horizontalPadding = clamp(stableViewport.width * 0.04, 10, 24);
        const verticalPadding = clamp(stableViewport.height * 0.05, 28, 56);
        const maxWidth = Math.max(240, stableViewport.width - horizontalPadding * 2);
        const maxHeight = Math.max(320, stableViewport.height - verticalPadding * 2);
        const width = Math.min(maxWidth, maxHeight * PREVIEW_ASPECT_RATIO);

        return {
          width,
          height: width / PREVIEW_ASPECT_RATIO,
        };
      }

      const horizontalPadding = clamp(stableViewport.width * 0.12, 24, 52);
      const maxWidthFromViewport = Math.max(190, stableViewport.width - horizontalPadding * 2);
      const isLargeMobilePreviewStep = currentStep === 6;
      const mobileArtworkControlsHeight =
        currentStep === 4
          ? isCatalogSearchOpen
            ? clamp(stableViewport.height * 0.31, 220, 290)
            : clamp(stableViewport.height * 0.19, 140, 180)
          : currentStep === 5
            ? clamp(stableViewport.height * 0.27, 210, 260)
            : currentStep === 6
              ? 210
              : 180;
      const reservedHeight =
        MOBILE_HEADER_ESTIMATED_HEIGHT +
        MOBILE_STEP_PROGRESS_ESTIMATED_HEIGHT +
        MOBILE_BOTTOM_BAR_ESTIMATED_HEIGHT +
        mobileArtworkControlsHeight;
      const maxHeight = Math.max(220, stableViewport.height - reservedHeight);
      const width = Math.min(
        clamp(
          stableViewport.width * (isLargeMobilePreviewStep ? 0.7 : 0.64),
          isLargeMobilePreviewStep ? 220 : 190,
          isLargeMobilePreviewStep ? 300 : 270
        ),
        maxWidthFromViewport,
        maxHeight * PREVIEW_ASPECT_RATIO
      );

      return {
        width,
        height: width / PREVIEW_ASPECT_RATIO,
      };
    }

    const maxWidthFromViewport = Math.max(320, stableViewport.width * 0.34);
    const maxHeight = Math.max(520, stableViewport.height - 220);
    const width = Math.min(
      EXPORT_WIDTH,
      maxWidthFromViewport,
      maxHeight * PREVIEW_ASPECT_RATIO
    );

    return {
      width,
      height: width / PREVIEW_ASPECT_RATIO,
    };
  };

  const getPreviewFrameStyle = (
    mobile = false,
    options?: { fullscreen?: boolean }
  ): React.CSSProperties => {
    const dimensions = getPreviewFrameDimensions(mobile, options);

    return {
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
    };
  };

  const resetToContainPlacement = () => {
    setPosition({ x: 0, y: 0 });
    setZoom(100);
    setImageRotation(0);
    setIsMirrored(false);
    setImageResetKey((prev) => prev + 1);
  };

  const renderPhonePreview = (
    mobile = false,
    interactive = true,
    options?: {
      imageInteractive?: boolean;
      imageSelectable?: boolean;
      textInteractive?: boolean;
      showInlineTextControls?: boolean;
      allowTextResize?: boolean;
      fullscreen?: boolean;
    }
  ) => {
    const imageInteractive = options?.imageInteractive ?? interactive;
    const imageSelectable = options?.imageSelectable ?? imageInteractive;
    const textInteractive = options?.textInteractive ?? interactive;
    const showInlineTextControls = options?.showInlineTextControls ?? textInteractive;
    const allowTextResize = options?.allowTextResize ?? textInteractive;
    const isFullscreen = options?.fullscreen ?? false;
    const mobileFrameRadius = clamp(viewport.width * 0.075, 24, 34);
    const previewFrameDimensions = getPreviewFrameDimensions(mobile, {
      fullscreen: isFullscreen,
    });
    const previewPageZoom = Math.max(pageZoomScale, 0.01);
    const previewDisplayScale = 1 / previewPageZoom;
    const previewShellStyle: React.CSSProperties = {
      width: `${previewFrameDimensions.width * previewDisplayScale}px`,
      height: `${previewFrameDimensions.height * previewDisplayScale}px`,
    };
    const previewInnerStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: `${previewFrameDimensions.width}px`,
      height: `${previewFrameDimensions.height}px`,
      transform: `scale(${previewDisplayScale})`,
      transformOrigin: 'top left',
    };
    const mobileReferenceScale =
      mobile && mobileEditorReferenceSize.width > 0
        ? previewFrameDimensions.width / mobileEditorReferenceSize.width
        : 1;
    const textPreviewStyle = buildTextStyle(
      mobile ? textSize * mobileReferenceScale : textSize,
      mobile ? mobileReferenceScale : 1
    );
    const scaledTextPosition = {
      x: textPosition.x * (mobile ? mobileReferenceScale : 1),
      y: textPosition.y * (mobile ? mobileReferenceScale : 1),
    };
    const textMovementScale = mobile ? mobileReferenceScale : 1;
    const scaledImagePosition = {
      x: position.x * (mobile ? mobileReferenceScale : 1),
      y: position.y * (mobile ? mobileReferenceScale : 1),
    };
    const canPrintPreview = Boolean(selectedModel && (hasArtworkImages || customText.trim()));
    const shouldShowPreviewPrintButton =
      canPrintPreview && !isFullscreen && (mobile ? currentStep >= 4 : desktopStep >= 3);
    const activeModelLayerCorrection = getResolvedModelPreviewCorrection(
      selectedModel,
      automaticModelCorrection
    );
    const renderPreviewArtworkSlot = (
      slot: ArtworkImageSlot,
      originalArea: LayoutSlotArea,
      index: number
    ) => {
      const area = getAdjustedSlotArea(originalArea, artworkGapPercent);
      const isActive = index === activeSlotIndex;
      const normalizedSlotRotation = ((slot.rotation % 360) + 360) % 360;
      const slotQuarterTurn = normalizedSlotRotation === 90 || normalizedSlotRotation === 270;
      const slotEffectiveRatio = slot.imageRatio
        ? slotQuarterTurn
          ? 1 / slot.imageRatio
          : slot.imageRatio
        : 1;
      const slotAspectRatio = IMAGE_AREA_ASPECT_RATIO * (area.width / area.height);
      const fitToHeight = slotEffectiveRatio >= slotAspectRatio;
      const slotScale = mobile ? mobileReferenceScale : 1;
      const slotPosition = isActive
        ? scaledImagePosition
        : { x: slot.position.x * slotScale, y: slot.position.y * slotScale };

      return (
        <div
          key={`${selectedLayout?.id || 'single'}-${index}`}
          ref={isActive ? imageAreaRef : undefined}
          className={`absolute overflow-hidden border ${
            imageSelectable && isActive
              ? 'border-[#435446] ring-2 ring-inset ring-white/90'
              : isMultiImageLayout
                ? 'border-[#92a18d]'
                : 'border-transparent'
          }`}
          onClick={(event) => {
            if (!imageSelectable) return;
            event.stopPropagation();
            selectArtworkSlot(index);
            if (mobile && currentStep === 4) {
              openMobileImageEditor();
            }
          }}
          onDoubleClick={(event) => {
            if (!imageSelectable) return;
            event.stopPropagation();
            selectArtworkSlot(index);
            window.setTimeout(() => fileInputRef.current?.click(), 0);
          }}
          style={{
            left: `${area.x}%`,
            top: `${area.y}%`,
            width: `${area.width}%`,
            height: `${area.height}%`,
            cursor: imageSelectable ? 'pointer' : 'default',
            backgroundColor: containImageOnInitialPlacement && slot.image
              ? 'rgba(109, 123, 107, 0.10)'
              : undefined,
            backgroundImage: containImageOnInitialPlacement && slot.image
              ? 'repeating-linear-gradient(135deg, rgba(67, 84, 70, 0.08) 0, rgba(67, 84, 70, 0.08) 1px, transparent 1px, transparent 10px)'
              : undefined,
            boxShadow: containImageOnInitialPlacement && slot.image
              ? 'inset 0 0 28px rgba(67, 84, 70, 0.10)'
              : undefined,
          }}
        >
          {slot.image && (
            <div
            key={`image-transform-${index}-${isActive ? imageResetKey : 0}`}
            onPointerDown={(event) => {
              if (!imageInteractive || !isActive) return;
              event.preventDefault();
              event.stopPropagation();
              event.currentTarget.setPointerCapture(event.pointerId);
              imageDragGestureRef.current = {
                pointerId: event.pointerId,
                startPointer: { x: event.clientX, y: event.clientY },
                startPosition: position,
              };
            }}
            onPointerMove={(event) => {
              const gesture = imageDragGestureRef.current;
              if (!imageInteractive || !isActive || gesture?.pointerId !== event.pointerId) {
                return;
              }

              event.preventDefault();
              const movementScale = previewPageZoom / Math.max(slotScale, 0.01);
              const nextX =
                gesture.startPosition.x + (event.clientX - gesture.startPointer.x) * movementScale;
              const nextY =
                gesture.startPosition.y + (event.clientY - gesture.startPointer.y) * movementScale;

              setPosition({
                x: Math.max(dragLimits.left, Math.min(dragLimits.right, nextX)),
                y: Math.max(dragLimits.top, Math.min(dragLimits.bottom, nextY)),
              });
            }}
            onPointerUp={(event) => {
              if (imageDragGestureRef.current?.pointerId !== event.pointerId) return;
              imageDragGestureRef.current = null;
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
            onPointerCancel={(event) => {
              if (imageDragGestureRef.current?.pointerId !== event.pointerId) return;
              imageDragGestureRef.current = null;
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
            onLostPointerCapture={(event) => {
              if (imageDragGestureRef.current?.pointerId === event.pointerId) {
                imageDragGestureRef.current = null;
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: imageInteractive && isActive ? 'grab' : 'default',
              touchAction: imageInteractive && isActive ? 'none' : 'auto',
              transform: `translate(${slotPosition.x}px, ${slotPosition.y}px) rotate(${slot.rotation}deg) scale(${(slot.zoom / 100) * (slotQuarterTurn ? 1.95 : 1)})`,
              transformOrigin: 'center center',
            }}
            >
              <img
                src={slot.image}
                crossOrigin="anonymous"
                draggable={false}
                style={{ transform: slot.mirrored ? 'scaleX(-1)' : 'scaleX(1)' }}
                className={`pointer-events-none select-none ${
                  containImageOnInitialPlacement
                    ? fitToHeight ? 'h-auto w-full' : 'h-full w-auto'
                    : fitToHeight ? 'h-full w-auto' : 'h-auto w-full'
                } max-h-none max-w-none`}
              />
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="relative" style={previewShellStyle}>
      <motion.div style={previewInnerStyle}>
        <div
          ref={containerRef}
          className={`relative flex items-center justify-center overflow-hidden ${
            mobile ? 'mx-auto' : 'rounded-[60px]'
          }`}
          style={{
            ...getPreviewFrameStyle(mobile, { fullscreen: isFullscreen }),
            ...(mobile
              ? {
                  borderRadius: `${isFullscreen ? clamp(viewport.width * 0.06, 18, 28) : mobileFrameRadius}px`,
                }
              : {}),
          }}
        >
          <div
            className="absolute inset-0"
            style={getModelLayerCorrectionStyle(
              selectedModel,
              previewFrameDimensions,
              activeModelLayerCorrection
            )}
          >
            {selectedModel?.col2 && (
              <img
                src={selectedModel.col2}
                className="absolute top-0 left-0 h-full w-full object-fill"
                style={{ zIndex: 1 }}
              />
            )}

            {!textOnlyMode && selectedLayout && (
              <div
                className="absolute overflow-hidden"
                style={{
                  top: '3.5%',
                  bottom: '3.5%',
                  left: `${IMAGE_AREA_HORIZONTAL_INSET * 100}%`,
                  right: `${IMAGE_AREA_HORIZONTAL_INSET * 100}%`,
                  zIndex: 10,
                  backgroundColor: isMultiImageLayout ? artworkBackground : 'transparent',
                }}
              >
                {selectedLayout.slots.map((area, index) =>
                  renderPreviewArtworkSlot(artworkSlots[index], area, index)
                )}
              </div>
            )}

            {customText && (
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                {textInteractive && isTextDragging && textCenterGuide.vertical && (
                  <div className="pointer-events-none absolute inset-y-[12%] left-1/2 w-0 -translate-x-1/2 border-l border-dashed border-[#e4ebe1]" />
                )}
                {textInteractive && isTextDragging && textCenterGuide.horizontal && (
                  <div className="pointer-events-none absolute inset-x-[12%] top-1/2 h-0 -translate-y-1/2 border-t border-dashed border-[#e4ebe1]" />
                )}
                <motion.div
                  key={`text-transform-${textResetKey}`}
                  drag={textInteractive}
                  dragElastic={0}
                  dragMomentum={false}
                  dragTransition={{ power: 0, timeConstant: 0 }}
                  onDragStart={() => {
                    setIsTextDragging(true);
                    textDragStartPositionRef.current = textPosition;
                    updateTextCenterGuide(textPosition);
                  }}
                  onDrag={(_, info) => {
                    if (!textInteractive) return;
                    const scale = Math.max(textMovementScale, 0.01);
                    const nextPosition = {
                      x:
                        textDragStartPositionRef.current.x +
                        (info.offset.x * previewPageZoom) / scale,
                      y:
                        textDragStartPositionRef.current.y +
                        (info.offset.y * previewPageZoom) / scale,
                    };
                    updateTextCenterGuide(nextPosition);
                  }}
                  onTouchStart={handleMobileTextTouchStart}
                  onTouchMove={handleMobileTextTouchMove}
                  style={{
                    x: scaledTextPosition.x,
                    y: scaledTextPosition.y,
                    rotate: textRotation,
                    pointerEvents: textInteractive ? 'auto' : 'none',
                    cursor: textInteractive ? 'move' : 'default',
                    touchAction: textInteractive ? 'none' : 'auto',
                  }}
                  onDragEnd={(_, info) => {
                    if (!textInteractive) return;
                    const scale = Math.max(textMovementScale, 0.01);
                    const snapped = snapTextToCenter({
                      x:
                        textDragStartPositionRef.current.x +
                        (info.offset.x * previewPageZoom) / scale,
                      y:
                        textDragStartPositionRef.current.y +
                        (info.offset.y * previewPageZoom) / scale,
                    });
                    setTextPosition(snapped);
                    hideTextCenterGuide();
                    setTextResetKey((prevKey) => prevKey + 1);
                  }}
                  className="relative max-w-[75%] select-none"
                >
                  <div
                    className={`relative rounded-sm bg-transparent px-3 py-2 ${
                      textInteractive ? 'border-2 border-green-600/60' : 'border-2 border-transparent'
                    }`}
                  >
                    <div style={textPreviewStyle}>{customText}</div>

                    <div className="absolute -top-10 left-1/2 flex -translate-x-1/2 gap-2 pointer-events-auto">
                      {showInlineTextControls && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTextRotation((prev) => (prev - 45) % 360);
                            }}
                            className="rounded-full bg-green-600 p-1.5 text-white shadow-lg transition-colors hover:bg-green-600"
                            title="Girar Anti-horario"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTextRotation((prev) => (prev + 45) % 360);
                            }}
                            className="rounded-full bg-green-600 p-1.5 text-white shadow-lg transition-colors hover:bg-green-600"
                            title="Girar Horario"
                          >
                            <RotateCw className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>

                    {textInteractive && allowTextResize && (
                      <motion.div
                        drag
                        dragElastic={0}
                        dragMomentum={false}
                        onDrag={(_, info) => {
                          const delta = (info.delta.x + info.delta.y) * previewPageZoom;
                          setTextSize((prev) =>
                            Math.max(8, Math.min(200, prev + delta * 0.25))
                          );
                        }}
                        className="absolute -right-2 -bottom-2 h-4 w-4 cursor-nwse-resize rounded-sm border border-white bg-green-600"
                      />
                    )}

                    {textInteractive && (
                      <>
                        <div className="absolute -top-1 -left-1 h-2 w-2 border-t-2 border-l-2 border-green-600" />
                        <div className="absolute -top-1 -right-1 h-2 w-2 border-t-2 border-r-2 border-green-600" />
                        <div className="absolute -bottom-1 -left-1 h-2 w-2 border-b-2 border-l-2 border-green-600" />
                      </>
                    )}
                  </div>
                </motion.div>
              </div>
            )}

            {selectedModel?.col3 && (
              <img
                src={selectedModel.col3}
                crossOrigin="anonymous"
                className="absolute inset-0 h-full w-full pointer-events-none"
                style={{ zIndex: 30 }}
              />
            )}

            {renderCaseLogo(
              previewFrameDimensions,
              mobile ? currentStep === 4 : desktopStep === 3
            )}
          </div>
        </div>
      </motion.div>

      {shouldShowPreviewPrintButton && (
        <div
          className={`absolute z-[80] flex flex-col items-center gap-2 ${
            mobile
              ? 'bottom-[12%] -right-7'
              : 'bottom-[14%] -right-16'
          }`}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleCopyPreviewPrint();
            }}
            disabled={!canPrintPreview || isGeneratingPreviewPrint}
            aria-label="Copiar print do preview"
            title="Copiar print da prévia"
            className={`flex items-center justify-center rounded-full border border-[#cbd9c7]/90 bg-[#e4ebe1]/95 text-[#435446] shadow-[0_14px_30px_rgba(67,84,70,0.18)] backdrop-blur transition-all hover:scale-105 hover:bg-[#eef4eb] disabled:cursor-not-allowed disabled:opacity-45 ${
              mobile ? 'h-10 w-10' : 'h-12 w-12'
            }`}
          >
            <Camera className={mobile ? 'h-4 w-4' : 'h-5 w-5'} />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleDownloadPreviewPrint();
            }}
            disabled={!canPrintPreview || isGeneratingPreviewPrint}
            aria-label="Baixar preview"
            title="Baixar prévia"
            className={`flex items-center justify-center rounded-full border border-[#cbd9c7]/90 bg-[#e4ebe1]/95 text-[#435446] shadow-[0_14px_30px_rgba(67,84,70,0.18)] backdrop-blur transition-all hover:scale-105 hover:bg-[#eef4eb] disabled:cursor-not-allowed disabled:opacity-45 ${
              mobile ? 'h-10 w-10' : 'h-12 w-12'
            }`}
          >
            <Download className={mobile ? 'h-4 w-4' : 'h-5 w-5'} />
          </button>

          <AnimatePresence>
            {previewPrintMessage && (
              <motion.div
                initial={{ opacity: 0, x: 8, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 8, scale: 0.98 }}
                className={`absolute right-full mr-3 whitespace-nowrap rounded-full bg-zinc-900 px-3 py-2 text-xs font-semibold text-white shadow-[0_14px_28px_rgba(15,23,42,0.24)] ${
                  mobile ? 'bottom-1' : 'bottom-2'
                }`}
              >
                {previewPrintMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {!mobile && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setIsCaseLogoVisible((visible) => !visible);
          }}
          aria-pressed={!isCaseLogoVisible}
          aria-label={isCaseLogoVisible ? 'Ocultar logo do preview' : 'Mostrar logo do preview'}
          className="absolute -bottom-16 left-1/2 -translate-x-1/2 cursor-default text-center outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-[#435446]"
        >
          <p className="text-sm font-bold text-zinc-900">
            {selectedModel?.name || 'Selecione um modelo'}
          </p>
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            {selectedBrand || 'Sem marca'}
          </p>
        </button>
      )}

      {image && imageInteractive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 whitespace-nowrap rounded-full border border-zinc-100 bg-white px-4 py-2 text-xs font-medium text-zinc-400 shadow-sm ${
            mobile
              ? 'mx-auto mt-3 w-fit'
              : 'absolute -top-12 left-1/2 -translate-x-1/2'
          }`}
        >
          <Move className="h-3 w-3" />
          Arraste ou use as setas para ajustar
        </motion.div>
      )}
    </div>
    );
  };

  const renderFulfillmentControls = (totalUnits: number) => {
    const freightAmount = getFreightAmount(totalUnits);
    const hasFreeFreight =
      fulfillmentMethod === 'delivery' && !pickupOnly && totalUnits >= 5;

    return (
    <div className="rounded-2xl border border-[#6d7b6b]/15 bg-[#f4f7f2] p-3">
      <p className="text-xs font-bold uppercase tracking-wider text-[#435446]">
        Forma de recebimento
      </p>
      {pickupOnly ? (
        <p className="mt-2 text-sm font-semibold text-[#435446]">
          Retirada na loja
        </p>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setFulfillmentMethod('delivery')}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
              fulfillmentMethod === 'delivery'
                ? 'border-[#435446] bg-[#435446] text-white'
                : 'border-zinc-200 bg-white text-zinc-600'
            }`}
          >
            Entrega
          </button>
          <button
            type="button"
            onClick={() => setFulfillmentMethod('pickup')}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
              fulfillmentMethod === 'pickup'
                ? 'border-[#435446] bg-[#435446] text-white'
                : 'border-zinc-200 bg-white text-zinc-600'
            }`}
          >
            Retirar na loja
          </button>
        </div>
      )}
      <p className="mt-2 text-xs text-zinc-500">
        {hasFreeFreight
          ? 'Frete gratis para pedidos com 5 unidades ou mais'
          : fulfillmentMethod === 'delivery' && !pickupOnly
          ? `Frete: ${formatCurrency(freightAmount)}`
          : 'Frete: sem cobranca'}
      </p>
    </div>
    );
  };

  const renderCustomerProvidedCaseOption = (totalUnits: number) => (
    <div className="flex items-start gap-3 rounded-2xl border border-[#6d7b6b]/15 bg-[#f4f7f2] p-3 text-left">
      <input
        type="checkbox"
        checked={customerProvidesCases}
        onChange={(event) => {
          const checked = event.target.checked;
          setCustomerProvidesCases(checked);
          setCustomerProvidedCasesQuantity(checked ? Math.min(1, totalUnits) : 0);
        }}
        className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-[#435446] focus:ring-[#435446]"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-[#435446]">
          Vou enviar uma capinha da minha loja para impressao
        </span>
        <span className="mt-1 block text-xs text-zinc-500">
          Desconto de {formatCurrency(customerProvidedCaseDiscount)} por unidade.
        </span>
        {customerProvidesCases && (
          <span className="mt-3 block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Quantidade enviada
            </span>
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  setCustomerProvidedCasesQuantity((prev) => Math.max(1, prev - 1));
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-zinc-700 shadow-sm"
              >
                -
              </button>
              <span className="flex h-8 flex-1 items-center justify-center rounded-lg border border-zinc-200 bg-white text-xs font-bold text-zinc-800">
                {getCustomerProvidedCasesQuantity(totalUnits)}
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  setCustomerProvidedCasesQuantity((prev) =>
                    Math.min(totalUnits, prev + 1)
                  );
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-sm font-bold text-zinc-700 shadow-sm"
              >
                +
              </button>
            </span>
          </span>
        )}
      </span>
    </div>
  );

  const renderOrderSummary = () => {
    const pricing = getOrderPricing(checkoutQuantity);

    return (
    <div className="flex-1 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-bold text-zinc-800">Resumo do pedido</h3>

      <div className="space-y-1.5 text-sm text-zinc-600">
        <p>
          <strong>Modelo:</strong> {selectedModel?.name || 'Nao selecionado'}
        </p>
        <p>
          <strong>Marca:</strong> {selectedBrand || 'Nao selecionada'}
        </p>
        <p>
          <strong>Texto:</strong> {customText.trim() || 'Sem texto'}
        </p>
        <p>
          <strong>Imagem:</strong> {image ? 'Adicionada' : 'Nao adicionada'}
        </p>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-zinc-400">
          Quantidade
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
            className="h-9 w-9 rounded-xl bg-zinc-100 font-bold text-zinc-700 transition-colors hover:bg-zinc-200"
          >
            -
          </button>

          <div className="flex h-9 flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-800">
            {quantity}
          </div>

          <button
            type="button"
            onClick={() => setQuantity((prev) => prev + 1)}
            className="h-9 w-9 rounded-xl bg-zinc-100 font-bold text-zinc-700 transition-colors hover:bg-zinc-200"
          >
            +
          </button>
        </div>
      </div>

      {hasAdminCheckoutFeatures && (
        <div className="mt-3 space-y-2">
          {renderCustomerProvidedCaseOption(checkoutQuantity)}
          {renderFulfillmentControls(checkoutQuantity)}
        </div>
      )}

      <div className="mt-3 space-y-1 border-t border-zinc-100 pt-3 text-sm">
        <p className="flex justify-between text-zinc-600">
          <span>Valor unitario</span>
          <strong>R$ {unitPrice.toFixed(2)}</strong>
        </p>
        {hasAdminCheckoutFeatures && customerProvidesCases && (
          <p className="flex justify-between text-zinc-600">
            <span>Desconto ({pricing.providedCasesQuantity} capinha(s))</span>
            <strong>- {formatCurrency(pricing.discount)}</strong>
          </p>
        )}
        {hasAdminCheckoutFeatures && (
          <p className="flex justify-between text-zinc-600">
            <span>Frete</span>
            <strong>
              {checkoutFreightAmount > 0 ? formatCurrency(checkoutFreightAmount) : 'Sem cobranca'}
            </strong>
          </p>
        )}
        <p className="flex justify-between text-base font-bold text-zinc-800">
          <span>Total</span>
          <span>{formatCurrency(checkoutTotal)}</span>
        </p>
      </div>
    </div>
    );
  };

  const desktopStepConfig = [
    { step: 1, title: 'Modelo', description: 'Escolha o aparelho da capinha.' },
    { step: 2, title: 'Layout', description: 'Escolha a composicao das fotos.' },
    { step: 3, title: 'Imagem', description: 'Preencha os espacos com suas imagens.' },
    { step: 4, title: 'Texto', description: 'Edite o texto ou marque que nao vai inserir.' },
    { step: 5, title: 'Resumo', description: 'Revise, adicione ao carrinho ou finalize.' },
  ] as const;

  const canAdvanceDesktopStep1 = Boolean(selectedModel);
  const canAdvanceDesktopStep2 = Boolean(selectedLayout);
  const canAdvanceDesktopStep3 = hasAllLayoutImages;
  const canAdvanceDesktopStep4 = skipTextStep || Boolean(customText.trim());

  const goToNextDesktopStep = () => {
    if (desktopStep === 1 && !canAdvanceDesktopStep1) return;
    if (desktopStep === 2 && !canAdvanceDesktopStep2) return;
    if (desktopStep === 3 && !canAdvanceDesktopStep3) return;
    if (desktopStep === 4 && !canAdvanceDesktopStep4) return;
    hideTextCenterGuide();
    setDesktopStep((prev) => Math.min(5, prev + 1));
  };

  const goToPrevDesktopStep = () => {
    setDesktopStep((prev) => Math.max(1, prev - 1));
  };

  const renderDesktopImageControlsPanel = () => {
    if (!image) return null;

    return (
      <div className="w-full max-w-[320px] rounded-[32px] border border-[#6d7b6b]/15 bg-[#e4ebe1] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-400">
            Ajustes da imagem
          </label>
          <span className="text-[10px] font-mono text-zinc-500">Zoom: {activeZoom}%</span>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex rounded-lg bg-zinc-100 p-1">
              <button
                onClick={() => setZoom(Math.max(minimumManualZoom, zoom - 10))}
                className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-white"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoom(Math.min(300, zoom + 10))}
                className="rounded-md p-1.5 text-zinc-600 transition-colors hover:bg-white"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
            <span className="text-[9px] font-bold uppercase text-zinc-400">Zoom</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => setIsMirrored(!isMirrored)}
              className={`rounded-lg p-2.5 transition-all ${
                isMirrored
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              <FlipHorizontal className="h-4 w-4" />
            </button>
            <span className="text-[9px] font-bold uppercase text-zinc-400">Espelhar</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => setImageRotation((prev) => (prev - 90) % 360)}
              className="rounded-lg bg-zinc-100 p-2.5 text-zinc-600 transition-all hover:bg-zinc-200"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <span className="text-[9px] font-bold uppercase text-zinc-400">Girar anti</span>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
              className="rounded-lg bg-zinc-100 p-2.5 text-zinc-600 transition-all hover:bg-zinc-200"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <span className="text-[9px] font-bold uppercase text-zinc-400">Girar hor</span>
          </div>
        </div>

        <div className="pt-4">
          <input
            type="range"
            min={minimumManualZoom}
            max="300"
            value={activeZoom}
            onChange={(e) => setZoom(parseInt(e.target.value))}
            className="w-full accent-indigo-600"
          />
        </div>

        <section className="mt-5">
          <label className="mb-3 block text-xs font-bold uppercase tracking-[0.24em] text-zinc-400">
            Ajuste de posicao
          </label>
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => moveImage('up')}
              className="rounded-lg bg-zinc-100 p-2 text-zinc-600 hover:bg-zinc-200"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => moveImage('left')}
                className="rounded-lg bg-zinc-100 p-2 text-zinc-600 hover:bg-zinc-200"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={resetToContainPlacement}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition-colors hover:bg-zinc-100"
                title="Centralizar imagem"
              >
                <Move className="h-4 w-4" />
              </button>
              <button
                onClick={() => moveImage('right')}
                className="rounded-lg bg-zinc-100 p-2 text-zinc-600 hover:bg-zinc-200"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={() => moveImage('down')}
              className="rounded-lg bg-zinc-100 p-2 text-zinc-600 hover:bg-zinc-200"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-zinc-500">
            Se preferir, voce pode usar o mouse para arrastar a imagem.
          </p>
        </section>

        {aiOutpaintingVisible && needsAiOutpainting && (
          <div className="mt-5 border-t border-[#6d7b6b]/15 pt-5">
            <AiOutpaintingSuggestion
              onGenerate={aiOutpainting.open}
              onAdjust={() => undefined}
              onChooseAnother={() => fileInputRef.current?.click()}
              compact
            />
            {aiOutpainting.status === 'approved' && (
              <button type="button" onClick={aiOutpainting.restoreOriginal} className="mt-2 min-h-11 w-full rounded-xl border border-[#435446]/20 bg-white px-3 text-sm font-semibold text-[#435446]">
                Restaurar imagem original
              </button>
            )}
          </div>
        )}

      </div>
    );
  };

  const renderDesktopSidebarContent = () => {
    if (desktopStep === 1) {
      return (
        <div className="flex h-full min-h-0 flex-col space-y-3">
          {renderModelSelector()}
        </div>
      );
    }

    if (desktopStep === 2) {
      return renderLayoutSelector();
    }

    if (desktopStep === 3) {
      return (
        <div className="flex h-full min-h-0 flex-col">
          <section className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-zinc-200/70 bg-white/72 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.08)]">
            <label className="mb-5 block text-sm font-bold uppercase tracking-wider text-zinc-400">
              Suas imagens
            </label>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1 custom-scrollbar">
              {renderArtworkSlotSelector()}
              {renderArtworkAppearanceControls()}
              <div className="space-y-4">
                {renderUploadCard(false, { roomy: true, showCatalog: false })}
                {renderCatalogImageSearch()}
              </div>
              <p className="text-xs leading-relaxed text-zinc-500">
                Depois do upload, os ajustes da imagem aparecem no painel branco ao lado do preview.
              </p>
              <div className="flex-1" />
              <button
                type="button"
                onClick={resetArtwork}
                disabled={!hasArtworkImages && !customText.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-4 py-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/80"
              >
                <RotateCcw className="h-4 w-4" />
                Resetar arte
              </button>
            </div>
          </section>
        </div>
      );
    }

    if (desktopStep === 4) {
      return (
        <section className="flex h-full min-h-0 flex-col space-y-3 overflow-y-auto pr-2 custom-scrollbar">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
              Personalizar texto
            </label>
            <div className="flex gap-1">
              <button
                onClick={() => setTextRotation((prev) => (prev - 45) % 360)}
                className="rounded-lg bg-zinc-100 p-1.5 text-zinc-600 transition-colors hover:bg-zinc-200"
                title="Girar Anti-horario"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setTextRotation((prev) => (prev + 45) % 360)}
                className="rounded-lg bg-zinc-100 p-1.5 text-zinc-600 transition-colors hover:bg-zinc-200"
                title="Girar Horario"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
            <input
              type="checkbox"
              checked={skipTextStep}
              onChange={(e) => {
                const checked = e.target.checked;
                setSkipTextStep(checked);
                if (checked) {
                  clearText();
                }
              }}
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-[#435446] focus:ring-[#435446]"
            />
            <span>
              <span className="block text-sm font-semibold text-zinc-800">
                Nao inserir texto nesta capinha
              </span>
              <span className="mt-1 block text-xs text-zinc-500">
                Marque esta opcao para seguir sem personalizacao de texto.
              </span>
            </span>
          </label>

          {!skipTextStep && (
            <div className="space-y-3">
              <div className="mb-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="textOnly"
                  checked={textOnlyMode}
                  onChange={(e) => setTextOnlyMode(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="textOnly"
                  className="cursor-pointer text-xs font-medium text-zinc-600"
                >
                  Modo Somente Texto (Ocultar Foto)
                </label>
              </div>

              <div className="relative">
                <Type className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <textarea
                  placeholder="Escreva seu texto..."
                  value={customText}
                  onChange={handleCustomTextChange}
                  maxLength={MAX_CUSTOM_TEXT_LENGTH}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBold(!isBold)}
                  className={`rounded p-2 ${
                    isBold ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsItalic(!isItalic)}
                  className={`rounded p-2 ${
                    isItalic ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsUnderline(!isUnderline)}
                  className={`rounded p-2 ${
                    isUnderline ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  <Underline className="h-4 w-4" />
                </button>
                <div className="mx-1 h-3 w-px bg-zinc-300" />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-zinc-800">Espacamento</span>
                  <button
                    type="button"
                    onClick={() => setLetterSpacing((prev) => Math.max(-2, prev - 0.5))}
                    className="rounded bg-zinc-100 px-3 py-1 text-xs"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs">{letterSpacing}</span>
                  <button
                    type="button"
                    onClick={() => setLetterSpacing((prev) => Math.min(10, prev + 0.5))}
                    className="rounded bg-zinc-100 px-3 py-1 text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Fonte</label>
                  <select
                    value={textFont}
                    onChange={(e) => setTextFont(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {GOOGLE_FONTS.map((font) => (
                      <option
                        key={font.name}
                        value={font.value}
                        style={{ fontFamily: font.value }}
                      >
                        {font.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">
                    Tamanho
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTextSize((prev) => Math.max(8, prev - 2))}
                      className="rounded-lg bg-zinc-100 px-3 py-2 text-zinc-700 hover:bg-zinc-200"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={textSize}
                      onChange={(e) =>
                        setTextSize(Math.max(8, parseInt(e.target.value) || 12))
                      }
                      className="no-spinner w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-center text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setTextSize((prev) => Math.min(200, prev + 2))}
                      className="rounded-lg bg-zinc-100 px-3 py-2 text-zinc-700 hover:bg-zinc-200"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-zinc-400">Cor</label>
                <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-12 w-12 cursor-pointer rounded-lg border border-zinc-200 bg-transparent p-1"
                      title="Escolher cor do texto"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-zinc-600">Cor do texto</p>
                      <div className="mt-1 flex items-center gap-2">
                        <div
                          className="h-5 w-5 rounded-full border border-zinc-300"
                          style={{ backgroundColor: textColor }}
                        />
                        <input
                          type="text"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={textStrokeColor}
                      onChange={(e) => setTextStrokeColor(e.target.value)}
                      className="h-12 w-12 cursor-pointer rounded-lg border border-zinc-200 bg-transparent p-1"
                      title="Cor da borda"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-zinc-600">
                        Cor e espessura da borda
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="8"
                          value={textStroke}
                          onChange={(e) => setTextStroke(parseInt(e.target.value))}
                          className="w-full"
                        />
                        <span className="w-8 text-center text-xs text-zinc-600">
                          {textStroke}px
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      );
    }

    return (
      <div className="flex h-full min-h-0 flex-col overflow-y-auto pr-1 custom-scrollbar">
        {renderOrderSummary()}
        <div className="space-y-2.5 pt-3">
          <label className="flex items-start gap-3 rounded-xl border border-[#6d7b6b]/15 bg-white px-4 py-2.5 text-left shadow-sm">
            <input
              type="checkbox"
              checked={isArtworkApproved}
              onChange={(e) => setIsArtworkApproved(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-zinc-300 text-[#435446] focus:ring-[#435446]"
            />
            <span>
              <span className="block text-sm font-semibold text-zinc-800">
                Arte aprovada pelo cliente
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                A finalizacao do pedido so fica disponivel apos esta confirmacao.
              </span>
            </span>
          </label>
          <button
            type="button"
            onClick={adicionarItemAoCarrinho}
            disabled={isUploadingOrder || !canSubmitApprovedItem}
            className="w-full rounded-xl bg-[#435446] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(67,84,70,0.2)] transition-all hover:bg-[#39493b] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-white disabled:shadow-none"
          >
            <span className="flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar ao carrinho e fazer outra
            </span>
          </button>
          <button
            onClick={handleFinish}
            disabled={isUploadingOrder || !isArtworkApproved || (!carrinho.length && !canFinish)}
            className={`w-full rounded-xl px-5 py-3 text-sm font-bold transition-all ${
              (carrinho.length || canFinish) && isArtworkApproved
                ? 'scale-[1.02] bg-zinc-900 text-white shadow-xl active:scale-100 hover:bg-zinc-800'
                : 'cursor-not-allowed bg-zinc-200 text-zinc-400'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Download className="h-4 w-4" />
              {isUploadingOrder ? 'Enviando imagens...' : 'Finalizar Pedido'}
            </span>
          </button>
          {orderCompleted && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-center text-sm font-medium text-green-700">
              Pedido pronto para envio no WhatsApp!
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDesktopStepFooter = () => (
    <div className="border-t border-zinc-100 bg-zinc-50/70 px-6 py-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goToPrevDesktopStep}
          disabled={desktopStep === 1}
          className="min-h-11 flex-1 rounded-[18px] border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Voltar
        </button>
        {desktopStep < 5 ? (
          <button
            type="button"
            onClick={goToNextDesktopStep}
            disabled={
              desktopStep === 1
                ? !canAdvanceDesktopStep1
                : desktopStep === 2
                  ? !canAdvanceDesktopStep2
                  : desktopStep === 3
                    ? !canAdvanceDesktopStep3
                    : !canAdvanceDesktopStep4
            }
            className="min-h-11 flex-1 rounded-[18px] bg-[#435446] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(67,84,70,0.2)] transition-all hover:bg-[#39493b] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
          >
            Avancar
          </button>
        ) : (
          <button
            type="button"
            onClick={resetArtwork}
            className="min-h-11 flex-1 rounded-[18px] border border-[#6d7b6b]/15 bg-[#e4ebe1] px-4 text-sm font-semibold text-[#435446] transition-colors hover:bg-[#dbe4d8]"
          >
            Resetar arte
          </button>
        )}
      </div>
    </div>
  );

  const renderBotaoCarrinho = (mobile = false) => (
    <button
      type="button"
      onClick={() => setCarrinhoAberto(true)}
      className={`relative inline-flex items-center justify-center gap-2 rounded-full border transition-all ${
        mobile
          ? 'h-11 min-w-11 border-[#6d7b6b]/15 bg-white/85 px-3 text-[#435446] shadow-sm'
          : 'h-11 border-zinc-200 bg-white px-4 text-zinc-700 shadow-sm hover:bg-zinc-50'
      }`}
      aria-label="Abrir carrinho"
    >
      <ShoppingCart className="h-4 w-4" />
      {!mobile && <span className="text-sm font-semibold">Carrinho</span>}
      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#435446] px-1 text-[10px] font-bold text-white">
        {carrinho.length}
      </span>
    </button>
  );

  const renderPainelCarrinho = () => (
    <AnimatePresence>
      {carrinhoAberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-zinc-950/35 backdrop-blur-[2px]"
          onClick={() => setCarrinhoAberto(false)}
        >
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="ml-auto flex h-full w-full max-w-[420px] flex-col bg-[#f6f3ee] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#6d7b6b]/15 px-5 py-4">
              <div>
                <h3 className="font-lexend text-base font-bold text-[#435446]">Carrinho</h3>
                <p className="text-xs text-zinc-500">
                  {carrinho.length} modelo(s) • {quantidadeItensCarrinho} unidade(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCarrinhoAberto(false)}
                className="rounded-full border border-zinc-200 bg-white p-2 text-zinc-500"
                aria-label="Fechar carrinho"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {carrinho.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-zinc-300 bg-white/70 px-5 py-8 text-center">
                  <p className="text-sm font-semibold text-zinc-700">
                    Seu carrinho ainda esta vazio.
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Adicione uma capinha finalizada para continuar montando o pedido.
                  </p>
                </div>
              ) : (
                carrinho.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-[28px] border border-white/80 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#efe9df]">
                        {item.previewLocal || item.imagemPreviewUrl ? (
                          <img
                            src={item.previewLocal || item.imagemPreviewUrl}
                            alt={`Preview do item ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ShoppingCart className="h-5 w-5 text-zinc-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                          Item {index + 1}
                        </p>
                        <p className="mt-1 text-sm font-bold text-zinc-800">{item.modelo}</p>
                        <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                          {item.marca}
                        </p>
                        <p className="mt-2 text-xs text-zinc-600">{item.resumo}</p>
                        <p className="mt-2 text-xs font-semibold text-[#435446]">
                          Quantidade: {item.quantidade}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removerItemDoCarrinho(item.id)}
                        className="rounded-full border border-zinc-200 p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        aria-label={`Remover item ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              {canFinish && (
                <div className="rounded-[28px] border border-[#6d7b6b]/15 bg-[#e4ebe1] p-4">
                  <p className="text-sm font-bold text-[#435446]">Item atual pronto para enviar</p>
                  <p className="mt-1 text-xs text-[#435446]/80">
                    {selectedBrand} {selectedModel ? `• ${selectedModel.name}` : ''} • Quantidade {quantity}
                  </p>
                  <button
                    type="button"
                    onClick={adicionarItemAoCarrinho}
                    disabled={isUploadingOrder}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#435446] px-4 py-2 text-xs font-semibold text-white disabled:bg-zinc-300"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar item atual
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-[#6d7b6b]/15 bg-white/80 p-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-zinc-500">Total de unidades</span>
                <strong className="text-zinc-800">{checkoutQuantity}</strong>
              </div>
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-zinc-500">Subtotal</span>
                <strong className="text-zinc-800">
                  {formatCurrency(checkoutPricing.subtotal)}
                </strong>
              </div>
              {hasAdminCheckoutFeatures && customerProvidesCases && (
                <div className="mb-3 flex items-center justify-between text-xs text-[#435446]">
                  <span>Desconto ({checkoutPricing.providedCasesQuantity} capinha(s))</span>
                  <strong>- {formatCurrency(checkoutPricing.discount)}</strong>
                </div>
              )}
              {hasAdminCheckoutFeatures && (
                <div className="mb-3 space-y-2">
                  {renderCustomerProvidedCaseOption(checkoutQuantity)}
                  {renderFulfillmentControls(checkoutQuantity)}
                </div>
              )}
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="font-semibold text-zinc-700">Valor total</span>
                <strong className="text-[#435446]">{formatCurrency(checkoutTotal)}</strong>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={fazerNovaCapinha}
                  className="flex-1 rounded-[18px] border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Fazer nova capinha
                </button>
                <button
                  type="button"
                  onClick={finalizarPedidoCarrinho}
                  disabled={isUploadingOrder || (!carrinho.length && !canFinish)}
                  className="flex-1 rounded-[18px] bg-[#435446] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
                >
                  {isUploadingOrder ? 'Enviando...' : 'Finalizar pedido'}
                </button>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const showMobileSuggestions =
    currentStep === 1 &&
    mobileSuggestions.length > 0 &&
    (isMobileSearchActive || Boolean(mobileBrandSearchQuery.trim()));

  const clampInspectOffset = (
    nextOffset: { x: number; y: number },
    nextScale: number,
    bounds: { width: number; height: number }
  ) => {
    const maxOffsetX = ((nextScale - 1) * bounds.width) / 2;
    const maxOffsetY = ((nextScale - 1) * bounds.height) / 2;

    return {
      x: clamp(nextOffset.x, -maxOffsetX, maxOffsetX),
      y: clamp(nextOffset.y, -maxOffsetY, maxOffsetY),
    };
  };

  const getTouchPoint = (touch: Touch, bounds: DOMRect) => ({
    x: touch.clientX - bounds.left,
    y: touch.clientY - bounds.top,
  });

  const getTouchDistance = (first: { x: number; y: number }, second: { x: number; y: number }) =>
    Math.hypot(second.x - first.x, second.y - first.y);

  const getTouchMidpoint = (first: { x: number; y: number }, second: { x: number; y: number }) => ({
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  });

  const getMobileInspectBounds = () =>
    mobileInspectViewportRef.current?.getBoundingClientRect() ?? null;

  const handleMobileTextTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobileTextEditing || e.touches.length !== 2) return;

    const bounds = e.currentTarget.getBoundingClientRect();
    const first = getTouchPoint(e.touches[0], bounds);
    const second = getTouchPoint(e.touches[1], bounds);
    mobileTextGestureRef.current = {
      startDistance: getTouchDistance(first, second),
      startSize: textSize,
    };
  };

  const handleMobileTextTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isMobileTextEditing || e.touches.length !== 2) return;

    e.preventDefault();
    const bounds = e.currentTarget.getBoundingClientRect();
    const first = getTouchPoint(e.touches[0], bounds);
    const second = getTouchPoint(e.touches[1], bounds);
    const nextDistance = getTouchDistance(first, second);
    const { startDistance, startSize } = mobileTextGestureRef.current;

    if (!startDistance) return;

    setTextSize(
      Math.round(clamp((nextDistance / startDistance) * startSize, 8, 200))
    );
  };

  const lockMobileEditorTransforms = () => {
    setIsMobileImageEditing(false);
    setIsMobileTextModalOpen(false);
    setIsMobileTextEditing(false);
    hideTextCenterGuide();
  };

  const handleMobileInspectTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const bounds = getMobileInspectBounds();
    if (!bounds) return;

    if (e.touches.length === 2) {
      const first = getTouchPoint(e.touches[0], bounds);
      const second = getTouchPoint(e.touches[1], bounds);
      mobileInspectGestureRef.current = {
        mode: 'pinch',
        startDistance: getTouchDistance(first, second),
        startScale: mobileInspectScale,
        startOffset: mobileInspectOffset,
        startTouch: { x: 0, y: 0 },
        startMidpoint: getTouchMidpoint(first, second),
      };
      return;
    }

    if (e.touches.length === 1 && mobileInspectScale > 1) {
      const touch = getTouchPoint(e.touches[0], bounds);
      mobileInspectGestureRef.current = {
        mode: 'pan',
        startDistance: 0,
        startScale: mobileInspectScale,
        startOffset: mobileInspectOffset,
        startTouch: touch,
        startMidpoint: { x: 0, y: 0 },
      };
    }
  };

  const handleMobileInspectTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const bounds = getMobileInspectBounds();
    if (!bounds) return;
    const gesture = mobileInspectGestureRef.current;

    if (e.touches.length === 2) {
      e.preventDefault();
      const first = getTouchPoint(e.touches[0], bounds);
      const second = getTouchPoint(e.touches[1], bounds);
      const midpoint = getTouchMidpoint(first, second);
      const distance = getTouchDistance(first, second);
      const nextScale = clamp(
        (distance / Math.max(gesture.startDistance, 1)) * gesture.startScale,
        1,
        1.5
      );

      const midpointDelta = {
        x: midpoint.x - gesture.startMidpoint.x,
        y: midpoint.y - gesture.startMidpoint.y,
      };

      setMobileInspectScale(nextScale);
      setMobileInspectOffset(
        clampInspectOffset(
          {
            x: gesture.startOffset.x + midpointDelta.x,
            y: gesture.startOffset.y + midpointDelta.y,
          },
          nextScale,
          bounds
        )
      );
      return;
    }

    if (e.touches.length === 1 && gesture.mode === 'pan' && mobileInspectScale > 1) {
      e.preventDefault();
      const touch = getTouchPoint(e.touches[0], bounds);
      const delta = {
        x: touch.x - gesture.startTouch.x,
        y: touch.y - gesture.startTouch.y,
      };

      setMobileInspectOffset(
        clampInspectOffset(
          {
            x: gesture.startOffset.x + delta.x,
            y: gesture.startOffset.y + delta.y,
          },
          mobileInspectScale,
          bounds
        )
      );
    }
  };

  const handleMobileInspectTouchEnd = () => {
    mobileInspectGestureRef.current.mode = 'none';
  };

  const renderMobileBottomBar = ({
    onPrimary,
    primaryLabel,
    primaryDisabled = false,
    showReset = false,
    onReset,
    resetLabel = 'Resetar',
  }: {
    onPrimary: () => void;
    primaryLabel: string;
    primaryDisabled?: boolean;
    showReset?: boolean;
    onReset?: () => void;
    resetLabel?: string;
  }) => (
    <div className="sticky bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2">
      <div className="mx-auto flex w-full max-w-[680px] items-center gap-2 rounded-[24px] border border-white/80 bg-white/92 p-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-md">
        <button
          type="button"
          onClick={prevStep}
          className="min-h-11 flex-1 rounded-[18px] border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-colors hover:bg-zinc-50"
        >
          Voltar
        </button>
        {showReset && (
          <button
            type="button"
            onClick={onReset ?? resetTransform}
            className="min-h-11 rounded-[18px] border border-[#6d7b6b]/15 bg-[#e4ebe1] px-4 text-sm font-semibold text-[#435446] transition-colors hover:bg-[#dbe4d8]"
          >
            {resetLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled}
          className={`min-h-11 flex-1 rounded-[18px] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(67,84,70,0.2)] transition-all ${
            primaryDisabled ? 'bg-zinc-300 shadow-none' : 'bg-[#435446] hover:bg-[#39493b]'
          }`}
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );

  const renderMobileImageControls = () => {
    if (!isMobileImageEditing || !image) return null;

    const controlClassName =
      'flex h-10 w-10 items-center justify-center rounded-xl border border-[#5f6e5b]/20 bg-[#435446] text-white shadow-[0_8px_18px_rgba(67,84,70,0.18)]';

    return (
      <section className="mt-3 shrink-0 rounded-2xl border border-[#6d7b6b]/15 bg-white/92 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.07)]">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#435446]">
            Ajustar imagem selecionada
          </p>
          <button
            type="button"
            onClick={() => setIsMobileImageEditing(false)}
            className="rounded-full bg-[#e4ebe1] px-3 py-1.5 text-[11px] font-semibold text-[#435446]"
          >
            Concluir
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="grid shrink-0 grid-cols-3 gap-1">
            <span />
            <button type="button" onClick={() => moveImage('up')} className={controlClassName} aria-label="Mover imagem para cima">
              <ChevronUp className="h-4 w-4" />
            </button>
            <span />
            <button type="button" onClick={() => moveImage('left')} className={controlClassName} aria-label="Mover imagem para esquerda">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => moveImage('down')} className={controlClassName} aria-label="Mover imagem para baixo">
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => moveImage('right')}
              className={controlClassName}
              aria-label="Mover imagem para direita"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setZoom(Math.max(minimumManualZoom, zoom - 10))}
                className={controlClassName}
                aria-label="Diminuir zoom"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="min-w-12 text-center text-xs font-semibold text-zinc-500">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom(Math.min(300, zoom + 10))}
                className={controlClassName}
                aria-label="Aumentar zoom"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
              className={controlClassName}
              aria-label="Girar imagem"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsMirrored((prev) => !prev)}
              className={controlClassName}
              aria-label="Espelhar imagem"
            >
              <FlipHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
        </div>
        {aiOutpaintingVisible && needsAiOutpainting && (
          <div className="mt-3 border-t border-zinc-100 pt-3">
            <AiOutpaintingSuggestion
              onGenerate={aiOutpainting.open}
              onAdjust={() => setIsMobileImageEditing(true)}
              onChooseAnother={() => mobileFileInputRef.current?.click()}
              compact
            />
            {aiOutpainting.status === 'approved' && (
              <button type="button" onClick={aiOutpainting.restoreOriginal} className="mt-2 min-h-11 w-full rounded-xl border border-[#435446]/20 text-sm font-semibold text-[#435446]">Restaurar imagem original</button>
            )}
          </div>
        )}
      </section>
    );
  };

  const renderMobileTextControls = () => {
    if (!isMobileTextEditing || !customText.trim()) return null;

    const controlClassName =
      'flex h-12 w-12 items-center justify-center rounded-full border border-[#5f6e5b]/20 bg-[#435446] text-white shadow-[0_14px_30px_rgba(67,84,70,0.22)]';

    return (
      <>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
          <div className="pointer-events-auto grid gap-3">
            <button type="button" onClick={() => moveText('left')} className={controlClassName}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => moveText('up')} className={controlClassName}>
              <ChevronUp className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => moveText('down')} className={controlClassName}>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
          <div className="pointer-events-auto grid gap-3">
            <button type="button" onClick={() => moveText('right')} className={controlClassName}>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setTextRotation((prev) => (prev - 45) % 360)}
              className={controlClassName}
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setTextRotation((prev) => (prev + 45) % 360)}
              className={controlClassName}
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 -bottom-3 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-white/92 px-3 py-2 shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
            <span className="min-w-16 text-center text-xs font-semibold text-zinc-500">
              {((textRotation % 360) + 360) % 360}°
            </span>
            <span className="text-xs font-medium text-zinc-400">Pince para ajustar</span>
            <button
              type="button"
              onClick={() => setIsMobileTextEditing(false)}
              className="rounded-full bg-[#dce8db] px-4 py-3 text-xs font-semibold text-[#435446]"
            >
              Concluir
            </button>
          </div>
        </div>
      </>
    );
  };

  const handleStepReset = () => {
    resetArtwork();
  };

  const renderMobileTextModal = () => {
    if (!isMobileTextModalOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/35 px-4">
        <div
          className="flex w-full max-w-[680px] flex-col overflow-hidden rounded-[28px] bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.24)]"
          style={{ maxHeight: `${Math.max(360, viewport.height - 32)}px` }}
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-400">
                Texto
              </p>
              <h3 className="mt-1 text-base font-bold text-zinc-900">Personalize sua frase</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileTextModalOpen(false)}
              className="rounded-full bg-zinc-100 p-2 text-zinc-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="sticky top-0 z-10 rounded-[24px] bg-white pb-3">
            <div className="relative rounded-[24px] border border-zinc-200 bg-zinc-50 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <Type className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
              <textarea
                placeholder="Escreva seu texto..."
                value={customText}
                onChange={handleCustomTextChange}
                maxLength={MAX_CUSTOM_TEXT_LENGTH}
                rows={3}
                className="min-h-[120px] w-full resize-none rounded-2xl border border-transparent bg-transparent py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#435446]/20 focus:ring-2 focus:ring-[#435446]"
                style={{
                  fontFamily: textFont,
                  fontWeight: isBold ? 700 : 400,
                  fontStyle: isItalic ? 'italic' : 'normal',
                  textDecoration: isUnderline ? 'underline' : 'none',
                  color: textColor,
                  letterSpacing: `${letterSpacing}px`,
                  fontSize: `${editorTextareaFontSize}px`,
                  lineHeight: 1.35,
                  textShadow: buildExternalTextShadow(
                    mobileEditorStrokeSize,
                    textStrokeColor
                  ),
                }}
              />
              <div className="mt-2 flex items-center justify-between gap-3 text-[11px] font-medium text-zinc-400">
                <span>Preview ao vivo da fonte e da borda</span>
                <span>{customText.length}/{MAX_CUSTOM_TEXT_LENGTH}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setIsBold((prev) => !prev)}
                className={`flex min-h-10 items-center justify-center rounded-2xl ${
                  isBold ? 'bg-[#435446] text-white' : 'bg-zinc-100 text-zinc-700'
                }`}
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsItalic((prev) => !prev)}
                className={`flex min-h-10 items-center justify-center rounded-2xl ${
                  isItalic ? 'bg-[#435446] text-white' : 'bg-zinc-100 text-zinc-700'
                }`}
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsUnderline((prev) => !prev)}
                className={`flex min-h-10 items-center justify-center rounded-2xl ${
                  isUnderline ? 'bg-[#435446] text-white' : 'bg-zinc-100 text-zinc-700'
                }`}
              >
                <Underline className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-2.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                  Fonte
                </label>
                <select
                  value={textFont}
                  onChange={(e) => setTextFont(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white p-2 text-sm outline-none focus:ring-2 focus:ring-[#435446]"
                >
                  {GOOGLE_FONTS.map((font) => (
                    <option key={font.name} value={font.value} style={{ fontFamily: font.value }}>
                      {font.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-2.5">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                  Tamanho
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTextSize((prev) => Math.max(8, prev - 2))}
                    className="rounded-xl bg-white px-3 py-2 text-zinc-700"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={textSize}
                    onChange={(e) =>
                      setTextSize(Math.max(8, parseInt(e.target.value, 10) || 12))
                    }
                    className="no-spinner min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-2 py-2 text-center text-sm outline-none focus:ring-2 focus:ring-[#435446]"
                  />
                  <button
                    type="button"
                    onClick={() => setTextSize((prev) => Math.min(200, prev + 2))}
                    className="rounded-xl bg-white px-3 py-2 text-zinc-700"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-2.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                    Espaçamento
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLetterSpacing((prev) => Math.max(-2, prev - 0.5))}
                      className="rounded-xl bg-white px-3 py-2 text-xs"
                    >
                      -
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-zinc-700">
                      {letterSpacing}
                    </span>
                    <button
                      type="button"
                      onClick={() => setLetterSpacing((prev) => Math.min(10, prev + 0.5))}
                      className="rounded-xl bg-white px-3 py-2 text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="min-w-[120px] rounded-2xl bg-white px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                    Cor
                  </p>
                  <div className="mt-2 h-10 rounded-xl border border-zinc-200" style={{ backgroundColor: textColor }} />
                </div>
              </div>

              <div className="mt-3">
                <div className="grid grid-cols-6 gap-2">
                  {TEXT_COLOR_PRESETS.map((color) => {
                    const isSelected = textColor.toLowerCase() === color.toLowerCase();

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setTextColor(color)}
                        className={`h-9 w-full rounded-xl border transition-transform ${
                          isSelected ? 'scale-105 border-zinc-900' : 'border-zinc-200'
                        }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Selecionar cor ${color}`}
                      />
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-xl border border-zinc-200 bg-transparent p-1"
                    title="Escolher cor personalizada"
                  />
                  <span className="text-xs font-medium text-zinc-500">Cor personalizada</span>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <div
                    className="h-9 w-9 shrink-0 rounded-xl border border-zinc-200"
                    style={{ backgroundColor: textColor }}
                  />
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:ring-2 focus:ring-[#435446]"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-2.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                    Borda
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTextStroke((prev) => Math.max(0, prev - 1))}
                      className="rounded-xl bg-white px-3 py-2 text-xs"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-sm font-semibold text-zinc-700">
                      {textStroke}px
                    </span>
                    <button
                      type="button"
                      onClick={() => setTextStroke((prev) => Math.min(8, prev + 1))}
                      className="rounded-xl bg-white px-3 py-2 text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="min-w-[120px] rounded-2xl bg-white px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400">
                    Cor da borda
                  </p>
                  <div
                    className="mt-2 h-10 rounded-xl border border-zinc-200"
                    style={{ backgroundColor: textStrokeColor }}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-2">
                <input
                  type="color"
                  value={textStrokeColor}
                  onChange={(e) => setTextStrokeColor(e.target.value)}
                  className="h-10 w-10 cursor-pointer rounded-xl border border-zinc-200 bg-transparent p-1"
                  title="Escolher cor da borda"
                />
                <span className="text-xs font-medium text-zinc-500">Cor personalizada da borda</span>
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <div
                  className="h-9 w-9 shrink-0 rounded-xl border border-zinc-200"
                  style={{ backgroundColor: textStrokeColor }}
                />
                <input
                  type="text"
                  value={textStrokeColor}
                  onChange={(e) => setTextStrokeColor(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:ring-2 focus:ring-[#435446]"
                  placeholder="#000000"
                />
              </div>
              <div className="mt-3 rounded-2xl border border-zinc-200 bg-white px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-zinc-500">Espessura da borda</span>
                  <span className="text-xs font-semibold text-zinc-700">{textStroke}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={textStroke}
                  onChange={(e) => setTextStroke(parseInt(e.target.value, 10))}
                  className="mt-3 w-full"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsMobileTextModalOpen(false);
                setIsMobileTextEditing(Boolean(customText.trim()));
              }}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[22px] bg-[#435446] px-4 text-sm font-semibold text-white"
            >
              <Check className="h-4 w-4" />
              Concluir
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderExportArtwork = () => {
    if (textOnlyMode || !selectedLayout) return null;

    return (
      <div
        style={{
          position: 'absolute',
          top: '3.5%',
          bottom: '3.5%',
          left: `${IMAGE_AREA_HORIZONTAL_INSET * 100}%`,
          right: `${IMAGE_AREA_HORIZONTAL_INSET * 100}%`,
          overflow: 'hidden',
          zIndex: 10,
          backgroundColor: isMultiImageLayout ? artworkBackground : 'transparent',
        }}
      >
        {selectedLayout.slots.map((originalArea, index) => {
          const slot = artworkSlots[index];
          if (!slot.image) return null;
          const area = getAdjustedSlotArea(originalArea, artworkGapPercent);

          const normalizedSlotRotation = ((slot.rotation % 360) + 360) % 360;
          const slotQuarterTurn = normalizedSlotRotation === 90 || normalizedSlotRotation === 270;
          const slotEffectiveRatio = slot.imageRatio
            ? slotQuarterTurn
              ? 1 / slot.imageRatio
              : slot.imageRatio
            : 1;
          const slotAspectRatio = IMAGE_AREA_ASPECT_RATIO * (area.width / area.height);
          const fitToHeight = slotEffectiveRatio >= slotAspectRatio;

          return (
            <div
              key={`export-${selectedLayout.id}-${index}`}
              style={{
                position: 'absolute',
                left: `${area.x}%`,
                top: `${area.y}%`,
                width: `${area.width}%`,
                height: `${area.height}%`,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `translate(${slot.position.x * exportScaleX}px, ${slot.position.y * exportScaleY}px) rotate(${slot.rotation}deg) scale(${(slot.zoom / 100) * (slotQuarterTurn ? 1.95 : 1)})${slot.mirrored ? ' scaleX(-1)' : ''}`,
                  transformOrigin: 'center center',
                }}
              >
                <img
                  src={slot.image}
                  alt={`Arte do cliente ${index + 1}`}
                  crossOrigin="anonymous"
                  style={{
                    ...(containImageOnInitialPlacement
                      ? fitToHeight
                        ? { width: '100%', height: 'auto' }
                        : { height: '100%', width: 'auto' }
                      : fitToHeight
                        ? { height: '100%', width: 'auto' }
                        : { width: '100%', height: 'auto' }),
                    maxWidth: 'none',
                    maxHeight: 'none',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderExportLayers = () => {
    const activeModelLayerCorrection = getResolvedModelPreviewCorrection(
      selectedModel,
      automaticModelCorrection
    );

    return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${EXPORT_WIDTH}px`,
          height: `${EXPORT_HEIGHT}px`,
          transform: 'translateX(-200vw)',
          pointerEvents: 'none',
          overflow: 'hidden',
          opacity: 1,
          zIndex: -1,
        }}
      >
        <div
          ref={exportRef}
          style={{
            position: 'relative',
            width: `${EXPORT_WIDTH}px`,
            height: `${EXPORT_HEIGHT}px`,
            overflow: 'hidden',
            background: 'transparent',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              ...getModelLayerCorrectionStyle(
                selectedModel,
                { width: EXPORT_WIDTH, height: EXPORT_HEIGHT },
                activeModelLayerCorrection
              ),
            }}
          >
            {selectedModel?.col2 && (
              <img
                src={selectedModel.col2}
                crossOrigin="anonymous"
                alt="Base da capinha"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  zIndex: 1,
                }}
              />
            )}

            {renderExportArtwork()}

            {customText && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    transform: `translate(${exportTextPosition.x}px, ${exportTextPosition.y}px) rotate(${textRotation}deg)`,
                    maxWidth: '75%',
                  }}
                >
                  <div style={exportTextRenderStyle}>{customText}</div>
                </div>
              </div>
            )}

            {selectedModel?.col3 && (
              <img
                src={selectedModel.col3}
                crossOrigin="anonymous"
                alt="Mascara"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  zIndex: 30,
                }}
              />
            )}

            {isCaseLogoVisible && (
              <img
                src={PANDA_LOGO_URL}
                crossOrigin="anonymous"
                alt="Logo Panda Cases"
                style={{
                  position: 'absolute',
                  left: `${logoPosition.x}px`,
                  top: `${logoPosition.y}px`,
                  width: `${CASE_LOGO_DESKTOP_POSITION.size}px`,
                  height: `${CASE_LOGO_DESKTOP_POSITION.size}px`,
                  display: 'block',
                  objectFit: 'contain',
                  opacity: 0.9,
                  zIndex: 50,
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${EXPORT_WIDTH}px`,
          height: `${EXPORT_HEIGHT}px`,
          transform: 'translateX(-400vw)',
          pointerEvents: 'none',
          overflow: 'hidden',
          opacity: 1,
          zIndex: -1,
        }}
      >
        <div
          ref={productionRef}
          style={{
            position: 'relative',
            width: `${EXPORT_WIDTH}px`,
            height: `${EXPORT_HEIGHT}px`,
            overflow: 'hidden',
            background: 'transparent',
          }}
        >
          {renderExportArtwork()}

          {customText && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  transform: `translate(${exportTextPosition.x}px, ${exportTextPosition.y}px) rotate(${textRotation}deg)`,
                  maxWidth: '75%',
                }}
              >
                <div style={exportTextRenderStyle}>{customText}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {isMobileLayout ? (
        <div
          className="flex flex-col overflow-hidden bg-[#e7e2d7]"
          style={{ height: `${viewport.height}px`, minHeight: `${viewport.height}px` }}
        >
          <header className="sticky top-0 z-40 border-b border-[#6d7b6b]/15 bg-[#e4ebe1]/95 px-4 py-2 backdrop-blur">
            <div className="mx-auto flex w-full max-w-[680px] items-center justify-between gap-3">
              <div className="flex-1" />
              <div className="flex flex-col items-center justify-center gap-1 text-center">
                <img
                  src="https://res.cloudinary.com/dwexdk5pp/image/upload/v1773958801/logo_pamda_te76in.png"
                  alt="Logo Pamda Cases"
                  className="h-[42px] w-auto"
                />
                <p className="font-lexend text-[8px] font-bold text-[#435446]">
                  Sua capinha, do seu jeito!
                </p>
              </div>
              <div className="flex flex-1 justify-end">{renderBotaoCarrinho(true)}</div>
            </div>
          </header>

          <div className="mx-auto flex h-full w-full max-w-[680px] flex-1 flex-col overflow-hidden px-4 pb-4 pt-4">
            <input
              type="file"
              ref={mobileFileInputRef}
              onChange={handleFileChange}
              accept="image/*,.heic,.heif"
              className="hidden"
            />

            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-400">
                  Etapa {currentStep}/{totalSteps}
                </p>
              </div>
              <div className="mt-1 flex gap-1.5">
                {mobileStepConfig.map((step) => (
                  <span
                    key={step.step}
                    className={`h-2.5 w-2.5 rounded-full ${
                      step.step === currentStep
                        ? 'bg-[#435446]'
                        : step.step < currentStep
                          ? 'bg-[#92a18d]'
                          : 'bg-zinc-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {currentStep === 1 && (
              <>
                <section className="flex flex-1 flex-col justify-center gap-4 overflow-hidden pb-20">
                  {isLoadingModels && (
                    <p className="rounded-2xl bg-white px-4 py-3 text-sm text-zinc-500 shadow-sm">
                      Carregando modelos...
                    </p>
                  )}
                  {!isLoadingModels && modelLoadError && (
                    <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 shadow-sm">
                      {modelLoadError}
                    </p>
                  )}
                  <div className="rounded-[30px] bg-white/90 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                    <div className="grid grid-cols-2 gap-3">
                      {brands.map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => selectBrand(brand, { presetFirstModel: false, advance: true })}
                          className="rounded-[26px] border border-white/80 bg-[#f6f3ee] px-4 py-4 text-left shadow-sm"
                        >
                          <span className="block text-[11px] font-bold uppercase tracking-[0.24em] text-[#435446]">
                            Marca
                          </span>
                          <span className="mt-2 block text-lg font-semibold text-zinc-900">{brand}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setIsBrandSearchMode((prev) => !prev);
                          setIsMobileSearchActive(true);
                        }}
                        className={`rounded-[26px] border px-4 py-4 text-left shadow-sm ${
                          isBrandSearchMode ? 'border-[#435446]/20 bg-[#dfe7dd]' : 'border-white/80 bg-white'
                        }`}
                      >
                        <span className="block text-[11px] font-bold uppercase tracking-[0.24em] text-[#435446]">
                          Busca
                        </span>
                        <span className="mt-2 flex items-center gap-2 text-lg font-semibold text-zinc-900">
                          <Search className="h-4 w-4" />
                          Pesquisar
                        </span>
                      </button>
                    </div>
                  </div>

                  {isBrandSearchMode && (
                    <div className="rounded-[30px] bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="Ex.: ifone 13, samsung a15..."
                          value={mobileBrandSearchQuery}
                          onFocus={() => setIsMobileSearchActive(true)}
                          onBlur={() => window.setTimeout(() => setIsMobileSearchActive(false), 120)}
                          onChange={(e) => setMobileBrandSearchQuery(e.target.value)}
                          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-[#435446]"
                        />
                      </div>
                      {showMobileSuggestions && (
                        <div className="mt-3 space-y-2">
                          {mobileSuggestions.map((model) => (
                            <button
                              key={model.id}
                              type="button"
                              onClick={() => {
                                selectModelForFlow(model, true);
                                setSearchQuery(model.name);
                                setIsMobileSearchActive(false);
                              }}
                              className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left"
                            >
                              <div>
                                <p className="text-sm font-semibold text-zinc-900">{model.name}</p>
                                <p className="text-xs text-zinc-500">{model.brand}</p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-zinc-400" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </section>
                {renderMobileBottomBar({
                  onPrimary: nextStep,
                  primaryLabel: 'Avancar',
                  primaryDisabled: !selectedBrand,
                })}
              </>
            )}

            {currentStep === 2 && (
              <>
                <section
                  className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden"
                  style={{ paddingBottom: `${viewport.height < 720 ? 88 : 96}px` }}
                >
                  <div className="rounded-[30px] bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#435446]">
                      Marca escolhida
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-zinc-900">{selectedBrand}</h3>
                    <div className="relative mt-4">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Buscar modelo dessa marca"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-[#435446]"
                      />
                    </div>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col rounded-[30px] bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                    <div className="grid min-h-0 flex-1 content-start gap-2 overflow-y-auto pr-1 custom-scrollbar" style={{ overscrollBehavior: 'contain' }}>
                      {mobileModelResults.map((model) => {
                        const selected = selectedModel?.id === model.id;
                        return (
                          <button
                            key={model.id}
                            type="button"
                            onClick={() => selectModelForFlow(model)}
                            onDoubleClick={() => selectModelForFlow(model, true)}
                            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left ${
                              selected ? 'border-[#435446]/20 bg-[#435446] text-white' : 'border-zinc-200 bg-white text-zinc-700'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{model.name}</p>
                              <p className={`text-xs ${selected ? 'text-zinc-200' : 'text-zinc-400'}`}>
                                {model.brand}
                              </p>
                            </div>
                            {selected && <Check className="h-4 w-4" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>
                {renderMobileBottomBar({ onPrimary: nextStep, primaryLabel: 'Avancar', primaryDisabled: !selectedModel })}
              </>
            )}

            {currentStep === 3 && (
              <>
                <section
                  className="flex min-h-0 flex-1 flex-col overflow-hidden"
                  style={{ paddingBottom: `${viewport.height < 720 ? 88 : 96}px` }}
                >
                  <div className="flex min-h-0 flex-1 flex-col rounded-[30px] bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                    {renderLayoutSelector(true)}
                  </div>
                </section>
                {renderMobileBottomBar({
                  onPrimary: nextStep,
                  primaryLabel: 'Avancar',
                  primaryDisabled: !selectedLayout,
                })}
              </>
            )}

            {currentStep === 4 && (
              <>
                <section
                  className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-2 pr-1 custom-scrollbar"
                >
                  <div
                    className="flex shrink-0 flex-col rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(240,238,231,0.98)_100%)] shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
                    style={{
                      paddingTop: `${viewport.height < 720 ? 8 : 12}px`,
                      paddingBottom: `${viewport.height < 720 ? 10 : 14}px`,
                      paddingLeft: `${viewport.width < 360 ? 12 : 16}px`,
                      paddingRight: `${viewport.width < 360 ? 12 : 16}px`,
                    }}
                  >
                    <div className="shrink-0 text-center">
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-400">{selectedBrand}</p>
                      <h3 className="mt-1 text-base font-semibold text-zinc-900">{selectedModel?.name}</h3>
                    </div>
                    {renderArtworkSlotSelector(true)}
                    {renderArtworkAppearanceControls(true)}
                    <div
                      className="relative mx-auto mt-2 flex min-h-[300px] w-full max-w-[420px] justify-center"
                      style={{
                        paddingLeft: `${viewport.width < 360 ? 28 : 48}px`,
                        paddingRight: `${viewport.width < 360 ? 28 : 48}px`,
                      }}
                    >
                      {renderPhonePreview(true, true, {
                        imageInteractive: isMobileImageEditing,
                        imageSelectable: true,
                        textInteractive: false,
                        showInlineTextControls: false,
                        allowTextResize: false,
                      })}
                    </div>
                    {aiOutpaintingVisible && needsAiOutpainting && image && !isMobileImageEditing && (
                      <div className="mt-2 shrink-0">
                        <AiOutpaintingSuggestion
                          onGenerate={aiOutpainting.open}
                          onAdjust={openMobileImageEditor}
                          onChooseAnother={() => mobileFileInputRef.current?.click()}
                          compact
                        />
                      </div>
                    )}
                    {renderMobileImageControls()}
                    {(!image || !isMobileImageEditing) && (
                      <div className="mt-2 shrink-0">
                        {!image ? (
                          renderUploadCard(true)
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={openMobileImageEditor}
                              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#6d7b6b]/15 bg-white px-3 py-2 text-sm font-semibold text-[#435446] shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
                            >
                              <Move className="h-4 w-4" />
                              Editar imagem
                            </button>
                            <button
                              type="button"
                              onClick={clearImage}
                              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-100 bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-[0_8px_20px_rgba(15,23,42,0.06)]"
                            >
                              <X className="h-4 w-4" />
                              Remover
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>
                {renderMobileBottomBar({
                  onPrimary: nextStep,
                  primaryLabel: 'Avancar',
                  primaryDisabled: !hasAllLayoutImages,
                  showReset: true,
                  onReset: clearAllImages,
                  resetLabel: 'Limpar',
                })}
              </>
            )}

            {currentStep === 5 && (
              <>
                <section
                  className="flex min-h-0 flex-1 flex-col justify-between overflow-hidden"
                  style={{ paddingBottom: `${viewport.height < 720 ? 88 : 96}px` }}
                >
                  <div
                    className="rounded-[34px] bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(240,238,231,0.98)_100%)] shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
                    style={{
                      paddingTop: `${viewport.height < 720 ? 12 : 16}px`,
                      paddingBottom: `${viewport.height < 720 ? 14 : 20}px`,
                      paddingLeft: `${viewport.width < 360 ? 12 : 16}px`,
                      paddingRight: `${viewport.width < 360 ? 12 : 16}px`,
                    }}
                  >
                    <div className="text-center">
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-400">{selectedBrand}</p>
                      <h3 className="mt-1 text-base font-semibold text-zinc-900">{selectedModel?.name}</h3>
                    </div>
                    <div
                      className="relative mx-auto mt-2 flex w-full max-w-[420px] justify-center"
                      style={{
                        paddingLeft: `${viewport.width < 360 ? 28 : 48}px`,
                        paddingRight: `${viewport.width < 360 ? 28 : 48}px`,
                      }}
                    >
                      {renderPhonePreview(true, true, {
                        imageInteractive: false,
                        textInteractive: isMobileTextEditing,
                        showInlineTextControls: false,
                        allowTextResize: false,
                      })}
                      {renderMobileTextControls()}
                    </div>
                    <button
                      type="button"
                      onClick={openMobileTextEditor}
                      className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-[22px] border border-white/80 bg-white/94 px-4 text-sm font-semibold text-zinc-800 shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition-transform"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e4ebe1] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                        <Type className="h-4 w-4 text-[#435446]" />
                      </span>
                      Texto
                    </button>
                    <div
                      className="mt-2.5 rounded-2xl bg-white/80 px-4 text-center text-sm text-zinc-500"
                      style={{ paddingTop: `${viewport.height < 720 ? 6 : 8}px`, paddingBottom: `${viewport.height < 720 ? 6 : 8}px` }}
                    >
                      {customText.trim() ? 'Ajuste o texto com foco total no preview.' : 'Adicione um texto ou avance sem inserir.'}
                    </div>
                  </div>
                </section>
                {renderMobileBottomBar({
                  onPrimary: nextStep,
                  primaryLabel: 'Avancar',
                  primaryDisabled: !canSubmitCurrentItem,
                  showReset: true,
                  onReset: handleStepReset,
                })}
                {renderMobileTextModal()}
              </>
            )}

            {currentStep === 6 && (
              <>
                <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-20 pr-1 custom-scrollbar">
                  <div className="rounded-[30px] bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-400">Preview final</p>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setIsMobileFullscreenPreviewOpen(true)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setIsMobileFullscreenPreviewOpen(true);
                        }
                      }}
                      className="mt-5 flex w-full justify-center rounded-[26px] bg-[linear-gradient(180deg,#f7f4ef_0%,#ece8df_100%)] p-3"
                    >
                      {renderPhonePreview(true, false)}
                    </div>
                    <p className="mt-3 text-center text-xs font-medium text-zinc-500">
                      Toque na capinha para ver em tela cheia.
                    </p>
                  </div>
                  <div className="shrink-0">
                    {renderOrderSummary()}
                  </div>
                  {orderCompleted && (
                    <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700">
                      Pedido pronto para envio no WhatsApp!
                    </div>
                  )}
                  <label className="flex items-start gap-3 rounded-[22px] border border-[#6d7b6b]/15 bg-white px-4 py-3 text-left shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                    <input
                      type="checkbox"
                      checked={isArtworkApproved}
                      onChange={(e) => setIsArtworkApproved(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-zinc-300 text-[#435446] focus:ring-[#435446]"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-zinc-800">
                        Arte aprovada pelo cliente
                      </span>
                      <span className="mt-1 block text-xs text-zinc-500">
                        Marque esta opcao para liberar a finalizacao do pedido.
                      </span>
                    </span>
                  </label>
              <button
                type="button"
                onClick={adicionarItemAoCarrinho}
                disabled={isUploadingOrder || !canSubmitApprovedItem}
                className="rounded-[22px] bg-[#435446] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(67,84,70,0.2)] transition-colors hover:bg-[#39493b] disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
              >
                Adicionar ao carrinho e fazer outra
                  </button>
                </section>
                {renderMobileBottomBar({
                  onPrimary: handleFinish,
                  primaryLabel: isUploadingOrder ? 'Enviando...' : 'Finalizar pedido',
                  primaryDisabled:
                    isUploadingOrder || !isArtworkApproved || (!carrinho.length && !canFinish),
                })}
                {isMobileFullscreenPreviewOpen && (
                  <div className="fixed inset-0 z-[60] bg-zinc-950/85">
                    <button
                      type="button"
                      onClick={() => setIsMobileFullscreenPreviewOpen(false)}
                      className="absolute right-4 top-4 z-[70] rounded-full bg-white/92 p-3 text-zinc-700 shadow-[0_14px_30px_rgba(15,23,42,0.28)]"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <div
                      ref={mobileInspectViewportRef}
                      className="flex h-full w-full items-center justify-center overflow-hidden px-4 py-8"
                      style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
                    >
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={{
                          transform: `translate(${mobileInspectOffset.x}px, ${mobileInspectOffset.y}px) scale(${mobileInspectScale})`,
                          transformOrigin: 'center center',
                          transition:
                            mobileInspectGestureRef.current.mode === 'none'
                              ? 'transform 180ms ease-out'
                              : 'none',
                          willChange: 'transform',
                        }}
                        onTouchStart={handleMobileInspectTouchStart}
                        onTouchMove={handleMobileInspectTouchMove}
                        onTouchEnd={handleMobileInspectTouchEnd}
                        onTouchCancel={handleMobileInspectTouchEnd}
                      >
                        {renderPhonePreview(true, false, {
                          showInlineTextControls: false,
                          allowTextResize: false,
                          fullscreen: true,
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex min-h-[100dvh] flex-col xl:flex-row">
          <aside className="z-10 flex w-full flex-col overflow-hidden border-b border-zinc-200 bg-bamboo xl:h-[100dvh] xl:w-96 xl:border-b-0 xl:border-r">
            <div className="sticky top-0 z-20 border-b border-zinc-100/50 bg-bamboo/95 px-8 py-1.5 text-center backdrop-blur">
              <div className="mb-1 flex justify-end">{renderBotaoCarrinho()}</div>
              <div className="mb-0">
                <img
                  src="https://res.cloudinary.com/dwexdk5pp/image/upload/v1773958801/logo_pamda_te76in.png"
                  alt="Logo Pamda Cases"
                  className="mx-auto h-auto w-[200px]"
                />
              </div>
              <h2 className="font-lexend text-[15px] font-bold text-zinc-800">
                Sua capinha, do seu jeito!
              </h2>
            </div>

            <div className="flex min-h-0 flex-1 flex-col bg-white/40 backdrop-blur-sm">
              <div className="border-b border-zinc-100/70 px-6 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-400">
                  Etapa {desktopStep}/5
                </p>
                <div className="mt-1.5 flex gap-2">
                  {desktopStepConfig.map((step) => (
                    <span
                      key={step.step}
                      className={`h-2.5 flex-1 rounded-full ${
                        step.step === desktopStep
                          ? 'bg-[#435446]'
                          : step.step < desktopStep
                            ? 'bg-[#92a18d]'
                            : 'bg-zinc-300'
                      }`}
                    />
                  ))}
                </div>
                <h3 className="mt-1 text-base font-bold text-zinc-900">
                  {desktopStepConfig[desktopStep - 1].title}
                </h3>
                <p className="mt-0 text-xs text-zinc-500">
                  {desktopStepConfig[desktopStep - 1].description}
                </p>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden px-6 py-3">
                {renderDesktopSidebarContent()}
              </div>

              {renderDesktopStepFooter()}
            </div>
          </aside>

          <main className="relative flex min-h-[48vh] flex-1 items-center justify-center overflow-hidden bg-zinc-100 p-6 md:p-8 xl:min-h-[100dvh] xl:p-12 min-[1320px]:mr-[clamp(120px,25dvh,270px)]">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
            <aside
              className="fixed bottom-0 right-0 top-0 z-10 hidden h-[100dvh] overflow-hidden border-l border-white/80 bg-white shadow-[-12px_0_32px_rgba(15,23,42,0.1)] min-[1320px]:block"
              style={{
                width: 'clamp(120px, 25dvh, 270px)',
              }}
              aria-label="Banners promocionais"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {DESKTOP_BANNERS[activeDesktopBannerIndex].type === 'video' ? (
                  <motion.video
                    key={DESKTOP_BANNERS[activeDesktopBannerIndex].src}
                    src={DESKTOP_BANNERS[activeDesktopBannerIndex].src}
                    aria-label={DESKTOP_BANNERS[activeDesktopBannerIndex].alt}
                    autoPlay
                    muted
                    loop
                    playsInline
                    initial={{ y: '100%', opacity: 0.65, scale: 1.02 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: '-100%', opacity: 0.55, scale: 1.01 }}
                    transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : (
                  <motion.img
                    key={DESKTOP_BANNERS[activeDesktopBannerIndex].src}
                    src={DESKTOP_BANNERS[activeDesktopBannerIndex].src}
                    alt={DESKTOP_BANNERS[activeDesktopBannerIndex].alt}
                    initial={{ y: '100%', opacity: 0.65, scale: 1.02 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: '-100%', opacity: 0.55, scale: 1.01 }}
                    transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                )}
              </AnimatePresence>
            </aside>
            <div
              className={`relative z-10 grid w-full items-center justify-items-center ${
                desktopStep === 3 && image
                  ? 'max-w-[1240px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-6 min-[1600px]:max-w-[1180px] min-[1600px]:grid-cols-1 min-[1600px]:gap-0'
                  : 'max-w-[1180px] grid-cols-1'
              }`}
            >
              {desktopStep === 3 && image && (
                <div className="flex min-w-0 justify-end min-[1600px]:absolute min-[1600px]:right-[calc(50%+250px)] min-[1600px]:top-1/2 min-[1600px]:-translate-y-1/2">
                  {renderDesktopImageControlsPanel()}
                </div>
              )}
              <div className="flex min-w-0 w-full justify-center justify-self-center">
                {renderPhonePreview(false, desktopStep !== 5, {
                  imageInteractive: desktopStep === 3,
                  textInteractive: desktopStep === 4,
                  showInlineTextControls: desktopStep === 4,
                  allowTextResize: desktopStep === 4,
                })}
              </div>
              {desktopStep === 3 && image && <div className="min-[1600px]:hidden" aria-hidden="true" />}
            </div>
          </main>
        </div>
      )}
      {renderPainelCarrinho()}
      {renderExportLayers()}
      {aiOutpaintingVisible && (
        <AiOutpaintingModal
          controller={aiOutpainting}
          deviceBaseUrl={selectedModel?.col2}
          deviceMaskUrl={selectedModel?.col3}
          slotArea={activeSlotArea}
        />
      )}
    </div>
  );
}

function WelcomeAccess({
  onAccessGranted,
}: {
  onAccessGranted: (access: StoreAccess) => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const whatsappLink = getPamdaWhatsAppUrl(STORE_CODE_REQUEST_WHATSAPP_MESSAGE);

  const handleAccess = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCode = normalizeStoreCode(code);

    if (!normalizedCode) {
      setError('Informe o código da loja.');
      return;
    }

    if (!STORE_CODE_PATTERN.test(normalizedCode)) {
      setError('Informe um codigo numerico de 3 ou 4 digitos.');
      return;
    }

    setIsChecking(true);
    setError('');

    try {
      if (normalizedCode === ADMIN_ACCESS_CODE) {
        onAccessGranted({ code: ADMIN_ACCESS_CODE, name: 'Pamda Cases', isAdmin: true });
        return;
      }

      const result = await requestStoreAccess<{ store: AuthorizedStore | null }>(
        'validate',
        { query: { code: normalizedCode } }
      );

      if (!result.store) {
        setError('Codigo nao autorizado. Confira os dados e tente novamente.');
        return;
      }

      onAccessGranted({
        code: normalizedCode,
        name: result.store.name,
        freight: result.store.freight,
      });
    } catch {
      setError('Nao foi possivel validar o codigo agora. Tente novamente.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#1d2b22] px-5 py-10 font-sans">
      <div
        aria-hidden="true"
        className="login-panda-background absolute -inset-5 bg-cover bg-center"
        style={{ backgroundImage: `url(${loginPandaBackgroundUrl})` }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[#102118]/45" />
      <section className="relative z-10 w-full max-w-md rounded-2xl border border-white/25 bg-[#eff6ef]/90 p-7 shadow-[0_28px_80px_rgba(3,18,10,0.38)] backdrop-blur-xl sm:p-9">
        <img src={PANDA_LOGO_URL} alt="Logo Pamda Cases" className="mx-auto h-auto w-[210px] drop-shadow-sm" />
        <div className="mt-6 text-center">
          <h1 className="text-2xl font-bold text-[#20382a]">OLÁ!</h1>
          <p className="mt-2 text-sm leading-6 text-[#526459]">
            Bem-vindo(a) à Pamda Cases. Informe o código de identificação da sua loja para acessar o criador de capinhas.
          </p>
        </div>
        <form onSubmit={handleAccess} className="mt-7">
          <label htmlFor="store-code" className="text-xs font-bold uppercase text-[#435446]">
            Codigo da loja
          </label>
          <input
            id="store-code"
            type="password"
            value={code}
            onChange={(event) => setCode(sanitizeStoreCodeInput(event.target.value))}
            autoComplete="new-password"
            autoFocus
            inputMode="numeric"
            maxLength={4}
            pattern="\d{3,4}"
            placeholder="Digite seu codigo"
            className="mt-2 w-full rounded-lg border border-[#a8b7a9] bg-white/80 px-4 py-3 text-base text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-[#435446] focus:bg-white focus:ring-2 focus:ring-[#435446]/25"
          />
          {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isChecking}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#435446] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(67,84,70,0.24)] transition hover:bg-[#354638] focus:outline-none focus:ring-2 focus:ring-[#435446]/35 focus:ring-offset-2 disabled:cursor-wait disabled:bg-zinc-400"
          >
            {isChecking ? 'Validando...' : 'Acessar'}
            {!isChecking && <ChevronRight className="h-4 w-4" />}
          </button>
        </form>
        <div className="mt-5 space-y-4 text-sm text-[#435446]">
          <p>
            Ainda não sabe o código da sua loja?{' '}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#174d36] underline"
            >
              Clique aqui
            </a>{' '}
            e solicite ao nosso atendente.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-[#25d366] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(37,211,102,0.28)] transition hover:bg-[#1ebe5c]"
            >
              WhatsApp Pamda
            </a>
            <a
              href="https://youtu.be/czLGTiuwH5w"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-[#435446] bg-white px-4 py-3 text-sm font-semibold text-[#435446] shadow-sm transition hover:bg-[#f5f8f4]"
            >
              Assista o Tutorial
            </a>
          </div>
        </div>
      </section>
      <button
        type="button"
        onClick={() => window.open(whatsappLink, '_blank')}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center justify-center rounded-full bg-[#25d366] px-4 py-3 text-sm font-bold text-white shadow-[0_16px_36px_rgba(37,211,102,0.24)] transition hover:bg-[#1ebe5c]"
      >
        WhatsApp Pamda
      </button>
    </main>
  );
}

function AdminPanel({
  onOpenEditor,
  onLogout,
}: {
  onOpenEditor: () => void;
  onLogout: () => void;
}) {
  const [stores, setStores] = useState<AuthorizedStore[]>([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadStores = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await requestStoreAccess<{ stores: AuthorizedStore[] }>('list', {
        query: { adminCode: ADMIN_ACCESS_CODE },
      });
      const nextStores = result.stores
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      setStores(nextStores);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Nao foi possivel carregar as lojas cadastradas.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadStores();
  }, []);

  const handleSaveStore = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedCode = normalizeStoreCode(code);
    const normalizedName = name.trim();

    if (!STORE_CODE_PATTERN.test(normalizedCode)) {
      setError('Use um codigo numerico de 3 ou 4 digitos.');
      return;
    }

    if (normalizedCode === ADMIN_ACCESS_CODE) {
      setError('O codigo 1806 e reservado para administracao.');
      return;
    }

    if (!normalizedName) {
      setError('Informe o nome da loja.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await requestStoreAccess('save', {
        method: 'POST',
        body: { code: normalizedCode, name: normalizedName, adminCode: ADMIN_ACCESS_CODE },
      });
      setCode('');
      setName('');
      await loadStores();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : 'Nao foi possivel salvar a loja.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStore = async (store: AuthorizedStore) => {
    if (!window.confirm(`Remover o acesso da loja "${store.name}"?`)) return;

    try {
      await requestStoreAccess('delete', {
        method: 'POST',
        body: { code: store.code, adminCode: ADMIN_ACCESS_CODE },
      });
      await loadStores();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Nao foi possivel remover a loja.'
      );
    }
  };

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 font-sans sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-5">
          <div>
            <p className="text-xs font-bold uppercase text-[#435446]">Pamda Cases</p>
            <h1 className="mt-1 text-2xl font-bold text-zinc-900">Lojas autorizadas</h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onOpenEditor}
              className="flex items-center gap-2 rounded-lg bg-[#435446] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#39493b]"
            >
              <Store className="h-4 w-4" />
              Abrir editor
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </header>

        <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-zinc-900">Cadastrar loja</h2>
          <form onSubmit={handleSaveStore} className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr_auto]">
            <input
              value={code}
              onChange={(event) => setCode(sanitizeStoreCodeInput(event.target.value))}
              inputMode="numeric"
              maxLength={4}
              pattern="\d{3,4}"
              placeholder="Codigo"
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-[#435446]"
            />
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nome da loja"
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-[#435446]"
            />
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#435446] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#39493b] disabled:bg-zinc-400"
            >
              <Plus className="h-4 w-4" />
              {isSaving ? 'Salvando...' : 'Cadastrar'}
            </button>
          </form>
          {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
        </section>

        <section className="mt-5 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-base font-bold text-zinc-900">Codigos cadastrados</h2>
          </div>
          {isLoading ? (
            <p className="px-5 py-6 text-sm text-zinc-500">Carregando lojas...</p>
          ) : stores.length === 0 ? (
            <p className="px-5 py-6 text-sm text-zinc-500">Nenhuma loja cadastrada.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {stores.map((store) => (
                <div key={store.code} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-semibold text-zinc-900">{store.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">Codigo: {store.code}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Frete: {store.freight || 'Nao informado'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteStore(store)}
                    aria-label={`Remover ${store.name}`}
                    title="Remover acesso"
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function App() {
  const [storeAccess, setStoreAccess] = useState<StoreAccess | null>(() => getStoredStoreAccess());
  const [isAdminEditorOpen, setIsAdminEditorOpen] = useState(true);

  useEffect(() => {
    if (!storeAccess || storeAccess.isAdmin) return;

    const refreshStoreAccess = async () => {
      try {
        const result = await requestStoreAccess<{ store: AuthorizedStore | null }>(
          'validate',
          { query: { code: storeAccess.code } }
        );
        if (!result.store) return;

        const refreshedAccess: StoreAccess = {
          code: result.store.code,
          name: result.store.name,
          freight: result.store.freight,
        };
        window.localStorage.setItem(STORE_ACCESS_STORAGE_KEY, JSON.stringify(refreshedAccess));
        setStoreAccess(refreshedAccess);
      } catch {
        // Keep the cached access available when the sheet cannot be reached.
      }
    };

    void refreshStoreAccess();
  }, [storeAccess?.code]);

  const handleAccessGranted = (access: StoreAccess) => {
    window.localStorage.setItem(STORE_ACCESS_STORAGE_KEY, JSON.stringify(access));
    setStoreAccess(access);
  };

  const handleLogout = () => {
    window.localStorage.removeItem(STORE_ACCESS_STORAGE_KEY);
    setStoreAccess(null);
    setIsAdminEditorOpen(false);
  };

  if (!storeAccess) {
    return <WelcomeAccess onAccessGranted={handleAccessGranted} />;
  }

  if (storeAccess.isAdmin && !isAdminEditorOpen) {
    return <AdminPanel onOpenEditor={() => setIsAdminEditorOpen(true)} onLogout={handleLogout} />;
  }

  if (typeof window !== 'undefined' && window.location.pathname === '/catalogo-pamda') {
    return (
      <Suspense fallback={<main className="min-h-screen bg-zinc-100" />}>
        <TesteCatalogo />
      </Suspense>
    );
  }

  return (
    <>
      <MainApp storeAccess={storeAccess} />
      {storeAccess.isAdmin && (
        <button
          type="button"
          onClick={() => setIsAdminEditorOpen(false)}
          aria-label="Administrar lojas"
          title="Administrar lojas"
          className="fixed bottom-4 right-4 z-[100] rounded-full border border-[#435446]/15 bg-white/80 p-2.5 text-[#435446] shadow-sm backdrop-blur transition hover:bg-white"
        >
          <Store className="h-4 w-4" />
        </button>
      )}
    </>
  );
}
