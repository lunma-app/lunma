// Launch headed Chromium with the built Lunma extension loaded, for manual
// visual QA — as a normal-feeling dev session (persistent profile, no
// automation banner), landing only on Lunma's new-tab override rather than
// opening any chrome-extension:// page as a tab.
//
// Uses Playwright's bundled Chromium: stable Google Chrome (M137+) disables
// extensions loaded via --load-extension, so the real binary won't load Lunma
// from the command line. To use your real Chrome instead, load dist/ manually
// via chrome://extensions → Developer mode → Load unpacked.
import os from 'node:os';
import path from 'node:path';
import { chromium } from '@playwright/test';

const EXT = path.resolve(process.cwd(), 'apps/extension/dist');
const PROFILE = path.join(os.homedir(), '.lunma-dev-chrome');

const context = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  ignoreDefaultArgs: ['--enable-automation'], // drop the "controlled by test software" banner
  args: [
    `--disable-extensions-except=${EXT}`,
    `--load-extension=${EXT}`,
    '--no-first-run',
    '--no-default-browser-check',
  ],
});

let [worker] = context.serviceWorkers();
if (!worker)
  worker = await context
    .waitForEvent('serviceworker', { timeout: 15000 })
    .catch(() => null);
const id = worker ? new URL(worker.url()).host : '(service worker not detected)';

// Land on Lunma's new-tab override so it's experienced as an installed extension.
const [page] = context.pages();
const tab = page ?? (await context.newPage());
await tab.goto('chrome://newtab/').catch((e) => console.warn('newtab nav:', e.message));

console.log(`\nLunma loaded as an extension. id: ${id}`);
console.log('New-tab override is live. Click the toolbar icon to open the sidebar');
console.log('as a real side panel (openPanelOnActionClick is set).');
console.log('Close the window (or Ctrl+C here) to end the session.\n');

context.on('close', () => process.exit(0));
await new Promise(() => {});
