/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import html2canvas from 'html2canvas-pro';
import heic2any from 'heic2any';
import './image.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  X,
  Download,
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
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { PhoneModel } from './constants';
import { CatalogoImagens } from './components/CatalogoImagens';
import { listarCatalogoStorage } from './lib/catalogoStorage';
import TesteCatalogo from './pages/TesteCatalogo';

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
const IMAGE_AREA_HORIZONTAL_INSET = 0.08;
const IMAGE_AREA_VERTICAL_INSET = 0.035;
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
const PENDING_PREVIEW_ASSET_STORAGE_KEY = 'pamda:pending-preview-asset';
const SUPABASE_MODELOS_ENDPOINT = 'modelos_capinhas?select=*';

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

type SupabaseCaseModel = {
  id: number;
  modelo: string;
  urlcorpo: string;
  urlmascara: string;
};

function MainApp() {
  const [image, setImage] = useState<string | null>(null);
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
  const [imageRatio, setImageRatio] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragLimits, setDragLimits] = useState({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  });

  const [isUploadingOrder, setIsUploadingOrder] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [phoneModels, setPhoneModels] = useState<PhoneModel[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<PhoneModel | null>(null);
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
  const mobileInspectViewportRef = useRef<HTMLDivElement>(null);
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
  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));
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
  const shouldFitImageToHeight = effectiveRatio >= IMAGE_AREA_ASPECT_RATIO;
  const activeZoom = zoom;

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

  const inferBrandFromModelName = (modelName: string) => {
    const normalized = modelName.trim().toLowerCase();

    if (normalized.startsWith('iphone')) return 'APPLE';
    if (
      normalized.startsWith('galaxy') ||
      normalized.startsWith('sm-') ||
      normalized.includes(' samsung')
    ) {
      return 'SAMSUNG';
    }
    if (
      normalized.startsWith('moto') ||
      normalized.startsWith('edge') ||
      normalized.includes('motorola')
    ) {
      return 'MOTOROLA';
    }
    if (
      normalized.startsWith('redmi') ||
      normalized.startsWith('poco') ||
      normalized.startsWith('mi ') ||
      normalized.startsWith('xiaomi')
    ) {
      return 'XIAOMI';
    }
    if (normalized.startsWith('realme')) return 'REALME';

    return 'OUTROS';
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
    async function loadModelsFromSupabase() {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Credenciais do Supabase ausentes.');
        }

        const response = await fetch(
          `${supabaseUrl}/rest/v1/${SUPABASE_MODELOS_ENDPOINT}`,
          {
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Nao foi possivel carregar os modelos das capinhas.');
        }

        const rows = (await response.json()) as SupabaseCaseModel[];
        const allModels: PhoneModel[] = rows
          .filter((row) => row?.modelo && row?.urlcorpo && row?.urlmascara)
          .map((row) => {
            const brand = inferBrandFromModelName(row.modelo);

            return {
              id: `${brand}-${row.id}-${row.modelo}`
                .toLowerCase()
                .replace(/\s+/g, '-'),
              name: row.modelo.trim(),
              brand,
              col2: getDirectImageUrl(row.urlcorpo),
              col3: getDirectImageUrl(row.urlmascara),
              color: '#1a1a1a',
              cameraLayout: inferCameraLayoutFromModelName(row.modelo),
              hasLogo: brand === 'APPLE',
            };
          });

        setPhoneModels(allModels);

        if (allModels.length > 0) {
          const firstBrand = allModels[0].brand;
          const firstModel =
            allModels.find((model) => model.brand === firstBrand) ?? allModels[0];

          setSelectedBrand(firstBrand);
          setSelectedModel(firstModel);
        } else {
          setSelectedBrand('');
          setSelectedModel(null);
        }
      } catch {
        setPhoneModels([]);
        setSelectedBrand('');
        setSelectedModel(null);
      }
    }

    loadModelsFromSupabase();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const visualViewport = window.visualViewport;
      const nextViewport = {
        width: Math.round(visualViewport?.width ?? window.innerWidth),
        height: Math.round(visualViewport?.height ?? window.innerHeight),
      };
      const isCoarsePointer =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(pointer: coarse)').matches;

      setViewport(nextViewport);
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
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect?.width || !rect?.height) return;

      setPreviewRenderSize({
        width: rect.width,
        height: rect.height,
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
  }, [currentStep, customText, image, isMobileLayout, selectedModel?.id]);

  useEffect(() => {
    if (!isMobileLayout || (currentStep !== 3 && currentStep !== 4)) return;
    if (!previewRenderSize.width || !previewRenderSize.height) return;

    setMobileEditorReferenceSize(previewRenderSize);
  }, [currentStep, isMobileLayout, previewRenderSize]);

  useEffect(() => {
    if (!imageAreaRef.current || !image || !effectiveRatio) return;

    const updateLimits = () => {
      const areaRect = imageAreaRef.current?.getBoundingClientRect();
      if (!areaRect) return;

      const areaWidth = areaRect.width;
      const areaHeight = areaRect.height;

      let fittedWidth = 0;
      let fittedHeight = 0;

      if (shouldFitImageToHeight) {
        fittedHeight = areaHeight;
        fittedWidth = areaHeight * effectiveRatio;
      } else {
        fittedWidth = areaWidth;
        fittedHeight = areaWidth / effectiveRatio;
      }

      const scaleMultiplier = (activeZoom / 100) * (isQuarterTurn ? 1.02 : 1);
      const finalWidth = fittedWidth * scaleMultiplier;
      const finalHeight = fittedHeight * scaleMultiplier;

      const overflowX = Math.max(0, (finalWidth - areaWidth) / 2);
      const overflowY = Math.max(0, (finalHeight - areaHeight) / 2);

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
  }, [activeZoom, effectiveRatio, image, isQuarterTurn, selectedModel?.id, shouldFitImageToHeight]);

  useEffect(() => {
    if (!image && (currentStep === 3 || currentStep === 4)) {
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

  const loadFile = async (file: File) => {
    const previewFile = await preparePreviewFile(file);
    setOriginalFile(file);
    setSelectedCatalogAssetId(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;

      const img = new Image();
      img.onload = () => {
        setImageRatio(img.width / img.height);
      };

      img.src = imageData;
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
      setPosition({ x: 0, y: 0 });
      setZoom(100);
      setImageRotation(0);
      setIsMirrored(false);
      setImageResetKey((prev) => prev + 1);

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

    try {
      const pendingAsset = JSON.parse(pendingAssetRaw) as CatalogImageAsset;

      if (!pendingAsset?.url) {
        return;
      }

      setCurrentStep(3);
      setDesktopStep(2);
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
    clearImage();
    clearText();
    setSkipTextStep(false);
    resetTransform();
    setIsMobileImageEditing(false);
  };

  const clearImage = () => {
    setImage(null);
    setOriginalFile(null);
    setSelectedCatalogAssetId(null);
    setImageRatio(null);
    setPosition({ x: 0, y: 0 });
    setZoom(100);
    setImageRotation(0);
    setIsMirrored(false);
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

  const unitPrice = 25.0;
  const totalPrice = unitPrice * quantity;
  const quantidadeItensCarrinho = useMemo(
    () => carrinho.reduce((total, item) => total + item.quantidade, 0),
    [carrinho]
  );

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

    if (!image && !customText.trim()) {
      alert('Envie uma imagem ou adicione um texto para personalizar.');
      return false;
    }

    return true;
  };

  const gerarResumoItemAtual = () => {
    const partes: string[] = [];

    partes.push(customText.trim() ? `Texto: ${customText.trim()}` : 'Sem texto');
    partes.push(image ? 'Com imagem personalizada' : 'Sem imagem');

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
      temImagem: Boolean(image),
      modoSomenteTexto: textOnlyMode,
    };
  };

  const resetarEditorParaNovoItem = () => {
    clearImage();
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
    const totalGeral = itens.reduce(
      (total, item) => total + item.quantidade * unitPrice,
      0
    );

    const itensFormatados = itens
      .map((item, index) => {
        const linhas = [
          `*Item ${index + 1}*`,
          `- Marca: ${item.marca}`,
          `- Modelo: ${item.modelo}`,
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

    return `*Pedido de Capinhas Personalizadas - Pamda Cases*\n\n${itensFormatados}\n\n*Resumo*\n- Total de modelos: ${itens.length}\n- Total de unidades: ${totalQuantidade}\n- Valor estimado: R$ ${totalGeral.toFixed(2)}`;
  };

  const finalizarPedidoCarrinho = async () => {
    const temItemAtual = Boolean(selectedModel && (image || customText.trim()));

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
      const whatsappUrl = `https://wa.me/5541933003156?text=${encodeURIComponent(
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

      const whatsappUrl = `https://wa.me/5541933003156?text=${encodeURIComponent(
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
  const exportImagePosition = {
    x: position.x * exportScaleX,
    y: position.y * exportScaleY,
  };
  const editorTextareaFontSize = getEditorTextareaFontSize(customText, textSize);
  const mobileEditorStrokeSize = getScaledStroke(editorTextareaFontSize);
  const canFinish = Boolean(selectedModel && (image || customText.trim()));
  const canSubmitCurrentItem = canFinish;
  const canSubmitApprovedItem = canSubmitCurrentItem && isArtworkApproved;
  const totalSteps = 5;

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
    { step: 3, title: 'Imagem', description: 'Envie uma foto ou escolha uma imagem do catalogo.' },
    { step: 4, title: 'Texto', description: 'Edite o texto ou siga sem inserir.' },
    { step: 5, title: 'Confirmacao', description: 'Revise o pedido e finalize.' },
  ] as const;

  const currentStepMeta =
    mobileStepConfig.find((item) => item.step === currentStep) ?? mobileStepConfig[0];

  const canProceedFromStep = () => {
    if (currentStep === 1) return Boolean(selectedBrand);
    if (currentStep === 2) return Boolean(selectedModel);
    if (currentStep === 3) return Boolean(image);
    if (currentStep === 4) return canSubmitCurrentItem;
    return canSubmitCurrentItem;
  };

  const nextStep = () => {
    if (!canProceedFromStep()) return;
    if (currentStep === 3 || currentStep === 4) {
      lockMobileEditorTransforms();
    }

    setCurrentStep((prev) => Math.min(totalSteps, prev + 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const returnToMobileEditor = () => {
    setCurrentStep(3);

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

  const renderCaseLogo = (frameDimensions = { width: EXPORT_WIDTH, height: EXPORT_HEIGHT }) => {
    const frameScaleX = frameDimensions.width / EXPORT_WIDTH;
    const frameScaleY = frameDimensions.height / EXPORT_HEIGHT;

    const logoStyle: React.CSSProperties = {
      position: 'absolute',
      top: `${CASE_LOGO_DESKTOP_POSITION.top * frameScaleY}px`,
      right: `${CASE_LOGO_DESKTOP_POSITION.right * frameScaleX}px`,
      width: `${CASE_LOGO_DESKTOP_POSITION.size * frameScaleX}px`,
      height: `${CASE_LOGO_DESKTOP_POSITION.size * frameScaleY}px`,
      zIndex: 50,
      opacity: 0.9,
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    };

    return (
      <div style={logoStyle}>
        <img
          src={PANDA_LOGO_URL}
          crossOrigin="anonymous"
          alt="Logo Panda Cases"
          className="h-full w-full object-contain"
          draggable={false}
        />
      </div>
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
        {filteredModels.map((model) => {
          const selected = selectedModel?.id === model.id;

          return (
            <button
              key={model.id}
              onClick={() => {
                setSelectedBrand(model.brand);
                setSelectedModel(model);
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
              ? `rounded-[28px] p-6 ${
                  isDragging
                    ? 'border-zinc-900 bg-zinc-100'
                    : 'border-zinc-300 bg-white hover:border-zinc-400'
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
            className={`mx-auto flex items-center justify-center rounded-full bg-zinc-100 ${
              mobile
                ? 'h-14 w-14'
                : roomy
                  ? 'h-12 w-12 transition-transform group-hover:scale-110'
                  : 'h-7 w-7 transition-transform group-hover:scale-110'
            }`}
          >
            <Upload className={`${mobile ? 'h-6 w-6 text-zinc-700' : roomy ? 'h-5 w-5 text-zinc-500' : 'h-4 w-4 text-zinc-500'}`} />
          </div>

          <div className={mobile ? 'mt-4' : ''}>
            <p className={`${mobile ? 'text-base' : roomy ? 'text-sm' : 'text-xs'} font-medium text-zinc-700`}>
              {mobile ? 'Toque para enviar sua imagem' : 'Carregar Foto'}
            </p>
            <p className={`${mobile ? 'mt-1 text-sm' : roomy ? 'mt-1 text-xs' : 'text-[11px]'} text-zinc-400`}>
              {mobile
                ? 'PNG ou JPG. Depois disso abrimos os ajustes automaticamente.'
                : 'PNG, JPG ate 10MB'}
            </p>
          </div>
        </div>

        {showCatalog && renderCatalogImageSearch(mobile)}
      </div>
    );
  };

  const getPreviewFrameDimensions = (
    mobile = false,
    options?: { fullscreen?: boolean }
  ) => {
    if (mobile) {
      const fullscreen = options?.fullscreen ?? false;
      if (fullscreen) {
        const horizontalPadding = clamp(viewport.width * 0.04, 10, 24);
        const verticalPadding = clamp(viewport.height * 0.05, 28, 56);
        const maxWidth = Math.max(240, viewport.width - horizontalPadding * 2);
        const maxHeight = Math.max(320, viewport.height - verticalPadding * 2);
        const width = Math.min(maxWidth, maxHeight * PREVIEW_ASPECT_RATIO);

        return {
          width,
          height: width / PREVIEW_ASPECT_RATIO,
        };
      }

      const horizontalPadding = clamp(viewport.width * 0.12, 24, 52);
      const maxWidthFromViewport = Math.max(190, viewport.width - horizontalPadding * 2);
      const isLargeMobilePreviewStep = currentStep === 5;
      const reservedHeight =
        MOBILE_HEADER_ESTIMATED_HEIGHT +
        MOBILE_STEP_PROGRESS_ESTIMATED_HEIGHT +
        MOBILE_BOTTOM_BAR_ESTIMATED_HEIGHT +
        (currentStep === 3 || currentStep === 4 ? 250 : currentStep === 5 ? 210 : 180);
      const maxHeight = Math.max(220, viewport.height - reservedHeight);
      const width = Math.min(
        clamp(
          viewport.width * (isLargeMobilePreviewStep ? 0.7 : 0.58),
          isLargeMobilePreviewStep ? 220 : 190,
          isLargeMobilePreviewStep ? 300 : 236
        ),
        maxWidthFromViewport,
        maxHeight * PREVIEW_ASPECT_RATIO
      );

      return {
        width,
        height: width / PREVIEW_ASPECT_RATIO,
      };
    }

    const maxWidthFromViewport = Math.max(320, viewport.width * 0.34);
    const maxHeight = Math.max(520, viewport.height - 220);
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

  const renderPhonePreview = (
    mobile = false,
    interactive = true,
    options?: {
      imageInteractive?: boolean;
      textInteractive?: boolean;
      showInlineTextControls?: boolean;
      allowTextResize?: boolean;
      fullscreen?: boolean;
    }
  ) => {
    const imageInteractive = options?.imageInteractive ?? interactive;
    const textInteractive = options?.textInteractive ?? interactive;
    const showInlineTextControls = options?.showInlineTextControls ?? textInteractive;
    const allowTextResize = options?.allowTextResize ?? textInteractive;
    const isFullscreen = options?.fullscreen ?? false;
    const mobileFrameRadius = clamp(viewport.width * 0.075, 24, 34);
    const previewFrameDimensions = getPreviewFrameDimensions(mobile, {
      fullscreen: isFullscreen,
    });
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
    return (
      <div className="relative">
      <motion.div>
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
          {selectedModel?.col2 && (
            <img
              src={selectedModel.col2}
              className="absolute top-0 left-0 h-full w-full object-fill"
              style={{ zIndex: 1 }}
            />
          )}

          {!textOnlyMode && image && (
            <div
              ref={imageAreaRef}
              className="absolute overflow-hidden"
              style={{
                top: '3.5%',
                bottom: '3.5%',
                left: '8%',
                right: '8%',
                zIndex: 10,
              }}
            >
              <motion.div
                key={`image-transform-${imageResetKey}`}
                drag={imageInteractive}
                dragConstraints={dragLimits}
                dragElastic={0}
                dragMomentum={false}
                onDragEnd={(_, info) => {
                  if (!imageInteractive) return;
                  setPosition((prev) => {
                    const nextX = prev.x + info.offset.x;
                    const nextY = prev.y + info.offset.y;

                    return {
                      x: Math.max(dragLimits.left, Math.min(dragLimits.right, nextX)),
                      y: Math.max(dragLimits.top, Math.min(dragLimits.bottom, nextY)),
                    };
                  });
                }}
                style={{
                  x: scaledImagePosition.x,
                  y: scaledImagePosition.y,
                  scale: (activeZoom / 100) * (isQuarterTurn ? 1.95 : 1),
                  rotate: imageRotation,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={image}
                  crossOrigin="anonymous"
                  draggable={false}
                  style={{
                    transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)',
                  }}
                  className={`pointer-events-none select-none ${
                    shouldFitImageToHeight
                      ? 'h-full w-auto'
                      : 'h-auto w-full'
                  } max-h-none max-w-none`}
                />
              </motion.div>
            </div>
          )}

          {customText && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              {textInteractive && textCenterGuide.vertical && (
                <div className="pointer-events-none absolute inset-y-[12%] left-1/2 w-px -translate-x-1/2 bg-[#435446]/30" />
              )}
              {textInteractive && textCenterGuide.horizontal && (
                <div className="pointer-events-none absolute inset-x-[12%] top-1/2 h-px -translate-y-1/2 bg-[#435446]/30" />
              )}
              <motion.div
                key={`text-transform-${textResetKey}`}
                drag={textInteractive}
                dragElastic={0}
                dragMomentum={false}
                dragTransition={{ power: 0, timeConstant: 0 }}
                onDragStart={() => {
                  textDragStartPositionRef.current = textPosition;
                  updateTextCenterGuide(textPosition);
                }}
                onDrag={(_, info) => {
                  if (!textInteractive) return;
                  const scale = Math.max(textMovementScale, 0.01);
                  updateTextCenterGuide({
                    x: textDragStartPositionRef.current.x + info.offset.x / scale,
                    y: textDragStartPositionRef.current.y + info.offset.y / scale,
                  });
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
                    x: textDragStartPositionRef.current.x + info.offset.x / scale,
                    y: textDragStartPositionRef.current.y + info.offset.y / scale,
                  });
                  setTextPosition(snapped);
                  updateTextCenterGuide(snapped);
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
                        const delta = info.delta.x + info.delta.y;
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

          {renderCaseLogo(previewFrameDimensions)}
        </div>
      </motion.div>

      {!mobile && (
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center">
          <p className="text-sm font-bold text-zinc-900">
            {selectedModel?.name || 'Selecione um modelo'}
          </p>
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            {selectedBrand || 'Sem marca'}
          </p>
        </div>
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

  const renderOrderSummary = () => (
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

      <div className="mt-3 space-y-1 border-t border-zinc-100 pt-3 text-sm">
        <p className="flex justify-between text-zinc-600">
          <span>Valor unitario</span>
          <strong>R$ {unitPrice.toFixed(2)}</strong>
        </p>
        <p className="flex justify-between text-base font-bold text-zinc-800">
          <span>Total</span>
          <span>R$ {totalPrice.toFixed(2)}</span>
        </p>
      </div>
    </div>
  );

  const desktopStepConfig = [
    { step: 1, title: 'Modelo', description: 'Escolha o aparelho da capinha.' },
    { step: 2, title: 'Imagem', description: 'Envie uma foto ou escolha uma imagem do catalogo.' },
    { step: 3, title: 'Texto', description: 'Edite o texto ou marque que nao vai inserir.' },
    { step: 4, title: 'Resumo', description: 'Revise, adicione ao carrinho ou finalize.' },
  ] as const;

  const canAdvanceDesktopStep1 = Boolean(selectedModel);
  const canAdvanceDesktopStep2 = Boolean(image);
  const canAdvanceDesktopStep3 = skipTextStep || Boolean(customText.trim());

  const goToNextDesktopStep = () => {
    if (desktopStep === 1 && !canAdvanceDesktopStep1) return;
    if (desktopStep === 2 && !canAdvanceDesktopStep2) return;
    if (desktopStep === 3 && !canAdvanceDesktopStep3) return;
    setDesktopStep((prev) => Math.min(4, prev + 1));
  };

  const goToPrevDesktopStep = () => {
    setDesktopStep((prev) => Math.max(1, prev - 1));
  };

  const renderDesktopImageControlsPanel = () => {
    if (!image) return null;

    return (
      <div className="w-full max-w-[320px] shrink-0 rounded-[32px] border border-[#6d7b6b]/15 bg-[#e4ebe1] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
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
                onClick={() => setZoom(Math.max(100, zoom - 10))}
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
            min="100"
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
                onClick={() => {
                  setPosition({ x: 0, y: 0 });
                  setZoom(100);
                  setImageResetKey((prev) => prev + 1);
                }}
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
      return (
        <div className="flex h-full min-h-0 flex-col">
          <section className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-zinc-200/70 bg-white/72 p-4 shadow-[0_18px_44px_rgba(15,23,42,0.08)]">
            <label className="mb-5 block text-sm font-bold uppercase tracking-wider text-zinc-400">
              Sua imagem
            </label>
            <div className="flex min-h-0 flex-1 flex-col">
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
                disabled={!image && !customText.trim()}
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

    if (desktopStep === 3) {
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
      <div className="flex h-full min-h-0 flex-col">
        {renderOrderSummary()}
        <div className="mt-auto space-y-2.5 pt-3">
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
        {desktopStep < 4 ? (
          <button
            type="button"
            onClick={goToNextDesktopStep}
            disabled={
              desktopStep === 1
                ? !canAdvanceDesktopStep1
                : desktopStep === 2
                  ? !canAdvanceDesktopStep2
                  : !canAdvanceDesktopStep3
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
                <strong className="text-zinc-800">{quantidadeItensCarrinho}</strong>
              </div>
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-zinc-500">Valor estimado</span>
                <strong className="text-zinc-800">
                  R$ {(quantidadeItensCarrinho * unitPrice).toFixed(2)}
                </strong>
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
      'flex h-12 w-12 items-center justify-center rounded-full border border-[#5f6e5b]/20 bg-[#435446] text-white shadow-[0_14px_30px_rgba(67,84,70,0.22)]';

    return (
      <>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
          <div className="pointer-events-auto grid gap-3">
            <button type="button" onClick={() => moveImage('left')} className={controlClassName}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => moveImage('up')} className={controlClassName}>
              <ChevronUp className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => moveImage('down')} className={controlClassName}>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
          <div className="pointer-events-auto grid gap-3">
            <button
              type="button"
              onClick={() => moveImage('right')}
              className={controlClassName}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setImageRotation((prev) => (prev + 90) % 360)}
              className={controlClassName}
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsMirrored((prev) => !prev)}
              className={controlClassName}
            >
              <FlipHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 -bottom-3 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-[#e4ebe1]/95 px-3 py-2 shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
            <button
              type="button"
              onClick={() => setZoom(Math.max(100, zoom - 10))}
              className={controlClassName}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-14 text-center text-xs font-semibold text-zinc-500">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => setZoom(Math.min(300, zoom + 10))}
              className={controlClassName}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsMobileImageEditing(false)}
              className="rounded-full bg-[#dce8db] px-4 py-3 text-xs font-semibold text-[#435446]"
            >
              Concluir
            </button>
          </div>
        </div>
      </>
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

  const renderExportLayers = () => (
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

          {!textOnlyMode && image && (
            <div
              style={{
                position: 'absolute',
                top: '3.5%',
                bottom: '3.5%',
                left: '8%',
                right: '8%',
                overflow: 'hidden',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `translate(${exportImagePosition.x}px, ${exportImagePosition.y}px) rotate(${imageRotation}deg) scale(${(activeZoom / 100) * (isQuarterTurn ? 1.95 : 1)})${isMirrored ? ' scaleX(-1)' : ''}`,
                  transformOrigin: 'center center',
                }}
              >
                <img
                  src={image}
                  alt="Arte do cliente"
                  crossOrigin="anonymous"
                  style={{
                    ...(shouldFitImageToHeight
                      ? { height: '100%', width: 'auto' }
                      : { width: '100%', height: 'auto' }),
                    maxWidth: 'none',
                    maxHeight: 'none',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          )}

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
          {!textOnlyMode && image && (
            <div
              style={{
                position: 'absolute',
                top: '3.5%',
                bottom: '3.5%',
                left: '8%',
                right: '8%',
                overflow: 'hidden',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `translate(${exportImagePosition.x}px, ${exportImagePosition.y}px) rotate(${imageRotation}deg) scale(${(activeZoom / 100) * (isQuarterTurn ? 1.95 : 1)})${isMirrored ? ' scaleX(-1)' : ''}`,
                  transformOrigin: 'center center',
                }}
              >
                <img
                  src={image}
                  alt="Arte do cliente"
                  crossOrigin="anonymous"
                  style={{
                    ...(shouldFitImageToHeight
                      ? { height: '100%', width: 'auto' }
                      : { width: '100%', height: 'auto' }),
                    maxWidth: 'none',
                    maxHeight: 'none',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          )}

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
                        imageInteractive: isMobileImageEditing,
                        textInteractive: false,
                        showInlineTextControls: false,
                        allowTextResize: false,
                      })}
                      {renderMobileImageControls()}
                    </div>
                    <div className="mt-3">
                      {renderUploadCard(true)}
                    </div>
                    {image && (
                      <button type="button" onClick={clearImage} className="mx-auto mt-2.5 flex items-center gap-2 text-sm font-semibold text-red-600">
                        <X className="h-4 w-4" />
                        Remover foto
                      </button>
                    )}
                  </div>
                </section>
                {renderMobileBottomBar({
                  onPrimary: nextStep,
                  primaryLabel: 'Avancar',
                  primaryDisabled: !image,
                  showReset: true,
                  onReset: clearImage,
                  resetLabel: 'Limpar',
                })}
              </>
            )}

            {currentStep === 4 && (
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

            {currentStep === 5 && (
              <>
                <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-20 pr-1 custom-scrollbar">
                  <div className="rounded-[30px] bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-400">Preview final</p>
                    <button
                      type="button"
                      onClick={() => setIsMobileFullscreenPreviewOpen(true)}
                      className="mt-5 flex w-full justify-center rounded-[26px] bg-[linear-gradient(180deg,#f7f4ef_0%,#ece8df_100%)] p-3"
                    >
                      {renderPhonePreview(true, false)}
                    </button>
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
                  Etapa {desktopStep}/4
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

          <main className="relative flex min-h-[48vh] flex-1 items-center justify-center overflow-hidden bg-zinc-100 p-6 md:p-8 xl:min-h-[100dvh] xl:p-12">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
            <div className="relative z-10 flex w-full max-w-[1180px] items-center justify-center">
              {desktopStep === 2 && image && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2">
                  {renderDesktopImageControlsPanel()}
                </div>
              )}
              {renderPhonePreview()}
            </div>
          </main>
        </div>
      )}
      {renderPainelCarrinho()}
      {renderExportLayers()}
    </div>
  );
}

export default function App() {
  if (typeof window !== 'undefined' && window.location.pathname === '/catalogo-pamda') {
    return <TesteCatalogo />;
  }

  return <MainApp />;
}
