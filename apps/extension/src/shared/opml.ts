import { SaxesParser } from 'saxes';
import type { AppState, PinNode } from './types';

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
 * Serialise RSS lens nodes to an OPML 1.0 XML string (connector-accounts). Each
 * lens reference is resolved against `AppState.sources`; one `<outline>` is
 * emitted per reference whose resolved account has `provider === 'rss'`. A
 * reference whose `sourceId` is absent from `sources` (dangling) is skipped, as
 * are non-rss references. For a folder resolving to >1 rss account the outline
 * `text` is qualified with the host (`${node.name} — ${host}`) to disambiguate;
 * `xmlUrl`/`htmlUrl` are the resolved account's `baseUrl`.
 */
export function buildOpml(folders: LensNode[], sources: AppState['sources']): string {
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<opml version="1.0">',
    '  <head><title>Lunma feed subscriptions</title></head>',
    '  <body>',
  ];

  for (const node of folders) {
    const rssAccounts = node.sources.flatMap((ref) => {
      const account = sources[ref.sourceId];
      return account && account.provider === 'rss' ? [account] : [];
    });
    const isMulti = rssAccounts.length > 1;
    for (const account of rssAccounts) {
      let host: string;
      try {
        host = new URL(account.baseUrl).host;
      } catch {
        host = account.baseUrl;
      }
      const label = isMulti ? `${node.name} — ${host}` : node.name;
      const text = escapeXml(label);
      const url = escapeXml(account.baseUrl);
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
