import { X } from 'lucide-react';
import { AiConsentNotice } from './AiConsentNotice';
import { AiGenerationStatus } from './AiGenerationStatus';
import type { ReturnTypeUseAiOutpainting } from './types';

export function AiOutpaintingInlineControls({
  controller,
}: {
  controller: ReturnTypeUseAiOutpainting;
}) {
  const busy = controller.status === 'preparing' || controller.status === 'generating';
  const ready = controller.status === 'ready' && Boolean(controller.resultUrl);

  return (
    <section
      className="rounded-2xl border border-[#6d7b6b]/20 bg-[#f5f7f3] p-3"
      aria-label="Completar imagem com inteligência artificial"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-zinc-900">Completar imagem com IA</p>
          <p className="mt-0.5 text-xs text-zinc-600">
            O resultado será mostrado diretamente na prévia acima.
          </p>
        </div>
        <button
          type="button"
          onClick={controller.discard}
          disabled={busy}
          className="rounded-full p-1.5 text-zinc-500 hover:bg-white disabled:opacity-40"
          aria-label="Cancelar complemento com IA"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <AiGenerationStatus status={controller.status} />
        {!controller.hasConsent && (
          <AiConsentNotice
            checked={controller.hasConsent}
            onChange={controller.setHasConsent}
          />
        )}
        {controller.error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {controller.error}
          </p>
        )}

        {ready ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={controller.generate}
              className="min-h-11 rounded-xl border border-[#435446] px-3 text-sm font-semibold text-[#435446]"
            >
              Gerar novamente
            </button>
            <button
              type="button"
              onClick={controller.toggleComparison}
              className="min-h-11 rounded-xl bg-[#435446] px-3 text-sm font-bold text-white"
            >
              {controller.isComparingOriginal ? 'Ver resultado da IA' : 'Comparar com original'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={controller.generate}
            disabled={busy || !controller.hasConsent}
            className="min-h-11 w-full rounded-xl bg-[#435446] px-4 text-sm font-bold text-white disabled:opacity-40"
          >
            {controller.status === 'error' ? 'Tentar novamente' : 'Gerar complemento'}
          </button>
        )}

        <button
          type="button"
          onClick={controller.discard}
          disabled={busy}
          className="min-h-10 w-full rounded-xl text-sm font-semibold text-zinc-600 disabled:opacity-40"
        >
          {controller.resultUrl ? 'Restaurar imagem original' : 'Cancelar'}
        </button>
      </div>
    </section>
  );
}
