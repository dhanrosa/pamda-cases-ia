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

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseCloudinaryUrl = (cloudinaryUrl) => {
  if (!cloudinaryUrl) return {};

  try {
    const parsed = new URL(cloudinaryUrl);

    return {
      apiKey: decodeURIComponent(parsed.username || ''),
      apiSecret: decodeURIComponent(parsed.password || ''),
      cloudName: parsed.hostname || '',
    };
  } catch (error) {
    console.error('[catalogo] CLOUDINARY_URL invalida:', error);
    return {};
  }
};

const getAssetName = (publicId) => {
  const filename = String(publicId || '').split('/').pop() || '';
  return filename.replace(/[-_]+/g, ' ').trim() || filename;
};

const getCategory = (asset, folder) => {
  // Para criar categorias, organize as imagens em subpastas no Cloudinary:
  // catalogo-pamdacases/floral/imagem-01.png -> categoria "floral".
  // Imagens direto em catalogo-pamdacases ficam na categoria "Geral".
  const folderPath = asset.asset_folder || asset.folder || '';
  const usesAssetFolder = folderPath.startsWith(`${folder}/`);
  const pathForCategory = usesAssetFolder ? folderPath : asset.public_id || '';
  const relativePath = String(pathForCategory).replace(new RegExp(`^${escapeRegExp(folder)}/?`), '');
  const parts = relativePath.split('/').filter(Boolean);

  return usesAssetFolder
    ? parts[0] || 'Geral'
    : parts.length > 1
      ? parts[0]
      : 'Geral';
};

const buildSearchExpression = (mode, folder) => {
  const safeFolder = escapeExpressionValue(folder);

  if (mode === 'asset_folder') {
    return `resource_type:image AND asset_folder:${safeFolder}*`;
  }

  return `resource_type:image AND public_id:${safeFolder}/*`;
};

const searchCloudinaryResources = async ({
  auth,
  cloudName,
  expression,
  requestedMaxResults,
}) => {
  const resources = [];
  let nextCursor;
  let firstResponseResource = null;

  do {
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
          max_results: Math.min(requestedMaxResults - resources.length, 100),
          next_cursor: nextCursor,
          sort_by: [{ public_id: 'asc' }],
        }),
      }
    );
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error:
          data?.error?.message ||
          'Nao foi possivel carregar o catalogo no Cloudinary. Verifique as variaveis e a pasta configurada.',
        resources,
        firstResponseResource,
      };
    }

    if (!firstResponseResource) {
      firstResponseResource = data.resources?.[0] || null;
    }

    resources.push(...(data.resources || []));
    nextCursor = data.next_cursor;
  } while (nextCursor && resources.length < requestedMaxResults);

  return {
    ok: true,
    status: 200,
    resources,
    firstResponseResource,
  };
};

export async function buscarCatalogo({
  env = process.env,
  query = '',
  categoria = '',
  maxResults = DEFAULT_MAX_RESULTS,
} = {}) {
  const cloudinaryUrlConfig = parseCloudinaryUrl(env.CLOUDINARY_URL);
  const cloudName = env.CLOUDINARY_CLOUD_NAME || cloudinaryUrlConfig.cloudName || 'dwexdk5pp';
  const apiKey = env.CLOUDINARY_API_KEY || cloudinaryUrlConfig.apiKey;
  const apiSecret = env.CLOUDINARY_API_SECRET || cloudinaryUrlConfig.apiSecret;
  const folder = env.CLOUDINARY_CATALOG_FOLDER || 'catalogo-pamdacases';
  const missingVariables = [
    ['CLOUDINARY_API_KEY', apiKey],
    ['CLOUDINARY_API_SECRET', apiSecret],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missingVariables.length > 0) {
    return {
      status: 500,
      body: {
        success: false,
        error:
          `Catalogo indisponivel: variaveis ausentes na Vercel: ${missingVariables.join(', ')}.`,
        debug: {
          missingVariables,
          hasCloudName: Boolean(cloudName),
          hasApiKey: Boolean(apiKey),
          hasApiSecret: Boolean(apiSecret),
          hasFolder: Boolean(folder),
          hasCloudinaryUrl: Boolean(env.CLOUDINARY_URL),
          folder,
        },
      },
    };
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  const requestedMaxResults = Math.min(Number(maxResults) || DEFAULT_MAX_RESULTS, 500);
  const attempts = [
    { mode: 'asset_folder', expression: buildSearchExpression('asset_folder', folder) },
    { mode: 'public_id', expression: buildSearchExpression('public_id', folder) },
  ];
  const debugAttempts = [];
  let selectedAttempt = null;

  try {
    for (const attempt of attempts) {
      console.log('[catalogo] expression usada:', attempt.expression);

      const result = await searchCloudinaryResources({
        auth,
        cloudName,
        expression: attempt.expression,
        requestedMaxResults,
      });

      const attemptDebug = {
        modo: attempt.mode,
        expression: attempt.expression,
        total: result.resources.length,
        error: result.error,
        primeiroRecursoEncontrado: result.firstResponseResource,
        resourcesRetornados: result.resources.map((asset) => ({
          public_id: asset.public_id,
          asset_folder: asset.asset_folder,
          folder: asset.folder,
          secure_url: asset.secure_url,
        })),
      };
      debugAttempts.push(attemptDebug);

      console.log('[catalogo] modo:', attempt.mode);
      console.log('[catalogo] total encontrado:', result.resources.length);
      console.log(
        '[catalogo] resources retornados:',
        result.resources.map((asset) => ({
          public_id: asset.public_id,
          asset_folder: asset.asset_folder,
          folder: asset.folder,
        }))
      );
      result.resources.forEach((asset) => {
        console.log('[catalogo] asset_folder:', asset.asset_folder);
        console.log('[catalogo] public_id:', asset.public_id);
      });

      if (result.ok && result.resources.length > 0) {
        selectedAttempt = {
          ...attempt,
          resources: result.resources,
          firstResponseResource: result.firstResponseResource,
        };
        break;
      }

      if (!result.ok) {
        console.error('[catalogo] falha na busca:', attempt.mode, result.error);
      }
    }
  } catch (error) {
    console.error(error);
    return {
      status: 200,
      body: {
        success: false,
        error: 'O Cloudinary nao respondeu agora. Tente novamente em instantes.',
        debug: {
          folder,
          tentativas: debugAttempts,
        },
      },
    };
  }

  console.log('[catalogo] folder usado:', folder);
  console.log('[catalogo] quantidade de imagens encontradas:', selectedAttempt?.resources.length || 0);
  console.log('[catalogo] public_ids encontrados:', (selectedAttempt?.resources || []).map((asset) => asset.public_id));

  const queryKey = normalizeText(query);
  const categoryKey = normalizeText(categoria);
  const images = (selectedAttempt?.resources || [])
    .map((asset) => {
      const nome = getAssetName(asset.public_id);
      const categoriaDaImagem = getCategory(asset, folder);

      return {
        public_id: asset.public_id,
        secure_url: asset.secure_url,
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

  if (!selectedAttempt || (!images.length && !queryKey && !categoryKey)) {
    const lastAttempt = debugAttempts[debugAttempts.length - 1];

    return {
      status: 200,
      body: {
        success: false,
        error:
          'Nenhuma imagem foi encontrada na pasta configurada. Confira se a pasta existe e se as imagens estao em catalogo-pamdacases.',
        debug: {
          expression: lastAttempt?.expression || attempts[0].expression,
          expressions: attempts.map((attempt) => attempt.expression),
          folder,
          quantidadeEncontrada: 0,
          primeiroRecursoEncontrado:
            debugAttempts.find((attempt) => attempt.primeiroRecursoEncontrado)
              ?.primeiroRecursoEncontrado || null,
          modo: selectedAttempt?.mode || 'asset_folder',
          tentativas: debugAttempts,
        },
      },
    };
  }

  return {
    status: 200,
    body: {
      success: true,
      total: images.length,
      modo: selectedAttempt.mode,
      expression: selectedAttempt.expression,
      imagens: images,
      assets: images,
      categorias: [...new Set(images.map((asset) => asset.categoria))].sort((a, b) =>
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
