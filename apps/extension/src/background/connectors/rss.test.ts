import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { SmartFolderNode } from './connector';
import { parseFeed, resetRssListingCache, rssConnector } from './rss';

// ── test plumbing ──────────────────────────────────────────────────────────────

let fetchMock: ReturnType<typeof vi.fn>;

/** A minimal Response stand-in — the connector reads only `ok`, `headers.get`,
 * and `text()`. `contentLength` overrides the declared body size. */
function feedResponse(
  xml: string,
  { ok = true, contentLength }: { ok?: boolean; contentLength?: string } = {},
): unknown {
  return {
    ok,
    status: ok ? 200 : 500,
    headers: {
      get: (h: string) => (h.toLowerCase() === 'content-length' ? (contentLength ?? null) : null),
    },
    text: async () => xml,
  };
}

function node(overrides: Partial<SmartFolderNode> = {}): SmartFolderNode {
  return {
    kind: 'smart',
    id: 'feed-1',
    name: 'Example feed',
    icon: 'rss',
    source: 'rss',
    baseUrl: 'https://news.example.com/rss',
    maxItems: 20,
    hideRead: false,
    refreshMinutes: 30,
    ...overrides,
  };
}

const RSS_2_0 = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>Example Blog</title>
    <link>https://example.com</link>
    <item>
      <title><![CDATA[Hello & Welcome]]></title>
      <link>https://example.com/hello</link>
      <guid isPermaLink="false">guid-1</guid>
    </item>
    <item>
      <title>Second &amp; last</title>
      <link>https://example.com/post-2</link>
    </item>
  </channel>
</rss>`;

const ATOM = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Example</title>
  <link rel="self" href="https://atom.example.com/feed.xml"/>
  <link rel="alternate" href="https://atom.example.com"/>
  <entry>
    <title>First Entry</title>
    <link rel="alternate" href="https://atom.example.com/1"/>
    <id>urn:uuid:1</id>
  </entry>
  <entry>
    <title>Second</title>
    <link href="https://atom.example.com/2"/>
    <id>urn:uuid:2</id>
  </entry>
</feed>`;

beforeEach(() => {
  resetRssListingCache();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ── parseFeed (design D1) ────────────────────────────────────────────────────────

describe('parseFeed', () => {
  test('RSS 2.0: CDATA title decoded, guid-less item falls back to its link', () => {
    const { items, channelLink } = parseFeed(RSS_2_0);
    expect(items).toEqual([
      { id: 'guid-1', title: 'Hello & Welcome', url: 'https://example.com/hello' },
      {
        id: 'https://example.com/post-2',
        title: 'Second & last',
        url: 'https://example.com/post-2',
      },
    ]);
    expect(channelLink).toBe('https://example.com');
  });

  test('Atom: url from the alternate link, id from the entry id, self link ignored', () => {
    const { items, channelLink } = parseFeed(ATOM);
    expect(items).toEqual([
      { id: 'urn:uuid:1', title: 'First Entry', url: 'https://atom.example.com/1' },
      { id: 'urn:uuid:2', title: 'Second', url: 'https://atom.example.com/2' },
    ]);
    // The alternate link wins; the rel="self" feed link is not the website.
    expect(channelLink).toBe('https://atom.example.com');
  });

  test('a malformed/truncated feed keeps what parsed and never throws', () => {
    const truncated = `<rss version="2.0"><channel><title>X</title>
      <item><title>Good</title><link>https://x/1</link></item>
      <item><title>Broken`;
    let result: ReturnType<typeof parseFeed> | undefined;
    expect(() => {
      result = parseFeed(truncated);
    }).not.toThrow();
    expect(result?.items).toEqual([{ id: 'https://x/1', title: 'Good', url: 'https://x/1' }]);
  });

  test('a non-feed body parses to zero items', () => {
    expect(parseFeed('<html><body>not a feed</body></html>').items).toEqual([]);
  });
});

// ── fetchRuntime ─────────────────────────────────────────────────────────────────

describe('fetchRuntime', () => {
  test('an RSS 2.0 feed normalizes to ok with its items', async () => {
    fetchMock.mockResolvedValueOnce(feedResponse(RSS_2_0));
    const runtime = await rssConnector.fetchRuntime(node());
    expect(runtime.state).toBe('ok');
    expect(runtime.items.map((i) => i.id)).toEqual(['guid-1', 'https://example.com/post-2']);
    // No credentials ride along for a public feed.
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: 'omit' });
  });

  test('an Atom feed normalizes to ok with its items', async () => {
    fetchMock.mockResolvedValueOnce(feedResponse(ATOM));
    const runtime = await rssConnector.fetchRuntime(
      node({ baseUrl: 'https://atom.example.com/feed' }),
    );
    expect(runtime.state).toBe('ok');
    expect(runtime.items.map((i) => i.url)).toEqual([
      'https://atom.example.com/1',
      'https://atom.example.com/2',
    ]);
  });

  test('keeps the WHOLE feed (not sliced to maxItems — the draining-queue model)', async () => {
    // The connector keeps the whole feed file; `maxItems` is an UNREAD budget
    // applied by the sidebar, not the connector's slice. The buffer bounds it.
    const threeItemFeed = `<rss version="2.0"><channel>
      <item><title>a</title><link>https://x/a</link></item>
      <item><title>b</title><link>https://x/b</link></item>
      <item><title>c</title><link>https://x/c</link></item>
    </channel></rss>`;
    fetchMock.mockResolvedValueOnce(feedResponse(threeItemFeed));
    const runtime = await rssConnector.fetchRuntime(node({ maxItems: 2 }));
    expect(runtime.state).toBe('ok');
    expect(runtime.items.map((i) => i.url)).toEqual(['https://x/a', 'https://x/b', 'https://x/c']);
  });

  test('a non-2xx response resolves to error, never signed-out', async () => {
    fetchMock.mockResolvedValueOnce(feedResponse('', { ok: false }));
    const runtime = await rssConnector.fetchRuntime(node());
    expect(runtime.state).toBe('error');
  });

  test('a network failure resolves to error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    const runtime = await rssConnector.fetchRuntime(node());
    expect(runtime.state).toBe('error');
  });

  test('an oversized declared body (Content-Length) resolves to error without reading', async () => {
    const textSpy = vi.fn(async () => RSS_2_0);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => String(10_000_000) },
      text: textSpy,
    });
    const runtime = await rssConnector.fetchRuntime(node());
    expect(runtime.state).toBe('error');
    expect(textSpy).not.toHaveBeenCalled();
  });

  test('an empty parse (non-feed body) resolves to error', async () => {
    fetchMock.mockResolvedValueOnce(feedResponse('<html>nope</html>'));
    const runtime = await rssConnector.fetchRuntime(node());
    expect(runtime.state).toBe('error');
  });

  test('a malformed baseUrl resolves to error without fetching', async () => {
    const runtime = await rssConnector.fetchRuntime(node({ baseUrl: 'not a url' }));
    expect(runtime.state).toBe('error');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ── listingUrl (design D6) ───────────────────────────────────────────────────────

describe('listingUrl', () => {
  test('falls back to the feed URL before any successful fetch', () => {
    expect(rssConnector.listingUrl(node())).toBe('https://news.example.com/rss');
  });

  test('returns the channel website link captured during a successful fetch', async () => {
    fetchMock.mockResolvedValueOnce(feedResponse(RSS_2_0));
    const n = node();
    await rssConnector.fetchRuntime(n);
    expect(rssConnector.listingUrl(n)).toBe('https://example.com');
  });
});
