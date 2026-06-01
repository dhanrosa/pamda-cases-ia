import { listPhoneModels } from '../server/modelSheet.js';

export default async function handler(_req, res) {
  const result = await listPhoneModels();
  res.status(result.status).json(result.body);
}
