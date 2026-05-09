import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import {
  limparCacheCatalogoStorage,
  listarCatalogoStorage,
  listarPastasRaizCatalogoStorage,
} from '../lib/catalogoStorage';

const naturalSortCollator = new Intl.Collator('pt-BR', {
  numeric: true,
  sensitivity: 'base',
});

const normalizeSortableText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const normalizeSortableKey = (value) => normalizeSortableText(value).toLowerCase();

const getDisplayImageName = (value) =>
  String(value || '').replace(/\s*\(\d+\)\s*$/, '').trim();

const normalizeSearchText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const getEquivalentSearchQueries = (query) => {
  const normalizedQuery = normalizeSearchText(query);
  const queries = new Set([normalizedQuery]);

  if (normalizedQuery.includes('coxa')) {
    queries.add(normalizedQuery.replace(/\bcoxa\b/g, 'coritiba'));
    queries.add('coritiba');
  }

  if (normalizedQuery.includes('coritiba')) {
    queries.add(normalizedQuery.replace(/\bcoritiba\b/g, 'coxa'));
    queries.add('coxa');
  }

  return [...queries].filter(Boolean);
};

const isMetadinhasAsset = (item) => {
  const pathParts = String(item?.caminho || item?.publicId || item?.id || '')
    .split('/')
    .map(normalizeSortableKey);

  return [item?.categoria, item?.subcategoria].map(normalizeSortableKey).includes('metadinhas') ||
    pathParts.includes('metadinhas');
};

const getSortableNameParts = (value, item) => {
  const normalized = normalizeSortableText(value);
  const match = normalized.match(/^(.*?)[\s_-]*\((\d+)\)\s*$/);

  if (!match) {
    return {
      base: normalized,
      order: Number.POSITIVE_INFINITY,
    };
  }

  const base = match[1].trim();
  const originalOrder = Number(match[2]);
  const order =
    isMetadinhasAsset(item) &&
    normalizeSortableKey(base) === 'metadinha' &&
    originalOrder === 16
      ? 4.5
      : originalOrder;

  return {
    base,
    order,
  };
};

const compareByDisplayName = (leftValue, rightValue, leftItem, rightItem) => {
  const left = getSortableNameParts(leftValue, leftItem);
  const right = getSortableNameParts(rightValue, rightItem);
  const baseComparison = naturalSortCollator.compare(left.base, right.base);

  if (baseComparison !== 0) {
    return baseComparison;
  }

  if (left.order !== right.order) {
    return left.order - right.order;
  }

  return naturalSortCollator.compare(
    normalizeSortableText(leftValue),
    normalizeSortableText(rightValue)
  );
};

const sortImagesByName = (items) =>
  items
    .slice()
    .sort((leftItem, rightItem) =>
      compareByDisplayName(
        leftItem?.name || '',
        rightItem?.name || '',
        leftItem,
        rightItem
      )
    );

const getUniqueValues = (items, key) =>
  [...new Set(items.map((item) => item?.[key]).filter(Boolean))];

const getFirstImagePerGroup = (items, key, options = {}) => {
  const grouped = new Map();
  const preferredName = String(options.preferredName || '').trim().toLowerCase();

  items.forEach((item) => {
    const groupKey = String(item?.[key] || '').trim();
    if (!groupKey) {
      return;
    }

    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }

    grouped.get(groupKey).push(item);
  });

  return Array.from(grouped.entries())
    .map(([groupName, groupItems]) => {
      const sortedItems = groupItems
        .slice()
        .sort((a, b) =>
          compareByDisplayName(
            String(a?.name || a?.caminho || ''),
            String(b?.name || b?.caminho || ''),
            a,
            b
          )
        );

      const preferredItem = preferredName
        ? sortedItems.find(
            (item) => String(item?.name || '').trim().toLowerCase() === preferredName
          )
        : null;

      return {
        groupName,
        image: preferredItem || sortedItems[0],
      };
    })
    .filter((item) => Boolean(item.image));
};

const preloadSkeletonItems = Array.from({ length: 20 }, (_, index) => index);
const PENDING_PREVIEW_ASSET_STORAGE_KEY = 'pamda:pending-preview-asset';
const IMAGES_PER_PAGE = 16;

export default function TesteCatalogo() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [imagens, setImagens] = useState([]);
  const [pastasRaiz, setPastasRaiz] = useState([]);
  const [ultimoLoteQuantidade, setUltimoLoteQuantidade] = useState(0);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState('');
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [imagemSelecionada, setImagemSelecionada] = useState(null);
  const runIdRef = useRef(0);
  const catalogGridRef = useRef(null);

  const handleExibirNaPrevia = (imagem = imagemSelecionada) => {
    if (!imagem || typeof window === 'undefined') {
      return;
    }

    const payload = {
      id: imagem.id,
      name: imagem.name,
      publicId: imagem.publicId,
      url: imagem.url,
      thumbnail: imagem.thumbnail,
      categoria: imagem.categoria,
      subcategoria: imagem.subcategoria,
      caminho: imagem.caminho,
    };

    window.sessionStorage.setItem(
      PENDING_PREVIEW_ASSET_STORAGE_KEY,
      JSON.stringify(payload)
    );
    window.location.href = '/';
  };

  const carregarCatalogo = async ({ forceRefresh = false } = {}) => {
    const currentRunId = runIdRef.current + 1;
    runIdRef.current = currentRunId;

    setLoading(true);
    setErro('');
    setImagens([]);
    setPastasRaiz([]);
    setUltimoLoteQuantidade(0);
    setCategoriaSelecionada('');
    setSubcategoriaSelecionada('');
    setBusca('');
    setPaginaAtual(1);
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
    } catch (error) {
      if (runIdRef.current !== currentRunId) {
        return;
      }

      const mensagem =
        error instanceof Error ? error.message : 'Erro desconhecido ao listar catalogo.';

      setImagens([]);
      setPastasRaiz([]);
      setErro(mensagem);
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
  const buscaNormalizada = normalizeSearchText(busca);
  const buscasEquivalentes = getEquivalentSearchQueries(buscaNormalizada);
  const imagensDaBusca = buscaNormalizada
    ? imagens.filter((imagem) => {
        const alvo = normalizeSearchText(
          `${imagem.name || ''} ${imagem.categoria || ''} ${imagem.subcategoria || ''} ${imagem.caminho || ''}`
        );

        return buscasEquivalentes.some((termo) => alvo.includes(termo));
      })
    : [];
  const imagensDaBuscaOrdenadas = sortImagesByName(imagensDaBusca);
  const imagensDaCategoriaSelecionada = categoriaSelecionada
    ? imagens.filter((imagem) => imagem.categoria === categoriaSelecionada)
    : [];
  const imagensDaCategoriaSelecionadaOrdenadas = sortImagesByName(imagensDaCategoriaSelecionada);
  const imagensDaSubcategoriaSelecionada =
    categoriaSelecionada && subcategoriaSelecionada
      ? imagensDaCategoriaSelecionadaOrdenadas.filter(
          (imagem) => imagem.subcategoria === subcategoriaSelecionada
        )
      : [];
  const capasDasPastasRaiz = getFirstImagePerGroup(imagens, 'categoria');
  const capasDasSubpastas = getFirstImagePerGroup(
    imagensDaCategoriaSelecionada.filter((imagem) => imagem.subcategoria),
    'subcategoria',
    { preferredName: categoriaSelecionada === 'LETRAS' ? 'A' : '' }
  );
  const exibindoCapasDeSubpastas =
    Boolean(categoriaSelecionada) &&
    !subcategoriaSelecionada &&
    capasDasSubpastas.length > 0;
  const imagensExibidas = buscaNormalizada
    ? imagensDaBuscaOrdenadas.map((image) => ({
        groupName: image.name,
        image,
      }))
    : !categoriaSelecionada
      ? capasDasPastasRaiz
      : subcategoriaSelecionada
      ? imagensDaSubcategoriaSelecionada.map((image) => ({
          groupName: image.name,
          image,
        })).sort((a, b) => compareByDisplayName(a.groupName, b.groupName, a.image, b.image))
      : capasDasSubpastas.length > 0
          ? capasDasSubpastas.sort((a, b) => compareByDisplayName(a.groupName, b.groupName))
          : imagensDaCategoriaSelecionadaOrdenadas.map((image) => ({
              groupName: image.name,
              image,
            })).sort((a, b) => compareByDisplayName(a.groupName, b.groupName, a.image, b.image));
  const totalExibido = imagensExibidas.length;
  const totalPaginas = Math.max(1, Math.ceil(totalExibido / IMAGES_PER_PAGE));
  const paginaAtualSegura = Math.min(paginaAtual, totalPaginas);
  const indiceInicialPagina = (paginaAtualSegura - 1) * IMAGES_PER_PAGE;
  const imagensDaPagina = imagensExibidas.slice(
    indiceInicialPagina,
    indiceInicialPagina + IMAGES_PER_PAGE
  );
  const temPaginacao = totalExibido > IMAGES_PER_PAGE;

  useEffect(() => {
    setPaginaAtual(1);
  }, [buscaNormalizada, categoriaSelecionada, subcategoriaSelecionada]);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const rolarParaGrade = () => {
    if (typeof window === 'undefined' || !catalogGridRef.current) {
      return;
    }

    const inicio = window.scrollY || window.pageYOffset;
    const destino =
      catalogGridRef.current.getBoundingClientRect().top + inicio - 20;
    const distancia = destino - inicio;
    const duracao = 620;
    const inicioAnimacao = performance.now();
    const easeOutCubic = (tempo) => 1 - Math.pow(1 - tempo, 3);

    const animar = (agora) => {
      const progresso = Math.min((agora - inicioAnimacao) / duracao, 1);
      const deslocamento = distancia * easeOutCubic(progresso);

      window.scrollTo(0, inicio + deslocamento);

      if (progresso < 1) {
        requestAnimationFrame(animar);
      }
    };

    requestAnimationFrame(animar);
  };

  const navegarPagina = (proximaPagina) => {
    setPaginaAtual(proximaPagina);
    requestAnimationFrame(rolarParaGrade);
  };

  const irParaPaginaAnterior = () => {
    navegarPagina(Math.max(1, paginaAtualSegura - 1));
  };

  const irParaProximaPagina = () => {
    navegarPagina(Math.min(totalPaginas, paginaAtualSegura + 1));
  };

  const renderPaginacao = () => {
    if (!temPaginacao) {
      return null;
    }

    return (
      <div className="flex items-center justify-center gap-5 rounded-2xl border border-[#c8d7c4] bg-[#e4ebe1] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
        <button
          type="button"
          onClick={irParaPaginaAnterior}
          disabled={paginaAtualSegura === 1}
          aria-label="Pagina anterior"
          title="Pagina anterior"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#435446] text-white shadow-[0_10px_22px_rgba(67,84,70,0.18)] ring-1 ring-[#435446]/20 transition-colors hover:bg-[#39493b] disabled:cursor-not-allowed disabled:bg-white disabled:text-zinc-300 disabled:shadow-sm disabled:ring-zinc-200"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <span className="min-w-[148px] text-center text-lg font-bold text-[#435446]">
          Pagina {paginaAtualSegura} de {totalPaginas}
        </span>

        <button
          type="button"
          onClick={irParaProximaPagina}
          disabled={paginaAtualSegura === totalPaginas}
          aria-label="Proxima pagina"
          title="Proxima pagina"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#435446] text-white shadow-[0_10px_22px_rgba(67,84,70,0.18)] ring-1 ring-[#435446]/20 transition-colors hover:bg-[#39493b] disabled:cursor-not-allowed disabled:bg-white disabled:text-zinc-300 disabled:shadow-sm disabled:ring-zinc-200"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
    );
  };

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
                onClick={() => carregarCatalogo({ forceRefresh: true })}
                className="rounded-2xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Limpar console e recarregar
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-[#d8e5d6] bg-[#e4ebe1] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
            <label className="block text-xs font-bold uppercase tracking-[0.18em] text-[#435446]">
              Pesquisar no catalogo
            </label>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#435446]/70" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Busque por nome, categoria ou subpasta"
                className="w-full rounded-2xl border border-white/70 bg-white/92 py-3 pl-10 pr-4 text-sm text-zinc-700 outline-none transition-all focus:border-[#435446]/20 focus:ring-2 focus:ring-[#435446]"
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-zinc-50 p-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setCategoriaSelecionada('');
                  setSubcategoriaSelecionada('');
                  setPaginaAtual(1);
                }}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                  categoriaSelecionada === ''
                    ? 'bg-[#435446] text-white shadow-sm'
                    : 'bg-[#e4ebe1] text-[#435446] ring-1 ring-[#c8d7c4] hover:bg-[#dbe4d8]'
                }`}
              >
                Todas
              </button>
              {nomesPastasRaiz.map((nome) => (
                <button
                  key={nome}
                  type="button"
                  onClick={() => {
                    setCategoriaSelecionada(nome);
                    setSubcategoriaSelecionada('');
                    setPaginaAtual(1);
                  }}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                    categoriaSelecionada === nome
                      ? 'bg-[#435446] text-white shadow-sm'
                      : 'bg-[#e4ebe1] text-[#435446] shadow-sm ring-1 ring-[#c8d7c4] hover:bg-[#dbe4d8]'
                  }`}
                >
                  {nome}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {categoriaSelecionada && subcategoriaSelecionada && (
                <button
                  type="button"
                  onClick={() => {
                    setSubcategoriaSelecionada('');
                    setPaginaAtual(1);
                  }}
                  className="rounded-full bg-[#e4ebe1] px-3 py-1.5 text-sm font-semibold text-[#435446] ring-1 ring-[#c8d7c4] transition-colors hover:bg-[#dbe4d8]"
                >
                  Voltar para {categoriaSelecionada}
                </button>
              )}
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
            <div ref={catalogGridRef} className="mt-6">
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
              {renderPaginacao()}

              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {imagensDaPagina.map(({ groupName, image: imagem }) => (
                  <article
                    key={imagem.id}
                    className="group overflow-hidden rounded-[28px] border border-[#d8e0d4] bg-white shadow-[0_16px_36px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-1 hover:border-[#a8b7a1] hover:shadow-[0_24px_50px_rgba(67,84,70,0.16)]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!categoriaSelecionada) {
                          setCategoriaSelecionada(groupName);
                          setSubcategoriaSelecionada('');
                          setPaginaAtual(1);
                          return;
                        }

                        if (exibindoCapasDeSubpastas) {
                          setSubcategoriaSelecionada(groupName);
                          setPaginaAtual(1);
                          return;
                        }

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
                    <div className="flex items-center justify-between gap-3 border-t border-[#edf1eb] px-5 py-4">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold tracking-[-0.01em] text-zinc-800">
                          {getDisplayImageName(groupName || imagem.name) || '-'}
                        </p>
                        {categoriaSelecionada && exibindoCapasDeSubpastas && (
                          <p className="mt-1 truncate text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
                            {categoriaSelecionada}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleExibirNaPrevia(imagem)}
                        className="shrink-0 rounded-xl bg-[#435446] px-3.5 py-2 text-xs font-bold text-white shadow-[0_10px_22px_rgba(67,84,70,0.18)] transition-colors hover:bg-[#39493b]"
                      >
                        Inserir
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-5">
                {renderPaginacao()}
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
                  {getDisplayImageName(imagemSelecionada.name) || 'Imagem do catalogo'}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/72">
                  Veja a arte ampliada antes de enviar para a pre-visualizacao da capinha.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleExibirNaPrevia()}
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
