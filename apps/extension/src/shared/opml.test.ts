import { describe, expect, test } from 'vitest';
import { buildOpml, type LensNode, parseOpml } from './opml';
import type { AppState, SourceAccount } from './types';

// ── parseOpml ──────────────────────────────────────────────────────────────────

const FLAT_OPML = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head><title>Feeds</title></head>
  <body>
    <outline type="rss" text="HN" xmlUrl="https://hnrss.org/frontpage"/>
    <outline type="rss" text="Lobsters" xmlUrl="https://lobste.rs/rss"/>
    <outline type="rss" text="Julia Evans" xmlUrl="https://jvns.ca/atom.xml"/>
  </body>
</opml>`;

const NESTED_OPML = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head><title>Feeds</title></head>
  <body>
    <outline text="Tech" title="Tech">
      <outline type="rss" text="HN" xmlUrl="https://hnrss.org/frontpage"/>
      <outline type="rss" text="Lobsters" xmlUrl="https://lobste.rs/rss"/>
    </outline>
    <outline text="Blogs" title="Blogs">
      <outline type="rss" text="Julia Evans" xmlUrl="https://jvns.ca/atom.xml"/>
    </outline>
  </body>
</opml>`;

const MIXED_OPML = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <body>
    <outline text="Category" title="Category"/>
    <outline type="rss" text="HN" xmlUrl="https://hnrss.org/frontpage"/>
    <outline text="Another Category"/>
    <outline type="rss" text="Lobsters" xmlUrl="https://lobste.rs/rss"/>
  </body>
</opml>`;

describe('parseOpml', () => {
  test('flat OPML with RSS outlines', () => {
    const result = parseOpml(FLAT_OPML);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ name: 'HN', feedUrl: 'https://hnrss.org/frontpage' });
    expect(result[1]).toEqual({ name: 'Lobsters', feedUrl: 'https://lobste.rs/rss' });
    expect(result[2]).toEqual({ name: 'Julia Evans', feedUrl: 'https://jvns.ca/atom.xml' });
  });

  test('nested OPML is flattened', () => {
    const result = parseOpml(NESTED_OPML);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.name)).toEqual(['HN', 'Lobsters', 'Julia Evans']);
  });

  test('outlines without xmlUrl are skipped', () => {
    const result = parseOpml(MIXED_OPML);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.feedUrl)).toEqual([
      'https://hnrss.org/frontpage',
      'https://lobste.rs/rss',
    ]);
  });

  test('name falls back through text → title → xmlUrl', () => {
    const xml = `<opml version="1.0"><body>
      <outline type="rss" title="By Title" xmlUrl="https://a.com/feed"/>
      <outline type="rss" xmlUrl="https://b.com/feed"/>
    </body></opml>`;
    const result = parseOpml(xml);
    expect(result[0]?.name).toBe('By Title');
    expect(result[1]?.name).toBe('https://b.com/feed');
  });

  test('malformed XML does not throw and returns partial results', () => {
    const xml = `<opml version="1.0"><body>
      <outline type="rss" text="HN" xmlUrl="https://hnrss.org/frontpage"/>
      <!-- truncated here`;
    expect(() => parseOpml(xml)).not.toThrow();
    // The first well-formed outline should still be collected.
    const result = parseOpml(xml);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]?.name).toBe('HN');
  });

  test('bare & in head title is fixed and all feeds are still collected', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>Tech & Crypto News</title></head>
  <body>
    <outline text="World & Europe" title="World & Europe">
      <outline type="rss" text="Guardian" xmlUrl="https://www.theguardian.com/world/rss"/>
    </outline>
    <outline type="rss" text="DW" xmlUrl="https://rss.dw.com/rdf/rss-en-all"/>
  </body>
</opml>`;
    const result = parseOpml(xml);
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe('Guardian');
    expect(result[1]?.name).toBe('DW');
  });

  test('no RSS outlines returns empty array', () => {
    const xml = `<opml version="1.0"><body>
      <outline text="Category"/>
      <outline type="link" text="Page" url="https://example.com"/>
    </body></opml>`;
    expect(parseOpml(xml)).toEqual([]);
  });
});

// ── buildOpml ─────────────────────────────────────────────────────────────────

// Lens nodes now carry account REFERENCES (`{ sourceId, queries }`); buildOpml
// resolves each against the `AppState.sources` account map (connector-accounts).
function acct(id: string, provider: SourceAccount['provider'], baseUrl: string): SourceAccount {
  return { id, provider, baseUrl };
}

function sourcesOf(...accts: SourceAccount[]): AppState['sources'] {
  return Object.fromEntries(accts.map((a) => [a.id, a]));
}

function node(overrides: Partial<LensNode> & { sources?: LensNode['sources'] } = {}): LensNode {
  const { sources, ...rest } = overrides;
  return {
    kind: 'lens',
    lensKind: 'general',
    id: 'sf-1',
    name: 'HN',
    icon: 'rss',
    sources: sources ?? [{ sourceId: 'acc-hn', queries: [] }],
    maxItems: 10,
    hideRead: false,
    refreshMinutes: 30,
    ...rest,
  };
}

describe('buildOpml', () => {
  test('single rss reference → 1 outline (task 3.7)', () => {
    const sources = sourcesOf(acct('acc-hn', 'rss', 'https://hnrss.org/frontpage'));
    const output = buildOpml([node()], sources);
    expect(output).toContain('<outline type="rss"');
    expect(output).toContain('text="HN"');
    expect(output).toContain('xmlUrl="https://hnrss.org/frontpage"');
    expect(output).toContain('htmlUrl="https://hnrss.org/frontpage"');
    expect(output).toContain('<opml version="1.0">');
    expect(output).toContain('<title>Lunma feed subscriptions</title>');
    expect(output.match(/<outline /g) ?? []).toHaveLength(1);
  });

  test('multi-source (rss + gitlab) → 1 outline, gitlab excluded (task 3.7)', () => {
    const sources = sourcesOf(
      acct('acc-hn', 'rss', 'https://hnrss.org/frontpage'),
      acct('acc-gl', 'gitlab', 'https://gitlab.com'),
    );
    const mixed = node({
      name: 'Work',
      sources: [
        { sourceId: 'acc-hn', queries: [] },
        { sourceId: 'acc-gl', queries: ['authored'] },
      ],
    });
    const output = buildOpml([mixed], sources);
    const outlines = output.match(/<outline /g) ?? [];
    expect(outlines).toHaveLength(1);
    expect(output).not.toContain('gitlab');
    expect(output).toContain('xmlUrl="https://hnrss.org/frontpage"');
  });

  test('a dangling rss reference (account absent) is skipped (task 3.7)', () => {
    const sources = sourcesOf(acct('acc-hn', 'rss', 'https://hnrss.org/frontpage'));
    const withDangling = node({
      name: 'Work',
      sources: [
        { sourceId: 'acc-hn', queries: [] },
        { sourceId: 'acc-missing', queries: [] },
      ],
    });
    const output = buildOpml([withDangling], sources);
    const outlines = output.match(/<outline /g) ?? [];
    expect(outlines).toHaveLength(1);
    expect(output).toContain('xmlUrl="https://hnrss.org/frontpage"');
  });

  test('multi-source (rss + rss) → 2 outlines with host-qualified text (task 3.7)', () => {
    const sources = sourcesOf(
      acct('acc-hn', 'rss', 'https://hnrss.org/frontpage'),
      acct('acc-lob', 'rss', 'https://lobste.rs/rss'),
    );
    const dual = node({
      name: 'Feeds',
      sources: [
        { sourceId: 'acc-hn', queries: [] },
        { sourceId: 'acc-lob', queries: [] },
      ],
    });
    const output = buildOpml([dual], sources);
    const outlines = output.match(/<outline /g) ?? [];
    expect(outlines).toHaveLength(2);
    // Both outlines qualify the name with the host.
    expect(output).toContain('text="Feeds — hnrss.org"');
    expect(output).toContain('text="Feeds — lobste.rs"');
  });

  test('folder with only non-rss references emits no outlines', () => {
    const sources = sourcesOf(acct('acc-gh', 'github', 'https://github.com'));
    const githubOnly = node({
      name: 'GH',
      sources: [{ sourceId: 'acc-gh', queries: ['assigned'] }],
    });
    const output = buildOpml([githubOnly], sources);
    expect(output).not.toContain('<outline');
    expect(output).not.toContain('GH');
  });

  test('htmlUrl equals baseUrl', () => {
    const sources = sourcesOf(acct('acc-x', 'rss', 'https://example.com/feed'));
    const output = buildOpml([node({ sources: [{ sourceId: 'acc-x', queries: [] }] })], sources);
    expect(output).toContain('xmlUrl="https://example.com/feed"');
    expect(output).toContain('htmlUrl="https://example.com/feed"');
  });

  test('XML special characters in name and URL are escaped', () => {
    const sources = sourcesOf(acct('acc-x', 'rss', 'https://example.com/feed?a=1&b=2'));
    const output = buildOpml(
      [node({ name: 'A & B', sources: [{ sourceId: 'acc-x', queries: [] }] })],
      sources,
    );
    expect(output).toContain('text="A &amp; B"');
    expect(output).toContain('xmlUrl="https://example.com/feed?a=1&amp;b=2"');
  });
});
