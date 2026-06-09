import { describe, expect, test } from 'vitest';
import { BUILT_IN_ENGINES, buildEngineRegistry, DEFAULT_SEARCH_ENGINE } from './search-engines';

describe('BUILT_IN_ENGINES', () => {
  test('every built-in has a unique id', () => {
    const ids = BUILT_IN_ENGINES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every built-in carries a non-empty keyword, unique across the roster', () => {
    const keywords = BUILT_IN_ENGINES.map((e) => e.keyword);
    for (const keyword of keywords) expect(keyword.trim()).not.toBe('');
    expect(new Set(keywords).size).toBe(keywords.length);
  });

  test('every built-in template contains a single %s placeholder', () => {
    for (const engine of BUILT_IN_ENGINES) {
      expect(engine.urlTemplate).toContain('%s');
      expect(engine.urlTemplate.split('%s')).toHaveLength(2);
    }
  });

  test('every built-in carries a non-empty name', () => {
    for (const engine of BUILT_IN_ENGINES) {
      expect(engine.name.trim()).not.toBe('');
    }
  });

  test('google is present and is the out-of-box default engine', () => {
    expect(BUILT_IN_ENGINES.some((e) => e.id === 'google')).toBe(true);
    expect(DEFAULT_SEARCH_ENGINE.id).toBe('google');
  });
});

describe('buildEngineRegistry', () => {
  test('with no custom engine, returns the built-ins with their fixed keywords', () => {
    const registry = buildEngineRegistry({ customSearchUrl: '', customSearchKeyword: '' });
    expect(registry).toEqual([...BUILT_IN_ENGINES]);
    expect(registry.find((e) => e.id === 'youtube')?.keyword).toBe('yt');
    expect(registry.some((e) => e.id === 'custom')).toBe(false);
  });

  test('a valid custom engine joins the registry with its keyword', () => {
    const registry = buildEngineRegistry({
      customSearchUrl: 'https://kagi.com/search?q=%s',
      customSearchKeyword: 'k',
    });
    const custom = registry.find((e) => e.id === 'custom');
    expect(custom).toEqual({
      id: 'custom',
      name: 'Custom',
      urlTemplate: 'https://kagi.com/search?q=%s',
      keyword: 'k',
    });
  });

  test('a custom template missing %s does not join the registry', () => {
    const registry = buildEngineRegistry({
      customSearchUrl: 'https://kagi.com/search',
      customSearchKeyword: 'k',
    });
    expect(registry.some((e) => e.id === 'custom')).toBe(false);
  });

  test('an empty custom keyword does not join the registry', () => {
    const registry = buildEngineRegistry({
      customSearchUrl: 'https://kagi.com/search?q=%s',
      customSearchKeyword: '   ',
    });
    expect(registry.some((e) => e.id === 'custom')).toBe(false);
  });

  test('a colliding custom keyword is dropped — the built-in wins', () => {
    const registry = buildEngineRegistry({
      customSearchUrl: 'https://kagi.com/search?q=%s',
      customSearchKeyword: 'g', // collides with Google
    });
    // No custom engine joined; `g` still resolves to the built-in Google.
    expect(registry.some((e) => e.id === 'custom')).toBe(false);
    expect(registry.find((e) => e.keyword === 'g')?.id).toBe('google');
  });

  test('collision detection is case-insensitive (G shadows the built-in g)', () => {
    // `resolveEngine` matches keywords case-insensitively, so `G` must collide
    // with `g` — otherwise the custom engine would join and shadow-cycle Google.
    const registry = buildEngineRegistry({
      customSearchUrl: 'https://kagi.com/search?q=%s',
      customSearchKeyword: 'G',
    });
    expect(registry.some((e) => e.id === 'custom')).toBe(false);
  });
});
