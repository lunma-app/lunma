## MODIFIED Requirements

### Requirement: Lens results are ephemeral runtime state

Query results SHALL live in a broadcast-only `AppState` slice
`lenses: { [folderId]: LensRuntime }` where `LensRuntime` is
`{ sections: { [sourceKey: string]: LensSectionRuntime } }` and `LensSectionRuntime` is
`{ state: 'pending' | 'ok' | 'signed-out' | 'error' | 'needs-access'; items: LensItem[]; fetchedAt: number | null }`.
`sourceKey` is the **per-account, per-filter** section identity: `${sourceId}:${query}`
for a queue section, and `${sourceId}` for an rss section (no query), where `sourceId`
is the referenced account's id. It is derived from a **resolved single-query config**
produced by expanding a `LensSource` over its `queries[]`, and is the stable identity
key for that section within the lens. Keying by `sourceId` (rather than `source`/`host`)
ensures two accounts on the same host occupy distinct sections.

The slice SHALL never be persisted and SHALL be written only by the coordinator drain: a connector
fetch completes and enqueues the internal event
`{ source: 'connector'; kind: 'lenses.result'; payload: { folderId, sourceKey, runtime: LensSectionRuntime } }`
whose handler calls `store.setLensSectionRuntime(folderId, sourceKey, runtime)`, producing one
broadcast per drain (unchanged broadcast contract). A refresh that begins while items exist SHALL
mark each section's runtime `pending` **without clearing `items`** (no blink). After a SW restart
the slice is empty, so each section renders pending until its first fetch.

#### Scenario: Results arrive through the single-writer drain per section

- **WHEN** a connector fetch completes for lens `f1`, account `acc-1`, source key `acc-1:authored`
- **THEN** the connector enqueues a `lenses.result` event carrying `{ folderId: 'f1', sourceKey: 'acc-1:authored', runtime }` and the coordinator handler writes it via `setLensSectionRuntime`
- **AND** exactly one `state-broadcast` carries the updated section

#### Scenario: Two filters of one instance occupy distinct sections

- **GIVEN** a lens with one instance referencing account `acc-1` `{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored', 'review-requested'] }`
- **WHEN** both sections fetch
- **THEN** the runtime holds two sections keyed `acc-1:authored` and `acc-1:review-requested`, neither overwriting the other

#### Scenario: Two same-host accounts occupy distinct sections

- **GIVEN** a lens referencing two `github.com` accounts `acc-work` and `acc-personal`, each carrying `['authored']`
- **WHEN** both sections fetch
- **THEN** the runtime holds two sections keyed `acc-work:authored` and `acc-personal:authored`, neither overwriting the other

#### Scenario: A refresh keeps last-known items visible per section

- **GIVEN** lens `f1`'s section `acc-1:authored` runtime is `ok` with 5 items
- **WHEN** a refresh begins for that lens
- **THEN** the section state becomes `pending` while `items` still holds the 5 items

#### Scenario: A SW restart costs one pending beat per section

- **WHEN** the SW restarts and the sidebar renders a multi-filter lens before its first fetches complete
- **THEN** each section renders the pending state (no stale items from disk)

### Requirement: Lens item bindings give results pinned-tab activation

`lensItemBindings` is typed as `{ [folderId: FolderId]: { [namespacedItemId: string]: { [windowId: WindowId]: { tabId: TabId; allowGlob: string } } } }` in `AppState`, persisted at schema v9. Each `namespacedItemId` SHALL be of the form `${sourceKey}:${nativeId}` where `sourceKey` is the **per-account, per-filter** section key (`${sourceId}:${query}` for queue sections, `${sourceId}` for rss) and `nativeId` is the connector's native item id. This prevents collisions when two filters of the same instance — two instances — or two accounts on the same host produce items with the same native id.

All open/close/bind/unbind behavior, the `dropLensBindings` demote-on-delete behavior, and the `isBound` tab-created guard are unchanged except that every slot read/write uses the per-account namespaced id form. `openLensItem` receives a `namespacedItemId` from the sidebar; the SW uses it as the binding key directly.

#### Scenario: Opening a lens item from a multi-filter section uses the per-filter namespaced id

- **GIVEN** a lens referencing gitlab account `acc-1` carrying filters `['authored', 'review-requested']` and an authored item with native id `42`
- **WHEN** `openLensItem { folderId, itemId: 'acc-1:authored:42', windowId: 100, spaceId }` is dispatched
- **THEN** a tab opens at the item's URL and is bound under `lensItemBindings[folderId]['acc-1:authored:42'][100]`

#### Scenario: The same MR in two filter sections binds independently

- **GIVEN** an MR with native id `42` appearing in both the `authored` and `review-requested` sections of gitlab account `acc-1`
- **WHEN** the row is activated in each section
- **THEN** `lensItemBindings[folderId]` SHALL hold separate keys `'acc-1:authored:42'` and `'acc-1:review-requested:42'`

### Requirement: Source key derivation is pure and stable

The canonical `sourceKey(cfg: ResolvedLensSource): string` function SHALL live in
`shared/lens-labels.ts` (importable by the SW, the sidebar, and the overview page under
the layer DAG) and SHALL return `${cfg.sourceId}:${cfg.query}` when `cfg.query` is
present (queue sections) and `${cfg.sourceId}` when it is absent (rss). It SHALL be pure
and SHALL NOT perform I/O. The same derivation SHALL be used by `setLensSectionRuntime`,
`lenses.result` events, and the `lensItemBindings` namespace.

#### Scenario: Source key includes the filter for a queue section

- **WHEN** a gitlab authored section referencing account `acc-1` produces `sourceKey`
- **THEN** the key is `'acc-1:authored'` and is stable across lens name changes and the account's host/name changes

#### Scenario: An rss source key omits the query

- **WHEN** an rss section referencing account `acc-feed` produces `sourceKey`
- **THEN** the key is `'acc-feed'`

#### Scenario: Two same-host accounts derive distinct keys

- **WHEN** two `github.com` accounts `acc-work` and `acc-personal`, both `authored`, produce `sourceKey`
- **THEN** the keys are `'acc-work:authored'` and `'acc-personal:authored'` (distinct, no collision)

### Requirement: Section identity is computed identically across surfaces

A lens section's identity key (`sourceKey`) SHALL be derived by a single
canonical function shared by the service worker, the sidebar, and the overview
page. The service worker is the single writer that drains results keyed by this
identity, so the sidebar and the overview page MUST key sections by the exact
same function — for every source, including a self-hosted GitHub Enterprise or
GitLab instance, and a source whose `baseUrl` is malformed. No surface may
maintain its own variant.

The key SHALL be `` `${sourceId}` `` for a feed-style source (no filter) and
`` `${sourceId}:${query}` `` for a filtered source, where `sourceId` is the
referenced account's id. Because the key is the account id (not host-derived), a
malformed or port-bearing `baseUrl` does not affect section identity, and two
accounts on the same host key distinctly.

#### Scenario: The same source keys identically on every surface

- **WHEN** a lens references one source and the SW, the sidebar, and the overview
  page each derive that section's key
- **THEN** all three produce the same `sourceKey` string

#### Scenario: A self-hosted source on a non-default port keys consistently

- **WHEN** a source's `baseUrl` carries a non-default port (e.g. a self-hosted
  GitLab at `https://git.example.com:8443`)
- **THEN** every surface derives the same `sourceKey` (the account `sourceId`),
  so the section lines up rather than resolving as a distinct or empty section
- **AND** the section's displayed host/name (derived from the account, not the
  key) still includes the port

#### Scenario: A filtered source keys by account and query

- **WHEN** a source carries a `query` (a filter)
- **THEN** its `sourceKey` is `` `${sourceId}:${query}` ``, distinct from the
  same account under a different filter and from a different account under the
  same filter

### Requirement: Multi-source lens sections are individually collapsible

On a lens with ≥ 2 **resolved sections**, each section SHALL be individually collapsible
from its section header, independent of the other sections and of the lens-level expand/collapse.
This applies to **multi-section lenses only**; a lens with a single resolved section has no
section header and therefore no per-section collapse.

A section's collapsed state SHALL be stored as **sidebar-local, per-window, ephemeral** state on
`SidebarLocalState`:
`collapsedLensSectionsByWindow?: { [windowId: WindowId]: { [folderId: FolderId]: { [sourceKey: string]: boolean } } }`,
where `sourceKey` is the section's resolved identity (`${sourceId}:${query}` for a queue
section, `${sourceId}` for an rss feed). The state SHALL NEVER be persisted to storage and
SHALL NEVER be broadcast (it is augmented onto the store like `expandedFoldersByWindow`). The
mutator `setLensSectionCollapsed(windowId, folderId, sourceKey, collapsed): void` SHALL write it.
An **absent** entry means **expanded**: a section defaults to expanded, and after an SW restart or
sidebar reopen all sections render expanded.

Collapse state SHALL be **per-window**: the same lens's section MAY be collapsed in one window
and expanded in another, with no cross-window write.

When a section is collapsed, the lens SHALL render the section header (with its attention count)
and SHALL NOT render that section's body (result rows, ghost rows, sign-in/needs-access rows,
empty/error notes, feed reading-controls). The chevron SHALL reflect the collapsed state
(`aria-expanded={!collapsed}`). Collapsing a section SHALL NOT affect the lens-level badge,
polling, runtime, bindings, or any other section.

The disclosure SHALL respect `prefers-reduced-motion: reduce`: the chevron rotation and the
section-body entrance animation SHALL be disabled under reduced motion.

#### Scenario: Collapsing a section hides its body and keeps its header

- **GIVEN** a two-section lens `[acc-1:authored (ok, 5 items), acc-1:review-requested (ok, 3 items)]`, both expanded, in window 100
- **WHEN** the user activates the authored section header
- **THEN** `setLensSectionCollapsed(100, folderId, 'acc-1:authored', true)` is written
- **AND** the authored section header (with its count) still renders while its 5 result rows are hidden
- **AND** the review-requested section continues to render its header and 3 rows

#### Scenario: Collapse is per-window

- **GIVEN** a lens open in window 100 and window 200, with its authored section collapsed in window 100
- **WHEN** window 200 renders the same lens
- **THEN** the authored section is expanded in window 200 (no cross-window collapse)

#### Scenario: Sections default to expanded after a restart

- **GIVEN** a lens whose section was collapsed in window 100
- **WHEN** the SW restarts (the ephemeral collapse state is gone)
- **THEN** every section of the lens renders expanded

#### Scenario: A collapsed busy section still contributes to the lens badge

- **GIVEN** a two-section lens whose collapsed gitlab authored section (`acc-1:authored`) holds 4 items and whose expanded feed section holds 2 unread
- **WHEN** the lens renders
- **THEN** the lens badge reads `6` (collapse does not change the badge)

#### Scenario: Single-section lenses have no per-section collapse

- **GIVEN** a lens with exactly one resolved section
- **WHEN** the lens is expanded
- **THEN** no section header and no collapse control render, and no `collapsedLensSectionsByWindow` entry is created for it

### Requirement: Connector fetches are gated on a runtime host-permission grant

The lens engine SHALL check `hasHostPermissions(requiredOriginsForConfig(cfg))`
**per resolved section** (per `ResolvedLensSource`, i.e. per instance × filter, or a single
rss section) before dispatching a connector fetch. When any required origin for a section is not
granted, that section SHALL resolve to `'needs-access'` **without performing any network request**.
Other sections whose origins ARE granted SHALL proceed to fetch normally — partial grants are
explicitly supported. Because origins are query-independent, all filter sections of one instance
share the same grant state.

The `onPermissionsChange` behavior, refetch-on-grant, and return-to-needs-access-on-revoke rules
from the original requirement apply per resolved section. A lens whose ALL sections are in
`needs-access` has no granted sections; a lens where SOME sections are granted and some are not
shows mixed states in the sectioned render.

#### Scenario: A section on an ungranted origin shows needs-access while other sections fetch

- **GIVEN** a lens with sections `[acc-gl:authored, acc-gh:authored]` where `https://api.github.com/*` (account `acc-gh`) is not granted but `https://gitlab.com/*` (account `acc-gl`) is
- **WHEN** a poll is due
- **THEN** the `acc-gh:authored` section resolves to `needs-access` without a network request
- **AND** the `acc-gl:authored` section proceeds to fetch normally

#### Scenario: Granting an instance's origin refetches all its filter sections

- **GIVEN** a lens with a gitlab instance `acc-gl` carrying `['authored', 'review-requested']` (both sections `needs-access`) and a granted github section
- **WHEN** the user grants `https://gitlab.com/*`
- **THEN** both gitlab filter sections (`acc-gl:authored`, `acc-gl:review-requested`) refetch (they share the instance origin) and the github section is unaffected

### Requirement: The needs-access state renders a calm grant prompt

A resolved section in `needs-access` SHALL render a single muted "Lunma needs access to ⟨host⟩" row
with a "Grant access" control (composed from `Button`/`Icon` primitives) **inside that section**,
below the section header (when visible). Other sections in the same lens SHALL render normally.
Activating the grant row SHALL call `requestHostPermissions(requiredOriginsForConfig(cfg))` for that
section's `ResolvedLensSource`. The visual treatment (muted, key icon, non-`error` styling) is
unchanged.

#### Scenario: A lens with one granted and one needs-access section renders both

- **GIVEN** a lens with sections `acc-gl:authored` (ok, 5 items) and `acc-gh:authored` (needs-access)
- **WHEN** the lens is expanded
- **THEN** the `acc-gl:authored` section renders its 5 items normally
- **AND** the `acc-gh:authored` section renders one muted "Lunma needs access to api.github.com" row with a "Grant access" control

### Requirement: Page result activation reuses existing open semantics

Activating a result card on the page SHALL dispatch `openLensItem` (the same command the sidebar uses), so a tab is bound/focused per window and feed read-state (consume-on-move-on, auto-advance, mark-read) behaves identically to opening from the sidebar. The page SHALL derive each item's namespaced id (`${sourceKey}:${nativeId}`, i.e. `${sourceId}:${query}:${nativeId}` for a queue item, `${sourceId}:${nativeId}` for a feed item) using the canonical `sourceKey` derivation. The page SHALL NOT introduce a separate activation path or mutate bindings directly.

#### Scenario: Opening a queue item from the page binds a tab

- **GIVEN** the page for lens `f1` with an authored gitlab item (account `acc-1`) native id `42`
- **WHEN** the user activates that card in window 100
- **THEN** `openLensItem { folderId: 'f1', itemId: 'acc-1:authored:42', windowId: 100, spaceId }` is dispatched and the existing bind/focus behavior applies

#### Scenario: Opening a feed item from the page drains it like the sidebar

- **GIVEN** the page for a feed lens with an unread item
- **WHEN** the user activates its card and later moves on from the bound tab
- **THEN** the item is consumed exactly as it would be from the sidebar (read-state and auto-advance unchanged), and the page re-renders from the broadcast
