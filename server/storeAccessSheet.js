const DEFAULT_TIMEOUT_MS = 15000;
const ADMIN_CODE = '1806';

const normalizeStoreCode = (value) => String(value || '').trim().toUpperCase();
const isValidStoreCode = (value) => /^\d{3,4}$/.test(normalizeStoreCode(value));

const getScriptUrl = (env = process.env) => String(env.GOOGLE_STORE_ACCESS_SCRIPT_URL || '').trim();

const getSheetId = (env = process.env) =>
  String(env.GOOGLE_STORE_ACCESS_SHEET_ID || '').trim();

const parseGvizResponse = (text) => {
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');

  if (jsonStart < 0 || jsonEnd < jsonStart) {
    throw new Error('Resposta invalida da planilha.');
  }

  return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
};

const getCellValue = (cell) => String(cell?.f ?? cell?.v ?? '').trim();
const normalizeFreight = (value) => String(value || '').trim();

const fetchAuthorizedStores = async (env = process.env) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const sheetId = getSheetId(env);
    if (!sheetId) throw new Error('Configure GOOGLE_STORE_ACCESS_SHEET_ID no ambiente.');
    const url = new URL(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq`);
    url.searchParams.set('tqx', 'out:json');
    url.searchParams.set('gid', '0');

    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error('Nao foi possivel ler a planilha.');

    const data = parseGvizResponse(await response.text());
    const stores = (data?.table?.rows || [])
      .map((row) => ({
        code: normalizeStoreCode(getCellValue(row?.c?.[0])),
        name: getCellValue(row?.c?.[1]),
        freight: normalizeFreight(getCellValue(row?.c?.[2])),
      }))
      .filter((store) => store.code && store.name);

    return { status: 200, body: { ok: true, stores } };
  } catch (error) {
    return {
      status: 502,
      body: {
        error:
          error?.name === 'AbortError'
            ? 'A planilha demorou demais para responder.'
            : 'Nao foi possivel ler a planilha de acessos.',
      },
    };
  } finally {
    clearTimeout(timeout);
  }
};

const requestStoreAccessScript = async ({ env = process.env, method = 'GET', params = {} }) => {
  const scriptUrl = getScriptUrl(env);

  if (!scriptUrl) {
    return {
      status: 503,
      body: {
        error: 'A integracao com a planilha de acessos ainda nao foi configurada.',
      },
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const url = new URL(scriptUrl);
    const requestOptions = {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: {},
    };

    if (method === 'GET') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      });
    } else {
      requestOptions.headers['Content-Type'] = 'application/json';
      requestOptions.body = JSON.stringify(params);
    }

    const response = await fetch(url, requestOptions);
    const data = await response.json().catch(() => null);

    if (!response.ok || !data) {
      return {
        status: response.ok ? 502 : response.status,
        body: { error: data?.error || 'Nao foi possivel consultar a planilha de acessos.' },
      };
    }

    return {
      status: data.ok === false ? 400 : 200,
      body: data,
    };
  } catch (error) {
    return {
      status: 502,
      body: {
        error:
          error?.name === 'AbortError'
            ? 'A planilha demorou demais para responder.'
            : 'Nao foi possivel consultar a planilha de acessos.',
      },
    };
  } finally {
    clearTimeout(timeout);
  }
};

export async function listAuthorizedStores(options = {}) {
  if (normalizeStoreCode(options.adminCode) !== ADMIN_CODE) {
    return { status: 403, body: { error: 'Acesso nao autorizado.' } };
  }

  return fetchAuthorizedStores(options.env);
}

export async function validateAuthorizedStore(code, options = {}) {
  if (!isValidStoreCode(code)) {
    return { status: 200, body: { ok: true, store: null } };
  }

  const result = await fetchAuthorizedStores(options.env);
  if (result.status !== 200) return result;

  const normalizedCode = normalizeStoreCode(code);
  const store = result.body.stores.find((item) => item.code === normalizedCode) || null;

  return { status: 200, body: { ok: true, store } };
}

export async function saveAuthorizedStore(store, options = {}) {
  if (!isValidStoreCode(store.code)) {
    return { status: 400, body: { error: 'Use um codigo numerico de 3 ou 4 digitos.' } };
  }

  return requestStoreAccessScript({
    env: options.env,
    method: 'POST',
    params: {
      action: 'save',
      code: normalizeStoreCode(store.code),
      name: String(store.name || '').trim(),
      adminCode: normalizeStoreCode(store.adminCode),
    },
  });
}

export async function deleteAuthorizedStore(code, options = {}) {
  return requestStoreAccessScript({
    env: options.env,
    method: 'POST',
    params: {
      action: 'delete',
      code: normalizeStoreCode(code),
      adminCode: normalizeStoreCode(options.adminCode),
    },
  });
}
