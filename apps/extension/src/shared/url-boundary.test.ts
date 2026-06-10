import { describe, expect, test } from 'vitest';
import {
  hostGlobMatches,
  isNavigationAllowed,
  pageGlob,
  registrableDomain,
  resolveBoundaryAllow,
  urlGlobMatches,
} from './url-boundary';

describe('registrableDomain', () => {
  test('reduces a subdomain to its apex', () => {
    expect(registrableDomain('https://mail.google.com/inbox')).toBe('google.com');
  });

  test('returns the apex unchanged', () => {
    expect(registrableDomain('https://google.com/')).toBe('google.com');
  });

  test('keeps three labels for a two-part public suffix', () => {
    expect(registrableDomain('https://www.bbc.co.uk/news')).toBe('bbc.co.uk');
    expect(registrableDomain('https://shop.example.com.au/')).toBe('example.com.au');
  });

  test('lowercases the host', () => {
    expect(registrableDomain('https://Mail.GOOGLE.com/')).toBe('google.com');
  });

  test('returns single-label and IP hosts as-is', () => {
    expect(registrableDomain('http://localhost:3000/')).toBe('localhost');
    expect(registrableDomain('http://192.168.0.1/')).toBe('192.168.0.1');
  });

  test('returns null for a non-http(s) scheme', () => {
    expect(registrableDomain('mailto:a@b.com')).toBeNull();
    expect(registrableDomain('ftp://files.example.com/')).toBeNull();
    expect(registrableDomain('chrome://extensions')).toBeNull();
  });

  test('returns null for a malformed URL', () => {
    expect(registrableDomain('not a url')).toBeNull();
    expect(registrableDomain('')).toBeNull();
  });
});

describe('hostGlobMatches', () => {
  test('exact host matches itself only', () => {
    expect(hostGlobMatches('accounts.google.com', 'accounts.google.com')).toBe(true);
    expect(hostGlobMatches('mail.google.com', 'accounts.google.com')).toBe(false);
  });

  test('leading wildcard matches the apex and any subdomain', () => {
    expect(hostGlobMatches('google.com', '*.google.com')).toBe(true);
    expect(hostGlobMatches('mail.google.com', '*.google.com')).toBe(true);
    expect(hostGlobMatches('a.b.google.com', '*.google.com')).toBe(true);
  });

  test('leading wildcard does not match a sibling domain', () => {
    expect(hostGlobMatches('google.com.evil.com', '*.google.com')).toBe(false);
    expect(hostGlobMatches('notgoogle.com', '*.google.com')).toBe(false);
  });

  test('is case-insensitive', () => {
    expect(hostGlobMatches('Mail.Google.COM', '*.google.com')).toBe(true);
    expect(hostGlobMatches('ACCOUNTS.GOOGLE.COM', 'accounts.google.com')).toBe(true);
  });

  test('an empty wildcard suffix never matches', () => {
    expect(hostGlobMatches('anything.com', '*.')).toBe(false);
  });
});

describe('pageGlob', () => {
  test('returns origin + pathname + a trailing *', () => {
    expect(pageGlob('https://gitlab.com/dashboard/merge_requests')).toBe(
      'https://gitlab.com/dashboard/merge_requests*',
    );
  });

  test('drops the query and fragment (path only)', () => {
    expect(pageGlob('https://gitlab.com/dashboard/merge_requests?state=opened#x')).toBe(
      'https://gitlab.com/dashboard/merge_requests*',
    );
  });

  test('a bare origin yields `<origin>/*`', () => {
    expect(pageGlob('https://example.com')).toBe('https://example.com/*');
  });

  test('returns null for a non-http(s) scheme or an unparseable URL', () => {
    expect(pageGlob('chrome://newtab')).toBeNull();
    expect(pageGlob('mailto:a@b.com')).toBeNull();
    expect(pageGlob('not a url')).toBeNull();
  });
});

describe('urlGlobMatches', () => {
  test('a bare host matches anywhere on that host (≡ whole host)', () => {
    expect(urlGlobMatches('https://gitlab.com/acme/web/-/merge_requests/42', 'gitlab.com')).toBe(
      true,
    );
    expect(urlGlobMatches('https://mail.google.com/u/0', '*.google.com')).toBe(true);
    expect(urlGlobMatches('https://example.com/', 'gitlab.com')).toBe(false);
  });

  test('a trailing-* path pattern is a prefix that keeps sub-paths and query', () => {
    const pat = 'https://gitlab.com/dashboard/merge_requests*';
    expect(urlGlobMatches('https://gitlab.com/dashboard/merge_requests', pat)).toBe(true);
    expect(urlGlobMatches('https://gitlab.com/dashboard/merge_requests?state=opened', pat)).toBe(
      true,
    );
    expect(urlGlobMatches('https://gitlab.com/dashboard/merge_requests/extra', pat)).toBe(true);
  });

  test('an exact URL pattern (no *) matches only that exact path', () => {
    const pat = 'https://gitlab.com/dashboard/merge_requests';
    expect(urlGlobMatches('https://gitlab.com/dashboard/merge_requests', pat)).toBe(true);
    expect(urlGlobMatches('https://gitlab.com/dashboard/merge_requests?state=opened', pat)).toBe(
      false,
    );
    expect(urlGlobMatches('https://gitlab.com/dashboard/merge_requests/42', pat)).toBe(false);
  });

  test('a same-host link off the locked path diverts (GitLab case)', () => {
    const pat = 'https://gitlab.com/dashboard/merge_requests*';
    expect(urlGlobMatches('https://gitlab.com/acme/web/-/merge_requests/42', pat)).toBe(false);
  });

  test('scheme defaults to either http(s); an explicit scheme is enforced', () => {
    expect(urlGlobMatches('http://example.com/a', 'example.com/a')).toBe(true);
    expect(urlGlobMatches('https://example.com/a', '*://example.com/a')).toBe(true);
    expect(urlGlobMatches('http://example.com/a', 'https://example.com/a')).toBe(false);
    expect(urlGlobMatches('https://example.com/a', 'https://example.com/a')).toBe(true);
  });

  test('a page glob with a non-default port matches that origin (port honoured)', () => {
    // A page lock derived from `origin` carries the port (`pageGlob` → `*` path).
    const pat = 'http://localhost:5173/*';
    expect(urlGlobMatches('http://localhost:5173/', pat)).toBe(true);
    expect(urlGlobMatches('http://localhost:5173/inner', pat)).toBe(true);
    // A different port on the same host is a different origin → no match.
    expect(urlGlobMatches('http://localhost:8080/inner', pat)).toBe(false);
    // A different host (same machine) never matches.
    expect(urlGlobMatches('http://127.0.0.1:5173/inner', pat)).toBe(false);
  });

  test('a port-less host pattern stays port-agnostic', () => {
    expect(urlGlobMatches('https://example.com:8443/a', 'example.com/a')).toBe(true);
    expect(urlGlobMatches('https://example.com:8443/a', 'https://example.com/a')).toBe(true);
  });

  test('a malformed pattern or non-http(s) target never matches and never throws', () => {
    expect(() => urlGlobMatches('https://example.com/a', '')).not.toThrow();
    expect(urlGlobMatches('https://example.com/a', '')).toBe(false);
    expect(urlGlobMatches('https://example.com/a', '   ')).toBe(false);
    expect(urlGlobMatches('https://example.com/a', 'https://')).toBe(false);
    expect(urlGlobMatches('mailto:a@example.com', 'example.com')).toBe(false);
    expect(urlGlobMatches('not a url', 'example.com')).toBe(false);
  });
});

describe('isNavigationAllowed', () => {
  const allow = ['*.google.com', 'linear.app'];

  test('allows an in-allow host (wildcard apex + subdomain)', () => {
    expect(isNavigationAllowed('https://google.com/', allow)).toBe(true);
    expect(isNavigationAllowed('https://mail.google.com/u/0', allow)).toBe(true);
    expect(isNavigationAllowed('https://linear.app/team', allow)).toBe(true);
  });

  test('rejects an off-allow host', () => {
    expect(isNavigationAllowed('https://example.com/', allow)).toBe(false);
    expect(isNavigationAllowed('https://notgoogle.com/', allow)).toBe(false);
  });

  test('matches against the full href, not just the host', () => {
    const pathAllow = ['https://gitlab.com/dashboard/merge_requests*'];
    expect(isNavigationAllowed('https://gitlab.com/dashboard/merge_requests', pathAllow)).toBe(
      true,
    );
    expect(isNavigationAllowed('https://gitlab.com/acme/web/-/merge_requests/42', pathAllow)).toBe(
      false,
    );
  });

  test('rejects non-http(s) and malformed targets', () => {
    expect(isNavigationAllowed('mailto:a@google.com', allow)).toBe(false);
    expect(isNavigationAllowed('javascript:void 0', allow)).toBe(false);
    expect(isNavigationAllowed('not a url', allow)).toBe(false);
  });

  test('an empty allow-set rejects everything', () => {
    expect(isNavigationAllowed('https://google.com/', [])).toBe(false);
  });
});

describe('resolveBoundaryAllow', () => {
  const home = 'https://mail.google.com/inbox';

  test('locked → the explicit allow list', () => {
    expect(resolveBoundaryAllow({ mode: 'locked', allow: ['*.google.com'] }, home, 'off')).toEqual([
      '*.google.com',
    ]);
  });

  test('off → null regardless of the global default', () => {
    expect(resolveBoundaryAllow({ mode: 'off' }, home, 'domain')).toBeNull();
    expect(resolveBoundaryAllow({ mode: 'off' }, home, 'page')).toBeNull();
    expect(resolveBoundaryAllow({ mode: 'off' }, home, 'off')).toBeNull();
  });

  test('inherit + domain default → the registrable domain of originalURL', () => {
    expect(resolveBoundaryAllow(undefined, home, 'domain')).toEqual(['google.com']);
  });

  test('inherit + page default → the page glob of originalURL', () => {
    expect(resolveBoundaryAllow(undefined, home, 'page')).toEqual([
      'https://mail.google.com/inbox*',
    ]);
  });

  test('inherit + off default → null', () => {
    expect(resolveBoundaryAllow(undefined, home, 'off')).toBeNull();
  });

  test('inherit default with an unparseable originalURL → null', () => {
    expect(resolveBoundaryAllow(undefined, 'chrome://newtab', 'domain')).toBeNull();
    expect(resolveBoundaryAllow(undefined, 'chrome://newtab', 'page')).toBeNull();
  });
});
