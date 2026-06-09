import type { LauncherResult } from '../../shared/launcher-contract';
import {
  BUILT_IN_ENGINES,
  DEFAULT_SEARCH_ENGINE,
  type SearchEngine,
} from '../../shared/search-engines';
import type { Settings } from '../../shared/settings';

/**
 * Pure web-action synthesis for the launcher (launcher-web-search).
 *
 * The launcher turns a non-empty query into up to two **action** results — a
 * `websearch` row (always) and a `navigate` row (only for a URL-shaped or
 * ambiguous input) — that ride the existing `openUrl` path into the active
 * Space. This module is a pure function of its inputs (query + resolved engine +
 * settings); it is invoked only by the service-worker suggestions handler (which
 * is where settings are read), never by a surface. `runSearch` is left untouched
 * — the handler composes the final list as `[ websearch, navigate?,
 * …providerResults ]` (search row leads + preselected, go-to next, providers
 * below).
 */

/** How `classifyInput` reads a raw query (design D4). */
export type InputClass = 'url' | 'search' | 'ambiguous';

// A leading URL scheme, e.g. `https:` / `javascript:` / `file:`.
const SCHEME_RE = /^([a-z][a-z0-9+.-]*):/i;
// A dotted-quad IPv4 host (loose — any 1-3 digit groups; the launcher offers a
// navigate, the user still picks).
const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * Classify a raw query as a navigable URL, a plain search, or ambiguous (offer
 * BOTH a navigate and a search row, never guess a single intent — design D4):
 *
 * - an `http(s)` scheme present → `url`;
 * - any other scheme (`javascript:`, `file:`, `chrome:`, …) → `search` (never
 *   synthesize navigation to a non-web/unsafe scheme);
 * - no scheme, no whitespace, host-shaped (a dotted token whose last label is
 *   ≥ 2 letters, or `localhost`, or an IPv4) → `ambiguous`;
 * - otherwise (whitespace present, or no dot) → `search`.
 */
export function classifyInput(raw: string): InputClass {
  const trimmed = raw.trim();
  if (trimmed === '') return 'search';

  const scheme = SCHEME_RE.exec(trimmed);
  if (scheme) {
    const proto = (scheme[1] ?? '').toLowerCase();
    return proto === 'http' || proto === 'https' ? 'url' : 'search';
  }

  if (/\s/.test(trimmed)) return 'search';

  // Host portion only (drop any path/query/fragment) for the TLD-ish test.
  const host = trimmed.split(/[/?#]/, 1)[0] ?? trimmed;
  if (host === 'localhost') return 'ambiguous';
  if (IPV4_RE.test(host)) return 'ambiguous';
  const labels = host.split('.');
  const lastLabel = labels[labels.length - 1] ?? '';
  if (labels.length >= 2 && /^[a-z]{2,}$/i.test(lastLabel)) {
    return 'ambiguous';
  }
  return 'search';
}

/**
 * Build a search URL from an engine template, substituting the
 * `encodeURIComponent`-escaped query for `%s`. Spaces become `%20` (universal
 * across the built-ins; `+` is engine-specific). A function replacement avoids
 * `$`-special handling in `String.replace`.
 */
export function buildSearchUrl(engine: SearchEngine, query: string): string {
  return engine.urlTemplate.replace('%s', () => encodeURIComponent(query));
}

/** Result of recognizing a Tab-to-search prefix (launcher-tab-to-search,
 * design D2). `candidates` are the registry engines whose keyword OR name starts
 * with the leading token (case-insensitive), in registry order — empty when
 * nothing matches. When non-empty, `query` is what the input becomes once Tab
 * consumes the token (the remainder); when empty, `query` is the raw input. */
export interface ResolvedEngine {
  /** Registry engines whose keyword OR name starts with the leading token
   * (case-insensitive prefix), in registry order. The surface shows a Tab hint
   * when non-empty; Tab activates `candidates[0]` and repeated Tab cycles the rest. */
  candidates: SearchEngine[];
  /** The query portion: the remainder after the token when there are
   * candidates, else the raw input. */
  query: string;
  /** The typed prefix token, when it matched ≥1 candidate. */
  keywordToken?: string;
}

/**
 * Recognize — WITHOUT consuming — a leading Tab-to-search PREFIX
 * (launcher-tab-to-search, design D2). The leading whitespace-delimited token is
 * matched **case-insensitively** as a prefix of either the engine's **keyword**
 * (the short alias, e.g. `yt`, `ddg`) **or its name** (so `g`/`go`/`google` reach
 * Google and `p`/`per`/`perplexity` reach Perplexity — the keyword need not be a
 * name prefix). Every matching engine is a candidate, in registry order (an exact
 * keyword is just one such case). Returns the candidates plus the remaining query
 * (what the input becomes once Tab consumes the token); a no-match returns
 * `{ candidates: [], query: raw }`. Never auto-activates — the surface shows a
 * hint and waits for Tab. Pure: the caller passes the registry
 * (`buildEngineRegistry` on the new-tab page; the SW-pushed registry on the
 * overlay).
 */
export function resolveEngine(raw: string, registry: SearchEngine[]): ResolvedEngine {
  const match = /^\s*(\S+)\s*([\s\S]*)$/.exec(raw);
  if (!match) return { candidates: [], query: raw };
  const token = match[1] ?? '';
  const needle = token.toLowerCase();
  const candidates = registry.filter(
    (candidate) =>
      candidate.keyword.toLowerCase().startsWith(needle) ||
      candidate.name.toLowerCase().startsWith(needle),
  );
  if (candidates.length === 0) return { candidates: [], query: raw };
  return { candidates, query: match[2] ?? '', keywordToken: token };
}

/**
 * Resolve the configured default engine from settings (design D8): the selected
 * built-in, or — when `custom` is selected — a custom engine ONLY if
 * `customSearchUrl` contains `%s`; otherwise fall back to the `google` built-in
 * (so a malformed custom template never breaks the launcher).
 */
export function resolveDefaultEngine(
  settings: Pick<Settings, 'defaultSearchEngine' | 'customSearchUrl'>,
): SearchEngine {
  const { defaultSearchEngine, customSearchUrl } = settings;
  if (defaultSearchEngine === 'custom') {
    // Default resolution is keyword-agnostic (Tab-to-search keywords come from
    // `buildEngineRegistry`), so the default custom engine carries no keyword.
    return customSearchUrl.includes('%s')
      ? { id: 'custom', name: 'Custom', urlTemplate: customSearchUrl, keyword: '' }
      : DEFAULT_SEARCH_ENGINE;
  }
  return (
    BUILT_IN_ENGINES.find((engine) => engine.id === defaultSearchEngine) ?? DEFAULT_SEARCH_ENGINE
  );
}

/**
 * Synthesize the action rows for a non-empty query against a resolved engine:
 *
 * - `websearch` is ALWAYS returned (ordered FIRST by the handler — the
 *   preselected default, so Enter searches): title names the engine + echoes the
 *   query; `url` is the engine template with the encoded query.
 * - `navigate` is returned ONLY for a `url`/`ambiguous` input (ordered SECOND,
 *   right under the search row): `url` is the target (`https://`-prefixed when
 *   the input carries no scheme); the title is `Go to ⟨target⟩` with the scheme
 *   stripped for the scan line (the full resolved URL shows on the dimmed line).
 *
 * Both carry `score: 0` — they are additive, never scored against the provider
 * results.
 */
export function buildWebActionResults(
  query: string,
  engine: SearchEngine,
): { navigate?: LauncherResult; websearch: LauncherResult } {
  const trimmed = query.trim();
  const cls = classifyInput(trimmed);

  const websearch: LauncherResult = {
    id: 'websearch',
    source: 'websearch',
    title: `Search ${engine.name} for "${trimmed}"`,
    url: buildSearchUrl(engine, trimmed),
    score: 0,
  };

  if (cls === 'url' || cls === 'ambiguous') {
    const target = cls === 'url' ? trimmed : `https://${trimmed}`;
    const navigate: LauncherResult = {
      id: 'navigate',
      source: 'navigate',
      title: `Go to ${target.replace(/^https?:\/\//i, '')}`,
      url: target,
      score: 0,
    };
    return { navigate, websearch };
  }
  return { websearch };
}
