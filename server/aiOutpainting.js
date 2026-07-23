import OpenAI, { toFile } from 'openai';
import sharp from 'sharp';
import { validateAuthorizedStore } from './storeAccessSheet.js';

export const AI_MAX_FILE_BYTES = 10 * 1024 * 1024;
export const AI_ACCEPTED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
export const AI_FINAL_SIZE = { width: 816, height: 1744 };

const BASE_PROMPT = `Expanda naturalmente o cenario da fotografia para preencher somente as areas transparentes indicadas pela mascara.
Preserve integralmente a pessoa, o rosto, o cabelo, a expressao, as roupas, os animais, os objetos principais e todos os pixels da fotografia original.
Nao altere identidade, idade, caracteristicas fisicas, formato do rosto, cor da pele, cabelo, roupas ou acessorios.
Continue o fundo, a iluminacao, a perspectiva, as cores, as sombras, a profundidade e a textura da fotografia original.
Nao adicione novas pessoas, rostos, maos, animais, textos, logotipos, marcas-d'agua, molduras ou objetos desnecessarios.
O resultado deve parecer uma continuacao natural da fotografia original e ser apropriado para impressao vertical em uma capinha de celular.`;

const DIRECTION_PROMPTS = {
  above: 'Continue o cenario principalmente para cima.',
  below: 'Continue o cenario principalmente para baixo.',
  vertical: 'Continue o cenario acima e abaixo da fotografia.',
  sides: 'Continue o cenario pelas laterais da fotografia.',
  multiple: 'Continue o cenario em todas as direcoes transparentes indicadas.',
};

const failure = (status, code, error) => ({ status, body: { success: false, code, error } });
const generationByStore = new Map();

const sanitizeProviderMessage = (message) => String(message || '')
  .replace(/sk-[a-zA-Z0-9_-]+/g, '[credencial removida]')
  .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [credencial removida]')
  .replace(/[\r\n]+/g, ' ')
  .slice(0, 280);

export const buildImageEditRequestParams = ({ model, image, mask, prompt, size }) => ({
  model,
  image,
  mask,
  prompt,
  size,
  quality: 'medium',
  output_format: 'png',
  ...(model === 'gpt-image-1' ? { input_fidelity: 'high' } : {}),
});

export async function authorizeAiOutpainting({ env = process.env, storeCode }) {
  if (env.AI_OUTPAINTING_SERVER_ENABLED !== 'true') {
    return failure(503, 'SERVER_DISABLED', 'A ferramenta de IA esta desativada neste ambiente.');
  }
  const authorization = await validateAuthorizedStore(storeCode, { env });
  if (authorization.status !== 200 || !authorization.body?.store) {
    return failure(401, 'UNAUTHORIZED', 'Acesso de loja invalido ou expirado.');
  }
  const key = String(authorization.body.store.code);
  const lastGeneration = generationByStore.get(key) || 0;
  if (Date.now() - lastGeneration < 30_000) {
    return failure(429, 'RATE_LIMITED', 'Aguarde antes de solicitar uma nova geracao.');
  }
  generationByStore.set(key, Date.now());
  return null;
}

const classifyOpenAiError = (error) => {
  const status = Number(error?.status || 500);
  const code = String(error?.code || '').toLowerCase();
  const parameter = String(error?.param || '').toLowerCase();
  const rawMessage = String(error?.message || '').toLowerCase();
  if (status === 429) return failure(429, 'RATE_LIMITED', 'O limite de uso foi atingido. Aguarde e tente novamente.');
  if (status === 401 || code.includes('api_key')) {
    return failure(401, 'MISSING_API_KEY', 'A OpenAI recusou a credencial configurada no servidor.');
  }
  if (status === 400 && (parameter.includes('size') || rawMessage.includes('size') || rawMessage.includes('dimension'))) {
    return failure(400, 'DIMENSION_MISMATCH', 'A OpenAI recusou as dimensoes tecnicas solicitadas para a geracao.');
  }
  if (status === 400 && (parameter.includes('mask') || rawMessage.includes('mask'))) {
    return failure(400, 'INVALID_MASK', 'A OpenAI recusou a mascara preparada para o preenchimento.');
  }
  if (status === 400 && (code.includes('moderation') || code.includes('safety'))) {
    return failure(400, 'SAFETY_BLOCKED', 'O resultado foi bloqueado pelos filtros de seguranca.');
  }
  if (error?.name === 'AbortError' || code.includes('timeout')) {
    return failure(504, 'NETWORK_ERROR', 'O servico demorou demais para responder. Tente novamente.');
  }
  if (status === 400) {
    const safeDetail = sanitizeProviderMessage(error?.message);
    return failure(
      400,
      'INVALID_REQUEST',
      safeDetail
        ? `A OpenAI recusou os parametros: ${safeDetail}`
        : 'A OpenAI recusou os parametros da geracao.'
    );
  }
  return failure(502, 'UNKNOWN', 'Nao foi possivel completar a imagem agora. Tente novamente.');
};

export async function processAiOutpainting({ env = process.env, image, mask, direction = 'multiple' }) {
  if (env.AI_OUTPAINTING_SERVER_ENABLED !== 'true') {
    return failure(503, 'SERVER_DISABLED', 'A ferramenta de IA esta desativada neste ambiente.');
  }
  if (!env.OPENAI_API_KEY) return failure(503, 'MISSING_API_KEY', 'O servico de imagem ainda nao foi configurado.');
  if (!env.OPENAI_IMAGE_MODEL) return failure(503, 'MISSING_API_KEY', 'O modelo de imagem ainda nao foi configurado.');
  if (!image || !mask) return failure(400, 'INVALID_MASK', 'Envie a imagem e a mascara.');
  if (!AI_ACCEPTED_MIME_TYPES.has(image.mimetype) || mask.mimetype !== 'image/png') {
    return failure(415, 'UNSUPPORTED_FORMAT', 'Use PNG, JPEG ou WebP; a mascara deve ser PNG.');
  }
  if (image.size > AI_MAX_FILE_BYTES || mask.size > AI_MAX_FILE_BYTES) {
    return failure(413, 'FILE_TOO_LARGE', 'O arquivo e muito grande. O limite e 10 MB.');
  }

  let processingStage = 'metadata';
  try {
    const [imageMetadata, maskMetadata] = await Promise.all([
      sharp(image.buffer).metadata(),
      sharp(mask.buffer).metadata(),
    ]);
    if (!imageMetadata.width || !imageMetadata.height || !maskMetadata.width || !maskMetadata.height) {
      return failure(400, 'CORRUPT_IMAGE', 'A imagem parece estar corrompida.');
    }
    if (imageMetadata.width !== maskMetadata.width || imageMetadata.height !== maskMetadata.height) {
      return failure(400, 'DIMENSION_MISMATCH', 'A imagem e a mascara possuem dimensoes diferentes.');
    }
    if (imageMetadata.width !== AI_FINAL_SIZE.width || imageMetadata.height !== AI_FINAL_SIZE.height) {
      return failure(400, 'DIMENSION_MISMATCH', 'A arte generativa deve possuir exatamente 816 x 1744 pixels.');
    }
    if (!maskMetadata.hasAlpha) return failure(400, 'INVALID_MASK', 'A mascara precisa possuir canal alfa.');

    const workWidth = Math.ceil(imageMetadata.width / 16) * 16;
    const workHeight = Math.ceil(imageMetadata.height / 16) * 16;
    const left = Math.floor((workWidth - imageMetadata.width) / 2);
    const top = Math.floor((workHeight - imageMetadata.height) / 2);
    const right = workWidth - imageMetadata.width - left;
    const bottom = workHeight - imageMetadata.height - top;
    const transparentPadding = { top, bottom, left, right, background: { r: 0, g: 0, b: 0, alpha: 0 } };
    const [normalizedImage, normalizedMask] = await Promise.all([
      sharp(image.buffer).ensureAlpha().extend(transparentPadding).png().toBuffer(),
      sharp(mask.buffer).ensureAlpha().extend(transparentPadding).png().toBuffer(),
    ]);
    processingStage = 'openai-request';
    const model = String(env.OPENAI_IMAGE_MODEL).trim() || 'gpt-image-2';
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: 90_000, maxRetries: 1 });
    const requestParams = buildImageEditRequestParams({
      model,
      image: await toFile(normalizedImage, 'image.png', { type: 'image/png' }),
      mask: await toFile(normalizedMask, 'mask.png', { type: 'image/png' }),
      prompt: `${BASE_PROMPT}\n${DIRECTION_PROMPTS[direction] || DIRECTION_PROMPTS.multiple}`,
      size: `${workWidth}x${workHeight}`,
    });
    const response = await client.images.edit(requestParams);
    processingStage = 'openai-response';
    const base64 = response.data?.[0]?.b64_json;
    if (!base64) return failure(502, 'EMPTY_RESPONSE', 'O servico nao devolveu uma imagem. Tente novamente.');
    const generatedBuffer = Buffer.from(base64, 'base64');
    const generatedMetadata = await sharp(generatedBuffer).metadata();
    if (
      generatedMetadata.width !== workWidth ||
      generatedMetadata.height !== workHeight
    ) {
      return failure(
        502,
        'DIMENSION_MISMATCH',
        'A geracao retornou dimensoes diferentes da area de impressao. Gere novamente.'
      );
    }

    // O retorno da OpenAI ja e a composicao completa. Nao sobrepor novamente
    // a fotografia original evita emendas e mantem uma unica camada de resultado.
    processingStage = 'finalization';
    const finalResult = await sharp(generatedBuffer)
      .png()
      .toBuffer();
    return { status: 200, body: { success: true, mimeType: 'image/png', imageBase64: finalResult.toString('base64') } };
  } catch (error) {
    console.error('Falha segura no outpainting:', { stage: processingStage, status: error?.status, code: error?.code, type: error?.name });
    if (String(error?.message || '').toLowerCase().includes('unsupported image format')) {
      return failure(400, 'CORRUPT_IMAGE', 'A imagem parece estar corrompida.');
    }
    if (processingStage === 'finalization') {
      return failure(500, 'COMPOSITION_FAILED', 'A imagem foi gerada, mas houve falha ao preparar o arquivo final em 816 x 1744 pixels.');
    }
    return classifyOpenAiError(error);
  }
}
