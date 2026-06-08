import type { LauncherResult } from '../../shared/launcher-contract';
import { log } from '../../shared/logger';
import { scoreResult } from './scoring';

/**
 * Candidate results from the four providers, kept apart so the engine can apply
 * the de-dup precedence `tab > saved > bookmark > history` (design D2).
 */
export interface SearchSources {
  tabs: LauncherResult[];
  saved: LauncherResult[];
  bookmarks: LauncherResult[];
  history: LauncherResult[];
}

/** The single fixed result cap (design D3). Surfaces may display fewer. */
export const MAX_RESULTS = 12;

/**
 * Merge, de-dupe, score, sort, and cap candidate results (design D2/D3).
 *
 * - An empty/whitespace query returns `[]` (the surfaces show their idle state).
 * - Results sharing a URL are de-duped with precedence
 *   `tab > saved > bookmark > history` (the higher-precedence one is kept).
 * - Each survivor is scored; candidates the query does not match (score 0) are
 *   dropped.
 * - Sorted by score descending with a stable tie order (insertion order, which
 *   is source-precedence order, breaks ties).
 * - Capped to {@link MAX_RESULTS}; truncation emits a `log` line (never silent).
 *
 * `now` is forwarded to scoring for the deterministic history-recency term.
 */
export function runSearch(
  query: string,
  sources: SearchSources,
  now: number = Date.now(),
): LauncherResult[] {
  if (query.trim() === '') return [];

  // De-dup by URL. Insertion order is the precedence order, so the first writer
  // for a URL wins and lower-precedence duplicates are suppressed.
  const byUrl = new Map<string, LauncherResult>();
  for (const candidate of [
    ...sources.tabs,
    ...sources.saved,
    ...sources.bookmarks,
    ...sources.history,
  ]) {
    if (!byUrl.has(candidate.url)) byUrl.set(candidate.url, candidate);
  }

  const scored: LauncherResult[] = [];
  for (const candidate of byUrl.values()) {
    const score = scoreResult(query, candidate, now);
    if (score > 0) scored.push({ ...candidate, score });
  }

  // Stable sort (ES2019+): equal scores keep insertion order = source precedence.
  scored.sort((a, b) => b.score - a.score);

  if (scored.length > MAX_RESULTS) {
    log.debug('LAUNCHER_RESULTS_TRUNCATED', { total: scored.length, cap: MAX_RESULTS });
    return scored.slice(0, MAX_RESULTS);
  }
  return scored;
}
