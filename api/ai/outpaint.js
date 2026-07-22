import multer from 'multer';
import { AI_MAX_FILE_BYTES, authorizeAiOutpainting, processAiOutpainting } from '../../server/aiOutpainting.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: AI_MAX_FILE_BYTES, files: 2, fields: 4 } });
const parseMultipart = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'mask', maxCount: 1 }]);

export const config = { api: { bodyParser: false } };

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, code: 'METHOD_NOT_ALLOWED', error: 'Metodo nao permitido.' });
  parseMultipart(req, res, async (parseError) => {
    if (parseError) {
      const tooLarge = parseError.code === 'LIMIT_FILE_SIZE';
      return res.status(tooLarge ? 413 : 400).json({ success: false, code: tooLarge ? 'FILE_TOO_LARGE' : 'INVALID_MASK', error: tooLarge ? 'O arquivo e muito grande. O limite e 10 MB.' : 'Formulario de imagem invalido.' });
    }
    const files = req.files || {};
    const authorizationError = await authorizeAiOutpainting({ storeCode: req.body?.storeCode });
    if (authorizationError) return res.status(authorizationError.status).json(authorizationError.body);
    const result = await processAiOutpainting({ image: files.image?.[0], mask: files.mask?.[0], direction: req.body?.direction, cameraArea: req.body?.cameraArea });
    res.status(result.status).json(result.body);
  });
}
