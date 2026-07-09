import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, test } from '@playwright/test';

const EXT = fileURLToPath(new URL('./../dist', import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'lunma-persist2-'));

async function launch(capture = false) {
  const ctx = await chromium.launchPersistentContext(dir, {
    headless: false,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent('serviceworker');
  if (capture) sw.on('console', (m) => console.log('[sw]', m.text()));
  return { ctx, sw, id: new URL(sw.url()).host };
}

test('capture boot load result on restart', async () => {
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
  const raw = await sw.evaluate(async () =>
    JSON.stringify((await chrome.storage.local.get('lunma.state'))['lunma.state']).slice(0, 600),
  );
  console.log('[persist] RAW stored =', raw);
  await ctx.close();

  ({ ctx, sw, id } = await launch(true));
  await new Promise((r) => setTimeout(r, 3500));
  await ctx.close();
});
