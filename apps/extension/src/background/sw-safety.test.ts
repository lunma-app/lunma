import { execSync } from 'node:child_process';
import { describe, expect, test } from 'vitest';

/**
 * The service worker has no `document`. A DYNAMIC `import()` anywhere in its
 * reachable graph makes Vite emit its `__vitePreload` helper, which reaches for
 * `document.getElementsByTagName('link')` — and that crashes SW boot outright
 * with `document is not defined`, before any Lunma code runs.
 *
 * This guards the source, not the bundle, because the failure is invisible until
 * the extension is actually loaded in Chrome.
 */
describe('service-worker safety', () => {
  test('no dynamic import() in background/ or shared/ (it breaks SW boot)', () => {
    // Only VALUE-position dynamic imports matter. `import('./x').Type` is a type
    // position, erased at compile, and must not trip this.
    const out = execSync(
      "grep -rnE '(await|return|=|\\()[[:space:]]*import\\(' src/background src/shared --include='*.ts' " +
        "| grep -v '\\.test\\.' | grep -v 'src/shared/paraglide/' | grep -vE ':[[:space:]]*import\\(' || true",
      { encoding: 'utf8' },
    ).trim();
    expect(out, `dynamic import() found — Vite's preload helper touches document:\n${out}`).toBe(
      '',
    );
  });
});
