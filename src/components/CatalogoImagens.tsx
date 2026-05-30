import { ChevronDown, Images, Search } from 'lucide-react';

export type CatalogoImagem = {
  id: string;
  name: string;
  publicId: string;
  url: string;
  thumbnail?: string;
  categoria?: string;
  subcategoria?: string;
  caminho?: string;
};

type CatalogoImagensProps = {
  mobile?: boolean;
  aberto: boolean;
  busca: string;
  categorias: string[];
  subcategorias: string[];
  categoriaSelecionada: string;
  subcategoriaSelecionada: string;
  imagens: CatalogoImagem[];
  carregando: boolean;
  erro: string;
  imagemSelecionadaId: string | null;
  onToggle: () => void;
  onBuscaChange: (value: string) => void;
  onCategoriaChange: (value: string) => void;
  onSubcategoriaChange: (value: string) => void;
  onUsarImagem: (asset: CatalogoImagem) => void;
  onOpenCatalog: () => void | Promise<void>;
};

export function CatalogoImagens({
  mobile = false,
  aberto,
  busca,
  categorias,
  subcategorias,
  categoriaSelecionada,
  subcategoriaSelecionada,
  imagens,
  carregando,
  erro,
  imagemSelecionadaId,
  onToggle,
  onBuscaChange,
  onCategoriaChange,
  onSubcategoriaChange,
  onUsarImagem,
  onOpenCatalog,
}: CatalogoImagensProps) {
  return (
    <div
      className={`${
        mobile
          ? 'mt-2'
          : 'mt-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3'
      }`}
    >
      <button
        type="button"
        onClick={async () => {
          if (mobile) {
            await onOpenCatalog();
            window.location.href = '/catalogo-pamda';
            return;
          }

          onToggle();
        }}
        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
          aberto
            ? 'bg-[#435446] text-white'
            : 'bg-white text-zinc-800 hover:bg-zinc-100'
        }`}
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Images className="h-4 w-4" />
          Imagens do catalogo
        </span>

        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            aberto ? 'rotate-180' : ''
          }`}
        />
      </button>

      {aberto && (
        <div
          className={
            mobile
              ? 'mt-2 rounded-[20px] bg-white/88 p-3'
              : 'mt-3'
          }
        >
          <button
            type="button"
            onClick={async () => {
              await onOpenCatalog();
              window.location.href = '/catalogo-pamda';
            }}
            className="mb-3 flex w-full items-center justify-center rounded-xl border border-[#435446]/15 bg-white px-3 py-2.5 text-sm font-semibold text-[#435446] transition-colors hover:bg-[#f4f7f2]"
          >
            Abrir catalogo completo
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

            <input
              type="text"
              value={busca}
              onChange={(e) => onBuscaChange(e.target.value)}
              placeholder="Pesquisar pelo nome da imagem"
              className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#435446]"
            />
          </div>

          {categorias.length > 0 && (
            <select
              value={categoriaSelecionada}
              onChange={(e) =>
                onCategoriaChange(e.target.value)
              }
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none transition-all focus:ring-2 focus:ring-[#435446]"
            >
              <option value="">
                Todas as categorias
              </option>

              {categorias.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          )}

          {subcategorias.length > 0 && (
            <select
              value={subcategoriaSelecionada}
              onChange={(e) =>
                onSubcategoriaChange(e.target.value)
              }
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700 outline-none transition-all focus:ring-2 focus:ring-[#435446]"
            >
              <option value="">
                Todas as subcategorias
              </option>

              {subcategorias.map((subcategory) => (
                <option
                  key={subcategory}
                  value={subcategory}
                >
                  {subcategory}
                </option>
              ))}
            </select>
          )}

          <div
            className={`${
              mobile ? 'max-h-[min(34dvh,16rem)]' : 'max-h-72'
            } mt-3 overflow-y-auto pr-1 custom-scrollbar`}
          >
            {carregando && (
              <p className="rounded-xl bg-white px-3 py-3 text-xs text-zinc-500">
                Carregando catalogo...
              </p>
            )}

            {!carregando && erro && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-3 text-xs text-red-700">
                {erro}
              </p>
            )}

            {!carregando &&
              !erro &&
              imagens.length === 0 && (
                <p className="rounded-xl bg-white px-3 py-3 text-xs text-zinc-500">
                  Nenhuma imagem encontrada.
                </p>
              )}

            {imagens.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {imagens.map((asset) => {
                  const selected =
                    imagemSelecionadaId === asset.id;

                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => onUsarImagem(asset)}
                      className={`overflow-hidden rounded-xl border bg-white text-left transition-all ${
                        selected
                          ? 'border-[#435446] ring-2 ring-[#435446]/20'
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <div className="aspect-square bg-zinc-100">
                        <img
                          src={asset.thumbnail || asset.url}
                          alt={asset.name}
                          crossOrigin="anonymous"
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="px-2 py-2">
                        <p className="truncate text-xs font-semibold text-zinc-700">
                          {asset.name}
                        </p>

                        {asset.categoria && (
                          <p className="mt-0.5 truncate text-[10px] uppercase tracking-wide text-[#435446]">
                            {asset.subcategoria
                              ? `${asset.categoria} / ${asset.subcategoria}`
                              : asset.categoria}
                          </p>
                        )}

                        <span className="mt-2 block rounded-lg bg-[#435446] px-2 py-1.5 text-center text-[11px] font-semibold text-white">
                          Usar esta imagem
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
