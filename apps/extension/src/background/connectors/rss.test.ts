import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { ResolvedSourceConfig } from '../../shared/types';
import { parseFeed, resetRssListingCache, rssConnector } from './rss';

// ── test plumbing ──────────────────────────────────────────────────────────────

let fetchMock: ReturnType<typeof vi.fn>;

/** A minimal Response stand-in. `contentLength` overrides the declared body
 * size; `contentType` sets the Content-Type header (e.g. to inject a charset). */
function feedResponse(
  xml: string,
  {
    ok = true,
    contentLength,
    contentType,
  }: { ok?: boolean; contentLength?: string; contentType?: string } = {},
): unknown {
  const buf = new TextEncoder().encode(xml).buffer;
  return {
    ok,
    status: ok ? 200 : 500,
    headers: {
      get: (h: string) => {
        const lower = h.toLowerCase();
        if (lower === 'content-length') return contentLength ?? null;
        if (lower === 'content-type') return contentType ?? null;
        return null;
      },
    },
    arrayBuffer: async () => buf,
  };
}

/** Feed response with the body encoded as ISO-8859-1 (Latin-1), simulating
 * legacy feeds that declare `encoding="ISO-8859-1"` without an HTTP charset. */
function latin1FeedResponse(xml: string): unknown {
  // Encode each JS character to its Latin-1 byte value (code point & 0xFF).
  const bytes = new Uint8Array(xml.length);
  for (let i = 0; i < xml.length; i++) bytes[i] = xml.charCodeAt(i) & 0xff;
  return {
    ok: true,
    status: 200,
    headers: { get: () => null },
    arrayBuffer: async () => bytes.buffer,
  };
}

function node(overrides: Partial<ResolvedSourceConfig> = {}): ResolvedSourceConfig {
  return {
    source: 'rss',
    baseUrl: 'https://news.example.com/rss',
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

// ── parseFeed: richer content (smart-folder-page) ────────────────────────────────

describe('parseFeed rich content', () => {
  test('RSS: description → plain-text excerpt, media:content → image, pubDate → publishedAt', () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
        <channel>
          <item>
            <title>Hello</title>
            <link>https://news.example.com/a</link>
            <description><![CDATA[<p>A <b>bold</b> summary &amp; more.</p>]]></description>
            <media:content url="https://img.example.com/a.jpg" medium="image" />
            <pubDate>Wed, 02 Oct 2024 13:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>`;
    const { items } = parseFeed(xml);
    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item?.excerpt).toBe('A bold summary & more.'); // tags stripped, entity decoded
    expect(item?.imageUrl).toBe('https://img.example.com/a.jpg');
    expect(item?.publishedAt).toBe(Date.parse('Wed, 02 Oct 2024 13:00:00 GMT'));
  });

  test('image falls back to the first inline <img> in the description', () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <link>https://news.example.com/b</link>
            <description><![CDATA[<img src="https://img.example.com/inline.png"> text]]></description>
          </item>
        </channel>
      </rss>`;
    const { items } = parseFeed(xml);
    expect(items[0]?.imageUrl).toBe('https://img.example.com/inline.png');
  });

  test('enclosure image and media:thumbnail are recognized', () => {
    const encl = parseFeed(`<rss><channel><item>
      <link>https://news.example.com/c</link>
      <enclosure url="https://img.example.com/c.jpg" type="image/jpeg" />
    </item></channel></rss>`);
    expect(encl.items[0]?.imageUrl).toBe('https://img.example.com/c.jpg');

    const thumb = parseFeed(`<rss xmlns:media="http://search.yahoo.com/mrss/"><channel><item>
      <link>https://news.example.com/d</link>
      <media:thumbnail url="https://img.example.com/d.jpg" />
    </item></channel></rss>`);
    expect(thumb.items[0]?.imageUrl).toBe('https://img.example.com/d.jpg');
  });

  test('Atom: summary → excerpt, published → publishedAt', () => {
    const xml = `<?xml version="1.0"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <entry>
          <title>Atom post</title>
          <link rel="alternate" href="https://news.example.com/e" />
          <id>urn:e</id>
          <summary>Just a short summary.</summary>
          <published>2024-10-02T13:00:00Z</published>
        </entry>
      </feed>`;
    const { items } = parseFeed(xml);
    expect(items[0]?.excerpt).toBe('Just a short summary.');
    expect(items[0]?.publishedAt).toBe(Date.parse('2024-10-02T13:00:00Z'));
  });

  test('a plain item carries no rich fields (queue parity — keys omitted)', () => {
    const { items } = parseFeed(
      `<rss><channel><item><link>https://news.example.com/f</link></item></channel></rss>`,
    );
    expect(items[0]).toEqual({
      id: 'https://news.example.com/f',
      title: 'https://news.example.com/f',
      url: 'https://news.example.com/f',
    });
  });

  test('HTML entities in a CDATA title are decoded (numeric + named)', () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0"><channel><item>
        <title><![CDATA[Amflow&#8217;s e-bike &amp; the &#x201C;eSUV&#x201D; &mdash; ready]]></title>
        <link>https://news.example.com/h</link>
      </item></channel></rss>`;
    const { items } = parseFeed(xml);
    expect(items[0]?.title).toBe('Amflow’s e-bike & the “eSUV” — ready');
  });

  test('an unparseable date is omitted, not stored as NaN', () => {
    const { items } = parseFeed(
      `<rss><channel><item><link>https://news.example.com/g</link><pubDate>not a date</pubDate></item></channel></rss>`,
    );
    expect(items[0]?.publishedAt).toBeUndefined();
  });
});

// ── fetchRuntime ─────────────────────────────────────────────────────────────────

describe('fetchRuntime', () => {
  test('an RSS 2.0 feed normalizes to ok with its items', async () => {
    fetchMock.mockResolvedValueOnce(feedResponse(RSS_2_0));
    const runtime = await rssConnector.fetchRuntime(node(), 20);
    expect(runtime.state).toBe('ok');
    expect(runtime.items.map((i) => i.id)).toEqual(['guid-1', 'https://example.com/post-2']);
    // No credentials ride along for a public feed.
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ credentials: 'omit' });
  });

  test('an Atom feed normalizes to ok with its items', async () => {
    fetchMock.mockResolvedValueOnce(feedResponse(ATOM));
    const runtime = await rssConnector.fetchRuntime(
      node({ baseUrl: 'https://atom.example.com/feed' }),
      20,
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
    const runtime = await rssConnector.fetchRuntime(node(), 2);
    expect(runtime.state).toBe('ok');
    expect(runtime.items.map((i) => i.url)).toEqual(['https://x/a', 'https://x/b', 'https://x/c']);
  });

  test('a non-2xx response resolves to error, never signed-out', async () => {
    fetchMock.mockResolvedValueOnce(feedResponse('', { ok: false }));
    const runtime = await rssConnector.fetchRuntime(node(), 20);
    expect(runtime.state).toBe('error');
  });

  test('a network failure resolves to error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    const runtime = await rssConnector.fetchRuntime(node(), 20);
    expect(runtime.state).toBe('error');
  });

  test('an oversized declared body (Content-Length) resolves to error without reading', async () => {
    const bufSpy = vi.fn(async () => new ArrayBuffer(0));
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => String(10_000_000) },
      arrayBuffer: bufSpy,
    });
    const runtime = await rssConnector.fetchRuntime(node(), 20);
    expect(runtime.state).toBe('error');
    expect(bufSpy).not.toHaveBeenCalled();
  });

  test('Latin-1 encoded feed with XML encoding declaration is decoded correctly', async () => {
    // Simulates feeds like jornaldenegocios.pt: ISO-8859-1 bytes, no HTTP charset.
    const latin1Xml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<rss version="2.0"><channel>
  <title>Jornal</title>
  <link>https://jornaldenegocios.pt</link>
  <item>
    <title>Suíça rejeita proposta</title>
    <link>https://jornaldenegocios.pt/1</link>
  </item>
</channel></rss>`;
    fetchMock.mockResolvedValueOnce(latin1FeedResponse(latin1Xml));
    const runtime = await rssConnector.fetchRuntime(node(), 20);
    expect(runtime.state).toBe('ok');
    expect(runtime.items[0]?.title).toBe('Suíça rejeita proposta');
  });

  test('explicit HTTP charset overrides XML declaration', async () => {
    // Content-Type: charset wins when declared, even if XML says otherwise.
    fetchMock.mockResolvedValueOnce(
      feedResponse(RSS_2_0, { contentType: 'application/rss+xml; charset=utf-8' }),
    );
    const runtime = await rssConnector.fetchRuntime(node(), 20);
    expect(runtime.state).toBe('ok');
    expect(runtime.items).toHaveLength(2);
  });

  test('an empty parse (non-feed body) resolves to error', async () => {
    fetchMock.mockResolvedValueOnce(feedResponse('<html>nope</html>'));
    const runtime = await rssConnector.fetchRuntime(node(), 20);
    expect(runtime.state).toBe('error');
  });

  test('a malformed baseUrl resolves to error without fetching', async () => {
    const runtime = await rssConnector.fetchRuntime(node({ baseUrl: 'not a url' }), 20);
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
    await rssConnector.fetchRuntime(n, 20);
    expect(rssConnector.listingUrl(n)).toBe('https://example.com');
  });
});

describe('requiredOrigins', () => {
  test('is the feed origin the connector fetches directly (D8/D9)', () => {
    expect(
      rssConnector.requiredOrigins({ source: 'rss', baseUrl: 'https://blog.example.com/feed.xml' }),
    ).toEqual(['https://blog.example.com/*']);
  });
});
