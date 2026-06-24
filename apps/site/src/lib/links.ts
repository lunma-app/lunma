// Outbound links.
export const CHROME_WEB_STORE_URL =
  'https://chromewebstore.google.com/detail/lunma/efdgelbfagbcjnobncgoodbekgcihlle';
export const EDGE_ADDONS_URL = 'https://microsoftedge.microsoft.com/addons/'; // [VERIFY] Lunma listing when Edge ships
export const GITHUB_URL = 'https://github.com/lunma-app/lunma'; // [VERIFY] public repo URL

/**
 * Chrome launch gate. Flip to `true` once the Chrome Web Store listing is live;
 * all Chrome CTAs and the footer store link become active with no other change.
 */
export const LAUNCHED = true;

/**
 * Edge launch gate. Independent of `LAUNCHED` — flip when the Edge Add-ons
 * listing is live. While `false`, Edge CTAs and the footer Edge link are hidden.
 */
export const EDGE_LAUNCHED = false;

/** Minimum supported Chromium version, mirrored from the extension manifest. */
export const MIN_CHROMIUM = 123;

/** Internal path for the privacy policy page (same-origin, not an outbound link).
 *  The Chrome Web Store listing points at `${SITE_URL}${PRIVACY_PATH}`. */
export const PRIVACY_PATH = '/privacy';

/** Privacy/data contact shown on the `/privacy` page and used as the Chrome Web
 *  Store listing's privacy-contact email. The security-disclosure address
 *  (`security@lunma.app`) lives in `static/.well-known/security.txt` (RFC 9116),
 *  a static file that can't import this module — keep the two in step by hand. */
export const PRIVACY_EMAIL = 'privacy@lunma.app';
