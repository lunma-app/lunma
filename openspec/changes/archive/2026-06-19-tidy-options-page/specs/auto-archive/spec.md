## MODIFIED Requirements

### Requirement: Recently-archived surface (sidebar chip → options subpage)

Archived tabs are a secondary, browse-occasionally surface and SHALL NOT take inline space in the sidebar. The sidebar SHALL present only a quiet **chip** on the New Tab row (`apps/extension/src/sidebar/ArchivedChip.svelte`) showing the active Space's archived count, rendered ONLY when that Space has at least one archived tab (so it is absent, zero-footprint, when there are none). Activating the chip SHALL open the options page's **"Recently archived" subpage** (deep-linked via the `#recently-archived` hash; an already-open options tab is reused and re-focused rather than duplicated).

The options subpage (`apps/extension/src/options/RecentlyArchived.svelte`) SHALL list **all** archived tabs (across every Space — the options page has no Space/window context), ordered most-recent-first by `archivedAt`, reading them from the persisted `chrome.storage.local['lunma.state'].archivedTabs` and staying live via a `chrome.storage.onChanged` watcher. Each row SHALL show the tab's favicon, title, a compact **relative archived-age** (e.g. `now` / `5m` / `2h` / `3d`, derived from `archivedAt`), and a **permanent-delete countdown** (e.g. `deletes in 27d`, derived from `archivedAt + autoArchiveRetentionDays` and updating live as the setting changes; the ≤100-entry cap may evict sooner). Each row SHALL offer TWO actions: a **restore** dispatching `bus.send({ kind: 'restoreArchivedTab', payload: { archivedAt, tabId, windowId } })` where `windowId` is the **last-focused normal window** (resolved via `chrome.windows.getLastFocused`), and a **delete** dispatching `bus.send({ kind: 'deleteArchivedTab', payload: { archivedAt, tabId } })` that discards the record without reopening it. The `(archivedAt, tabId)` composite identifies each entry uniquely; the keyed list SHALL key on that composite, since `archivedAt` alone collides for a batch sweep. The subpage SHALL also offer a **"Clear all"** trigger; activating it SHALL reveal an inline confirm row ("Delete all archived records? This cannot be undone." + Cancel / Delete) rather than immediately dispatching — only confirming SHALL dispatch `bus.send({ kind: 'clearArchivedTabs', payload: {} })`. Revealing the confirm SHALL move keyboard focus to its Delete action, and cancelling SHALL restore focus to the "Clear all" trigger (the shared options inline-reveal focus guarantee). The subpage SHALL show an empty state when there are none. It SHALL compose existing `apps/extension/src/ui` primitives — the shared `SettingsCard` card frame and `CardHeading` (whose heading renders the shared editorial serif treatment, NOT the retired uppercase micro-label, with the "Clear all" action in `CardHeading`'s `actions` slot), plus `TabRow`, `IconButton`, `Button`, `Icon`, and `Favicon` — and SHALL NOT re-roll primitives; contrast SHALL hold WCAG-AA. The row's at-rest age/countdown (`TabRow`'s `meta` slot) and its restore + delete actions (`TabRow`'s `trailing` slot) SHALL share one right-edge region and **hover-swap in place** — the muted metadata shows at rest and cross-fades to the action pair on row hover or action focus — so the actions claim no reserved gutter; the cross-fade SHALL be opacity-only and reduced-motion-safe.

#### Scenario: No archived tabs shows no chip

- **WHEN** the active Space has no archived tabs
- **THEN** no chip SHALL render on the New Tab row (the affordance is absent, taking no inline space)

#### Scenario: The chip opens the options subpage

- **WHEN** the user activates the archived chip
- **THEN** the options page SHALL open (or be re-focused) at the `#recently-archived` subpage

#### Scenario: The card heading renders the shared serif treatment

- **WHEN** the Recently-archived subpage renders
- **THEN** its heading SHALL render via the shared `CardHeading` serif treatment (`--font-display` at `--text-xl`, sentence case, with the `data-tint` identity-hue override), matching the other options cards
- **AND** it SHALL NOT render as the retired uppercase micro-label

#### Scenario: Archived tabs are listed most-recent-first with age + delete countdown

- **WHEN** the subpage lists an entry archived 2 hours ago and another archived 5 minutes ago, with the default 7-day retention
- **THEN** the rows SHALL render most-recent-first (`5m` above `2h`) and each SHALL show its age and permanent-delete countdown (e.g. `5m · deletes in 7d`)

#### Scenario: The delete countdown reflects the configured retention

- **WHEN** `autoArchiveRetentionDays` is `7`
- **THEN** a freshly-archived row SHALL show `deletes in 7d`

#### Scenario: Restore action dispatches the command into the last-focused window

- **WHEN** the user triggers restore on a row whose entry has `archivedAt: A` and `tabId: T`, and the last-focused normal window is `100`
- **THEN** the subpage SHALL call `bus.send({ kind: 'restoreArchivedTab', payload: { archivedAt: A, tabId: T, windowId: 100 } })`

#### Scenario: Per-row delete discards one record without restoring it

- **WHEN** the user activates a row's delete action for an entry with `archivedAt: A` and `tabId: T`
- **THEN** the subpage SHALL call `bus.send({ kind: 'deleteArchivedTab', payload: { archivedAt: A, tabId: T } })` (no tab is reopened)

#### Scenario: Clear all requires a second confirmation

- **WHEN** the user activates the "Clear all" trigger
- **THEN** an inline confirm row SHALL appear ("Delete all archived records? This cannot be undone." + Cancel / Delete)
- **AND** keyboard focus SHALL move to the Delete action
- **AND** `clearArchivedTabs` SHALL NOT be dispatched until the user activates the Delete button

#### Scenario: Clear all confirm dispatches clearArchivedTabs

- **WHEN** the user activates the Delete button in the inline confirm row
- **THEN** the subpage SHALL call `bus.send({ kind: 'clearArchivedTabs', payload: {} })`, after which `archivedTabs` is emptied and the chip disappears

#### Scenario: Clear all cancel restores the trigger

- **WHEN** the user activates the Cancel button in the inline confirm row
- **THEN** the confirm row SHALL be dismissed and the "Clear all" trigger SHALL be visible again
- **AND** keyboard focus SHALL return to the "Clear all" trigger
