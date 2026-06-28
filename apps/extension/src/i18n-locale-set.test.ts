import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { locales as runtimeLocales } from './shared/paraglide/runtime';

// Locale-set single-source guard (i18n, design D8). The supported-locale SET
// exists in three places — the inlang project (`project.inlang/settings.json`),
// the generated Paraglide runtime (`locales`), and the catalog filenames. Key
// parity (i18n-parity.test.ts) checks the catalogs' KEYS; this checks the locale
// SET itself, so the three can never silently drift.

const EXPECTED = ['de', 'en', 'es', 'fr', 'ja', 'ko', 'pt-PT', 'ru', 'zh-CN'];

const sorted = (values: readonly string[]): string[] => [...values].sort();

// This test imports the generated runtime (a vite-transformed module), which
// makes `import.meta.url` an `http:` URL — so non-`src` files are resolved from
// the package root via `process.cwd()` (vitest runs from `apps/extension`),
// not `import.meta.url`.
const fromPackageRoot = (relativePath: string): string => resolve(process.cwd(), relativePath);

const inlangLocales = (): string[] =>
  (
    JSON.parse(readFileSync(fromPackageRoot('project.inlang/settings.json'), 'utf-8')) as {
      locales: string[];
    }
  ).locales;

// Paraglide message catalogs are `messages/{locale}.json` (BCP-47 hyphens).
const messageCatalogLocales = (): string[] =>
  readdirSync(fromPackageRoot('messages'))
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.replace(/\.json$/, ''));

// Native manifest catalogs are `_locales/{locale}/messages.json`; Chrome uses
// underscore locale codes, so map them back to the hyphen form for comparison.
const manifestCatalogLocales = (): string[] =>
  readdirSync(fromPackageRoot('public/_locales'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name.replace('_', '-'));

describe('supported-locale set is single-sourced', () => {
  test('matches the expected nine locales', () => {
    expect(sorted(EXPECTED)).toEqual(EXPECTED);
  });

  test('inlang project locales equal the expected set', () => {
    expect(sorted(inlangLocales())).toEqual(EXPECTED);
  });

  test('generated runtime locales equal the expected set', () => {
    expect(sorted(runtimeLocales)).toEqual(EXPECTED);
  });

  test('Paraglide catalog filenames equal the expected set', () => {
    expect(sorted(messageCatalogLocales())).toEqual(EXPECTED);
  });

  test('manifest _locales directories equal the expected set', () => {
    expect(sorted(manifestCatalogLocales())).toEqual(EXPECTED);
  });
});
