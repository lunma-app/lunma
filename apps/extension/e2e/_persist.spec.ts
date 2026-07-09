import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Worker } from '@playwright/test';
import { chromium, test } from '@playwright/test';

const EXT = fileURLToPath(new URL('./../dist', import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'lunma-persist-'));

async function launch() {
  const ctx = await chromium.launchPersistentContext(dir, {
    headless: false,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker');
  return { ctx, sw, id: new URL(sw.url()).host };
}

type StoredState = {
  schemaVersion?: number;
  spaces?: Array<{ name?: string }>;
  state?: { schemaVersion?: number; spaces?: Array<{ name?: string }> };
};

const spacesInStorage = (sw: Worker) =>
  sw.evaluate(async () => {
    const got = await chrome.storage.local.get('lunma.state');
    const rec = got['lunma.state'] as StoredState | undefined;
    const spaces = rec?.state?.spaces ?? rec?.spaces ?? [];
    return {
      schemaVersion: rec?.schemaVersion ?? rec?.state?.schemaVersion,
      names: spaces.map((s) => s.name),
    };
  });

test('a space without pins survives a restart', async () => {
  let { ctx, sw, id } = await launch();
  await new Promise((r) => setTimeout(r, 2500));
  const page = await ctx.newPage();
  await page.goto(`chrome-extension://${id}/src/sidebar/index.html`);
  const windowId = await page.evaluate(async () => (await chrome.windows.getCurrent()).id);
  await page.evaluate(
    (wid) =>
      chrome.runtime.sendMessage({
        type: 'lunma/command',
        id: 'v:1',
        cmd: {
          kind: 'createSpace',
          payload: { name: 'Reading', color: 'blue', icon: 'star', windowId: wid },
        },
      }),
    windowId,
  );
  await new Promise((r) => setTimeout(r, 1500));
  console.log('[persist] storage BEFORE restart =', JSON.stringify(await spacesInStorage(sw)));
  await ctx.close();

  ({ ctx, sw, id } = await launch());
  await new Promise((r) => setTimeout(r, 3000)); // boot + reconcile
  console.log('[persist] storage AFTER restart  =', JSON.stringify(await spacesInStorage(sw)));
  await ctx.close();
});
