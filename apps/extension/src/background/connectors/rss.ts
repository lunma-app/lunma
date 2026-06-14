import { SaxesParser } from 'saxes';
import type { SmartFolderItem, SmartFolderRuntime } from '../../shared/types';
import {
  boundedFetch,
  type ConnectorCaches,
  type SmartFolderNode,
  type SourceConnector,
} from './connector';

/**
 * The RSS connector (rss-connector) — the first FEED source: a public feed URL,
 * no identity, no canned query, parsed from XML, that never empties.
 *
 *   - parse: RSS 2.0 + Atom in one DOM-free streaming pass over `saxes` (the MV3
 *     service worker has NO `DOMParser`, design D1) — CDATA + standard XML
 *     entities decoded, element-wise tolerant (one bad entry never costs the
 *     rest; a parser error keeps whatever parsed cleanly);
 *   - fetch: `boundedFetch` with NO credentials (a public feed), an oversized
 *     body rejected; results sliced to the node's `maxItems`;
 *   - states: `pending | ok | error` ONLY — `signed-out` is impossible for a
 *     public feed (design D11); a network failure / non-2xx / oversized body /
 *     empty parse resolves to the quiet `error` state (last-known items hold);
 *   - listingUrl: the feed channel's own website link, captured during parse
 *     (design D6) and memoised per feed URL, falling back to the feed URL.
 *
 * The source-agnostic engine (scheduling, in-flight guard, result-event
 * plumbing) stays in `../smart-folders.ts` and reaches this module only through
 * the `CONNECTORS` registry.
 */

/**
 * Response-body byte ceiling (design risk: malformed/huge feed XML). A body
 * whose `Content-Length` — or, absent that, whose decoded length — exceeds this
 * resolves to the quiet `error` state rather than parsing megabytes of XML in
 * the SW. 5 MB comfortably clears even large full-text feeds.
 */
const MAX_FEED_BYTES = 5_000_000;

/**
 * Per-feed item buffer (rss-connector, the draining-queue model). The connector
 * keeps the whole feed file (newest-first) up to this bound — NOT sliced to the
 * node's `maxItems` — so the sidebar can surface the newest `maxItems` **unread**
 * items and backfill older unread as you read (the cap is an unread budget, not
 * a fetch cap). Bounds runtime memory + the persisted read-id set (pruned to
 * this window). A feed file is one snapshot of recent entries (no pagination),
 * so 200 comfortably holds any realistic feed.
 */
const FEED_BUFFER = 200;

/**
 * The feed channel's website link, memoised per feed URL once a parse discovers
 * it (design D6). In-memory (module scope, like a connector's own working
 * state): it heals on the first fetch after an SW restart; until then
 * `listingUrl` falls back to the feed URL. Never persisted — a website link is
 * cheap to re-derive and the fallback is always valid.
 */
const channelLinkByFeed = new Map<string, string>();

/** Strip any namespace prefix (`atom:link` → `link`) and lowercase, so RSS 2.0
 * and Atom element names compare uniformly regardless of prefix/case. */
function localName(name: string): string {
  const colon = name.lastIndexOf(':');
  return (colon === -1 ? name : name.slice(colon + 1)).toLowerCase();
}

/** A feed entry under construction (one `<item>` / `<entry>`). */
interface DraftEntry {
  title?: string;
  /** RSS `<guid>` / Atom `<id>` — the stable id, preferred over the url. */
  id?: string;
  /** The entry's link: RSS `<link>` text, or Atom `link[rel=alternate|'']`. */
  url?: string;
}

/** Which leaf element's text we are currently accumulating, and into where. */
type Capture = 'title' | 'id' | 'rss-link' | 'channel-link' | null;

/**
 * Parse a syndication feed (RSS 2.0 or Atom) in one streaming SAX pass.
 * Element-wise tolerant: an entry is only committed on its closing tag, so a
 * malformed entry mid-stream loses only itself, and a parser error keeps every
 * entry already committed. Returns the normalized items plus the channel-level
 * website link when present (for `listingUrl`).
 */
export function parseFeed(xml: string): { items: SmartFolderItem[]; channelLink?: string } {
  const parser = new SaxesParser();
  const items: SmartFolderItem[] = [];
  const stack: string[] = [];
  let channelLink: string | undefined;
  let entry: DraftEntry | null = null;
  let capture: Capture = null;
  let buf = '';

  const append = (text: string): void => {
    if (capture !== null) buf += text;
  };

  parser.on('opentag', (tag) => {
    const name = localName(tag.name);
    const parent = stack[stack.length - 1];
    const attrs = tag.attributes as Record<string, string>;

    if (name === 'item' || name === 'entry') {
      // A fresh entry; any stray capture from malformed prior markup is dropped.
      entry = {};
      capture = null;
    } else if (entry !== null) {
      // Inside an item/entry: capture its leaf fields.
      if (name === 'title') {
        capture = 'title';
        buf = '';
      } else if (name === 'guid' || name === 'id') {
        capture = 'id';
        buf = '';
      } else if (name === 'link') {
        const href = attrs.href;
        if (href !== undefined) {
          // Atom link: prefer the alternate (a missing `rel` defaults to
          // alternate per Atom); ignore self/edit/enclosure/related/via.
          const rel = (attrs.rel ?? '').toLowerCase();
          if ((rel === '' || rel === 'alternate') && entry.url === undefined) {
            entry.url = href;
          }
        } else {
          capture = 'rss-link';
          buf = '';
        }
      }
    } else if (parent === 'channel' || parent === 'feed') {
      // Channel/feed level: capture only the website link.
      if (name === 'link') {
        const href = attrs.href;
        if (href !== undefined) {
          const rel = (attrs.rel ?? '').toLowerCase();
          if ((rel === '' || rel === 'alternate') && channelLink === undefined) {
            channelLink = href;
          }
        } else {
          capture = 'channel-link';
          buf = '';
        }
      }
    }

    stack.push(name);
  });

  parser.on('text', append);
  parser.on('cdata', append);

  parser.on('closetag', (tag) => {
    const name = localName(tag.name);
    stack.pop();

    if (capture !== null) {
      const value = buf.trim();
      if (value !== '') {
        if (capture === 'channel-link') {
          if (channelLink === undefined) channelLink = value;
        } else if (entry !== null) {
          if (capture === 'title') entry.title = value;
          else if (capture === 'id') entry.id ??= value;
          else if (capture === 'rss-link' && entry.url === undefined) entry.url = value;
        }
      }
      capture = null;
      buf = '';
    }

    if (name === 'item' || name === 'entry') {
      if (entry !== null && entry.url !== undefined) {
        // `id` from guid/id, falling back to the url (gitlab.ts's id-fallback
        // precedent); a link-less entry can't be opened, so it is dropped.
        items.push({
          id: entry.id ?? entry.url,
          title: entry.title ?? entry.url,
          url: entry.url,
        });
      }
      entry = null;
    }
  });

  // Swallow well-formedness errors: whatever committed cleanly is kept (design
  // D1 / the risks note). A no-op handler keeps saxes from throwing.
  parser.on('error', () => {
    /* intentionally ignored — element-wise tolerance keeps what parsed */
  });

  try {
    parser.write(xml).close();
  } catch {
    // A throw past the error handler still keeps the entries already committed.
  }

  return channelLink === undefined ? { items } : { items, channelLink };
}

/**
 * Fetch one RSS folder's feed and normalize it. Never throws — every failure
 * shape resolves to a runtime state. No credentials (a public feed), so
 * `signed-out` is unreachable and never returned (design D11). The `caches`
 * parameter is unused (no per-cycle resolution to share).
 */
async function fetchRuntime(
  node: Pick<SmartFolderNode, 'baseUrl' | 'query' | 'maxItems'>,
  _caches?: ConnectorCaches,
): Promise<SmartFolderRuntime> {
  const fetchedAt = Date.now();
  const fail = (): SmartFolderRuntime => ({ state: 'error', items: [], fetchedAt });

  try {
    // A malformed persisted baseUrl (defensive — the SW validates on
    // create/update) degrades to the quiet error state, never a throw.
    new URL(node.baseUrl);
  } catch {
    return fail();
  }

  let response: Response;
  try {
    // Bounded: a timeout rejects (AbortError) into the catch below → error.
    response = await boundedFetch(node.baseUrl, { credentials: 'omit' });
  } catch {
    return fail();
  }
  if (!response.ok) return fail();

  // Reject an oversized body BEFORE reading it when the length is declared;
  // re-check the decoded length as a backstop for chunked responses.
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_FEED_BYTES) return fail();

  let xml: string;
  try {
    xml = await response.text();
  } catch {
    return fail();
  }
  if (xml.length > MAX_FEED_BYTES) return fail();

  const { items, channelLink } = parseFeed(xml);
  // An empty parse (a non-feed body, or nothing well-formed) is an error, so the
  // last-known items hold rather than blanking the folder (design D11).
  if (items.length === 0) return fail();

  if (channelLink !== undefined) channelLinkByFeed.set(node.baseUrl, channelLink);

  // Keep the whole feed (bounded) — the sidebar applies the per-folder unread
  // budget. `node.maxItems` is intentionally NOT the connector's slice for a
  // feed (the draining-queue model); the buffer bounds memory + read-state.
  return { state: 'ok', items: items.slice(0, FEED_BUFFER), fetchedAt };
}

/** The feed's listing URL: the channel website link captured during the last
 * successful parse, falling back to the feed URL (design D6). No network I/O. */
function listingUrl(node: Pick<SmartFolderNode, 'baseUrl' | 'query'>): string {
  return channelLinkByFeed.get(node.baseUrl) ?? node.baseUrl;
}

/** The RSS `SourceConnector` — the registry's `rss` entry. `defaultBaseUrl` is
 * empty (a feed has no canonical host); the SW mints the `'rss'` icon. */
export const rssConnector: SourceConnector = {
  source: 'rss',
  defaultBaseUrl: '',
  mintedIcon: 'rss',
  fetchRuntime,
  listingUrl,
};

/** Test-only: clear the per-feed channel-link memo between cases. */
export function resetRssListingCache(): void {
  channelLinkByFeed.clear();
}
