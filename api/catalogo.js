const DEFAULT_MAX_RESULTS = 100;

// Configure estas variaveis em Vercel > Project Settings > Environment Variables:
// CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET e CLOUDINARY_CATALOG_FOLDER.
// Nunca use CLOUDINARY_API_SECRET no React/Vite; esta Function roda no backend da Vercel.

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const getTransformedCloudinaryUrl = (url, transformation) => {
  if (!url || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/${transformation}/`);
};

const escapeExpressionValue = (value) =>
  String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const getAssetName = (publicId) => {
  const filename = String(publicId || '').split('/').pop() || '';
  return filename.replace(/[-_]+/g, ' ').trim() || filename;
};

const getCategory = (publicId, folder) => {
  // Para criar categorias, organize as imagens em subpastas no Cloudinary:
  // catalogo-pamdacases/floral/imagem-01.png -> categoria "floral".
  // Imagens direto em catalogo-pamdacases ficam na categoria "Geral".
  const relativePath = String(publicId || '').replace(new RegExp(`^${folder}/?`), '');
  const parts = relativePath.split('/').filter(Boolean);

  return parts.length > 1 ? parts[0] : 'Geral';
};

export async function buscarCatalogo({
  env = process.env,
  query = '',
  categoria = '',
  maxResults = DEFAULT_MAX_RESULTS,
} = {}) {
  const cloudName = env.CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;
  const folder = env.CLOUDINARY_CATALOG_FOLDER;

  if (!cloudName || !apiKey || !apiSecret || !folder) {
    return {
      status: 500,
      body: {
        error:
          'Catalogo indisponivel: configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET e CLOUDINARY_CATALOG_FOLDER na Vercel.',
      },
    };
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  const allResources = [];
  const requestedMaxResults = Math.min(Number(maxResults) || DEFAULT_MAX_RESULTS, 500);
  let nextCursor;

  try {
    do {
      // Para adicionar novas imagens, envie os arquivos para a pasta definida em
      // CLOUDINARY_CATALOG_FOLDER. A busca abaixo encontra assets em qualquer subpasta.
      const expression = `resource_type:image AND public_id:"${escapeExpressionValue(folder)}/*"`;

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            expression,
            max_results: Math.min(requestedMaxResults - allResources.length, 100),
            next_cursor: nextCursor,
            sort_by: [{ public_id: 'asc' }],
          }),
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          status: response.status,
          body: {
            error:
              data?.error?.message ||
              'Nao foi possivel carregar o catalogo no Cloudinary. Verifique as variaveis e a pasta configurada.',
          },
        };
      }

      allResources.push(...(data.resources || []));
      nextCursor = data.next_cursor;
    } while (nextCursor && allResources.length < requestedMaxResults);
  } catch (error) {
    console.error(error);
    return {
      status: 502,
      body: {
        error: 'O Cloudinary nao respondeu agora. Tente novamente em instantes.',
      },
    };
  }

  console.log('[catalogo] folder usado:', folder);
  console.log('[catalogo] quantidade de imagens encontradas:', allResources.length);
  console.log(
    '[catalogo] public_ids encontrados:',
    allResources.map((asset) => asset.public_id)
  );

  const queryKey = normalizeText(query);
  const categoryKey = normalizeText(categoria);
  const assets = allResources
    .map((asset) => {
      const nome = getAssetName(asset.public_id);
      const categoriaDaImagem = getCategory(asset.public_id, folder);

      return {
        public_id: asset.public_id,
        url: asset.secure_url,
        thumbnail: getTransformedCloudinaryUrl(
          asset.secure_url,
          'c_fill,w_420,h_420,q_auto,f_auto'
        ),
        nome,
        categoria: categoriaDaImagem,
      };
    })
    .filter((asset) => {
      const matchesQuery =
        !queryKey ||
        normalizeText(`${asset.nome} ${asset.public_id} ${asset.categoria}`).includes(queryKey);
      const matchesCategory = !categoryKey || normalizeText(asset.categoria) === categoryKey;

      return matchesQuery && matchesCategory;
    });

  if (!assets.length && !queryKey && !categoryKey) {
    return {
      status: 404,
      body: {
        error:
          'Nenhuma imagem foi encontrada na pasta configurada. Confira se a pasta existe e se as imagens estao em catalogo-pamdacases.',
      },
    };
  }

  return {
    status: 200,
    body: {
      assets,
      categorias: [...new Set(assets.map((asset) => asset.categoria))].sort((a, b) =>
        a.localeCompare(b, 'pt-BR')
      ),
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Metodo nao permitido.' });
    return;
  }

  const result = await buscarCatalogo({
    query: req.query?.busca || req.query?.query || '',
    categoria: req.query?.categoria || '',
    maxResults: req.query?.limit || DEFAULT_MAX_RESULTS,
  });

  res.status(result.status).json(result.body);
}
