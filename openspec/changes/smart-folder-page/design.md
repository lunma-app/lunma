## Context

A smart folder aggregates N sources × M filters plus RSS feeds into the broadcast-only `smartFolders` runtime slice (`{ [folderId]: { sections: { [sourceKey]: SmartSectionRuntime } } }`). Today that slice has exactly one renderer: the sidebar (`SmartFolder.svelte` + `SmartSectionHeader.svelte`), bound by the ~300px column and the "one-glyph restraint." This change adds a **second read-only renderer** — a full-page surface — for the *same* slice, with room to lay every section out editorially.

The codebase already proves the entire pattern. `launcher/newtab` is a standalone Svelte page (`index.html` + `main.ts` + `NewTab.svelte`) that resolves its own `windowId`, requests a state snapshot with backoff, subscribes to `onStateBroadcast`, reads `tint`/settings, and composes `Aurora`/`Surface`/`Icon`/`FaviconTile`/`Button`/`Chip`/`Kbd` over `@lunma/tokens`. The smart-folder page is that recipe, parameterized by a `folderId` from the URL.

Key constraints discovered while mapping integration points:
- `openUrl`'s handler deliberately hardens its scheme and **drops non-http(s) URLs**, so a `chrome-extension://` page URL cannot ride `openUrl`. The page needs a dedicated open command.
- `newtab` is registered via `chrome_url_overrides` — not reusable for an arbitrary page. The page is a normal extension entrypoint reachable at `chrome-extension://<id>/<path>/index.html`.
- The sidebar's `FolderRow` is shared with regular (non-smart) folders; its whole-header click currently calls `onToggle` (expand/collapse). Any gesture change must be scoped to smart folders so regular folders are untouched.
- Smart-folder result rows in the launcher today carry `source: 'smart'` and route through `openUrl` (a plain link). Items are link-shaped (`{ id, title, url, status? }`); RSS read-state and `openSmartItem` binding semantics already exist.

## Goals / Non-Goals

**Goals:**
- A spacious, immersive, single-folder page that renders **all** of the folder's resolved sections at once, reusing the sidebar's per-kind semantics (queue = status dots; feed = unread marks) and calm per-section states (`pending` / `error` / `signed-out` / `needs-access` / empty).
- Two sidebar reach paths: a header **"open as page" icon** and the **kebab-menu** item (the row body + chevron keep normal expand/collapse), plus a **reused page tab per window** (no duplicate tabs). A third reach — a launcher result — is deferred to the follow-up change `smart-folder-page-launcher` (it reverses the launcher's "folders not emitted as rows" rule); this change ships `openSmartFolderPage`, which that follow-up will dispatch.
- Build the per-item unit as a **card with optional slots** so a future, separately-proposed `smart-folder-page-rich-content` change can fill richer content **purely additively** — the B-seam — with no surface rewrite.
- Land at Lunma's visual bar from first sight (Visual language section below).

**Non-Goals:**
- Per-item **queue** enrichment (MR/PR diff stats, CI detail) — feed (RSS) rich content IS in scope (D8); queue enrichment fills the same card slots in a future change.
- Any new connector **network** request (the RSS connector parses richer fields from the body it already fetches — no extra round-trip).
- Any persisted result state, schema migration, or new host permission (the new `SmartFolderItem` fields are optional and ride the ephemeral, never-persisted runtime slice).
- An "all folders / all my work" aggregate page (one folder per page only).
- Changing sidebar rendering, polling, the connector contract shape, or RSS read-state behavior.

## Decisions

### D1 — Surface location and entrypoint wiring
A new standalone page lives at `apps/extension/src/launcher/folderpage/` — `index.html`, `main.ts`, `FolderPage.svelte`, `folderpage.css`, and tests — mirroring `launcher/newtab` (the launcher layer already owns the new-tab page, smart-folder providers, and reads `smartFolders` runtime; this keeps the surface in the layer that already imports `ui` + `shared`).

Because the page is **not** a new-tab override, it is registered as a build entrypoint via `build.rollupOptions.input` in `apps/extension/vite.config.ts` (keyed `folderpage`) so crxjs builds it. It is **not** added to `web_accessible_resources`: the extension opens its *own* page via `chrome.tabs.create(chrome.runtime.getURL(...))`, which needs no WAR grant, and listing it in WAR would expose a page that mirrors the user's work/folder state to *all websites* (any site could open or iframe it) — an unnecessary least-privilege violation. (Alternatives considered: `chrome_url_overrides` — rejected, that slot is the new tab and is single-purpose; a hash route inside `newtab` — rejected, it would entangle two unrelated surfaces and their state machines; adding to `web_accessible_resources` — rejected on the least-privilege grounds just stated.)

The target folder is carried as `?folderId=<id>` on the page URL. `windowId` is **not** baked into the URL — like `newtab`, the page resolves its own window at boot via `getCurrentWindowId()` (correct even if the tab is later dragged to another window).

### D2 — Opening, deduping, and the "bound tab" — no new persisted state
A new SW command `openSmartFolderPage { spaceId, folderId, windowId }` (handler in `background/handlers/smart-folders.ts`, beside `openSmartItem`) does:
1. Compute the page URL: `chrome.runtime.getURL('src/launcher/folderpage/index.html') + '?folderId=' + folderId`.
2. **Dedupe by query**, not by a stored binding: `chrome.tabs.query({ windowId })`, find a tab whose URL path matches the folder-page path **and** whose `folderId` query param equals this folder. If found → `chrome.tabs.update(tabId, { active: true })` (focus, no new tab).
3. Else `chrome.tabs.create({ url, windowId })` and add it to the Space's Chrome group (same grouping call `openSmartItem` uses).

This delivers the "bound, reused tab per window" behavior the proposal asks for **without** a persisted binding slot — the open tab *is* its own registry, self-healing across SW restarts (a query always finds the live page tab). Consequently **`storage-and-migrations` is untouched** and there is no schema bump. (Alternatives considered: reuse `smartItemBindings` with a synthetic itemId — rejected, it pollutes a persisted, pruned, migration-versioned structure for an ephemeral convenience; a new persisted `smartFolderPageTabs` slice — rejected, it needs a schema migration and boot-time pruning for a fact the tab list already holds.) The proposal's conditional `storage-and-migrations` modification is therefore dropped.

Because `openUrl` drops non-http(s) URLs (scheme hardening, intentionally untouched), the menu action and the header icon both dispatch `openSmartFolderPage`, never `openUrl`. (The deferred `smart-folder-page-launcher` follow-up will likewise dispatch `openSmartFolderPage` for its result.)

### D3 — Opening the page: icon + menu, NOT a body-click split
The page opens from two sidebar affordances, both dispatching `openSmartFolderPage`:
- A **hover/focus-revealed "open as page" icon button** in the smart folder header (icon `maximize-2` — "open out to a full view"; `external-link`/↗ was rejected as it implies leaving the app for the web).
- The **kebab menu** `"Open as page"` item (`id: 'open-page'`).

The smart folder header's **row body and chevron keep their normal expand/collapse behavior** — exactly like any folder. `FolderRow` gains an **optional** `onOpenPage` callback (+ `openPageLabel`) that ONLY renders the trailing icon button; regular folders pass none and are byte-for-byte unchanged. (Earlier draft + reversal: the header first *split* the hit targets — chevron toggled, body opened the page — but body-click opening a page reads as surprising when every other folder expands on body-click. The user chose the lower-surprise model: body always toggles, the icon opens. The split and its `onActivate` prop were removed; this is the Q1 fallback, now adopted.)

`docs/architecture.md` notes the surface and the `FolderRow` `onOpenPage` affordance.

### D4 — The item card with optional slots (the B-seam)
The page's result unit is a **card** feature component (`FolderPageItem`, local to `folderpage/`) whose layout **reserves regions** for future richer content even though Phase A renders none of it:

```
┌──────────────────────────────────────────────┐
│ [favicon]  Title (Mona Sans, leads)      [•] │  ← filled in A (• = at-most-one status dot)
│ ········· excerpt / summary ·················  │  ← slot, empty in A
│ [hero image]                                   │  ← slot, empty in A
│ +112 −40 · 4 checks · meta                     │  ← slot, empty in A
└──────────────────────────────────────────────┘
```

The card renders **whatever optional fields are present** on `SmartFolderItem`; when a field is absent it renders nothing (empty slots collapse to zero height — a clean link card, never a skeleton). **Queue items** supply only `title`/favicon/`status`, so their cards stay compact. **Feed items now fill the slots** (see D8): the seam that was theoretical at proposal time is realized for RSS in this change. A future `smart-folder-page-rich-content` change fills the *same* slots for queue items (MR/PR diff stats, CI detail) — additive, no surface rewrite. Because results are ephemeral (never persisted), the optional fields need no schema migration.

Normative consequence captured in the spec: the page requirement is phrased **descriptively** ("renders the item fields the runtime carries") and **must not forbid** connectors carrying more later. This is the rule that kept the door open — D8 walks through it for feeds.

### D5 — Read-only projection, activation over the bus
`FolderPage.svelte` is a read-only mirror exactly like `NewTab.svelte`: `liveState` from `onStateBroadcast`, `initialState` from the snapshot, `windowId` from boot. It **never mutates state**. Activating a result row dispatches the existing commands:
- queue item → `openSmartItem` (binds/focuses a tab per window, identical to the sidebar);
- feed item → `openSmartItem` (RSS read-state/auto-advance semantics already live in the SW, unchanged);

so opening from the page and from the sidebar are the same action with the same consequences (a feed item opened on the page still drains correctly). The page derives its sections from `appState.smartFolders[folderId]` and the folder's `pinnedBySpace` config (for section identity/labels via the existing `sourceKey`/`resolvedConfigs` derivations), reusing the same labelling rules (`name` override, `host · filter`).

### D6 — Section layout
Sections render in `node.sources` order, each section in `queries` order (matching the sidebar's order), as **glass section panels** (`Surface variant="glass"`) carrying a section header (source icon + label + attention count) and a responsive grid/column of item cards. The layout is multi-column on wide viewports (CSS grid, `auto-fill`/`minmax`), collapsing to a single column when narrow — content-driven, no fixed breakpoints baked as magic numbers beyond token-scale spacing. **Feed sections** span the full width and tile their cards as a magazine grid (`minmax(240px, 1fr)`) so image cards earn the room; queue sections stay compact. Per-section calm states reuse the sidebar's copy and affordances: `pending` → static ghost cards; `error` → last-known cards + a dim "Couldn't reach ⟨host⟩" note; `signed-out` → the per-source sign-in / "Add a token" row; `needs-access` → the muted grant prompt invoking `requestHostPermissions`. The folder-level attention sum is shown in the page header.

### D8 — Rich RSS cards (the B-seam, realized for feeds)
`SmartFolderItem` gains three **optional** fields — `excerpt?: string`, `imageUrl?: string`, `publishedAt?: number` (epoch ms) — added to both the TS interface (`shared/types.ts`) and the ephemeral `SmartFolderItemSchema` Zod mirror (`shared/schemas.ts`). They ride the broadcast-only runtime slice, so there is **no schema migration**, and the sidebar projection simply ignores them.

The **RSS connector** (`background/connectors/rss.ts`) populates them from the feed body it **already fetches** (no new request): the SAX pass now also captures `<description>`/`<summary>` (→ `excerpt`, after `htmlToExcerpt` strips tags, decodes the few CDATA-surviving entities, and clamps to ~280 chars), an image (`media:content[medium=image]` / `media:thumbnail` / image `enclosure`, else the first inline `<img src>` in the description HTML, via a bounded regex — the SW has no `DOMParser`), and the publication date (`pubDate` / Atom `published`/`updated`, with `published`/`pubDate` authoritative over `updated`, parsed via `Date.parse` → epoch ms, omitted when unparseable). Queue connectors leave all three absent. All three keys are **omitted entirely** when empty so a plain item stays byte-identical to before.

The page maps a feed item's fields onto `FolderPageItem`'s `rich` slots + a `dateLabel` (formatted client-side: relative "3h ago"/"2d ago" under a week, else a short absolute date). The card **leads with the hero image** when present (magazine layout), then title, excerpt (3-line clamp), and a date/meta footer.

**Generated cover (alignment).** A magazine grid where some entries have images and some don't reads as broken — a cover-less card floats its title to the top while its neighbours push titles below their images, so the row's titles never line up. So **every feed card carries a hero of one fixed 16/9 ratio**: a real image when present, else a **generated cover** — the title's first letter/character in the display serif (`--font-display`) over a soft Space-hue radial+linear wash. It reads as a deliberate "no cover" tile (the kind podcast/newsletter feeds already ship), keeps the grid's titles aligned, and never degrades to a flat gray box. Queue cards have no hero (they're compact), so only the feed magazine grid pays the hero cost. (Alternatives considered: a repeated large favicon — rejected, the favicon already sits by the title and a 16/9 favicon tile looks like a logo wall; leaving cover-less cards short — rejected, that is exactly the ragged-row problem; CSS masonry to pack varying heights — rejected, weak cross-browser support and it wouldn't fix title-line alignment within a row.)

**Image privacy (decision).** Remote thumbnails are a tracking vector: fetching `imageUrl` tells the publisher's server the request IP and that the folder was opened — the email open-pixel mechanism. Mitigations applied: `loading="lazy"` (fetch only when scrolled into view) and `referrerpolicy="no-referrer"` (no referrer leak). The residual cost — IP-on-load — is accepted for the visual payoff, per the user's explicit choice; a future opt-out setting is possible but out of scope here. (Alternatives considered: a server-side image proxy — rejected, Lunma has no backend; stripping images entirely — rejected, it loses the magazine value the user asked for; an opt-in setting now — deferred to keep this change focused.)

### D9 — Reading controls (feed sections)
The page brings the sidebar's reading-queue affordances to a roomier surface:

- **Reveal-read + display window are page-local.** They live in `FolderPage` component state (`revealedRead` / `limits`, keyed by `sourceKey`), reassigned (not mutated) so the runes react. They are deliberately NOT the sidebar's `revealedReadSmartSectionsByWindow` augmentation — that is sidebar-store-local and unreachable from this surface — and NOT persisted; they reset on reload, like a peek. At rest a feed section shows **unread only**; "Show N read" reveals read items in place; "Show more" extends the window.
- **The page window decouples from `maxItems`.** `maxItems` is tuned for the ~300px sidebar; the page has far more room, so the feed window defaults to `FEED_PAGE_DEFAULT = 24` (grid-friendly — divisible by 2/3/4/6 so the magazine rows fill at common column counts) rather than the folder's `maxItems`. "Show more" pages by `FEED_PAGE_DEFAULT` through the connector's existing 200-item buffer — no new fetch. (Alternative considered: measuring the live column count to pad the last row exactly — rejected as over-engineering; a grid-friendly constant fills rows well enough without a ResizeObserver.)
- **Per-item read toggle needs a new command.** `markSmartItemRead` exists (consume-on-open), but un-marking did not. This change adds `markSmartItemUnread { folderId, itemId }` (bus → coordinator → handler → `LunmaStore.markSmartItemUnread`, which removes the id from `smartReadState`, dropping the folder entry when it empties). It is folder-keyed and triggers no refetch, mirroring `markSmartItemRead`. The toggle control is rendered as a **sibling** of the card's activation `<button>` inside a `.card-wrap` (button-in-button is invalid), revealed on hover/focus. Its icon is an **envelope state** — `mail` (unread → "Mark as read"), `mail-open` (read → "Mark as unread"): the universal read/unread metaphor. (Considered: an **eye** open/closed — rejected because the eye is the *visibility* glyph the "Show / Hide read" control already implies, so an eye on the per-card toggle would read ambiguously as show/hide rather than read/unread; and `check`/`rotate-ccw`, the original action-based pair, which works but is less glanceable as state.)

### D10 — Auto-advance defers to the item's open ORIGIN, not "is the page open"
Feed auto-advance (close an unread item → open the next) is a sidebar reading-flow affordance — it keeps you moving when the sidebar is your only reading surface. From the **page** it backfires: you Cmd+W an item expecting to land back on the page, and instead the next article opens.

A first cut suppressed auto-advance whenever the **folder page was open in the window**. That regressed the sidebar flow: with the page open (e.g. left open from earlier) and the user reading via the **sidebar**, auto-advance wrongly stopped. The page-open proxy conflates "the page exists" with "this read came from the page." The correct discriminator is the item's **open origin**: `openSmartItem` carries an optional `fromPage` flag (the page sets it; the sidebar omits it); when set, the handler records the bound tab id in an SW-session set (`background/page-opened-tabs.ts`, in-memory, not persisted, forgotten on close). `tabs.onRemoved` suppresses auto-advance only for tabs in that set. So a sidebar-opened item always advances (even with the page open), and a page-opened item never does.

(The SW **cannot** see "sidebar visible / folder expanded" — both are sidebar-local, never broadcast — which is why the user's "only when the sidebar is visible" can't be implemented directly; origin tracking captures the same intent from the open side. The `fromPage` flag is a small additive field on the otherwise strict `openSmartItem` payload; the SW-session set loses its marks on an SW restart, so a page-opened item open across a restart would auto-advance once — a rare, benign edge.)

### D11 — The page tab is a managed view (not Temporary), with a proper title
A folder-page tab is a Lunma-managed extension page, the same category as the new-tab **home** page — you summon it from the smart folder, you don't accumulate it. So it is **excluded from the Space's Temporary list**: `tabs.onCreated` / `tabs.onUpdated` recognize the folder-page URL via a new `isFolderPageUrl` helper (`shared/new-tab.ts`, mirroring `isNewTabUrl`) and skip the temp-adoption they apply to ordinary tabs, exactly as they already do for `isHome`. Grouping stays with `openSmartFolderPage` (which knows the folder's owning Space), so `onCreated` does not regroup it into the active Space. It still exists in Chrome's tab strip (an extension page must be a tab) and rides its Space's group — but Lunma's sidebar never lists it as a Temporary tab, which is what "don't show it as a new tab" means in Lunma's model. The SW cannot see sidebar visibility, but it doesn't need to here — URL recognition is enough.

The page sets its **browser tab title** to the folder name (`<svelte:head><title>{folder} · Lunma</title>`), so the strip reads "Feeds · Lunma" rather than the static `index.html` fallback. (Alternative considered: opening the page in-place / not as a tab — rejected, an extension page must be a tab, and replacing the current tab would destroy the user's context.)

### D12 — Read items linger (no auto-vanish), and the grid animates
Marking an item read used to remove it from the at-rest view instantly — jarring, and it kills the undo window. Instead, an item read **while the page is open** *lingers*: it stays in place with the read treatment (dimmed) and its undo toggle. Only items read **before this session** are drained (hidden behind "Show read"); the next reopen makes this session's reads drained too, and a **"Clear read"** control drains them on demand. The lingering set is page-local + ephemeral, derived by diffing the broadcast read set (`prevRead === null` on first run captures the baseline so prior reads stay drained; ids that newly appear linger; ids that leave stop lingering).

(Considered and rejected: the user's first sketch — a per-item radial countdown that auto-deletes read items unless clicked. It's distinctive but anxiety-inducing (a clock racing to remove content), chaotic at N-items-at-once, and an accessibility problem under `prefers-reduced-motion` / for screen readers (auto-dismissal, no accessible equivalent). The user agreed to the calmer "linger + manual clear" model; the radial-ring delight, if wanted later, belongs on a single undo snackbar, not per card.)

As entries are added/removed (Clear read, a refresh, Show more), the card grid **animates**: each cell carries `animate:flip` (FLIP reposition of the *surviving* cards), wrapped in a `.card-cell` so the directive sits on a real keyed box (it can't apply to the `FolderPageItem` component directly). Durations come from a `prefers-reduced-motion`-aware constant (`CARD_MOTION_MS`, 0 when reduced — the layout still re-settles, just instantly).

**No out-transition (derived_inert).** The cells deliberately carry NO `transition:` (an early version had `transition:fade`). A leave transition keeps a *destroyed* card's DOM alive through the outro — and `FolderPageItem` embeds `Favicon`, which holds `$derived` state. Reading that derived after the card's reactive scope is torn down trips Svelte's `derived_inert` warning (the stack runs `Favicon` → signal-get → dirty-check → recompute-with-destroyed-parent). Removing a card immediately (flip-only) closes that window: survivors still animate the reflow, but no destroyed component lingers to be re-read. (Test note: jsdom lacks the Web Animations API, so `vitest.setup.ts` stubs `Element.prototype.animate`/`getAnimations`, and the page tests report reduced motion to keep DOM-count assertions deterministic.)

## Visual language

The page is the "command-center" moment — the one surface where a folder gets to feel like a *place*. It channels a bold, atmospheric, editorial ambition strictly **through Lunma's pinned recipes** (no new aesthetic, no hard-coded values; all colour from the `--text-*` ramp and the active Space hue tokens).

- **Backdrop & atmosphere.** `<Aurora intensity={tint}>` paints the active Space's OKLCH hue as a drifting aurora (the same component `NewTab` uses), with the **hearth bloom** (`--glow-hearth`) as a low-centre radial anchor — "fire in the nook," recoloured by the Space. `data-tint` drives intensity; at `subtle` it calms to a near-neutral substrate. Both are `aria-hidden`, never interactive.
- **Hierarchy & type.** The folder name is the hero in **Instrument Serif** (large, editorial), with a Mona Sans meta line beneath (section count · attention sum). Section panels are **frosted glass** (`Surface variant="glass"`, `radius="lg"`) floating over the aurora. Item **titles lead** in Mona Sans; **favicons are recessed at rest** (reduced opacity) and come to full on card hover/active — the same restraint the sidebar uses, so the eye reads titles first. The single status dot is the only colour-coded glyph per card (one-glyph restraint preserved).
- **Motion.** One well-orchestrated **page-load reveal**: section panels and their cards fade-and-rise with a staggered `animation-delay` cascade (per-section, then per-card), each tween **150–250ms** with an ease-out curve, so the dashboard *assembles* rather than blinks in. Hover on a card lifts it subtly (shadow + 1–2px rise, ≤150ms); focus shows the standard focus ring (token geometry). The refresh indicator (when a section is re-polling) is a calm pulse, never a strobe.
- **Reduced motion & contrast.** Under `prefers-reduced-motion: reduce` the entrance cascade, hover lift, and any rotation collapse to **instant** (content simply present). WCAG-AA holds at every Colour intensity because all foreground colour comes from the `--text-*` ramp against the glass/substrate, not the hue.
- **Empty/calm states.** A folder with no items reads as a quiet, welcomed space (brand-voice line), not an error. Ghost cards are static low-alpha placeholders (no shimmer).
- **Where this improves on Arc.** Arc's folders are sidebar-only lists; Lunma promotes a work/reading folder to a full immersive page that still belongs to the *same Space* (same hue, same aurora) — and because a Space can be active in multiple windows, the page resolves its own window so two windows can each hold the same folder's page tinted identically yet bound independently.

Primitives composed (no re-roll): `Aurora`, `Surface`, `Icon`, `FaviconTile` + favicon helpers, `Button`, `Chip`, `Kbd`. New primitives: **none** — `FolderPageItem` and the section panel are feature components composing the above; if review during apply finds a genuinely cross-surface card primitive is warranted, it ships here with its contract proven by use (flagged as a deviation if so).

## Risks / Trade-offs

- **Dedupe-by-query misses an existing page tab** (e.g. URL rewritten) → a duplicate page tab opens. *Mitigation:* match on the stable path + `folderId` param only (ignore other params); the page never rewrites its own URL. Worst case is one extra tab, not a broken state.
- **Discoverability of the open-as-page icon** — it's hover/focus-revealed, so a pure-pointer user might not notice it. *Mitigation:* it sits beside the always-discoverable kebab `"Open as page"` item, and reveals on keyboard focus for a11y. (The earlier body-click gesture was reverted as too surprising — see D3 / Q1.)
- **Card-with-slots looks empty/over-built in A** if slots aren't truly zero-height when unfilled. *Mitigation:* slots are conditionally rendered (`{#if item.excerpt}`…), not reserved whitespace; A must visually read as a finished link card, verified against the sidebar's density.
- **Build/manifest wiring for a non-override page** is the least-trodden path here. *Mitigation:* `rollupOptions.input` + `web_accessible_resources` is the standard crxjs recipe for extension-owned pages; verified by the page actually loading at its URL in `pnpm test:e2e` smoke.
- **Feed item opened from the page drains read-state** (consume = close). This is correct (same as the sidebar) but means the page's own list will change under the user as they read. *Mitigation:* it mirrors the sidebar exactly; the page re-renders from the broadcast like any consumer. Documented, not "fixed."

## Open Questions

- **Q1 (gesture) — RESOLVED.** The body-click-opens-page split was shipped, then reverted at the user's request to the lower-surprise model: body + chevron toggle expand/collapse; the page opens via the header "open as page" icon (`maximize-2`) + the kebab item. See D3.
- **Q2:** Should the page header offer a **"back to sidebar"/reveal-in-sidebar** affordance, or is closing the tab enough? (Lean: none in A — the sidebar is always present; revisit if users ask.)
- **Q3:** Wide-viewport column count — purely token-driven `minmax` auto-fill (recommended) vs. a capped max columns for very wide monitors so cards don't get too sparse. (Lean: auto-fill with a sensible `minmax` min; cap only if it looks sparse in review.)
