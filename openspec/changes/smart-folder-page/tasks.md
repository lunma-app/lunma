# Tasks — smart-folder-page

## 1. Surface scaffold & build wiring

- [x] 1.1 Create `apps/extension/src/launcher/folderpage/index.html` (mount `<div id="app">` + `<script type="module" src="./main.ts">`), mirroring `launcher/newtab/index.html`.
- [x] 1.2 Register the page as a build entrypoint: add `folderpage` → `src/launcher/folderpage/index.html` to `build.rollupOptions.input` in `apps/extension/vite.config.ts`. Do NOT touch `chrome_url_overrides` and do NOT add it to `web_accessible_resources` (least privilege — the extension opens its own page; WAR would over-expose it to all web origins).
- [x] 1.3 Verify the built page loads at `chrome-extension://<id>/src/launcher/folderpage/index.html?folderId=…` (covered by the e2e smoke in task 7.3).

## 2. Page boot (`main.ts`)

- [x] 2.1 Implement `apps/extension/src/launcher/folderpage/main.ts` modeled on `newtab/main.ts`: read settings (tint) before mount, resolve own `windowId` via `getCurrentWindowId()`, request a state snapshot with backoff, subscribe to `onStateBroadcast`, and `watchSettings()` to re-apply tint live.
- [x] 2.2 Parse `folderId` from `new URLSearchParams(window.location.search)` and pass it (with `windowId`, `initialState`, `tint`) as props to `FolderPage.svelte`.
- [x] 2.3 Handle the missing/unknown-folder case gracefully: render a calm neutral state, never an error card.

## 3. Page component (`FolderPage.svelte`) — read-only projection

- [x] 3.1 Implement the read-only state mirror (`liveState` ← `onStateBroadcast`, `appState` ← `liveState ?? initialState`), exactly as `NewTab.svelte` does. The component never mutates `AppState`.
- [x] 3.2 Derive the folder's resolved sections from `appState.smartFolders[folderId]` + the folder's `pinnedBySpace` config (locate folder + owning Space), reusing the `sourceKey` / `resolvedConfigs` derivations and section-label rules (`name` override; `host · filter` / `host`).
- [x] 3.3 Render the page header: folder name (Instrument Serif hero), meta line (section count · attention sum).
- [x] 3.4 Render `<Aurora intensity={tint}>` backdrop + hearth bloom in the owning Space hue (`data-tint`, scoped hue vars), `aria-hidden`, non-interactive.
- [x] 3.5 Render each section as a glass `Surface` panel in `node.sources` / `queries` order, with section header (source icon + label + attention count) and a responsive card grid.
- [x] 3.6 Render the calm per-section states reusing sidebar copy/affordances: `pending` → ghost cards; `error` → last-known + dim "Couldn't reach ⟨host⟩"; `signed-out` → per-source sign-in / "Add a token in Settings → Connectors"; `needs-access` → muted grant prompt invoking `requestHostPermissions`. No red error cards.

## 4. Item card (`FolderPageItem`) — the B-seam

- [x] 4.1 Implement `FolderPageItem` (feature component local to `folderpage/`) composing `Icon` + `Favicon`: title leads (Mona Sans, **full title — wraps, never truncated**), favicon recessed at rest / full on hover-active, at most one `status` dot.
- [x] 4.2 Structure the card so each optional content field (hero image / excerpt / date-meta footer) renders only `{#if present}` and collapses to zero height when absent — a queue card reads as a finished compact card, NOT a skeleton. `rich` slot type documents the B-seam.
- [x] 4.3 Wire card activation to dispatch `openSmartItem` with the per-filter namespaced id (`${sourceKey}:${nativeId}`).

## 5. Open / reuse command (background)

- [x] 5.1 Add the `openSmartFolderPage { spaceId, folderId, windowId }` command to the typed bus (`bus.ts`: union, kind set, exhaustiveness map, schema, schema array), the coalescing map (`coordinator.ts`), the handler context union (`context.ts`), and the `smartFolderHandlers` return `Pick`.
- [x] 5.2 Implement the handler beside `openSmartItem` in `background/handlers/smart-folders.ts`: compute the page URL; query the window's tabs and focus an existing folder-page tab matching the path + `folderId` param (compare pre-query string — `chrome-extension://` has an opaque origin); else `chrome.tabs.create` + add to the Space's Chrome group. Never dispatch `openUrl`.
- [x] 5.3 Unit-test the handler: first-open creates+groups; reopen focuses (no duplicate); reuse after a simulated SW restart (no persisted binding); match ignores extra query params; a different folderId is not reused.

## 6. Sidebar entry points

- [x] 6.1 Add an optional `onOpenPage` (+ `openPageLabel`) to `FolderRow`: when present, render a hover/focus-revealed "open as page" icon button in the trailing cluster; the row body + chevron keep normal expand/collapse. Absent (regular folders) → no icon. Tests prove regular folders are unchanged, the body still toggles, and the icon opens the page. (An earlier body-click gesture split was implemented then reverted at the user's request — see design D3.)
- [x] 6.2 In `SmartFolder.svelte`, pass `onOpenPage` → dispatch `openSmartFolderPage`.
- [x] 6.3 Add the `"Open as page"` kebab menu item (`id: 'open-page'`, icon `external-link`) dispatching `openSmartFolderPage`. Existing menu-id assertions updated.
- [x] 6.4 The "open as page" icon button uses `IconButton` (icon `maximize-2`) with an accessible label.

## 7. Visual quality, a11y & tests

- [x] 7.1 Staggered page-load reveal (per-section `animation-delay`, 150–250ms ease-out) and card hover lift; all motion collapses to instant under `prefers-reduced-motion: reduce`.
- [x] 7.2 WCAG-AA contrast holds at every Colour intensity (foreground from `--text-*`); Stylelint passes (no hard-coded tokens in new CSS).
- [x] 7.3 Component tests for `FolderPage.svelte` (sections render in order; per-section calm states; card activation dispatches `openSmartItem`; rich feed cards) and `FolderPageItem` (compact card has no empty regions; optional fields render additively). _(Playwright e2e smoke: see task 9.2.)_

## 8. Rich RSS content (feed cards)

- [x] 8.1 Add optional `excerpt?` / `imageUrl?` / `publishedAt?` to `SmartFolderItem` (`shared/types.ts`) and the ephemeral `SmartFolderItemSchema` mirror (`shared/schemas.ts`) — additive, no migration.
- [x] 8.2 Extend the RSS connector (`background/connectors/rss.ts`) to parse, from the already-fetched body: description/summary → clamped plain-text `excerpt`; `media:content`/`media:thumbnail`/`enclosure`/first inline `<img>` → `imageUrl`; `pubDate`/`published`/`updated` → `publishedAt` (epoch ms). Omit each when absent/unparseable. Tests cover all paths.
- [x] 8.3 `FolderPageItem` renders the hero image (`loading="lazy"`, `referrerpolicy="no-referrer"`), excerpt (clamped), and a relative date; feed sections use a full-width magazine grid. `FolderPage` maps feed item fields → `rich` + `dateLabel`.

## 9. Reading controls (feed sections)

- [x] 9a.1 Add the `markSmartItemUnread { folderId, itemId }` command (bus union/kinds/exhaustiveness/schema/array, coordinator coalescing, context variant, handler + return Pick, bus.test sample) and `LunmaStore.markSmartItemUnread` (removes the id from `smartReadState`, drops the folder entry when empty). Handler test covers it.
- [x] 9a.2 `FolderPageItem`: render a hover/focus-revealed read-toggle as a SIBLING of the card button (`.card-wrap`); envelope state icon — `mail` (unread → "Mark as read") / `mail-open` (read → "Mark as unread"). Feed-only (`onToggleRead`). Reduced-motion covered.
- [x] 9a.3 `FolderPage`: page-local `revealedRead` + `limits` (keyed by sourceKey); `displayItems` shows unread at rest, all when revealed, capped to the window; `FEED_PAGE_DEFAULT = 24` (decoupled from `maxItems`); "Show more" pages by that; "Show N read" / "Hide read" reveal toggle; per-card `toggleRead` dispatches mark read/unread. Component tests cover reveal, show-more, and the toggle dispatch.
- [x] 9a.4 Suppress feed auto-advance for items opened **from the page** (origin, not "is the page open" — the latter regressed the sidebar flow). `openSmartItem` gains an optional `fromPage`; the handler records page-opened tab ids in `background/page-opened-tabs.ts` (SW-session set); `tabs.onRemoved` suppresses auto-advance for those and forgets the tab on close. The page dispatches `fromPage: true`. Handler tests: a sidebar-opened item advances; a page-opened item does not.
- [x] 9a.5 The page tab is a managed view, not Temporary: add `isFolderPageUrl` (`shared/new-tab.ts`); `tabs.onCreated`/`onUpdated` skip temp adoption (and onCreated skips regroup) for it, like a home tab. The page sets `<svelte:head><title>{folder} · Lunma</title>`. Tests: `isFolderPageUrl` unit + a folder-page tab is not adopted into Temporary.
- [x] 9a.6 Read items linger instead of vanishing: an item read while the page is open stays (dimmed, with undo); prior-session reads are drained; `displayItems` keys on a page-local lingering set diffed from the broadcast read set; a per-section "Clear read" drains lingering now. (Rejected the auto-countdown sketch — see design D12.) Test covers lingering + Clear read.
- [x] 9a.7 Animate the card grid: each cell wraps `FolderPageItem` with `animate:flip` (FLIP reposition of survivors); durations from a `prefers-reduced-motion`-aware `CARD_MOTION_MS` (0 when reduced). NO out-`transition` — a leave transition keeps a destroyed card's `Favicon` ($derived) alive through the outro and trips Svelte's `derived_inert`; flip-only closes that window. `vitest.setup.ts` stubs `Element.prototype.animate` (jsdom lacks WAAPI); page tests report reduced motion for deterministic counts.
- [x] 9a.8 Harden `openSmartFolderPage`: guard the focus-existing-tab path (`chrome.tabs.update`/`windows.update`) in try/catch → fall back to creating a fresh page tab, so a tab that vanished between the query and the focus logs at debug instead of throwing (a `HANDLER_THREW` class). Mirrors the tab-group wrappers' best-effort guards.

## 10. Docs, artifact lockstep & verify

- [x] 10.1 Update `docs/architecture.md`: add the smart-folder-page surface (DAG tree + Surfaces table + the `FolderRow` `onActivate` gesture split + rollupOptions.input note). `docs/tech-stack.md` needs no change (no new dependency). Proposal/design/specs updated for the rich-RSS + reading-controls scope.
- [x] 10.2 `pnpm verify` at the workspace root green; the Playwright smoke (`e2e/smart-folder-page.spec.ts`) opens the page and asserts it loads the folder section + card.
