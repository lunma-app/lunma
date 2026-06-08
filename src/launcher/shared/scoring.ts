import type { LauncherResult, ResultSource } from '../../shared/launcher-contract';

/**
 * Deterministic, hand-rolled scoring (design D3). A result's score is
 *
 *   max(quality(title) · TITLE_WEIGHT, quality(url) · URL_WEIGHT) · SOURCE_WEIGHT
 *     + (history only) a mild recency boost
 *
 * where match quality is `prefix (1.0) > word-boundary substring (0.7) > plain
 * substring (0.4) > no match (0)`. A candidate the query does not appear in at
 * all scores 0 (the engine drops it). No fuzzy-match dependency — keeps the
 * stack pinned and the overlay bundle small.
 */

const TITLE_WEIGHT = 1.0;
const URL_WEIGHT = 0.6;

/** Source weight: you most often want a thing you already have open. The
 * synthesized action sources (`websearch`/`navigate`) are NEVER scored — they
 * bypass `runSearch` entirely (launcher-web-search) — so their `0` entries are
 * inert and exist only to keep this `Record<ResultSource, number>` exhaustive
 * after the union widened. Data-source weights are unchanged. */
const SOURCE_WEIGHT: Record<ResultSource, number> = {
  tab: 1.0,
  saved: 0.85,
  bookmark: 0.7,
  history: 0.55,
  websearch: 0,
  navigate: 0,
};

/** Recency is a *mild* tiebreaker — capped below the smallest source gap
 * (`(0.7 − 0.55) · 0.4 = 0.06` at the weakest match) so it can reorder history
 * results among themselves but never flip the source ordering. */
const RECENCY_MAX = 0.04;
const RECENCY_WINDOW_MS = 1000 * 60 * 60 * 24 * 30; // 30 days → fully decayed

const PREFIX = 1.0;
const WORD_BOUNDARY = 0.7;
const SUBSTRING = 0.4;

/** Match quality of `q` (already lowercased) within `text`. */
function quality(text: string, q: string): number {
  const t = text.toLowerCase();
  const i = t.indexOf(q);
  if (i === -1) return 0;
  if (i === 0) return PREFIX;
  const prev = t.charAt(i - 1);
  return /[^a-z0-9]/.test(prev) ? WORD_BOUNDARY : SUBSTRING;
}

/** Recent → up to +RECENCY_MAX; ≥30 days old → +0. */
function recencyBoost(lastVisitTime: number, now: number): number {
  const age = Math.max(0, now - lastVisitTime);
  const decayed = Math.min(age / RECENCY_WINDOW_MS, 1);
  return RECENCY_MAX * (1 - decayed);
}

/**
 * Score a candidate against a query. `now` is an injectable seam (epoch ms,
 * defaults to `Date.now()`) so the history-recency term is deterministic in
 * tests. Returns 0 when the query matches neither the title nor the URL.
 */
export function scoreResult(
  query: string,
  candidate: LauncherResult,
  now: number = Date.now(),
): number {
  const q = query.trim().toLowerCase();
  if (q === '') return 0;
  const matchScore = Math.max(
    quality(candidate.title, q) * TITLE_WEIGHT,
    quality(candidate.url, q) * URL_WEIGHT,
  );
  if (matchScore === 0) return 0;
  let score = matchScore * SOURCE_WEIGHT[candidate.source];
  if (candidate.source === 'history' && candidate.lastVisitTime !== undefined) {
    score += recencyBoost(candidate.lastVisitTime, now);
  }
  return score;
}
