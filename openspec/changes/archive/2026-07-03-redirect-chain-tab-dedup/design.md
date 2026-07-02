## Context

`tab-dedup`'s navigation-dedup requirement only re-checks a tab that is
still fully **untracked** (`!isTrackedTab(state, tabId)`) — i.e. a blank
new tab that hasn't yet been adopted into `tempTabIds`. A tab created
directly with a target URL is tracked immediately at `tabs.onCreated`
(before any navigation-dedup check ever runs), and stays tracked for the
rest of its life. If that URL is itself an intermediate hop — a corporate
mail/security link-rewriter, an SSO consent screen, any redirector — the
tab's later navigation to its real destination never gets a second look,
even when that destination is already open elsewhere in the same Space.

## Goals / Non-Goals

**Goals:**
- Catch a dedup opportunity anywhere within a tab's initial load chain —
  not just its very first (pre-adoption) moment — without touching normal
  browsing of an already-settled tab.
- Keep the fix generic: it must help ANY link-rewriting/interstitial
  layer (Mimecast, Microsoft Defender SmartScreen, Proofpoint, a URL
  shortener, an SSO hop), not hardcode knowledge of one vendor.

**Non-Goals:**
- Not detecting or special-casing any specific rewriter's domain pattern.
- Not changing dedup's exact-match, current-window/active-Space scope —
  purely about WHEN the check re-runs, not WHAT it matches against.
- Not persisting the new tracking — it's bounded by a single SW session
  and a tab's own lifecycle.

## Decisions

**1. Track "still within initial load" via a session-scoped Set, cleared
on first `complete` or on removal — not a TTL.** Alternative considered:
a timestamp + short TTL (mirroring `pending-duplicate-tabs.ts`). Rejected:
"has this tab ever finished loading" is a real lifecycle boundary Chrome
already reports (`status: 'complete'`), so tying cleanup to that event is
both more precise (no arbitrary timeout that could expire mid-redirect on
a slow network, or linger past a fast page that already settled) and
simpler (no `Date.now()`/sweep bookkeeping).

**2. Broaden the SAME `tabs.onUpdated` block (adoption + dedup) rather
than add a parallel path.** The existing adoption calls
(`ctx.store.onTabCreated`, `ctx.groups.groupNewTab`) are already idempotent
no-ops for an already-tracked tab, so re-entering the combined block for
the "tracked but mid-initial-load" case is safe — only the dedup lookup
does new work. A BOUND (pinned) tab is explicitly excluded regardless of
load state — pinning is a deliberate, managed state, never "adopt as
temporary."

**3. `findTabInActiveSpace` needs an `excludeTabId`.** This is the sharpest
decision in the change: once the navigating tab can itself already be
tracked (new to this change), it becomes a candidate in its own search.
`tabs.onUpdated` mirrors the navigated URL into `liveTabsById` via
`syncLiveTab` BEFORE the dedup lookup runs (needed by everything else in
the handler), so without exclusion the navigating tab always self-matches
its own brand-new URL first — verified by a failing test during
implementation before this parameter was added. Alternative considered:
reorder `syncLiveTab` to run after the dedup check instead. Rejected as
riskier — several other things in the same handler (title/favicon
mirroring, saved-tab activity tracking) are unaudited assumptions built on
`syncLiveTab` having already run by that point; adding an explicit
exclusion parameter is a smaller, more legible diff with an obvious
purpose at the call site.

**4. Diagnostic logging on the "no match" paths ships in this change too,**
even though it's not strictly required by the redirect-chain fix itself —
it was the direct, immediate ask ("can we pinpoint this without guessing")
that led to this fix, and previously there was NO log at all when dedup
found no match, making the whole class of "why didn't this dedupe" reports
impossible to diagnose from the SW console.

## Risks / Trade-offs

- [Risk] A tab that takes an unusually long time to reach `complete` (a
  slow page, a page that never fires `complete` due to a broken script)
  stays dedup-eligible for that whole time — a later, unrelated navigation
  during that window could be caught by dedup when a user might expect
  ordinary browsing. → Mitigation: this only ever CLOSES the navigating tab
  in favor of an already-open, EXACT URL match in the same window's active
  Space — never a behavior change for a URL that isn't already open
  elsewhere. The window is bounded by the page's own load lifecycle, not
  by this change.
- [Risk] `excludeTabId` changes `findTabInActiveSpace`'s signature. →
  Mitigation: optional, defaults to `undefined` (no exclusion) — the two
  existing call sites (`openUrl`, onCreated-time dedup) are unaffected;
  only the navigation-dedup call site passes it.

## Migration Plan

None — new in-memory tracking only, no persisted-state shape changes.
