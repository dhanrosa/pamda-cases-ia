import { AiOutpaintingButton } from './AiOutpaintingButton';

export function AiOutpaintingSuggestion({ onGenerate, compact = false }: {
  onGenerate: () => void;
  compact?: boolean;
}) {
  return (
    <section className={`rounded-2xl border border-amber-200 bg-amber-50 ${compact ? 'p-3' : 'p-4'} shadow-[0_12px_28px_rgba(120,90,20,0.08)]`} aria-label="Sugestao para completar a imagem">
      <p className="text-sm font-bold text-zinc-900">Sua foto nao preenche toda a capinha sem cortes.</p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-600">A inteligencia artificial pode ampliar o cenario da sua foto sem precisar cortar a imagem original.</p>
      <AiOutpaintingButton onClick={onGenerate} className="mt-3" />
      <p className="mt-2 text-[11px] text-zinc-500">A area verde translúcida indica o espaço que a IA pode completar.</p>
    </section>
  );
}
