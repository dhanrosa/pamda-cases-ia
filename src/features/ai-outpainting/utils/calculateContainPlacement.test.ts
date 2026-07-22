import { describe, expect, it } from 'vitest';
import { calculateContainPlacement, calculateCurrentEmptyRegions } from './calculateContainPlacement';

const print = { printWidth: 340, printHeight: 670 };

describe('enquadramento contain e sugestao de IA', () => {
  it.each([
    [1000, 1000, 'quadrada'],
    [1600, 900, 'horizontal 16:9'],
    [1200, 900, 'horizontal 4:3'],
    [900, 1200, 'vertical 3:4'],
  ])('mantem a imagem %s x %s (%s) inteira e sugere IA', (imageWidth, imageHeight) => {
    const result = calculateCurrentEmptyRegions({ imageWidth, imageHeight, ...print, zoomPercent: 100, position: { x: 0, y: 0 } });
    expect(result.bounds.x).toBeGreaterThanOrEqual(0);
    expect(result.bounds.y).toBeGreaterThanOrEqual(0);
    expect(result.bounds.x + result.bounds.width).toBeLessThanOrEqual(print.printWidth + 0.001);
    expect(result.bounds.y + result.bounds.height).toBeLessThanOrEqual(print.printHeight + 0.001);
    expect(result.needsOutpainting).toBe(true);
  });

  it('nao sugere IA para proporcao proxima dentro da tolerancia', () => {
    const result = calculateCurrentEmptyRegions({ imageWidth: 507, imageHeight: 1000, ...print, zoomPercent: 100, position: { x: 0, y: 0 } });
    expect(result.needsOutpainting).toBe(false);
  });

  it('atualiza a sugestao depois que o zoom manual preenche a area', () => {
    const initial = calculateCurrentEmptyRegions({ imageWidth: 900, imageHeight: 1200, ...print, zoomPercent: 100, position: { x: 0, y: 0 } });
    const enlarged = calculateCurrentEmptyRegions({ imageWidth: 900, imageHeight: 1200, ...print, zoomPercent: 150, position: { x: 0, y: 0 } });
    expect(initial.needsOutpainting).toBe(true);
    expect(enlarged.needsOutpainting).toBe(false);
  });

  it('restaura matematicamente o contain centralizado', () => {
    expect(calculateContainPlacement(1000, 1000, print.printWidth, print.printHeight)).toEqual({
      scale: 0.34, width: 340, height: 340, x: 0, y: 165,
    });
  });

  it('recalcula quando as dimensoes da area do modelo mudam', () => {
    const first = calculateContainPlacement(1000, 1000, 340, 670);
    const second = calculateContainPlacement(1000, 1000, 300, 600);
    expect(second.width).not.toBe(first.width);
    expect(second.y).not.toBe(first.y);
  });
});
