## Context

The launcher's finder runs entirely in the service worker
(`launcher-suggestions-handler.ts` → `runSearch` → `scoreResult`); both surfaces
(the `Alt+L` overlay and the new-tab home) are thin clients that POST a query and
render the returned `LauncherResult[]`. Today the engine merges four providers
(open tabs, saved tabs, bookmarks, history), de-dupes by URL with precedence
`tab > saved > bookmark > history`, and scores each candidate with a hand-rolled
exact-substring model in `scoring.ts`:

```
score = max(quality(title)·TITLE_W, quality(url)·URL_W) · SOURCE_WEIGHT
        + (history only) recencyBoost
quality: prefix 1.0 > word-boundary 0.7 > substring 0.4 > no-match 0 (dropped)
```

`scoring.ts` deliberately carries no fuzzy dependency, with a comment citing
"keeps the stack pinned and the overlay bundle small." Two facts let us revisit
that here: (1) scoring runs **only** in the SW — `scoring.ts`/`search-engine.ts`
are imported by `background/` and `launcher/shared/`, **never** by `overlay.ts`
(which imports only `launcher-contract` for `sourceBadgeLabel`/types and
`web-actions`), so a fuzzy library never enters the `<15KB` content-script bundle
the verify-time budget guard polices; (2) "keeps the stack pinned" still binds —
adding uFuzzy is an explicit pinned-stack amendment, recorded here and in
`docs/tech-stack.md`.

Smart-folder items already live in `store.state.smartFolders` (the ephemeral,
broadcast-only runtime slice the SW owns), keyed by `FolderId`, each item
link-shaped: `{ id, title, url, status? }`. The handler already reads
`store.state`, so the data needs no new fetch, message, or permission.

## Goals / Non-Goals

**Goals:**

- Surface smart-folder items as launcher results across all four sources
  (GitLab/GitHub/Jira/RSS), acting via the existing `openUrl` branch.
- Make matching fuzzy and typo-tolerant for **every** source, not just smart
  items, while preserving the source-weight ordering and history-recency
  tiebreaker the current model guarantees.
- Let a result match the name of the folder it lives in (regular folder for a
  saved tab; smart folder for a smart item), without making folders into rows.
- Keep the engine a pure, deterministic function of `(query, sources, now)`.

**Non-Goals:**

- No new "activate a folder" launcher action — folders are not result rows.
- No persistence/schema change — the `smartFolders` slice stays ephemeral; cold
  start before the first connector poll simply yields no smart rows yet.
- No change to the four synthesized action rows (`websearch`/`navigate`), the
  cap, the truncation log, or the de-dup-by-URL mechanism itself.
- No matching on a smart item's `status.label` — only `title`/`url`/`folderName`.
- No fuzzy library in the overlay (it scores nothing; the budget guard stays
  green).

## Decisions

### D1 — uFuzzy is the matcher; we keep our scoring envelope (uFuzzy over Fuse.js / hand-roll)

uFuzzy is a batch matcher: `new uFuzzy(opts)` then `filter(haystack, needle)` →
matching idxs, and `info(idxs, haystack, needle)` → per-match detail arrays
(`start`, `intraIns`, `interIns`, `interLft2/1`, `ranges`, …). It does **not**
expose a per-candidate 0..1 score — it is ordering-oriented. Our model multiplies
a match strength by a per-source weight, so we need a *magnitude*, not just an
order. Decision: use uFuzzy purely for **matching + match-info**, and derive a
bounded match strength ourselves from its info, then keep the existing
`× SOURCE_WEIGHT (+ recency)` envelope.

Alternatives rejected:
- **Fuse.js** — heavier, returns its own 0..1 `score` (convenient) but bulkier
  and its scoring is harder to pin deterministically against our source weights.
- **Hand-rolled subsequence scorer** — viable (~60 lines) but the user chose a
  library for robustness + typo tolerance; reimplementing Damerau-Levenshtein
  term matching well is exactly what uFuzzy already does.
- **uFuzzy's `sort()` for final order** — rejected: it would let match relevance
  override source weight (a barely-matched tab vs a perfectly-matched smart item),
  collapsing the `tab > saved > smart > …` intent. We sort by our blended score
  instead.

### D2 — Per-field uFuzzy passes with a weighted max (not one concatenated haystack)

Each candidate has up to three matchable fields: `title`, `url`, `folderName`.
We run uFuzzy **once per field** over the survivor set (three arrays: all titles,
all urls, all folder names) and take a weighted max per candidate — mirroring
today's `max(quality(title)·W, quality(url)·W)`:

```
match(candidate) = max(
  strength(titleInfo)      · TITLE_WEIGHT,   // 1.0
  strength(urlInfo)        · URL_WEIGHT,     // 0.6
  strength(folderNameInfo) · FOLDER_WEIGHT,  // ≤ URL_WEIGHT (see D4)
)
```

Concatenating fields into one haystack string per candidate was rejected: it
muddies uFuzzy's position/contiguity bonuses (a match deep in a URL scores as a
late match) and erases per-field weighting (title must beat url). Three passes
over N ≤ ~150 survivors is trivially cheap.

### D3 — Match strength: reconstruct the prefix/boundary/substring tiers as a continuous score

`strength(info)` maps one field's uFuzzy match to `[0,1]`, preserving the old
intuition (prefix dominates) while allowing fuzzy gaps and typos:

```
base by match start:
  start === 0                 → 1.00   (prefix)
  term-boundary start         → 0.80   (preceded by a non-alphanumeric)
  mid-token start             → 0.55
gap penalty:
  gaps = intraIns + interIns          (chars skipped within / between terms)
  strength = max(0, base − min(GAP_CAP, gaps · GAP_STEP))
no match → 0 (candidate dropped, exactly as today)
```

This keeps `prefix > word-boundary > scattered` ordering, makes a contiguous
substring score near its base tier, and decays as the match scatters. The exact
constants (`GAP_CAP`, `GAP_STEP`, the three base levels) are tuned in `tasks.md`
against ported + new tests; their defaults reproduce the current ordering on the
existing exact-match scenarios so today's behaviour is a subset of the new one.

**Two uFuzzy instances, not one (resolved during apply).** No single uFuzzy
config satisfies both normative spec scenarios at once: a transposition
(`recieve → receive`) needs `intraMode: SingleError`, which uFuzzy **clamps to
`intraIns ≤ 1`**, while a scattered subsequence (`prsfix → "PRs: fix parser"`)
must thread a multi-char gap (`intraIns ≥ 2`) across a non-split haystack — the
two are mutually exclusive in one instance. So each field is matched by **two**
module-level instances and we keep the higher strength:

- a **SUBSEQUENCE** pass — `{ interSplit: <never-match>, intraChars: '.', intraIns: 16 }`
  — treats the haystack as one term so the query threads across separators
  (`": "`, spaces) as a subsequence; carries the prefix/boundary/mid tiers and the
  scattered cases. No typo tolerance.
- a **TYPO** pass — `{ intraMode: SingleError, intraSub: 1, intraTrn: 1, intraDel: 1 }`
  (default term split; typos disallowed at a term's leading character via uFuzzy's
  default `intraSlice: [1, ∞]`) — catches a single per-term insert/sub/transpose/delete
  (`recieve → receive`) without 1–2-char queries exploding.

Both instances are constructed once at module load and uFuzzy is fully
deterministic (no RNG), so the engine stays a pure function; `now` remains the
only injected clock (for recency).

### D4 — Source weight + precedence slot for `smart`

De-dup precedence becomes `tab > saved > smart > bookmark > history` (merge order
in `runSearch`: `[...tabs, ...saved, ...smart, ...bookmarks, ...history]`), so a
PR open as a tab is reached by focusing the tab, a saved/favorited URL keeps its
activation semantics, and a live work item outranks a stale bookmark/history hit
for the same URL. The scoring `SOURCE_WEIGHT` adds `smart` between `saved` (0.85)
and `bookmark` (0.7) — proposed `0.78` — so smart rows place sensibly without
flooding (each folder is already `maxItems`-capped; the 12-result cap + log
holds). `FOLDER_WEIGHT ≤ URL_WEIGHT` guarantees a folder-name match never
outranks a direct title hit on the *same* candidate. All three constants are
tunable in tasks; the precedence order is normative (spec delta).

### D5 — Smart provider: flatten every folder's items, all sources, ignore runtime state

`smartFoldersProvider(smartFolders, folderNames?, folderSpaces?)` iterates
`Object.entries(store.state.smartFolders)` and, for each runtime, emits one
`LauncherResult` per `runtime.items` entry:

```
{ id: `smart:${item.id}`, source: 'smart', title: item.title, url: item.url,
  score: 0, folderName: folderNames?.[folderId], spaceId: folderSpaces?.[folderId] }
```

(`spaceId` — the smart folder's owning Space — feeds the current-Space scope, D9.)

It iterates `runtime.items` regardless of `runtime.state`: a `pending` refresh
keeps last-known items (so they stay matchable, never blinking out), while
`signed-out`/`error` carry `items: []` and contribute nothing — no state filter
needed. All four sources are included (RSS too, per the settled decision); volume
is bounded by each folder's `maxItems` and the global cap. No binding, no
`SavedTab`, no `tabId` — link-shaped, so `act()` routes it through the existing
`openUrl { url, windowId }` branch with zero new dispatch.

### D6 — Folder-name index built once in the handler from `pinnedBySpace`

A new pure helper (`launcher/shared/folder-names.ts`)
`buildFolderNameIndex(pinnedBySpace)` returns
`{ savedTabFolder: Record<SavedTabId,string>; smartFolder: Record<FolderId,string>; smartFolderSpace: Record<FolderId,SpaceId> }`
by scanning every Space's nodes: a `folder` node maps each child `SavedTabId` →
its `name`; a `smart` node maps its `FolderId` → its `name` AND its owning
`SpaceId` (the latter for the current-Space scope, D9). The handler builds it once
per request and passes `savedTabFolder` to `savedTabsProvider` (new trailing
param), and `smartFolder` + `smartFolderSpace` to `smartFoldersProvider`. A
favicon-row saved tab (in `faviconRow`, not a folder) simply has no entry → no
`folderName`. The helper lives in `launcher/shared` (imports `shared` types only —
DAG-clean) and is called from `background/` (allowed edge).

### D7 — `runSearch` restructured to batch scoring; `scoreResult` → `scoreCandidates`

uFuzzy is batch, so the per-candidate `scoreResult(query, candidate, now)` is
replaced by a batch `scoreCandidates(query, candidates, now)` in `scoring.ts`
(the two module-level uFuzzy instances of D3, constructed once; `scoreCandidates`
returns a score per candidate, parallel to the input). `runSearch` keeps its shape —
de-dup by URL → score → drop zeros → stable sort by score desc (insertion order
= source precedence breaks ties) → cap at `MAX_RESULTS` → log truncation — but
calls `scoreCandidates` over the de-duped survivors instead of mapping
`scoreResult`. `SearchSources` gains `smart: LauncherResult[]`. This renames a
function the current code/tests reference; the rename + test rewrite land in this
change (the spec delta documents the model change, not the symbol — the symbol is
internal to `launcher/shared`).

### D8 — Pinned-stack amendment recorded in docs

`docs/tech-stack.md` gains: an At-a-glance row (*Fuzzy search → uFuzzy
(`@leeoniya/ufuzzy`)*), a "Non-obvious choices" subsection (why uFuzzy, and the
key constraint — **SW-side only, never in the overlay bundle**, so the byte
budget and the no-Svelte/no-fuzzy overlay guard are untouched), and a pinned
version row. The `openspec/specs/launcher` spec is updated: the provider list (now
five), the scoring model (uFuzzy fuzzy/typo-tolerant, folder-name field), and the
de-dup precedence string. No other docs change (no layer-DAG or schema impact).

### D9 — Current-Space launcher scope (added during apply, user-directed)

The launcher is global by design (launcher-v1: open tabs, saved tabs, bookmarks,
history are all cross-Space). During apply the user asked for a configurable
Space scope. Since hard-scoping only the Lunma-owned sources while bookmarks/
history stay global would be asymmetric, the resolution is a **global
`launcherScope` setting** (settings registry, `Search` group; enum; default
`prefer-current-space`) with three modes:

- **`global`** — no Space preference (the launcher-v1 behaviour).
- **`prefer-current-space`** (default) — results owned by the requesting window's
  active Space get a bounded additive **boost** (`SPACE_BOOST`, ~one source-tier)
  in `scoreCandidates`, surfacing local work first while keeping everything
  reachable. Unlike recency, this term INTENTIONALLY may lift an in-Space result
  over a higher-source cross-Space one; it never resurrects a score-0 candidate.
- **`current-space-only`** — the handler filters out Space-placed Lunma results
  (smart items + pinned saved tabs) whose owning Space differs from the active
  one, BEFORE `runSearch`; global rows (favorites, tabs, bookmarks, history)
  remain. With no active Space it falls back to `global`.

Mechanics: only Space-placed Lunma results carry an owning `spaceId` —
`savedTabsProvider` sets it from `SavedTab.spaceId` (pinned only; favorites are
`null` → none), `smartFoldersProvider` from a new `smartFolderSpace` map in
`buildFolderNameIndex`. `LauncherResult` gains an OPTIONAL `spaceId`. The handler
resolves `activeSpaceByWindow[windowId]`, applies the filter for
`current-space-only`, and forwards the active Space to `runSearch` →
`scoreCandidates` only for `prefer-current-space`. Open tabs are deliberately NOT
Space-scoped here (a tab's Space membership lives in its group, not on the result;
resolving it is out of scope) — they remain global. This adds touch-points in the
`settings`/`options` capabilities (one enum declaration; auto-rendered as a
`SegmentedControl`) but **no new requirement** there — the declarative engine
already supports it. Cross-Space *activation* auto-switch (selecting a Space-B
result switching the window to Space B) was considered and deferred to a **separate
follow-up change** (it modifies the shared `openSavedTab`/`focusSavedTab` handlers
owned by other capabilities).

### D10 — Cross-Space marker on result rows (added during apply, user-directed)

With the scope live, a `prefer-current-space` (or `global`) list interleaves
cross-Space `smart`/pinned-`saved` rows with local ones and they were
indistinguishable. A small **cross-Space marker** — a colour dot in the foreign
Space's identity colour + the Space name — is shown on a row **only when its owning
Space differs from the requesting window's active Space**. In-active-Space and
global rows (favorites, tabs, bookmarks, history) carry no marker.

Mechanics: the SW handler resolves the marker (it has `store.state.spaces`) and
attaches `spaceName` + a ready-to-paint `spaceColor` `oklch(…)` string (via the
pure `colourToOklch(space.color)`) to each cross-Space result; **presence of
`spaceName` is the render signal**, so the **stateless overlay needs no Space list
and no palette** — it just paints the dot from `result.spaceColor`. `LauncherResult`
gains OPTIONAL `spaceName`/`spaceColor`. Both surfaces render a `.meta` cluster
(`[space-chip] [source-badge]`): `ResultRow.svelte` and the vanilla `overlay.css`
mirror. The dot's `background` is the only data-driven inline style; everything
else uses existing tokens. The marker is independent of scope **mode** (it reflects
where the item lives vs where you are); in `current-space-only` the cross-Space
rows are already filtered out, so none are marked.

Alternatives rejected: a neutral text-only chip (loses the at-a-glance Space
colour — Lunma is colour-forward) and marking *every* Space-placed row including
local ones (noisier; the local Space is implicit from context).

## Visual language

This change adds two new on-surface elements — the `smart` result row and the
**cross-Space marker** (D10) — and otherwise rides the existing launcher visual
contract, so the bar is "quiet addition," not "new look."

- **Composition.** Smart rows render through the same `ResultRow`/`ResultList`
  primitives (new-tab) and the vanilla `overlay.css` mirror (`Alt+L`). Layout,
  the two-line Comfort-density reflow, and the roving-selection `--accent-soft`
  wash are unchanged and shared — no re-rolled row. The cross-Space marker rides a
  small `.meta` cluster (`[space-chip] [source-badge]`) in the existing badge
  cell, mirrored across both surfaces.
- **Source identity comes for free.** The row's favicon is resolved from the
  item URL, so a GitHub PR shows github.com's mark, a Jira issue its instance
  favicon, an RSS item the site's — the source reads visually without a custom
  badge. The textual badge is the existing quiet, uppercased `.badge` chip
  reading `smart` (via the centralized `sourceBadgeLabel`), keyed
  `data-source="smart"`; it reuses the shared neutral badge treatment (no new
  *source* colour token) so it sits in lockstep with
  `tab`/`saved`/`bookmark`/`history`.
- **Space identity is the one new colour (cross-Space rows only).** The marker's
  dot uses the foreign Space's canonical OKLCH colour — the *same* nine-colour
  Space palette already used across the sidebar/aurora, not a new token — so it
  reads as "lives in ⟨Space⟩" at a glance. Colour is a **secondary** cue: the
  Space **name** (uppercased, `--text-dim`, the same register as the badge)
  carries the meaning, so a colour-blind user loses nothing and WCAG-AA holds (the
  dot is decorative, never the sole signal). In-active-Space and global rows show
  no marker, so the default list stays as clean as before.
- **Motion / feedback.** None added. Selection, hover, and the new-tab kindle
  entrance are untouched; smart rows and the marker appear and reorder within the
  existing list with no new transition. `prefers-reduced-motion` holds (no new
  animation); the only new colour is the data-driven Space dot, already
  AA-validated as a Space identity colour.
- **Hierarchy.** Smart rows interleave by score like every other source; the
  `smart` source weight (D4) plus the current-Space boost (D9) keep them
  present-but-not-dominant. There is no separate "smart" or per-Space section —
  the finder stays one ranked list (the marker labels, it does not group), which
  is the launcher's established model.

Arc reference: Arc's command bar surfaces "little arcs"/live items inline in one
ranked list rather than a segmented panel; Lunma matches that single-list model
and improves on it by reaching the user's *own* tracked forge/feed work, not just
open tabs and history.

## Risks / Trade-offs

- **Fuzzy broadens matches for all four existing sources, changing the finder's
  feel** → Mitigation: D3 keeps prefix/boundary as the top strength tiers so
  exact prefixes still dominate; uFuzzy requires all needle chars present (no
  partial-token matches); the `score > 0` drop and 12-cap hold; ported tests
  assert the current ordering invariants (tab-focus beats history, prefix beats
  scattered) still pass, so today's behaviour is a documented subset.
- **Typo tolerance over-matches very short queries** → Mitigation: the TYPO pass
  uses conservative uFuzzy intra opts (single error per term, no typo at the
  leading char), and the SUBSEQUENCE pass adds no typos (only subsequence gaps,
  which the strength gap-penalty decays); tuned with explicit short-query test
  cases.
- **uFuzzy info → strength formula is bespoke and could mis-rank** → Mitigation:
  the formula is small, pure, and unit-tested in isolation; constants are tuned
  against a fixture of representative queries before the spec scenarios are
  considered met.
- **Smart-item volume (many folders × `maxItems`) could crowd the finder** →
  Mitigation: per-folder `maxItems` cap already bounds it, the `smart` source
  weight sits below `saved`, and the global 12-cap + truncation log are unchanged.
- **Cold start: smart rows missing until the first poll** → Accepted (matches the
  sidebar folder's own behaviour); empty contributes nothing, no error.
- **Pinned-stack precedent: "we added one fuzzy lib, why not more deps?"** →
  Mitigation: the amendment is scoped and justified in `docs/tech-stack.md`
  (SW-side only, measured, overlay guard still green); the "What to avoid" list
  and the overlay budget guard remain the gate for anything page-bound.

## Open Questions

- Final values for `SMART_WEIGHT` (≈0.78), `FOLDER_WEIGHT` (≤0.6), and the D3
  strength constants — resolved by tuning in `tasks.md` against the test fixture,
  not blocking the spec.
- Exact module path for the folder-name helper (`folder-names.ts` vs folding the
  index build into the handler) — settled during apply; either keeps the helper
  in `launcher/shared` or `background/`, both DAG-legal.
