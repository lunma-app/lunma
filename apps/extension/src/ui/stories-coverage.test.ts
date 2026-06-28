import { describe, expect, it } from 'vitest';

// Component-catalog coverage guard (component-catalog D6 / "Every primitive is
// guaranteed a story"). Globs both sets by KEY only — the story modules are
// never executed (no `@/ui` transform enters the test bundle), we only read
// filenames — and asserts parity so `pnpm verify` fails when a `src/ui`
// primitive lacks its `catalog/stories/ui/<Name>.stories.svelte`.
const primitiveModules = import.meta.glob('./*.svelte');
const storyModules = import.meta.glob('../../catalog/stories/ui/*.stories.svelte');

/** `src/ui/*.svelte` primitive names, excluding any `*.test.*` fixture
 * (`*.test.harness.svelte` today, and any future `*.test.svelte`). */
function primitiveNames(): string[] {
  return Object.keys(primitiveModules)
    .map((path) => path.replace(/^.*\//, '').replace(/\.svelte$/, ''))
    .filter((name) => !name.includes('.test.'))
    .sort();
}

/** `catalog/stories/ui/<Name>.stories.svelte` → `<Name>`. */
function storyNames(): string[] {
  return Object.keys(storyModules)
    .map((path) => path.replace(/^.*\//, '').replace(/\.stories\.svelte$/, ''))
    .sort();
}

describe('component catalog story coverage', () => {
  it('enumerates a non-empty primitive set (sanity)', () => {
    expect(primitiveNames().length).toBeGreaterThan(0);
  });

  it('every src/ui primitive has a catalog story', () => {
    const stories = new Set(storyNames());
    const missing = primitiveNames().filter((name) => !stories.has(name));
    expect(missing, `src/ui primitives missing a catalog story: ${missing.join(', ')}`).toEqual([]);
  });

  it('every catalog story maps to a src/ui primitive', () => {
    const primitives = new Set(primitiveNames());
    const orphans = storyNames().filter((name) => !primitives.has(name));
    expect(orphans, `catalog stories with no matching primitive: ${orphans.join(', ')}`).toEqual(
      [],
    );
  });
});
