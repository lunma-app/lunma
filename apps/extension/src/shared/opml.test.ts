import { describe, expect, test } from 'vitest';
import { buildOpml, parseOpml, type SmartFolderNode } from './opml';

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

function node(
  overrides: Partial<SmartFolderNode> & { sources?: SmartFolderNode['sources'] } = {},
): SmartFolderNode {
  const { sources, ...rest } = overrides;
  return {
    kind: 'smart',
    id: 'sf-1',
    name: 'HN',
    icon: 'rss',
    sources: sources ?? [{ source: 'rss', baseUrl: 'https://hnrss.org/frontpage', queries: [] }],
    maxItems: 10,
    hideRead: false,
    refreshMinutes: 30,
    ...rest,
  };
}

describe('buildOpml', () => {
  test('single-source rss node → 1 outline (task 8.6)', () => {
    const output = buildOpml([node()]);
    expect(output).toContain('<outline type="rss"');
    expect(output).toContain('text="HN"');
    expect(output).toContain('xmlUrl="https://hnrss.org/frontpage"');
    expect(output).toContain('htmlUrl="https://hnrss.org/frontpage"');
    expect(output).toContain('<opml version="1.0">');
    expect(output).toContain('<title>Lunma feed subscriptions</title>');
    expect(output.match(/<outline /g) ?? []).toHaveLength(1);
  });

  test('multi-source (rss + gitlab) → 1 outline, gitlab excluded (task 8.6)', () => {
    const mixed = node({
      name: 'Work',
      sources: [
        { source: 'rss', baseUrl: 'https://hnrss.org/frontpage', queries: [] },
        { source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored'] },
      ],
    });
    const output = buildOpml([mixed]);
    const outlines = output.match(/<outline /g) ?? [];
    expect(outlines).toHaveLength(1);
    expect(output).not.toContain('gitlab');
    expect(output).toContain('xmlUrl="https://hnrss.org/frontpage"');
  });

  test('multi-source (rss + rss) → 2 outlines with host-qualified text (task 8.6)', () => {
    const dual = node({
      name: 'Feeds',
      sources: [
        { source: 'rss', baseUrl: 'https://hnrss.org/frontpage', queries: [] },
        { source: 'rss', baseUrl: 'https://lobste.rs/rss', queries: [] },
      ],
    });
    const output = buildOpml([dual]);
    const outlines = output.match(/<outline /g) ?? [];
    expect(outlines).toHaveLength(2);
    // Both outlines qualify the name with the host.
    expect(output).toContain('text="Feeds — hnrss.org"');
    expect(output).toContain('text="Feeds — lobste.rs"');
  });

  test('folder with only non-rss sources emits no outlines', () => {
    const githubOnly = node({
      name: 'GH',
      sources: [{ source: 'github', baseUrl: 'https://api.github.com', queries: ['assigned'] }],
    });
    const output = buildOpml([githubOnly]);
    expect(output).not.toContain('<outline');
    expect(output).not.toContain('GH');
  });

  test('htmlUrl equals baseUrl', () => {
    const output = buildOpml([
      node({ sources: [{ source: 'rss', baseUrl: 'https://example.com/feed', queries: [] }] }),
    ]);
    expect(output).toContain('xmlUrl="https://example.com/feed"');
    expect(output).toContain('htmlUrl="https://example.com/feed"');
  });

  test('XML special characters in name and URL are escaped', () => {
    const output = buildOpml([
      node({
        name: 'A & B',
        sources: [{ source: 'rss', baseUrl: 'https://example.com/feed?a=1&b=2', queries: [] }],
      }),
    ]);
    expect(output).toContain('text="A &amp; B"');
    expect(output).toContain('xmlUrl="https://example.com/feed?a=1&amp;b=2"');
  });
});
