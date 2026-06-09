import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import FaviconHarness from './Favicon.test.harness.svelte';
import { faviconCacheKey, faviconFor, faviconUrl } from './favicon';

beforeEach(() => {
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: {
      getURL: (path: string) => `chrome-extension://abc${path}`,
    },
  };
});

afterEach(() => {
  delete (globalThis as unknown as { chrome?: unknown }).chrome;
  vi.restoreAllMocks();
});

describe('faviconUrl', () => {
  test('builds the _favicon endpoint URL with pageUrl + size', () => {
    const result = faviconUrl('https://example.com/page', 16);
    expect(result.startsWith('chrome-extension://abc/_favicon/')).toBe(true);
    const url = new URL(result);
    expect(url.searchParams.get('pageUrl')).toBe('https://example.com/page');
    expect(url.searchParams.get('size')).toBe('16');
  });

  test('defaults size to 16', () => {
    const url = new URL(faviconUrl('https://example.com/'));
    expect(url.searchParams.get('size')).toBe('16');
  });

  test('encodes query-laden page URLs safely', () => {
    const page = 'https://example.com/search?q=a&b=c';
    const url = new URL(faviconUrl(page, 32));
    expect(url.searchParams.get('pageUrl')).toBe(page);
    expect(url.searchParams.get('size')).toBe('32');
  });

  test('appends a `v` cache-bust param only when one is provided', () => {
    // No bust → the plain (constant) endpoint URL, exactly as before.
    expect(new URL(faviconUrl('https://x/', 16)).searchParams.has('v')).toBe(false);
    // A bust token → a `v` param the browser keys its image cache on (so the
    // endpoint refetches when the token changes), without disturbing pageUrl/size.
    const busted = new URL(faviconUrl('https://x/', 16, 'abc123'));
    expect(busted.searchParams.get('v')).toBe('abc123');
    expect(busted.searchParams.get('pageUrl')).toBe('https://x/');
    expect(busted.searchParams.get('size')).toBe('16');
  });
});

describe('faviconCacheKey', () => {
  test('is undefined for an absent favicon (→ the plain endpoint, no bust)', () => {
    expect(faviconCacheKey(undefined)).toBeUndefined();
    expect(faviconCacheKey('')).toBeUndefined();
  });

  test('is stable per favicon and differs across favicons (so the endpoint refetches)', () => {
    const f13 = 'https://web.whatsapp.com/favicon/2x/f13/v4/';
    const f14 = 'https://web.whatsapp.com/favicon/2x/f14/v4/';
    expect(faviconCacheKey(f13)).toBe(faviconCacheKey(f13));
    expect(faviconCacheKey(f13)).not.toBe(faviconCacheKey(f14));
  });
});

describe('faviconFor', () => {
  test('prefers an http(s) favIconUrl over the _favicon endpoint', () => {
    expect(faviconFor('https://example.com/', 'https://example.com/icon.png')).toBe(
      'https://example.com/icon.png',
    );
  });

  test('prefers a data: favIconUrl', () => {
    const data = 'data:image/png;base64,AAAA';
    expect(faviconFor('https://example.com/', data)).toBe(data);
  });

  test('falls back to the _favicon endpoint when favIconUrl is absent', () => {
    expect(
      faviconFor('https://example.com/page').startsWith('chrome-extension://abc/_favicon/'),
    ).toBe(true);
  });

  test('ignores a non-loadable (chrome://) favIconUrl and uses the endpoint', () => {
    const result = faviconFor('https://example.com/', 'chrome://theme/IDR_X');
    expect(result.startsWith('chrome-extension://abc/_favicon/')).toBe(true);
  });

  // A page-minted blob: URL (e.g. a canvas-rendered badged favicon) is an object
  // URL scoped to that document's origin — it net-errors when loaded from our
  // chrome-extension:// page — so it is treated as absent and dropped to the
  // endpoint, NOT used as the primary src (favicon-tile-fallback D3 / Non-Goals).
  test('ignores a blob: favIconUrl (unreachable cross-document) and uses the endpoint', () => {
    const result = faviconFor(
      'https://web.whatsapp.com/',
      'blob:https://web.whatsapp.com/9f1c-uuid',
    );
    expect(result.startsWith('chrome-extension://abc/_favicon/')).toBe(true);
  });

  test('ignores an about: favIconUrl and uses the endpoint', () => {
    const result = faviconFor('https://example.com/', 'about:blank');
    expect(result.startsWith('chrome-extension://abc/_favicon/')).toBe(true);
  });

  test('the plain-endpoint fallback (no favicon) carries no `v` bust', () => {
    expect(new URL(faviconFor('https://example.com/page')).searchParams.has('v')).toBe(false);
  });

  test('cache-busts the endpoint when an unloadable favicon re-badges (blob: changes)', () => {
    // An unloadable-scheme favIconUrl drops to the endpoint — but cache-busted on
    // the favicon identity, so a changing badge yields a changing endpoint URL
    // (the browser refetches Chrome's current icon instead of serving its cache).
    const a = faviconFor('https://web.whatsapp.com/', 'blob:https://web.whatsapp.com/aaa');
    const b = faviconFor('https://web.whatsapp.com/', 'blob:https://web.whatsapp.com/bbb');
    expect(a.startsWith('chrome-extension://abc/_favicon/')).toBe(true);
    expect(new URL(a).searchParams.get('v')).not.toBeNull();
    expect(a).not.toBe(b);
  });
});

const PRIMARY = 'https://static.example.net/icon.webp';
const ENDPOINT = 'chrome-extension://abc/_favicon/?pageUrl=https%3A%2F%2Fx%2F&size=16';

// The PAINTED image — present only once a source has loaded (promoted from the
// preloader).
function img(container: HTMLElement): HTMLImageElement | null {
  return container.querySelector('img.favicon-img');
}
// The hidden, zero-box PRELOADER — where load/error are driven (preload-then-swap).
function preload(container: HTMLElement): HTMLImageElement | null {
  return container.querySelector('img.favicon-preload');
}
function globe(container: HTMLElement): Element | null {
  return container.querySelector('[data-icon-name="globe"]');
}

// Distinct loadable `data:` favicons for the live-swap scenarios (the WhatsApp
// canvas-badge case mints a fresh `data:` URI per badge).
const ICON_A = 'data:image/png;base64,AAAA';
const ICON_B = 'data:image/png;base64,BBBB';
const ICON_C = 'data:image/png;base64,CCCC';

describe('Favicon', () => {
  test('renders the primary image when src loads (no globe)', async () => {
    const { container } = render(FaviconHarness, { props: { src: PRIMARY } });
    // Before the preload resolves nothing visible is painted (no broken image) —
    // the primary is staged on the hidden preloader.
    expect(img(container)).toBeNull();
    expect(preload(container)?.getAttribute('src')).toBe(PRIMARY);
    expect(globe(container)).toBeNull();

    await fireEvent.load(preload(container) as HTMLImageElement);
    expect(img(container)?.getAttribute('src')).toBe(PRIMARY);
    expect(globe(container)).toBeNull();
  });

  test('a failed primary retries the fallback before any globe', async () => {
    const { container } = render(FaviconHarness, {
      props: { src: PRIMARY, fallbackSrc: ENDPOINT },
    });
    // Primary staged first — the globe has NOT flashed.
    expect(preload(container)?.getAttribute('src')).toBe(PRIMARY);
    expect(globe(container)).toBeNull();

    await fireEvent.error(preload(container) as HTMLImageElement);
    // Advanced to the endpoint, still no globe.
    expect(preload(container)?.getAttribute('src')).toBe(ENDPOINT);
    expect(globe(container)).toBeNull();
  });

  test('the globe renders only after both primary and fallback fail', async () => {
    const { container } = render(FaviconHarness, {
      props: { src: PRIMARY, fallbackSrc: ENDPOINT },
    });
    await fireEvent.error(preload(container) as HTMLImageElement); // primary → fallback
    await fireEvent.error(preload(container) as HTMLImageElement); // fallback → globe
    expect(img(container)).toBeNull();
    expect(preload(container)).toBeNull();
    expect(globe(container)).not.toBeNull();
  });

  test('an empty src with no usable fallback renders the globe, without a flash', () => {
    const { container } = render(FaviconHarness, { props: {} });
    // No source was attempted, so the globe is the legitimate terminal state — and
    // no preloader/image ever mounted, so nothing could have flashed before it.
    expect(img(container)).toBeNull();
    expect(preload(container)).toBeNull();
    expect(globe(container)).not.toBeNull();
  });

  test('a fallback identical to src is not retried — straight to globe', async () => {
    const { container } = render(FaviconHarness, {
      props: { src: ENDPOINT, fallbackSrc: ENDPOINT },
    });
    expect(preload(container)?.getAttribute('src')).toBe(ENDPOINT);
    await fireEvent.error(preload(container) as HTMLImageElement);
    // The `!== src` guard means no second identical attempt: the globe immediately.
    expect(img(container)).toBeNull();
    expect(globe(container)).not.toBeNull();
  });

  test('changing src resets the stage so a recycled instance re-tries', async () => {
    const { container, rerender } = render(FaviconHarness, { props: { src: PRIMARY } });
    await fireEvent.error(preload(container) as HTMLImageElement); // no fallback → globe
    expect(globe(container)).not.toBeNull();

    await rerender({ src: 'https://other.example.com/favicon.ico' });
    // A new src re-attempts from the primary stage (no stuck globe).
    expect(globe(container)).toBeNull();
    expect(preload(container)?.getAttribute('src')).toBe('https://other.example.com/favicon.ico');
  });

  // (a) A live src change holds the current icon until the new one loads, then
  // swaps — no globe during the swap.
  test('a live src change holds image A until B loads, then swaps (no globe)', async () => {
    const { container, rerender } = render(FaviconHarness, { props: { src: ICON_A } });
    await fireEvent.load(preload(container) as HTMLImageElement);
    expect(img(container)?.getAttribute('src')).toBe(ICON_A);

    await rerender({ src: ICON_B });
    // A is still painted while B preloads; the globe never appears mid-swap.
    expect(img(container)?.getAttribute('src')).toBe(ICON_A);
    expect(preload(container)?.getAttribute('src')).toBe(ICON_B);
    expect(globe(container)).toBeNull();

    await fireEvent.load(preload(container) as HTMLImageElement);
    expect(img(container)?.getAttribute('src')).toBe(ICON_B);
    expect(globe(container)).toBeNull();
  });

  // (b) A failed new src keeps the current icon — no blank, no globe regression.
  test('a failed live update keeps the current icon (no blank, no globe)', async () => {
    const { container, rerender } = render(FaviconHarness, { props: { src: ICON_A } });
    await fireEvent.load(preload(container) as HTMLImageElement);
    expect(img(container)?.getAttribute('src')).toBe(ICON_A);

    await rerender({ src: ICON_B });
    await fireEvent.error(preload(container) as HTMLImageElement); // B fails, no fallback
    // A is held: not blanked, not regressed to the globe.
    expect(img(container)?.getAttribute('src')).toBe(ICON_A);
    expect(globe(container)).toBeNull();
  });

  // (c) Rapid A→B→C settles on C — last-write-wins via the keyed preloader re-mount
  // (a superseded candidate's onload can never promote a stale source).
  test('rapid src A→B→C settles on C (last-write-wins)', async () => {
    const { container, rerender } = render(FaviconHarness, { props: { src: ICON_A } });
    await fireEvent.load(preload(container) as HTMLImageElement);
    expect(img(container)?.getAttribute('src')).toBe(ICON_A);

    await rerender({ src: ICON_B });
    const stalePreloader = preload(container) as HTMLImageElement; // B's element
    await rerender({ src: ICON_C });
    // B's preloader was keyed out; only C's is mounted now.
    expect(preload(container)?.getAttribute('src')).toBe(ICON_C);

    // A late load on the superseded B element must NOT promote B.
    await fireEvent.load(stalePreloader);
    expect(img(container)?.getAttribute('src')).not.toBe(ICON_B);

    await fireEvent.load(preload(container) as HTMLImageElement);
    expect(img(container)?.getAttribute('src')).toBe(ICON_C);
  });

  // (d) A first source that fails with no prior display reaches the globe and never
  // paints a visible image with a failed/empty source (no broken-image chrome).
  test('a first source that fails reaches the globe, never a broken visible image', async () => {
    const { container } = render(FaviconHarness, { props: { src: PRIMARY } });
    // Nothing has displayed yet: an empty sized box + the staged preloader, no globe.
    expect(img(container)).toBeNull();
    expect(globe(container)).toBeNull();
    expect(preload(container)?.getAttribute('src')).toBe(PRIMARY);

    await fireEvent.error(preload(container) as HTMLImageElement); // first src fails, no fallback
    expect(globe(container)).not.toBeNull();
    expect(img(container)).toBeNull();
  });
});
