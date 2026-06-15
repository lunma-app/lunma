// Outbound links. The store listings do not exist until Lunma is published, so
// these are placeholders — [VERIFY] and replace with the real listing/repo URLs
// before launch.
export const CHROME_WEB_STORE_URL = 'https://chromewebstore.google.com/'; // [VERIFY] Lunma listing
export const EDGE_ADDONS_URL = 'https://microsoftedge.microsoft.com/addons/'; // [VERIFY] Lunma listing
export const GITHUB_URL = 'https://github.com/lunma-app/lunma'; // [VERIFY] public repo URL

/**
 * Launch gate. While `false` (pre-launch), the install CTAs render an honest
 * "coming soon" state instead of linking to a store listing that doesn't exist
 * yet. Flip to `true` with the real store URLs above at launch and every CTA
 * becomes a live install button with no other change. [VERIFY] set true at launch.
 */
export const LAUNCHED = false;

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
