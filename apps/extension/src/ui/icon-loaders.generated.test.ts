import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { ICON_NAMES } from '../shared/icon-names';
import { iconLoaders } from './icon-loaders.generated';

/**
 * Guards the generated icon-loader allowlist. The lucide-name lookup
 * and literal-extraction below intentionally re-implement
 * scripts/gen-icon-loaders.mjs: two independent derivations that must agree catch
 * a stale committed file. If a test here fails, run `pnpm gen:icons`.
 */

const srcDir = join(dirname(fileURLToPath(import.meta.url)), '..'); // .../src

/** Every real lucide icon name on disk (resolved via Node, pnpm-hoist-safe). */
function realLucideNames(): Set<string> {
  const require = createRequire(import.meta.url);
  const iconsDir = dirname(require.resolve('@lucide/svelte/icons/anchor'));
  return new Set(
    readdirSync(iconsDir)
      .filter((f) => f.endsWith('.svelte'))
      .map((f) => f.slice(0, -'.svelte'.length)),
  );
}

/** Shippable source files (excludes generated output and tests — neither ships). */
function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (
      /\.(svelte|ts)$/.test(entry.name) &&
      !entry.name.endsWith('.generated.ts') &&
      !/\.test\.(ts|svelte)$/.test(entry.name)
    ) {
      out.push(p);
    }
  }
  return out;
}

/** Icon-name string literals reachable in source — mirrors the generator. */
function sourceLiterals(): Set<string> {
  const found = new Set<string>();
  const patterns = [
    /\bname\s*=\s*["']([a-z][a-z0-9-]*)["']/g, // <Icon name="x">
    /\b(?:name|icon|leadingIcon)=\{\s*["']([a-z][a-z0-9-]*)["']/g, // name={'x'} / icon={'x' as IconName}
    /\b(?:icon|leadingIcon)\s*[:=]\s*["']([a-z][a-z0-9-]*)["']/g, // icon: 'x' / icon="x"
  ];
  const ternary = /\?\s*["']([a-z][a-z0-9-]*)["']\s*:\s*["']([a-z][a-z0-9-]*)["']/g; // cond ? 'x' : 'y'
  for (const file of walk(srcDir)) {
    const text = readFileSync(file, 'utf8');
    for (const re of patterns) {
      for (const m of text.matchAll(re)) {
        if (m[1]) found.add(m[1]);
      }
    }
    for (const m of text.matchAll(ternary)) {
      if (m[1]) found.add(m[1]);
      if (m[2]) found.add(m[2]);
    }
  }
  return found;
}

const keys = Object.keys(iconLoaders);
const keySet = new Set(keys);

describe('icon-loaders.generated', () => {
  test('covers every curated ICON_NAMES entry — the picker can never blank', () => {
    expect(ICON_NAMES.filter((n) => !keySet.has(n))).toEqual([]);
  });

  test('covers every icon-name literal reachable in source', () => {
    const real = realLucideNames();
    const reachable = [...sourceLiterals()].filter((n) => real.has(n));
    expect(reachable.filter((n) => !keySet.has(n))).toEqual([]);
  });

  test('contains no junk — every loader resolves to a real lucide icon', () => {
    const real = realLucideNames();
    expect(keys.filter((n) => !real.has(n))).toEqual([]);
  });

  test('is fresh: keys equal the sorted, de-duplicated allowlist (run `pnpm gen:icons`)', () => {
    const real = realLucideNames();
    const expected = [...new Set([...ICON_NAMES, ...sourceLiterals()])]
      .filter((n) => real.has(n))
      .sort();
    expect(keys).toEqual(expected);
  });
});
