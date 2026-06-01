import { listPhoneModels } from '../server/modelSheet.js';

export default async function handler(_req, res) {
  const result = await listPhoneModels();
  if (result.status === 200) {
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
  }
  res.status(result.status).json(result.body);
}
