import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

// Catalog completeness guard (i18n, design D7). Two independent message catalogs
// — Paraglide's `messages/{locale}.json` (in-app UI strings) and the native
// `_locales/{locale}/messages.json` (manifest / store listing) — must each carry
// the SAME key set as their `en` source, with no empty values. A missing or
// blank key in any locale fails `pnpm verify` the moment it drifts.
//
// All catalogs live OUTSIDE `src/` (vitest only discovers `src/**/*.test.ts`),
// so they are read at runtime via `readFileSync` resolved from the package root
// — NOT a static JSON import, which would pull non-`src` files into the tsconfig
// / svelte-check / Biome import graph (mirrors version-parity.test.ts). The reads
// happen inside the `describe` bodies (not module top-level) so `import.meta.url`
// is a resolved `file:` URL, matching version-parity.test.ts.

const readJson = (relativePath: string): Record<string, unknown> =>
  JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf-8'));

/** The supported locales, single-sourced from the inlang project settings. */
const loadProject = (): { baseLocale: string; locales: string[] } =>
  readJson('../project.inlang/settings.json') as { baseLocale: string; locales: string[] };

// Inlang message-format catalogs may carry a leading `$schema` marker that is
// not a message — exclude `$`-prefixed keys when comparing the message set.
const messageKeys = (catalog: Record<string, unknown>): string[] =>
  Object.keys(catalog)
    .filter((key) => !key.startsWith('$'))
    .sort();

// The `{token}` interpolation placeholders in a message value (string or the
// inlang variant array form). A translation that drops or renames a placeholder
// silently breaks interpolation (e.g. the overlay's `{engine}` replace no-ops),
// so every locale must carry the same placeholder set as `en`.
const placeholders = (value: unknown): string[] =>
  [...new Set(JSON.stringify(value).match(/\{(\w+)\}/g) ?? [])].sort();

describe('Paraglide message catalogs (messages/{locale}.json)', () => {
  const { baseLocale, locales } = loadProject();
  const baseKeys = messageKeys(readJson(`../messages/${baseLocale}.json`));

  test.each(locales)('%s has the same message keys as the base locale', (locale) => {
    expect(messageKeys(readJson(`../messages/${locale}.json`))).toEqual(baseKeys);
  });

  test.each(locales)('%s has no empty message values', (locale) => {
    const catalog = readJson(`../messages/${locale}.json`);
    for (const key of messageKeys(catalog)) {
      expect(catalog[key], `messages/${locale}.json → ${key}`).not.toBe('');
    }
  });

  test.each(locales)('%s preserves every {token} placeholder from the base locale', (locale) => {
    const base = readJson(`../messages/${baseLocale}.json`);
    const catalog = readJson(`../messages/${locale}.json`);
    for (const key of baseKeys) {
      expect(placeholders(catalog[key]), `messages/${locale}.json → ${key}`).toEqual(
        placeholders(base[key]),
      );
    }
  });
});

describe('Native manifest catalogs (_locales/{locale}/messages.json)', () => {
  const { baseLocale, locales } = loadProject();

  // Chrome `_locales` subdirectories use underscore locale codes (`zh_CN`), not
  // the BCP-47 hyphens Paraglide uses — map before resolving paths. Chrome has no
  // bare `pt` in its manifest-locale enum, so the region-neutral `pt` app locale
  // ships as both `pt_BR` and `pt_PT` on disk (byte-identical, asserted in
  // i18n-locale-set.test.ts); this parity check only needs to read one of them.
  const CHROME_DIR_OVERRIDES: Record<string, string> = { pt: 'pt_PT' };
  const chromeDir = (locale: string): string =>
    CHROME_DIR_OVERRIDES[locale] ?? locale.replace('-', '_');

  type ChromeMessage = { message?: unknown };
  const readMessages = (locale: string): Record<string, ChromeMessage> =>
    readJson(`../public/_locales/${chromeDir(locale)}/messages.json`) as Record<
      string,
      ChromeMessage
    >;

  const baseKeys = Object.keys(readMessages(baseLocale)).sort();

  test.each(locales)('%s has the same message keys as the base locale', (locale) => {
    expect(Object.keys(readMessages(locale)).sort()).toEqual(baseKeys);
  });

  test.each(locales)('%s has no empty message strings', (locale) => {
    const catalog = readMessages(locale);
    for (const key of Object.keys(catalog)) {
      expect(catalog[key]?.message, `_locales/${chromeDir(locale)} → ${key}`).toBeTruthy();
    }
  });
});
