import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { AiConsentNotice } from './AiConsentNotice';
import { AiGenerationStatus } from './AiGenerationStatus';
import { AiOutpaintingPreview } from './AiOutpaintingPreview';
import type { ReturnTypeUseAiOutpainting } from './types';

export function AiOutpaintingModal({ controller, deviceBaseUrl, deviceMaskUrl, slotArea, imageTransform, onImageTransformChange, onResetImageTransform, onReposition }: {
  controller: ReturnTypeUseAiOutpainting;
  deviceBaseUrl?: string;
  deviceMaskUrl?: string;
  slotArea?: { x: number; y: number; width: number; height: number };
  imageTransform: { x: number; y: number; xPercent: number; yPercent: number; zoomPercent: number; maxX: number; maxY: number };
  onImageTransformChange: (next: { x?: number; y?: number; zoomPercent?: number }) => void;
  onResetImageTransform: () => void;
  onReposition: () => void;
}) {
  const [compare, setCompare] = useState(false);
  const [showRepositionControls, setShowRepositionControls] = useState(false);
  useEffect(() => {
    if (controller.status === 'ready') setCompare(false);
  }, [controller.status, controller.resultUrl]);
  if (!controller.isOpen) return null;
  const busy = controller.status === 'preparing' || controller.status === 'generating';
  const canUse = controller.status === 'ready' && Boolean(controller.resultUrl);
  const updateCameraArea = (key: 'x' | 'y' | 'width' | 'height', value: number) => {
    controller.setCameraArea((current) => {
      const next = { ...current, [key]: value };
      next.x = Math.min(next.x, 100 - next.width);
      next.y = Math.min(next.y, 100 - next.height);
      next.width = Math.min(next.width, 100 - next.x);
      next.height = Math.min(next.height, 100 - next.y);
      return next;
    });
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="ai-outpainting-title">
      <div className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:rounded-[28px] sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6d7b6b]">Ferramenta experimental</p><h2 id="ai-outpainting-title" className="mt-1 text-xl font-bold text-zinc-900">Completar imagem com IA</h2></div><button type="button" onClick={controller.close} disabled={busy} className="rounded-full bg-zinc-100 p-2 text-zinc-600 disabled:opacity-40" aria-label="Fechar"><X className="h-5 w-5" /></button></div>
        <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,1fr)_250px]">
          <AiOutpaintingPreview
            originalUrl={controller.prepared?.previewUrl || controller.originalUrl}
            resultUrl={controller.resultUrl}
            compare={compare}
            deviceBaseUrl={deviceBaseUrl}
            deviceMaskUrl={deviceMaskUrl}
            slotArea={slotArea}
            cameraArea={controller.cameraArea}
            imageTransform={controller.prepared ? undefined : imageTransform}
          />
          <div className="space-y-4">
            <AiGenerationStatus status={controller.status} />
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <p className="text-xs font-bold text-zinc-800">Delimitar área da câmera</p>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">Ajuste a marcação amarela antes de gerar. A IA evitará elementos importantes nessa região.</p>
              <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                {([
                  ['x', 'Horizontal', 0, 95],
                  ['y', 'Vertical', 0, 95],
                  ['width', 'Largura', 5, 80],
                  ['height', 'Altura', 5, 80],
                ] as const).map(([key, label, min, max]) => (
                  <label key={key} className="text-[10px] font-semibold text-zinc-600">
                    <span className="flex justify-between"><span>{label}</span><span>{Math.round(controller.cameraArea[key])}%</span></span>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step="1"
                      value={controller.cameraArea[key]}
                      disabled={busy}
                      onChange={(event) => updateCameraArea(key, Number(event.target.value))}
                      className="mt-1 w-full accent-[#435446]"
                    />
                  </label>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-3">
              <button type="button" onClick={() => setShowRepositionControls((value) => !value)} disabled={busy} className="min-h-10 w-full text-sm font-semibold text-[#435446] disabled:opacity-40">
                {showRepositionControls ? 'Ocultar ajustes da imagem' : 'Reposicionar imagem nesta etapa'}
              </button>
              {showRepositionControls && (
                <div className="mt-3 space-y-3 border-t border-zinc-100 pt-3">
                  <label className="block text-[11px] font-semibold text-zinc-600">Zoom: {Math.round(imageTransform.zoomPercent)}%
                    <input type="range" min="50" max="250" step="1" value={imageTransform.zoomPercent} disabled={busy} onChange={(event) => onImageTransformChange({ zoomPercent: Number(event.target.value) })} className="mt-1 w-full accent-[#435446]" />
                  </label>
                  <label className="block text-[11px] font-semibold text-zinc-600">Horizontal
                    <input type="range" min={-imageTransform.maxX} max={imageTransform.maxX} step="1" value={imageTransform.x} disabled={busy} onChange={(event) => onImageTransformChange({ x: Number(event.target.value) })} className="mt-1 w-full accent-[#435446]" />
                  </label>
                  <label className="block text-[11px] font-semibold text-zinc-600">Vertical
                    <input type="range" min={-imageTransform.maxY} max={imageTransform.maxY} step="1" value={imageTransform.y} disabled={busy} onChange={(event) => onImageTransformChange({ y: Number(event.target.value) })} className="mt-1 w-full accent-[#435446]" />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={onResetImageTransform} disabled={busy} className="min-h-10 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700">Restaurar contain</button>
                    <button type="button" onClick={onReposition} disabled={busy} className="min-h-10 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700">Editor completo</button>
                  </div>
                </div>
              )}
            </div>
            {!controller.hasConsent && <AiConsentNotice checked={controller.hasConsent} onChange={controller.setHasConsent} />}
            {controller.error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{controller.error}</p>}
            {controller.resultUrl && <button type="button" onClick={() => setCompare((value) => !value)} className="min-h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm font-semibold">{compare ? 'Ver resultado' : 'Comparar com original'}</button>}
            {controller.status === 'ready' ? <><button type="button" onClick={controller.approve} disabled={!canUse} className="min-h-12 w-full rounded-xl bg-[#435446] px-4 font-bold text-white disabled:opacity-40">Usar esta imagem</button><button type="button" onClick={controller.generate} className="min-h-11 w-full rounded-xl border border-[#435446] px-3 text-sm font-semibold text-[#435446]">Gerar novamente</button></> : <button type="button" onClick={controller.generate} disabled={busy || !controller.hasConsent} className="min-h-12 w-full rounded-xl bg-[#435446] px-4 font-bold text-white disabled:opacity-40">{controller.status === 'error' ? 'Tentar novamente' : 'Gerar complemento'}</button>}
            <button type="button" onClick={controller.discard} disabled={busy} className="min-h-11 w-full rounded-xl px-3 text-sm font-semibold text-zinc-600 disabled:opacity-40">{controller.resultUrl ? 'Restaurar imagem original' : 'Cancelar'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
