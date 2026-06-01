const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const MODEL_SHEET_TABS = [
  { brand: 'APPLE', gid: '0' },
  { brand: 'SAMSUNG', gid: '439184733' },
  { brand: 'MOTOROLA', gid: '1348668329' },
  { brand: 'XIAOMI', gid: '814945176' },
  { brand: 'REALME', gid: '1793242541' },
];

const getSheetId = (env = process.env) =>
  String(env.GOOGLE_MODELOS_SHEET_ID || '').trim();

const parseGvizResponse = (text) => {
  const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);/);
  if (!match) throw new Error('Resposta invalida da planilha de modelos.');
  return JSON.parse(match[1]);
};

const getCellValue = (cell) => String(cell?.f ?? cell?.v ?? '').trim();
let modelCache = null;
let modelCacheExpiresAt = 0;
let pendingModelsRequest = null;

const fetchSheetModels = async ({ sheet, sheetId, signal }) => {
  const url = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`);
  url.searchParams.set('tqx', 'out:json');
  url.searchParams.set('gid', sheet.gid);

  const response = await fetch(url, { signal });
  if (!response.ok) return [];

  const data = parseGvizResponse(await response.text());
  const rows = (data?.table?.rows || []).slice(1);

  return rows
    .map((row) => {
      const name = getCellValue(row?.c?.[0]);
      const bodyUrl = getCellValue(row?.c?.[1]);
      const maskUrl = getCellValue(row?.c?.[2]);

      return name && bodyUrl && maskUrl
        ? { brand: sheet.brand, name, bodyUrl, maskUrl }
        : null;
    })
    .filter(Boolean);
};

export async function listPhoneModels(options = {}) {
  const env = options.env || process.env;
  const sheetId = getSheetId(env);

  if (!sheetId) {
    return {
      status: 503,
      body: { error: 'Configure GOOGLE_MODELOS_SHEET_ID no ambiente do servidor.' },
    };
  }

  if (modelCache && Date.now() < modelCacheExpiresAt) {
    return { status: 200, body: { ok: true, models: modelCache } };
  }

  if (pendingModelsRequest) {
    return pendingModelsRequest;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  pendingModelsRequest = (async () => {
    try {
      const modelGroups = await Promise.all(
        MODEL_SHEET_TABS.map((sheet) =>
          fetchSheetModels({ sheet, sheetId, signal: controller.signal })
        )
      );
      const models = modelGroups.flat();

      modelCache = models;
      modelCacheExpiresAt = Date.now() + DEFAULT_CACHE_TTL_MS;

      return { status: 200, body: { ok: true, models } };
    } catch (error) {
      return {
        status: 502,
        body: {
          error:
            error?.name === 'AbortError'
              ? 'A planilha de modelos demorou demais para responder.'
              : 'Nao foi possivel ler a planilha de modelos.',
        },
      };
    } finally {
      clearTimeout(timeout);
      pendingModelsRequest = null;
    }
  })();

  return pendingModelsRequest;
}
