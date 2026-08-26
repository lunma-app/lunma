# 0005 — Tab provenance is carried by a page-stamped token

- **Status:** Accepted
- **Date:** 2026-08-26

## Context

Tab provenance gives a live tab a parent: the temporary list indents children
under the tab they were opened from, so a forty-tab Space can answer *"why do I
have this tab?"* rather than only *"what is in here?"*

Two things make it hard, both measured against the real built extension on macOS
(2026-08-26):

**Chrome offers no durable tab identity.** `openerTabId` supplies a parent while
a session is live, but a restored tab returns with a fresh id and
`openerTabId: null`. `tabs.Tab.sessionId` is `null` on every live tab.
`sessions.getRecentlyClosed()` ids form a third id space matching neither the
pre- nor post-restore tabs — they are handles for `sessions.restore()`, not
identity. So a persisted `childTabId → parentTabId` map returns describing tabs
that no longer exist.

**A parent cannot be inferred after the fact.** `history.getVisits()` returns
`referringVisitId: 0` for every new-tab open — `target="_blank"`, middle-click and
`window.open` alike. Only same-tab navigation carries a referrer chain, and that
is not a provenance edge: one tab moving, not a parent spawning a child. The edges
the sidebar would render are precisely the ones history does not record.

**Indentation carries authority**, so a wrong parent is worse than no parent. Any
mechanism that guesses is disqualified, not merely imperfect.

## Decision

Lineage is keyed by a **random token stamped into the page's `sessionStorage`** by
Lunma's existing content scripts, with the edge persisted as
`childToken → parentToken`. On restore, each tab reports its own token and lineage
re-attaches exactly — no URL matching, no ordering heuristics, no reconstruction.

`sessionStorage` survives session restore, is distinct per tab, and rides through
same-origin navigation. It costs no new permission: Lunma already injects at
`http(s)://*/*` at `document_start`.

The property that makes it trustworthy is how it fails. Relaunching **without**
session restore yields no restored tabs at all — token and tab die together, so a
restored tab never carries silently missing lineage. `openerTabId` fails the other
way: it dies while the tab survives, leaving a tab that looks rootless but is not.

The parent itself is resolved from `chrome.webNavigation.onCommitted`.
`transitionType` is required, not decorative: an external application handoff
commits as `start_page` while arriving **with a live `openerTabId`** pointing at
whatever tab was last focused. Using `openerTabId` alone would confidently indent
externally-opened tabs under unrelated parents. This is what the `webNavigation`
permission buys.

Two costs are accepted as the price of the above:

1. **`webNavigation`** — one optional, gesture-bound permission. Its Chrome grant
   prompt reads *"Read your browsing history."*
2. **A page-visible marker.** A content script's `sessionStorage` **is** the
   page's; the isolated world does not extend to storage. Any site can read the
   token and learn Lunma is installed. Lunma otherwise leaves no such trace —
   `launcher/overlay.ts` uses `attachShadow({ mode: 'closed' })` and creates its
   host only when the overlay opens, and `content/tab-boundary.ts` adds listeners a
   page cannot enumerate. The token grants no new tracking ability, since any page
   can already write its own per-tab `sessionStorage` id; the exposure is
   specifically extension detection.

Because of (2), the token SHALL be written **only while the provenance toggle is
on** (default off), and the options copy SHALL disclose that a random tab marker
is stored in visited pages, beside the permission prompt. Writing it silently, or
for users who have not enabled the feature, is not acceptable.

Provenance is **not currently implemented**. This decision governs how it is built
if it is built; whether the two costs above are worth the feature is a product
question, open.

## Alternatives considered

- **Key the edges by `tabId`.** The identity does not survive restore, so the
  persisted record returns pointing at tabs that no longer exist.
- **Key the edges by URL** (`childURL → parentURL`). The edge is genuinely
  observed rather than inferred, so this is not guesswork — but eviction by
  `tabs.onRemoved` no longer applies, so it needs a retention policy; it is
  ambiguous when two tabs share a URL or an endpoint has navigated since; and it
  collapses when one URL has had several parents over time. Token identity makes
  it unnecessary.
- **Re-key restored tabs by URL and tab order.** Invents edges from position
  rather than recording them — disqualified by the authority of indentation.
- **Reconstruct lineage from browsing history.** The referrers do not exist for
  new-tab opens.
- **`chrome.storage.session`.** Extension-isolated, so it would leave no
  page-visible marker — but it is in-memory, cleared on browser close, and not
  per-tab.
- **`window.name`.** Per-tab and survives restore, but more exposed than
  `sessionStorage` and actively used by pages.
- **A node-link graph view.** Answers a question nobody asks and fights the
  vertical-panel visual language.

## Consequences

- Provenance rides on `sessionStorage` being restored with the session. If Chrome
  stops doing that, the mechanism dies — re-measure before trusting it.
- Non-injectable tabs (`chrome://`, PDFs, the Web Store) cannot hold a token and
  appear as roots. This is correct rather than lossy: they are rarely meaningful
  parents.
- A tab reopened from history is genuinely new and appears as a root.
- Chrome may defer loading a restored tab until it is activated. The content
  script runs at `document_start`, so the token arrives whenever the tab loads —
  lineage is delayed, never wrong. Whether rows re-indent as tabs are visited, or
  indentation is held until the restored set reports, is a design choice the
  implementation must make deliberately.
- The persisted slice is keyed by token rather than live tab, so eviction by
  `tabs.onRemoved` no longer bounds it. It needs an explicit retention rule.
