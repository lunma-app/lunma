import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { deriveControls } from './derive-controls';

/**
 * Regenerates the gitignored `derived-controls.generated.ts` module from every
 * `src/ui/*.svelte` primitive's current `Props` interface. `registry.ts`
 * imports the generated module (transitively reached from `Story.svelte`, which
 * nearly every `*.stories.svelte` renders), so it must exist before ANY Vite/
 * Vitest config in this package loads story modules — not just
 * `vite.catalog.config.ts`'s dev server/build, but also the plain `vitest run`
 * driven by `vite.config.ts` (e.g. `derive-controls.test.ts`'s
 * `import.meta.glob` over `*.stories.svelte`). Both configs call this as a
 * synchronous, pre-`defineConfig` side effect — the same pattern already used
 * for the font copy in each config.
 */
export function generateDerivedControls(): void {
  const uiDir = fileURLToPath(new URL('../../src/ui/', import.meta.url));
  const entries = readdirSync(uiDir)
    .filter((file) => file.endsWith('.svelte') && !file.includes('.test.'))
    .map((file) => {
      const name = file.replace(/\.svelte$/, '');
      const source = readFileSync(uiDir + file, 'utf8');
      return [name, deriveControls(source)] as const;
    });
  const source = `// AUTO-GENERATED — do not edit by hand.
import type { DerivedControls } from './derive-controls';

export const derivedControls: Record<string, DerivedControls> = ${JSON.stringify(
    Object.fromEntries(entries),
    null,
    2,
  )};
`;
  writeFileSync(fileURLToPath(new URL('./derived-controls.generated.ts', import.meta.url)), source);
}
