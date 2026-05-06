import { supabase, supabaseConfigStatus } from './supabaseClient';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

const bucket = import.meta.env.VITE_SUPABASE_BUCKET || 'catalogo-pamdacases';
const catalogRoot = import.meta.env.VITE_SUPABASE_CATALOG_FOLDER || 'CATALOGO LOJAS';

const normalizePath = (value) => String(value || '').replace(/^\/+|\/+$/g, '');

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
  const { data, error } = await supabase.storage.from(bucket).list(path, {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data : [];
};

const walkStorageFolder = async (path, results) => {
  const items = await listPath(path);

  for (const item of items) {
    const itemPath = `${normalizePath(path)}/${item.name}`;

    if (isImageFile(item.name)) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(itemPath);
      const { categoria, subcategoria } = getCategoryInfo(itemPath);

      results.push({
        id: itemPath,
        publicId: itemPath,
        name: getNameWithoutExtension(item.name),
        caminho: itemPath,
        categoria,
        subcategoria,
        url: data.publicUrl,
        thumbnail: data.publicUrl,
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
