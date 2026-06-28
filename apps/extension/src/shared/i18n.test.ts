import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getLocale, initLocale } from './i18n';

// Resolver tests for `initLocale()` (i18n): the `'auto'` sentinel resolves from
// the browser UI language with base-tag mapping and an `en` terminal fallback;
// a stored concrete locale is honoured as-is. The active locale is observed via
// the re-exported `getLocale()` (Paraglide reads the cache `initLocale` seeds).

interface ChromeMock {
  settings: Record<string, unknown> | undefined;
  uiLanguage: string;
}

function installChromeMock(): ChromeMock {
  const mock: ChromeMock = { settings: undefined, uiLanguage: 'en-US' };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: {
      sync: {
        get: vi.fn(async (key: string) =>
          mock.settings === undefined ? {} : { [key]: mock.settings },
        ),
        set: vi.fn(async () => undefined),
      },
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
    i18n: { getUILanguage: () => mock.uiLanguage },
  };
  return mock;
}

let chromeMock: ChromeMock;

beforeEach(() => {
  chromeMock = installChromeMock();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('initLocale() locale resolution', () => {
  test("'auto' (no stored value) + browser de → de", async () => {
    chromeMock.uiLanguage = 'de';
    await initLocale();
    expect(getLocale()).toBe('de');
  });

  test("'auto' + a regional tag maps to the nearest supported locale (pt-BR → pt-PT)", async () => {
    chromeMock.settings = { language: 'auto' };
    chromeMock.uiLanguage = 'pt-BR';
    await initLocale();
    expect(getLocale()).toBe('pt-PT');
  });

  test("'auto' + zh-TW maps to the only supported Chinese variant (zh-CN)", async () => {
    chromeMock.settings = { language: 'auto' };
    chromeMock.uiLanguage = 'zh-TW';
    await initLocale();
    expect(getLocale()).toBe('zh-CN');
  });

  test("'auto' + a fully-qualified supported tag resolves by base (de-DE → de)", async () => {
    chromeMock.uiLanguage = 'de-DE';
    await initLocale();
    expect(getLocale()).toBe('de');
  });

  test("'auto' + an unsupported browser locale falls back to en (th → en)", async () => {
    chromeMock.uiLanguage = 'th';
    await initLocale();
    expect(getLocale()).toBe('en');
  });

  test('a stored explicit locale is honoured over the browser language', async () => {
    chromeMock.settings = { language: 'fr' };
    chromeMock.uiLanguage = 'de';
    await initLocale();
    expect(getLocale()).toBe('fr');
  });
});

describe('service-worker safety (resolver references no window/document/localStorage)', () => {
  // Read the module source and strip comments (the JSDoc legitimately *names*
  // these globals when explaining why they are avoided); the remaining code must
  // not reference them, so the `shared/` bundle is safe to load in the SW. This
  // test imports `./i18n` (a vite-transformed module), which makes
  // `import.meta.url` an `http:` URL — so resolve the source from the package
  // root via `process.cwd()` (vitest runs from `apps/extension`).
  const readCode = (): string =>
    readFileSync(resolve(process.cwd(), 'src/shared/i18n.ts'), 'utf-8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');

  test.each(['window', 'document', 'localStorage'])('does not reference %s', (global) => {
    expect(readCode()).not.toMatch(new RegExp(`\\b${global}\\b`));
  });

  test('resolves via chrome.i18n and navigator only', () => {
    const code = readCode();
    expect(code).toContain('chrome.i18n');
    expect(code).toContain('navigator.language');
  });
});
