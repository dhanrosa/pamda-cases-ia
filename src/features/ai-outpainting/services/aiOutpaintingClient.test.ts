import { afterEach, describe, expect, it, vi } from 'vitest';
import { findOpaqueBounds, requestOutpainting } from './aiOutpaintingClient';

describe('requestOutpainting em modo mock', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('simula o carregamento sem chamar fetch nem o endpoint real', async () => {
    const fetchSpy = vi.fn();
    const timeoutSpy = vi.fn((callback: () => void) => {
      callback();
      return 1;
    });
    const createObjectUrlSpy = vi.fn(() => 'blob:mock-result');

    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('window', { setTimeout: timeoutSpy });
    vi.stubGlobal('URL', { createObjectURL: createObjectUrlSpy });

    const image = new File(['base'], 'base.png', { type: 'image/png' });
    const mask = new File(['mask'], 'mask.png', { type: 'image/png' });
    const result = await requestOutpainting({
      image,
      mask,
      direction: 'vertical',
      storeCode: 'mock-store',
      mock: true,
    });

    expect(result).toBe('blob:mock-result');
    expect(timeoutSpy).toHaveBeenCalled();
    expect(createObjectUrlSpy).toHaveBeenCalledWith(image);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('localiza somente a regiao ocupada pela foto na imagem-base', () => {
    const pixels = new Uint8ClampedArray(4 * 4 * 4);
    const markOpaque = (x: number, y: number) => {
      pixels[(y * 4 + x) * 4 + 3] = 255;
    };
    markOpaque(1, 1);
    markOpaque(2, 1);
    markOpaque(1, 2);
    markOpaque(2, 2);

    expect(findOpaqueBounds(pixels, 4, 4)).toEqual({ x: 1, y: 1, width: 2, height: 2 });
  });
});
