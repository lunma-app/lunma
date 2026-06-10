# Architecture

The structural blueprint for Lunma. Three principles drive the design:

1. **State changes are serial.** A single store class + serial mutation queue + event coordinator means `spaces[]` is never mutated by two paths concurrently.
2. **Layers are honest about boundaries.** Chrome API code, business logic, storage, and DOM live in distinct modules with one-way dependencies.
3. **Storage is typed and versioned.** Every read goes through a Zod schema. Migrations run on SW boot.

## Project layout

The repo is a **pnpm workspace**: the extension, the marketing site, and one
shared CSS-only design-token package. The extension's internal layer DAG is
unchanged in shape — only its path prefix (`apps/extension/src/…`) and its token
source (`@lunma/tokens` instead of a local `tokens.css`).

```
lunma/                              # pnpm workspace root (private)
├─ apps/
│  ├─ extension/                    # the Chrome MV3 extension — @lunma/extension
│  │  ├─ src/
│  │  │  ├─ shared/                 # cross-surface: types · schemas (+migrations) · store.svelte.ts · messages · settings · logger
│  │  │  │  └─ chrome/              # thin typed wrappers over chrome.* APIs
│  │  │  ├─ ui/                     # cross-surface primitives (build primitives, compose features)
│  │  │  │  ├─ Button.svelte        # …+ Icon · Tooltip · Stack · Kbd · SegmentedControl · TabRow · TabRowMenu
│  │  │  │  └─ favicon.ts · index.ts   # design TOKENS now come from @lunma/tokens (see packages/)
│  │  │  ├─ background/             # SW: index · coordinator (+ handlers/ slices · group-orchestrator · boundary-controller) · bus-adapter · *-handler · seed-* · (planned) auto-archive
│  │  │  ├─ sidebar/                # flat — feature components compose ui/ primitives
│  │  │  │  ├─ App.svelte · main.ts · PinnedTabs.svelte · TempTabs.svelte · SpaceSwitcher.svelte
│  │  │  │  └─ drag.svelte.ts       # custom pointer-drag controller (ADR 0006)
│  │  │  ├─ launcher/               # overlay (content script) + newtab (chrome_url_overrides) + shared engine
│  │  │  │  ├─ overlay.ts · overlay.css
│  │  │  │  ├─ newtab/              # full Svelte page — empty-Space "home" (idle) + inline launcher search
│  │  │  │  └─ shared/              # SearchEngine, scoring, providers, result/query types
│  │  │  ├─ content/               # second declarative content script (tab-boundary.ts)
│  │  │  └─ options/               # Options.svelte · main.ts   (+ planned onboarding/ — Phase 5)
│  │  ├─ public/manifest.json       # MV3 manifest — crxjs derives build entries from it
│  │  ├─ e2e/                       # Playwright specs + fixtures (playwright.config.ts in apps/extension)
│  │  │                             # unit tests are co-located: src/**/*.test.ts (no top-level tests/)
│  │  ├─ vite.config.ts · svelte.config.js · tsconfig.json · stylelint.config.js · vitest.setup.ts
│  │  └─ package.json               # @lunma/extension (build/test/lint/verify scripts)
│  └─ site/                         # the marketing site — @lunma/site (SvelteKit + adapter-static → lunma.app)
│     ├─ src/
│     │  ├─ routes/                 # +layout.svelte (imports @lunma/tokens) · +layout.ts (prerender) · +page.svelte
│     │  ├─ lib/                    # Hero · InstallCta · Nav · Footer · … (compose @lunma/tokens)
│     │  ├─ lib/contrast.test.ts    # automated WCAG-AA contrast gate over the site's pairings
│     │  └─ app.html · app.css · app.d.ts
│     ├─ static/                    # favicon + fonts (copied from @lunma/tokens at build)
│     ├─ svelte.config.js · vite.config.ts · tsconfig.json
│     └─ package.json               # @lunma/site (build/check/verify scripts)
├─ packages/
│  └─ tokens/                       # @lunma/tokens — CSS-ONLY shared design language (no JS/TS, outside the import DAG)
│     ├─ tokens.css                 # design-token custom properties (OKLCH, parameterised by --base-hue)
│     ├─ fonts.css                  # @font-face for the two brand woff2 (the single source of truth)
│     ├─ recipes.css                # aurora / glass / glow recipes (pure CSS reading the tokens)
│     ├─ fonts/                     # MonaSans-Variable.woff2 · InstrumentSerif-Regular.woff2
│     └─ package.json               # exports: ./tokens.css · ./fonts.css · ./recipes.css
├─ openspec/                        # config.yaml · specs/ (one per capability) · changes/ (in-flight)
├─ docs/                            # this folder
├─ tooling/                       # build and release tooling
├─ pnpm-workspace.yaml              # apps/* · packages/*
├─ biome.json                       # workspace-wide: the layer DAG + cross-app import guards
├─ package.json                     # workspace root (private; `pnpm -r verify` fans out to every package)
└─ README.md
```

## Why the overlay stays vanilla

> **Status:** the launcher **overlay** is now **wired** (`launcher-v1`). It ships
> a `content_scripts` entry injecting `apps/extension/src/launcher/overlay.ts` at
> `document_start` on `<all_urls>`, the `bookmarks` + `history` permissions, the
> `<all_urls>` host permission, and a `toggle-launcher` command (`Alt+L`). The
> broad host access lands *with* the feature, not before (see
> [ADR 0001](adr/0001-launcher-v1-shape.md)); the increase triggers Chrome's
> re-enable-on-update prompt (called out in the change's manual verification).
>
> The **new-tab page** (`launcher/newtab/`) was wired earlier by
> `lunma-new-tab-home` (`chrome_url_overrides.newtab`); `launcher-v1` turned its
> inert pill into the **live inline launcher**. The empty-Space identity home is
> now the launcher's idle state.

The overlay content script (`launcher/overlay.ts`) runs on **every page load on `<all_urls>`** at `document_start` and stays dormant until `Alt+L`. Byte budget is tight — even Svelte 5's small runtime is overhead it shouldn't pay while dormant — so it is **plain TS + a closed shadow DOM + a constructable stylesheet** derived from `@lunma/tokens/tokens.css`, and it speaks the wire protocols directly (`chrome.runtime.sendMessage`) rather than importing the `bus`/`messages` modules (which would pull in the logger). The shipped content-script chunk is ~3KB gzipped, well under the 15KB budget. Declarative content scripts inject only into tabs opened/reloaded after the extension starts, so the SW's `toggle-launcher` handler **injects the overlay on demand** (`chrome.scripting.executeScript`, behind the `scripting` permission) when the active tab has no receiver — `Alt+L` then works on already-open tabs without a reload; pages Chrome forbids injecting (`chrome://`, Web Store, extension pages) stay no-ops. That on-demand injection only fires on the command path, though, and Chrome routinely leaves the command unbound — so the SW ALSO **backfills the overlay into every already-open `http(s)` tab on `chrome.runtime.onInstalled`** (install/update/reload), registered synchronously in the first turn (`launcher-backfill-open-tabs`, `apps/extension/src/background/overlay-injection.ts` — `backfillOverlayIntoOpenTabs()` reusing `injectOverlay(tabId)`). This makes the page-level `Alt+L` keydown fallback live on existing tabs immediately, with per-tab failure isolation and idempotent re-injection (the overlay's `__lunmaLauncherInstalled` guard). The open path also carries the active Space's colour so the immersive overlay glows in it (`newtab-launcher-vivid-refresh`): the SW reads the focused window's active Space and attaches additive, optional `spaceHue` / `spaceChroma` (OKLCH, via `colourToHue` / `colourToChroma`) to the **typed `LauncherToggleMessage`** (`lunma/toggle-launcher`) and to the `lunma/current-window` response (the keydown path). Both fields are omitted when there is no active Space or it is neutral (`gray`), so the overlay falls back to its default accent — an older SW (sending neither) and a newer overlay interoperate with no version gate.

A **second declarative content script** (`content/tab-boundary.ts`, `pinned-tab-domain-boundary`, ADR 0008) follows the same vanilla discipline: it runs on `<all_urls>` at `document_start` and stays **dormant** (an install guard + one `runtime.onMessage` listener) until the SW pushes it an allow-set for a bound, enforced pinned tab (`lunma/boundary-config`). While armed it intercepts only same-tab, unmodified, `http(s)` link clicks to off-allow hosts — diverting them to the SW (`lunma/boundary-open-elsewhere` → the existing `openUrl`) so the pinned tab stays put. It imports only the pure `url-boundary` matcher (no Svelte, no logger), so the chunk stays tiny. Like the overlay it can't be reached by Chrome's post-load declarative injection on a pre-existing tab, so the SW injects it on demand via `background/boundary-injection.ts` (selected from the manifest **by filename**, not array index) when a saved tab becomes bound and enforced.

The new-tab page (`launcher/newtab/`) is its own page and a full Svelte app. It is a **read-only state consumer** for its idle home, exactly like the sidebar: `main.ts` resolves its window (`chrome.windows.getCurrent`) and seeds from a `state-request` snapshot (with boot-retry backoff), then `NewTab.svelte` stays live by subscribing to `state-broadcast`. For search it queries the **launcher-suggestions channel** and dispatches result actions over the bus (`focusTab` / `focusSavedTab` / `openSavedTab` / `openUrl`). Both surfaces share the search engine via `apps/extension/src/launcher/shared/`.

**Home-tab orchestration.** A Chrome group cannot be empty and a window cannot be empty, so an empty Space always forces a tab into existence. With Lunma owning the new-tab page, that forced tab is the Space's **home**. The coordinator recognises a home tab by its live URL (`isNewTabUrl(url)` in `apps/extension/src/shared/new-tab.ts`, matching `chrome://newtab/` and the extension's resolved newtab URL) and treats it as a *transient* property of the live tab (never persisted): a home tab is grouped into the active Space (so the window shows it) but is **never** added to `tempTabIds` — so it is unlisted in the sidebar's Temporary list. On `tabs.onUpdated` to a non-newtab URL it ceases to be a home tab and is adopted as an ordinary temporary tab. Empty-Space activation **reuses** the window's focused tab when it is already a home tab (else opens one), and leaving a Space whose only window tab is its home **closes** that home tab (the instance returns to `groupId === -1`) — so visiting empty Spaces never accumulates blank tabs, and **Clear** lands cleanly on the home with no stray tab re-added to the list.

## The store pattern (thin store)

```ts
// apps/extension/src/shared/store.svelte.ts
import type { AppState, SpaceId, WindowId } from './types';

const initial: AppState = {
  schemaVersion: 5,
  spaces: [],                  // Space records: { id, name, color, icon } — Lunma-owned (ADR 0005)
  activeSpaceByWindow: {},
  spaceInstancesByWindow: {},  // { [windowId]: { [spaceId]: SpaceInstance } } — nested per (window, Space) (ADR 0007)
  tabBindings: {},             // { [savedTabId]: { [windowId]: tabId } } — per-window session-ephemeral binding (ADR 0009)
  savedTabs: {},               // { [savedTabId]: SavedTab } — Lunma-owned record map
  lastActivatedSpaceId: null,
  tabLastActivity: {},
  archivedTabs: [],
  trash: {},
  pinnedBySpace: {},           // { [spaceId]: PinNode[] } — ordered tree of tab|folder nodes
                               //   PinNode = { kind:'tab'; id }
                               //           | { kind:'folder'; id; name; icon; color; children: savedTabId[] }
                               //   single-level (folder children are tab ids, never nested folders)
  faviconRow: [],              // SavedTabId[] — flat, GLOBAL favicon-row favorites (ADR 0010):
                               //   the ids whose SavedTab.spaceId === null (decoupled). Sibling to
                               //   pinnedBySpace, NOT keyed by Space; a record is in one XOR the other.
  liveTabsById: {},            // { [tabId]: LiveTab } — EPHEMERAL, stripped before persist
};

export class LunmaStore {
  state = $state<AppState>(initial);

  activateSpace(windowId: WindowId, spaceId: SpaceId): void {
    this.state.activeSpaceByWindow[windowId] = spaceId;
    // Ensure THIS (window, Space) instance exists without discarding any other
    // Space's instance in the window — a window remembers every Space it has
    // instantiated, so switching away + back reuses its groupId + tempTabIds
    // (ADR 0007). The chrome.tabGroups side effects live in the coordinator.
    this.ensureInstance(windowId, spaceId);
    this.state.lastActivatedSpaceId = spaceId;
  }
  // ... one synchronous method per state transition
}
```

The active instance for a window is
`spaceInstancesByWindow[windowId]?.[activeSpaceByWindow[windowId]]`. A
`groupId` of `-1` means "no live Chrome group yet". Materializing a Space as a
real Chrome tab group — activating expands its group and collapses the others,
new tabs join the active group, rename/recolour/delete propagate to the group —
is **coordinator** work (`apps/extension/src/background/tab-groups.ts` wraps every
`chrome.tabGroups.*` / `chrome.tabs.group|ungroup` call; `coordinator.ts`
sequences them per ADR 0007). Store mutators stay synchronous and chrome-free
(`recordSpaceGroup` is the only group-related state write).

Key properties:

- **Synchronous, void-returning mutators.** Every mutator is `(input: PlainData) => void`. The store does not chain promises, does not own a serial queue, and does not perform I/O.
- **No persist or broadcast on the store.** Those are owned by `Coordinator` (see below). The store constructor does not accept `persist` or `broadcast` options.
- Methods mutate `$state` directly. Svelte 5's runes track property-level changes, so components re-render only the slices they read.
- **No Chrome objects as inputs.** Mutators accept only plain data. The coordinator handler resolves Chrome objects (Tab, Window) into plain values before calling the mutator.
- Other surfaces (sidebar primarily) subscribe via `chrome.runtime.onMessage`. The coordinator broadcasts the resulting state once per drain cycle, and subscribers apply it locally — they do not re-run mutation methods.
- Tests instantiate `new LunmaStore()` and call methods directly without `await`. Coverage is method-by-method.
- The file uses the `.svelte.ts` extension because Svelte 5's `$state` rune is only compiled outside `.svelte` files when the filename ends in `.svelte.ts` or `.svelte.js`.

**Ephemeral state slice — `liveTabsById`.** `AppState.liveTabsById: { [tabId]: LiveTab }` mirrors live Chrome-tab metadata (`title`, `url`, `active`, `status: 'loading' | 'complete'`) so surfaces can render a tab list from the broadcast state alone. It is maintained entirely by the SW via `syncLiveTab` (create/update), `removeLiveTab` (remove), and `setActiveTab` (activate), and is **never persisted**: `persist()` strips it before writing, so the on-disk shape is unchanged and there is **no schema-version bump**. It is rebuilt from `chrome.tabs.query({})` via `store.rebuildLiveTabs(tabs)` at SW boot (after load/recovery, before listener registration), never read back from disk. The persisted-state schema (the **current-version** schema — `AppStateV5Schema` at `CURRENT_SCHEMA_VERSION = 5`) accepts the slice as `.optional()` so reads tolerate its absence; the runtime `AppState` type keeps it required. (`readPersistedState` migrates the stored state up to the current version, then validates against that current-version schema — never a hardcoded older one, which would reject the current nested-instance / `PinNode` shape and spuriously quarantine every restart.) The temp list renders in `tempTabIds` array order and is user-reorderable via the `reorderTemp` command (ADR 0006); no `chrome.tabs.onMoved` listener is needed.

## The event coordinator (single sequencer)

```ts
// apps/extension/src/background/coordinator.ts (simplified)
import { store } from '../shared/store-singleton';
import { persist } from '../shared/chrome/storage';
import { broadcastState } from '../shared/messages';

type PendingEvent =
  | { source: 'chrome'; kind: 'tabs.onCreated'; payload: { tab: chrome.tabs.Tab } }
  | { source: 'chrome'; kind: 'tabs.onUpdated'; payload: { tabId: number; changeInfo: ... } }
  | { source: 'chrome'; kind: 'tabs.onActivated'; payload: { activeInfo: chrome.tabs.OnActivatedInfo } }
  | /* ... one variant per Chrome event Lunma handles ... */
  | { source: 'sidebar'; kind: 'createSpace'; payload: { ... }; correlationId: string }
  | /* ... one variant per SidebarCommand kind, each with correlationId ... */;

class Coordinator {
  private events: PendingEvent[] = [];
  private draining = false;
  private dirty = false;
  // The seam each slice handler receives. markDirty() sets `dirty`; groups/
  // boundary are the GroupOrchestrator / BoundaryController collaborators.
  private ctx: HandlerContext; // { store, markDirty, runSideEffect, groups, boundary }

  enqueue(ev: PendingEvent): void {
    // coalesce-by-key (e.g. tabs.onUpdated for the same tabId) — merging the
    // prior + incoming payloads field-wise for the *.onUpdated kinds, replacing
    // (last-write-wins) otherwise — then enforce a depth cap of 1000 (drop
    // oldest, log EVENT_DROPPED).
    this.events.push(ev);
    this.scheduleDrain();
  }

  private async drain(): Promise<void> {
    while (this.events.length > 0) {
      const event = this.events.shift()!;
      try {
        await this.handlers[event.kind](ctx, event); // slice handler mutates $state via sync store calls
        this.dirty = true;
      } catch (err) {
        log.error('HANDLER_THREW', { kind: event.kind, err });
      }
    }
    if (this.dirty) {
      this.dirty = false;
      await persist(store.state);     // persist() strips the ephemeral liveTabsById slice
      broadcastState('<batched>', store.state);
    }
  }
}
```

Key properties:

- **Single sequencer.** The **coordinator module** — `coordinator.ts` plus its handler slices under `background/handlers/**` and the orchestration collaborators `group-orchestrator.ts` / `boundary-controller.ts` it owns — is the only path that mutates `$state`. Chrome listeners enqueue; the drain loop runs handlers one at a time.
- **Sliced handlers, slim core.** `coordinator.ts` is the queue core (enqueue/coalesce/drain/persist/broadcast/ack). The 48 handlers live in nine capability-grouped slices under `background/handlers/`, each a factory returning a typed `Pick<HandlersMap, …>` fragment; the core assembles them into one `HandlersMap`-typed object, so omitting any `kind` fails `tsc`. Every handler receives a small `HandlerContext` (`{ store, markDirty, runSideEffect, groups, boundary }`) — the cross-cutting `chrome.tabGroups`/home-tab orchestration lives in `GroupOrchestrator`, the boundary I/O in `BoundaryController`, and the pure read predicates are free functions in `handlers/queries.ts`. A Biome `noRestrictedImports` rule keeps anything outside the coordinator module from importing the slices.
- **Coordinator owns I/O.** All `chrome.*` API calls required to resolve an event into plain data happen inside the handler. After the drain cycle empties, `persist` and `broadcast` fire **at most once each** — they are batched, not per-mutator.
- **Bounded queue, in-memory only.** Depth cap is 1000 with per-kind coalescing. Coalescing is either **replace** or **merge**, declared per kind via `EventPolicy`. `tabs.onUpdated` and `tabGroups.onUpdated` **merge**: their queued payloads are combined field-wise (incoming wins per field) rather than replaced, because Chrome's `changeInfo` is a partial delta — a `{ status: 'complete' }` event followed by a `{ favIconUrl }` event must coalesce into `{ status: 'complete', favIconUrl }`, never dropping the earlier `status` (otherwise a finished tab keeps showing its loading spinner). Sidebar keyed kinds (`renameSpace`, `activateSpace`) stay **replace**/last-write-wins — their payload is a complete intent. The queue is not persisted across SW termination; reconciliation runs via `runRestartRecovery` + `chrome.tabs.query()` on next wake.
- **`PendingEvent.source` spans `'chrome' | 'sidebar'`.** Sidebar commands (from `bus.send`) carry a `correlationId: string` and ride the same FIFO. The drain tail emits one `'lunma/command-ack'` per sidebar command, separate from the state broadcast (different concerns, different fan-out). Future capabilities (options page, Arcify importer) extend the union with their own `source` values.
- **Saved tabs are Lunma-owned (ADR 0005), so the coordinator observes no `chrome.bookmarks.*` events.** `makeThisHome` updates `originalURL` in state only — no Chrome write, so no self-tagging/echo-suppression registry is needed. `createSpace` mints a Lunma record (`store.createSpace`) rather than creating a bookmark folder.
- **No public `flush()` / `markDirty()`.** The `typed-message-bus` change removed both escape hatches from the `Coordinator` surface; SW-internal mutations either ride the bus (sidebar-shaped) or run during boot before listeners are registered. The slice dirty signal is the internal `HandlerContext.markDirty()` (handed only to in-module slices, set imperatively so a mutate-then-await-throw handler still persists) — never a public method.

```
SW boot order:
  registerChromeListeners()                   ← SYNCHRONOUS, first turn (enqueue deferred)
  installBusAdapter(coordinator, bootReady)    ← SYNCHRONOUS, first turn (enqueue deferred)
  bootReady = loadState → runRestartRecovery → ensureAtLeastOneSpace → purgeExpiredTrash
    → seedExistingWindows → seedExistingTabs + rebuildLiveTabs (one chrome.tabs.query({}))
    → reconcileTabGroupsOnBoot   (fresh install: convert groups→Spaces; then adopt restored groups + materialize the active Space's group)
    → persist(store.snapshot())
    → reconcileTabOwnership           (prevent-space-group-collapse: ensures no temp tab is owned by two Spaces)
    → registerStateSnapshotHandler   (post-boot: answers with the loaded snapshot)
    → registerLauncherSuggestionsHandler   (post-boot: pure-read suggestions channel)
    → broadcast({ method: 'boot' })   (refresh an already-open sidebar after a wake)
```

`seedExistingTabs` adopts the tabs already open in each window into that
window's active Space as temporary tabs — `chrome.tabs.onCreated` only fires
for new tabs and `onTabCreated` needs the window to already have a
`spaceInstance`, so without this pass the Temporary list would stay empty until
the next Space switch. It calls `store.ensureSpaceInstance(windowId)` (creates
an empty instance for the active Space without touching `lastActivatedSpaceId`)
then `store.onTabCreated(...)` per open tab (skipping bound/duplicate tabs, and
**skipping home tabs** — `isNewTabUrl(tab.url)` — since a home tab is never a
temporary tab), and shares the single `chrome.tabs.query({})` result with
`rebuildLiveTabs`.

`reconcileTabGroupsOnBoot(store, freshInstall)` (`apps/extension/src/background/tab-group-adoption.ts`,
added by `tab-group-adoption`) runs once **after** the tab seed and **before** the
boot persist/broadcast, so the boot broadcast carries the reconciled `groupId`s.
On a **fresh install** (`freshInstall` = no Spaces were loaded from storage,
captured before `ensureAtLeastOneSpace` mints the Default) it first **converts**
each existing Chrome group into a Space — minting a Space per group (`group.title`
→ name, `fromGroupColor(group.color)` → colour), moving the group's tabs out of
the Default into the new Space's instance (`store.assignSpaceTabs`), folding
same-title+colour groups across windows into one Space, activating the Space whose
group holds each window's active tab, and discarding the emptied Default
(`store.removeEmptySpace`) — so a first-run user's existing groups show up as
Spaces rather than collapsing into one Default. Group + tab ids are
session-scoped, so a browser restart hands Lunma's tracked groups *new* ids. The
pass then **adopts** each restored Chrome group into the Space it
most likely belongs to — the pure `matchGroupToSpace(group, candidates)` scores
**tab-membership overlap** with the instance's persisted `tempTabIds` first, then
**persisted title + colour** as a tiebreaker, and re-binds the instance's
`groupId` via `store.recordSpaceGroup` (state only — no `chrome.tabGroups` call,
so it never fights Chrome's restored layout). A group matching no Space (the
user's own) is left untouched. It then **materializes** each window's active
Space group when it has open tabs but still `groupId === -1`: it groups the
Space's window tab set via the `tab-groups.ts` helpers, titles + recolours it, and
best-effort collapses the window's other tracked groups. Boot **never opens a tab
and never changes focus** — an empty active Space stays groupless until its first
tab. This resolves the launch-blocker flagged in ADR 0007 (restored-group
adoption) and closes the "ungrouped until first `Cmd+T`" gap.

The registered Chrome listeners are `tabs.onCreated`, `tabs.onRemoved`,
`tabs.onUpdated`, `tabs.onActivated`, `tabGroups.onRemoved`,
`tabGroups.onUpdated`, `windows.onCreated`, `windows.onRemoved`,
`commands.onCommand`, and `alarms.onAlarm` (auto-archive sweep). The `alarms.onAlarm`
listener is always registered, but the sweep **alarm itself** is created only while
`autoArchiveEnabled` is on — at a period derived from the idle threshold
(`max(1, floor(autoArchiveIdleMinutes / 2))` min) — and cleared when disabled, so a
disabled user pays no per-wake SW cost (auto-archive capability). `tabs.onActivated` (added by
`sidebar-temp-tabs`) drives `setActiveTab` so the temp list can highlight the
focused tab; `onCreated` / `onUpdated` also feed `syncLiveTab` and `onRemoved`
feeds `removeLiveTab` to maintain the ephemeral `liveTabsById` slice. The two
`tabGroups.*` listeners (added by `tab-group-adoption`) are **non-destructive
lifecycle hints**: `tabGroups.onRemoved` for a Lunma-tracked group calls
`store.forgetSpaceGroup(groupId)` (resets the instance to `groupId === -1`,
keeping the Space and its pins — ungrouping NEVER deletes a Space), and
`tabGroups.onUpdated` mirrors a *title* change back onto the Space name via
`store.renameSpace` (guarded so a Lunma-initiated retitle does not loop; colour
and collapse changes are ignored). Because Space names are unique, a Chrome-side
rename to a title another Space already uses would make `store.renameSpace`
throw — so the mirror first resolves the title through `disambiguateSpaceName`
and, when that yields a different name, re-titles the live Chrome group to the
disambiguated name (`updateGroupTitleColor`) so group and record stay in
lockstep; the mirror never throws the drain. Untracked groups are ignored by both.
`commands.onCommand` (added by `sidebar-pinned-tabs`) is the keyboard event
source for the `pin-active-tab` command (`Alt`/`Option+D`): it resolves the
focused window's active tab via `chrome.tabs.query({ active: true,
lastFocusedWindow: true })`, feeds it through the pure
`resolvePinActiveTab(store, tab)` resolver, and enqueues a sidebar-shaped
`pinTab` event (synthetic `correlationId`; its ack has no bus client and is
harmlessly dropped). There is no `onMoved` listener — temp ordering is a manual
`tempTabIds` array order, reordered by the user via `reorderTemp` (ADR 0006).

There is no bookmark bootstrap: Spaces and saved tabs are Lunma-owned
records, so boot loads state, rebinds live tabs to saved tabs by URL,
seeds a Default Space if none exist, purges expired trash, then persists.

**Wake-up delivery (MV3).** MV3 routes the message or event that *wakes* a
dormant SW only to listeners present in the SW's first synchronous turn — a
listener added after an `await` misses it, so the sidebar sees "Receiving end
does not exist" (commands) or the chrome event is silently dropped. This
affected *every* sidebar command after the SW idled out, and made a tab opened
while the SW was dormant invisible in an already-open sidebar. So the
wake-critical listeners — the **bus adapter** and the **chrome.\* event
listeners** — are registered **synchronously in the first turn**, and each
defers its `coordinator.enqueue` until `bootReady` resolves (preserving the
boot-mutations-first guarantee and arrival order). Deferring the *enqueue*
rather than the *registration* means boot-time chrome events are queued and run
after boot on the reconciled state (handlers are idempotent against the boot
seed), instead of being dropped. The snapshot handler stays post-boot (it must
answer with the loaded snapshot, not the empty default). Finally, boot emits one
`broadcast({ method: 'boot' })` so a sidebar that was already open when the SW
woke picks up the reconciled state. See `chrome-event-coordination`'s
"Coordinator owns I/O" requirement.

See `openspec/specs/chrome-event-coordination/spec.md` and
`openspec/specs/typed-message-bus/spec.md` for the normative requirements.

### Read-side state-snapshot channel (parallel to the queue)

The coordinator queue is for mutations. Pure reads — the sidebar's boot-time
fetch of the current `AppState` — flow over a separate request/response
channel: the sidebar sends `'lunma/state-request'`, the SW replies with
`'lunma/state-snapshot'` carrying `store.snapshot()`. The handler
(`apps/extension/src/background/state-snapshot-handler.ts`) never enqueues, never mutates,
never persists, and never broadcasts.

The **launcher-suggestions channel** is the second instance of this pattern
(`launcher-v1`). A surface sends `'lunma/launcher-suggestions-request'
{ requestId, query, windowId }`; the handler
(`apps/extension/src/background/launcher-suggestions-handler.ts`,
`registerLauncherSuggestionsHandler(store)`, registered post-boot beside the
snapshot handler) sources the four launcher providers — saved tabs from
`store.state`, open tabs / bookmarks / history via read-only chrome APIs — runs
`runSearch`, and replies with `'lunma/launcher-suggestions-response'
{ requestId, results }`, echoing `requestId` so a surface can drop stale
out-of-order responses (latest-wins). It is **pure-read**: never enqueues,
mutates, persists, or broadcasts, and runs independently of the queue (a
response never blocks on an in-flight drain). Together the channels keep "pure
reads do not interact with the mutation queue" as a uniform mental model.

The **current-window request** is a third, minimal instance of the pattern
(`launcher-shortcut-resilience`). The launcher overlay's `Alt+L` keydown
fallback has no SW message payload to read its `windowId` from (content scripts
can't call `chrome.windows`), so it sends `'lunma/current-window'` and the SW
replies `'lunma/current-window-result' { windowId }` from
`sender.tab?.windowId ?? -1`. The handler (`respondWithCurrentWindow()` in
`apps/extension/src/shared/messages.ts`) is registered **synchronously at SW top-level** — it
reads no store state (unlike the snapshot/suggestions handlers, which register
post-boot), and an `Alt+L`-triggered request can be the very message that wakes
a dormant SW, so the listener must be present in the first turn. Pure-read:
never enqueues, mutates, persists, or broadcasts.

### Component library (`apps/extension/src/ui/`)

Cross-surface UI primitives (e.g. `SpaceIcon`, `Tooltip`, `Stack`,
`TabRowMenu`) live in `apps/extension/src/ui/`; the design tokens they reference
live in the shared **`@lunma/tokens`** package (`packages/tokens/tokens.css`),
imported at each surface's CSS entry. Feature components compose primitives; they
do not re-roll buttons, tooltips, etc. inline. Neutral tokens are OKLCH
expressions parameterised by a `--base-hue` custom property, laying the
foundation for a future user-customisable base colour.

## Storage schema + migrations

State is persisted to `chrome.storage.local` under the key `lunma.state` as a versioned envelope `{ schemaVersion, state }`. The current baseline is **schema v1** (`CURRENT_SCHEMA_VERSION = 1` in `apps/extension/src/shared/schemas.ts`). The placeholder-era v1–v11 migration chain was collapsed to a single schema at the pre-release rebrand; the migration list is **empty** today. The migration shape is `{ toVersion: number; migrate: (raw: unknown) => unknown }` (see `apps/extension/src/shared/migrations.ts`).

`readPersistedState()` (`apps/extension/src/shared/chrome/storage.ts`) handles every read:

1. Reads `lunma.state` with bounded retry (up to 3 attempts); a sustained read failure returns `{ kind: 'unavailable' }` — this path **never** overwrites on-disk state.
2. An absent key returns `{ kind: 'empty' }` (first install).
3. Validates the envelope's `schemaVersion`; an invalid version quarantines the raw bytes and returns `{ kind: 'corrupt' }`.
4. Runs `runMigrations(persistedState, persistedVersion)` (a no-op today); a thrown migration quarantines and returns `{ kind: 'corrupt' }`.
5. Runs `AppStateV1Schema.safeParse(migrated)`. On **success**, de-duplicates ids (`dedupePersistedState`) and self-heals: writes the cleaned envelope back when the version migrated up or duplicates were removed. Returns `{ kind: 'ok', state }`.
6. On **parse failure**, attempts **per-slice salvage** (`salvagePersistedState`): `spaces` is salvaged element-wise (each individually-valid Space is kept; corrupt entries are dropped); every other top-level slice is salvaged slice-wise (kept when valid, defaulted otherwise). The raw bytes are **always** quarantined regardless of salvage outcome. If salvage succeeds, the salvaged state is de-duped, written back (self-heal), and returned as `{ kind: 'salvaged', state }`. If salvage returns null, returns `{ kind: 'corrupt' }`.

### Quarantine contract

A quarantine entry is written to `chrome.storage.local` under a key prefixed `__corrupt_backup_`. At most **10** quarantine entries are retained (oldest pruned on each new write). Each entry has the shape:

```ts
interface QuarantineRecord {
  capturedAt: number;    // Date.now() at quarantine time
  reason: string;        // human-readable failure reason
  error?: string;        // error message when a migration threw
  zodIssues?: unknown;   // Zod parse issues when schema validation failed
  rawBytes: unknown;     // the EXACT envelope bytes read from chrome.storage.local — never the post-migration value
}
```

The captured `rawBytes` is always the original envelope read from disk, before any migration ran. A quarantine entry is written **only** on actual failure (invalid schema version, thrown migration, or failed parse); a successful load never writes one.

## Surface boundaries

| Surface | Owns | Reads from store | Writes to store |
|---|---|---|---|
| Background SW | Chrome event listeners, alarms, saved-tab bindings, auto-archive | yes (owns the store) | yes (invokes store methods directly) |
| Sidebar | DOM, user interaction, drag-drop | yes (subscriber via state broadcast) | yes (calls store methods through SW message bridge) |
| Launcher overlay | `Alt+L` page injection, search UI | no (queries the suggestions channel) | no — dispatches `focusTab`/`focusSavedTab`/`openSavedTab`/`openUrl` over the bus |
| Launcher newtab | Empty-Space home (Space identity) + inline search | yes (read-only: snapshot + `state-broadcast`, like the sidebar) + queries the suggestions channel | no — dispatches result actions over the bus |
| Options | Settings UI | reads `chrome.storage.sync` directly | writes `chrome.storage.sync` |
| Onboarding | Static content + open links | no | no |

Sidebar and SW are the only two surfaces that mutate the store. Everything else is read-only or settings-only.

## Enforced boundaries

Principle 2 ("layers are honest about boundaries") is **mechanically enforced**, not
just documented. The source tree is a one-way dependency DAG, and `biome check` fails
on any import that violates it — per-layer `noRestrictedImports` `overrides` plus
`noImportCycles` in `biome.json` (Biome 2.4 lints inside `.svelte` `<script>`, so the
Svelte-heavy `ui` layer is covered, and no separate import-graph tool is needed).

| Layer (`apps/extension/src/…`) | May import | Must NOT import |
|---|---|---|
| `shared` — foundation: `types`, `store`, `bus`, `messages`, `settings`, `schemas`, `migrations`, `logger`, `space-hue` (colour math), `icon-names`, `launcher-contract`, `window-id` | nothing else in `apps/extension/src/` | every other layer |
| `ui` — primitives (design tokens come from `@lunma/tokens`) | `shared` | `background`, any surface |
| `background` — service worker | `shared`, **`launcher/shared`** (the launcher engine) | `ui`, any surface, a launcher *page* |
| `sidebar`, `options` — feature surfaces | `ui`, `shared` | `background`, another surface |
| `launcher` — overlay + newtab surface | `ui`, `shared` (+ launcher-internal) | `background`, another surface |
| `launcher/shared` — the launcher search **engine** (SW-imported), **shared-grade** | `shared` (+ intra-`launcher/shared`) | `ui`, any surface — keeps the SW's transitive graph DOM-free |
| `content` — vanilla content scripts | `shared` | every other layer |

**The launcher-engine service edge.** `background` legitimately imports
`launcher/shared` (the result providers + scoring + `search-engine`) because the
launcher's result-ranking runs **server-side in the SW** — the overlay and newtab only
request suggestions over a channel (see "Both surfaces share the search engine via
`apps/extension/src/launcher/shared/`" above). So `launcher/shared` is a *service* consumed by both
the SW and the launcher surfaces — the one sanctioned exception to "background imports
`shared` only", encoded as a `!**/launcher/shared/**` negation in the `background`
rule. Because the SW transitively depends on this engine, `launcher/shared` is itself
held to **shared-grade** imports by a dedicated `apps/extension/src/launcher/shared/**`
override: it may import `shared` (+ its own internals) but **not** `ui` or another
surface, so no DOM-coupled component code can reach the SW bundle through it. (That
override re-states the cross-surface bans rather than only adding `ui`, since Biome's
per-rule override options *replace* — not union — for the overlapping `launcher/**`
glob. The gate catches module **imports**; direct `document`/`window` use inside the
engine is not an import and stays a review-time concern.) The pure launcher
**result contract** (`ResultSource` / `LauncherResult` /
`Suggestions*` + `sourceBadgeLabel`) lives in `apps/extension/src/shared/launcher-contract.ts` so
`ui`, `shared`, and the SW reach it without depending on the launcher surface.

**The token/primitive contract** (primitives reference the `@lunma/tokens` custom
properties, never raw values) is enforced for `font-size`/`z-index` by Stylelint
(`pnpm lint:styles`, scoped to `apps/extension/src/ui`); the press-scale /
control-height / feature-side parts stay a review-time convention. The gate
also runs `svelte-check` (`pnpm check`) for `.svelte` type coverage that
`tsc --noEmit` cannot observe — template bindings and component prop contracts.
See the `architecture-integrity` capability spec for the normative requirements.

### Workspace package boundaries

Beyond the extension's internal DAG, the workspace adds one boundary: **`apps/site`
and `apps/extension` MUST NOT import each other.** It holds for free — there is no
dependency edge between the two app packages — and is additionally gated by a Biome
`noRestrictedImports` rule both ways (`biome check` fails on a planted cross-app
import, exactly like the intra-DAG planted violation). The single shared package,
**`@lunma/tokens`** (`packages/tokens`), is **CSS-only** — design-token custom
properties, the brand `@font-face` + woff2, and the aurora/glass/glow recipe classes,
with **no JS/TS entry** — so it sits *outside* the import-layer DAG: a layer
referencing `@lunma/tokens` via a stylesheet import is not a boundary violation. Both
apps depend on it via `workspace:*`. The site composes the shared tokens/recipes
directly and builds its own marketing components; it never reaches into the
extension's `ui/` primitives (which are coupled to `shared`).

## Logging

A `Logger` gated by a `debugLoggingEnabled` setting in `chrome.storage.sync`. Never use `console.*` directly in production paths.

```ts
// apps/extension/src/shared/logger.ts
const log = {
  debug: (msg, ctx) => { if (debugEnabled) console.debug('[lunma]', msg, ctx); },
  info:  (msg, ctx) => console.info('[lunma]', msg, ctx),
  warn:  (msg, ctx) => console.warn('[lunma]', msg, ctx),
  error: (msg, ctx) => console.error('[lunma]', msg, ctx),
};
```

## Error handling discipline

- **No silent catches.** `catch (e) {}` is forbidden by lint config.
- **Every async boundary** (message handlers, SW listeners, storage reads) wraps in `try/catch` and routes through `log.error`.
- **Store methods never throw on invalid input.** Bad arguments (unknown ids, illegal transitions) log a warning via `log.error` and leave state unchanged.
- **Storage validation failures** fail loudly at the load boundary (Zod), never silently mid-flow.
