export function AiConsentNotice({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-5 w-5 accent-[#435446]" />
      <span>Ao continuar, sua imagem sera processada por um servico de inteligencia artificial para completar as areas ausentes. Confira o resultado antes de aprovar.</span>
    </label>
  );
}
