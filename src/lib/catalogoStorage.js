import { supabaseConfig, supabaseConfigStatus } from './supabaseClient';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

const bucket = supabaseConfig.bucket;
const catalogRoot = import.meta.env.VITE_SUPABASE_CATALOG_FOLDER || 'CATALOGO LOJAS';

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

const getCategoryInfo = (path) => {
  const root = normalizePath(catalogRoot);
  const relativePath = normalizePath(path).replace(new RegExp(`^${root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\/?`), '');
  const parts = relativePath.split('/').filter(Boolean);

  return {
    categoria: parts[0] || 'Geral',
    subcategoria: parts.length > 2 ? parts[1] : '',
  };
};

const listPath = async (path) => {
  const response = await fetch(
    `${supabaseConfig.url}/storage/v1/object/list/${encodeURIComponent(bucket)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseConfig.anonKey,
        Authorization: `Bearer ${supabaseConfig.anonKey}`,
      },
      body: JSON.stringify({
        prefix: normalizePath(path),
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Nao foi possivel listar o catalogo no Supabase.');
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

const getPublicUrl = (itemPath) => {
  const encodedPath = encodePathSegments(itemPath);
  return `${supabaseConfig.url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodedPath}`;
};

const walkStorageFolder = async (path, results) => {
  const items = await listPath(path);

  for (const item of items) {
    const itemPath = `${normalizePath(path)}/${item.name}`;

    if (isImageFile(item.name)) {
      const { categoria, subcategoria } = getCategoryInfo(itemPath);
      const publicUrl = getPublicUrl(itemPath);

      results.push({
        id: itemPath,
        publicId: itemPath,
        name: getNameWithoutExtension(item.name),
        caminho: itemPath,
        categoria,
        subcategoria,
        url: publicUrl,
        thumbnail: publicUrl,
      });
      continue;
    }

    await walkStorageFolder(itemPath, results);
  }
};

export const listarCatalogoStorage = async () => {
  if (!supabaseConfigStatus.hasUrl || !supabaseConfigStatus.hasAnonKey) {
    throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.');
  }

  const results = [];
  await walkStorageFolder(normalizePath(catalogRoot), results);

  return results;
};
