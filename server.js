import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { searchCloudinaryCatalog } from './server/cloudinaryCatalog.js';
import { fetchGoogleDriveImage, searchGoogleDriveCatalog } from './server/googleDriveCatalog.js';
import { listPhoneModels } from './server/modelSheet.js';
import {
  deleteAuthorizedStore,
  listAuthorizedStores,
  saveAuthorizedStore,
  validateAuthorizedStore,
} from './server/storeAccessSheet.js';
import catalogoHandler from './api/catalogo.js';
import { AI_MAX_FILE_BYTES, authorizeAiOutpainting, processAiOutpainting } from './server/aiOutpainting.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3001);

app.use(express.json());

const aiUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AI_MAX_FILE_BYTES, files: 2, fields: 4 },
});

app.post(
  '/api/ai/outpaint',
  aiUpload.fields([{ name: 'image', maxCount: 1 }, { name: 'mask', maxCount: 1 }]),
  async (req, res) => {
    const files = req.files || {};
    const authorizationError = await authorizeAiOutpainting({ storeCode: req.body?.storeCode });
    if (authorizationError) return res.status(authorizationError.status).json(authorizationError.body);
    const result = await processAiOutpainting({
      image: files.image?.[0],
      mask: files.mask?.[0],
      direction: req.body?.direction,
      cameraArea: req.body?.cameraArea,
    });
    res.status(result.status).json(result.body);
  }
);

app.use((error, _req, res, next) => {
  if (!(error instanceof multer.MulterError)) return next(error);
  const tooLarge = error.code === 'LIMIT_FILE_SIZE';
  res.status(tooLarge ? 413 : 400).json({
    success: false,
    code: tooLarge ? 'FILE_TOO_LARGE' : 'INVALID_MASK',
    error: tooLarge ? 'O arquivo e muito grande. O limite e 10 MB.' : 'Formulario de imagem invalido.',
  });
});

app.get('/api/store-access', async (req, res) => {
  const action = String(req.query.action || '');
  const result =
    action === 'list'
      ? await listAuthorizedStores({ adminCode: req.query.adminCode })
      : action === 'validate'
        ? await validateAuthorizedStore(req.query.code)
        : { status: 400, body: { error: 'Operacao invalida.' } };

  res.status(result.status).json(result.body);
});

app.post('/api/store-access', async (req, res) => {
  const action = String(req.body?.action || '');
  const result =
    action === 'save'
      ? await saveAuthorizedStore(req.body)
      : action === 'delete'
        ? await deleteAuthorizedStore(req.body?.code, { adminCode: req.body?.adminCode })
        : { status: 400, body: { error: 'Operacao invalida.' } };

  res.status(result.status).json(result.body);
});

app.get('/api/modelos', async (_req, res) => {
  const result = await listPhoneModels();
  if (result.status === 200) {
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
  res.status(result.status).json(result.body);
});

app.get('/api/catalogo', async (req, res) => {
  try {
    await catalogoHandler(req, res);
  } catch {
    res.status(500).json({ error: 'Nao foi possivel consultar o catalogo.' });
  }
});

app.get('/api/cloudinary-catalog', async (req, res) => {
  try {
    const result = await searchCloudinaryCatalog({
      query: req.query.query,
      maxResults: req.query.limit,
    });

    res.status(result.status).json(result.body);
  } catch {
    res.status(500).json({ error: 'Nao foi possivel consultar o catalogo.' });
  }
});

app.get('/api/google-drive-catalog', async (req, res) => {
  try {
    const result = await searchGoogleDriveCatalog({
      query: req.query.query,
      maxResults: req.query.limit,
    });

    res.status(result.status).json(result.body);
  } catch {
    res.status(500).json({ error: 'Nao foi possivel consultar a pasta do Google Drive.' });
  }
});

app.get('/api/image-catalog', async (req, res) => {
  try {
    const useCloudinary = process.env.IMAGE_CATALOG_PROVIDER === 'cloudinary';
    const result = useCloudinary
      ? await searchCloudinaryCatalog({
          query: req.query.query,
          maxResults: req.query.limit,
        })
      : await searchGoogleDriveCatalog({
          query: req.query.query,
          maxResults: req.query.limit,
        });

    res.status(result.status).json(result.body);
  } catch {
    res.status(500).json({ error: 'Nao foi possivel consultar o catalogo.' });
  }
});

app.get('/api/google-drive-image/:fileId', async (req, res) => {
  try {
    const result = await fetchGoogleDriveImage(req.params.fileId);

    Object.entries(result.headers).forEach(([name, value]) => res.setHeader(name, value));
    res.status(result.status).send(result.body);
  } catch {
    res.status(500).json({ error: 'Nao foi possivel carregar a imagem do Google Drive.' });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port);
