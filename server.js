import dotenv from 'dotenv';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { searchCloudinaryCatalog } from './server/cloudinaryCatalog.js';
import { fetchGoogleDriveImage, searchGoogleDriveCatalog } from './server/googleDriveCatalog.js';
import catalogoHandler from './api/catalogo.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3001);

app.get('/api/catalogo', async (req, res) => {
  try {
    await catalogoHandler(req, res);
  } catch (error) {
    console.error(error);
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
  } catch (error) {
    console.error(error);
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
  } catch (error) {
    console.error(error);
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Nao foi possivel consultar o catalogo.' });
  }
});

app.get('/api/google-drive-image/:fileId', async (req, res) => {
  try {
    const result = await fetchGoogleDriveImage(req.params.fileId);

    Object.entries(result.headers).forEach(([name, value]) => res.setHeader(name, value));
    res.status(result.status).send(result.body);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Nao foi possivel carregar a imagem do Google Drive.' });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Pamda rodando em http://localhost:${port}`);
});
