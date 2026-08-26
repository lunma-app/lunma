# 0005 — Tab provenance: durable lineage is feasible via page-carried identity

- **Status:** Accepted. Supersedes the "do not build" decision recorded here on
  2026-08-25, whose central premise was false.
- **Date:** 2026-08-26

## Context

Provenance gives each live tab a parent: the temporary list indents children
under the tab they were opened from, so a forty-tab Space answers *"why do I have
this tab?"* rather than only *"what is in here?"*

This ADR previously recorded a decision **not** to build it, on the grounds that
Chrome exposes no tab identity surviving a browser restart, so lineage would reset
every morning with no path to fixing it. **That premise was wrong** — not because
Chrome changed, but because the investigation only looked at browser-level APIs
(`chrome.sessions`, `tabs.Tab.sessionId`) and never considered that the *page*
could carry the identity.

Six spikes, run against the real built extension on macOS. The first four are
unchanged and still hold; 5 and 6 are what reopened the question.

**Spike 1 — external opens are separable, and this is what the permission buys. ✓**
A real warm-start OS handoff (a second Chrome process invoked against the same
profile) commits as `transitionType: start_page`, not `link`. It also arrives
**with a live `openerTabId`** — whatever tab was last focused — so `openerTabId`
alone would confidently indent an externally-opened tab under an unrelated
parent. Only `transitionType` prevents that, and only `webNavigation` supplies it.

**Spike 2 — `openerTabId` does not survive session restore. ✗**
Restored tabs return with fresh ids and `openerTabId: null`.

**Spike 3 — no *browser-level* durable identity exists. ✗**
`tabs.Tab.sessionId` is `null` on every live tab.
`sessions.getRecentlyClosed()` ids are a third id space matching neither the pre-
nor post-restore tabs — handles for `sessions.restore()`, not identity.

**Spike 4 — history cannot rebuild the edges that matter. ✗**
`getVisits()` returns `referringVisitId: 0` for **every** new-tab open
(`target="_blank"`, middle-click, `window.open`). Only same-tab navigation carries
a referrer chain, and that is not a provenance edge — one tab moving, not a parent
spawning a child. Reverse-mapping a `visitId` to a URL does work; the data is what
is absent. **History backfill is retracted, not deferred.**

**Spike 5 — `sessionStorage` IS a durable per-tab identity. ✓**
Two tabs on the same origin stamped `TOKEN-A` / `TOKEN-B`, profile closed,
relaunched with `--restore-last-session`: both tokens returned, distinct, and one
had navigated same-origin in between. It costs **no new permission** — Lunma
already injects at `http(s)://*/*` at `document_start`.

The general rule (`sessionStorage` dies with the session) still holds; session
*restore* is the documented exception. The measured negative case is what makes it
safe: relaunching **without** restore produced **no restored tabs at all**. Token
and tab live and die together. Contrast `openerTabId`, which dies *while the tab
survives*, leaving a tab that looks rootless but is not.

**Spike 6 — tokens are readable immediately on restore. ✓ (weakly)**
Eight restored tabs all came back `status: complete`, `discarded: false`, with
every token readable before any activation. **Weaker evidence than the others**:
eight localhost tabs on an unloaded machine, and Playwright attaches to every
target, which may itself force loading. It does not prove Chrome never defers with
eighty real tabs under memory pressure. If it does defer, degradation is graceful —
the content script runs at `document_start`, so the token arrives whenever the tab
loads, delaying lineage rather than corrupting it.

## Decision

**The technical blocker is removed.** Durable tab lineage is achievable by
stamping a random token into the page's `sessionStorage`, persisting
`childToken → parentToken`, and re-attaching on restore. No URL matching, no
ordering heuristics, no history backfill.

**Whether to build it remains an open product decision**, because the mechanism
carries a cost that is not technical:

1. **`webNavigation`** — one optional, gesture-bound permission whose Chrome
   grant prompt reads *"Read your browsing history."*
2. **A page-visible marker.** A content script's `sessionStorage` **is** the
   page's — the isolated world does not extend to storage. Any site could read
   `lunma.tabToken` and learn Lunma is installed. Today Lunma is deliberately hard
   to detect: `launcher/overlay.ts` uses `attachShadow({ mode: 'closed' })` and
   creates its host only when the overlay opens; `content/tab-boundary.ts` adds
   listeners a page cannot enumerate. This token would be **the first
   always-present, page-readable marker Lunma leaves.** It gives a site no new
   tracking ability — any page can already write its own per-tab
   `sessionStorage` id — so the leak is specifically extension detection.

If it is built, the marker SHALL be written **only while the feature's toggle is
on** (default off), and the options copy SHALL state plainly that a random tab
marker is stored in visited pages, next to the permission prompt. Writing it
silently, or for users who never enabled the feature, is not acceptable.

## Alternatives considered

- **Key the persisted edges by `tabId`.** The original design. Rejected by Spike
  2: the record survives, the identity it points at does not.
- **Key the edges by URL** (`childURL → parentURL`). Better than it first looks —
  the edge is genuinely observed rather than inferred — but it needs a retention
  policy (eviction by `tabs.onRemoved` no longer applies), goes ambiguous when two
  tabs share a URL or an endpoint has navigated since, and collapses when one URL
  has had several parents over time. Token identity makes it unnecessary.
- **Re-key restored tabs by URL *and tab order*.** Rejected: this one really does
  invent edges from position rather than recording them.
- **History backfill.** Rejected by Spike 4 — the referrers do not exist.
- **`chrome.storage.session`.** Extension-isolated, so no page-visible marker —
  but in-memory and cleared on browser close, and not per-tab. Does not survive
  the restore it would need to.
- **`window.name`.** Per-tab and survives restore, but more exposed than
  `sessionStorage` and actively used by pages.
- **A node-link graph view.** Still rejected, independently: it answers a question
  nobody asks and fights the vertical-panel visual language.

## Consequences

- The `add-tab-provenance` change directory was deleted when this ADR first said
  "do not build". Its design, specs and spike data remain in git history (PRs
  #123, #124); the deletion is PR #125. Reopening means restoring and reshaping it
  around token identity, at schema **v19** (v18 was taken by
  `remap-renamed-lucide-icons`).
- Provenance would be **browser-session scoped for non-injectable tabs**
  (`chrome://`, PDFs, the Web Store) — they cannot hold a token and return as
  roots. Correct rather than lossy: they are rarely meaningful parents.
- A tab reopened from history is genuinely new and shows as a root. Also correct.
- If lazy restore occurs in the wild, rows re-indent as restored tabs are visited.
  A design decision, not a defect — the alternative is holding indentation stable
  until the restored set has reported.
- **This ADR's positives are as contingent as its negatives were.** If Chrome ever
  stops restoring `sessionStorage`, the mechanism dies. Re-run the spikes before
  trusting either direction; the probes are cheap and the harness exists.
