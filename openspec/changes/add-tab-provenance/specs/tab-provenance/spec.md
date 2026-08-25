## ADDED Requirements

### Requirement: Provenance is resolved from the committed transition, never from the opener alone

The extension SHALL resolve a live tab's parent from
`chrome.webNavigation.onCommitted` (`frameId === 0` only), using
`transitionType` to decide whether an edge exists and `openerTabId` only to
identify the candidate parent tab for a tab's first commit.

`openerTabId` SHALL NOT be used as an edge on its own. It is empirically a
non-signal — Chrome sets it to the currently-active tab for every new tab landing
in an existing window, regardless of gesture
(`2026-07-02-fix-direct-url-tab-dedup`, Decision 1).

`resolveParent()` and `isRootTransition()` SHALL live in
`apps/extension/src/shared/provenance.ts`. The handler SHALL live at
`apps/extension/src/background/handlers/web-navigation.ts`.

`isRootTransition()` SHALL return true for `typed`, `generated`,
`auto_bookmark`, `keyword`, `keyword_generated`, `reload`, and BOTH spellings of
the auto-toplevel transition — `start_page` (emitted by `chrome.webNavigation`)
and `auto_toplevel` (emitted by `chrome.history`). Accepting both is required
even though only `start_page` can occur in this change, so the
`add-tab-provenance-backfill` follow-up does not have to revisit the predicate.

#### Scenario: A link click in the current tab creates an in-tab edge

- **WHEN** a tab already showing `https://news.ycombinator.com` commits
  `https://example.com` in the main frame with `transitionType: 'link'`
- **THEN** the tab's parent SHALL be recorded as `https://news.ycombinator.com`

#### Scenario: A typed URL is a root regardless of the opener

- **WHEN** a tab commits a main-frame navigation with `transitionType: 'typed'`
- **AND** `openerTabId` is present and refers to a live tab
- **THEN** the tab SHALL be recorded as a root with no parent
- **AND** the opener SHALL be ignored

#### Scenario: A subframe navigation is ignored

- **WHEN** `onCommitted` fires with `frameId` greater than `0`
- **THEN** no provenance SHALL be resolved or recorded

#### Scenario: A tab's first commit uses the opener as the candidate parent

- **WHEN** a tab with no previously committed URL commits a main-frame
  navigation with a non-root `transitionType`
- **AND** `openerTabId` refers to a tab whose current URL is known
- **THEN** the tab's parent SHALL be recorded as that opener tab's current URL

### Requirement: A parent is recorded only when it is known to be real

The extension SHALL record a parent only when the committed transition
establishes one. Where a parent cannot be positively determined, the tab SHALL be
recorded as a root.

A tab SHALL NOT be parented to a plausible-but-unverified candidate. A wrong
indent is a worse outcome than no indent, because indentation carries authority
the user will trust.

#### Scenario: An unresolvable opener degrades to a root

- **WHEN** a tab's first main-frame commit has a non-root `transitionType`
- **AND** its `openerTabId` is absent, or refers to a tab whose current URL is
  unknown
- **THEN** the tab SHALL be recorded as a root
- **AND** no parent SHALL be guessed from the active tab or any other heuristic

### Requirement: Client redirects inherit the parent; server redirects need no filtering

A main-frame commit carrying the `client_redirect` transition qualifier SHALL NOT
create an edge to the tab's own pre-redirect URL. The tab SHALL retain its
existing parent.

A server redirect (301/302) commits exactly once, at the final URL, carrying the
`server_redirect` qualifier, and SHALL be treated as an ordinary commit — no
filtering is required or permitted.

#### Scenario: A link-rewriter chain resolves to one node at the destination

- **WHEN** a tab is opened from a link whose URL is a corporate mail/security
  link-rewriter that server-redirects to the real destination
- **THEN** exactly one main-frame commit SHALL occur, at the destination URL
- **AND** the tab's parent SHALL be the page the link was clicked on, not the
  rewriter URL

#### Scenario: A meta-refresh redirect does not fabricate an edge

- **WHEN** a tab commits `https://short.link/x` and that page client-redirects,
  producing a second main-frame commit qualified `client_redirect`
- **THEN** the tab's parent SHALL remain whatever it was before the redirect
- **AND** `https://short.link/x` SHALL NOT be recorded as the parent of the
  destination

### Requirement: Provenance is persisted and survives service-worker termination

Resolved edges SHALL persist to `chrome.storage.local` as part of `AppState`, in
the slice `provenanceByTabId: { [tabId: number]: ProvenanceEdge }`.

The extension SHALL NOT hold unresolved provenance in module-scope memory across
events. The MV3 service worker terminates after approximately 30 seconds of
inactivity, and a lost correlation would degrade to attributing a tab to whatever
was focused — a fail-wrong outcome this capability forbids.

The resolved parent SHALL be stored. `openerTabId` SHALL NOT be stored as the
edge, because Chrome omits it once the opener tab closes.

#### Scenario: Lineage survives an idle service-worker death

- **WHEN** a tab's parent has been resolved and recorded
- **AND** the service worker terminates through idle timeout and is later revived
  by a new event
- **THEN** the tab's recorded parent SHALL be unchanged and still rendered

#### Scenario: A resolved edge is not re-derived from a decayed opener

- **WHEN** a tab's parent has been resolved and recorded
- **AND** the opener tab is subsequently closed, so Chrome omits `openerTabId`
- **THEN** the tab's recorded parent SHALL be unchanged

### Requirement: Closing a parent reparents its children to the grandparent

On `tabs.onRemoved`, the removed tab's edge SHALL be dropped, and every tab whose
parent was the removed tab SHALL have its parent rewritten to the removed tab's
parent.

Children SHALL NOT be promoted to roots (they have real lineage) and SHALL NOT be
removed. The tree shortens; no recorded relationship becomes false.

This behaviour SHALL NOT be user-configurable.

#### Scenario: The tree shortens rather than orphaning

- **WHEN** tab B's parent is tab A, tab C's parent is tab B, and tab B is closed
- **THEN** tab C's parent SHALL become tab A's URL
- **AND** tab C SHALL NOT become a root

#### Scenario: Closing a root's only child leaves no dangling edge

- **WHEN** a tab with a recorded parent is closed
- **THEN** its entry SHALL be removed from `provenanceByTabId`

### Requirement: The feature is off by default and off means nothing is collected

All provenance behaviour SHALL be gated on the `trackTabProvenance` setting,
which SHALL default to `off`.

While the effective state is off, the extension SHALL NOT hold the
`webNavigation` permission, SHALL NOT register the `webNavigation.onCommitted`
listener, and SHALL NOT retain stored edges.

Disabling the setting SHALL release the `webNavigation` permission and clear
`provenanceByTabId`.

#### Scenario: A user who never enables provenance is unaffected

- **WHEN** the extension is installed and `trackTabProvenance` is never enabled
- **THEN** the install prompt SHALL NOT mention browsing history
- **AND** no `webNavigation` listener SHALL be registered
- **AND** `provenanceByTabId` SHALL remain empty

#### Scenario: Turning the setting off discards the data

- **WHEN** a user disables `trackTabProvenance`
- **THEN** `provenanceByTabId` SHALL be cleared
- **AND** the `webNavigation` permission SHALL be released
- **AND** the sidebar SHALL render a flat tab list

### Requirement: Effective state is the setting AND the permission

`trackTabProvenance` persists to `chrome.storage.sync`; the `webNavigation`
permission is per-device and never syncs. The setting therefore expresses
**intent**, not state.

Effective enablement SHALL be `trackTabProvenance && hasApiPermission('webNavigation')`.

Where intent is on but the permission is absent on this device, the options UI
SHALL render a distinct "enabled, needs permission on this device" state with a
user-gesture affordance to grant. The extension SHALL NOT silently re-request the
permission at boot — `chrome.permissions.request()` requires a user gesture — and
SHALL NOT present the toggle as on.

Mid-session revocation via the browser's own permission UI SHALL be observed via
`onPermissionsChange` and SHALL take effect without requiring a restart.

#### Scenario: A synced setting lands on a device without the grant

- **WHEN** `trackTabProvenance` is enabled on device A and syncs to device B
- **AND** device B has never granted `webNavigation`
- **THEN** device B SHALL NOT collect provenance
- **AND** device B's options page SHALL render the needs-permission state, not an
  on toggle

#### Scenario: A declined grant leaves the toggle off

- **WHEN** a user enables the toggle and declines the Chrome permission prompt
- **THEN** the toggle SHALL render off
- **AND** no listener SHALL be registered

#### Scenario: Revoking the permission mid-session stops collection

- **WHEN** a user revokes `webNavigation` through Chrome's extension settings
  while Lunma is running
- **THEN** collection SHALL stop without a restart
- **AND** the options page SHALL render the needs-permission state

### Requirement: Enabling starts collection from that point; existing tabs are roots

On enable, tabs already open SHALL be recorded as roots. Their transitions
occurred before the listener existed and cannot be recovered.

The extension SHALL NOT seed edges from `chrome.tabs.query()`'s `openerTabId` to
make the tree appear populated. That field is the disproven non-signal, and
seeding from it would fill the sidebar with plausible, wrong indents at the moment
the user is deciding whether to trust the feature.

Retroactive lineage is the scope of `add-tab-provenance-backfill`.

#### Scenario: Flipping the toggle does not fabricate history

- **WHEN** a user enables `trackTabProvenance` with 40 tabs already open
- **THEN** all 40 SHALL render as roots
- **AND** no parent SHALL be inferred from `openerTabId` for any of them
- **AND** tabs opened after enablement SHALL acquire lineage normally

### Requirement: Provenance is browser-session scoped

Because `provenanceByTabId` is keyed by Chrome tab id, and tab ids do not survive
a browser restart, recorded lineage SHALL NOT be expected to survive a restart.
After a restart, tabs SHALL render as roots.

This limit SHALL be stated in user-facing options copy rather than discovered by
users.

#### Scenario: A browser restart resets the forest

- **WHEN** the browser is restarted with provenance enabled
- **THEN** restored tabs SHALL render as roots
- **AND** new navigations SHALL acquire lineage normally

### Requirement: The sidebar renders lineage by indentation, capped at depth 3

`TempTabs.svelte` SHALL render children nested under their parent.
`TabRow.svelte` SHALL accept a `depth` prop.

Visual depth SHALL be capped at 3. Tabs deeper than the cap SHALL render at depth
3 rather than indenting further, so a long chain cannot push titles off the
panel.

`aria-level` SHALL match the rendered depth, capped identically — assistive
technology SHALL NOT be told a depth a sight-reader cannot see.

The lineage rail SHALL be `aria-hidden` and SHALL NOT be the sole carrier of
depth information.

#### Scenario: A deep chain stops indenting at the cap

- **WHEN** a tab's lineage is five levels deep
- **THEN** it SHALL render at depth 3
- **AND** its `aria-level` SHALL be 3

#### Scenario: Depth does not fork row interaction states

- **WHEN** a tab row renders at any depth
- **THEN** its hover, active, focus, and press states SHALL be `TabRow`'s
  existing states
- **AND** the focus ring SHALL NOT be clipped by the indent at any depth
