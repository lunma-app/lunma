import { afterEach, describe, expect, test, vi } from 'vitest';
import { isLensPageUrl, isNewTabUrl, LENSPAGE_PATH, NEWTAB_PAGE_PATH } from './new-tab';

const RESOLVED = `chrome-extension://abcdef/${NEWTAB_PAGE_PATH}`;

function installChrome(getURL?: (path: string) => string): void {
  (globalThis as unknown as { chrome: unknown }).chrome = getURL
    ? { runtime: { getURL: vi.fn(getURL) } }
    : {};
}

afterEach(() => {
  (globalThis as unknown as { chrome?: unknown }).chrome = undefined;
});

describe('isNewTabUrl', () => {
  test('matches the bare chrome://newtab/ URL', () => {
    installChrome();
    expect(isNewTabUrl('chrome://newtab/')).toBe(true);
    expect(isNewTabUrl('chrome://newtab')).toBe(true);
  });

  test('matches other Chromium forks’ internal new-tab schemes (Edge, Brave)', () => {
    installChrome();
    expect(isNewTabUrl('edge://newtab/')).toBe(true);
    expect(isNewTabUrl('edge://newtab')).toBe(true);
    expect(isNewTabUrl('brave://newtab/')).toBe(true);
  });

  test('does not match sibling internal pages or look-alike web URLs', () => {
    installChrome();
    expect(isNewTabUrl('edge://settings/')).toBe(false);
    expect(isNewTabUrl('edge://newtab-foo')).toBe(false);
    expect(isNewTabUrl('https://newtab')).toBe(false);
  });

  test('matches the extension-resolved newtab URL', () => {
    installChrome((path) => `chrome-extension://abcdef/${path}`);
    expect(isNewTabUrl(RESOLVED)).toBe(true);
  });

  test('matches the resolved URL with a trailing query/hash', () => {
    installChrome((path) => `chrome-extension://abcdef/${path}`);
    expect(isNewTabUrl(`${RESOLVED}?foo=1`)).toBe(true);
    expect(isNewTabUrl(`${RESOLVED}#section`)).toBe(true);
  });

  test('does not match an ordinary page URL', () => {
    installChrome((path) => `chrome-extension://abcdef/${path}`);
    expect(isNewTabUrl('https://example.com/')).toBe(false);
    expect(isNewTabUrl('chrome://settings/')).toBe(false);
  });

  test('returns false for empty / undefined input', () => {
    installChrome();
    expect(isNewTabUrl('')).toBe(false);
    expect(isNewTabUrl(undefined)).toBe(false);
  });

  test('degrades gracefully when chrome.runtime is unavailable', () => {
    (globalThis as unknown as { chrome?: unknown }).chrome = undefined;
    expect(isNewTabUrl('chrome://newtab/')).toBe(true);
    expect(isNewTabUrl(RESOLVED)).toBe(false);
  });
});

describe('isLensPageUrl', () => {
  const PAGE = `chrome-extension://abcdef/${LENSPAGE_PATH}`;

  test('matches the resolved folder-page URL, with or without a folderId query', () => {
    installChrome((path) => `chrome-extension://abcdef/${path}`);
    expect(isLensPageUrl(PAGE)).toBe(true);
    expect(isLensPageUrl(`${PAGE}?folderId=f1`)).toBe(true);
  });

  test('does not match other extension pages or web URLs', () => {
    installChrome((path) => `chrome-extension://abcdef/${path}`);
    expect(isLensPageUrl(`chrome-extension://abcdef/${NEWTAB_PAGE_PATH}`)).toBe(false);
    expect(isLensPageUrl('https://example.com/')).toBe(false);
    expect(isLensPageUrl('')).toBe(false);
    expect(isLensPageUrl(undefined)).toBe(false);
  });

  test('degrades to a path-suffix check when chrome.runtime is unavailable', () => {
    (globalThis as unknown as { chrome?: unknown }).chrome = undefined;
    expect(isLensPageUrl(`${PAGE}?folderId=f1`)).toBe(true);
    expect(isLensPageUrl('https://example.com/')).toBe(false);
  });
});
