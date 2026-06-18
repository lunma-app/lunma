/**
 * Launch-readiness guard.
 *
 * The store URLs in `links.ts` are deliberate PRE-LAUNCH placeholders (the
 * Chrome/Edge store homepages) because no Lunma listing exists yet. The install
 * CTAs, the footer store links, and the SEO `downloadUrl` are all gated on the
 * `LAUNCHED` flag so none of them ship while it's `false`.
 *
 * This test makes the launch swap impossible to forget: while `LAUNCHED` is
 * `false` it is dormant, but the moment someone flips `LAUNCHED` to `true` (the
 * launch action) it asserts the placeholders have been replaced with real
 * listing URLs. If they haven't, `vitest run` fails — so `pnpm verify` and CI go
 * red and the launch cannot merge until the real URLs are wired in. There is no
 * "fix it later": it's fixed AT launch, enforced.
 */
import { describe, expect, test } from 'vitest';
import { CHROME_WEB_STORE_URL, EDGE_ADDONS_URL, LAUNCHED } from './links';

// The known pre-launch placeholders (bare store homepages — not listings).
const CHROME_PLACEHOLDER = 'https://chromewebstore.google.com/';
const EDGE_PLACEHOLDER = 'https://microsoftedge.microsoft.com/addons/';

describe('launch readiness', () => {
  test('a LAUNCHED build must ship real store listings, not placeholders', () => {
    // Dormant pre-launch: nothing to enforce until the flag flips.
    if (!LAUNCHED) return;

    expect(
      CHROME_WEB_STORE_URL,
      'LAUNCHED is true but CHROME_WEB_STORE_URL is still the store-homepage placeholder — set the real Lunma Chrome Web Store listing in links.ts before launch.',
    ).not.toBe(CHROME_PLACEHOLDER);
    expect(
      EDGE_ADDONS_URL,
      'LAUNCHED is true but EDGE_ADDONS_URL is still the store-homepage placeholder — set the real Lunma Edge Add-ons listing in links.ts before launch.',
    ).not.toBe(EDGE_PLACEHOLDER);

    // Real listings live under a `/detail/` path; a bare store URL is not enough.
    expect(
      CHROME_WEB_STORE_URL,
      'CHROME_WEB_STORE_URL should be a real listing URL (…/detail/…).',
    ).toContain('/detail/');
    expect(EDGE_ADDONS_URL, 'EDGE_ADDONS_URL should be a real listing URL (…/detail/…).').toContain(
      '/detail/',
    );
  });
});
