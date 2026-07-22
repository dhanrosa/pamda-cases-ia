import { describe, expect, it } from 'vitest';
import { buildImageEditRequestParams, processAiOutpainting } from './aiOutpainting.js';

describe('buildImageEditRequestParams', () => {
  const required = {
    image: { name: 'image.png' },
    mask: { name: 'mask.png' },
    prompt: 'continue o cenario',
    size: '1024x1728',
  };

  it('remove completamente input_fidelity para gpt-image-2', () => {
    const params = buildImageEditRequestParams({ model: 'gpt-image-2', ...required });
    expect(params).not.toHaveProperty('input_fidelity');
    expect(Object.keys(params)).toEqual(['model', 'image', 'mask', 'prompt', 'size', 'quality', 'output_format']);
  });

  it('adiciona input_fidelity high somente para gpt-image-1', () => {
    const params = buildImageEditRequestParams({ model: 'gpt-image-1', ...required });
    expect(params.input_fidelity).toBe('high');
  });

  it('nao envia input_fidelity para modelos desconhecidos', () => {
    const params = buildImageEditRequestParams({ model: 'modelo-futuro', ...required });
    expect(params).not.toHaveProperty('input_fidelity');
  });
});

describe('processAiOutpainting', () => {
  it('bloqueia quando o servidor esta desligado', async () => {
    const result = await processAiOutpainting({ env: { AI_OUTPAINTING_SERVER_ENABLED: 'false' } });
    expect(result.status).toBe(503);
    expect(result.body.code).toBe('SERVER_DISABLED');
  });

  it('bloqueia quando a chave nao esta configurada', async () => {
    const result = await processAiOutpainting({ env: { AI_OUTPAINTING_SERVER_ENABLED: 'true', OPENAI_IMAGE_MODEL: 'gpt-image-2' } });
    expect(result.body.code).toBe('MISSING_API_KEY');
  });

  it('rejeita formato nao aceito antes de chamar a API', async () => {
    const result = await processAiOutpainting({
      env: { AI_OUTPAINTING_SERVER_ENABLED: 'true', OPENAI_API_KEY: 'test', OPENAI_IMAGE_MODEL: 'gpt-image-2' },
      image: { mimetype: 'image/gif', size: 10, buffer: Buffer.from('x') },
      mask: { mimetype: 'image/png', size: 10, buffer: Buffer.from('x') },
    });
    expect(result.status).toBe(415);
    expect(result.body.code).toBe('UNSUPPORTED_FORMAT');
  });
});
