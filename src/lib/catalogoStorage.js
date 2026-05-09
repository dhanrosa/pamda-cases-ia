import { supabaseConfig, supabaseConfigStatus } from './supabaseClient';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

const bucket = supabaseConfig.bucket;
const catalogRoot = supabaseConfig.catalogFolder || 'CATALOGO LOJAS';
const listPathCache = new Map();
const listPathInFlight = new Map();

const normalizePath = (value) => String(value || '').replace(/^\/+|\/+$/g, '');
const encodePathSegments = (value) =>
  normalizePath(value)
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

const getExtension = (fileName) => {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : '';
};

const getNameWithoutExtension = (fileName) =>
  fileName.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim() || fileName;

const isImageFile = (fileName) => IMAGE_EXTENSIONS.has(getExtension(fileName));
const cloneItems = (items) => items.map((item) => ({ ...item }));

const getCategoryInfo = (path) => {
  const root = normalizePath(catalogRoot);
  const relativePath = normalizePath(path).replace(new RegExp(`^${root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\/?`), '');
  const parts = relativePath.split('/').filter(Boolean);

  return {
    categoria: parts[0] || 'Geral',
    subcategoria: parts.length > 2 ? parts[1] : '',
  };
};

const fetchListPath = async (normalizedPath) => {
  const body = {
    prefix: normalizedPath,
    limit: 1000,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  };

  const response = await fetch(
    `${supabaseConfig.url}/storage/v1/object/list/${encodeURIComponent(bucket)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseConfig.anonKey,
        Authorization: `Bearer ${supabaseConfig.anonKey}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Nao foi possivel listar o catalogo no Supabase.');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

const listPath = async (path, { forceRefresh = false } = {}) => {
  const normalizedPath = normalizePath(path);

  if (!forceRefresh && listPathCache.has(normalizedPath)) {
    return cloneItems(listPathCache.get(normalizedPath));
  }

  if (listPathInFlight.has(normalizedPath)) {
    const sharedResult = await listPathInFlight.get(normalizedPath);
    return cloneItems(sharedResult);
  }

  const requestPromise = fetchListPath(normalizedPath)
    .then((data) => {
      listPathCache.set(normalizedPath, data);
      return data;
    })
    .finally(() => {
      listPathInFlight.delete(normalizedPath);
    });

  listPathInFlight.set(normalizedPath, requestPromise);

  const result = await requestPromise;
  return cloneItems(result);
};

const getPublicUrl = (itemPath) => {
  const encodedPath = encodePathSegments(itemPath);
  return `${supabaseConfig.url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
};

const buildCatalogAsset = (itemPath) => {
  const { categoria, subcategoria } = getCategoryInfo(itemPath);
  const publicUrl = getPublicUrl(itemPath);

  return {
    id: itemPath,
    publicId: itemPath,
    name: getNameWithoutExtension(itemPath.split('/').pop() || itemPath),
    caminho: itemPath,
    categoria,
    subcategoria,
    url: publicUrl,
    thumbnail: publicUrl,
  };
};

const crawlCatalogFolders = async (rootPath, options = {}) => {
  const normalizedRootPath = normalizePath(rootPath);
  const concurrency = Math.max(1, Math.min(options.concurrency || 6, 12));
  const queue = [normalizedRootPath];
  const results = [];
  let cursor = 0;
  let activeWorkers = 0;
  let processedPaths = 0;
  let rejected = false;

  return new Promise((resolve, reject) => {
    const maybeFinish = () => {
      if (!rejected && activeWorkers === 0 && cursor >= queue.length) {
        resolve(results.slice().sort((a, b) => a.caminho.localeCompare(b.caminho)));
      }
    };

    const launchWorkers = () => {
      while (!rejected && activeWorkers < concurrency && cursor < queue.length) {
        const path = queue[cursor];
        cursor += 1;
        activeWorkers += 1;

        (async () => {
          const items = await listPath(path, options);
          const chunk = [];

          for (const item of items) {
            const itemPath = `${normalizePath(path)}/${item.name}`;

            if (isImageFile(item.name)) {
              chunk.push(buildCatalogAsset(itemPath));
              continue;
            }

            queue.push(itemPath);
          }

          if (chunk.length > 0) {
            results.push(...chunk);
            options.onProgress?.({
              imagens: results.slice(),
              ultimoLote: chunk.slice(),
              processedPaths,
              pendingPaths: queue.length - cursor + activeWorkers - 1,
            });
          }
        })()
          .then(() => {
            processedPaths += 1;
            activeWorkers -= 1;
            launchWorkers();
            maybeFinish();
          })
          .catch((error) => {
            rejected = true;
            reject(error);
          });
      }

      maybeFinish();
    };

    launchWorkers();
  });
};

export const limparCacheCatalogoStorage = () => {
  listPathCache.clear();
};

export const listarPastasRaizCatalogoStorage = async (options = {}) => {
  if (!supabaseConfigStatus.hasUrl || !supabaseConfigStatus.hasAnonKey) {
    throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.');
  }

  return listPath(normalizePath(catalogRoot), options);
};

export const listarCatalogoStorage = async (options = {}) => {
  if (!supabaseConfigStatus.hasUrl || !supabaseConfigStatus.hasAnonKey) {
    throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.');
  }

  return crawlCatalogFolders(normalizePath(catalogRoot), options);
};
