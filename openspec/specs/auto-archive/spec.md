# auto-archive Specification

## Purpose

Idle temporary tabs are archived automatically so a workspace stays lean
without the user closing tabs by hand. A fixed one-minute `chrome.alarms`
sweep enqueues a single `autoArchiveSweep` command through the coordinator
queue; the handler closes stale, non-excluded temporary tabs and records each
as an `ArchivedTab`, bounded by a fixed FIFO cap and a user-tunable retention
TTL. Archiving is configurable globally (`autoArchiveEnabled` /
`autoArchiveIdleMinutes` / `autoArchiveRetentionDays`) and per-Space (inherit /
off / custom). Archived tabs are restorable and individually deletable from a
quiet sidebar chip that opens an options "Recently archived" subpage.
## Requirements
### Requirement: Alarm-driven sweep trigger

The auto-archive capability SHALL be driven by a `chrome.alarms` alarm named `lunma/auto-archive-sweep`. The alarm SHALL be registered — via `registerAutoArchiveAlarm(settings)` — only when `autoArchiveEnabled` is `true`; when `autoArchiveEnabled` is `false`, no alarm SHALL exist and `unregisterAutoArchiveAlarm()` SHALL call `chrome.alarms.clear('lunma/auto-archive-sweep')`.

The alarm period SHALL be derived from the user-tunable idle threshold: `max(1, Math.floor(autoArchiveIdleMinutes / 2))` minutes. This replaces the former fixed 1-minute period. The period SHALL be recomputed whenever `autoArchiveIdleMinutes` or `autoArchiveEnabled` changes (settings-change handler re-registers the alarm with the new period).

When the alarm fires, the alarm handler SHALL call `coordinator.enqueue({ source: 'alarm', kind: 'autoArchiveSweep' })` exactly once per fire. The enabled check is now structural (no alarm exists when disabled) rather than a runtime guard, but the handler SHALL still verify `autoArchiveEnabled` as defence-in-depth and return without enqueueing if `false`.

The alarm handler SHALL NOT call `chrome.tabs.remove`, SHALL NOT write to `LunmaStore`, and SHALL NOT perform mutation work directly — the entire sweep happens inside the `autoArchiveSweep` command handler.

#### Scenario: Alarm registered only when enabled

- **WHEN** the SW starts and `autoArchiveEnabled` is `true`
- **THEN** `chrome.alarms.create` SHALL be called with name `'lunma/auto-archive-sweep'` and `periodInMinutes: max(1, floor(idleMinutes / 2))`

#### Scenario: No alarm registered when disabled

- **WHEN** the SW starts and `autoArchiveEnabled` is `false`
- **THEN** `chrome.alarms.create` SHALL NOT be called for `'lunma/auto-archive-sweep'`

#### Scenario: Alarm cleared on disable

- **WHEN** `autoArchiveEnabled` changes from `true` to `false`
- **THEN** `chrome.alarms.clear('lunma/auto-archive-sweep')` SHALL be called
- **AND** the alarm SHALL NOT fire again until re-enabled

#### Scenario: Alarm re-registered with new period on threshold change

- **WHEN** `autoArchiveIdleMinutes` changes (and `autoArchiveEnabled` is `true`)
- **THEN** `chrome.alarms.clear` SHALL be called followed by `chrome.alarms.create` with the recomputed period
- **AND** `periodInMinutes` SHALL equal `max(1, floor(newIdleMinutes / 2))`

#### Scenario: Handler skips enqueue when disabled (defence-in-depth)

- **WHEN** the alarm fires and `autoArchiveEnabled` is `false`
- **THEN** the handler SHALL NOT call `coordinator.enqueue`

#### Scenario: Enabled setting enqueues one sweep

- **WHEN** the alarm fires and `autoArchiveEnabled` is `true`
- **THEN** the handler SHALL call `coordinator.enqueue` with an `autoArchiveSweep` command exactly once

### Requirement: Sweep computes candidates, removes, records, and prunes in one tick

The coordinator command `autoArchiveSweep` SHALL be handled within a single coordinator tick. The handler SHALL, in order:

1. Read the global settings (`autoArchiveEnabled`, `autoArchiveIdleMinutes`) from `chrome.storage.sync` (the idle threshold clamped to a floor of `1`).
2. Read a snapshot of `LunmaStore.state` (the temporary-tab membership per Space instance, each Space's optional `autoArchive` override, `tabLastActivity`, `tabBindings`).
3. Query `chrome.tabs.query({})` (or equivalent) to obtain each open tab's `pinned` flag and `active` flag, building the active-tab set and pinned-tab set.
4. Compute the candidate set via the pure `computeArchiveCandidates(...)` function (see "Candidate exclusions").
5. For each candidate that is still a LIVE Chrome tab (present in the `chrome.tabs.query` result), call `chrome.tabs.remove(tabId)` and append an `ArchivedTab` record to `state.archivedTabs` via `store.appendArchivedTab(record)`. A candidate whose tab id Chrome no longer reports — a stale `tempTabIds` entry (e.g. a tab closed while the SW was asleep, not yet reconciled) — SHALL be skipped (no `chrome.tabs.remove`, no record); there is nothing to close or archive.
6. Prune `state.archivedTabs` to retention bounds via `store.pruneArchivedTabs(now)` (see "Retention bounds").

The handler SHALL NOT set transient marker state and SHALL NOT use out-of-band signalling to subsequent `tabRemoved` handlers. The `chrome.tabs.onRemoved` events triggered by the sweep's removals SHALL enqueue as separate `tabs.onRemoved` coordinator commands and SHALL drain after the sweep tick; those handlers SHALL NOT write to `archivedTabs`.

#### Scenario: Sweep removes a stale temporary tab and records it

- **WHEN** the sweep runs and a temporary, non-excluded tab's `tabLastActivity[id]` is older than the threshold
- **THEN** the handler SHALL call `chrome.tabs.remove` for that tab id
- **AND** SHALL append an `ArchivedTab` for it to `state.archivedTabs`

#### Scenario: Sweep produces zero candidates when all tabs are recent

- **WHEN** every `tabLastActivity` entry is within `autoArchiveIdleMinutes` of now
- **THEN** no `chrome.tabs.remove` SHALL be called
- **AND** `archivedTabs` content SHALL be unchanged except for the retention prune step, which SHALL still run

#### Scenario: Tab removals from the sweep do not double-record

- **WHEN** the sweep removes a tab and the resulting `tabs.onRemoved` command later drains
- **THEN** the `tabs.onRemoved` handler SHALL NOT append to `archivedTabs`

#### Scenario: A stale candidate (tab no longer live) is skipped

- **WHEN** a candidate's tab id is in the store's `tempTabIds` but Chrome no longer reports it (a stale entry)
- **THEN** the sweep SHALL NOT call `chrome.tabs.remove` for it and SHALL NOT append an `ArchivedTab` for it (no error is raised)

### Requirement: Candidate exclusions

A tab SHALL be excluded from auto-archive candidacy if ANY of these hold:

- The tab is pinned in Chrome (`pinned === true`).
- The tab is the active tab of any window at sweep time.
- The tab id is a Lunma-bound live tab — it appears as a value in `state.tabBindings`. The bound-tab set SHALL be built as `new Set(Object.values(tabBindings).flatMap((binding) => Object.values(binding)))` (the per-window-tab-bindings map, ADR 0009 — superseding the pre-V9 flat `bookmarkBindings` the original ADR named).
- The tab's owning Space resolves to auto-archive **off** (see "Per-Space override resolution") — either the global toggle is off and the Space inherits, or the Space's override is `{ mode: 'off' }`.

A tab with no `tabLastActivity` entry SHALL NOT be archived (it was just opened and carries no staleness signal). A remaining candidate SHALL be archived only when `(now - tabLastActivity[id]) >= effectiveThresholdMs` where `effectiveThresholdMs` is **its owning Space's** resolved threshold (not necessarily the global one). Only temporary tabs (those tracked in a Space instance's `tempTabIds`, never saved tabs) are eligible. Exclusion SHALL be checked via O(1) Set membership against pre-computed sets.

`tabLastActivity[id]` SHALL be refreshed BOTH when the tab navigates (a URL change, via `tabs.onUpdated`) AND when the tab LOSES focus — transitions from active to inactive in its window (via `tabs.onActivated`, in `LunmaStore.setActiveTab`). So the idle clock measures time since the user last engaged with the tab, not merely time since its last navigation: a tab read for a while without navigating SHALL NOT be archived the moment the user switches away from it. A tab that has never navigated (and so has no entry) SHALL NOT be given one on focus-loss, preserving the "no entry ⇒ never archived" rule above. Window-level focus changes (`chrome.windows.onFocusChanged`) are OUT OF SCOPE for v1 — only tab activation within a window refreshes activity.

The candidate computation SHALL be a pure, separately-testable function `computeArchiveCandidates(snapshot, { activeTabIds, pinnedTabIds, now, effectiveForSpace })`, where `effectiveForSpace(spaceId) → { enabled: boolean; thresholdMs: number }` resolves a Space's effective config. The sweep handler SHALL build `effectiveForSpace` from `resolveSpaceAutoArchive(space, settings)` (see "Per-Space override resolution"), converting its `idleMinutes` to `thresholdMs` via `* 60_000`.

#### Scenario: Pinned tab is never archived

- **WHEN** a tab has `pinned === true` and a stale `tabLastActivity`
- **THEN** it SHALL NOT be a candidate and `chrome.tabs.remove` SHALL NOT be called for it

#### Scenario: Active tab is never archived

- **WHEN** a tab is the active tab of its window and has a stale `tabLastActivity`
- **THEN** it SHALL NOT be a candidate

#### Scenario: Lunma-bound tab is never archived

- **WHEN** a tab id appears as a value in `state.tabBindings` (bound to a saved tab in some window) and has a stale `tabLastActivity`
- **THEN** it SHALL NOT be a candidate
- **AND** the binding SHALL remain intact

#### Scenario: Tab in a Space set to off is never archived

- **WHEN** a temporary tab's owning Space has `autoArchive: { mode: 'off' }` and the tab has a stale `tabLastActivity`
- **THEN** it SHALL NOT be a candidate, regardless of the global `autoArchiveEnabled` value

### Requirement: Retention bounds on archivedTabs

`state.archivedTabs` SHALL be bounded by BOTH an entry count and a TTL, enforced by `store.pruneArchivedTabs(now, ttlMs)` at the end of every sweep (even when the candidate set was empty):

- **Entry count**: AT MOST `ARCHIVE_MAX_ENTRIES` (100) — FIXED. Beyond that, the oldest entries by `archivedAt` SHALL be discarded (FIFO).
- **TTL**: entries older than `ttlMs` from `archivedAt` SHALL be discarded. `ttlMs` is the **user-tunable** retention window `autoArchiveRetentionDays × 24 × 60 × 60 × 1000` (default 7 days), computed by the sweep handler from settings and passed to `pruneArchivedTabs`; `store.pruneArchivedTabs` defaults `ttlMs` to `ARCHIVE_TTL_MS` (the store-level 30-day fallback) when omitted. (This supersedes ADR 0002's "fixed 30-day TTL, no adjustable retention" — see ADR 0011; the entry-count cap remains fixed.)

An entry SHALL be retained only if it is both within the 100 most recent AND younger than the configured retention window — whichever bound activates first wins.

#### Scenario: 101st entry evicts the oldest

- **WHEN** `archivedTabs` holds 100 entries and a sweep archives one more
- **THEN** after pruning `archivedTabs` SHALL hold exactly 100 entries
- **AND** the entry with the lowest `archivedAt` SHALL have been discarded

#### Scenario: Entry older than the retention window is pruned

- **WHEN** `archivedTabs` contains an entry whose `archivedAt` is more than `autoArchiveRetentionDays` (default 7) days before now
- **AND** any sweep runs (even one producing zero new candidates)
- **THEN** that stale entry SHALL be removed

#### Scenario: The retention window is user-tunable

- **WHEN** `autoArchiveRetentionDays` is set to `7` and a sweep runs
- **THEN** an entry archived more than 7 days ago SHALL be pruned (even though it is younger than the 30-day default)

### Requirement: Archived record content

Each entry the sweep appends SHALL be an `ArchivedTab` populated from the closed tab: `tabId` (its historical Chrome tab id), `url` (the tab's URL at archive time), `title` (its title at archive time), `spaceId` (the Space the temporary tab belonged to), and `archivedAt` (the sweep's `now` in epoch milliseconds). No additional fields SHALL be written — page snapshots, favicon URLs, scroll, and form state are out of scope ([docs/01-vision.md](docs/01-vision.md)).

#### Scenario: Archived entry carries url, title, spaceId, and archivedAt

- **WHEN** the sweep archives a temporary tab of Space `work` pointing at `https://example.com/`
- **THEN** the appended `ArchivedTab` SHALL have `url: 'https://example.com/'`, `spaceId: 'work'`, a `title`, the tab's id as `tabId`, and `archivedAt` equal to the sweep's now-timestamp

### Requirement: Settings keys and defaults

The auto-archive capability SHALL own three settings persisted to `chrome.storage.sync` and declared in the `SETTINGS` registry (`apps/extension/src/shared/settings.ts`) under an `Auto-archive` group:

- `autoArchiveEnabled` — a `toggle` (boolean) declaration, default `true`.
- `autoArchiveIdleMinutes` — a `number` declaration, default `720` (12 hours). A positive integer; the sweep handler SHALL treat values `< 1` as `1` (a one-minute floor); no upper bound. (The default is in minutes; 720 = 12h.)
- `autoArchiveRetentionDays` — a `number` declaration, default `7`, `min: 1`. The retention TTL in days after which an archived tab is permanently deleted (the sweep converts it to `ttlMs` for `pruneArchivedTabs`); a positive integer floored at 1; no upper bound. (Supersedes ADR 0002's fixed-30-day retention.)

These declarations SHALL be the authoritative source of these keys' names, types, and defaults. Any future change to a name, type, or default MUST land via a `specs/auto-archive/spec.md` delta. The `settings` capability provides the generic `toggle`/`number` rendering; it SHALL NOT redefine these keys.

#### Scenario: Defaults apply on first install

- **WHEN** settings are read with no stored auto-archive values
- **THEN** `autoArchiveEnabled` SHALL be `true`, `autoArchiveIdleMinutes` SHALL be `720` (12h), and `autoArchiveRetentionDays` SHALL be `7`
- **AND** the alarm SHALL be registered regardless

#### Scenario: User changes idle threshold

- **WHEN** the user sets `autoArchiveIdleMinutes` to `15` and the next sweep runs
- **THEN** the sweep SHALL use 15 minutes as the staleness threshold

#### Scenario: Sub-one-minute threshold is floored

- **WHEN** the stored `autoArchiveIdleMinutes` is `0` and a sweep runs
- **THEN** the sweep SHALL treat the threshold as `1` minute

### Requirement: Per-Space override resolution

A Space MAY carry an optional `autoArchive` override (`SpaceAutoArchive = { mode: 'off' } | { mode: 'custom'; idleMinutes: number }`, owned by the `spaces-and-tabs` / `storage-and-migrations` capabilities). The global `autoArchiveEnabled` toggle is the **master switch**: when it is off, no sweep runs (per "Alarm-driven sweep trigger") and nothing is archived regardless of per-Space overrides. When it is on, the sweep SHALL resolve each Space's **effective** config via a pure function `resolveSpaceAutoArchive(space, settings) → { enabled: boolean; idleMinutes: number }`:

- **Master off** (`settings.autoArchiveEnabled === false`) → `{ enabled: false, idleMinutes: settings.autoArchiveIdleMinutes }` (defensive; the sweep does not run in this state).
- **Absent override** (master on) → `{ enabled: true, idleMinutes: settings.autoArchiveIdleMinutes }`.
- **`{ mode: 'off' }`** (master on) → `{ enabled: false, idleMinutes: settings.autoArchiveIdleMinutes }` — this Space is never archived even though the global toggle is on.
- **`{ mode: 'custom'; idleMinutes }`** (master on) → `{ enabled: true, idleMinutes }` — this Space is archived at its own threshold.

The resolved `idleMinutes` SHALL be clamped to a floor of `1`. A Space whose effective `enabled` is `false` SHALL contribute no candidates.

#### Scenario: Absent override inherits the global threshold

- **WHEN** `autoArchiveEnabled` is on and a Space has no `autoArchive` override
- **THEN** `resolveSpaceAutoArchive(space, settings)` SHALL return `{ enabled: true, idleMinutes: settings.autoArchiveIdleMinutes }`

#### Scenario: Off override disables archiving for one Space while others archive

- **WHEN** `autoArchiveEnabled` is on, Space A has `autoArchive: { mode: 'off' }`, and Space B has no override
- **THEN** Space A's temporary tabs SHALL NOT be archived
- **AND** Space B's stale temporary tabs SHALL be archived at the global threshold

#### Scenario: Custom override uses the Space's own threshold

- **WHEN** `autoArchiveEnabled` is on and a Space has `autoArchive: { mode: 'custom'; idleMinutes: 15 }`
- **THEN** that Space's temporary tabs idle beyond 15 minutes SHALL be archived
- **AND** the global `autoArchiveIdleMinutes` SHALL NOT apply to that Space

#### Scenario: Master switch off skips all archiving

- **WHEN** `autoArchiveEnabled` is off
- **THEN** no sweep runs and no Space's tabs are archived, regardless of any `{ mode: 'custom' }` overrides

### Requirement: Coordinator queue is the only mutex

Concurrency between sweeps SHALL be handled solely by the coordinator queue. The auto-archive capability SHALL NOT introduce a separate mutex, lock, or in-flight flag. The `autoArchiveSweep` EventPolicy entry SHALL define NO coalescing, so two sweeps enqueued in close succession run sequentially; the second sees post-first-sweep state and finds (typically) zero candidates. The sweep SHALL NOT re-enqueue itself or any other command.

#### Scenario: Two alarms during a slow sweep run sequentially

- **WHEN** the alarm fires twice in close succession while a sweep is draining
- **THEN** two `autoArchiveSweep` commands SHALL be enqueued and SHALL run strictly one after the other (not coalesced, not interleaved)
- **AND** the second SHALL observe the first sweep's archived state

### Requirement: Restore re-opens an archived tab and removes its record

A `restoreArchivedTab` command (owned by the `typed-message-bus` capability, payload `{ archivedAt: number; tabId: number; windowId: WindowId }`) SHALL, in its coordinator handler:

1. Locate the `state.archivedTabs` entry whose composite `(archivedAt, tabId)` matches the payload. (The pair is unique — `archivedAt` alone is not, since one sweep stamps every tab it archives with the same `now`, but a tab is archived at most once per sweep and sweeps carry distinct timestamps.) If none, the handler SHALL throw (the ack carries the error).
2. Open that entry's `url` as a new tab in `windowId` via `chrome.tabs.create({ url, windowId })` — adopted into the window's active Space through the existing `tabs.onCreated` path, exactly like the `openUrl` command. The handler SHALL NOT directly mutate `tempTabIds` or `liveTabsById`.
3. Remove the entry from `state.archivedTabs` via `store.removeArchivedTab(archivedAt, tabId)`.

The drain SHALL emit one persist and one `state-broadcast` so the restored tab leaves the "Recently archived" list everywhere.

#### Scenario: Restore opens the URL and removes the entry

- **WHEN** the handler processes `restoreArchivedTab` with an `(archivedAt, tabId)` matching an entry for `https://example.com/` and `windowId: 100`
- **THEN** it SHALL call `chrome.tabs.create({ url: 'https://example.com/', windowId: 100 })`
- **AND** SHALL call `store.removeArchivedTab(archivedAt, tabId)` so the entry leaves `archivedTabs`
- **AND** SHALL NOT directly mutate `tempTabIds` or `liveTabsById`

#### Scenario: Restore of an unknown entry throws

- **WHEN** the handler processes `restoreArchivedTab` whose `(archivedAt, tabId)` matches no `archivedTabs` entry
- **THEN** the handler SHALL throw and the ack SHALL carry an error

### Requirement: Recently-archived surface (sidebar chip → options subpage)

Archived tabs are a secondary, browse-occasionally surface and SHALL NOT take inline space in the sidebar. The sidebar SHALL present only a quiet **chip** on the New Tab row (`apps/extension/src/sidebar/ArchivedChip.svelte`) showing the active Space's archived count, rendered ONLY when that Space has at least one archived tab (so it is absent, zero-footprint, when there are none). Activating the chip SHALL open the options page's **"Recently archived" subpage** (deep-linked via the `#recently-archived` hash; an already-open options tab is reused and re-focused rather than duplicated).

The options subpage (`apps/extension/src/options/RecentlyArchived.svelte`) SHALL list **all** archived tabs (across every Space — the options page has no Space/window context), ordered most-recent-first by `archivedAt`, reading them from the persisted `chrome.storage.local['lunma.state'].archivedTabs` and staying live via a `chrome.storage.onChanged` watcher. Each row SHALL show the tab's favicon, title, a compact **relative archived-age** (e.g. `now` / `5m` / `2h` / `3d`, derived from `archivedAt`), and a **permanent-delete countdown** (e.g. `deletes in 27d`, derived from `archivedAt + autoArchiveRetentionDays` and updating live as the setting changes; the ≤100-entry cap may evict sooner). Each row SHALL offer TWO actions: a **restore** dispatching `bus.send({ kind: 'restoreArchivedTab', payload: { archivedAt, tabId, windowId } })` where `windowId` is the **last-focused normal window** (resolved via `chrome.windows.getLastFocused`), and a **delete** dispatching `bus.send({ kind: 'deleteArchivedTab', payload: { archivedAt, tabId } })` that discards the record without reopening it. The `(archivedAt, tabId)` composite identifies each entry uniquely; the keyed list SHALL key on that composite, since `archivedAt` alone collides for a batch sweep. The subpage SHALL also offer a **"Clear all"** trigger; activating it SHALL reveal an inline confirm row ("Delete all archived records? This cannot be undone." + Cancel / Delete) rather than immediately dispatching — only confirming SHALL dispatch `bus.send({ kind: 'clearArchivedTabs', payload: {} })`. The subpage SHALL show an empty state when there are none. It SHALL compose existing `apps/extension/src/ui` primitives (`Surface`, `TabRow`, `IconButton`, `Button`, `Icon`, `Favicon`) and SHALL NOT re-roll primitives; contrast SHALL hold WCAG-AA. The row's at-rest age/countdown (`TabRow`'s `meta` slot) and its restore + delete actions (`TabRow`'s `trailing` slot) SHALL share one right-edge region and **hover-swap in place** — the muted metadata shows at rest and cross-fades to the action pair on row hover or action focus — so the actions claim no reserved gutter; the cross-fade SHALL be opacity-only and reduced-motion-safe.

#### Scenario: No archived tabs shows no chip

- **WHEN** the active Space has no archived tabs
- **THEN** no chip SHALL render on the New Tab row (the affordance is absent, taking no inline space)

#### Scenario: The chip opens the options subpage

- **WHEN** the user activates the archived chip
- **THEN** the options page SHALL open (or be re-focused) at the `#recently-archived` subpage

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
- **AND** `clearArchivedTabs` SHALL NOT be dispatched until the user activates the Delete button

#### Scenario: Clear all confirm dispatches clearArchivedTabs

- **WHEN** the user activates the Delete button in the inline confirm row
- **THEN** the subpage SHALL call `bus.send({ kind: 'clearArchivedTabs', payload: {} })`, after which `archivedTabs` is emptied and the chip disappears

#### Scenario: Clear all cancel restores the trigger

- **WHEN** the user activates the Cancel button in the inline confirm row
- **THEN** the confirm row SHALL be dismissed and the "Clear all" trigger SHALL be visible again

