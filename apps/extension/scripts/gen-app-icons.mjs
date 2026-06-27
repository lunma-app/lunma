// Generate the extension's manifest icon set (16 / 32 / 48 / 128 px) from the
// on-brand Lunma mark — the "crescent + ember" the site favicon uses (canonical
// source: apps/site/static/favicon.svg, brand direction b-crescent). A warm moon
// cradling the ember dot — the same dot that ends the "lunma" wordmark.
//
// Why a script (not committed PNGs only): the mark is a gradient + masked SVG that
// must rasterise faithfully. We render it with the Chromium that ships with
// @playwright/test (no extra dep, and a real browser renders the radial/linear
// gradients + the crescent mask exactly), then screenshot at each pixel size into
// public/icons/.
//
// No background tile: the mark renders on transparent (a rounded SQUARE behind a
// round moon read oddly and ate space — the crescent IS the icon, edge to edge).
// Small-size rule (§5): at 16px the ember glow muddies into a smudge, so the 16px
// variant drops it and keeps just the crescent + ember dot.
//
// Run: `node scripts/gen-app-icons.mjs` (from apps/extension). Not wired into the
// build — the source is static, so regenerate only when the mark changes.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(here, '../public/icons');

/** The crescent gradients + mask, authored on the brand's 200-unit grid. `id`
 * namespaces them so two inlined sizes never collide. */
function defs(id) {
  return `<defs>
    <radialGradient id="${id}-halo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#F0912F" stop-opacity="0.55" />
      <stop offset="40%" stop-color="#F0912F" stop-opacity="0.2475" />
      <stop offset="100%" stop-color="#F0912F" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="${id}-cres" x1="0" y1="0" x2="0.25" y2="1">
      <stop offset="0%" stop-color="#FFE3B8" />
      <stop offset="55%" stop-color="#FFB35E" />
      <stop offset="100%" stop-color="#E07E22" />
    </linearGradient>
    <radialGradient id="${id}-dot" cx="42%" cy="38%" r="72%">
      <stop offset="0%" stop-color="#FFE3B8" />
      <stop offset="45%" stop-color="#FFB35E" />
      <stop offset="100%" stop-color="#E07E22" />
    </radialGradient>
    <mask id="${id}-cmask">
      <rect x="0" y="0" width="200" height="200" fill="black" />
      <circle cx="96" cy="102" r="64" fill="white" />
      <circle cx="120" cy="86" r="54" fill="black" />
    </mask>
  </defs>`;
}

/**
 * The full mark: NO background tile — just the crescent (masked gradient) + the
 * ember dot in its mouth, on transparent, so the moon IS the icon (a square tile
 * behind a round moon read oddly and ate space). `FILL` scales the crescent about
 * its own centre (96,102) — its outer circle is r64, ≈64% of the 200-grid — and
 * recentres it on the canvas (100,100) so it reaches near the edges. The big outer
 * hue-halo is dropped (no tile to glow over); a soft ember glow stays around the dot.
 */
const FILL = 'translate(100 100) scale(1.45) translate(-96 -102)';
function fullSvg(px, id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 200 200" fill="none">
  ${defs(id)}
  <g transform="${FILL}">
    <g mask="url(#${id}-cmask)"><rect x="0" y="0" width="200" height="200" fill="url(#${id}-cres)" /></g>
    <circle cx="124" cy="92" r="30" fill="url(#${id}-halo)" />
    <circle cx="124" cy="92" r="14" fill="url(#${id}-dot)" />
  </g>
</svg>`;
}

/**
 * The 16px variant: crescent + ember dot only (ember glow dropped too), on
 * transparent, filling the canvas via the same `FILL` transform so the moon reads
 * boldly at tab size.
 */
function miniSvg(px, id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 200 200" fill="none">
  ${defs(id)}
  <g transform="${FILL}">
    <g mask="url(#${id}-cmask)"><rect x="0" y="0" width="200" height="200" fill="url(#${id}-cres)" /></g>
    <circle cx="124" cy="92" r="14" fill="url(#${id}-dot)" />
  </g>
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
const page = await browser.newPage({ deviceScaleFactor: 4 });

for (const { px, svg } of TARGETS) {
  const markup = svg(px, `i${px}`);
  await page.setViewportSize({ width: px, height: px });
  await page.setContent(
    `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent}</style>${markup}`,
  );
  // Wait for the SVG to actually PAINT before screenshotting. `setContent`
  // resolves on DOM load, but a gradient/mask-filled `<defs>` can miss the first
  // compositor frame — capturing then yields a black tile. Settle two animation
  // frames so the gradients are painted first.
  await page.locator('svg').waitFor({ state: 'visible' });
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );
  const buf = await page.screenshot({
    omitBackground: true, // keep the tile's rounded-corner transparency
    clip: { x: 0, y: 0, width: px, height: px },
    scale: 'css',
  });
  const file = resolve(OUT_DIR, `icon-${px}.png`);
  await writeFile(file, buf);
  console.log(`wrote ${file} (${px}×${px})`);
}

await browser.close();
