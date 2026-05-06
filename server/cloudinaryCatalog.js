const DEFAULT_MAX_RESULTS = 60;
const SEARCH_PAGE_SIZE = 100;
const SEARCH_PAGE_LIMIT = 5;

const escapeExpressionValue = (value) => String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const getAssetName = (asset) => {
  const publicId = asset.public_id || '';
  const filename = asset.filename || publicId.split('/').pop() || publicId;
  return asset.display_name || filename;
};

export async function searchCloudinaryCatalog(options = {}) {
  const env = options.env || process.env;
  const cloudName = env.CLOUDINARY_CLOUD_NAME || env.VITE_CLOUDINARY_CLOUD_NAME || 'dwexdk5pp';
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;
  const folder =
    env.CLOUDINARY_CATALOG_FOLDER || env.VITE_CLOUDINARY_CATALOG_FOLDER || 'catalogo-pamdacases';
  const folderField = env.CLOUDINARY_CATALOG_FOLDER_FIELD || 'folder';
  const query = String(options.query || '').trim();
  const maxResults = Number(options.maxResults || DEFAULT_MAX_RESULTS);

  if (!apiKey || !apiSecret || !folder) {
    return {
      status: 500,
      body: {
        error:
          'Configure CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET e CLOUDINARY_CATALOG_FOLDER no servidor.',
      },
    };
  }

  const expression = `resource_type:image AND ${folderField}:"${escapeExpressionValue(folder)}"`;
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`;
  const queryKey = normalizeText(query);
  const matches = [];
  let nextCursor;
  let pages = 0;

  do {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expression,
        max_results: SEARCH_PAGE_SIZE,
        next_cursor: nextCursor,
        sort_by: [{ public_id: 'asc' }],
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        status: response.status,
        body: {
          error: data?.error?.message || 'Nao foi possivel consultar o catalogo no Cloudinary.',
        },
      };
    }

    for (const asset of data.resources || []) {
      const name = getAssetName(asset);
      const haystack = normalizeText(`${name} ${asset.public_id || ''}`);

      if (queryKey && !haystack.includes(queryKey)) {
        continue;
      }

      matches.push({
        id: asset.asset_id || asset.public_id,
        name,
        publicId: asset.public_id,
        url: asset.secure_url,
        width: asset.width,
        height: asset.height,
      });

      if (matches.length >= maxResults) {
        break;
      }
    }

    nextCursor = data.next_cursor;
    pages += 1;
  } while (nextCursor && matches.length < maxResults && pages < SEARCH_PAGE_LIMIT);

  return {
    status: 200,
    body: {
      assets: matches,
    },
  };
}
