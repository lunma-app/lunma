import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

// Layer-2 smoke for `newtab-anchored-search`: drive the real built new-tab page
// and prove the TWO-POSE behaviour — (1) the input rises ONCE from the centred
// idle pose into the raised search pose, (2) it then holds steady as the query /
// result set changes (no per-keystroke jitter), (3) it returns to the idle pose
// on clear — and (4) the Space identity collapses into the compact chip while
// searching instead of unmounting. Layer-1 unit coverage lives in
// src/launcher/newtab/NewTab.test.ts.

const WITHIN_POSE_TOLERANCE = 2; // device-pixel rounding only; a reflow would be tens of px.
const MIN_RISE = 20; // the search pose lifts the input well clear of centre (~hundreds of px).

async function inputY(page: Page): Promise<number> {
  const box = await page.getByTestId('newtab-search').boundingBox();
  if (!box) throw new Error('search input has no bounding box');
  return box.y;
}

test('the input rises once into the search pose and holds; identity collapses to a chip', async ({
  page,
  extensionId,
}) => {
  await page.goto(`chrome-extension://${extensionId}/src/launcher/newtab/index.html`);
  await expect(page.getByTestId('newtab-home')).toBeVisible();
  await expect(page.getByTestId('newtab-search')).toBeVisible();

  // Let the one-time staggered entrance (`rise`, up to ~440ms delay + duration)
  // settle so we measure the input's resting idle-pose position.
  await page.waitForTimeout(800);
  const idleY = await inputY(page);
  await page.screenshot({ path: 'test-results/newtab-idle.png' });

  // A no-match query still flips into the search pose (the results card renders a
  // quiet "No matches"), so the pose glide + chip are exercised without depending
  // on what the suggestions channel returns.
  const identityPresent = await page.getByTestId('newtab-identity-band').count();
  await page.getByTestId('newtab-search').fill('zzqq-no-such-thing-zzqq');
  await expect(page.getByTestId('newtab-results')).toBeVisible();
  await page.waitForTimeout(350); // let the pose glide + crossfade settle
  const searchingY = await inputY(page);
  await page.screenshot({ path: 'test-results/newtab-searching.png' });

  // (1) Two-pose: the input rose from the centre toward the top.
  expect(searchingY).toBeLessThan(idleY - MIN_RISE);

  // (2) The chip: the full identity goes hidden (not unmounted) and the compact
  // chip is revealed above the raised input.
  if (identityPresent > 0) {
    await expect(page.getByTestId('newtab-identity')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.getByTestId('newtab-identity-chip')).toHaveAttribute('aria-hidden', 'false');
  }

  // (3) Within the search pose: changing the query does not move the input.
  await page.getByTestId('newtab-search').fill('zzqq-no-such-thing-zzqq-longer-query');
  await page.waitForTimeout(200);
  expect(Math.abs((await inputY(page)) - searchingY)).toBeLessThanOrEqual(WITHIN_POSE_TOLERANCE);

  // (4) Clearing returns to the idle pose (input back at its centred position).
  await page.getByTestId('newtab-search').fill('');
  await expect(page.getByTestId('newtab-results')).toHaveCount(0);
  await page.waitForTimeout(350); // let the pose glide back
  expect(Math.abs((await inputY(page)) - idleY)).toBeLessThanOrEqual(WITHIN_POSE_TOLERANCE);
  if (identityPresent > 0) {
    await expect(page.getByTestId('newtab-identity')).toHaveAttribute('aria-hidden', 'false');
  }
});
