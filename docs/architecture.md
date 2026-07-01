# Architecture

The structural blueprint for Lunma: project layout, the store and coordinator
patterns, surface boundaries, the enforced import DAG, and the MV3 boot
sequence. This is the deepest contributor reference.

Three principles drive the design:

1. **State changes are serial.** One store class plus a single event
   coordinator means `spaces[]` is never mutated by two paths at once.
2. **Layers are honest about boundaries.** Chrome API code, business logic,
   storage, and DOM live in distinct modules with one-way dependencies.
3. **Storage is typed and versioned.** Every read passes a Zod schema.
   Migrations run on service-worker boot.

## Project layout

The repo is a pnpm workspace: the extension, the marketing site, and one shared
CSS-only design-token package. Every path below is load-bearing.

```
lunma/                              # pnpm workspace root (private)
├─ apps/
│  ├─ extension/                    # the Chrome MV3 extension — @lunma/extension
│  │  ├─ src/
│  │  │  ├─ shared/                 # cross-surface: types · schemas (+migrations) · store.svelte.ts · messages · settings · onboarding · logger · lens-filter.ts · i18n.ts (SW-safe locale resolver)
│  │  │  │  ├─ chrome/              # thin typed wrappers over chrome.* APIs
│  │  │  │  └─ paraglide/           # generated Paraglide runtime (committed, Biome-excluded; `pnpm gen:i18n`)
│  │  │  ├─ ui/                     # cross-surface primitives (build primitives, compose features)
│  │  │  │  ├─ Button.svelte        # …+ Icon · Tooltip · Kbd · SegmentedControl · TabRow · Menu (trigger: kebab|context)
│  │  │  │  ├─ SettingsCard.svelte  # …+ CardHeading · SettingText · InlineError (the shared options-card chrome)
│  │  │  │  └─ favicon.ts · index.ts   # design tokens come from @lunma/tokens (see packages/)
│  │  │  ├─ background/             # SW: index · coordinator (+ handlers/ slices · group-orchestrator · boundary-controller) · bus-adapter · *-handler · seed-* · (planned) auto-archive
│  │  │  ├─ sidebar/                # flat — feature components compose ui/ primitives
│  │  │  │  ├─ App.svelte · main.ts · PinnedTabs.svelte · TempTabs.svelte · SpaceSwitcher.svelte
│  │  │  │  └─ drag.svelte.ts       # custom pointer-drag controller
│  │  │  ├─ launcher/               # overlay (content script) + newtab (chrome_url_overrides) + lenspage + shared engine
│  │  │  │  ├─ overlay.ts · overlay.css
│  │  │  │  ├─ newtab/              # full Svelte page — empty-Space "home" (idle) + inline launcher search
│  │  │  │  ├─ lenspage/              # full Svelte page — one lens's read-only dashboard (vite rollupOptions.input entry)
│  │  │  │  └─ shared/              # SearchEngine, scoring, providers, result/query types
│  │  │  ├─ content/               # second declarative content script (tab-boundary.ts)
│  │  │  └─ options/               # Options.svelte (orchestrator) · BackupRestore · ConnectionsCard (Accounts + Feeds, one manager) · RecentlyArchived · ResultSourcesCard · ShortcutGuidanceCard · main.ts
│  │  ├─ catalog/                   # DEV-ONLY component catalog (ships nothing in the MV3 bundle) — a ui+shared-composing surface
│  │  │  ├─ Catalog.svelte · main.ts · index.html · catalog.css   # immersive shell: nav + aurora/glass stage + hue/intensity/reduced-motion toolbar
│  │  │  ├─ lib/                    # story.ts (StoryMeta · defineStory) · registry.ts (import.meta.glob auto-discovery + ?raw source) · controls.ts (live-controls schema) · Story.svelte (per-story layout: controls · API table · examples · source) · Variant.svelte · mock.ts
│  │  │  └─ stories/ui/             # one <Name>.stories.svelte per src/ui primitive (auto-discovered; composites carry extra realistic cells)
│  │  ├─ project.inlang/            # inlang project: baseLocale + locales + message-format plugin (single source of the locale set)
│  │  ├─ messages/                  # Paraglide message catalogs {locale}.json (en = source of truth); outside src/, read-at-runtime
│  │  ├─ public/manifest.json       # MV3 manifest — crxjs derives build entries from it (+ vite rollupOptions.input for lenspage)
│  │  ├─ public/_locales/           # native chrome.i18n catalogs {locale}/messages.json for the manifest / store listing (underscore locale codes)
│  │  ├─ e2e/                       # Playwright specs + fixtures (playwright.config.ts in apps/extension)
│  │  │                             # unit tests are co-located: src/**/*.test.ts (no top-level tests/)
│  │  ├─ vite.config.ts · svelte.config.js · tsconfig.json · stylelint.config.js · vitest.setup.ts
│  │  ├─ vite.catalog.config.ts · tsconfig.catalog.json   # sibling configs for the dev-only catalog (no crxjs; @→src alias; scoped typecheck)
│  │  └─ package.json               # @lunma/extension (build/test/lint/verify · catalog · verify:catalog scripts)
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
│  └─ tokens/                       # @lunma/tokens — CSS-only shared design language (no JS/TS, outside the import DAG)
│     ├─ tokens.css                 # design-token custom properties (OKLCH, parameterised by --base-hue)
│     ├─ fonts.css                  # @font-face for the two brand woff2 (the single source of truth)
│     ├─ recipes.css                # aurora / glass / glow recipes (pure CSS reading the tokens)
│     ├─ fonts/                     # MonaSans-Variable.woff2 · InstrumentSerif-Regular.woff2
│     └─ package.json               # exports: ./tokens.css · ./fonts.css · ./recipes.css
├─ openspec/                        # config.yaml · specs/ (one per capability) · changes/ (in-flight)
├─ docs/                            # this folder
├─ pnpm-workspace.yaml              # apps/* · packages/*
├─ biome.json                       # workspace-wide: the layer DAG + cross-app import guards
├─ package.json                     # workspace root (private; `pnpm -r verify` fans out to every package)
└─ README.md
```

## Surfaces

Lunma ships six surfaces. The sidebar and the service worker are the only two
that mutate the store. Everything else is read-only or settings-only.

| Surface | Owns | Reads from store | Writes to store |
|---|---|---|---|
| Background SW | Chrome event listeners, alarms, saved-tab bindings, auto-archive | yes (owns the store) | yes (invokes store methods directly) |
| Sidebar | DOM, user interaction, drag-drop | yes (subscriber via state broadcast) | yes (calls store methods through the SW message bridge); also mints accounts (`createAccount`) + writes a per-source token inline (`setAccountToken` via `shared/connectors.ts`) from the lens editor's "+ Connect an account" and a section's signed-out reconnect |
| Launcher overlay | `Alt+L` page injection, search UI | no (queries the suggestions channel) | no — dispatches `focusTab` / `focusSavedTab` / `openSavedTab` / `openUrl` over the bus |
| Launcher newtab | Empty-Space home (Space identity) + inline search | yes (read-only: snapshot + `state-broadcast`, like the sidebar) + queries the suggestions channel | no — dispatches result actions over the bus |
| Lens page | One lens's spacious read-only dashboard (`launcher/lenspage/`, `?folderId=…`) | yes (read-only: snapshot + `state-broadcast`, like newtab) + writes a per-source token inline (`setAccountToken`) when a section's signed-out reconnect is used | no — dispatches `openLensItem` / `openLensListing` / `refreshLens` / `setLensFilter` / `setLensArticleLayout` over the bus |
| Options | Settings UI + one **Connections** manager (`ConnectionsCard`: an Accounts group for auth Accounts with per-**source** PATs, and a Feeds group for rss Feeds with OPML import/export), via the shared `ui/ServiceConnectPicker` connect picker | reads `chrome.storage.sync` directly; reads `chrome.storage.local` for archived tabs, the persisted `AppState` (for `AppState.sources` + `pinnedBySpace` reach), and the `lunma.connectors` record | writes `chrome.storage.sync`; account entity over the bus (`createAccount`/`renameAccount`/`deleteAccount`); writes the per-`sourceId` token in `lunma.connectors` via `shared/connectors.ts` (`setAccountToken`) |
| Onboarding | Static content + open links (Planned) | no | no |

The lens page is opened/focused (one reused tab per window) by the
`openLensPage` SW command, which dedupes by querying tabs for the page
URL + `folderId` — no persisted binding. It is reached from the sidebar lens
folder header: the row body + chevron keep normal expand/collapse, and a
hover/focus-revealed "open as page" icon (`ui/FolderRow` gains an optional
`onOpenPage`; regular folders pass none) + the kebab item open the page. The
connection-first lens editor also opens it on **Create** (the editor client-mints
the lens id — `createLens.id`, mirroring `createAccount` — then dispatches
`openLensPage`). The page renders **by canonical entity** (lens-overview):
`LensPage` is a **single-lens** page — it renders the one lens its `?folderId`
opened (lens-to-lens navigation is the side panel's job, not a second in-page
rail), tinting `--lens-h` to the lens's owning-Space hue. It shows the lens's
identity row + scoped connection chips, a view router (overview ↔ the three
"All …" drill-downs), and the body. `OverviewPage` buckets items **per item** via
`entityForItem` (the
populated typed bag, NOT the source provider) — so ONE github section yields both
Change rows (PRs, the `change` bag) and Issue rows (issues, the `ticket` bag) — and
renders one section card per non-empty bucket in the order **Changes → Issues →
Reading → Other**: the Change row carries a synthesized CI verdict + an inline
linked-ticket chip (`refs[0]`); the Issues board (`IssuesBoard`) renders the
`Ticket` entity (priority/status/project, merging Jira + git issues); Reading
(`ReadingMagazine`) is the feed magazine. Status/verdict pills are the shared `ui/Chip` primitive (its `hue` token).
It is registered as a vite `rollupOptions.input` entry (not
`web_accessible_resources` — least privilege).

### Why the launcher overlay stays vanilla

The overlay content script (`launcher/overlay.ts`) runs on every page load on
`<all_urls>` at `document_start` and stays dormant until `Alt+L`. Its byte
budget is tight, so it carries no framework runtime:

- Plain TypeScript, a closed shadow DOM, and a constructable stylesheet derived
  from `@lunma/tokens/tokens.css`.
- It speaks the wire protocols directly (`chrome.runtime.sendMessage`) rather
  than importing the `bus` / `messages` modules, which would pull in the logger.
- It imports only `ui/favicon.ts` (the pure `faviconUrl` helper) — the one
  sanctioned `launcher/ → ui/` edge, exempt from the layer-DAG rule because
  `favicon.ts` is a pure function with no Svelte or DOM dependency.
- The shipped content-script chunk is roughly 3KB gzipped, under the 15KB
  budget.

Declarative content scripts inject only into tabs opened or reloaded after the
extension starts. Two SW mechanisms cover the gap:

- **On-demand injection.** The `toggle-launcher` handler injects the overlay
  via `chrome.scripting.executeScript` (behind the `scripting` permission) when
  the active tab has no receiver. `Alt+L` then works on already-open tabs
  without a reload. Pages Chrome forbids injecting (`chrome://`, the Web Store,
  extension pages) stay no-ops.
- **Backfill.** On `chrome.runtime.onInstalled` (install, update, reload), the
  SW backfills the overlay into every already-open `http(s)` tab.
  `backfillOverlayIntoOpenTabs()` (`apps/extension/src/background/overlay-injection.ts`)
  reuses `injectOverlay(tabId)`, registered synchronously in the first turn, so
  the page-level `Alt+L` keydown fallback works on existing tabs immediately.
  Re-injection is per-tab failure-isolated and idempotent via the overlay's
  `__lunmaLauncherInstalled` guard. This covers the common case where Chrome
  leaves the command keybinding unbound.

The open path also carries the active Space's colour so the immersive overlay
glows in it. The SW reads the focused window's active Space and attaches
additive, optional `spaceHue` / `spaceChroma` (OKLCH, via `colourToHue` /
`colourToChroma`) to the typed `LauncherToggleMessage` (`lunma/toggle-launcher`)
and to the `lunma/current-window` response (the keydown path). Both fields are
omitted when there is no active Space or it is neutral (`gray`), so the overlay
falls back to its default accent. An older SW sending neither field interoperates
with a newer overlay with no version gate.

### The pinned-tab boundary content script

A second declarative content script (`content/tab-boundary.ts`) follows the
same vanilla discipline:

- It runs on `<all_urls>` at `document_start` and stays dormant. It carries an
  install guard and one `runtime.onMessage` listener until the SW pushes it an
  allow-set for a bound, enforced pinned tab (`lunma/boundary-config`).
- While armed it intercepts only same-tab, unmodified, `http(s)` link clicks to
  off-allow hosts. It diverts them to the SW (`lunma/boundary-open-elsewhere` →
  the existing `openUrl`) so the pinned tab stays put.
- It imports only the pure `url-boundary` matcher, no Svelte and no logger, so
  the chunk stays tiny.
- Like the overlay, Chrome's post-load declarative injection cannot reach it on
  a pre-existing tab. The SW injects it on demand via
  `background/boundary-injection.ts`, selected from the manifest by filename
  (not array index), when a saved tab becomes bound and enforced.

### The new-tab page

The new-tab page (`launcher/newtab/`) is its own page and a full Svelte app. It
is a read-only state consumer for its idle home, exactly like the sidebar:

- `main.ts` resolves its window (`chrome.windows.getCurrent`) and seeds from a
  `state-request` snapshot with boot-retry backoff.
- `NewTab.svelte` stays live by subscribing to `state-broadcast`.
- For search it queries the launcher-suggestions channel and dispatches result
  actions over the bus (`focusTab` / `focusSavedTab` / `openSavedTab` /
  `openUrl`).

Both surfaces share the search engine via
`apps/extension/src/launcher/shared/`.

### Home-tab orchestration

A Chrome group cannot be empty and a window cannot be empty, so an empty Space
always forces a tab into existence. With Lunma owning the new-tab page, that
forced tab is the Space's **home tab**.

- The coordinator recognises a home tab by its live URL (`isNewTabUrl(url)` in
  `apps/extension/src/shared/new-tab.ts`, matching any Chromium fork's internal
  new-tab scheme — `chrome`/`edge`/`brave`://newtab — and the extension's
  resolved newtab URL).
- A home tab is a transient property of the live tab, never persisted. It is
  grouped into the active Space so the window shows it, but is never added to
  `tempTabIds`, so it stays unlisted in the sidebar's Temporary list.
- On `tabs.onUpdated` to a non-newtab URL it ceases to be a home tab and is
  adopted as an ordinary temporary tab.
- Empty-Space activation reuses the window's focused tab when it is already a
  home tab, else opens one. Leaving a Space whose only window tab is its home
  closes that home tab (the instance returns to `groupId === -1`). So visiting
  empty Spaces never accumulates blank tabs, and Clear lands cleanly on the home.

## Permissions and the runtime grant model

The manifest splits into what the core workspace needs at install and what each
optional capability requests in-context, the first time you reach for it.

| Tier | Permissions |
|---|---|
| Required `permissions` | `tabs`, `tabGroups`, `storage`, `sidePanel`, `alarms`, `scripting`, `favicon` |
| `optional_permissions` | `history`, `bookmarks` (the launcher's two suggestion providers) |
| `optional_host_permissions` | the connector SaaS hosts plus self-hosted fallbacks (see below) |

Notes on the required tier:

- `commands` is declared via the top-level `commands` key, not the `permissions`
  array.
- `favicon` is retained: Chrome's `_favicon/` page-URL endpoint
  (`ui/favicon.ts`, the favicon fallback for every tile and row) requires it.
- No `<all_urls>` host permission. The install prompt does not ask for
  all-sites, history, or bookmarks.

The `optional_host_permissions` set is `https://github.com/*`,
`https://api.github.com/*`, `https://gitlab.com/*`,
`https://api.bitbucket.org/*` (the Bitbucket Cloud API host),
`https://*.atlassian.net/*`, plus the self-hosted fallbacks `https://*/*` and
`http://*/*`, so an arbitrary user-entered connector `baseUrl` — including a
Bitbucket Server / Data Center host — can be requested at runtime.

**One foundation module.** All `chrome.permissions` access goes through
`shared/permissions.ts`: `hasApiPermission` / `requestApiPermission`,
`hasHostPermissions` / `requestHostPermissions` with all-granted-over-a-set
semantics, `originPatternForBaseUrl`, and `onPermissionsChange`. No `remove*` is
exported; revocation happens through Chrome's own UI and is observed. No other
module touches `chrome.permissions.*` directly, and a guard test asserts the
background never calls `request*`.

**The SW queries; surfaces request.** `chrome.permissions.request()` needs a
user gesture and is callable only from an extension-page context.
`chrome.permissions` is not exposed to content scripts at all.

- The service worker only `has*`-queries (gating connector fetches and the
  launcher's history and bookmarks providers) and observes `onPermissionsChange`
  to heal and refetch gated lenses without a reload. It never calls
  `request*`.
- Extension-page surfaces own the gesture-bound `request*` calls: the sidebar
  lens card and editor, the new-tab launcher, and the options Result
  sources section.
- The `Alt+L` overlay is a content script, so it cannot request inline. Its
  "Enable …" affordance sends `lunma/open-options-grant` to the SW, which opens
  the options Result sources control (`#result-sources`).

**Connector fetches are gated.** Each connector declares the origins it fetches
via `requiredOrigins(cfg)`, keyed by the shared, pure
`requiredOriginsForConfig(cfg)` in `shared/connector-origins.ts`, so the SW gate
and the surface request share one derivation. Surfaces cannot import
`background/connectors`. GitHub on github.com fetches `api.github.com`, a
different origin, so the gate requests `https://api.github.com/*`, never
`github.com`. A folder whose required origins are not all granted resolves to a
calm `needs-access` runtime state without a network request, ahead of the
connector's own `signed-out` auth check.

**The connector roster** (`background/connectors/`, registered in the closed
`CONNECTORS: Record<LensProvider, SourceConnector>` map) is `github`, `gitlab`,
`bitbucket`, `jira`, and `rss`. The three git forges (github/gitlab/bitbucket)
normalise PRs/MRs into the canonical `Change` entity; any of them in a lens'
source set derives `lensKind: 'review'`. **Bitbucket** (`bitbucket.ts`) covers
both deployments under one provider, branching on
`new URL(cfg.baseUrl).host === 'bitbucket.org'`:

- **Server / Data Center** (self-hosted) — REST root `{baseUrl}/rest/api/1.0`,
  fetched same-origin. Supports both `authored` and `review-requested` via the
  self-scoped `GET /dashboard/pull-requests?state=OPEN&role=AUTHOR|REVIEWER` (no
  identity lookup); reviewers are read inline from each PR's `reviewers[]`.
- **Cloud** (`bitbucket.org`) — REST root `https://api.bitbucket.org/2.0` (a
  distinct origin, so `requiredOrigins` targets `api.bitbucket.org`). The
  workspace-scoped, **authored-only** `GET
  /2.0/workspaces/{workspace}/pullrequests/{uuid}` is the only supported listing
  (the all-workspaces "PRs for a user" endpoint was removed by Atlassian); the
  caller `uuid` is resolved once per cycle via `GET /2.0/user` (cached by
  `sourceId`, not host — every Cloud account shares `bitbucket.org` but carries a
  distinct token), and because the collection omits reviewers the connector
  issues one bounded per-PR detail fetch (capped at `maxItems`) to populate the
  reviewer bag. A Cloud bitbucket account therefore carries a required
  **`workspace?` slug** on `SourceAccount` (the create boundary rejects a Cloud
  bitbucket account/lens missing it / carrying `review-requested`); a Server/DC
  account leaves it absent. Auth is **token-only** (`authMethods: ['pat']`,
  `Authorization: Bearer`, `credentials: 'omit'`) — Cloud's API host is not the
  `bitbucket.org` session origin, so there is no `session` rung.

**The broad-host constraint is not escaped.** The launcher overlay and the
pinned-tab boundary content scripts must stay on `<all_urls>` at
`document_start`: the launcher must be summonable on any page, and the boundary
must catch clicks before navigation. Broad content-script `matches` alone keep
the item in Chrome's broad-host manual-review tier. Least-privilege here buys a
calmer install prompt and connector hosts requested only when used, not an
escape from review.

## The store pattern (thin store)

```ts
// apps/extension/src/shared/store.svelte.ts
import type { AppState, SpaceId, WindowId } from './types';

const initial: AppState = {
  schemaVersion: SCHEMA_VERSION,
  spaces: [],                  // Space records: { id, name, color, icon } — Lunma-owned (ADR 0001)
  activeSpaceByWindow: {},
  spaceInstancesByWindow: {},  // { [windowId]: { [spaceId]: SpaceInstance } } — nested per (window, Space) (ADR 0002)
  tabBindings: {},             // { [savedTabId]: { [windowId]: tabId } } — per-window session-ephemeral binding (ADR 0003)
  savedTabs: {},               // { [savedTabId]: SavedTab } — Lunma-owned record map
  lastActivatedSpaceId: null,
  tabLastActivity: {},
  archivedTabs: [],
  trash: {},
  sources: {},                 // { [sourceId]: SourceAccount } — connected ACCOUNTS (connector-accounts).
                               //   SourceAccount = { id; provider:'gitlab'|'github'|'bitbucket'|'jira'|'rss'; baseUrl; name?; workspace? }
                               //   (workspace? carries a Cloud bitbucket workspace slug; absent otherwise)
                               //   — a first-class, broadcast-safe source identity carrying NO token (the
                               //     secret lives only in lunma.connectors, keyed by the same id). Lenses
                               //     reference accounts; one account may feed many lenses (many-to-many).
  pinnedBySpace: {},           // { [spaceId]: PinNode[] } — ordered tree of tab|folder|lens nodes
                               //   PinNode = { kind:'tab'; id }
                               //           | { kind:'folder'; id; name; icon; color; children: savedTabId[] }
                               //           | {  kind:'lens'; id; name; icon; sources: LensSourceRef[]; maxItems; hideRead; refreshMinutes; filter?: LensFilter; articleLayout?: 'grid'|'list' }
                               //               articleLayout — global-per-lens persisted Articles-section layout (persist-lens-article-layout).
                               //                 Absent ⇒ 'grid' (first-open default); written via the setLensArticleLayout bus command.
                               //                 Sits beside hideRead/filter as a durable per-lens reading preference.
                               //               LensFilter = { entities?: LensEntity[]; repos?: string[]; projects?: string[] }
                               //               — a global-per-lens persistent view filter (lens-view-filters). entities narrows by
                               //                 item type ('change'|'ticket'|'article'|'generic'); repos narrows Changes by
                               //                 host-qualified key `${host}/${owner}/${repo}`; projects narrows Issues by project key.
                               //                 All axes are AND'd; within an axis values are OR'd; absent or empty = identity.
                               //                 Applied in both surfaces: overview (applyLensFilter before bucketByEntity) and
                               //                 sidebar (displayItemsForSection before ENTITY_RANK sort and feed windowing).
                               //               LensSourceRef = { sourceId; queries: LensQuery[] }
                               //               — a REFERENCE to an AppState.sources account; `queries` is its set of
                               //                 canned filters (queue: non-empty; rss: []). resolvedConfigs(node, sources)
                               //                 resolves each ref against the accounts map and expands it over `queries[]`
                               //                 into per-filter ResolvedLensSource = { source; baseUrl; query?; sourceId; lensKind }
                               //                 (one fetch/section per filter); a dangling ref (account removed) yields none.
                               //   single-level (folder children are tab ids, never nested folders);
                               //   a lens node is connector CONFIG only — its displayed children are
                               //   ephemeral query results in lenses, never persisted on the node
  faviconRow: [],              // SavedTabId[] — flat, GLOBAL favicon-row favorites:
                               //   the ids whose SavedTab.spaceId === null (decoupled). Sibling to
                               //   pinnedBySpace, NOT keyed by Space; a record is in one XOR the other.
  smartItemBindings: {},       // { [folderId]: { [namespacedItemId]: { [windowId]: { tabId, allowGlob } } } }
                               //   namespacedItemId = "${sourceKey}:${nativeId}" (e.g. "acc-1:authored:42")
                               //   PERSISTED, IDS ONLY — work-sensitive payload stays off disk.
                               //   Heals SW restarts, prunes across browser restarts.
  liveTabsById: {},            // { [tabId]: LiveTab } — EPHEMERAL, stripped before persist
  lenses: {},            // { [folderId]: LensRuntime } — EPHEMERAL connector results,
                               //   LensRuntime = { sections: { [sourceKey]: LensSectionRuntime } }
                               //   LensSectionRuntime = { state: 'pending'|'ok'|'signed-out'|'error'|'needs-access'; items; fetchedAt }
                               //   stripped before persist like liveTabsById
};

export class LunmaStore {
  state = $state<AppState>(initial);

  activateSpace(windowId: WindowId, spaceId: SpaceId): void {
    this.state.activeSpaceByWindow[windowId] = spaceId;
    // Ensure THIS (window, Space) instance exists without discarding any other
    // Space's instance in the window — a window remembers every Space it has
    // instantiated, so switching away + back reuses its groupId + tempTabIds
    // (ADR 0002). The chrome.tabGroups side effects live in the coordinator.
    this.ensureInstance(windowId, spaceId);
    this.state.lastActivatedSpaceId = spaceId;
  }
  // ... one synchronous method per state transition
}
```

The active instance for a window is
`spaceInstancesByWindow[windowId]?.[activeSpaceByWindow[windowId]]`. A `groupId`
of `-1` means "no live Chrome group yet".

Materializing a Space as a real Chrome tab group is coordinator work, not store
work. Activating expands its group and collapses the others, new tabs join the
active group, and rename, recolour, and delete propagate to the group.
`apps/extension/src/background/tab-groups.ts` wraps every `chrome.tabGroups.*`
and `chrome.tabs.group|ungroup` call, and `coordinator.ts` sequences them
([ADR 0002](adr/0002-tab-group-materialization.md)). Store mutators stay
synchronous and chrome-free; `recordSpaceGroup` is the only group-related state
write.

Key properties:

- **Synchronous, void-returning mutators.** Every mutator is
  `(input: PlainData) => void`. The store does not chain promises, own a serial
  queue, or perform I/O.
- **No persist or broadcast on the store.** `Coordinator` owns both. The store
  constructor does not accept `persist` or `broadcast` options.
- **Property-level reactivity.** Methods mutate `$state` directly. Svelte 5's
  runes track property-level changes, so components re-render only the slices
  they read.
- **No Chrome objects as inputs.** Mutators accept only plain data. The
  coordinator handler resolves Chrome objects (`Tab`, `Window`) into plain
  values before calling the mutator.
- **Subscribers apply, never re-run.** Other surfaces (primarily the sidebar)
  subscribe via `chrome.runtime.onMessage`. The coordinator broadcasts the
  resulting state once per drain cycle, and subscribers apply it locally.
- **Direct, await-free tests.** Tests instantiate `new LunmaStore()` and call
  methods directly without `await`. Coverage is method-by-method.
- **`.svelte.ts` extension.** Svelte 5's `$state` rune is compiled outside
  `.svelte` files only when the filename ends in `.svelte.ts` or `.svelte.js`.

### Ephemeral state slices

`liveTabsById` and `lenses` are never persisted.

`AppState.liveTabsById: { [tabId]: LiveTab }` mirrors live Chrome-tab metadata
(`title`, `url`, `active`, `status: 'loading' | 'complete'`) so surfaces render
a tab list from the broadcast state alone.

- The SW maintains it via `syncLiveTab` (create/update), `removeLiveTab`
  (remove), and `setActiveTab` (activate).
- `persist()` strips it before writing, so the on-disk shape is unchanged with
  no schema-version bump.
- It is rebuilt from `chrome.tabs.query({})` via `store.rebuildLiveTabs(tabs)`
  at SW boot, after load and recovery and before listener registration, never
  read back from disk.

`AppState.lenses: { [folderId]: LensRuntime }` holds each
folder's live query results and fetch state, sectioned by per-filter source key.

- `LensRuntime = { sections: { [sourceKey]: LensSectionRuntime } }` —
  one entry per RESOLVED section (each `sources[]` instance × each of its
  `queries[]`, or a single section for an rss feed);
  `sourceKey = "${sourceId}:${query}"` for a queue section,
  `"${sourceId}"` for an rss section (keyed by the referenced account's id, so
  two accounts on the same host occupy distinct sections).
- `LensSectionRuntime = { state: 'pending'|'ok'|'signed-out'|'error'|'needs-access'; items: LensItem[]; fetchedAt: number | null }`.
- The coordinator drain writes it via `setLensSectionRuntime(folderId, sourceKey, runtime)`.
- `persist()` strips it alongside `liveTabsById`, so work-sensitive item titles
  never touch disk.
- Connector polls rebuild it after a SW restart. A cold start costs one quiet
  `pending` beat per section.

The persisted schema accepts both slices as `.optional()` so reads tolerate
their absence; the runtime `AppState` type keeps them required.

`smartItemBindings` is the deliberate contrast: per-(item, window) tab bindings
for activated results are persisted, but as ids only, never the item's URL or
title. `readPersistedState` migrates the stored state up to the current version,
then validates against the current-version schema, never a hardcoded older one
(which would reject the current nested-instance and `PinNode` shape and
spuriously quarantine every restart).

The temp list renders in `tempTabIds` array order and is user-reorderable via
the `reorderTemp` command; no `chrome.tabs.onMoved` listener is needed.

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
      await persist(store.state);     // persist() strips the ephemeral liveTabsById + lenses slices
      broadcastState('<batched>', store.state);
    }
  }
}
```

Key properties:

- **Single sequencer.** The coordinator module is the only path that mutates
  `$state`: `coordinator.ts`, its handler slices under `background/handlers/**`,
  and the orchestration collaborators `group-orchestrator.ts` and
  `boundary-controller.ts` it owns. Chrome listeners enqueue; the drain loop
  runs handlers one at a time.
- **Sliced handlers, slim core.** `coordinator.ts` is the queue core: enqueue,
  coalesce, drain, persist, broadcast, ack. The 48 handlers live in nine
  capability-grouped slices under `background/handlers/`, each a factory
  returning a typed `Pick<HandlersMap, …>` fragment. The core assembles them
  into one `HandlersMap`-typed object, so omitting any `kind` fails `tsc`. Every
  handler receives a small `HandlerContext`
  (`{ store, markDirty, runSideEffect, groups, boundary }`). The cross-cutting
  `chrome.tabGroups` and home-tab orchestration lives in `GroupOrchestrator`,
  the boundary I/O in `BoundaryController`, and the pure read predicates are
  free functions in `handlers/queries.ts`. A Biome `noRestrictedImports` rule
  keeps anything outside the coordinator module from importing the slices.
- **Coordinator owns I/O.** All `chrome.*` calls needed to resolve an event
  into plain data happen inside the handler. After the drain cycle empties,
  `persist` and `broadcast` fire at most once each; they are batched, not
  per-mutator.
- **Bounded queue, in-memory only.** Depth cap is 1000 with per-kind coalescing.
  Coalescing is replace or merge, declared per kind via `EventPolicy`.
  `tabs.onUpdated` and `tabGroups.onUpdated` merge: their queued payloads combine
  field-wise (incoming wins per field) rather than replacing, because Chrome's
  `changeInfo` is a partial delta. A `{ status: 'complete' }` event followed by
  a `{ favIconUrl }` event coalesces into `{ status: 'complete', favIconUrl }`,
  so a finished tab never keeps showing its loading spinner. Sidebar keyed kinds
  (`renameSpace`, `activateSpace`) stay replace / last-write-wins, since their
  payload is a complete intent. The queue is not persisted across SW
  termination; reconciliation runs via `runRestartRecovery` plus
  `chrome.tabs.query()` on next wake.
- **`PendingEvent.source` spans `'chrome' | 'sidebar'`.** Sidebar commands from
  `bus.send` carry a `correlationId: string` and ride the same FIFO. The drain
  tail emits one `'lunma/command-ack'` per sidebar command, separate from the
  state broadcast. Future capabilities (options page, the Arcify importer)
  extend the union with their own `source` values.
- **Saved tabs are Lunma-owned ([ADR 0001](adr/0001-drop-bookmark-backing.md)).**
  The coordinator observes no `chrome.bookmarks.*` events. `makeThisHome` updates
  `originalURL` in state only, with no Chrome write, so no self-tagging or
  echo-suppression registry is needed. `createSpace` mints a Lunma record
  (`store.createSpace`) rather than creating a bookmark folder.
- **No public `flush()` or `markDirty()`.** Neither escape hatch exists on the
  `Coordinator` surface. SW-internal mutations either ride the bus
  (sidebar-shaped) or run during boot before listeners are registered. The slice
  dirty signal is the internal `HandlerContext.markDirty()`, handed only to
  in-module slices and set imperatively so a mutate-then-await-throw handler
  still persists.

### Boot order

```
SW boot order:
  registerChromeListeners()                   ← SYNCHRONOUS, first turn (enqueue deferred)
  installBusAdapter(coordinator, bootReady)    ← SYNCHRONOUS, first turn (enqueue deferred)
  bootReady = loadState → runRestartRecovery → ensureAtLeastOneSpace → purgeExpiredTrash
    → seedExistingWindows → seedExistingTabs + rebuildLiveTabs (one chrome.tabs.query({}))
    → reconcileTabGroupsOnBoot   (fresh install: convert groups→Spaces; then adopt restored groups + materialize the active Space's group)
    → persist(store.snapshot())
    → reconcileTabOwnership           (ensures no temp tab is owned by two Spaces)
    → registerStateSnapshotHandler   (post-boot: answers with the loaded snapshot)
    → registerLauncherSuggestionsHandler   (post-boot: pure-read suggestions channel)
    → broadcast({ method: 'boot' })   (refresh an already-open sidebar after a wake)
```

`seedExistingTabs` adopts the tabs already open in each window into that
window's active Space as temporary tabs. `chrome.tabs.onCreated` only fires for
new tabs, and `onTabCreated` needs the window to already have a `spaceInstance`,
so without this pass the Temporary list would stay empty until the next Space
switch. It calls `store.ensureSpaceInstance(windowId)` (creates an empty
instance for the active Space without touching `lastActivatedSpaceId`), then
`store.onTabCreated(...)` per open tab. It skips bound, duplicate, and home tabs
(`isNewTabUrl(tab.url)`, since a home tab is never a temporary tab), and shares
the single `chrome.tabs.query({})` result with `rebuildLiveTabs`.

### Boot group reconciliation

`reconcileTabGroupsOnBoot(store, freshInstall)`
(`apps/extension/src/background/tab-group-adoption.ts`) runs once after the tab
seed and before the boot persist/broadcast, so the boot broadcast carries the
reconciled `groupId`s. `freshInstall` means no Spaces were loaded from storage,
captured before `ensureAtLeastOneSpace` mints the Default.

1. **Convert (fresh install only).** Mint a Space per existing Chrome group
   (`group.title` → name, `fromGroupColor(group.color)` → colour), move the
   group's tabs out of the Default into the new Space's instance
   (`store.assignSpaceTabs`), fold same-title-and-colour groups across windows
   into one Space, activate the Space whose group holds each window's active
   tab, and discard the emptied Default (`store.removeEmptySpace`). So a
   first-run user's existing groups show up as Spaces rather than collapsing into
   one Default.
2. **Adopt.** Group and tab ids are session-scoped, so a browser restart hands
   Lunma's tracked groups new ids. The pass adopts each restored Chrome group
   into the Space it most likely belongs to. The pure
   `matchGroupToSpace(group, candidates)` scores tab-membership overlap with the
   instance's persisted `tempTabIds` first, then persisted title and colour as a
   tiebreaker, and re-binds the instance's `groupId` via
   `store.recordSpaceGroup` (state only, no `chrome.tabGroups` call, so it never
   fights Chrome's restored layout). A group matching no Space (the user's own)
   is left untouched.
3. **Materialize.** For each window's active Space that has open tabs but still
   `groupId === -1`, group the Space's window tab set via the `tab-groups.ts`
   helpers, title and recolour it, and best-effort collapse the window's other
   tracked groups.

Boot never opens a tab and never changes focus. An empty active Space stays
groupless until its first tab.

### Registered Chrome listeners

The registered listeners are `tabs.onCreated`, `tabs.onRemoved`,
`tabs.onUpdated`, `tabs.onActivated`, `tabGroups.onRemoved`,
`tabGroups.onUpdated`, `windows.onCreated`, `windows.onRemoved`,
`commands.onCommand`, and `alarms.onAlarm`.

- **`alarms.onAlarm`** drives the auto-archive sweep. The listener is always
  registered, but the sweep alarm itself is created only while
  `autoArchiveEnabled` is on, at a period derived from the idle threshold
  (`max(1, floor(autoArchiveIdleMinutes / 2))` minutes), and cleared when
  disabled. A disabled user pays no per-wake SW cost.
- **`tabs.onActivated`** drives `setActiveTab` so the temp list highlights the
  focused tab.
- **`tabs.onCreated` / `tabs.onUpdated`** also feed `syncLiveTab`, and
  `tabs.onRemoved` feeds `removeLiveTab`, to maintain `liveTabsById`.
- **`tabGroups.onRemoved` / `tabGroups.onUpdated`** are non-destructive lifecycle
  hints. `onRemoved` for a Lunma-tracked group calls
  `store.forgetSpaceGroup(groupId)`, which resets the instance to
  `groupId === -1` while keeping the Space and its pins; ungrouping never deletes
  a Space. `onUpdated` mirrors a title change back onto the Space name via
  `store.renameSpace`, guarded so a Lunma-initiated retitle does not loop; colour
  and collapse changes are ignored. Because Space names are unique, a Chrome-side
  rename to a title another Space already uses would make `store.renameSpace`
  throw. So the mirror first resolves the title through `disambiguateSpaceName`
  and, when that yields a different name, re-titles the live Chrome group to the
  disambiguated name (`updateGroupTitleColor`) so group and record stay in
  lockstep. The mirror never throws the drain. Untracked groups are ignored by
  both.
- **`commands.onCommand`** is the keyboard event source for the `pin-active-tab`
  command (`Alt`/`Option+D`). It resolves the focused window's active tab via
  `chrome.tabs.query({ active: true, lastFocusedWindow: true })`, feeds it
  through the pure `resolvePinActiveTab(store, tab)` resolver, and enqueues a
  sidebar-shaped `pinTab` event (synthetic `correlationId`; its ack has no bus
  client and is harmlessly dropped).

There is no `onMoved` listener; temp ordering is a manual `tempTabIds` array
order, reordered via `reorderTemp`. There is no bookmark bootstrap:
Spaces and saved tabs are Lunma-owned records, so boot loads state, rebinds live
tabs to saved tabs by URL, seeds a Default Space if none exist, purges expired
trash, then persists.

### Wake-up delivery (MV3)

MV3 routes the message or event that wakes a dormant SW only to listeners
present in the SW's first synchronous turn. A listener added after an `await`
misses the wake event: the sidebar sees "Receiving end does not exist" for
commands, or the Chrome event is silently dropped. So:

- The wake-critical listeners, the bus adapter and the `chrome.*` event
  listeners, are registered synchronously in the first turn.
- Each defers its `coordinator.enqueue` until `bootReady` resolves, preserving
  the boot-mutations-first guarantee and arrival order. Deferring the enqueue
  rather than the registration means boot-time Chrome events are queued and run
  after boot on the reconciled state (handlers are idempotent against the boot
  seed) instead of being dropped.
- The snapshot handler stays post-boot, since it must answer with the loaded
  snapshot, not the empty default.
- Boot emits one `broadcast({ method: 'boot' })` so a sidebar already open when
  the SW woke picks up the reconciled state.

See `openspec/specs/chrome-event-coordination/spec.md` and
`openspec/specs/typed-message-bus/spec.md` for the normative requirements.

### Read-side channels (parallel to the queue)

The coordinator queue is for mutations. Pure reads flow over separate
request/response channels. None of these handlers enqueues, mutates, persists,
or broadcasts.

| Channel | Request → Response | Handler | Registered |
|---|---|---|---|
| State snapshot | `lunma/state-request` → `lunma/state-snapshot` (`store.snapshot()`) | `background/state-snapshot-handler.ts` | post-boot |
| Launcher suggestions | `lunma/launcher-suggestions-request` `{ requestId, query, windowId }` → `lunma/launcher-suggestions-response` `{ requestId, results }` | `background/launcher-suggestions-handler.ts`, `registerLauncherSuggestionsHandler(store)` | post-boot |
| Current window | `lunma/current-window` → `lunma/current-window-result` `{ windowId }` | `respondWithCurrentWindow()` in `shared/messages.ts` | SW top-level (first turn) |

- The **launcher-suggestions** handler sources the four launcher providers:
  saved tabs from `store.state`, and open tabs, bookmarks, and history via
  read-only Chrome APIs. It runs `runSearch` and echoes `requestId` so a surface
  drops stale out-of-order responses (latest-wins). It runs independently of the
  queue, so a response never blocks on an in-flight drain.
- The **current-window** handler answers the launcher overlay's `Alt+L` keydown
  fallback, which has no SW message payload to read its `windowId` from (content
  scripts cannot call `chrome.windows`). It replies from
  `sender.tab?.windowId ?? -1`. It reads no store state, so it registers
  synchronously at SW top-level. An `Alt+L`-triggered request can be the very
  message that wakes a dormant SW, so the listener must be present in the first
  turn.

## Component library (`apps/extension/src/ui/`)

Cross-surface UI primitives such as `SpaceIcon`, `Tooltip`, `Kbd`, and `Menu`
(one bits-ui action menu with a `trigger: 'kebab' | 'context'`) live in
`apps/extension/src/ui/`. `Chip` carries an optional `hue`/`size` for hue-tinted
status/verdict tokens. The options page's shared
card chrome is primitives too — `SettingsCard` (the glass-`Surface` scaffold),
`CardHeading` (the editorial serif heading + its `data-tint` identity-hue
override), `SettingText` (the label/description column), and `InlineError` (the
`role="alert"` danger box) — so every options card composes them instead of
re-rolling its heading or error box. The design tokens they
reference live in the shared `@lunma/tokens` package
(`packages/tokens/tokens.css`), imported at each surface's CSS entry. Feature
components compose primitives; they do not re-roll buttons or tooltips inline.
Neutral tokens are OKLCH expressions parameterised by a `--base-hue` custom
property, the foundation for a future user-customisable base colour.

**Prop convention — `label` vs `ariaLabel`.** Across `src/ui/` primitives, `label`
means *visible text that doubles as the accessible name* (e.g. `TextInput`,
`RowButton`), while `ariaLabel` means a *name-only* value with no visible text
(e.g. `IconButton`, `Select`, `Menu`, `FolderRow`, `LensRow`). A prop used solely
as an accessible-name override is named `ariaLabel`, never `label`.

## Internationalization (i18n)

Lunma localizes its UI with `@inlang/paraglide-js` (a *compiler*-based i18n
library — see [tech-stack](tech-stack.md)) and the native `chrome.i18n`
mechanism for the manifest. Two independent catalogs, one resolver.

**Message catalog + generated runtime.** UI strings live in per-locale
`apps/extension/messages/{locale}.json` (`en` is the source of truth), *outside*
`src/` so they stay out of the TypeScript/Biome/Stylelint globs. `pnpm gen:i18n`
(`paraglide-js compile`, prepended to `dev`/`build` like `gen:icons`) compiles
them into `apps/extension/src/shared/paraglide/` — **committed and
Biome-excluded**, mirroring the `src/ui/icon-loaders.generated.ts` precedent so
standalone `tsc`/`svelte-check` (which run outside Vite) see its `.d.ts`. Living
under `shared/`, the generated runtime imports nothing from other layers, so the
import DAG stays legal. The supported-locale *set* exists once in
`project.inlang/settings.json` and flows to the generated `locales` constant,
from which `SupportedLocale` (in `shared/settings.ts`) derives — a `shared →
shared` edge, no cycle; a parity test (`src/i18n-locale-set.test.ts`) asserts the
three never drift.

**The SW-safe locale resolver (`shared/i18n.ts`).** This module is the single
source of truth for locale *state*; surfaces never call the generated runtime's
locale APIs directly. Paraglide's `getLocale()` is synchronous, but Lunma's
source of truth — the `language` setting in `chrome.storage.sync` — is async.
The bridge is a custom Paraglide strategy `custom-lunmaSettings` (registered at
module load, strategy array `['custom-lunmaSettings', 'baseLocale']` **only**)
whose synchronous `getLocale()` returns an in-memory `cached` locale that
`initLocale()` seeds — awaiting the settings read — inside each surface's
pre-`mount()` boot (sidebar/new-tab already have one; `options/main.ts` was
restructured into an async boot for this). The default `url`/`cookie`/
`localStorage` strategies touch `window`/`document`/`localStorage` and would
throw in the service worker, so they are deliberately excluded; the resolver uses
only `chrome.i18n.getUILanguage()` / `navigator.language` (both SW-safe). The
`language` setting defaults to `'auto'`, resolved to the nearest supported locale
(`pt-BR`/`pt-PT → pt`, `zh-TW → zh-CN`, …, `en` as terminal fallback) on first run.
Changing the language persists via `setLocale` (`{ reload: false }`) and each
surface's `watchSettings` callback reloads **only on a `language` delta** — every
other setting keeps applying live, as before.

**Native manifest / store-listing localization.** A library cannot localize the
manifest, so `public/manifest.json` declares `default_locale: "en"` and
references `description`, `action.default_title`, and the two command
descriptions as `__MSG_*__` placeholders, resolved from
`public/_locales/{locale}/messages.json` (Chrome uses underscore locale codes —
`zh_CN`; region-neutral `pt` has no hyphen). crxjs passes `public/` through
verbatim. Brand `name` /
`short_name` ("Lunma") stay literal. A parity test (`src/i18n-parity.test.ts`)
guards both the Paraglide and `_locales` catalogs for key-completeness.

**Rendering contract (surfaces).** Every user-facing string in the sidebar,
launcher (new-tab + lens pages), and options surfaces renders through a Paraglide
message function `m.*()` (imported from `shared/paraglide/messages`), never a
literal. Locale *state* still comes only from `shared/i18n.ts`; message
*rendering* uses `m.*` directly — the state-vs-rendering split. Messages are
keyed flat and surface-namespaced (`sidebar_*`, `launcher_*`, `options_*`, plus
shared `common_*` / `entity_*`); ICU plurals use the inlang **variant** form (an
array with `declarations`/`selectors`/`match`, per-locale CLDR categories), not
inline `{count, plural, …}` (which the message-format plugin does not parse).

**Settings labels without a `settings → i18n` edge.** The settings control
labels/descriptions are localized through `options/labels.ts`
(`settingLabel`/`settingDescription`/`groupLabel`/`groupIntro` → `m.*`), consumed
by `Options.svelte`. This indirection lives in `options/` on purpose:
`shared/settings.ts` imports no catalog, so the `settings ↔ i18n` cycle the
foundation banned never forms (`biome check`'s `noImportCycles` is the backstop).
The `language` setting's endonym option labels stay literal.

**Overlay localization (Plan B).** The `Alt+L` launcher overlay (`overlay.ts`) is
a vanilla content script under a <15KB budget with no synchronous locale access,
so it does NOT import Paraglide. Instead it requests its strings from the SW
(`lunma/overlay-labels-request` → `OverlayLabels`, in `launcher-contract.ts`); the
SW resolves the locale (`initLocale()`) and renders the strings via
`background/overlay-labels.ts`'s `m.launcher_overlay_*`. The overlay keeps
English-literal fallbacks (never blanks) and fills the one `{engine}` template
with a string-replace. The overlay budget guard stays green (no Paraglide import).

**Enforcement (`src/i18n-no-literal.test.ts`).** A Vitest guard rides `verify`:
it parses every shipping surface `.svelte` template (Svelte compiler AST) and
fails on a user-visible literal — text nodes AND user-facing attribute /
component-prop literals (`placeholder`/`title`/`aria-label`/`ariaLabel`/`alt`/
`heading`/`label`/`description`/`subtitle`) — outside an allowlist
(whitespace/symbol-only, brand "Lunma", `code`/`pre`) and an inline
`<!-- i18n-exempt: reason -->` hatch (exempts an element's subtree). Missing-key
enforcement is `tsc`'s job: the generated `m` namespace is typed, so
`m.bogusKey()` is a compile error. Out of guard scope (review-only): literal
strings in `<script>` logic (option labels, toasts).

## Storage schema and migrations

State is persisted to `chrome.storage.local` under the key `lunma.state` as a
versioned envelope `{ schemaVersion, state }`. The current version is **schema
v9** (`CURRENT_SCHEMA_VERSION = 9` in `apps/extension/src/shared/schemas.ts`),
validated against `AppStateV9Schema` (type `AppStateV9`).

The migration list (`apps/extension/src/shared/migrations.ts`) has eight entries.
Each migration is `{ toVersion: number; migrate: (raw: unknown) => unknown }`.
Migrations to v2 through v6 are pure pass-throughs (`migrate: (raw) => raw`); the
schema widened but old data needs no transformation:

| `toVersion` | Change |
|---|---|
| 2 | widened the `PinNode` union with the `lens` kind |
| 3 | widened the lens node's `source` to `'gitlab' \| 'github'` |
| 4 | added the persisted ids-only `smartItemBindings` slice (parses via its `.default({})`) |
| 5 | widened the lens node's `source` to `'gitlab' \| 'github' \| 'jira'` |
| 6 | widened the lens node again |
| 7 | reshaped each `lensItemBindings` slot from a bare `tabId` number into `{ tabId, allowGlob: '' }` |
| 8 | replaced the flat `source`/`baseUrl`/`query?` on each lens node with `sources: [{ source, baseUrl, query }]`; re-keyed `lensItemBindings` item ids to `"${sourceKey}:${nativeId}"` |
| 9 | rewrote each `sources[]` entry from the flat `query?` shape to `queries: LensQuery[]` (queue → `[query]`, rss → `[]`); re-keyed `lensItemBindings` from `"${source}:${host}:${nativeId}"` to the per-filter `"${source}:${host}:${query}:${nativeId}"` (orphans dropped) |
| 13 | extracted each lens node's embedded `sources: LensSource[]` into first-class `SourceAccount`s under a new `AppState.sources` map (one per distinct `(provider, baseUrl)`, deduped, `name` carried onto the account) and rewrote each lens's `sources` to `LensSourceRef[]` (`{ sourceId, queries }`). The separate, unversioned `lunma.connectors` secrets store is re-keyed host→`sourceId` by the boot-chain `reconcileAccountSecrets` step (NOT the pure migrate fn) |
| 14 | additive: the lens node gains an optional `filter?: LensFilter` (lens-view-filters). Pre-v14 nodes simply lack it; identity pass-through |
| 15 | re-keyed lens sections by account `sourceId`: rewrote `lensItemBindings` keys AND `lensReadState` ids from `"${source}:${host}:${query}:${nativeId}"` (rss: `"${source}:${host}:${nativeId}"`) to `"${sourceId}:${query}:${nativeId}"` (rss: `"${sourceId}:${nativeId}"`), resolving each legacy id match-first by **longest** account prefix (port-bearing host carried; a blind `split(':')` is unsafe — host carries ports, rss nativeIds are URLs); unmappable / same-origin-ambiguous ids are dropped (a binding re-arms, a read mark reappears unread once). Idempotent |
| 16 | widened `LensProvider` with `'bitbucket'` and added the optional `workspace?` field to `SourceAccount` (both in the shared `SourceAccountSchema`); pure identity pass-through (`(raw) => raw`) — additive, no data transform |
| 17 | additive: the lens node gains an optional `articleLayout?: 'grid'\|'list'` (persist-lens-article-layout). Pre-v17 nodes simply lack it (resolving to the `grid` default); identity pass-through |

The v7 migration walks `smartItemBindings[folderId][itemId][windowId]` and
rewrites any numeric slot to `{ tabId, allowGlob: '' }`. The v8 migration wraps
each lens node's flat `source`/`baseUrl`/`query?` into `sources: [cfg]` and
re-keys item ids with the source namespace; orphaned folderId entries (no
matching lens node) are dropped defensively.

Each bump is deliberate even when the transform is a no-op: it makes a downgrade
detectable. An older build reading newer data quarantines on the version gate
instead of Zod-rejecting unfamiliar nodes or fields with a confusing parse error.
The list is append-only.

`readPersistedState()` (`apps/extension/src/shared/chrome/storage.ts`) handles
every read:

1. Reads `lunma.state` with bounded retry (up to 3 attempts). A sustained read
   failure returns `{ kind: 'unavailable' }`; this path never overwrites on-disk
   state.
2. An absent key returns `{ kind: 'empty' }` (first install).
3. Validates the envelope's `schemaVersion`. An invalid version quarantines the
   raw bytes and returns `{ kind: 'corrupt' }`.
4. Runs `runMigrations(persistedState, persistedVersion)`. A thrown migration
   quarantines and returns `{ kind: 'corrupt' }`.
5. Runs `AppStateV8Schema.safeParse(migrated)`. On success, de-duplicates ids
   (`dedupePersistedState`) and self-heals by writing the cleaned envelope back
   when the version migrated up or duplicates were removed. Returns
   `{ kind: 'ok', state }`.
6. On parse failure, attempts per-slice salvage (`salvagePersistedState`).
   `spaces` is salvaged element-wise (each individually-valid Space kept, corrupt
   entries dropped); every other top-level slice is salvaged slice-wise (kept
   when valid, defaulted otherwise). The raw bytes are always quarantined
   regardless of salvage outcome. If salvage succeeds, the salvaged state is
   de-duped, written back, and returned as `{ kind: 'salvaged', state }`. If
   salvage returns null, returns `{ kind: 'corrupt' }`.

### Quarantine contract

A quarantine entry is written to `chrome.storage.local` under a key prefixed
`__corrupt_backup_`. At most 10 entries are retained, oldest pruned on each new
write. Each entry has this shape:

```ts
interface QuarantineRecord {
  capturedAt: number;    // Date.now() at quarantine time
  reason: string;        // human-readable failure reason
  error?: string;        // error message when a migration threw
  zodIssues?: unknown;   // Zod parse issues when schema validation failed
  rawBytes: unknown;     // the EXACT envelope bytes read from chrome.storage.local — never the post-migration value
}
```

The captured `rawBytes` is always the original envelope read from disk, before
any migration ran. A quarantine entry is written only on actual failure: an
invalid schema version, a thrown migration, or a failed parse. A successful load
never writes one.

## Enforced boundaries

Principle 2 ("layers are honest about boundaries") is mechanically enforced, not
just documented. The source tree is a one-way dependency DAG, and `biome check`
fails on any import that violates it: per-layer `noRestrictedImports` overrides
plus `noImportCycles` in `biome.json`. Biome 2.4 lints inside `.svelte`
`<script>` blocks, so the Svelte-heavy `ui` layer is covered and no separate
import-graph tool is needed.

| Layer (`apps/extension/src/…`) | May import | Must NOT import |
|---|---|---|
| `shared` — foundation: `types`, `store`, `bus`, `messages`, `settings`, `schemas`, `migrations`, `logger`, `space-hue` (colour math), `icon-names`, `launcher-contract`, `window-id`, `lens-filter` (pure filter predicate + facet derivation, shared by both surfaces so no DAG violation) | nothing else in `apps/extension/src/` | every other layer |
| `ui` — primitives (design tokens come from `@lunma/tokens`) | `shared` | `background`, any surface |
| `background` — service worker | `shared`, `launcher/shared` (the launcher engine) | `ui`, any surface, a launcher page |
| `sidebar`, `options` — feature surfaces | `ui`, `shared` | `background`, another surface |
| `launcher` — overlay + newtab surface | `ui`, `shared` (+ launcher-internal) | `background`, another surface |
| `launcher/shared` — the launcher search engine (SW-imported), shared-grade | `shared` (+ intra-`launcher/shared`) | `ui`, any surface |
| `content` — vanilla content scripts | `shared` | every other layer |
| `catalog` (`apps/extension/catalog/**`, outside `src/` — the dev-only component catalog) | `ui`, `shared` (via the `@`→`src` alias) | `background`, `content`, another surface (`sidebar`/`launcher`/`options`), `apps/site` |

### The launcher-engine service edge

`background` legitimately imports `launcher/shared` (the result providers,
scoring, and `search-engine`) because the launcher's result-ranking runs in the
SW. The overlay and newtab only request suggestions over a channel. So
`launcher/shared` is a service consumed by both the SW and the launcher
surfaces, the one sanctioned exception to "background imports `shared` only",
encoded as a `!**/launcher/shared/**` negation in the `background` rule.

Because the SW transitively depends on this engine, `launcher/shared` is held to
shared-grade imports by a dedicated `apps/extension/src/launcher/shared/**`
override: it may import `shared` (plus its own internals) but not `ui` or another
surface, so no DOM-coupled component code reaches the SW bundle through it. That
override restates the cross-surface bans rather than only adding `ui`, because
Biome's per-rule override options replace rather than union for the overlapping
`launcher/**` glob. The gate catches module imports; direct `document` or
`window` use inside the engine is not an import and stays a review-time concern.

The pure launcher result contract (`ResultSource`, `LauncherResult`,
`Suggestions*`, and `sourceBadgeLabel`) lives in
`apps/extension/src/shared/launcher-contract.ts` so `ui`, `shared`, and the SW
reach it without depending on the launcher surface.

### The token and primitive contract

Primitives reference the `@lunma/tokens` custom properties, never raw values.
Stylelint enforces this for `font-size` and `z-index` (`pnpm lint:styles`,
scoped to `apps/extension/src/ui`); the press-scale, control-height, and
feature-side parts stay a review-time convention. The gate also runs
`svelte-check` (`pnpm check`) for `.svelte` type coverage that `tsc --noEmit`
cannot observe: template bindings and component prop contracts. See the
`architecture-integrity` capability spec for the normative requirements.

### The dev-only component catalog

`apps/extension/catalog/` is a dev surface — a browsable matrix of every `src/ui`
primitive rendered against the live aurora/glass backdrop with Space-hue,
colour-intensity, reduced-motion, and light/dark theme toggles (the theme toggle
reuses the shared `applyThemeToDocument` helper). It runs on its own dev port
(`6006`) and its source-view panel is highlighted by `shiki` (the one dev-only
dependency the catalog adds; it ships nothing in the MV3 bundle). It is **governed by the same import
gate** as the in-`src` surfaces (a dedicated `apps/extension/catalog/**` Biome
`noRestrictedImports` override): it may compose `ui` + `shared` (via the
`@`→`src` alias) but not `background`, `content`, another feature surface, or
`apps/site`. It **ships nothing in the MV3 bundle** — a sibling
`vite.catalog.config.ts` (`root: catalog/`, no `@crxjs/vite-plugin`) builds it,
never referenced by `manifest.json` or `vite.config.ts`'s rollup input — and is
held to a parallel `verify:catalog` gate (typecheck against
`tsconfig.catalog.json`, Biome, svelte-check, stylelint) folded into `verify`.
Stories are auto-discovered via `import.meta.glob`, and a vitest guard
(`src/ui/stories-coverage.test.ts`) fails `verify` if a primitive lacks its
story. Each story renders through a catalog-owned `lib/Story.svelte` layout: a
**live preview** bound to editable **controls** (a hand-authored `meta.controls`
schema, since Svelte 5 has no runtime prop metadata), an **API table** derived
from that schema, the curated **examples** matrix, and a collapsible **source
view** (the story's own `?raw` source). See the `component-catalog` capability
spec for the normative requirements.

### Workspace package boundaries

Beyond the extension's internal DAG, the workspace adds one boundary: `apps/site`
and `apps/extension` must not import each other. It holds for free, since there
is no dependency edge between the two app packages, and is additionally gated by
a Biome `noRestrictedImports` rule both ways: `biome check` fails on a planted
cross-app import, exactly like an intra-DAG planted violation.

The single shared package, `@lunma/tokens` (`packages/tokens`), is CSS-only:

- Design-token custom properties, including the canonical nine-colour Space
  palette as per-colour `--space-<color>-l/-c/-h` components plus the resolved
  `--space-<color>-on` ink. This is the single cross-app source that the
  extension's `shared/space-hue.ts` mirrors under a parity test.
- The brand `@font-face` plus woff2.
- The aurora, glass, glow, Space-fill, and Space-scope (`--space-c` family)
  recipe classes.

It has no JS/TS entry, so it sits outside the import-layer DAG: a layer
referencing `@lunma/tokens` via a stylesheet import is not a boundary violation.
Both apps depend on it via `workspace:*`. The site composes the shared
tokens/recipes directly and builds its own marketing components; it never reaches
into the extension's `ui/` primitives, which are coupled to `shared`.

### Continuous integration

These boundary rules are enforced on every pull request and push to `main`, not
only locally. CI (`.github/workflows/ci.yml`) runs the same checks as
`pnpm -r verify`, fanned across parallel jobs (typecheck / lint / svelte-check /
styles / unit tests, plus a `site` job) behind a single aggregate `verify`
status check; its `lint` step (Biome) fails on a layer-DAG, import-cycle, or
cross-app violation, so `architecture-integrity` holds at the merge boundary. A
parallel `e2e` job runs the Playwright MV3 smoke under `xvfb-run`.

Merges to `main` are gated on green CI — `verify`, `e2e`, `dco`, and `identity` are required status checks enforced via a GitHub ruleset. See also the `release-engineering` capability.

### Continuous deployment

The marketing site (`apps/site`) is published to **Cloudflare Pages** from CI by
a **separate** workflow, `.github/workflows/deploy.yml` — distinct from the
read-only `verify`/`e2e` gate, which stays `contents: read`. The deploy is the
one workflow that holds a write-scoped credential (a Pages-scoped Cloudflare API
token, stored as a repo secret), so isolating it keeps that gate untouchable. It
builds the static output with the repo-pinned toolchain (no second build
environment) and runs `wrangler pages deploy apps/site/build` → `lunma.app`. This
is **build-time only**: nothing from `apps/site` or this deploy ships in the
extension bundle. It deploys **`main` only** (production) — no per-branch
previews (they would publish public, never-cleaned `*.pages.dev` URLs); it never
triggers on `pull_request` (so the token is never exposed to a fork PR). After a
production publish, a post-deploy smoke
asserts `lunma.app/` and `lunma.app/privacy` both serve `200` before the run is
green.

The served site is hardened from first paint: a strict same-origin
Content-Security-Policy (no `'unsafe-inline'` for scripts) is generated by
SvelteKit's `kit.csp` in **hash mode** (in `apps/site/svelte.config.js`), which
SHA-hashes SvelteKit's own inline hydration script at build time and emits the
policy as `<meta>` — the only prerender-compatible CSP mode. The headers a
`<meta>` cannot carry (HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`,
`Referrer-Policy`, `Permissions-Policy`) live in `apps/site/static/_headers`,
which Cloudflare Pages reads as config. (`style-src` carries a narrow,
documented `'unsafe-inline'` because the prerendered HTML uses inline `style=`
attributes for per-space colours, which CSP style-hashes cannot cover;
`script-src` stays strict.)

## Logging

A `Logger` gated by a `debugLoggingEnabled` setting in `chrome.storage.sync`.
Never use `console.*` directly in production paths.

```ts
// apps/extension/src/shared/logger.ts
const log = {
  debug: (msg, ctx) => { if (debugEnabled) console.debug('[lunma]', msg, ctx); },
  info:  (msg, ctx) => console.info('[lunma]', msg, ctx),
  warn:  (msg, ctx) => console.warn('[lunma]', msg, ctx),
  error: (msg, ctx) => console.error('[lunma]', msg, ctx),
};
```

## Error-handling discipline

- **No silent catches.** `catch (e) {}` is forbidden by lint config.
- **Every async boundary** (message handlers, SW listeners, storage reads) wraps
  in `try/catch` and routes through `log.error`.
- **Store methods never throw on invalid input.** Bad arguments (unknown ids,
  illegal transitions) log a warning via `log.error` and leave state unchanged.
- **Storage validation failures** fail loudly at the load boundary (Zod), never
  silently mid-flow.
```