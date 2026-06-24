import { SaxesParser } from 'saxes';
import type { PinNode } from './types';

export type LensNode = Extract<PinNode, { kind: 'lens' }>;

/**
 * Parse an OPML XML string and return the RSS feed entries found at any
 * nesting depth. Container outlines (no `xmlUrl`) are silently skipped.
 * Bare `&` characters not part of an XML entity reference are normalised to
 * `&amp;` before parsing (many OPML generators emit unescaped ampersands).
 * Remaining saxes errors do not throw — whatever was collected is returned.
 * Returns `[]` when no qualifying outlines exist.
 */
export function parseOpml(xml: string): { name: string; feedUrl: string }[] {
  const parser = new SaxesParser({ xmlns: false });
  const results: { name: string; feedUrl: string }[] = [];

  parser.on('opentag', (tag) => {
    const attrs = tag.attributes;
    const tagName = tag.name.toLowerCase();
    if (tagName !== 'outline') return;

    const type = (attrs.type ?? '').toLowerCase();
    if (type !== 'rss') return;

    const xmlUrl = attrs.xmlUrl ?? attrs.xmlurl ?? '';
    if (!xmlUrl) return;

    const name = attrs.text ?? attrs.title ?? xmlUrl;
    results.push({ name, feedUrl: xmlUrl });
  });

  try {
    parser.write(fixBareAmpersands(xml)).close();
  } catch {
    // Return whatever was collected before the error.
  }

  return results;
}

/**
 * Replace bare `&` characters that are not already part of a valid XML entity
 * reference with `&amp;`. This handles the common case of OPML files generated
 * by tools that do not escape ampersands in title or outline text attributes.
 */
function fixBareAmpersands(xml: string): string {
  return xml.replace(/&(?!(?:[a-zA-Z][a-zA-Z0-9]*|#[0-9]+|#x[0-9a-fA-F]+);)/g, '&amp;');
}

/**
 * Serialise RSS smart-folder nodes to an OPML 1.0 XML string. Non-RSS sources
 * are excluded; each rss entry in `sources[]` becomes one `<outline>`. For
 * folders with >1 rss source the outline `text` is qualified with the host
 * (`${node.name} — ${host}`) to disambiguate. `htmlUrl` is set to `baseUrl`.
 */
export function buildOpml(folders: LensNode[]): string {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<opml version="1.0">',
    '  <head><title>Lunma feed subscriptions</title></head>',
    '  <body>',
  ];

  for (const node of folders) {
    const rssSources = node.sources.filter((s) => s.source === 'rss');
    const isMulti = node.sources.length >= 2 || rssSources.length > 1;
    for (const src of rssSources) {
      let host: string;
      try {
        host = new URL(src.baseUrl).host;
      } catch {
        host = src.baseUrl;
      }
      const label = isMulti ? `${node.name} — ${host}` : node.name;
      const text = escapeXml(label);
      const url = escapeXml(src.baseUrl);
      lines.push(`    <outline type="rss" text="${text}" xmlUrl="${url}" htmlUrl="${url}"/>`);
    }
  }

  lines.push('  </body>', '</opml>');
  return lines.join('\n');
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
