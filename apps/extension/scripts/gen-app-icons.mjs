// Generate the extension's manifest icon set (16 / 32 / 48 / 128 px) from the
// on-brand Lunma mark — the "alcove arch + ember" the site favicon already uses
// (canonical source: apps/site/static/favicon.svg).
//
// Why a script (not committed PNGs only): the brand doc lists this manifest set as a
// pending asset, and the mark is a gradient SVG that must rasterise faithfully. We
// render it with the Chromium that ships with @playwright/test (no extra dep, and a
// real browser renders the radial/linear gradients exactly), then screenshot at each
// pixel size into public/icons/.
//
// Small-size rule (§5): at 16px the arch detail + glow blur muddy into a smudge, so
// the 16px variant drops them and keeps a single warm ember dot on the dark tile.
//
// Run: `node scripts/gen-app-icons.mjs` (from apps/extension). Not wired into the
// build — the source is static, so regenerate only when the mark changes.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(here, '../public/icons');

// Brand colours (from apps/site/static/favicon.svg).
const BG = '#201b15'; // dark warm substrate (matches brand --bg)
const ARCH = '#e0a24f'; // lit alcove arch stroke

/**
 * The full mark: dark rounded tile, the alcove arch cradling the ember, and the
 * ember + its hue-glow halo. Authored on a 32-unit grid (the favicon's), scaled to
 * any pixel size by the width/height attrs. `id` namespaces the gradients so two
 * inlined sizes never collide.
 */
function fullSvg(px, id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 32 32" fill="none">
  <defs>
    <radialGradient id="${id}-glow" cx="50%" cy="56%" r="50%">
      <stop offset="0%" stop-color="#f2b65e" stop-opacity="0.7" />
      <stop offset="58%" stop-color="#f2b65e" stop-opacity="0.16" />
      <stop offset="100%" stop-color="#f2b65e" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="${id}-ember" x1="16" y1="12" x2="16" y2="22" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffce7a" />
      <stop offset="100%" stop-color="#e09a3f" />
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8.5" fill="${BG}" />
  <path d="M8.5 25.5 V14.5 a7.5 7.5 0 0 1 15 0 V25.5" fill="none"
    stroke="${ARCH}" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round" />
  <circle cx="16" cy="17" r="10" fill="url(#${id}-glow)" />
  <circle cx="16" cy="17" r="4.6" fill="url(#${id}-ember)" />
</svg>`;
}

/**
 * The 16px variant: a single warm ember dot (centred) with a soft halo on the dark
 * tile — arch + arch-glow dropped so the favicon stays a recognisable point of light.
 */
function miniSvg(px, id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 32 32" fill="none">
  <defs>
    <radialGradient id="${id}-glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#f2b65e" stop-opacity="0.7" />
      <stop offset="55%" stop-color="#f2b65e" stop-opacity="0.16" />
      <stop offset="100%" stop-color="#f2b65e" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="${id}-ember" cx="42%" cy="36%" r="74%">
      <stop offset="0%" stop-color="#ffe3b8" />
      <stop offset="45%" stop-color="#ffb35e" />
      <stop offset="100%" stop-color="#e09a3f" />
    </radialGradient>
  </defs>
  <rect width="32" height="32" rx="7" fill="${BG}" />
  <circle cx="16" cy="16" r="13" fill="url(#${id}-glow)" />
  <circle cx="16" cy="16" r="7" fill="url(#${id}-ember)" />
</svg>`;
}

const TARGETS = [
  { px: 128, svg: fullSvg },
  { px: 48, svg: fullSvg },
  { px: 32, svg: fullSvg },
  { px: 16, svg: miniSvg },
];

await mkdir(OUT_DIR, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();

for (const { px, svg } of TARGETS) {
  const markup = svg(px, `i${px}`);
  await page.setViewportSize({ width: px, height: px });
  await page.setContent(
    `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent}</style>${markup}`,
  );
  // Wait for the SVG to actually PAINT before screenshotting. `setContent`
  // resolves on DOM load, but a gradient-filled `<defs>` (the ember + glow) can
  // miss the first compositor frame — capturing then yields a black tile with no
  // ember (the icon "disappears"). Settle two animation frames so the gradients
  // are painted first. (This races were the recurring black-blob output.)
  await page.locator('svg').waitFor({ state: 'visible' });
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );
  const buf = await page.screenshot({
    omitBackground: true, // keep the tile's rounded-corner transparency
    clip: { x: 0, y: 0, width: px, height: px },
  });
  const file = resolve(OUT_DIR, `icon-${px}.png`);
  await writeFile(file, buf);
  console.log(`wrote ${file} (${px}×${px})`);
}

await browser.close();
