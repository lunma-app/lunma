# Architecture

The structural blueprint for Lunma. Three principles drive the design:

1. **State changes are serial.** A single store class + serial mutation queue + event coordinator means `spaces[]` is never mutated by two paths concurrently.
2. **Layers are honest about boundaries.** Chrome API code, business logic, storage, and DOM live in distinct modules with one-way dependencies.
3. **Storage is typed and versioned.** Every read goes through a Zod schema. Migrations run on SW boot.

## Project layout

```
lunma/
├─ src/
│  ├─ shared/                  # cross-surface: types, store, schemas
│  │  ├─ types.ts              # Space, SpaceInstance, SavedTab, AppState
│  │  ├─ schemas.ts            # Zod schemas + migrations[]
│  │  ├─ store.svelte.ts       # LunmaStore class: $state + synchronous void mutators (thin store)
│  │  ├─ messages.ts           # typed sendMessage/onMessage
│  │  ├─ settings.ts           # declarative settings engine: read/write/watch chrome.storage.sync, broadcasts via onChanged
│  │  ├─ logger.ts             # gated by debugLoggingEnabled
│  │  └─ chrome/               # thin typed wrappers over chrome.* APIs
│  ├─ ui/                      # cross-surface primitives + design tokens (build primitives, compose features)
│  │  ├─ tokens.css            # design tokens (OKLCH, parameterised by --base-hue)
│  │  ├─ Button.svelte         # …+ Icon · Tooltip · Stack · Kbd · SegmentedControl · TabRow · TabRowMenu
│  │  └─ icon-catalogue.ts     # IconName union + lucide imports (+ favicon.ts · space-hue.ts · index.ts)
│  ├─ background/
│  │  ├─ index.ts              # SW entry
│  │  ├─ coordinator.ts        # serialized chrome event queue
│  │  ├─ bus-adapter.ts        # routes 'lunma/command' messages into the coordinator
│  │  ├─ state-snapshot-handler.ts  # pure-read snapshot channel (never mutates)
│  │  ├─ launcher-suggestions-handler.ts  # pure-read launcher query channel (never mutates)
│  │  ├─ tab-bindings.ts       # restart recovery: rebind saved tabs by URL
│  │  ├─ boundary-injection.ts # injects the boundary content script on demand, by filename (pinned-tab-domain-boundary)
│  │  ├─ seed-existing-windows.ts  # + seed-existing-tabs · default-space · trash-purge · pin-active-tab
│  │  └─ (planned) auto-archive.ts   # Phase 5
│  ├─ sidebar/                 # flat — feature components compose src/ui primitives (TabRow lives in ui/)
│  │  ├─ App.svelte · main.ts
│  │  ├─ PinnedTabs.svelte · TempTabs.svelte · SpaceSwitcher.svelte
│  │  ├─ SectionHeader.svelte · SearchTrigger.svelte · EmptyState.svelte · DragClone.svelte
│  │  ├─ drag.svelte.ts        # custom pointer-drag controller (ADR 0006)
│  │  └─ swipe.ts · store-context.svelte.ts · window-id.ts · space-navigation.ts
│  ├─ launcher/                # wired (launcher-v1): overlay (content script) + newtab (chrome_url_overrides)
│  │  ├─ overlay.ts            # IIFE entry — vanilla DOM, closed shadow + constructable stylesheet, no Svelte
│  │  ├─ overlay.css           # constructable-stylesheet source (tokens-derived; component-lib exception)
│  │  ├─ newtab/               # full Svelte page — empty-Space "home" (idle) + inline launcher search
│  │  │  ├─ NewTab.svelte · newtab.css
│  │  │  └─ main.ts
│  │  └─ shared/               # SearchEngine, scoring, providers, result/query types
│  ├─ content/                 # second declarative content script (pinned-tab-domain-boundary)
│  │  └─ tab-boundary.ts        # IIFE — clicks-only domain-boundary enforcer, dormant until the SW pushes its allow-set (no Svelte)
│  ├─ options/
│  │  ├─ Options.svelte
│  │  └─ main.ts
│  └─ (planned) onboarding/    # Phase 5 — does not exist yet
│     ├─ Onboarding.svelte     # mode: 'install' | 'update'
│     ├─ changelog.ts          # single source of truth
│     └─ main.ts
├─ public/
│  └─ manifest.json            # MV3 manifest — crxjs derives build entries from it
├─ e2e/                        # Playwright specs + fixtures (playwright.config.ts at repo root)
│                              # unit tests are co-located: src/**/*.test.ts (no top-level tests/)
├─ openspec/
│  ├─ config.yaml
│  ├─ specs/                   # one folder per capability (see 04-capabilities.md)
│  └─ changes/                 # in-flight changes
├─ vite.config.ts
├─ svelte.config.js
├─ tsconfig.json
├─ biome.json
├─ package.json
└─ README.md
```

## Why the overlay stays vanilla

> **Status:** the launcher **overlay** is now **wired** (`launcher-v1`). It ships
> a `content_scripts` entry injecting `src/launcher/overlay.ts` at
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

The overlay content script (`launcher/overlay.ts`) runs on **every page load on `<all_urls>`** at `document_start` and stays dormant until `Alt+L`. Byte budget is tight — even Svelte 5's small runtime is overhead it shouldn't pay while dormant — so it is **plain TS + a closed shadow DOM + a constructable stylesheet** derived from `src/ui/tokens.css`, and it speaks the wire protocols directly (`chrome.runtime.sendMessage`) rather than importing the `bus`/`messages` modules (which would pull in the logger). The shipped content-script chunk is ~3KB gzipped, well under the 15KB budget. Declarative content scripts inject only into tabs opened/reloaded after the extension starts, so the SW's `toggle-launcher` handler **injects the overlay on demand** (`chrome.scripting.executeScript`, behind the `scripting` permission) when the active tab has no receiver — `Alt+L` then works on already-open tabs without a reload; pages Chrome forbids injecting (`chrome://`, Web Store, extension pages) stay no-ops. That on-demand injection only fires on the command path, though, and Chrome routinely leaves the command unbound — so the SW ALSO **backfills the overlay into every already-open `http(s)` tab on `chrome.runtime.onInstalled`** (install/update/reload), registered synchronously in the first turn (`launcher-backfill-open-tabs`, `src/background/overlay-injection.ts` — `backfillOverlayIntoOpenTabs()` reusing `injectOverlay(tabId)`). This makes the page-level `Alt+L` keydown fallback live on existing tabs immediately, with per-tab failure isolation and idempotent re-injection (the overlay's `__lunmaLauncherInstalled` guard). The open path also carries the active Space's colour so the immersive overlay glows in it (`newtab-launcher-vivid-refresh`): the SW reads the focused window's active Space and attaches additive, optional `spaceHue` / `spaceChroma` (OKLCH, via `colourToHue` / `colourToChroma`) to the **typed `LauncherToggleMessage`** (`lunma/toggle-launcher`) and to the `lunma/current-window` response (the keydown path). Both fields are omitted when there is no active Space or it is neutral (`gray`), so the overlay falls back to its default accent — an older SW (sending neither) and a newer overlay interoperate with no version gate.

A **second declarative content script** (`content/tab-boundary.ts`, `pinned-tab-domain-boundary`, ADR 0008) follows the same vanilla discipline: it runs on `<all_urls>` at `document_start` and stays **dormant** (an install guard + one `runtime.onMessage` listener) until the SW pushes it an allow-set for a bound, enforced pinned tab (`lunma/boundary-config`). While armed it intercepts only same-tab, unmodified, `http(s)` link clicks to off-allow hosts — diverting them to the SW (`lunma/boundary-open-elsewhere` → the existing `openUrl`) so the pinned tab stays put. It imports only the pure `url-boundary` matcher (no Svelte, no logger), so the chunk stays tiny. Like the overlay it can't be reached by Chrome's post-load declarative injection on a pre-existing tab, so the SW injects it on demand via `background/boundary-injection.ts` (selected from the manifest **by filename**, not array index) when a saved tab becomes bound and enforced.

The new-tab page (`launcher/newtab/`) is its own page and a full Svelte app. It is a **read-only state consumer** for its idle home, exactly like the sidebar: `main.ts` resolves its window (`chrome.windows.getCurrent`) and seeds from a `state-request` snapshot (with boot-retry backoff), then `NewTab.svelte` stays live by subscribing to `state-broadcast`. For search it queries the **launcher-suggestions channel** and dispatches result actions over the bus (`focusTab` / `focusSavedTab` / `openSavedTab` / `openUrl`). Both surfaces share the search engine via `src/launcher/shared/`.

**Home-tab orchestration.** A Chrome group cannot be empty and a window cannot be empty, so an empty Space always forces a tab into existence. With Lunma owning the new-tab page, that forced tab is the Space's **home**. The coordinator recognises a home tab by its live URL (`isNewTabUrl(url)` in `src/shared/new-tab.ts`, matching `chrome://newtab/` and the extension's resolved newtab URL) and treats it as a *transient* property of the live tab (never persisted): a home tab is grouped into the active Space (so the window shows it) but is **never** added to `tempTabIds` — so it is unlisted in the sidebar's Temporary list. On `tabs.onUpdated` to a non-newtab URL it ceases to be a home tab and is adopted as an ordinary temporary tab. Empty-Space activation **reuses** the window's focused tab when it is already a home tab (else opens one), and leaving a Space whose only window tab is its home **closes** that home tab (the instance returns to `groupId === -1`) — so visiting empty Spaces never accumulates blank tabs, and **Clear** lands cleanly on the home with no stray tab re-added to the list.

## The store pattern (thin store)

```ts
// src/shared/store.svelte.ts
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
is **coordinator** work (`src/background/tab-groups.ts` wraps every
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
// src/background/coordinator.ts (simplified)
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
        await this.handlers[event.kind](event); // mutates $state via sync store calls
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

- **Single sequencer.** The coordinator is the only path that mutates `$state`. Chrome listeners enqueue; the drain loop runs handlers one at a time.
- **Coordinator owns I/O.** All `chrome.*` API calls required to resolve an event into plain data happen inside the handler. After the drain cycle empties, `persist` and `broadcast` fire **at most once each** — they are batched, not per-mutator.
- **Bounded queue, in-memory only.** Depth cap is 1000 with per-kind coalescing. Coalescing is either **replace** or **merge**, declared per kind via `EventPolicy`. `tabs.onUpdated` and `tabGroups.onUpdated` **merge**: their queued payloads are combined field-wise (incoming wins per field) rather than replaced, because Chrome's `changeInfo` is a partial delta — a `{ status: 'complete' }` event followed by a `{ favIconUrl }` event must coalesce into `{ status: 'complete', favIconUrl }`, never dropping the earlier `status` (otherwise a finished tab keeps showing its loading spinner). Sidebar keyed kinds (`renameSpace`, `activateSpace`) stay **replace**/last-write-wins — their payload is a complete intent. The queue is not persisted across SW termination; reconciliation runs via `runRestartRecovery` + `chrome.tabs.query()` on next wake.
- **`PendingEvent.source` spans `'chrome' | 'sidebar'`.** Sidebar commands (from `bus.send`) carry a `correlationId: string` and ride the same FIFO. The drain tail emits one `'lunma/command-ack'` per sidebar command, separate from the state broadcast (different concerns, different fan-out). Future capabilities (options page, Arcify importer) extend the union with their own `source` values.
- **Saved tabs are Lunma-owned (ADR 0005), so the coordinator observes no `chrome.bookmarks.*` events.** `makeThisHome` updates `originalURL` in state only — no Chrome write, so no self-tagging/echo-suppression registry is needed. `createSpace` mints a Lunma record (`store.createSpace`) rather than creating a bookmark folder.
- **No `flush()` / `markDirty()`.** The `typed-message-bus` change removed both escape hatches. SW-internal mutations either ride the bus (sidebar-shaped) or run during boot before listeners are registered.

```
SW boot order:
  registerChromeListeners()                   ← SYNCHRONOUS, first turn (enqueue deferred)
  installBusAdapter(coordinator, bootReady)    ← SYNCHRONOUS, first turn (enqueue deferred)
  bootReady = loadState → runRestartRecovery → ensureAtLeastOneSpace → purgeExpiredTrash
    → seedExistingWindows → seedExistingTabs + rebuildLiveTabs (one chrome.tabs.query({}))
    → reconcileTabGroupsOnBoot   (fresh install: convert groups→Spaces; then adopt restored groups + materialize the active Space's group)
    → persist(store.snapshot())
    → registerStateSnapshotHandler   (post-boot: answers with the loaded snapshot)
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

`reconcileTabGroupsOnBoot(store, freshInstall)` (`src/background/tab-group-adoption.ts`,
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
`tabGroups.onUpdated`, `windows.onCreated`, `windows.onRemoved`, and
`commands.onCommand`. `tabs.onActivated` (added by
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
(`src/background/state-snapshot-handler.ts`) never enqueues, never mutates,
never persists, and never broadcasts.

The **launcher-suggestions channel** is the second instance of this pattern
(`launcher-v1`). A surface sends `'lunma/launcher-suggestions-request'
{ requestId, query, windowId }`; the handler
(`src/background/launcher-suggestions-handler.ts`,
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
`src/shared/messages.ts`) is registered **synchronously at SW top-level** — it
reads no store state (unlike the snapshot/suggestions handlers, which register
post-boot), and an `Alt+L`-triggered request can be the very message that wakes
a dormant SW, so the listener must be present in the first turn. Pure-read:
never enqueues, mutates, persists, or broadcasts.

### Component library (`src/ui/`)

Cross-surface UI primitives (e.g. `SpaceIcon`, `Tooltip`, `Stack`,
`TabRowMenu`) and design tokens (`src/ui/tokens.css`) live in `src/ui/`.
Feature components compose primitives; they do not re-roll buttons, tooltips,
etc. inline. Neutral
tokens are OKLCH expressions parameterised by a `--base-hue` custom property,
laying the foundation for a future user-customisable base colour.

## Storage schema + migrations

```ts
// src/shared/schemas.ts
import { z } from 'zod';

const SpaceV1 = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  temporaryTabIds: z.array(z.number()),
  pinnedTabs: z.array(/* ... */),
});

export const StateV1 = z.object({
  schemaVersion: z.literal(1),
  spaces: z.array(SpaceV1),
  // ...
});

export type AppState = z.infer<typeof StateV1>;

export const migrations = [
  { from: 0, to: 1, migrate: (raw: unknown) => migrateV0toV1(raw) },
  // future migrations append here
];

export async function loadState(): Promise<AppState> {
  const rawSnapshot = await chrome.storage.local.get('lunma.state');
  const rawBytes = rawSnapshot['lunma.state'];   // capture once, never mutate

  let current: unknown = rawBytes;
  for (const m of migrations) {
    if ((current as any)?.schemaVersion === m.from) {
      current = await m.migrate(current);
    }
  }

  try {
    return StateV1.parse(current);
  } catch (err) {
    await quarantine(rawBytes, err);             // see below — quarantines the *original* bytes
    return EMPTY_STATE;
  }
}
```

`migrateV0toV1` reads imported Arcify v4 user data and transforms it into Lunma's schema. See `06-migration.md`.

### Corrupt-state quarantine contract

When Zod validation fails on load, Lunma preserves evidence of what failed so it can be inspected and recovered. The contract is precise:

```ts
async function quarantine(rawBytes: unknown, err: unknown) {
  const key = `__corrupt_backup_${new Date().toISOString()}`;
  await chrome.storage.local.set({
    [key]: {
      capturedAt: Date.now(),
      rawBytes,                                  // the EXACT bytes read from lunma.state
      zodIssues: (err as z.ZodError)?.issues ?? String(err),
    },
  });
  await chrome.storage.local.set({ 'lunma.state': EMPTY_STATE });
  log.error('corrupt state quarantined', { key, err });
}
```

Invariants the implementation MUST honor:

1. **Only on actual failure.** `__corrupt_backup_*` is written *exclusively* in the catch branch of `StateV1.parse(...)`. A successful load never writes a backup.
2. **The captured value is the original bytes**, taken from `chrome.storage.local.get('lunma.state')` before any migration ran — not the post-migration object, not `EMPTY_STATE`, not whatever ended up in the live `lunma.state` key after recovery.
3. **The backup key is metadata-tagged**, not a bare state blob. The stored object is `{ capturedAt, rawBytes, zodIssues }` so a future inspector can distinguish a quarantine entry from a live state entry at a glance.
4. **Live and backup never carry the same valid state.** If you ever observe `lunma.state` and a `__corrupt_backup_*` entry both containing identical valid-looking state, the implementation has a bug — either the quarantine fired on a non-corrupt load, or the live-state reset never ran.
5. **Sidebar surfaces a "data recovery needed" banner** whenever any `__corrupt_backup_*` key is present.

Test plan (Vitest): seed `chrome.storage.local['lunma.state']` with (a) valid V1 state, (b) malformed bytes, (c) V0 state missing required fields after migration. Assert: case (a) writes no backup; cases (b) and (c) write exactly one backup whose `rawBytes` deep-equals the seeded value and whose `zodIssues` is non-empty; the live `lunma.state` after recovery equals `EMPTY_STATE` in (b) and (c).

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

| Layer (`src/…`) | May import | Must NOT import |
|---|---|---|
| `shared` — foundation: `types`, `store`, `bus`, `messages`, `settings`, `schemas`, `migrations`, `logger`, `space-hue` (colour math), `icon-names`, `launcher-contract`, `window-id` | nothing else in `src/` | every other layer |
| `ui` — primitives + `tokens.css` | `shared` | `background`, any surface |
| `background` — service worker | `shared`, **`launcher/shared`** (the launcher engine) | `ui`, any surface, a launcher *page* |
| `sidebar`, `options` — feature surfaces | `ui`, `shared` | `background`, another surface |
| `launcher` — overlay + newtab + its `shared` engine | `ui`, `shared` (+ launcher-internal) | `background`, another surface |
| `content` — vanilla content scripts | `shared` | every other layer |

**The launcher-engine service edge.** `background` legitimately imports
`launcher/shared` (the result providers + scoring + `search-engine`) because the
launcher's result-ranking runs **server-side in the SW** — the overlay and newtab only
request suggestions over a channel (see "Both surfaces share the search engine via
`src/launcher/shared/`" above). So `launcher/shared` is a *service* consumed by both
the SW and the launcher surfaces — the one sanctioned exception to "background imports
`shared` only", encoded as a `!**/launcher/shared/**` negation in the `background`
rule. The pure launcher **result contract** (`ResultSource` / `LauncherResult` /
`Suggestions*` + `sourceBadgeLabel`) lives in `src/shared/launcher-contract.ts` so
`ui`, `shared`, and the SW reach it without depending on the launcher surface.

**The token/primitive contract** (primitives reference `src/ui/tokens.css`, never raw
values) is enforced for `font-size`/`z-index` by Stylelint (`pnpm lint:styles`); the
press-scale / control-height / feature-side parts stay a review-time convention. See
the `architecture-integrity` capability spec for the normative requirements.

## Logging

A `Logger` gated by a `debugLoggingEnabled` setting in `chrome.storage.sync`. Never use `console.*` directly in production paths.

```ts
// src/shared/logger.ts
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
