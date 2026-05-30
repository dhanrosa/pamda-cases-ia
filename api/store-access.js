import {
  deleteAuthorizedStore,
  listAuthorizedStores,
  saveAuthorizedStore,
  validateAuthorizedStore,
} from '../server/storeAccessSheet.js';

const getBody = (req) => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
};

export default async function handler(req, res) {
  const body = getBody(req);
  const action = String(req.query?.action || body.action || '').trim();
  let result;

  if (req.method === 'GET' && action === 'list') {
    result = await listAuthorizedStores();
  } else if (req.method === 'GET' && action === 'validate') {
    result = await validateAuthorizedStore(req.query?.code);
  } else if (req.method === 'POST' && action === 'save') {
    result = await saveAuthorizedStore(body);
  } else if (req.method === 'POST' && action === 'delete') {
    result = await deleteAuthorizedStore(body.code, { adminCode: body.adminCode });
  } else {
    result = { status: 400, body: { error: 'Operacao invalida.' } };
  }

  res.status(result.status).json(result.body);
}
