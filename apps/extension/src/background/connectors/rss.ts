import { SaxesParser } from 'saxes';
import { PROVIDER_AUTH_METHODS } from '../../shared/auth-method';
import { requiredOriginsForConfig } from '../../shared/connector-origins';
import type { LensItem, LensSectionRuntime, ResolvedLensSource } from '../../shared/types';
import { boundedFetch, type ConnectorCaches, type SourceConnector } from './connector';

/**
 * The RSS connector (rss-connector) — the first FEED source: a public feed URL,
 * no identity, no canned query, parsed from XML, that never empties.
 *
 *   - parse: RSS 2.0 + Atom in one DOM-free streaming pass over `saxes` (the MV3
 *     service worker has NO `DOMParser`, design D1) — CDATA + standard XML
 *     entities decoded, element-wise tolerant (one bad entry never costs the
 *     rest; a parser error keeps whatever parsed cleanly);
 *   - fetch: `boundedFetch` with NO credentials (a public feed), an oversized
 *     body rejected; results buffered for the draining-queue model;
 *   - states: `pending | ok | error` ONLY — `signed-out` is impossible for a
 *     public feed (design D11); a network failure / non-2xx / oversized body /
 *     empty parse resolves to the quiet `error` state (last-known items hold);
 *   - listingUrl: the feed channel's own website link, captured during parse
 *     (design D6) and memoised per feed URL, falling back to the feed URL.
 *
 * The source-agnostic engine (scheduling, in-flight guard, result-event
 * plumbing) stays in `../lenses.ts` and reaches this module only through
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
 * section's `maxItems` — so the sidebar can surface the newest `maxItems`
 * **unread** items and backfill older unread as you read (the cap is an unread
 * budget, not a fetch cap). Bounds runtime memory + the persisted read-id set
 * (pruned to this window). A feed file is one snapshot of recent entries (no
 * pagination), so 200 comfortably holds any realistic feed.
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
  /** RSS `<description>` / Atom `<summary>` — the short summary (raw, may be HTML). */
  summaryRaw?: string;
  /** RSS `<content:encoded>` / Atom `<content>` — full body (raw HTML). */
  contentRaw?: string;
  /** First explicit media image (media:content / media:thumbnail / enclosure). */
  image?: string;
  /** Raw publication date text (RSS pubDate / Atom published|updated). */
  dateText?: string;
  /** First `<category>` — RSS 2.0 text body or Atom `@term` — the article genre. */
  category?: string;
}

/** Which leaf element's text we are currently accumulating, and into where. */
type Capture =
  | 'title'
  | 'id'
  | 'rss-link'
  | 'channel-link'
  | 'description'
  | 'content'
  | 'date'
  | 'category'
  | null;

/** Richer-content extraction (smart-folder-page). The SW has no DOMParser, so
 * description HTML is reduced with bounded regexes — never parsed as a document. */
const IMAGE_EXT = /\.(?:jpe?g|png|gif|webp|avif)(?:[?#]|$)/i;
const EXCERPT_MAX = 280;

function looksLikeImageUrl(u: string | undefined): boolean {
  return u !== undefined && IMAGE_EXT.test(u);
}

// Common named HTML entities (not the five XML built-ins — those saxes already
// decodes outside CDATA). Feeds routinely put HTML-encoded text INSIDE CDATA
// titles/descriptions, where saxes leaves it literal, so we decode it here.
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  copy: '©',
  reg: '®',
  trade: '™',
  deg: '°',
  eacute: 'é',
  egrave: 'è',
  agrave: 'à',
};

/** Decode HTML entities — numeric decimal (`&#8217;`), hex (`&#x2019;`), and the
 * common named set. Unknown entities are left verbatim. Applied to feed titles
 * and excerpts so CDATA-encoded / double-encoded text renders as real glyphs. */
function decodeHtmlEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]*);/gi, (whole, body: string) => {
    if (body[0] === '#') {
      const hex = body[1] === 'x' || body[1] === 'X';
      const code = Number.parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (!Number.isFinite(code) || code <= 0) return whole;
      try {
        return String.fromCodePoint(code);
      } catch {
        return whole;
      }
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
  });
}

/** Reduce description HTML to clamped plain text for the card excerpt. */
function htmlToExcerpt(html: string | undefined): string | undefined {
  if (html === undefined) return undefined;
  const text = decodeHtmlEntities(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
  if (text === '') return undefined;
  return text.length <= EXCERPT_MAX ? text : `${text.slice(0, EXCERPT_MAX - 1).trimEnd()}…`;
}

/** First inline `<img src>` in description HTML — the fallback image. */
function firstImageFromHtml(html: string | undefined): string | undefined {
  if (html === undefined) return undefined;
  return /<img[^>]+\bsrc=["']([^"']+)["']/i.exec(html)?.[1];
}

/** Parse a feed date (RFC-822 or ISO-8601) to epoch ms; undefined when unparseable. */
function parseFeedDate(text: string | undefined): number | undefined {
  if (text === undefined) return undefined;
  const ms = Date.parse(text);
  return Number.isNaN(ms) ? undefined : ms;
}

/**
 * Parse a syndication feed (RSS 2.0 or Atom) in one streaming SAX pass.
 * Element-wise tolerant: an entry is only committed on its closing tag, so a
 * malformed entry mid-stream loses only itself, and a parser error keeps every
 * entry already committed. Returns the normalized items plus the channel-level
 * website link when present (for `listingUrl`).
 */
export function parseFeed(xml: string): { items: LensItem[]; channelLink?: string } {
  const parser = new SaxesParser({ xmlns: false });
  const items: LensItem[] = [];
  const stack: string[] = [];
  let channelLink: string | undefined;
  let entry: DraftEntry | null = null;
  let capture: Capture = null;
  let buf = '';
  // A strong date element (pubDate / published) overrides a weak one (updated /
  // dc:date) regardless of document order; a weak one only fills an empty slot.
  let dateStrong = false;

  const append = (text: string): void => {
    if (capture !== null) buf += text;
  };

  parser.on('opentag', (tag) => {
    const name = localName(tag.name);
    const parent = stack[stack.length - 1];
    const attrs = tag.attributes;

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
          // alternate per Atom); ignore self/edit/related/via. An enclosure link
          // that is an image is a thumbnail candidate.
          const rel = (attrs.rel ?? '').toLowerCase();
          if ((rel === '' || rel === 'alternate') && entry.url === undefined) {
            entry.url = href;
          } else if (
            rel === 'enclosure' &&
            entry.image === undefined &&
            ((attrs.type ?? '').toLowerCase().startsWith('image') || looksLikeImageUrl(href))
          ) {
            entry.image = href;
          }
        } else {
          capture = 'rss-link';
          buf = '';
        }
      } else if (name === 'description' || name === 'summary') {
        // The short summary (smart-folder-page card excerpt).
        capture = 'description';
        buf = '';
      } else if (name === 'encoded') {
        // RSS content:encoded — the full body (richer image source).
        capture = 'content';
        buf = '';
      } else if (name === 'content') {
        // Ambiguous: `media:content` (image, has @url) vs Atom `<content>` (body).
        const url = attrs.url;
        if (url !== undefined) {
          const medium = (attrs.medium ?? '').toLowerCase();
          const type = (attrs.type ?? '').toLowerCase();
          if (
            entry.image === undefined &&
            (medium === 'image' || type.startsWith('image') || looksLikeImageUrl(url))
          ) {
            entry.image = url;
          }
        } else {
          capture = 'content';
          buf = '';
        }
      } else if (name === 'thumbnail') {
        // media:thumbnail — always an image.
        if (entry.image === undefined && attrs.url !== undefined) entry.image = attrs.url;
      } else if (name === 'enclosure') {
        const url = attrs.url;
        if (
          url !== undefined &&
          entry.image === undefined &&
          ((attrs.type ?? '').toLowerCase().startsWith('image') || looksLikeImageUrl(url))
        ) {
          entry.image = url;
        }
      } else if (name === 'category') {
        // Atom `<category term="Foo"/>` carries its value in the attribute (self-
        // closing, no text body); RSS 2.0 `<category>Tech</category>` is a text
        // body, collected like the other leaves. FIRST category wins (see closetag).
        const term = attrs.term;
        if (term !== undefined) entry.category ??= term;
        else {
          capture = 'category';
          buf = '';
        }
      } else if (
        name === 'pubdate' ||
        name === 'published' ||
        name === 'updated' ||
        name === 'date'
      ) {
        capture = 'date';
        buf = '';
        // pubDate / published are authoritative; updated / dc:date only backfill.
        dateStrong = name === 'pubdate' || name === 'published';
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
          else if (capture === 'description') entry.summaryRaw ??= value;
          else if (capture === 'content') entry.contentRaw ??= value;
          else if (capture === 'date' && (dateStrong || entry.dateText === undefined))
            entry.dateText = value;
          else if (capture === 'category') entry.category ??= value;
        }
      }
      capture = null;
      buf = '';
    }

    if (name === 'item' || name === 'entry') {
      if (entry !== null && entry.url !== undefined) {
        // `id` from guid/id, falling back to the url (gitlab.ts's id-fallback
        // precedent); a link-less entry can't be opened, so it is dropped.
        // Richer fields (smart-folder-page): excerpt from the short summary (else
        // the full content), image from explicit media (else the first inline
        // <img>), and the publication time — all OPTIONAL, omitted when absent.
        const excerpt = htmlToExcerpt(entry.summaryRaw) ?? htmlToExcerpt(entry.contentRaw);
        const imageUrl = entry.image ?? firstImageFromHtml(entry.contentRaw ?? entry.summaryRaw);
        const publishedAt = parseFeedDate(entry.dateText);
        // Decode entities in the title too — feeds often CDATA-wrap or double-encode
        // it (e.g. `&#8217;`), which saxes leaves literal.
        const title = entry.title !== undefined ? decodeHtmlEntities(entry.title) : entry.url;
        items.push({
          id: entry.id ?? entry.url,
          title,
          url: entry.url,
          ...(excerpt !== undefined ? { excerpt } : {}),
          ...(imageUrl !== undefined ? { imageUrl } : {}),
          ...(publishedAt !== undefined ? { publishedAt } : {}),
          ...(entry.category !== undefined ? { genre: decodeHtmlEntities(entry.category) } : {}),
        });
      }
      entry = null;
      dateStrong = false;
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
 * Decode a raw feed buffer using the correct charset.
 *
 * Priority (highest wins):
 *   1. `charset` in the HTTP Content-Type header
 *   2. `encoding` in the XML declaration inside the body
 *   3. UTF-8 (safe default for all modern XML/Atom/RSS)
 *
 * Many legacy feeds (e.g. Portuguese or Spanish news sites) serve ISO-8859-1
 * content with an `encoding="ISO-8859-1"` XML declaration but NO `charset` in
 * the HTTP headers, causing `response.text()` to misread them as UTF-8.
 */
function decodeXmlBuffer(buf: ArrayBuffer, contentType: string): string {
  // 1. HTTP Content-Type charset wins when explicitly declared.
  const ctCharset = /charset=([^\s;]+)/i.exec(contentType)?.[1];
  if (ctCharset) return new TextDecoder(ctCharset).decode(buf);

  // 2. Peek at the first 200 bytes as Latin-1 (superset of ASCII, always safe
  //    for the declaration preamble) to find an XML encoding declaration.
  const preamble = new TextDecoder('latin1').decode(
    new Uint8Array(buf, 0, Math.min(200, buf.byteLength)),
  );
  const xmlCharset = /<?xml[^>]*\bencoding=["']([^"']+)["']/i.exec(preamble)?.[1];
  if (xmlCharset) return new TextDecoder(xmlCharset).decode(buf);

  // 3. UTF-8 default.
  return new TextDecoder('utf-8').decode(buf);
}

/**
 * Fetch one RSS folder section's feed and normalize it. Never throws — every
 * failure shape resolves to a runtime state. No credentials (a public feed), so
 * `signed-out` is unreachable and never returned (design D11). The `caches`
 * parameter is unused (no per-cycle resolution to share). The `maxItems`
 * parameter is intentionally NOT the connector's slice for a feed (the
 * draining-queue model) — the buffer bounds memory + read-state.
 */
async function fetchRuntime(
  cfg: ResolvedLensSource,
  _maxItems: number,
  _caches?: ConnectorCaches,
): Promise<LensSectionRuntime> {
  const fetchedAt = Date.now();
  const fail = (): LensSectionRuntime => ({ state: 'error', items: [], fetchedAt });

  try {
    // A malformed persisted baseUrl (defensive — the SW validates on
    // create/update) degrades to the quiet error state, never a throw.
    new URL(cfg.baseUrl);
  } catch {
    return fail();
  }

  let response: Response;
  try {
    // Bounded: a timeout rejects (AbortError) into the catch below → error.
    response = await boundedFetch(cfg.baseUrl, { credentials: 'omit' });
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
    const buf = await response.arrayBuffer();
    if (buf.byteLength > MAX_FEED_BYTES) return fail();
    xml = decodeXmlBuffer(buf, response.headers.get('content-type') ?? '');
  } catch {
    return fail();
  }
  if (xml.length > MAX_FEED_BYTES) return fail();

  const { items, channelLink } = parseFeed(xml);
  // An empty parse (a non-feed body, or nothing well-formed) is an error, so the
  // last-known items hold rather than blanking the folder (design D11).
  if (items.length === 0) return fail();

  if (channelLink !== undefined) channelLinkByFeed.set(cfg.baseUrl, channelLink);

  return { state: 'ok', items: items.slice(0, FEED_BUFFER), fetchedAt };
}

/** The feed's listing URL: the channel website link captured during the last
 * successful parse, falling back to the feed URL (design D6). No network I/O. */
function listingUrl(cfg: ResolvedLensSource): string {
  return channelLinkByFeed.get(cfg.baseUrl) ?? cfg.baseUrl;
}

/** The origin this connector fetches (least-privilege-permissions design D8/D9):
 * RSS fetches the feed URL directly, so the gate keys on the feed's own origin
 * (an ungranted feed shows `needs-access`, not `error`). Delegates to the shared
 * {@link requiredOriginsForConfig} so the SW gate and the surfaces share one
 * derivation. */
function requiredOrigins(cfg: ResolvedLensSource): string[] {
  return requiredOriginsForConfig(cfg);
}

/** The RSS `SourceConnector` — the registry's `rss` entry. `defaultBaseUrl` is
 * empty (a feed has no canonical host); the SW mints the `'rss'` icon. */
export const rssConnector: SourceConnector = {
  source: 'rss',
  // Public (connector-accounts): a feed URL needs no identity — `[]` derives to
  // the `public` method, never requesting a token. Sourced from the shared map.
  authMethods: PROVIDER_AUTH_METHODS.rss,
  defaultBaseUrl: '',
  mintedIcon: 'rss',
  requiredOrigins,
  fetchRuntime,
  listingUrl,
};

/** Test-only: clear the per-feed channel-link memo between cases. */
export function resetRssListingCache(): void {
  channelLinkByFeed.clear();
}
