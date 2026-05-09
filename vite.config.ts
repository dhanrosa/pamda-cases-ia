import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { searchCloudinaryCatalog } from './server/cloudinaryCatalog.js';
import { fetchGoogleDriveImage, searchGoogleDriveCatalog } from './server/googleDriveCatalog.js';
import catalogoHandler from './api/catalogo.js';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'pamda-cloudinary-catalog-api',
        configureServer(server) {
          server.middlewares.use('/api/catalogo', async (req, res) => {
            try {
              const requestUrl = new URL(req.url || '', 'http://localhost');
              await catalogoHandler(
                {
                  method: req.method,
                  query: Object.fromEntries(requestUrl.searchParams.entries()),
                },
                {
                  status(statusCode: number) {
                    res.statusCode = statusCode;
                    return this;
                  },
                  json(body: unknown) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(body));
                  },
                }
              );
            } catch {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Nao foi possivel consultar o catalogo.' }));
            }
          });

          const handleCatalogRequest = async (req, res, provider?: 'drive' | 'cloudinary') => {
            const requestUrl = new URL(req.url || '', 'http://localhost');
            const runtimeEnv = { ...process.env, ...env };
            const useCloudinary =
              provider === 'cloudinary' ||
              (!provider && runtimeEnv.IMAGE_CATALOG_PROVIDER === 'cloudinary');
            const result = useCloudinary
              ? await searchCloudinaryCatalog({
                  env: runtimeEnv,
                  query: requestUrl.searchParams.get('query') || '',
                  maxResults: requestUrl.searchParams.get('limit') || undefined,
                })
              : await searchGoogleDriveCatalog({
                  env: runtimeEnv,
                  query: requestUrl.searchParams.get('query') || '',
                  maxResults: requestUrl.searchParams.get('limit') || undefined,
                });

            res.statusCode = result.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result.body));
          };

          server.middlewares.use('/api/image-catalog', async (req, res) => {
            try {
              await handleCatalogRequest(req, res);
            } catch {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Nao foi possivel consultar o catalogo.' }));
            }
          });

          server.middlewares.use('/api/google-drive-catalog', async (req, res) => {
            try {
              await handleCatalogRequest(req, res, 'drive');
            } catch {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Nao foi possivel consultar a pasta do Google Drive.' }));
            }
          });

          server.middlewares.use('/api/google-drive-image', async (req, res) => {
            try {
              const fileId = decodeURIComponent((req.url || '').replace(/^\//, '').split('?')[0]);
              const result = await fetchGoogleDriveImage(fileId, {
                env: { ...process.env, ...env },
              });

              res.statusCode = result.status;
              Object.entries(result.headers).forEach(([name, value]) => res.setHeader(name, value));
              res.end(result.body);
            } catch {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Nao foi possivel carregar a imagem do Google Drive.' }));
            }
          });

          server.middlewares.use('/api/cloudinary-catalog', async (req, res) => {
            try {
              await handleCatalogRequest(req, res, 'cloudinary');
            } catch {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Nao foi possivel consultar o catalogo.' }));
            }
          });
        },
      },
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
