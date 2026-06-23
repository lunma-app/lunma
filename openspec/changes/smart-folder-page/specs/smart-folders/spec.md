## ADDED Requirements

### Requirement: A smart folder has a full-page view

A smart folder SHALL have a dedicated full-page surface that is a **second read-only projection** of the `smartFolders` runtime slice (the first being the sidebar). The page SHALL live at `apps/extension/src/launcher/folderpage/` (`index.html`, `main.ts`, `FolderPage.svelte`, `folderpage.css`) and SHALL be registered as a build entrypoint via `build.rollupOptions.input` (keyed `folderpage`) in `apps/extension/vite.config.ts`, so it is reachable at `chrome-extension://<id>/src/launcher/folderpage/index.html`.

The page SHALL be registered **without** using `chrome_url_overrides` (that slot is the new-tab page and is left unchanged) and SHALL NOT be added to `web_accessible_resources` (the extension opens its own page directly; WAR would needlessly expose a state-mirroring page to all web origins). The target folder SHALL be carried as the `folderId` query parameter on the page URL. The page SHALL resolve **its own** `windowId` at boot via `getCurrentWindowId()` (as `newtab` does) rather than reading it from the URL, so a page tab dragged to another window mirrors the correct window's state.

`FolderPage.svelte` SHALL mirror SW state read-only exactly as `NewTab.svelte` does: an `initialState` snapshot requested with backoff at boot, then `liveState` from `onStateBroadcast`, and the active Space's `tint` applied to `data-tint`. The page SHALL NEVER write to or mutate `AppState`; all actions go through the existing message bus.

#### Scenario: The page loads for a folder at its extension URL

- **WHEN** a tab navigates to `chrome-extension://<id>/src/launcher/folderpage/index.html?folderId=f1`
- **THEN** `FolderPage.svelte` mounts, resolves its own `windowId` via `getCurrentWindowId()`, requests a state snapshot, and renders folder `f1` from `appState.smartFolders['f1']`

#### Scenario: The page tracks live broadcasts read-only

- **GIVEN** an open folder page mirroring folder `f1`
- **WHEN** a `state-broadcast` updates `f1`'s sections
- **THEN** the page re-renders from the new state and never writes back to `AppState`

### Requirement: Opening the smart-folder page reuses a per-window tab

A new command `openSmartFolderPage { spaceId, folderId, windowId }` SHALL open or focus the folder's page tab **per window**, handled beside `openSmartItem` in `background/handlers/smart-folders.ts`. The handler SHALL:
- compute the page URL `chrome.runtime.getURL('src/launcher/folderpage/index.html') + '?folderId=' + folderId`;
- **dedupe by query**: query the window's tabs and, when one already shows the folder-page path with a matching `folderId` query param, focus it via `chrome.tabs.update(tabId, { active: true })` (NO new tab);
- otherwise create the tab via `chrome.tabs.create({ url, windowId })` and add it to the Space's Chrome group (the same grouping `openSmartItem` performs).

There SHALL be **no persisted binding** for the page tab and **no schema migration** — the open tab is its own registry, so reuse self-heals across SW restarts. The command SHALL NOT dispatch `openUrl` (whose scheme hardening drops the `chrome-extension://` URL by design and is unchanged).

#### Scenario: Reopening focuses the existing page tab

- **GIVEN** folder `f1`'s page is already open in window 100
- **WHEN** `openSmartFolderPage { folderId: 'f1', windowId: 100 }` is dispatched
- **THEN** the existing page tab is focused via `chrome.tabs.update` and no second tab is created

#### Scenario: First open creates a grouped page tab

- **GIVEN** folder `f1` has no page tab in window 100
- **WHEN** `openSmartFolderPage { folderId: 'f1', windowId: 100 }` is dispatched
- **THEN** a tab is created at the folder-page URL with `?folderId=f1` and joins the active Space's Chrome group

#### Scenario: Reuse survives a service-worker restart

- **GIVEN** folder `f1`'s page tab is open in window 100 and the SW restarts (no persisted binding exists)
- **WHEN** `openSmartFolderPage { folderId: 'f1', windowId: 100 }` is dispatched after boot
- **THEN** the tab query finds the still-open page tab and focuses it rather than creating a duplicate

### Requirement: The folder page is a managed view, not a Temporary tab

The folder-page tab SHALL be treated like the new-tab **home** page, not a browsing tab: it is grouped with its Space but **never adopted into the Space's Temporary list** (the user summons it from the smart folder; it is not a tab to accumulate). The `tabs.onCreated` and `tabs.onUpdated` handlers SHALL recognize the folder-page URL via `isFolderPageUrl` (`shared/new-tab.ts`, mirroring `isNewTabUrl`) and skip Temporary adoption for it, exactly as they do for a home tab. Because `openSmartFolderPage` already groups the tab into the folder's Space, `tabs.onCreated` SHALL NOT regroup it into the (possibly different) active Space.

The page SHALL set the **browser tab title** to the folder's name (e.g. `Feeds · Lunma`) via `<svelte:head>`, so the tab strip reads the folder name rather than a static fallback.

#### Scenario: A folder-page tab is not listed as Temporary

- **WHEN** a folder-page tab is created (`tabs.onCreated` with the folder-page URL)
- **THEN** it is NOT added to the active Space's `tempTabIds`
- **AND** a later `tabs.onUpdated` for that tab does not adopt it into Temporary either

#### Scenario: The tab title is the folder name

- **GIVEN** the page resolves folder `f1` named "Feeds"
- **WHEN** it renders
- **THEN** the document title is `Feeds · Lunma`

### Requirement: Smart-folder page entry points

The page SHALL be reachable from the sidebar in two ways, both dispatching `openSmartFolderPage`:

1. **Header menu** — the smart folder's kebab menu SHALL carry an `"Open as page"` item (`id: 'open-page'`, icon `external-link`), beside `"Open all in a tab"`.
2. **Header "open as page" icon** — the smart folder header SHALL present a hover/focus-revealed icon button (composed from the `IconButton` primitive, icon `maximize-2`, with an accessible label) that opens the page. `FolderRow` SHALL accept an **optional** `onOpenPage` callback (+ `openPageLabel`): when present (smart folders) the icon renders in the trailing cluster; when absent (every regular folder) no icon renders.

The smart folder header's **row body and disclosure chevron keep their normal expand/collapse behavior** — activating the row (or the chevron) toggles the folder open/closed exactly like any folder; only the "open as page" icon and the kebab item open the page. (An earlier draft split the header so the body opened the page; that was reverted as too surprising — body-click on a folder should expand it.)

A launcher result that opens the page is **out of scope** for this change; it is the deferred follow-up `smart-folder-page-launcher`, which will dispatch the `openSmartFolderPage` command this change introduces.

#### Scenario: The kebab menu opens the page

- **WHEN** the user selects `"Open as page"` from a smart folder's kebab menu in window 100
- **THEN** `openSmartFolderPage { spaceId, folderId, windowId: 100 }` is dispatched

#### Scenario: The header icon opens the page; the body toggles expand

- **GIVEN** a smart folder in the sidebar
- **WHEN** the user activates the row body (or its chevron)
- **THEN** the folder's sidebar expand/collapse toggles and no page opens
- **AND WHEN** the user activates the header's "open as page" icon
- **THEN** `openSmartFolderPage` is dispatched and the sidebar expand state is unchanged

#### Scenario: Regular folders show no open-as-page icon

- **GIVEN** a regular (non-smart) folder whose `FolderRow` receives no `onOpenPage`
- **WHEN** its header renders
- **THEN** no open-as-page icon is present and the whole header toggles expand/collapse exactly as before

### Requirement: The page renders all resolved sections

When mirroring a folder, the page SHALL render **every** resolved section of that folder (one per source × filter, plus each rss feed) in `node.sources` order and, within each entry, `queries` order — the same order the sidebar uses. Each section SHALL render as a frosted-glass panel (`Surface variant="glass"`) carrying a section header (source icon + the section label + the section's attention count) above a responsive grid of item cards.

Section labels SHALL reuse the existing derivation: a named source's `name` (`name`, or `name · filter`) else `host` (or `host · filter`) for a queue section, and `name` else `host` for an rss section. The page SHALL reuse the existing per-kind row semantics — queue sections show at most one status dot per item; feed sections show unread marks — and the existing calm per-section states: `pending` → static ghost cards; `error` → last-known cards plus a dim "Couldn't reach ⟨host⟩" note; `signed-out` → the per-source sign-in / "Add a token in Settings → Connectors" affordance; `needs-access` → the muted "Lunma needs access to ⟨host⟩" grant prompt invoking `requestHostPermissions`. The page SHALL show the folder-level attention sum in its page header. No non-`ok` state SHALL render as a red error card.

#### Scenario: A multi-section folder lays out every section

- **GIVEN** folder `f1` with a gitlab instance carrying `['authored', 'review-requested']` and one rss feed, all `ok`
- **WHEN** the page renders
- **THEN** it shows three glass section panels — `authored`, `reviewing`, and the feed — each with its header, attention count, and item cards, in sources/queries order

#### Scenario: Per-section calm states render on the page

- **GIVEN** folder `f1` with one section `signed-out` (github) and one section `ok` (gitlab)
- **WHEN** the page renders
- **THEN** the github panel shows the "Add a token in Settings → Connectors" affordance and the gitlab panel shows its item cards — neither as a red error card

### Requirement: The page item is a card with optional content slots

The page's result unit SHALL be a card feature component (`FolderPageItem`, local to `folderpage/`) whose layout reserves regions for richer content (a hero image, an excerpt, and a date/meta footer) and renders each region **only when the item carries that field**. A card SHALL always show the item `title` and favicon (recessed at rest, full on hover/active) and at most one `status` dot. The card SHALL show the **full title** — wrapping to as many lines as needed, **never truncated** (no ellipsis); the favicon and status dot top-align with the title's first line. An absent optional region collapses to zero height, so an item with no optional fields (e.g. a queue item) reads as a clean, compact card, never a skeleton with blank boxes.

This requirement is **descriptive, not prohibitive**: it describes what the card renders given the optional fields present on `SmartFolderItem` and SHALL NOT forbid connectors from carrying additional optional item fields in a future change. In this change the **RSS connector** populates `excerpt`, `imageUrl`, and `publishedAt` (see "The RSS connector fetches and parses public feeds"); queue connectors leave them absent. A future change MAY fill the same slots for queue items (e.g. diff stat, CI detail) additively, with no rewrite of this surface and no schema migration (results are ephemeral). `FolderPageItem` is a feature component composing existing `ui/` primitives (`Icon`, `Favicon`, `Surface`); it SHALL NOT re-roll primitives or hard-code design values.

Every **feed** card SHALL lead with a hero of one fixed aspect ratio so titles align across the magazine grid row: a real hero image when the entry carries an `imageUrl` (loaded with `loading="lazy"` and `referrerpolicy="no-referrer"` — no referrer leaked to the publisher; the residual IP-on-load cost is accepted, see design D8), otherwise a **generated cover** — the title's first letter/character set in the display serif over a soft Space-hue wash, at the same ratio. Below the hero: title, excerpt (clamped), then a footer carrying the relative publication date. **Queue** cards have no hero and render compact. Feed sections SHALL render their cards as a full-width responsive magazine grid; queue sections render compact cards.

#### Scenario: A queue card renders compact, full-title, no empty regions

- **GIVEN** a `SmartFolderItem` `{ id, title, url, status }` with no optional content fields
- **WHEN** `FolderPageItem` renders it
- **THEN** it shows the full (wrapping, untruncated) title, a recessed favicon, and the single status dot, with no empty content regions

#### Scenario: A feed card renders a magazine card with hero, excerpt, and date

- **GIVEN** a feed `SmartFolderItem` carrying `excerpt`, `imageUrl`, and `publishedAt`
- **WHEN** `FolderPageItem` renders it
- **THEN** the hero image renders (with `loading="lazy"` and `referrerpolicy="no-referrer"`), the full title, the clamped excerpt, and a relative date label — and the feed section uses the magazine grid

#### Scenario: A cover-less feed card renders a generated cover

- **GIVEN** a feed `SmartFolderItem` with no `imageUrl`
- **WHEN** `FolderPageItem` renders it
- **THEN** it renders a generated cover (the title's initial in the display serif over a Space-hue wash) at the same ratio as a real hero, so its title aligns with image cards in the same row
- **AND** a queue item renders no hero at all

#### Scenario: The title is never truncated

- **WHEN** a card renders an item whose title is long enough to exceed one line
- **THEN** the title wraps to multiple lines and is shown in full (no ellipsis)

### Requirement: Page result activation reuses existing open semantics

Activating a result card on the page SHALL dispatch `openSmartItem` (the same command the sidebar uses), so a tab is bound/focused per window and feed read-state (consume-on-move-on, auto-advance, mark-read) behaves identically to opening from the sidebar. The page SHALL derive each item's namespaced id (`${sourceKey}:${nativeId}`) using the existing `sourceKey` derivation. The page SHALL NOT introduce a separate activation path or mutate bindings directly.

#### Scenario: Opening a queue item from the page binds a tab

- **GIVEN** the page for folder `f1` with an authored gitlab item native id `42`
- **WHEN** the user activates that card in window 100
- **THEN** `openSmartItem { folderId: 'f1', itemId: 'gitlab:gitlab.com:authored:42', windowId: 100, spaceId }` is dispatched and the existing bind/focus behavior applies

#### Scenario: Opening a feed item from the page drains it like the sidebar

- **GIVEN** the page for a feed folder with an unread item
- **WHEN** the user activates its card and later moves on from the bound tab
- **THEN** the item is consumed exactly as it would be from the sidebar (read-state and auto-advance unchanged), and the page re-renders from the broadcast

### Requirement: Smart-folder items may carry optional rich-content fields

`SmartFolderItem` SHALL carry three OPTIONAL display-only fields in addition to `id`/`title`/`url`/`status`: `excerpt?: string` (a plain-text summary), `imageUrl?: string` (a thumbnail/hero image URL), and `publishedAt?: number` (publication time as epoch ms). They SHALL be present on both the TypeScript interface (`shared/types.ts`) and the ephemeral `SmartFolderItemSchema` Zod mirror (`shared/schemas.ts`). They ride the **broadcast-only, never-persisted** `smartFolders` runtime slice, so they introduce **no schema migration** and the persisted envelope is unchanged. Each field SHALL be **omitted entirely** when absent (an item with none is byte-identical to the prior shape). The sidebar projection SHALL ignore these fields; only the full-page projection renders them.

#### Scenario: Optional fields are omitted when absent

- **WHEN** a connector emits an item with no description, image, or date
- **THEN** the `SmartFolderItem` has no `excerpt`, `imageUrl`, or `publishedAt` keys, and it round-trips through `SmartFolderItemSchema`

#### Scenario: The fields never reach disk

- **WHEN** an `ok` runtime carrying items with `excerpt`/`imageUrl`/`publishedAt` is persisted
- **THEN** the persisted envelope carries no `smartFolders` slice (it is stripped before persist), so no migration is needed for the new fields

### Requirement: The smart-folder page offers per-feed reading controls

The page SHALL provide reading controls for each **feed** section (queue sections have none):

- **Just-read items linger; prior reads drain.** Marking an item read SHALL NOT hide it immediately. An item read **while the page is open** (the "lingering" set) SHALL stay in place, rendered with the read treatment (dimmed), with its undo control — so the read action is reversible and never yanks content out from under the reader. An item read **before this page session** ("drained") SHALL be hidden at rest. The open→read transition is detected by diffing the broadcast read set; the lingering set is **page-local + ephemeral** (resets on reload — which is the drain boundary). The next reopen makes this session's reads drained.
- **Clear read.** When a section has lingering reads, the page SHALL show a **"Clear read"** control that drains that section's lingering items now (otherwise they drain on the next reopen).
- **Show / hide read.** When a section holds **drained** reads, the page SHALL show a **"Show N read"** control that reveals them in place; activating it again **"Hide read"** re-drains them. N is the count of drained reads in the section buffer.
- **Layout animation.** As entries are added or removed (Clear read, a refresh bringing new items, Show more), the surviving cards SHALL animate to their new positions (a FLIP reposition) so the grid re-settles smoothly rather than jumping. Cards SHALL NOT use an out-`transition`: a leave transition would keep a destroyed card's DOM (and its `Favicon`, which holds `$derived`) alive through the outro, and reading that derived post-teardown trips Svelte's `derived_inert` warning. The motion SHALL collapse to instant under `prefers-reduced-motion`.
- **Show more.** The page's feed display window SHALL default to a page-appropriate count that is **independent of the folder's `maxItems`** (the sidebar budget), so the magazine grid fills out rather than inheriting the cramped sidebar cap. When more items remain in the buffer beyond the current window, a **"Show more"** control SHALL extend it by the same page increment. Queue sections are not paged (the connector already capped them).
- **Toggle read/unread per item.** Each feed card SHALL expose a hover/focus-revealed control that marks the item **read** (when unread) or **unread** (when read), dispatching `markSmartItemRead` / `markSmartItemUnread` `{ folderId, itemId }`. The control is a sibling of the card's activation button (never nested). `markSmartItemUnread` is a new command added by this change; it removes the id from the folder's `smartReadState` set (folder-keyed; no refetch), mirroring `markSmartItemRead`.

#### Scenario: Prior reads are drained; revealing shows them

- **GIVEN** a feed section with two unread and one item read before this session
- **WHEN** the page renders the section
- **THEN** only the two unread cards render and a "Show 1 read" control is present
- **AND WHEN** the user activates it
- **THEN** all three cards render and the control reads "Hide read"

#### Scenario: An item read while the page is open lingers, then Clear read drains it

- **GIVEN** an unread feed item shown on the open page
- **WHEN** it becomes read (a broadcast marks it read) while the page stays open
- **THEN** its card stays visible with the read treatment (it does not vanish) and a "Clear read" control appears
- **AND WHEN** the user activates "Clear read"
- **THEN** the lingering card drains (animating out) and only the still-unread cards remain

#### Scenario: The page window exceeds the sidebar budget and pages with Show more

- **GIVEN** a feed folder with `maxItems: 10` whose buffer holds 30 unread items
- **WHEN** the page renders the section
- **THEN** it renders the page default window (more than 10) and a "Show more" control
- **AND WHEN** the user activates "Show more"
- **THEN** the section renders more items (up to the buffer)

#### Scenario: A per-item toggle marks read, then unread

- **GIVEN** a feed card for an unread item
- **WHEN** the user activates its read toggle
- **THEN** `markSmartItemRead { folderId, itemId }` is dispatched
- **AND WHEN** the user activates the toggle on a read item
- **THEN** `markSmartItemUnread { folderId, itemId }` is dispatched and the id leaves the read set

### Requirement: Feed auto-advance is suppressed for items opened from the page

The feed reading queue's **auto-advance** (closing the tab of an unread feed item opens the next unread item in the same section) is a sidebar reading-flow affordance: it keeps the reader moving when the sidebar is their only reading surface. An item opened **from the folder page** SHALL NOT auto-advance on close — closing it SHALL return to the page (Chrome's natural focus). An item opened from the **sidebar** SHALL auto-advance exactly as before, **regardless of whether the folder page also happens to be open**.

The discriminator SHALL be the item's **open origin**, not whether the page is open: `openSmartItem` carries an optional `fromPage` flag (set by the page, absent for sidebar opens); when set, the SW records the bound tab id in an SW-session set (`background/page-opened-tabs.ts`, in-memory, not persisted). `tabs.onRemoved` SHALL suppress auto-advance when the closing tab is in that set, and SHALL forget the tab id on close. (The service worker cannot observe sidebar visibility or folder-expanded state — both are sidebar-local, never broadcast — so origin tracking, not an "is the page open" proxy, is the correct signal.) All other auto-advance rules (consume=close never advances; only an unread manual close advances) are unchanged.

#### Scenario: A sidebar-opened item auto-advances on close

- **GIVEN** a feed section with unread items, the reading tab opened from the sidebar (no `fromPage`)
- **WHEN** the user closes that unread tab
- **THEN** the next unread item in the section opens (auto-advance) — even if the folder page is also open

#### Scenario: A page-opened item does not auto-advance on close

- **GIVEN** a feed item whose tab was opened from the page (`openSmartItem { fromPage: true }`)
- **WHEN** the user closes that tab
- **THEN** no next item opens — focus returns toward the page

## MODIFIED Requirements

### Requirement: The RSS connector fetches and parses public feeds

The `rss` connector (`apps/extension/src/background/connectors/rss.ts`) SHALL
fetch the node's `baseUrl` (the feed URL) via `boundedFetch` with no credentials
and parse the response body as a syndication feed, supporting **RSS 2.0 and Atom**
in one DOM-free streaming pass over the `saxes` SAX parser (the MV3 service worker
has no `DOMParser`). It SHALL normalize each entry onto `SmartFolderItem`
(no `status`): `url` from the entry `link` (RSS) or
`link[rel=alternate]`/`link[@href]` (Atom); `id` from `guid`/`id` when present,
**falling back to the entry `url`**.

The connector SHALL also populate the OPTIONAL rich-content fields from the SAME
response (no additional network request): `excerpt` from `<description>` /
`<summary>` (else `<content:encoded>` / Atom `<content>`), reduced to clamped
plain text (tags stripped via bounded regex — no `DOMParser` — entities decoded,
clamped to ~280 chars); `imageUrl` from `media:content[medium=image]` /
`media:thumbnail` / an image `enclosure`, falling back to the first inline
`<img src>` in the description HTML; and `publishedAt` from `pubDate` (RSS) or
`published`/`updated` (Atom), parsed to epoch ms (`published`/`pubDate`
authoritative over `updated`), omitted when unparseable. Each rich field SHALL be
omitted when empty or absent.

Parsing SHALL be element-wise tolerant — one
malformed entry SHALL NOT cost the rest, and a parser error SHALL keep whatever
parsed cleanly. Results SHALL be sliced to the node's `maxItems`. The connector
SHALL resolve to `pending | ok | error` only — **`signed-out` is impossible** for a
public feed. A network failure, a non-2xx response, an oversized body, or an empty
parse SHALL resolve to the quiet `error` state (last-known items hold, per
Requirement: Calm failure and pending states). `listingUrl` SHALL return the feed
**channel-level** website link (the channel `<link>` / feed `link[rel=alternate]`),
falling back to the feed URL when absent.

#### Scenario: An RSS 2.0 feed normalizes to result rows

- **WHEN** the connector fetches a folder whose feed returns RSS 2.0 with three `<item>`s (one CDATA title, one without a `<guid>`)
- **THEN** the runtime is `ok` with three items, the CDATA title decoded, and the guid-less item's `id` equal to its link

#### Scenario: An Atom feed normalizes to result rows

- **WHEN** the connector fetches a folder whose feed returns Atom `<entry>`s with `<link rel="alternate" href=…>` and `<id>`
- **THEN** the runtime is `ok` with each item's `url` taken from the alternate link and `id` from the entry id

#### Scenario: A feed source never reports signed-out

- **WHEN** any RSS fetch fails (network error, non-2xx, or unparseable body)
- **THEN** the runtime resolves to `error`, never `signed-out`

#### Scenario: Results slice to maxItems

- **WHEN** a feed returns 40 entries and the node's `maxItems` is 20
- **THEN** the runtime holds exactly 20 items

#### Scenario: An entry's description, image, and date are parsed into rich fields

- **WHEN** the connector parses an `<item>` with a `<description>` containing HTML, a `media:content` image, and a `pubDate`
- **THEN** the item carries `excerpt` (plain text, tags stripped), `imageUrl` (the media URL), and `publishedAt` (the pubDate as epoch ms)

#### Scenario: The image falls back to the first inline image

- **WHEN** an entry has no media/enclosure image but its description HTML contains an `<img src=…>`
- **THEN** the item's `imageUrl` is that inline image URL

#### Scenario: An unparseable date is omitted

- **WHEN** an entry's date text does not parse
- **THEN** the item carries no `publishedAt` (never `NaN`)
