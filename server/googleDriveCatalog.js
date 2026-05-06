const DEFAULT_FOLDER_ID = '1ffl-EXvosUqsDkEl5zRdRQCDGU1AJttX';
const DEFAULT_MAX_RESULTS = 60;

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const buildDriveImageUrl = (fileId) =>
  `/api/google-drive-image/${encodeURIComponent(fileId)}`;

export async function searchGoogleDriveCatalog(options = {}) {
  const env = options.env || process.env;
  const apiKey = env.GOOGLE_DRIVE_API_KEY || env.VITE_GOOGLE_DRIVE_API_KEY;
  const folderId =
    env.GOOGLE_DRIVE_CATALOG_FOLDER_ID ||
    env.VITE_GOOGLE_DRIVE_CATALOG_FOLDER_ID ||
    DEFAULT_FOLDER_ID;
  const query = String(options.query || '').trim();
  const maxResults = Number(options.maxResults || DEFAULT_MAX_RESULTS);

  if (!apiKey) {
    return {
      status: 500,
      body: {
        error: 'Configure GOOGLE_DRIVE_API_KEY no servidor para buscar a pasta do Google Drive.',
      },
    };
  }

  const params = new URLSearchParams({
    key: apiKey,
    q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
    fields:
      'files(id,name,mimeType,thumbnailLink,webContentLink,imageMediaMetadata(width,height))',
    orderBy: 'name_natural',
    pageSize: String(Math.min(Math.max(maxResults, 1), 100)),
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      status: response.status,
      body: {
        error: data?.error?.message || 'Nao foi possivel consultar a pasta do Google Drive.',
      },
    };
  }

  const queryKey = normalizeText(query);
  const assets = (data.files || [])
    .filter((file) => !queryKey || normalizeText(file.name).includes(queryKey))
    .map((file) => ({
      id: file.id,
      name: file.name,
      publicId: file.id,
      url: buildDriveImageUrl(file.id),
      thumbnailUrl: file.thumbnailLink,
      width: file.imageMediaMetadata?.width,
      height: file.imageMediaMetadata?.height,
    }));

  return {
    status: 200,
    body: { assets },
  };
}

export async function fetchGoogleDriveImage(fileId, options = {}) {
  const env = options.env || process.env;
  const apiKey = env.GOOGLE_DRIVE_API_KEY || env.VITE_GOOGLE_DRIVE_API_KEY;

  if (!apiKey) {
    return {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: Buffer.from(JSON.stringify({ error: 'Configure GOOGLE_DRIVE_API_KEY no servidor.' })),
    };
  }

  const params = new URLSearchParams({
    key: apiKey,
    alt: 'media',
    supportsAllDrives: 'true',
  });
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?${params.toString()}`
  );
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const body = Buffer.from(await response.arrayBuffer());

  return {
    status: response.status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': response.ok ? 'public, max-age=3600' : 'no-store',
    },
    body,
  };
}
