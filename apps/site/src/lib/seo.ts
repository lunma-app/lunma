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
  'Lunma is an open-source Chrome and Edge extension with Arc-style Spaces: a vertical sidebar that groups your tabs by project, a launcher on Alt+L, and idle tabs that archive themselves. It runs in the browser you already use. No account, no server, everything on your device.';

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
    a: "No. It's an extension, so it adds its own surfaces: a vertical sidebar, a new-tab page, and the launcher on Alt+L. It can't repaint Chrome's own window or tab strip, and it doesn't try to. It sits on top of the browser you already have.",
  },
  {
    q: 'What happens right after I install?',
    a: "Lunma opens in the browser's side panel and pulls your open tabs in. Any tab groups you already keep become Spaces; the rest land in a starter Space you can sort however you like. Press Alt+L to search from anywhere. There's nothing to set up.",
  },
  {
    q: 'What permissions does it ask for, and why?',
    a: "Every permission earns its place. The launcher reads your tabs, bookmarks, and history so it can search them. Spaces ride on Chrome's own tab groups. Auto-archive needs an alarm to know when a tab has gone idle. And Lunma runs a small script on each page so the launcher and the pinned-tab behaviour work wherever you are. All of it reads locally. There's no telemetry and nothing goes to a Lunma server. A web search you run opens in whatever engine you picked, the same as typing in the address bar. The whole thing is public, so you don't have to take our word for any of it.",
  },
  {
    q: 'Where is my data stored?',
    a: "On your device, and nowhere else. Your Spaces, pinned tabs, favourites, and settings sit in your browser's local extension storage. They're there after a restart, and none of it gets uploaded, because there's no Lunma server to upload to. The launcher can search the bookmarks you already have, but Lunma doesn't turn your Spaces or favourites into bookmarks.",
  },
  {
    q: 'Does it sync across my devices?',
    a: "No. Everything Lunma keeps lives on the device you're using, and it's there after a restart. It won't follow you to your other machines, though.",
  },
  {
    q: 'What happens to my Spaces if I uninstall?',
    a: "They live on your device, so removing Lunma clears them from that browser, and they don't travel to another machine on their own. (A backup-and-restore export is on the way for exactly this.) Your open tabs stay open either way, since they're ordinary browser tabs.",
  },
  {
    q: 'How is Lunma different from Arc?',
    a: "Arc is a whole browser, with its own account and its own sync. Lunma is an extension, so you get Arc-style Spaces and a vertical sidebar without leaving the Chrome or Edge you already run. It's open source and fully local. There's no account, and your data never leaves the machine.",
  },
  {
    q: 'Is this like Arcify?',
    a: "Arcify proved an Arc-style sidebar could live inside a Chrome extension, and we're grateful for the trail it cut. Lunma is built from scratch in that spirit, and it goes its own way in a few places: it's open source with no account to set up, and one Space can be open in several windows at the same time.",
  },
  {
    q: 'Does it work on Edge?',
    a: `Yes. Edge is Chromium under the hood, so it's the same extension. You'll want Chromium ${MIN_CHROMIUM} or newer.`,
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
