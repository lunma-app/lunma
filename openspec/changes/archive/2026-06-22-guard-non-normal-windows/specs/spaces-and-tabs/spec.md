## ADDED Requirements

### Requirement: Space management is scoped to normal browser windows

Lunma SHALL manage Spaces (active-Space tracking, Space instances, and Chrome tab-group orchestration) only in **normal** browser windows — Chrome windows whose `type` is `'normal'`. Windows of any other type (`'popup'`, `'panel'`, `'app'`, `'devtools'`, and any future non-normal type) SHALL be excluded at the window-entry points, because `chrome.tabs.group` rejects with `"Grouping is not supported by tabs in this window."` for non-normal windows — tab groups exist only in normal windows.

The exclusion SHALL apply at the source, at both entry points:

- **Boot seed.** The boot pass that seeds `activeSpaceByWindow` for already-open windows SHALL enumerate only normal windows (e.g. `chrome.windows.getAll({ windowTypes: ['normal'] })`), so a non-normal window already open at boot is never seeded.
- **Runtime open.** The `windows.onCreated` handler SHALL ignore a window whose `type !== 'normal'` — it SHALL NOT call `onWindowOpened` and SHALL NOT mark the drain dirty for that window.

As a consequence, `activeSpaceByWindow` and `spaceInstancesByWindow` SHALL NOT gain entries keyed by a non-normal window. Because the group-orchestration paths (`groupNewTab`, `groupHomeTab`, `orchestrateActivation`) act only on a window that has an active Space / instance, they SHALL naturally no-op for non-normal windows, so `chrome.tabs.group` SHALL NOT be invoked for a window that would reject it, and no `ensureGroupForSpace failed` error SHALL be logged for the non-normal-window case.

The window-type predicate SHALL be a single source of truth in the background layer (a shared `isManagedWindow` predicate / `MANAGED_WINDOW_TYPES` constant), not a literal duplicated across call sites.

#### Scenario: A popup window opened at runtime is not adopted

- **GIVEN** Lunma has activated Space "Work" so `lastActivatedSpaceId === "work"`
- **WHEN** Chrome fires `windows.onCreated` for a window whose `type` is `'popup'`
- **THEN** `activeSpaceByWindow` SHALL NOT gain an entry for that window
- **AND** `onWindowOpened` SHALL NOT be called and the drain SHALL NOT be marked dirty for that window

#### Scenario: A non-normal window already open at boot is not seeded

- **GIVEN** at service-worker boot a `'popup'` window and a `'normal'` window are both already open, neither having an `activeSpaceByWindow` entry
- **WHEN** the boot window-seed pass runs
- **THEN** the boot pass SHALL enumerate only normal windows, so only the normal window SHALL be seeded into `activeSpaceByWindow`
- **AND** no `activeSpaceByWindow` entry SHALL exist for the popup window

#### Scenario: No grouping is attempted in a non-normal window

- **GIVEN** a `'popup'` window with no `activeSpaceByWindow` entry
- **WHEN** a tab is created in that popup window (`tabs.onCreated`)
- **THEN** `groupNewTab` / `groupHomeTab` SHALL no-op (the window has no active Space)
- **AND** `chrome.tabs.group` SHALL NOT be invoked for that window, so no `"Grouping is not supported by tabs in this window."` rejection or `ensureGroupForSpace failed` error SHALL occur

#### Scenario: A normal window is seeded and managed as before

- **WHEN** a `'normal'` Chrome window is opened (or is already open at boot)
- **THEN** it SHALL be seeded into `activeSpaceByWindow` and managed exactly as before this change (no behavior change for normal windows)

## MODIFIED Requirements

### Requirement: New windows default to the last-activated Space

The store SHALL maintain a `lastActivatedSpaceId: string | null` that updates whenever any window activates a Space. When a new **normal** Chrome window is created (window `type === 'normal'`; see Requirement: Space management is scoped to normal browser windows) and no Space has yet been chosen for it, the window SHALL be initialized with `activeSpaceByWindow[newWindowId] = lastActivatedSpaceId` (or `null` if no Space has ever been activated). A non-normal window (popup, app, devtools, panel) SHALL NOT be initialized in `activeSpaceByWindow`.

#### Scenario: Opening a new window inherits the most recent Space

- **WHEN** the user has just activated Space "Work" in window 100 and then opens a normal window 200
- **THEN** `activeSpaceByWindow[200] === "work"`

#### Scenario: First-ever window with no Spaces

- **WHEN** Lunma starts with an empty Spaces list and a normal window opens
- **THEN** `activeSpaceByWindow[newWindowId] === null`

#### Scenario: Opening a popup window gets no Space

- **WHEN** a window whose `type` is `'popup'` (or any non-normal type) is created
- **THEN** `activeSpaceByWindow` SHALL NOT gain an entry for it, regardless of `lastActivatedSpaceId`
