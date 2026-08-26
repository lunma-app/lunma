## Context

See [proposal.md](proposal.md) — Why, and
[ADR 0005](../../../docs/adr/0005-tab-provenance.md) for the measured constraints
that pick the mechanism.

Five facts in the current codebase shape everything below:

1. **Content scripts here are dormant until pushed.**
   `content/tab-boundary.ts` reads no settings, imports no `chrome.*`, and holds a
   `< 3KB gzipped` budget — the SW pushes it an allow-set per tab. That pattern is
   the reason a never-enabled user can be left completely untouched.
2. **The SW dies after ~30s idle**, so anything not persisted evaporates many
   times an hour.
3. **`tempTabIds` is a flat ordered array**, and `TempTabs.svelte` renders it as a
   pure projection with a keyed `{#each}` and a `flip` animation.
4. **Settings live in `chrome.storage.sync`**; permissions are per-device and
   never sync.
5. **The `/privacy` copy is spec-governed.** `marketing-site` normatively requires
   it to say content scripts read "never page content" — a claim a token write
   makes untrue.

## Goals / Non-Goals

**Goals:**

- Lineage that is exact, or absent — never plausible.
- Lineage that survives a browser restart.
- A user who never enables it is untouched: no token, no listener, no read.
- "Off" that converges to actually off.

**Non-Goals:**

- Reconstructing lineage that was never observed (history backfill is impossible
  — ADR 0005).
- A graph view.
- Cross-device provenance. Tokens are per-device by construction; `storage.sync`
  is never involved.
- Provenance for non-injectable tabs (`chrome://`, PDFs, the Web Store). They are
  roots.

## Decisions

**D1 — Identity is a token in the page, not a tab id.**
`tabId` does not survive restore; no browser-level durable identity exists (ADR
0005). A random token in the page's `sessionStorage`, minted once and reported to
the SW, is the only handle that comes back. Alternatives — URL keying, URL+order
re-keying, history reconstruction — are recorded and rejected in the ADR.

**D2 — The token is minted by the SW, not the content script.**
The content script is told *"you are token X"*; it does not invent one. This keeps
the script dumb (fact 1), keeps minting in one place, and lets the SW carry a
tab's identity across a cross-origin navigation — where `sessionStorage` resets
and the page would otherwise mint a second identity for the same tab.

**D3 — The content script stays dormant until pushed.**
No settings read, no storage touch, until the SW sends it a message. The
consequence is a normative property worth stating in the spec rather than leaving
implicit: **with the toggle off, Lunma performs zero `sessionStorage`
interaction — not even a read.** The alternative (script checks the setting on
every load and self-clears) was rejected: it makes every page load touch storage
for users who never opted in, to save one message for those who did.

**D4 — Off converges via a cleanup-pending flag, cleared on a provably empty start.**
Toggle-off stops commit handling, clears the edge slice, and pushes a token clear to
every reachable tab. It does NOT revoke the `webNavigation` grant —
`runtime-permissions` holds that revocation is observed, never initiated by Lunma.
An unused grant is inert: with the effective state off, no commit is recorded.

Tabs that were unloaded keep their token, and a later session restore would bring it
back, so `provenanceCleanupPending` stays set and the SW clears each tab as it loads
(`tabs.onUpdated`).

The flag cannot clear on "a sweep found nothing", because step 3 already emptied
every loaded tab — that sweep is vacuous by construction. It clears when BOTH
`chrome.storage.session` holds no session marker (that area is wiped when the
browser closes, so this is a new browser session) AND `chrome.tabs.query` reports no
`http(s)` tab, so nothing can be holding a marker. Both signals were measured: the
`session` area does not survive a restart, and restored tabs are already visible to
the SW at its first tick, with no timing race. Re-enabling also clears the flag,
or the sweep would erase tokens as the stamper writes them.

Alternatives: leave the tokens (rejected — a marker outliving an explicit withdrawal
of consent is the worst available outcome); immediate sweep only (rejected — session
restore silently un-does it). Two limits are accepted and disclosed: **uninstall
cannot clean pages**, and a tab never loaded again is never reached. Both are
bounded by `sessionStorage` not outliving the session.

**D5 — Toggle-off shows no "cleared" confirmation.**
The toggle returning to off is the feedback. A toast claiming tokens were cleared
would overstate: unloaded tabs are unreachable at that moment, so the claim would
be false for exactly the tabs the user might care about. Silence that is accurate
beats a confirmation that is not.

**D6 — Lineage renders as it arrives, with no transition at all.**
If Chrome defers loading a restored tab, its token arrives only when it loads, so
indentation appears then. Holding indentation until "the restored set has reported"
was rejected as unimplementable — a tab may never load again, so the wait has no
terminating condition.

A provenance-driven depth change applies with **no transition of any kind**. That
needs a mechanism, not just an intention: `flip` animates any measured box movement.
A Svelte `animate:` directive cannot be applied conditionally, so the mechanism is
the duration function `TempTabs` already passes — it returns 0 unless a drag is in
progress. Motion in the Temporary list then means "you moved something", always.

**D7 — The setting is intent; the permission is capability; boot reconciles.**
`trackTabProvenance` syncs; `webNavigation` does not. A synced `on` lands on a
device with no grant, so the effective state is `setting && hasPermission`, and
boot reconciles: setting on without the grant renders the toggle off (and does not
re-prompt — a prompt needs a gesture). This is the first Lunma setting whose value
is intent rather than state, which is why it needs a stated rule rather than an
implicit one.

**D8 — `transitionType` is required, not decorative.**
An external-app handoff commits as `start_page` while carrying a live
`openerTabId` pointing at whatever tab was last focused (ADR 0005). Opener alone
would confidently indent it under an unrelated parent. Since a wrong parent is
worse than no parent, the whole feature depends on this signal — which is the
entire justification for the `webNavigation` grant.

**D9 — Fail open to root, always.**
Any first commit that cannot be positively attributed — no token on the opener, an
unattributable transition, a missing edge after restore — renders as a root.
Roots are honest; guesses are not.

**D10 — The privacy disclosure ships in this change, and as a spec delta.**
`marketing-site` normatively enumerates what the `/privacy` copy must say. Its
"never page content" clause stays true — writing a marker is not reading the page —
but the enumeration has no room for a marker Lunma leaves behind, and a policy that
lists everything else while omitting the one thing Lunma writes would be misleading
by structure. The requirement changes, not just the page. Splitting the disclosure into a separate change was rejected: it would leave
a window where the shipped extension does something the spec forbids the page from
admitting.

**D11 — `shared/provenance.ts` stays free of `chrome.*`; the effective-state
helper lives in `shared/settings.ts`.**
Raised at apply time and agreed with the user: the artifacts placed
`effectiveProvenanceState()` in `shared/provenance.ts`, but `content/tab-token.ts`
imports `TAB_TOKEN_KEY` from that module, and a content script here carries a hard
size budget — `content/tab-boundary.ts` imports only the tiny pure
`shared/url-boundary` precisely so it stays under it. A helper reaching
`chrome.permissions` in the same module would drag Chrome into the content bundle.

Resolution: the artifacts were updated (option (a) of the drift protocol) rather
than the implementation. `provenance.ts` holds constants and pure functions only;
the helper moves to `shared/settings.ts`, which already reads settings and is where
setting-derived state belongs. `shared/permissions.ts` remains excluded either way,
as it is specified to carry no policy.

**D12 — Four apply-time alignments, agreed and recorded.**
(a) The v19 migration is an identity pass-through, not a writer: `AppStateV19Schema`
carries Zod defaults, and a writing migration made full-chain output fail every
frozen `strictObject` intermediate schema. (b) `isRootTransition` is an allow-list
of continuing transitions rather than a deny-list of roots, so an unfamiliar
`transitionType` fails open to a root. (c) `ResultSourcesCard` is narrowed to
`OptionalResultSource` — widening the permission union must not force
`webNavigation` onto a card about launcher result sources. (d) `LiveTab.openerTabId`
is restored: it was dropped during an artifact rewrite, and the commit handler
cannot resolve an opener without it.

**Docs this change must update:**

- `docs/adr/0005-tab-provenance.md` — the "not currently implemented" sentence
  becomes false and goes.
- `docs/architecture.md` — the permission enumeration (a closed list today), the
  SW event-source list, and the `AppState` slice inventory.
- Left untouched: `docs/tech-stack.md` — no stack change, no new dependency.

## Visual language

- **Hierarchy.** Depth is expressed by **indentation plus a hairline lineage rule**
  running from parent to child, not by nesting containers. The Temporary list stays
  one flat scroll; a child is a `TabRow` shifted by one depth step, so row height,
  hit area and drag behaviour are unchanged at every level. Depth is capped for
  layout purposes — beyond the cap rows share the deepest indent rather than
  marching off the panel edge, since a 390px sidebar cannot spend more than a few
  steps.
- **Motion.** Provenance-driven re-indentation has **no transition at all** (D6):
  no `flip`, no fade, no duration. Drag reorder keeps its existing `flip` at
  `reorderFlipMs`, which stays the only motion in this list — so movement in the
  Temporary list means "you moved something", always. Reduced-motion therefore
  needs no special case here.
- **Colour.** The lineage rule uses `--border-soft`, the existing hairline token —
  no new token, no hue. The indent step is one `--space-3`; `TabRow`'s own inset is
  `--space-2`, so a step is deliberately one size larger than the row's padding and
  reads as structure rather than as slack. Provenance is structure,
  not status, so it must not compete with the Space's colour identity or the active
  row's treatment.
- **Interaction feedback.** Hover, active, focus-visible, and the drag affordance
  are `TabRow`'s existing treatments, unchanged at depth. A parent row gains no
  expand/collapse control in this change — the tree is a reading aid, not a
  navigation control.
- **Empty and degraded states.** A Space with no resolved edges renders exactly as
  today: a flat list, no rules, no reserved indent gutter. This matters because it
  is the state every user sees before enabling, and the state a restored session
  shows for tabs Chrome has not loaded.

Arc's sidebar has no provenance equivalent — its Spaces are hand-arranged, so
lineage would fight the user's own ordering. Lunma's Temporary list is
machine-filled (tabs arrive by navigation, not by choice), which is what makes
structure it did not ask for legible rather than intrusive.

## Risks / Trade-offs

- **[The token is the first page-readable trace Lunma leaves]** → Any site can
  detect Lunma while the toggle is on. It grants no new tracking ability (a page
  can already write its own per-tab `sessionStorage` id), so the exposure is
  specifically extension detection. Mitigated by: off by default, dormant scripts
  (D3), convergent cleanup (D4), and disclosure in both the options copy and
  `/privacy` (D10). Not mitigated away — it is the price of the mechanism.
- **[`webNavigation` reads "Read your browsing history"]** → The most alarming
  prompt Chrome shows for a tab manager. No mitigation available; the string is
  Chrome's. The options copy must set expectations *before* the prompt, and a
  declined grant must leave the toggle visibly off (D7).
- **[Lazy restore delays lineage]** → Measured absent on eight tabs, but not
  disproven for eighty under memory pressure (ADR 0005). Degradation is graceful —
  delayed, never wrong — and D6 keeps the late arrival visually quiet.
- **[Cross-origin navigation resets `sessionStorage`]** → The SW re-stamps from its
  live `tabId → token` map (D2). Untested; if re-stamping proves unreliable, a tab
  that changes origin becomes a root after restore rather than carrying a wrong
  parent.
- **[`onCommitted` fires on every navigation in every tab]** → Volume through the
  serialized coordinator queue. The handler is pure and synchronous against
  in-memory state, and its `EventPolicy` entry coalesces by `tabId`, matching
  `tabs.onUpdated`'s existing treatment.
- **[The persisted slice is no longer bounded by live tabs]** → Keying by token
  means `tabs.onRemoved` no longer evicts, so the slice needs an explicit
  retention rule (bounded by tokens still reachable, pruned on boot). Without one
  it grows without limit — a regression against the current design, where
  retention needed no policy at all.
- **[Trusting an indent]** → The premise behind D8 and D9: indentation carries
  authority, so a wrong parent is worse than no parent. If review finds us arguing
  for a plausible-but-unverified edge, that is the design failing, not the
  constraint.
