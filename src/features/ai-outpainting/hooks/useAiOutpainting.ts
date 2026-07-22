import { useEffect, useRef, useState } from 'react';
import { AI_OUTPAINTING_CONFIG } from '../config/aiOutpaintingConfig';
import { requestOutpainting } from '../services/aiOutpaintingClient';
import type { AiOutpaintingStatus, CameraArea, PreparedOutpainting, PrintTransform } from '../types/aiOutpaintingTypes';
import { buildOutpaintingCanvas } from '../utils/buildOutpaintingCanvas';
import { validatePreparedPair } from '../utils/validateOutpaintingFiles';

export const useAiOutpainting = (options: {
  image: string | null;
  transform: PrintTransform;
  canvasDimensions?: { width: number; height: number };
  storeCode: string;
  onApprove: (resultUrl: string) => void;
}) => {
  const [status, setStatus] = useState<AiOutpaintingStatus>('original');
  const [isOpen, setIsOpen] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [prepared, setPrepared] = useState<PreparedOutpainting | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [lastGenerationAt, setLastGenerationAt] = useState(0);
  const [cameraArea, setCameraArea] = useState<CameraArea>({ x: 4, y: 2, width: 35, height: 18 });
  const originalUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const preparedUrlRef = useRef<string | null>(null);
  const resultUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    abortRef.current?.abort();
    if (preparedUrlRef.current) URL.revokeObjectURL(preparedUrlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  const open = () => {
    originalUrlRef.current = options.image;
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResultUrl(null);
    setStatus('original');
    setError('');
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen || !options.image) return;
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setStatus('preparing');
      setError('');
      try {
        const nextPrepared = await buildOutpaintingCanvas(
          options.image as string,
          options.transform,
          options.canvasDimensions
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
  ]);

  const close = () => {
    if (status === 'generating') abortRef.current?.abort();
    setIsOpen(false);
  };

  const generate = async () => {
    if (!options.image || status === 'preparing' || status === 'generating') return;
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
        options.image,
        options.transform,
        options.canvasDimensions
      );
      await validatePreparedPair(nextPrepared.baseFile, nextPrepared.maskFile);
      if (preparedUrlRef.current) URL.revokeObjectURL(preparedUrlRef.current);
      preparedUrlRef.current = nextPrepared.previewUrl;
      setPrepared(nextPrepared);
      setStatus('generating');
      setLastGenerationAt(Date.now());
      abortRef.current = new AbortController();
      const nextResult = await requestOutpainting({
        image: nextPrepared.baseFile,
        mask: nextPrepared.maskFile,
        direction: nextPrepared.geometry.direction,
        storeCode: options.storeCode,
        cameraArea,
        signal: abortRef.current.signal,
      });
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = nextResult;
      setResultUrl(nextResult);
      setStatus('ready');
    } catch (cause) {
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
    setStatus('discarded');
    setIsOpen(false);
  };

  const restoreOriginal = () => {
    if (!originalUrlRef.current) return;
    options.onApprove(originalUrlRef.current);
    setStatus('discarded');
  };

  return {
    status, isOpen, hasConsent, prepared, resultUrl, error,
    originalUrl: originalUrlRef.current || options.image,
    cameraArea, setCameraArea,
    setHasConsent, open, close, generate, approve, discard, restoreOriginal,
  };
};
