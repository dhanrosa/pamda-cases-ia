import React, { useEffect, useRef, useState } from 'react';
import {
  limparCacheCatalogoStorage,
  listarCatalogoStorage,
  listarPastasRaizCatalogoStorage,
} from '../lib/catalogoStorage';
import { supabaseConfig, supabaseConfigStatus } from '../lib/supabaseClient';

const getUniqueValues = (items, key) =>
  [...new Set(items.map((item) => item?.[key]).filter(Boolean))];

const preloadSkeletonItems = Array.from({ length: 20 }, (_, index) => index);
const PENDING_PREVIEW_ASSET_STORAGE_KEY = 'pamda:pending-preview-asset';

export default function TesteCatalogo() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [imagens, setImagens] = useState([]);
  const [pastasRaiz, setPastasRaiz] = useState([]);
  const [ultimoLoteQuantidade, setUltimoLoteQuantidade] = useState(0);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [imagemSelecionada, setImagemSelecionada] = useState(null);
  const runIdRef = useRef(0);

  const handleExibirNaPrevia = () => {
    if (!imagemSelecionada || typeof window === 'undefined') {
      return;
    }

    const payload = {
      id: imagemSelecionada.id,
      name: imagemSelecionada.name,
      publicId: imagemSelecionada.publicId,
      url: imagemSelecionada.url,
      thumbnail: imagemSelecionada.thumbnail,
      categoria: imagemSelecionada.categoria,
      subcategoria: imagemSelecionada.subcategoria,
      caminho: imagemSelecionada.caminho,
    };

    window.sessionStorage.setItem(
      PENDING_PREVIEW_ASSET_STORAGE_KEY,
      JSON.stringify(payload)
    );
    window.location.href = '/';
  };

  const carregarCatalogo = async ({ clearConsole = false, forceRefresh = false } = {}) => {
    const currentRunId = runIdRef.current + 1;
    runIdRef.current = currentRunId;

    if (clearConsole && typeof console.clear === 'function') {
      console.clear();
    }

    console.log('[CATALOGO TESTE] Iniciando teste');
    console.log('[CATALOGO TESTE] Config Supabase:', supabaseConfig);
    console.log('[CATALOGO TESTE] Status config:', supabaseConfigStatus);

    setLoading(true);
    setErro('');
    setImagens([]);
    setPastasRaiz([]);
    setUltimoLoteQuantidade(0);
    setCategoriaSelecionada('');
    setImagemSelecionada(null);

    try {
      if (forceRefresh) {
        limparCacheCatalogoStorage();
      }

      const [pastas, resultado] = await Promise.all([
        listarPastasRaizCatalogoStorage({ forceRefresh }),
        listarCatalogoStorage({
          forceRefresh,
          concurrency: 8,
          onProgress: ({ imagens: imagensParciais, ultimoLote }) => {
            if (runIdRef.current !== currentRunId) {
              return;
            }

            setImagens(imagensParciais);
            setUltimoLoteQuantidade(ultimoLote.length);
          },
        }),
      ]);
      const categorias = getUniqueValues(resultado, 'categoria');
      const subcategorias = getUniqueValues(resultado, 'subcategoria');

      if (runIdRef.current !== currentRunId) {
        return;
      }

      setPastasRaiz(pastas);
      setImagens(resultado);

      console.log('[CATALOGO TESTE] Pastas raiz:', pastas);
      console.log(
        '[CATALOGO TESTE] Names da listagem raiz:',
        pastas.map((item) => item?.name)
      );
      console.log('[CATALOGO TESTE] Resultado bruto:', resultado);
      console.log('[CATALOGO TESTE] Total encontrado:', resultado.length);
      console.log('[CATALOGO TESTE] Primeira imagem:', resultado[0]);
      console.log('[CATALOGO TESTE] Categorias:', categorias);
      console.log('[CATALOGO TESTE] Subcategorias:', subcategorias);
    } catch (error) {
      if (runIdRef.current !== currentRunId) {
        return;
      }

      const mensagem =
        error instanceof Error ? error.message : 'Erro desconhecido ao listar catalogo.';

      setImagens([]);
      setPastasRaiz([]);
      setErro(mensagem);
      console.error('[CATALOGO TESTE] Erro ao listar catalogo:', error);
    } finally {
      if (runIdRef.current === currentRunId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    carregarCatalogo();
  }, []);

  const categorias = getUniqueValues(imagens, 'categoria');
  const subcategorias = getUniqueValues(imagens, 'subcategoria');
  const nomesPastasRaiz = pastasRaiz.map((item) => item?.name).filter(Boolean);
  const imagensFiltradas = categoriaSelecionada
    ? imagens.filter((imagem) => imagem.categoria === categoriaSelecionada)
    : imagens;
  const primeirasImagens = imagensFiltradas.slice(0, 20);

  return (
    <div className="min-h-screen bg-zinc-100 px-4 py-8 text-zinc-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => carregarCatalogo({ forceRefresh: true })}
                className="rounded-2xl bg-[#435446] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#39493b]"
              >
                Recarregar catalogo
              </button>
              <button
                type="button"
                onClick={() => carregarCatalogo({ clearConsole: true, forceRefresh: true })}
                className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Limpar console e recarregar
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-zinc-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                Status
              </p>
              <p className="mt-2 text-sm text-zinc-700">
                {loading ? 'Carregando catalogo aos poucos...' : 'Carregamento concluido'}
              </p>
            </div>
            <div className="rounded-2xl bg-zinc-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                Total de imagens
              </p>
              <p className="mt-2 text-2xl font-bold text-zinc-900">{imagens.length}</p>
            </div>
            <div className="rounded-2xl bg-zinc-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
                Categorias / Subcategorias
              </p>
              <p className="mt-2 text-sm text-zinc-700">
                {categorias.length} categorias e {subcategorias.length} subcategorias
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-zinc-50 p-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoriaSelecionada('')}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                  categoriaSelecionada === ''
                    ? 'bg-[#435446] text-white shadow-sm'
                    : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50'
                }`}
              >
                Todas
              </button>
              {nomesPastasRaiz.map((nome) => (
                <button
                  key={nome}
                  type="button"
                  onClick={() => setCategoriaSelecionada(nome)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                    categoriaSelecionada === nome
                      ? 'bg-[#435446] text-white shadow-sm'
                      : 'bg-white text-[#435446] shadow-sm ring-1 ring-zinc-200 hover:bg-[#f4f7f2]'
                  }`}
                >
                  {nome}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {nomesPastasRaiz.length === 0 && (
                <span className="text-sm text-zinc-500">
                  Nenhum name encontrado na listagem raiz.
                </span>
              )}
            </div>
          </div>

          {erro && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {erro}
            </div>
          )}

          {loading && imagens.length === 0 && (
            <div className="mt-6">
              <div className="rounded-2xl bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
                Carregando catalogo...
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {preloadSkeletonItems.map((item) => (
                  <div
                    key={item}
                    className="overflow-hidden rounded-[28px] border border-[#d8e0d4] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.05)]"
                  >
                    <div className="aspect-[1/1] animate-pulse bg-[linear-gradient(180deg,#f3f1ea_0%,#e6e1d7_100%)] p-6">
                      <div className="h-full w-full rounded-[22px] bg-white/70" />
                    </div>
                    <div className="border-t border-[#edf1eb] px-5 py-4">
                      <div className="h-5 w-2/3 animate-pulse rounded-full bg-zinc-200" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {imagens.length > 0 && !erro && (
            <div className="mt-6">
              <div className="rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-700">
                {loading
                  ? `Mostrando ${primeirasImagens.length} imagens${categoriaSelecionada ? ` de ${categoriaSelecionada}` : ''} enquanto o restante carrega. Ultimo lote: ${ultimoLoteQuantidade}.`
                  : `Exibindo as primeiras ${primeirasImagens.length} imagens${categoriaSelecionada ? ` de ${categoriaSelecionada}` : ''}.`}
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {primeirasImagens.map((imagem) => (
                  <article
                    key={imagem.id}
                    className="group overflow-hidden rounded-[28px] border border-[#d8e0d4] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-1 hover:border-[#a8b7a1] hover:shadow-[0_24px_50px_rgba(67,84,70,0.16)]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        console.log('[CATALOGO TESTE] URL da imagem clicada:', imagem.url);
                        setImagemSelecionada(imagem);
                      }}
                      className="block w-full text-left"
                    >
                      <div className="flex h-[360px] items-center justify-center bg-[linear-gradient(180deg,#f8f7f2_0%,#ece8df_100%)] p-6">
                        <img
                          src={imagem.thumbnail || imagem.url}
                          alt={imagem.name}
                          loading="lazy"
                          className="h-full w-auto max-w-full rounded-[22px] border border-white/80 object-contain shadow-[0_10px_24px_rgba(15,23,42,0.10)]"
                        />
                      </div>
                    </button>
                    <div className="border-t border-[#edf1eb] px-5 py-4">
                      <p className="text-base font-semibold tracking-[-0.01em] text-zinc-800">
                        {imagem.name || '-'}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {imagemSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-[2px]">
          <div className="relative flex max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            <button
              type="button"
              onClick={() => setImagemSelecionada(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-zinc-700 shadow-[0_10px_24px_rgba(15,23,42,0.14)] transition-colors hover:bg-zinc-100"
            >
              Fechar
            </button>

            <div className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,#f6f4ee_0%,#e8e2d7_100%)] p-6 sm:p-8">
              <img
                src={imagemSelecionada.url || imagemSelecionada.thumbnail}
                alt={imagemSelecionada.name}
                className="max-h-[78vh] w-auto max-w-full rounded-[24px] border border-white/90 object-contain shadow-[0_20px_50px_rgba(15,23,42,0.20)]"
              />
            </div>

            <aside className="flex w-full max-w-[320px] flex-col justify-between bg-[linear-gradient(180deg,#435446_0%,#2e3b31_100%)] p-6 text-white shadow-[-18px_0_40px_rgba(0,0,0,0.18)]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60">
                  Visualizacao
                </p>
                <h2 className="mt-3 text-2xl font-bold leading-tight">
                  {imagemSelecionada.name || 'Imagem do catalogo'}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/72">
                  Veja a arte ampliada antes de enviar para a pre-visualizacao da capinha.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExibirNaPrevia}
                className="mt-6 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#435446] shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition-colors hover:bg-[#f4f7f2]"
              >
                Exibir na previa
              </button>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
