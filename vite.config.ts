import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import multer from 'multer';
import {defineConfig, loadEnv} from 'vite';
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

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'pamda-cloudinary-catalog-api',
        configureServer(server) {
          const aiUpload = multer({
            storage: multer.memoryStorage(),
            limits: { fileSize: AI_MAX_FILE_BYTES, files: 2, fields: 4 },
          }).fields([{ name: 'image', maxCount: 1 }, { name: 'mask', maxCount: 1 }]);

          server.middlewares.use('/api/ai/outpaint', (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, code: 'METHOD_NOT_ALLOWED', error: 'Metodo nao permitido.' }));
              return;
            }
            aiUpload(req as never, res as never, async (parseError) => {
              if (parseError) {
                res.statusCode = parseError.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, code: parseError.code === 'LIMIT_FILE_SIZE' ? 'FILE_TOO_LARGE' : 'INVALID_MASK', error: 'Formulario de imagem invalido.' }));
                return;
              }
              const request = req as typeof req & { files?: Record<string, Express.Multer.File[]>; body?: Record<string, string> };
              const authorizationError = await authorizeAiOutpainting({
                env: { ...process.env, ...env },
                storeCode: request.body?.storeCode,
              });
              if (authorizationError) {
                res.statusCode = authorizationError.status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(authorizationError.body));
                return;
              }
              const result = await processAiOutpainting({
                env: { ...process.env, ...env },
                image: request.files?.image?.[0],
                mask: request.files?.mask?.[0],
                direction: request.body?.direction,
              });
              res.statusCode = result.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result.body));
            });
          });

          server.middlewares.use('/api/store-access', async (req, res) => {
            try {
              const requestUrl = new URL(req.url || '', 'http://localhost');
              const runtimeEnv = { ...process.env, ...env };
              const action = requestUrl.searchParams.get('action') || '';
              let body: Record<string, string> = {};

              if (req.method === 'POST') {
                const chunks = [];
                for await (const chunk of req) chunks.push(chunk);
                body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
              }

              const result =
                req.method === 'GET' && action === 'list'
                  ? await listAuthorizedStores({
                      env: runtimeEnv,
                      adminCode: requestUrl.searchParams.get('adminCode'),
                    })
                  : req.method === 'GET' && action === 'validate'
                    ? await validateAuthorizedStore(requestUrl.searchParams.get('code'), {
                        env: runtimeEnv,
                      })
                    : req.method === 'POST' && body.action === 'save'
                      ? await saveAuthorizedStore(body, { env: runtimeEnv })
                      : req.method === 'POST' && body.action === 'delete'
                        ? await deleteAuthorizedStore(body.code, {
                            env: runtimeEnv,
                            adminCode: body.adminCode,
                          })
                        : { status: 400, body: { error: 'Operacao invalida.' } };

              res.statusCode = result.status;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify(result.body));
            } catch {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Nao foi possivel consultar os acessos.' }));
            }
          });

          server.middlewares.use('/api/modelos', async (_req, res) => {
            try {
              const result = await listPhoneModels({ env: { ...process.env, ...env } });
              res.statusCode = result.status;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              if (result.status === 200) {
                res.setHeader('Cache-Control', 'public, max-age=300');
              }
              res.end(JSON.stringify(result.body));
            } catch {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Nao foi possivel consultar os modelos.' }));
            }
          });

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
      'import.meta.env.VITE_AI_OUTPAINTING_SERVER_AVAILABLE': JSON.stringify(
        env.AI_OUTPAINTING_SERVER_ENABLED === 'true'
      ),
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
