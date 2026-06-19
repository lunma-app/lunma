import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

// Single source of truth (release-versioning): the extension's canonical version
// is `package.json` `version`; crxjs ships `public/manifest.json` `version` to
// Chrome. release-please bumps both in lockstep (its `extra-files` updater), but
// a stray manual edit to one could drift them — this guard fails `pnpm verify`
// (and thus the `verify` CI check) the moment they disagree or stop being a
// strict MAJOR.MINOR.PATCH (the Chrome manifest grammar forbids pre-release /
// build-metadata suffixes). See openspec change `semver-enforcement` D2/D4.
//
// Both files live OUTSIDE `src/` (vitest only discovers `src/**/*.test.ts`), so
// they are read at runtime via `readFileSync` resolved from the package root —
// NOT a static JSON import, which would pull non-`src` files into the tsconfig /
// svelte-check / Biome import graph.
const readVersion = (relativePath: string): unknown => {
  const raw = readFileSync(new URL(relativePath, import.meta.url), 'utf-8');
  return (JSON.parse(raw) as { version?: unknown }).version;
};

const SEMVER = /^\d+\.\d+\.\d+$/;

describe('extension version parity', () => {
  const packageVersion = readVersion('../package.json');
  const manifestVersion = readVersion('../public/manifest.json');

  test('package.json version is a strict MAJOR.MINOR.PATCH semver', () => {
    expect(packageVersion).toMatch(SEMVER);
  });

  test('manifest.json version is a strict MAJOR.MINOR.PATCH semver', () => {
    expect(manifestVersion).toMatch(SEMVER);
  });

  test('package.json and manifest.json versions are equal', () => {
    expect(manifestVersion).toBe(packageVersion);
  });
});
