import { afterEach, describe, expect, test } from 'vitest';
import { applyDensityToDocument } from './surface-boot';

describe('applyDensityToDocument', () => {
  afterEach(() => {
    delete document.documentElement.dataset.density;
  });

  test('normal: removes the density attribute', () => {
    document.documentElement.dataset.density = 'compact';
    applyDensityToDocument('normal');
    expect(document.documentElement.dataset.density).toBeUndefined();
  });

  test('compact: sets density attribute to "compact"', () => {
    applyDensityToDocument('compact');
    expect(document.documentElement.dataset.density).toBe('compact');
  });

  test('comfort: sets density attribute to "comfort"', () => {
    applyDensityToDocument('comfort');
    expect(document.documentElement.dataset.density).toBe('comfort');
  });
});
