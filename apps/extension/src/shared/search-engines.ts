/**
 * Built-in search engines as code constants (launcher-web-search +
 * launcher-tab-to-search).
 *
 * A `SearchEngine` is `{ id, name, urlTemplate, keyword }` where `urlTemplate`
 * carries a single `%s` placeholder the query is substituted into and `keyword`
 * is the short token that switches into the engine on **Tab**
 * (launcher-tab-to-search). This module is the shared, settings-agnostic
 * registry: it is imported by both `settings.ts` (for the `defaultSearchEngine`
 * enum options) and the launcher's `web-actions` module (for URL building +
 * keyword resolution), so `settings.ts` carries no launcher dependency.
 */

export interface SearchEngine {
  /** Stable id — the `defaultSearchEngine` setting stores this. */
  id: string;
  /** Human label shown in options and echoed in the `websearch` row title. */
  name: string;
  /** URL template with a single `%s` where the encoded query is substituted. */
  urlTemplate: string;
  /** Tab-to-search token (launcher-tab-to-search). Typing this as the leading
   * whitespace-delimited token and pressing Tab switches into the engine. */
  keyword: string;
}

/**
 * The built-in roster. `google` leads (it is the out-of-box default). Each
 * template contains exactly one `%s`; each carries a fixed `keyword`. Declared
 * `as const` so the ids form a literal union (`BuiltInEngineId`) the settings
 * enum derives from.
 */
export const BUILT_IN_ENGINES = [
  { id: 'google', name: 'Google', urlTemplate: 'https://www.google.com/search?q=%s', keyword: 'g' },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    urlTemplate: 'https://duckduckgo.com/?q=%s',
    keyword: 'ddg',
  },
  { id: 'bing', name: 'Bing', urlTemplate: 'https://www.bing.com/search?q=%s', keyword: 'bing' },
  {
    id: 'brave',
    name: 'Brave',
    urlTemplate: 'https://search.brave.com/search?q=%s',
    keyword: 'brave',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    urlTemplate: 'https://www.perplexity.ai/search?q=%s',
    keyword: 'p',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    urlTemplate: 'https://www.youtube.com/results?search_query=%s',
    keyword: 'yt',
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    urlTemplate: 'https://en.wikipedia.org/w/index.php?search=%s',
    keyword: 'w',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    urlTemplate: 'https://chatgpt.com/?q=%s',
    keyword: 'gpt',
  },
  {
    id: 'claude',
    name: 'Claude',
    urlTemplate: 'https://claude.ai/new?q=%s',
    keyword: 'claude',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    urlTemplate: 'https://gemini.google.com/app?q=%s',
    keyword: 'gem',
  },
] as const satisfies readonly SearchEngine[];

/** Literal union of the built-in engine ids (`'google' | 'duckduckgo' | …`). */
export type BuiltInEngineId = (typeof BUILT_IN_ENGINES)[number]['id'];

/** The out-of-box default engine (`google`) — the fallback when a configured
 * engine cannot be resolved (e.g. a custom template missing `%s`). */
export const DEFAULT_SEARCH_ENGINE: SearchEngine = BUILT_IN_ENGINES[0];

/**
 * Assemble the active Tab-to-search engine registry (launcher-tab-to-search):
 * the built-ins, plus the single custom engine ONLY when it is valid — its
 * `customSearchUrl` contains `%s`, its (trimmed) `customSearchKeyword` is
 * non-empty, and that keyword does not collide with a built-in keyword. On a
 * collision the built-in wins and the custom keyword is dropped (the custom
 * engine remains usable as the default per `resolveDefaultEngine`; only its
 * keyword is shadowed). The custom engine joins by keyword regardless of whether
 * it is the configured default — its keyword is available either way.
 *
 * Typed structurally (not against `Settings`) so this module stays
 * settings-agnostic; the caller passes the two relevant fields.
 */
export function buildEngineRegistry(settings: {
  customSearchUrl: string;
  customSearchKeyword: string;
}): SearchEngine[] {
  const registry: SearchEngine[] = [...BUILT_IN_ENGINES];
  const keyword = settings.customSearchKeyword.trim();
  // Case-insensitive collision check — `resolveEngine` matches keywords
  // case-insensitively, so `G` must be treated as colliding with the built-in
  // `g` (otherwise it would join the registry and shadow-cycle with Google).
  const collides = BUILT_IN_ENGINES.some(
    (engine) => engine.keyword.toLowerCase() === keyword.toLowerCase(),
  );
  if (settings.customSearchUrl.includes('%s') && keyword !== '' && !collides) {
    registry.push({ id: 'custom', name: 'Custom', urlTemplate: settings.customSearchUrl, keyword });
  }
  return registry;
}
