import type { AiOutpaintingStatus } from '../types/aiOutpaintingTypes';

const LABELS: Record<AiOutpaintingStatus, string> = {
  original: 'Imagem original', preparing: 'Preparando imagem', generating: 'Gerando complemento com IA',
  ready: 'Resultado disponivel', error: 'Erro na geracao', approved: 'Resultado aprovado', discarded: 'Resultado descartado',
};

export function AiGenerationStatus({ status }: { status: AiOutpaintingStatus }) {
  const loading = status === 'preparing' || status === 'generating';
  return (
    <div role="status" aria-live="polite" className="rounded-xl bg-[#e4ebe1] px-4 py-3 text-sm text-[#435446]">
      <div className="flex items-center gap-2 font-semibold">
        {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#435446]/25 border-t-[#435446]" />}
        {LABELS[status]}
      </div>
      {loading && <p className="mt-1 text-xs">Estamos ampliando o cenario da sua foto. Nao feche esta tela.</p>}
    </div>
  );
}
