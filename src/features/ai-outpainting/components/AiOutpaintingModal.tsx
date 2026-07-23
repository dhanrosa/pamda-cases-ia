import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { AiConsentNotice } from './AiConsentNotice';
import { AiGenerationStatus } from './AiGenerationStatus';
import { AiOutpaintingPreview } from './AiOutpaintingPreview';
import type { ReturnTypeUseAiOutpainting } from './types';

export function AiOutpaintingModal({ controller, deviceBaseUrl, deviceMaskUrl, slotArea }: {
  controller: ReturnTypeUseAiOutpainting;
  deviceBaseUrl?: string;
  deviceMaskUrl?: string;
  slotArea?: { x: number; y: number; width: number; height: number };
}) {
  const [compare, setCompare] = useState(false);
  useEffect(() => {
    if (controller.status === 'ready') setCompare(false);
  }, [controller.status, controller.resultUrl]);
  if (!controller.isOpen) return null;
  const busy = controller.status === 'preparing' || controller.status === 'generating';
  const canUse = controller.status === 'ready' && Boolean(controller.resultUrl);
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
          />
          <div className="space-y-4">
            <AiGenerationStatus status={controller.status} />
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
