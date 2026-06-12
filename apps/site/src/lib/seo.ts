// Centralised SEO data + structured-data builders for the marketing site. One
// canonical origin, the keyword-tuned page meta, the FAQ as data (so the visible
// FAQ and the FAQPage JSON-LD render from a single source — no drift, which
// Google requires), and the JSON-LD builders the <head> emits.
import { CHROME_WEB_STORE_URL, GITHUB_URL, MIN_CHROMIUM } from '$lib/links';

/** Canonical origin. [VERIFY] confirm `lunma.app` is the live domain at launch
 *  (tracked in the release notes). */
export const SITE_URL = 'https://lunma.app';
export const SITE_NAME = 'Lunma';

/** Keyword-tuned <title> + description — names the category once, in natural
 *  language (no keyword stuffing): the long-tail is carried by real content. */
export const SITE_TITLE = 'Lunma — Arc-style Spaces & vertical tabs for Chrome';
export const SITE_DESCRIPTION =
  'Lunma is an open-source Chrome & Edge extension: a vertical sidebar with colour-coded Spaces, a keyboard launcher, and tabs that archive themselves. An Arc-style workspace in the browser you already use — no account, no server, and your bookmarks stay yours.';

/** og:image — absolute URL + intrinsic size for richer social cards. */
export const OG_IMAGE = `${SITE_URL}/og.png`;
export const OG_IMAGE_W = 1200; // [VERIFY] match og.png intrinsic dimensions
export const OG_IMAGE_H = 630;
export const OG_IMAGE_ALT = 'Lunma — a vertical sidebar with colour-coded Spaces for Chrome';

export interface FaqEntry {
  q: string;
  a: string;
}

/** The FAQ, as data — rendered by `Faq.svelte` AND emitted as `FAQPage` JSON-LD,
 *  so the structured data never describes content the page does not show. */
export const FAQ_ENTRIES: FaqEntry[] = [
  {
    q: 'Does it change my browser?',
    a: "No. Lunma is an extension: it adds a vertical sidebar, a new-tab page, and the Alt+L launcher. It can't redraw the browser's own window or tab strip, and it doesn't try to — it works on top of the browser you already have.",
  },
  {
    q: 'Why does it need those permissions?',
    a: "The launcher reads your tabs, bookmarks, and history so it can search them, and the overlay renders on the page you're on. All of it is read locally, nothing is transmitted, and the source is public so you can verify it.",
  },
  {
    q: 'Where is my data stored?',
    a: 'On your device. Spaces and settings live in local extension storage; pinned tabs and favourites are ordinary bookmarks, so they sync wherever your browser profile syncs. There is no Lunma server.',
  },
  {
    q: 'Does it sync across my devices?',
    a: 'Your favourites and pinned tabs are ordinary browser bookmarks, so they ride your existing browser-profile sync across devices and survive restarts — no Lunma account, no separate service, nothing to lock you in.',
  },
  {
    q: 'How is Lunma different from Arc?',
    a: 'Arc is its own browser, with its own account and sync; Lunma is an extension for the Chrome or Edge you already run. You get colour-coded Spaces, vertical tabs, and a keyboard launcher without switching browsers — and Lunma is open source and fully local, with your favourites and pinned tabs kept as ordinary bookmarks, so nothing is locked in.',
  },
  {
    q: 'Is this like Arcify?',
    a: "Arcify showed that an Arc-style sidebar could live in a Chrome extension, and Lunma is built from scratch in that spirit. Where it leans its own way: it's open source and fully local with no account, the same Space can be active in several windows at once, and your favourites and pinned tabs are real browser bookmarks.",
  },
  {
    q: 'Does it work on Edge?',
    a: `Yes — Edge is Chromium, so it's the same extension. Chromium ${MIN_CHROMIUM} or newer.`,
  },
];

/** `SoftwareApplication` — the product. No fabricated rating/review count. */
export function softwareAppLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BrowserApplication',
    operatingSystem: `Chrome, Edge (Chromium ${MIN_CHROMIUM}+)`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    downloadUrl: CHROME_WEB_STORE_URL, // [VERIFY] real listing at launch
    softwareHelp: GITHUB_URL,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isAccessibleForFree: true,
  };
}

/** `WebSite` — the site itself. */
export function webSiteLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  };
}

/** `FAQPage` — built from the same entries `Faq.svelte` renders. */
export function faqPageLd(entries: FaqEntry[] = FAQ_ENTRIES): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((e) => ({
      '@type': 'Question',
      name: e.q,
      acceptedAnswer: { '@type': 'Answer', text: e.a },
    })),
  };
}
