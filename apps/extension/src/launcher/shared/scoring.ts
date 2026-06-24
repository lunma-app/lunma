import uFuzzy from '@leeoniya/ufuzzy';
import type { LauncherResult, ResultSource } from '../../shared/launcher-contract';
import type { SpaceId } from '../../shared/types';

/**
 * Deterministic, uFuzzy-backed scoring (launcher-fuzzy-smart-folders, design
 * D1–D4). A candidate's score is
 *
 *   match · SOURCE_WEIGHT  + (history only) a mild recency boost
 *   match = max( strength(title) · TITLE_WEIGHT,
 *                strength(url)   · URL_WEIGHT,
 *                strength(folderName) · FOLDER_WEIGHT )
 *
 * where `strength ∈ [0,1]` is reconstructed from uFuzzy's per-match info (design
 * D3): a base tier by where the match starts — prefix (1.0) > word-boundary
 * (0.80) > mid-token (0.55) — minus a gap penalty over the chars skipped within
 * and between matched terms. A candidate the query matches in no field scores 0
 * (the engine drops it), exactly as before.
 *
 * **Two uFuzzy instances, not one.** No single uFuzzy config satisfies both
 * normative spec scenarios: a transposition (`recieve → receive`) needs
 * `SingleError` mode, which clamps `intraIns ≤ 1`, while a scattered subsequence
 * (`prsfix → "PRs: fix parser"`) needs to thread a multi-char gap (`intraIns ≥ 2`)
 * across a non-split haystack. So each field is matched by BOTH a SUBSEQUENCE
 * pass (catches scattered/contiguous matches and the prefix/boundary tiers) and a
 * TYPO pass (catches single-char typos), and we keep the higher strength. Both
 * instances are constructed once at module load; uFuzzy is fully deterministic
 * (no RNG), so the engine stays a pure function of `(query, candidates, now)`.
 *
 * Runs **only in the service worker** — `scoring.ts` is imported by `background/`
 * and `launcher/shared/`, never by the `Alt+L` overlay content script, so uFuzzy
 * never enters the overlay's `<15KB` bundle (see `overlay.budget.test.ts`).
 */

// uFuzzy.IntraMode.SingleError. Referenced numerically (the ambient const enum
// erases at runtime); the type cast keeps it assignable without an enum value read.
const SINGLE_ERROR = 1 as uFuzzy.IntraMode;

/**
 * SUBSEQUENCE pass — no typo tolerance, but threads the query as a subsequence
 * across any in-between characters. `interSplit` is a never-matching pattern so
 * the haystack is treated as ONE term (a query can span separators like `": "`);
 * `intraChars: '.'` allows any skipped char; `intraIns` bounds how far apart
 * consecutive query chars may land (the strength gap-penalty then decays scattered
 * matches, so this is a generous ceiling, not a quality bar).
 */
const SUBSEQ = new uFuzzy({ interSplit: '$^', intraChars: '.', intraIns: 16 });

/**
 * TYPO pass — single per-term error tolerance (one substitution, transposition,
 * insertion, or deletion), with typos disallowed at a term's leading character
 * (uFuzzy's default `intraSlice: [1, ∞]`). Default term splitting, so multi-word
 * queries match term-by-term. Catches `recieve → receive`, `exmaple → example`.
 */
const TYPO = new uFuzzy({
  intraMode: SINGLE_ERROR,
  intraSub: 1,
  intraTrn: 1,
  intraDel: 1,
});

const TITLE_WEIGHT = 1.0;
const URL_WEIGHT = 0.6;
/** ≤ URL_WEIGHT (design D4) so a folder-name match never outranks a direct
 * title hit on the same candidate. */
const FOLDER_WEIGHT = 0.5;

/** Source weight: you most often want a thing you already have open. `smart` sits
 * between `saved` and `bookmark` (design D4) — present but not dominant. The
 * synthesized action sources (`websearch`/`navigate`) are NEVER scored (they
 * bypass `runSearch` entirely), so their `0` entries are inert and exist only to
 * keep this `Record<ResultSource, number>` exhaustive. */
const SOURCE_WEIGHT: Record<ResultSource, number> = {
  tab: 1.0,
  saved: 0.85,
  lens: 0.78,
  bookmark: 0.7,
  history: 0.55,
  websearch: 0,
  navigate: 0,
};

/** Recency is a *mild* tiebreaker — capped below the smallest source gap so it can
 * reorder history results among themselves but never flip the source ordering. */
const RECENCY_MAX = 0.04;
const RECENCY_WINDOW_MS = 1000 * 60 * 60 * 24 * 30; // 30 days → fully decayed

/** Current-Space contextual boost (design D9, `prefer-current-space` scope). Added
 * to a result whose owning `spaceId` equals the requesting window's active Space —
 * roughly one source-tier, so local work surfaces above its cross-Space peers
 * without hiding anything. Unlike recency, this term INTENTIONALLY can lift an
 * in-Space result over a higher-source cross-Space one (that is the feature). Only
 * `smart` and pinned `saved` results carry a `spaceId`, so global rows
 * (favorites/tab/bookmark/history) are never boosted. */
const SPACE_BOOST = 0.15;

// Strength tiers by where the match starts (design D3).
const PREFIX = 1.0;
const WORD_BOUNDARY = 0.8;
const MID_TOKEN = 0.55;
// Gap penalty over (intraIns + interIns): each skipped char costs GAP_STEP, capped.
const GAP_STEP = 0.06;
const GAP_CAP = 0.3;

/**
 * Reconstruct a `[0,1]` match strength from one uFuzzy match (design D3). `start`
 * is the match offset into `text` (lowercased for the boundary test); `gaps` is
 * `intraIns + interIns` (chars skipped within/between matched terms).
 */
function strength(text: string, start: number, gaps: number): number {
  let base: number;
  if (start === 0) {
    base = PREFIX;
  } else {
    const prev = text.charAt(start - 1);
    base = /[^a-z0-9]/.test(prev) ? WORD_BOUNDARY : MID_TOKEN;
  }
  return Math.max(0, base - Math.min(GAP_CAP, gaps * GAP_STEP));
}

/**
 * Run one uFuzzy instance over a field's text for every candidate, returning the
 * per-candidate match strength (0 where the field does not match). uFuzzy is a
 * batch matcher: `filter` returns the matching haystack indices, `info` returns
 * the parallel per-match metric arrays keyed by position in `info.idx`.
 */
function passStrengths(uf: uFuzzy, texts: string[], query: string): number[] {
  const out = new Array<number>(texts.length).fill(0);
  const idxs = uf.filter(texts, query);
  if (!idxs || idxs.length === 0) return out;
  const info = uf.info(idxs, texts, query);
  for (let k = 0; k < info.idx.length; k++) {
    const hi = info.idx[k] as number;
    const s = strength(
      texts[hi]?.toLowerCase() ?? '',
      info.start[k] as number,
      (info.intraIns[k] as number) + (info.interIns[k] as number),
    );
    if (s > (out[hi] as number)) out[hi] = s;
  }
  return out;
}

/** Best strength per candidate across BOTH passes for one field. */
function fieldStrengths(texts: string[], query: string): number[] {
  const subseq = passStrengths(SUBSEQ, texts, query);
  const typo = passStrengths(TYPO, texts, query);
  return subseq.map((v, i) => Math.max(v, typo[i] as number));
}

/** Recent → up to +RECENCY_MAX; ≥30 days old → +0. */
function recencyBoost(lastVisitTime: number, now: number): number {
  const age = Math.max(0, now - lastVisitTime);
  const decayed = Math.min(age / RECENCY_WINDOW_MS, 1);
  return RECENCY_MAX * (1 - decayed);
}

/**
 * Score a batch of candidates against a query, returning a score per candidate
 * (parallel to `candidates`). A candidate the query matches in no field scores 0
 * (the engine drops it). `now` is an injectable seam (epoch ms, defaults to
 * `Date.now()`) so the history-recency term is deterministic in tests.
 *
 * Batch (not per-candidate) because uFuzzy is a batch matcher — it filters a whole
 * haystack at once (design D7). Three fields × two passes = up to six uFuzzy passes
 * over the survivor set, each trivially cheap at the engine's result volumes.
 *
 * `activeSpaceId` (optional) is the requesting window's active Space — when set, a
 * result whose `spaceId` matches gets the {@link SPACE_BOOST} (the launcher's
 * `prefer-current-space` scope, design D9). Omitted/undefined → no boost (the
 * `global` and `current-space-only` scopes never boost).
 */
export function scoreCandidates(
  query: string,
  candidates: LauncherResult[],
  now: number = Date.now(),
  activeSpaceId?: SpaceId,
): number[] {
  const q = query.trim();
  if (q === '' || candidates.length === 0) return candidates.map(() => 0);

  const titleStrengths = fieldStrengths(
    candidates.map((c) => c.title),
    q,
  );
  const urlStrengths = fieldStrengths(
    candidates.map((c) => c.url),
    q,
  );
  const folderStrengths = fieldStrengths(
    candidates.map((c) => c.folderName ?? ''),
    q,
  );

  return candidates.map((c, i) => {
    const match = Math.max(
      (titleStrengths[i] as number) * TITLE_WEIGHT,
      (urlStrengths[i] as number) * URL_WEIGHT,
      (folderStrengths[i] as number) * FOLDER_WEIGHT,
    );
    if (match === 0) return 0;
    let score = match * SOURCE_WEIGHT[c.source];
    if (c.source === 'history' && c.lastVisitTime !== undefined) {
      score += recencyBoost(c.lastVisitTime, now);
    }
    if (activeSpaceId !== undefined && c.spaceId === activeSpaceId) {
      score += SPACE_BOOST;
    }
    return score;
  });
}
