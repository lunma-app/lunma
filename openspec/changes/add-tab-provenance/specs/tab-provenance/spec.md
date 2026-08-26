## Purpose

Gives a live tab a parent — the tab it was opened from — so the Temporary list can
indent children under their origin and answer "why do I have this tab?". Covers how
a tab's identity is minted and carried, how a parent is resolved and when it is
refused, how lineage is persisted and re-attached after a browser restart, and how
everything unwinds when the feature is turned off.

## ADDED Requirements

### Requirement: Provenance is off by default and gated by one setting

Provenance SHALL be governed by a single setting, `trackTabProvenance`, defaulting
to `false`. The setting SHALL gate, together and without partial states: the
`webNavigation.onCommitted` listener, the persisted edge slice, and the page tokens.

The **effective** state SHALL be `trackTabProvenance && hasApiPermission('webNavigation')`,
exposed as `effectiveProvenanceState()` from
`apps/extension/src/shared/settings.ts`, which already reads settings and may reach
`chrome.*`. It SHALL NOT live in `shared/permissions.ts` (specified as carrying no
policy) nor in `shared/provenance.ts`, which MUST stay free of `chrome.*` imports:
`content/tab-token.ts` imports `TAB_TOKEN_KEY` from it, and a content script here
carries a hard size budget — `content/tab-boundary.ts` imports only the tiny pure
`shared/url-boundary` for exactly this reason.

Because the setting lives in `chrome.storage.sync` and the permission is per-device,
a synced `true` can arrive on a device with no grant; on that device the effective
state SHALL be off and the options toggle SHALL render off. Lunma SHALL NOT
re-prompt for the grant on boot — a permission request requires a user gesture.

#### Scenario: Default install collects nothing

- **GIVEN** a fresh install where `trackTabProvenance` has never been set
- **WHEN** the service worker boots
- **THEN** the effective state SHALL be off, no `webNavigation` listener SHALL observe commits, and no token SHALL be written to any page

#### Scenario: A synced-on setting without a local grant reads as off

- **GIVEN** `trackTabProvenance` is `true` in synced settings and `webNavigation` is not granted on this device
- **WHEN** the service worker boots
- **THEN** the effective state SHALL be off, the options toggle SHALL render off, and no grant prompt SHALL be raised

#### Scenario: A declined grant leaves the toggle off

- **WHEN** the user enables the toggle and declines the Chrome permission prompt
- **THEN** `trackTabProvenance` SHALL be written back to `false` and the toggle SHALL render off

### Requirement: With provenance off, Lunma performs no page-storage interaction

While the effective state is off, Lunma's content scripts SHALL NOT read from or
write to any page's `sessionStorage`. They SHALL touch page storage only after the
service worker sends them a provenance message, mirroring the existing
`content/tab-boundary.ts` contract, and SHALL NOT read settings or query
permissions themselves.

The token script SHALL announce its readiness to the service worker
(`lunma/provenance-hello`) once on load, unconditionally. This is deliberately NOT
gated on the effective state: the script cannot read settings, and the worker
cannot reach it before it announces — a content script attaches its message
listener after `document_start`, so a worker-initiated send at commit or at
`DOMContentLoaded` fails with "Receiving end does not exist". The announcement is
a `chrome.runtime` message, invisible to page script and touching no page storage.

This is a normative property, not an implementation detail: a user who never
enables provenance SHALL be indistinguishable, from any page's perspective, from a
user without the feature. The observable surface is the page's — `sessionStorage`
and anything page script can detect — not the extension's internal messaging.

#### Scenario: A never-enabled user leaves no trace

- **GIVEN** the effective state is off
- **WHEN** the user browses to any `http(s)` page
- **THEN** no `sessionStorage` key SHALL be read or written by Lunma on that page

### Requirement: Tab identity is established by a sync exchange on every commit

A tab's provenance identity SHALL be an opaque random token. Establishing it is a
single exchange, driven by the service worker on every main-frame commit for which
the effective state is on:

1. The service worker sends `lunma/provenance-sync` to the tab's content script,
   carrying a freshly minted candidate token (`crypto.randomUUID()`).
2. The content script reads `TAB_TOKEN_KEY` (`'lunma.tabToken'`) from the page's
   `sessionStorage`. If a token is already present it keeps it and ignores the
   candidate; otherwise it writes the candidate. Either way it replies
   `lunma/provenance-token` with the token now in effect.
3. The service worker records that token as the tab's identity.

**A token already on the page WINS.** This is what makes restore work: a restored
page carries the token it was written with, so the exchange on its first commit
after restore returns the ORIGINAL token and lineage re-attaches. Minting a
candidate every time is harmless — an unused candidate is simply discarded.

The content script SHALL NOT invent a token: it either reports what the page
already holds or writes exactly the candidate it was given. It remains dormant
until it receives `lunma/provenance-sync`.

A tab's recorded identity is EPHEMERAL — it lives on the live-tab map, which is
never persisted and is rebuilt on every service-worker start. The worker restarts
routinely (an idle MV3 worker is torn down within seconds of inactivity), so Lunma
SHALL re-establish every open tab's identity on each boot, and SHALL do so only
AFTER the live-tab map has been rebuilt. An exchange performed before a tab is
known has nowhere to record its answer: the page keeps the token and the worker
discards it, leaving a tab that looks identified from the page's side and
unidentified from Lunma's. Every link opened from such a tab resolves to a root
until that page happens to reload.

The same ordering binds the per-tab exchange a page triggers when it announces
itself: it SHALL NOT run until the worker has booted and the tab is known.

The service worker SHALL maintain a live `tabId → token` map for the session. A
cross-origin commit resets `sessionStorage`, so the exchange finds no token and the
script writes the candidate; the service worker SHALL instead send the token
already mapped to that tab, so one tab keeps one identity for its whole session.

The token SHALL be opaque — a `crypto.randomUUID()` v4 value, encoding nothing
about the tab, the URL, or the time.

A tab whose script never replies — already open when Lunma was installed or
updated, or a non-injectable page — SHALL carry no identity and SHALL be a root. No
edge SHALL be persisted for it. The same absence is why no token can exist in a tab
the content script never reached.

#### Scenario: A worker restart does not lose an open tab's identity

- **GIVEN** provenance is on and a page is open and identified
- **WHEN** the service worker restarts while that page stays open
- **THEN** the tab's identity SHALL be re-established, and a link opened from it SHALL still resolve to it as parent

#### Scenario: A restored page keeps the token it carries

- **GIVEN** a restored tab whose page holds token `T` in `sessionStorage`
- **WHEN** the service worker syncs it with a freshly minted candidate `C`
- **THEN** the script SHALL reply `T`, the candidate `C` SHALL be discarded, and the tab's identity SHALL be `T`

#### Scenario: A page with no token takes the candidate

- **GIVEN** a tab whose page holds no token
- **WHEN** the service worker syncs it with candidate `C`
- **THEN** the script SHALL write `C` to `sessionStorage` and reply `C`

#### Scenario: A cross-origin commit re-stamps the tab's existing identity

- **GIVEN** tab 42 is mapped to token `T` and commits to a different origin
- **WHEN** the service worker syncs the new origin
- **THEN** it SHALL send `T` rather than a new candidate, and tab 42's identity SHALL remain `T`

#### Scenario: The content script does not invent an identity

- **GIVEN** a page carrying no token whose content script has received no message
- **WHEN** that content script loads
- **THEN** it SHALL NOT mint or write a token

#### Scenario: The token is a v4 UUID

- **GIVEN** a token written by the content script
- **WHEN** it is inspected
- **THEN** it SHALL match the `crypto.randomUUID()` v4 shape

### Requirement: A parent is recorded only when positively attributable

On `chrome.webNavigation.onCommitted` for a main frame (`frameId === 0`), Lunma
SHALL record a parent edge only when BOTH hold: the commit's `transitionType` is
not a root transition, AND the tab's `openerTabId` resolves to a tab whose token is
known.

`isRootTransition()` SHALL be expressed as an allow-list of CONTINUING
transitions — `link` — treating every other value as a root, rather than as a
deny-list of known roots. The two formulations agree on the documented
transitions, but the allow-list **fails open**: an unfamiliar or future
`transitionType` yields a root instead of silently attributing a parent, which is
the premise that a wrong parent is worse than no parent.

An **external application handoff** commits as `start_page` while carrying a live
`openerTabId` pointing at whatever tab was last focused. It SHALL therefore be
recorded as a **root**, and its opener SHALL be ignored. Resolving from
`openerTabId` alone is expressly forbidden: it would attribute externally-opened
tabs to unrelated parents.

Any commit that cannot be positively attributed SHALL produce a root. Lunma SHALL
NOT substitute a nearest, most-recent, or most-likely parent.

The edge SHALL be keyed by the token the identity exchange established for the
child. An edge SHALL NOT be recorded before that exchange returns: keying on a
candidate the page then rejected would persist an edge no page carries.

#### Scenario: A link opened in a new tab records its opener

- **GIVEN** provenance is on and tab `P` holds token `TP`
- **WHEN** a `target="_blank"` link in `P` opens tab `C`, committing with `transitionType: 'link'` and `openerTabId: P`
- **THEN** an edge SHALL be recorded from `C`'s token to `TP`

#### Scenario: An external handoff is a root despite a live opener

- **GIVEN** provenance is on and some tab is focused
- **WHEN** an external application opens a tab that commits with `transitionType: 'start_page'` and a live `openerTabId`
- **THEN** that tab SHALL be recorded as a root and the `openerTabId` SHALL be ignored

#### Scenario: An untokenised opener yields a root

- **GIVEN** provenance is on and a tab whose opener has no known token
- **WHEN** that tab commits with an otherwise attributable transition
- **THEN** it SHALL be recorded as a root

### Requirement: Lineage persists by token and re-attaches on restore

Edges SHALL be persisted as
`AppState.provenanceByToken: { [token: string]: ProvenanceEdge }`, keyed by the
CHILD's token. A `ProvenanceEdge` SHALL be
`{ parentToken: string; recordedAt: number }` — `recordedAt` being epoch
milliseconds, which is what gives the retention cap a definition of "oldest". The
slice SHALL NOT be keyed by, or contain, tab ids: they do not survive a browser
restart.

After a session restore, each restored tab SHALL report the token its page carries,
and lineage SHALL be re-attached by matching that token against the persisted
slice. Lunma SHALL NOT match restored tabs by URL, by tab order, or by any other
inferred correspondence.

A tab whose token cannot be read — a non-injectable page (`chrome://`, a PDF, the
Web Store), a tab Chrome has not loaded yet, or a tab opened fresh — SHALL be a
root until (and unless) its token is reported.

#### Scenario: A restored tab recovers its exact parent

- **GIVEN** a persisted edge from token `TC` to token `TP`, and a browser restart that restores both tabs
- **WHEN** the restored tabs report tokens `TC` and `TP`
- **THEN** the child SHALL resolve to the parent, with new tab ids on both

#### Scenario: A restored tab with no readable token is a root

- **GIVEN** a restored tab Chrome has not loaded
- **WHEN** provenance is resolved
- **THEN** that tab SHALL be a root until its token is reported

#### Scenario: Restore never infers a parent

- **GIVEN** a restored tab whose token is absent from the persisted slice
- **WHEN** provenance is resolved
- **THEN** it SHALL be a root, and no URL or ordering match SHALL be attempted

### Requirement: The service worker resolves the edge; surfaces own layout

The service worker SHALL expose, per live tab, a resolved
`LiveTab.provenanceParentTabId?: TabId` — the live tab id of that tab's parent, or
absent when it is a root. It SHALL be a named field on `LiveTabSchema`, which is a
`z.strictObject` parsed on every broadcast: an unnamed field would reject the whole
broadcast.

The service worker SHALL NOT compute an indentation depth. Depth is a **layout**
concern belonging to the surface that renders the list, because only that surface
knows which rows it is displaying — a panel may render a Space that is not the
active one, and a parent may be absent from the rendered set. Resolving the edge in
one place and the depth in the other keeps a single source of truth for each.

Resolving an edge SHALL also set the child's `provenanceParentTabId` in the same
handled event. A bulk re-resolve pass SHALL NOT be the only writer: it runs during
the identity exchange, which precedes the commit, so a record-only handler would
leave the newest tab — the one the user is looking at — unindented until some
later tab happened to trigger another pass.

Resolution SHALL walk to the nearest **live** ancestor, not merely one hop up.
Edges are keyed by token, so a chain outlives the tabs in it: when a tab in the
middle of a chain closes, its own parent edge remains and the tabs below it SHALL
re-resolve to the closest ancestor that is still open, rather than orphaning to
roots. A close therefore collapses one level out of the lineage; it never flattens
the subtree beneath it.

Closing a tab SHALL re-resolve the surviving tabs' parents, so a subtree re-indents
at the moment its ancestor goes rather than at the next unrelated event.

Resolution SHALL terminate on a cycle: a token encountered twice while walking SHALL
end the walk and the tab SHALL resolve as a root.

#### Scenario: The parent is exposed as a live tab id

- **GIVEN** a resolved edge between two live tabs
- **WHEN** the state broadcast is emitted
- **THEN** the child's `LiveTab` SHALL carry `provenanceParentTabId` set to the parent's live tab id, and the broadcast SHALL validate against `LiveTabSchema`

#### Scenario: Closing a tab re-parents its children to the grandparent

- **GIVEN** live tabs A, B and C with lineage A ← B ← C
- **WHEN** B is closed
- **THEN** C SHALL resolve its parent to A, and SHALL NOT become a root

#### Scenario: A subtree with no surviving ancestor becomes roots

- **GIVEN** live tabs A ← B ← C
- **WHEN** both A and B are closed
- **THEN** C SHALL resolve as a root

#### Scenario: A cycle degrades to a root

- **GIVEN** a persisted slice containing a cycle
- **WHEN** provenance is resolved for a tab in that cycle
- **THEN** resolution SHALL terminate and that tab SHALL resolve as a root

### Requirement: A child renders directly beneath its parent

A surface rendering provenance SHALL order its rows as a pre-order walk of the
lineage: every row immediately follows its parent, then its own children. Roots
SHALL keep the list's own order, and so SHALL siblings under a shared parent.

Indentation alone is not sufficient. The Temporary list is ordered newest-first,
so a tab opened from another is ALWAYS listed above its parent; indenting it where
it sits renders an indented row at the top with its parent below it at depth zero,
which reads as the child being the root of the pair. Depth SHALL be taken from the
walk.

Rows that the walk cannot reach — a cycle in the edges — SHALL still render, as
roots. A row SHALL NOT be dropped for having a malformed lineage.

#### Scenario: A child listed above its parent is moved beneath it

- **GIVEN** the Temporary list holds `[child, parent]` in that order, with an edge from child to parent
- **WHEN** the list renders
- **THEN** the rows SHALL render as `parent` at depth 0 followed by `child` at depth 1

#### Scenario: Siblings keep their list order under the parent

- **GIVEN** two tabs opened from the same parent, listed newest-first above it
- **WHEN** the list renders
- **THEN** both SHALL render at depth 1 directly beneath the parent, in their list order

#### Scenario: A cycle still renders every row

- **GIVEN** the resolved parents form a cycle
- **WHEN** the list renders
- **THEN** every row SHALL still be rendered

### Requirement: The persisted slice is bounded by an explicit retention rule

Because edges are keyed by token rather than by live tab, `chrome.tabs.onRemoved`
no longer evicts them and the slice is not self-bounding. Lunma SHALL prune
`provenanceByToken` on service-worker boot. The retained set SHALL be the
**transitive closure** of the tokens live tabs report: an edge is retained when its
child token is reported by a live tab, OR when its child token is the parent of a
retained edge. Retention SHALL be computed to a fixpoint — a single pass over an
unordered map would sever a chain three or more levels deep.

The slice SHALL additionally be capped at `PROVENANCE_EDGE_CAP` (2000) edges; when
the cap is exceeded, edges SHALL be dropped in ascending `recordedAt` order until
the slice is at the cap.

#### Scenario: Boot pruning retains a deep chain

- **GIVEN** a persisted chain of three edges where only the deepest child's token is reported by a live tab
- **WHEN** the service worker prunes on boot
- **THEN** all three edges SHALL be retained, because retention is the transitive closure and not a single pass

#### Scenario: The cap evicts the oldest edges

- **GIVEN** a slice holding more than `PROVENANCE_EDGE_CAP` edges
- **WHEN** pruning runs
- **THEN** edges SHALL be dropped in ascending `recordedAt` order until the slice is at the cap

### Requirement: Turning provenance off converges to no tokens

Setting `trackTabProvenance` to `false` SHALL, immediately: unregister the commit
handling, clear `provenanceByToken`, and push a token clear to every tab whose
content script is reachable.

Lunma SHALL NOT revoke the `webNavigation` grant. The `runtime-permissions`
capability holds that revocation is observed, never initiated by Lunma, and this
change does not relax that. An unheld-but-granted permission is inert: with the
effective state off no commit is observed.

Because a tab that is not loaded keeps its token — and a later session restore would
bring it back — Lunma SHALL set `AppState.provenanceCleanupPending: boolean`. While
set, the service worker SHALL push a token clear to each tab as it loads (observed
via `chrome.tabs.onUpdated`).

The flag SHALL NOT be cleared by a sweep finding nothing among currently-loaded
tabs: toggle-off already cleared those, so such a sweep is vacuous and would end
cleanup before any unloaded tab reloads. It SHALL instead be cleared on a
service-worker boot that satisfies BOTH: `chrome.storage.session` holds no
Lunma session marker (so this is the first boot of a new browser session — the
`session` area is cleared when the browser closes), AND `chrome.tabs.query({})`
reports no `http(s)` tab (so no page can be holding a marker). The service worker
SHALL write that session marker on every boot.

Re-enabling the setting while the flag is set SHALL clear the flag, cancelling the
sweep — otherwise the sweep would erase tokens as the stamper writes them.

Two limits SHALL be accepted rather than concealed. Both the options copy
(`settings`) and the `/privacy` copy (`marketing-site`) SHALL state them: that
uninstalling Lunma cannot clear markers already written to pages, and that a tab
which is never loaded again is never reached. Neither copy SHALL claim
unconditionally that turning the setting off clears every marker; both SHALL state
the bound that makes the limits harmless — a marker cannot outlive the browsing
session it was written in.

Turning provenance off SHALL NOT display a confirmation claiming markers were
cleared: tabs that are not loaded are unreachable at that moment, so the claim would
be false for exactly those tabs.

#### Scenario: Reachable tabs are cleared immediately

- **GIVEN** provenance is on with tokens stamped in loaded tabs
- **WHEN** the user turns the toggle off
- **THEN** every reachable tab SHALL have its token removed, `provenanceByToken` SHALL be empty, and no permission-removal API SHALL be called

#### Scenario: An unloaded tab is cleared when it next loads

- **GIVEN** the toggle was turned off while tab `X` was unloaded, and `provenanceCleanupPending` is set
- **WHEN** tab `X` next loads
- **THEN** its token SHALL be cleared

#### Scenario: A vacuous sweep does not end cleanup

- **GIVEN** `provenanceCleanupPending` is set and every loaded tab has already been cleared
- **WHEN** a sweep completes
- **THEN** the flag SHALL remain set, because tabs that are not loaded may still hold tokens

#### Scenario: The flag clears on a fresh browser session with no http tabs

- **GIVEN** `provenanceCleanupPending` is set
- **WHEN** the service worker boots, `chrome.storage.session` holds no Lunma session marker, and `chrome.tabs.query({})` reports no `http(s)` tab
- **THEN** `provenanceCleanupPending` SHALL be cleared

#### Scenario: A fresh browser session that restored tabs keeps the flag

- **GIVEN** `provenanceCleanupPending` is set
- **WHEN** the service worker boots with no session marker but `chrome.tabs.query({})` reports `http(s)` tabs
- **THEN** the flag SHALL remain set and the load sweep SHALL continue

#### Scenario: Re-enabling cancels the sweep

- **GIVEN** `provenanceCleanupPending` is set
- **WHEN** the user turns the toggle back on
- **THEN** the flag SHALL be cleared so the sweep cannot erase newly stamped tokens
