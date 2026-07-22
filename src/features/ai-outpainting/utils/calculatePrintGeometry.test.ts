import { describe, expect, it } from 'vitest';
import { calculatePrintGeometry } from './calculatePrintGeometry';
import { isMaskPixelEditable } from './buildOutpaintingMask';

describe('calculatePrintGeometry', () => {
  it('posiciona uma foto quadrada no centro da tela vertical', () => {
    const result = calculatePrintGeometry(1000, 1000, 1024, 1536, { x: 0, y: 0, scale: 1, rotation: 0 });
    expect(result.imageWidth).toBe(1024);
    expect(result.imageHeight).toBe(1024);
    expect(result.imageX).toBe(0);
    expect(result.imageY).toBe(256);
    expect(result.direction).toBe('vertical');
  });

  it('aplica deslocamento sem alterar a proporcao', () => {
    const result = calculatePrintGeometry(1600, 900, 1024, 1536, { x: 20, y: -40, scale: 0.8, rotation: 0 });
    expect(result.imageWidth / result.imageHeight).toBeCloseTo(1600 / 900);
    expect(result.imageX).toBeCloseTo(122.4);
    expect(result.hasEmptyRegions).toBe(true);
  });

  it('identifica pixels externos como editaveis e preserva a foto', () => {
    const geometry = calculatePrintGeometry(1000, 1000, 1024, 1536, { x: 0, y: 0, scale: 1, rotation: 0 });
    expect(isMaskPixelEditable(geometry, 512, 100)).toBe(true);
    expect(isMaskPixelEditable(geometry, 512, 512)).toBe(false);
    expect(isMaskPixelEditable(geometry, 512, geometry.imageY + 2)).toBe(true);
    expect(isMaskPixelEditable(geometry, 512, geometry.imageY + 6)).toBe(false);
  });

  it.each([
    [1000, 1000, 'quadrada'],
    [1600, 900, 'horizontal'],
    [900, 1200, 'vertical curta'],
  ])('protege a fotografia %s x %s (%s) e edita somente os vazios', (width, height) => {
    const geometry = calculatePrintGeometry(width, height, 1024, 1536, {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
    });
    const photoCenterX = geometry.imageX + geometry.imageWidth / 2;
    const photoCenterY = geometry.imageY + geometry.imageHeight / 2;

    expect(geometry.hasEmptyRegions).toBe(true);
    expect(isMaskPixelEditable(geometry, photoCenterX, photoCenterY)).toBe(false);

    const emptySamples = [
      geometry.empty.top > 0 && [512, geometry.empty.top / 2],
      geometry.empty.bottom > 0 && [512, 1536 - geometry.empty.bottom / 2],
      geometry.empty.left > 0 && [geometry.empty.left / 2, 768],
      geometry.empty.right > 0 && [1024 - geometry.empty.right / 2, 768],
    ].filter(Boolean) as number[][];

    expect(emptySamples.length).toBeGreaterThan(0);
    emptySamples.forEach(([x, y]) => expect(isMaskPixelEditable(geometry, x, y)).toBe(true));
  });

  it('mantem as dimensoes configuradas para imagem e mascara', () => {
    const geometry = calculatePrintGeometry(800, 600, 1024, 1536, { x: 0, y: 0, scale: 1, rotation: 0 });
    expect([geometry.canvasWidth, geometry.canvasHeight]).toEqual([1024, 1536]);
  });
});
