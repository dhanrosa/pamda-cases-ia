import { describe, expect, it } from 'vitest';
import { isAiOutpaintingAvailable } from './aiOutpaintingConfig';

describe('feature flags de outpainting', () => {
  it('bloqueia quando a feature flag esta desligada', () => {
    expect(isAiOutpaintingAvailable(false, true)).toBe(false);
  });

  it('bloqueia quando o servidor esta desligado', () => {
    expect(isAiOutpaintingAvailable(true, false)).toBe(false);
  });

  it('libera o prototipo mock sem habilitar o servidor real', () => {
    expect(isAiOutpaintingAvailable(true, false, true)).toBe(true);
  });

  it('libera apenas com as duas travas ativas', () => {
    expect(isAiOutpaintingAvailable(true, true)).toBe(true);
  });
});
