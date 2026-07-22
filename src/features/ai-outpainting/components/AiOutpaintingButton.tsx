import { Sparkles } from 'lucide-react';

export function AiOutpaintingButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return <button type="button" onClick={onClick} className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#435446] px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#344137] ${className}`}><Sparkles className="h-4 w-4" />Completar imagem com IA</button>;
}
