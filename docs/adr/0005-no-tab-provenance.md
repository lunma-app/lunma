# 0005 — No tab provenance: Chrome cannot supply durable tab lineage

- **Status:** Accepted
- **Date:** 2026-08-25

## Context

A recurring idea for a vertical tab manager is **provenance**: give each live tab
a parent, indent children under the tab they were opened from, and let a row say
*"Opened from Hacker News."* It answers the question users actually ask of a
forty-tab Space — not *"show me the structure"* but *"why do I have this tab?"*

A full change was designed for it (`add-tab-provenance`): resolve a parent from
`chrome.webNavigation.onCommitted`, persist the edge, render the temp-tab list as
a tree. It gated itself on empirical spikes rather than reasoning, following the
precedent where documentation-based reasoning about `openerTabId` had arrived at
the exact opposite of the truth.

Four spikes were run on macOS against the real built extension. Three of them
closed the idea.

**Spike 1 — external opens are separable. ✓**
A real warm-start OS handoff (a second Chrome process invoked against the same
profile) commits as `transitionType: start_page`, not `link`, so it is
distinguishable from an in-page click. It also arrives **with a live
`openerTabId`** — the previously focused tab — so `openerTabId` alone would
confidently parent an external open to an unrelated tab. Only `transitionType`
prevents that, and only the `webNavigation` permission supplies it.

**Spike 2 — `openerTabId` does not survive session restore. ✗**
A parent/child pair created with an explicit opener, profile closed, relaunched
with `--restore-last-session`: the same URLs return with **new tab ids and
`openerTabId: null`**.

**Spike 3 — no durable tab identity exists to re-key against. ✗**
The obvious rescue is to persist the edges ourselves. It fails, because what dies
is the identity, not the record. `tabs.Tab.sessionId` is `null` on every live
tab, before and after restore. `sessions.getRecentlyClosed()` does return
sessionIds, but they are a **third id space** matching neither the pre- nor the
post-restore tab ids — handles for `sessions.restore()`, not identity for a live
restored tab. A persisted `{childId → parentId}` comes back describing two ids
that no longer exist.

**Spike 4 — history cannot rebuild the edges that matter. ✗**
The remaining rescue was reconstructing lineage from `chrome.history` +
`getVisits()`. Reverse-mapping a `visitId` to a URL does work. The data does not:

| Open | `transition` | `referringVisitId` |
|---|---|---|
| Same-tab link click | `link` | the parent visit |
| `target="_blank"` | `link` | `0` |
| Middle-click → new tab | `link` | `0` |
| `window.open()` | `link` | `0` |

**Every new-tab open records no referring visit.** Only same-tab navigation
carries a chain — and that is not a provenance edge at all: it is one tab moving,
not a parent spawning a child. The edges the feature would render are precisely
the ones history cannot supply.

## Decision

**Lunma does not build tab provenance.** Chrome exposes no mechanism by which
tab-spawn lineage survives a browser restart, and no combination of persistence,
the sessions API, or history backfill supplies one.

What remained buildable was a feature that requires the *"Read your browsing
history"* permission grant, ships off by default, and resets to a flat list on
every browser restart — permanently, with no path to fixing it. That trade was
judged not worth making.

## Alternatives considered

- **Ship it session-scoped and say so.** Accept the restart reset as permanent
  and set expectations in the options copy before the permission prompt. Rejected
  on value: the grant is Chrome's most alarming string for a tab manager, and the
  feature it buys is gone every morning.
- **Persist the edges ourselves.** Rejected by Spike 3 — the record survives, the
  identity it points at does not.
- **Backfill lineage from history.** Rejected by Spike 4 — no referrers exist for
  new-tab opens.
- **Re-key restored tabs by URL and tab order.** Rejected on correctness. It
  re-attaches plausible parents at the exact moment a user is deciding whether to
  trust the indentation; two tabs on one URL, or a tab that navigated since, and
  it is confidently wrong. Indentation carries authority — a wrong parent is
  worse than no parent.
- **A node-link graph view.** Rejected independently of the above: it answers a
  question nobody asks and fights the vertical-panel visual language.

## Consequences

- The `add-tab-provenance` change and its `tab-provenance` capability are not
  built; the change directory is removed. Its full design, specs and spike data
  remain in git history (PRs #123 and #124) for anyone re-opening the question.
- `webNavigation` stays out of `optional_permissions`. Lunma's permission set
  remains as `0001`'s local-first posture and the least-privilege position leave
  it.
- The temp-tab list stays a flat projection of `tempTabIds`. Any future nesting
  concept needs its own justification, not this one.
- **This decision is contingent on Chrome, not on taste.** If Chrome ever exposes
  a tab identifier that survives session restore, or records referrers for
  new-tab opens, the blocking constraint is gone and the question is worth
  re-opening — Spike 1 already showed the edges Lunma *would* draw are correct
  rather than guesswork. Re-run the spikes before trusting this ADR's negatives.
