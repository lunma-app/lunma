import { afterEach, describe, expect, test } from 'vitest';
import { applyDensityToDocument, applyThemeToDocument } from './surface-boot';

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

describe('applyThemeToDocument', () => {
  afterEach(() => {
    delete document.documentElement.dataset.theme;
    document.documentElement.style.colorScheme = '';
  });

  test('dark: removes the theme attribute and sets color-scheme dark', () => {
    document.documentElement.dataset.theme = 'light';
    applyThemeToDocument('dark');
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  test('light: sets the theme attribute and color-scheme light', () => {
    applyThemeToDocument('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });
});
