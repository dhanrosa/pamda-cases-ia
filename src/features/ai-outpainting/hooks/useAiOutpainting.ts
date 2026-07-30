import { useEffect, useRef, useState } from 'react';
import { AI_OUTPAINTING_CONFIG } from '../config/aiOutpaintingConfig';
import { requestOutpainting } from '../services/aiOutpaintingClient';
import type { AiOutpaintingStatus, PreparedOutpainting, PrintTransform } from '../types/aiOutpaintingTypes';
import { buildOutpaintingCanvas } from '../utils/buildOutpaintingCanvas';
import { validatePreparedPair } from '../utils/validateOutpaintingFiles';

export const useAiOutpainting = (options: {
  image: string | null;
  transform: PrintTransform;
  canvasDimensions?: { width: number; height: number };
  cameraGuideImage?: string;
  storeCode: string;
  onPreview?: (resultUrl: string) => void;
  onApprove: (resultUrl: string) => void;
}) => {
  const [status, setStatus] = useState<AiOutpaintingStatus>('original');
  const [isOpen, setIsOpen] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [prepared, setPrepared] = useState<PreparedOutpainting | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isComparingOriginal, setIsComparingOriginal] = useState(false);
  const [error, setError] = useState('');
  const [lastGenerationAt, setLastGenerationAt] = useState(0);
  const originalUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const preparedUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const sourceVersionRef = useRef(0);

  useEffect(() => () => {
    abortRef.current?.abort();
    if (preparedUrlRef.current) URL.revokeObjectURL(preparedUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  useEffect(() => {
    // O resultado da IA também passa por `options.image` para ser mostrado no
    // editor. Nesse caso, preserve a origem da sessão. Qualquer outra imagem
    // diferente é um novo upload (ou item do catálogo) e deve virar a nova
    // referência imediatamente, sem depender de recarregar a página.
    if (
      options.image === originalUrlRef.current ||
      (resultUrlRef.current && options.image === resultUrlRef.current)
    ) return;

    sourceVersionRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    originalUrlRef.current = options.image;

    if (preparedUrlRef.current) URL.revokeObjectURL(preparedUrlRef.current);
    preparedUrlRef.current = null;
    setPrepared(null);

    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResultUrl(null);
    setIsComparingOriginal(false);
    setStatus('original');
    setError('');
  }, [options.image]);

  const open = () => {
    originalUrlRef.current = options.image;
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResultUrl(null);
    setIsComparingOriginal(false);
    setStatus('original');
    setError('');
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen || !options.image) return;
    // A imagem gerada é exibida no editor principal. Não a trate como uma
    // nova imagem de origem enquanto esta sessão de IA estiver aberta.
    if (
      resultUrlRef.current &&
      (options.image === resultUrlRef.current || options.image === originalUrlRef.current)
    ) return;
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setStatus('preparing');
      setError('');
      try {
        const nextPrepared = await buildOutpaintingCanvas(
          options.image as string,
          options.transform,
          options.canvasDimensions,
          options.cameraGuideImage
        );
        await validatePreparedPair(nextPrepared.baseFile, nextPrepared.maskFile);
        if (cancelled) {
          URL.revokeObjectURL(nextPrepared.previewUrl);
          return;
        }
        if (preparedUrlRef.current) URL.revokeObjectURL(preparedUrlRef.current);
        preparedUrlRef.current = nextPrepared.previewUrl;
        setPrepared(nextPrepared);
        if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
        resultUrlRef.current = null;
        setResultUrl(null);
        setStatus('original');
      } catch (cause) {
        if (cancelled) return;
        setPrepared(null);
        setError(cause instanceof Error ? cause.message : 'Falha ao atualizar o enquadramento.');
        setStatus('error');
      }
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    isOpen,
    options.image,
    options.transform.x,
    options.transform.y,
    options.transform.scale,
    options.transform.rotation,
    options.transform.mirrored,
    options.canvasDimensions?.width,
    options.canvasDimensions?.height,
    options.cameraGuideImage,
  ]);

  const close = () => {
    if (status === 'generating') abortRef.current?.abort();
    setIsOpen(false);
  };

  const generate = async () => {
    const sourceImage = originalUrlRef.current || options.image;
    const sourceVersion = sourceVersionRef.current;
    if (!sourceImage || status === 'preparing' || status === 'generating') return;
    if (!hasConsent) {
      setError('Confirme o aviso de privacidade antes de continuar.');
      return;
    }
    const remaining = AI_OUTPAINTING_CONFIG.generationCooldownMs - (Date.now() - lastGenerationAt);
    if (lastGenerationAt && remaining > 0) {
      setError(`Aguarde ${Math.ceil(remaining / 1000)} segundos antes de gerar novamente.`);
      return;
    }
    setError('');
    setStatus('preparing');
    try {
      const nextPrepared = await buildOutpaintingCanvas(
        sourceImage,
        options.transform,
        options.canvasDimensions,
        options.cameraGuideImage
      );
      await validatePreparedPair(nextPrepared.baseFile, nextPrepared.maskFile);
      if (sourceVersion !== sourceVersionRef.current) {
        URL.revokeObjectURL(nextPrepared.previewUrl);
        return;
      }
      if (preparedUrlRef.current) URL.revokeObjectURL(preparedUrlRef.current);
      preparedUrlRef.current = nextPrepared.previewUrl;
      setPrepared(nextPrepared);
      setStatus('generating');
      setLastGenerationAt(Date.now());
      abortRef.current = new AbortController();
      const nextResult = await requestOutpainting({
        image: nextPrepared.baseFile,
        mask: nextPrepared.maskFile,
        cameraGuide: nextPrepared.cameraGuideFile,
        direction: nextPrepared.geometry.direction,
        storeCode: options.storeCode,
        signal: abortRef.current.signal,
      });
      if (sourceVersion !== sourceVersionRef.current) {
        URL.revokeObjectURL(nextResult);
        return;
      }
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = nextResult;
      setResultUrl(nextResult);
      setIsComparingOriginal(false);
      options.onPreview?.(nextResult);
      setStatus('ready');
    } catch (cause) {
      if (sourceVersion !== sourceVersionRef.current) return;
      if ((cause as Error).name === 'AbortError') {
        setStatus('discarded');
        return;
      }
      setError(cause instanceof Error ? cause.message : 'Falha desconhecida.');
      setStatus('error');
    }
  };

  const approve = () => {
    if (!resultUrl) return;
    options.onApprove(resultUrl);
    resultUrlRef.current = null; // ownership is transferred to the editor
    setStatus('approved');
    setIsOpen(false);
  };

  const discard = () => {
    if (resultUrl && originalUrlRef.current) {
      options.onPreview?.(originalUrlRef.current);
    }
    setStatus('discarded');
    setIsOpen(false);
  };

  const restoreOriginal = () => {
    if (!originalUrlRef.current) return;
    options.onApprove(originalUrlRef.current);
    setStatus('discarded');
  };

  const toggleComparison = () => {
    if (!resultUrl || !originalUrlRef.current) return;
    const showOriginal = !isComparingOriginal;
    options.onPreview?.(showOriginal ? originalUrlRef.current : resultUrl);
    setIsComparingOriginal(showOriginal);
  };

  return {
    status, isOpen, hasConsent, prepared, resultUrl, error, isComparingOriginal,
    originalUrl: originalUrlRef.current || options.image,
    setHasConsent, open, close, generate, approve, discard, restoreOriginal, toggleComparison,
  };
};
