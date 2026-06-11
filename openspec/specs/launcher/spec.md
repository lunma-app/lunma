# launcher Specification

## Purpose
TBD - created by archiving change launcher-v1. Update Purpose after archive.
## Requirements
### Requirement: Shared search engine and data providers

The launcher SHALL provide a single search engine in `apps/extension/src/launcher/shared/` that
runs **in the service worker** and merges results from four data providers. The
engine SHALL be a pure function of its inputs (query string + injected data
sources) with no surface-specific state. The four providers SHALL be:

- **open tabs** — from `chrome.tabs.query({})`, EXCLUDING the active window's
  active tab; each result carries its `tabId` and `windowId`.
- **saved tabs** — from `LunmaStore.state.savedTabs` (pinned + favicon-row records);
  each result carries its `savedTabId` and is matched on `title` and
  `currentURL ?? originalURL`. When the saved tab is **bound to a live tab**
  (`state.tabBindings[savedTabId]` is a tab id), the result ALSO carries that
  `tabId`; its presence is the signal a surface uses to choose `focusSavedTab`
  over `openSavedTab` without itself reading bindings (so the stateless `Alt+L`
  overlay can decide from the result alone).
- **bookmarks** — from `chrome.bookmarks.search(query)`.
- **history** — from `chrome.history.search({ text: query, maxResults: 100 })`.

A `LauncherResult` SHALL carry at least `{ id, source: 'tab' | 'saved' | 'bookmark'
| 'history' | 'websearch' | 'navigate', title, url, score }` plus the
source-specific action fields (`tabId`/`windowId` for `tab`, `savedTabId` for
`saved`). The `'websearch'` and `'navigate'` sources are **synthesized action
results** (see "Synthesized web-search and navigation results"), not produced by any
of the four providers; each carries a pre-built `url`. An **empty/whitespace query
SHALL return no results.**

#### Scenario: The engine queries all four sources

- **WHEN** the engine runs a non-empty query
- **THEN** it SHALL consult the open-tabs, saved-tabs, bookmarks, and history
  providers and return a single merged result list
- **AND** it SHALL exclude the active window's active tab from the open-tabs results

#### Scenario: An empty query yields no results

- **WHEN** the engine runs with an empty or whitespace-only query
- **THEN** it SHALL return an empty result list (the surfaces show their idle state)

### Requirement: Result de-duplication, scoring, and ordering

The engine SHALL de-duplicate results that share a URL with this precedence:
**open tab > saved tab > bookmark > history** (the higher-precedence result is
kept, the lower suppressed). It SHALL score each surviving result deterministically
from match quality (title/URL prefix > word-boundary substring > plain substring),
field weight (title over URL), and source weight (tab > saved > bookmark >
history), and SHALL return results sorted by score descending with a stable tie
order. The merged list SHALL be capped to a fixed maximum; when results are
truncated the engine SHALL emit a `log` line (never a silent cap).

This de-duplication, scoring, and cap apply to the **four-provider (data) results**
only. The **synthesized action results** (`websearch`/`navigate`) SHALL NOT be
scored, SHALL NOT be de-duplicated against data results, and SHALL NOT count
against the cap; they occupy fixed positions ahead of the data results (websearch
first, then navigate) per "Synthesized web-search and navigation results".

#### Scenario: A URL open as a tab suppresses its history entry

- **GIVEN** `https://example.com/` is both an open tab and a history entry matching the query
- **WHEN** the engine merges results
- **THEN** the list SHALL contain the open-tab result for that URL and SHALL NOT contain a duplicate history result for it

#### Scenario: A saved tab suppresses its bookmark duplicate

- **GIVEN** `https://example.com/` is both a Lunma saved tab and a Chrome bookmark matching the query
- **WHEN** the engine merges results
- **THEN** the list SHALL contain the saved-tab result and SHALL NOT contain a duplicate bookmark result

#### Scenario: Results are ordered by score, capped, and truncation is logged

- **WHEN** more matches exist than the result cap
- **THEN** the returned list SHALL be the highest-scored results in descending score order, no longer than the cap
- **AND** a `log` line SHALL record that results were truncated

#### Scenario: Synthesized action results are not capped

- **GIVEN** the provider results already fill the `MAX_RESULTS` cap
- **WHEN** the response is composed for a non-empty query
- **THEN** the `websearch` (and any `navigate`) action result SHALL still be present
  beyond the cap, and SHALL NOT displace a scored data result

### Requirement: Acting on a launcher result

Selecting a result SHALL dispatch through the existing typed message bus, never by
mutating Lunma state directly:

- a `tab` result SHALL dispatch `focusTab { tabId }`;
- a `saved` result SHALL dispatch `focusSavedTab` when the saved tab is bound to a
  live tab (i.e. the result carries a `tabId`), else `openSavedTab`;
- a `bookmark`, `history`, `websearch`, or `navigate` result SHALL dispatch
  `openUrl { url, windowId }`. The `websearch`/`navigate` results carry a pre-built
  search/target `url`, so they reuse this branch and require **no new dispatch
  logic** in either surface's `act()`.

#### Scenario: Selecting an open-tab result focuses that tab

- **WHEN** the user acts on a `tab` result for tab 22
- **THEN** the surface SHALL dispatch `bus.send({ kind: 'focusTab', payload: { tabId: 22 } })`

#### Scenario: Selecting a bookmark result opens its URL

- **WHEN** the user acts on a `bookmark` result for `https://example.com/` in window 100
- **THEN** the surface SHALL dispatch `bus.send({ kind: 'openUrl', payload: { url: 'https://example.com/', windowId: 100 } })`

#### Scenario: Selecting a dormant saved tab opens it, a bound one focuses it

- **WHEN** the user acts on a `saved` result whose saved tab is dormant
- **THEN** the surface SHALL dispatch `openSavedTab`
- **WHEN** the saved tab is bound to a live tab
- **THEN** the surface SHALL dispatch `focusSavedTab`

#### Scenario: Selecting the web-search action opens the search URL

- **WHEN** the user acts on a `websearch` result whose `url` is
  `https://www.google.com/search?q=react%20hooks` in window 100
- **THEN** the surface SHALL dispatch `openUrl { url: 'https://www.google.com/search?q=react%20hooks', windowId: 100 }`

#### Scenario: Selecting the go-to action navigates to the URL

- **WHEN** the user acts on a `navigate` result whose `url` is `https://react.dev` in window 100
- **THEN** the surface SHALL dispatch `openUrl { url: 'https://react.dev', windowId: 100 }`

### Requirement: New-tab page inline launcher surface

The new-tab page (`apps/extension/src/launcher/newtab/NewTab.svelte`) SHALL host a live
search input in place of the inert placeholder shipped by
`lunma-new-tab-home`. The search input SHALL have **two stable poses**: a
**centred idle pose** (empty query) and a **raised search pose** near the
top of the viewport (active query). Within a pose its vertical position
SHALL NOT shift as results appear, change count, or clear (no
per-keystroke reflow); it SHALL move **only** on the idle↔search
transition, gliding smoothly between the two poses. With an empty query
the page SHALL render the active Space's full identity **home** (the idle
state). On a non-empty query the page SHALL collapse the full identity
into a compact identity **chip** (the Space icon + name) above the raised
input, query the suggestions channel, and render a results list **below**
the input. The full identity SHALL NOT be unmounted on the first
keystroke; it SHALL crossfade to the chip. It SHALL compose the `apps/extension/src/ui`
primitives `ResultRow` and `ResultList` (and the existing `Icon` / `Kbd` /
`Surface`); it SHALL NOT re-roll row/list styling inline.

The search input SHALL **autofocus on initial mount**, AND SHALL **refocus its
idle-home input when the page is reactivated** — the page becomes visible again
(`document` `visibilitychange` → `visible`) or the window regains focus (`window`
`focus`) — so a reused new-tab launcher (the `Alt+L` fallback focusing an
already-open new-tab via `chrome.tabs.update({ active: true })`, or a user
switching back to it) is immediately typeable even though the page is not
remounted. The refocus SHALL apply **only to the idle home** (no locked engine and
an empty query): a deliberate mid-search state (a locked engine chip or typed
query) SHALL NOT have its focus overridden on reactivation.

#### Scenario: Empty query shows the identity home

- **WHEN** the new-tab search input is empty
- **THEN** the page SHALL render the active Space's full identity home (icon tile + name + meta, no results list)

#### Scenario: Typing collapses the identity to a chip

- **GIVEN** the new-tab page is showing the full identity home
- **WHEN** the user types a non-empty query
- **THEN** the full identity SHALL collapse into a compact identity chip (the Space icon + name) above the input
- **AND** the identity SHALL NOT be unmounted abruptly (it crossfades to the chip)

#### Scenario: The search input rises once, then holds steady as results change

- **GIVEN** the new-tab page is at the idle home with the input centred
- **WHEN** the user types a query
- **THEN** the input SHALL glide once from the centred idle pose up to the raised search pose
- **AND** as the results list then grows or shrinks the input's vertical position SHALL remain unchanged (no per-keystroke reflow)

#### Scenario: Typing renders scored results

- **WHEN** the user types a non-empty query on the new-tab page
- **THEN** the page SHALL request suggestions for that query and render the returned results as `ResultRow`s within a `ResultList` below the input

#### Scenario: A reactivated new-tab launcher refocuses its input

- **GIVEN** an already-open new-tab launcher at its idle home whose search input does not currently hold focus
- **WHEN** the tab is reactivated (the page becomes visible again — e.g. the `Alt+L` new-tab fallback focuses it — or the window regains focus)
- **THEN** the new-tab page SHALL refocus its search input so the user can type immediately
- **AND** if instead the page is in a non-idle state (a locked engine or a typed query), its focus SHALL NOT be overridden

### Requirement: Alt+L overlay surface

The launcher SHALL provide an overlay delivered by a content script
(`apps/extension/src/launcher/overlay.ts`) injected at `document_start` on `<all_urls>`, dormant
until toggled by `Alt+L`. When toggled open it SHALL render a centered
command-palette card inside a **shadow DOM** styled by a **constructable
stylesheet** derived from `@lunma/tokens` (so host-page CSS neither bleeds in
nor leaks out). The overlay SHALL carry **no Svelte runtime**; it mirrors the
`ResultRow`/`ResultList` visual contract in vanilla TypeScript against the design
tokens (the documented component-library exception in this change's `design.md`).
The dormant content-script bundle SHALL stay under 15KB gzipped.

#### Scenario: Alt+L opens the overlay on any page

- **WHEN** the user presses `Alt+L` on an arbitrary web page
- **THEN** the overlay SHALL open as a shadow-DOM command-palette card over the page

#### Scenario: The overlay isolates its styles from the host page

- **WHEN** the overlay is open on a page with its own aggressive CSS
- **THEN** the overlay's appearance SHALL be governed only by its constructable stylesheet (shadow-DOM isolated), and the host page's layout SHALL be unaffected

### Requirement: Launcher keyboard interaction model

Both surfaces SHALL share one keyboard model: typing filters; `ArrowUp` /
`ArrowDown` move a roving selection through the results (wrapping at the ends);
`Enter` acts on the selected result (per "Acting on a launcher result"); `Escape`
closes the surface — the overlay hides, and the new-tab page clears the query back
to the idle identity home, in both cases also clearing any active engine. `Alt+L`
SHALL toggle the overlay open/closed.

`Tab` and `Backspace` extend the model for Tab-to-search (per "Tab-to-search engine
keyword switching"): when no engine is active and a keyword prefix is recognized,
`Tab` activates the first candidate engine, and repeated `Tab` cycles ambiguous
matches (`Shift+Tab` reverses); otherwise `Tab` is not intercepted. When an engine
is active and the query input is empty, `Backspace` clears the active engine.

#### Scenario: Arrow keys move the selection and Enter acts

- **GIVEN** a results list is shown with the first row selected
- **WHEN** the user presses `ArrowDown` then `Enter`
- **THEN** the selection SHALL move to the second row and the surface SHALL act on that row's result

#### Scenario: Escape returns the new-tab page to the idle home

- **GIVEN** the new-tab page is showing results for a query
- **WHEN** the user presses `Escape`
- **THEN** the query SHALL clear and the page SHALL render the active Space's identity home

#### Scenario: Tab activates a recognized engine

- **GIVEN** no engine is active and the leading token is a recognized keyword
- **WHEN** the user presses `Tab`
- **THEN** the surface SHALL enter engine mode for that engine (per "Tab-to-search engine keyword switching")

#### Scenario: Backspace on an empty engine-mode query clears the engine

- **GIVEN** an engine is active and the query input is empty
- **WHEN** the user presses `Backspace`
- **THEN** the active engine SHALL be cleared

### Requirement: The launcher overlay is injected on demand for the command path

The `toggle-launcher` (`Alt+L`) command SHALL open the overlay on the active tab
even when that tab has no overlay content script yet — the case for any tab that
was already open when the extension started, since declarative content scripts
inject only into tabs opened/reloaded afterwards. The service worker's command
handler SHALL first attempt `chrome.tabs.sendMessage`; when that finds no
receiver, it SHALL inject the overlay via `chrome.scripting.executeScript`
(targeting the active tab, using the overlay content script the manifest
declares — selected **by filename**, not by array index) and then re-send the
toggle. Re-injection SHALL be idempotent (the overlay's install guard prevents a
second initialization). The `scripting` permission SHALL be present in the
manifest for this.

On pages where Chrome forbids injection (`chrome://`, the Chrome Web Store, the
extension's own pages) — or when there is no injectable active tab at all — the
command SHALL **fall back to opening the new-tab launcher** in the focused window
rather than being a no-op: it SHALL focus an existing new-tab launcher in that
window when one is open, otherwise create one by the launcher's **explicit
extension URL** (`chrome.tabs.create({ url: chrome.runtime.getURL(NEWTAB_PAGE_PATH),
windowId, active: true })`) — **not** the bare `chrome_url_overrides.newtab`
override, because on the new-tab-page surface Chrome focuses the omnibox and
suppresses the page's autofocus, which would leave the caret in the address bar
instead of the launcher's search input. The newly opened or focused launcher SHALL
land with its **search input focused** so it is immediately typeable (see "New-tab
page inline launcher surface"). This makes `Alt+L`
reach a launcher from any focus context (the sidebar, the options page, a
`chrome://` page, the Web Store), via the new-tab launcher surface where the
in-place overlay is impossible. The fallback fires only via the global
`chrome.commands` shortcut (the per-page keydown fallback cannot run off web
pages), so it depends on that shortcut being bound (see "Detect and guide when the
launcher shortcut is unbound").

#### Scenario: Alt+L opens the overlay on an already-open tab

- **GIVEN** a tab that was already open when the extension started (no overlay content script present)
- **WHEN** the `toggle-launcher` command fires for that active tab
- **THEN** the service worker SHALL inject the overlay via `chrome.scripting.executeScript`
- **AND** re-send `lunma/toggle-launcher` so the overlay opens without a page reload

#### Scenario: A page that forbids injection falls back to the new-tab launcher

- **WHEN** the `toggle-launcher` command fires while a `chrome://` page (or the Web
  Store, or an extension page such as the options page) is active, or while the
  sidebar is focused over such a tab
- **THEN** no overlay SHALL be injected onto that page
- **AND** the service worker SHALL open the new-tab launcher in the focused window
  (focusing an existing new-tab launcher there if one is already open, else
  creating one) so `Alt+L` still reaches a launcher

#### Scenario: The fallback launcher opens focused and ready to type

- **WHEN** the fallback **creates** a new-tab launcher (no existing one to reuse)
- **THEN** it SHALL open the launcher by its explicit extension URL
  (`chrome.runtime.getURL(NEWTAB_PAGE_PATH)`), not the bare `newtab` override, so
  Chrome does not divert focus to the omnibox
- **AND** the launcher's search input SHALL be focused so the user can type
  immediately without clicking

### Requirement: Alt+L opens the launcher overlay without a bound command shortcut

The launcher overlay SHALL open on Alt+L via a page-level keydown listener
in the content script, so it works on any page where the content script
runs regardless of whether Chrome has bound the `toggle-launcher`
`chrome.commands` shortcut. The `chrome.commands` shortcut, when bound,
SHALL remain an equivalent second trigger; both paths toggle the same
overlay. This keydown listener is the mechanism by which the existing
"Alt+L overlay surface" requirement's scenario — "Alt+L opens the overlay
on any page" — actually holds when Chrome leaves the command unbound; it
refines that requirement rather than restating it.

The keydown listener SHALL be non-intrusive: it SHALL act only on Alt+L
(`altKey` true, with neither Ctrl nor Meta held; matched by physical key
`code === 'KeyL'` so macOS Option dead-keys still match), SHALL NOT
intercept the key while the overlay is closed and focus is in an editable
field (`input`, `textarea`, or `contenteditable`), and SHALL prevent the
page's default handling only when it actually toggles the overlay.

#### Scenario: Overlay opens on Alt+L with the command shortcut unbound

- **WHEN** the user presses `Alt+L` on an ordinary web page
- **AND** the `toggle-launcher` `chrome.commands` shortcut is unbound
- **THEN** the launcher overlay SHALL appear with an empty query and a focused input

#### Scenario: Alt+L is ignored while typing in a page field

- **WHEN** the overlay is closed and focus is in a page `input`, `textarea`,
  or `contenteditable` element
- **AND** the user presses `Alt+L`
- **THEN** the overlay SHALL NOT open and the page SHALL receive the key

#### Scenario: Alt+L closes the overlay when it is open

- **WHEN** the launcher overlay is open
- **AND** the user presses `Alt+L`
- **THEN** the overlay SHALL close

#### Scenario: Plain L and other modifiers do not trigger the overlay

- **WHEN** the user presses `L`, `Ctrl+Alt+L`, or `Meta+Alt+L`
- **THEN** the overlay SHALL NOT toggle

### Requirement: Overlay resolves its window id for the keydown path

The overlay SHALL resolve the current window id when it opens via the
keydown fallback (which carries no service-worker message payload) by
requesting it from the service worker via a `lunma/current-window`
message, whose handler SHALL respond with `sender.tab?.windowId` (or a
`-1` sentinel when unavailable). The resolved window id SHALL scope the
overlay's suggestions query and `openUrl` actions, so keyboard-opened and
command-opened overlays behave identically.

#### Scenario: Keydown-opened overlay uses the real window id

- **WHEN** the overlay is opened by the `Alt+L` keydown fallback
- **THEN** it SHALL request `lunma/current-window` from the service worker
- **AND** subsequent suggestions requests and `openUrl` actions SHALL carry
  that window id rather than the `-1` sentinel

### Requirement: Detect and guide when the launcher shortcut is unbound

The options page SHALL detect when the `toggle-launcher` command has no
bound shortcut (via `chrome.commands.getAll()`, an empty `shortcut`) and
SHALL surface guidance: an explanation that `Alt+L` may be unset and a
control that opens `chrome://extensions/shortcuts` so the user can bind
it. When the shortcut IS bound, the options page SHALL NOT show the
guidance. This covers pages where the keydown fallback cannot run
(`chrome://` pages, the Chrome Web Store, the PDF viewer), since an
extension cannot bind a `chrome.commands` shortcut programmatically.

#### Scenario: Options shows guidance when the shortcut is unbound

- **WHEN** the user opens the options page
- **AND** `chrome.commands.getAll()` reports the `toggle-launcher` command
  with an empty `shortcut`
- **THEN** the options page SHALL show guidance that the launcher shortcut
  is not set
- **AND** SHALL offer a control that opens `chrome://extensions/shortcuts`

#### Scenario: No guidance when the shortcut is bound

- **WHEN** the user opens the options page
- **AND** the `toggle-launcher` command reports a non-empty `shortcut`
- **THEN** the options page SHALL NOT show the unbound-shortcut guidance

### Requirement: The launcher overlay is backfilled into already-open tabs on install

On extension install or update the service worker SHALL inject the overlay
content script into every already-open injectable tab, so the `Alt+L`
keydown fallback (per "Alt+L opens the launcher overlay without a bound
command shortcut") works on those tabs without a manual reload. This closes
the gap left by declarative content scripts, which inject only into tabs
opened or reloaded after the extension loads — a tab that predates the load
otherwise has no overlay content script and no keydown listener, and when
the `toggle-launcher` command is unbound the command path's on-demand
injection never fires for it either.

The service worker SHALL register a `chrome.runtime.onInstalled` listener
synchronously at top-level (so it is present for the install event) and
SHALL inject via `chrome.scripting.executeScript` using the overlay content
script the manifest declares, selected **by filename** (not by array index).
The backfill SHALL target only `http`/`https` tabs, SHALL isolate per-tab
failures so one tab Chrome forbids injecting into does not abort the rest,
and SHALL be idempotent — a tab that already runs the overlay is a no-op via
the overlay's install guard.

#### Scenario: Alt+L works on a tab that was open before install

- **GIVEN** an `http(s)` tab that was already open when the extension was installed or updated (no overlay content script present)
- **WHEN** the `chrome.runtime.onInstalled` event fires
- **THEN** the service worker SHALL inject the overlay into that tab via `chrome.scripting.executeScript`
- **AND** pressing `Alt+L` on that tab SHALL open the overlay without reloading the page

#### Scenario: Non-injectable tabs are skipped without error

- **GIVEN** open tabs including a `chrome://` page, an extension page, and the Lunma new-tab page
- **WHEN** the backfill runs on install
- **THEN** those tabs SHALL be skipped (not injected) and the backfill SHALL continue injecting the remaining `http(s)` tabs without aborting

#### Scenario: Re-injection of an already-running overlay is a no-op

- **GIVEN** a tab that already runs the overlay content script
- **WHEN** the backfill injects the overlay into it again
- **THEN** the overlay SHALL NOT re-initialize (its `__lunmaLauncherInstalled` guard early-returns) and no duplicate listeners or hosts SHALL be created

### Requirement: Launcher hero surfaces render the immersive treatment

Lunma's launcher SHALL render its two hero surfaces, the new-tab home and
the `Alt+L` overlay, with the immersive visual treatment, driven by the
active Space's colour and scaled by the active tint level.

On the new-tab home, the active Space's colour SHALL fill the viewport as
an aurora hue-mesh backdrop; the Space identity SHALL be presented as a
frosted-glass icon tile carrying the Space's hue glow, with the Space name
set in the display serif at display size with a hue text-glow and a quiet
meta line beneath it; the search SHALL be a frosted-glass input pill; and
results SHALL render in a frosted-glass card. **While searching, the full
identity SHALL collapse into a compact identity chip — the Space icon
(in the Space colour) + name — composed from the shared `Surface` and
`Icon` primitives, with no re-rolled glass.** The identity, search, and
results SHALL stagger their entrance on load. When no active Space is
resolved, the home SHALL show the neutral substrate with no name/icon and
no loading flash. The home SHALL compose the shared `Aurora`, `Surface`,
and `SearchField` primitives and SHALL NOT re-roll glass, aurora, or the
search pill inline.

On the `Alt+L` overlay, the scrim SHALL use the immersive scrim treatment
(a tinted backdrop blur) and the card SHALL render as a frosted-glass
panel mirroring the shared `Surface` glass contract (the overlay is
vanilla CSS by its documented no-Svelte exception, so it mirrors the
contract rather than importing the primitive).

All entrance and ambient (aurora drift) motion SHALL be removed under
`prefers-reduced-motion`, with an identical end state. Body and result
text SHALL remain at least WCAG-AA legible over the aurora and over the
frosted glass at every tint level.

#### Scenario: New-tab home renders the immersive identity

- **WHEN** the new-tab page renders with a resolved active Space and an empty query
- **THEN** an aurora backdrop in the Space's hue SHALL fill the viewport
- **AND** the Space's icon SHALL appear in a frosted-glass tile carrying the Space's hue glow
- **AND** the Space name SHALL be set in the display serif at display size
- **AND** the search pill and the results card SHALL render as frosted glass
- **AND** the identity, search, and results SHALL stagger their entrance on load

#### Scenario: New-tab home collapses identity to a chip while searching

- **WHEN** the new-tab page has a non-empty query
- **THEN** the full identity SHALL be replaced by a compact identity chip (Space icon in the Space colour + name) composed from `Surface` + `Icon`
- **AND** the chip + input SHALL ride up to the raised search pose and hold it (no reflow as the result count changes)

#### Scenario: New-tab home with no resolved Space

- **WHEN** the new-tab page renders with no resolved active Space
- **THEN** it SHALL show the neutral substrate with no Space name or icon
- **AND** it SHALL NOT show a spinner or a loading flash

#### Scenario: Overlay renders as frosted glass

- **WHEN** the `Alt+L` overlay opens
- **THEN** its scrim SHALL apply the immersive backdrop-blur treatment
- **AND** its card SHALL render as a frosted-glass panel mirroring the shared `Surface` glass contract

#### Scenario: Reduced motion removes entrance and drift

- **WHEN** the user prefers reduced motion
- **THEN** the new-tab staggered entrance, the identity↔chip crossfade, the idle↔search pose glide, and the aurora drift SHALL NOT animate
- **AND** the surfaces SHALL settle directly to their final state (the input snaps to its pose)

### Requirement: The launcher overlay reflects the active Space colour

When the overlay opens, the service worker SHALL provide the active Space's hue and
chroma for the opening window — derived from the window's active Space colour — on
the open path. This SHALL apply to both open paths: the `lunma/toggle-launcher`
message (command shortcut) SHALL carry the hue and chroma, and the
`lunma/current-window` response used by the `Alt+L` keydown fallback SHALL carry
them alongside the window id.

The overlay SHALL tint its card wash, its accent, and its selected-row bar with the
provided hue. When the hue is unavailable — no active Space for the window, a
neutral (`gray`) Space, or a service worker that does not provide it — the overlay
SHALL fall back to its default accent. The overlay SHALL NOT request the full
application state nor import the state-message module to derive the hue itself; it
SHALL consume only the two numeric values the service worker provides.

#### Scenario: Overlay glows in the active Space's colour

- **WHEN** the overlay opens in a window whose active Space has a non-neutral colour
- **THEN** the service worker SHALL include the Space's hue and chroma on the open message
- **AND** the overlay's card wash, accent, and selected-row bar SHALL be tinted with that hue

#### Scenario: Keydown-opened overlay receives the hue with its window id

- **WHEN** the overlay is opened by the `Alt+L` keydown fallback
- **THEN** the `lunma/current-window` response SHALL carry the active Space's hue and chroma alongside the window id
- **AND** the overlay SHALL tint itself with that hue exactly as on the command path

#### Scenario: Fallback to the default accent when the hue is unavailable

- **WHEN** the overlay opens in a window with no active Space, or whose active Space is neutral (`gray`), or against a service worker that provides no hue
- **THEN** the overlay SHALL render with its default accent
- **AND** SHALL NOT error or block on the missing hue

### Requirement: The launcher overlay stays legible over arbitrary host pages

The launcher overlay card SHALL render as a near-opaque frosted panel — opaque enough
that the host page does not bleed through and the input and result text remain legible
over any host page (bright, dark, or busy). The scrim SHALL recede the host page
primarily by **dimming**, applying only a **light** backdrop blur rather than a heavy
full-page blur. The card SHALL still tint toward the active Space's colour (or the
resting ember hue when no Space is active), and the selected-row accent SHALL remain
visible on the more-opaque card.

#### Scenario: Legible over a bright, busy page

- **WHEN** the overlay opens over a bright, high-contrast, content-dense host page
- **THEN** the card SHALL read as a solid frosted panel whose colour does not shift
  with the page behind it
- **AND** the input and result text SHALL stay legible
- **AND** the host page SHALL be dimmed with only a light blur, not a heavy full-page smear

#### Scenario: Still tints to the active Space

- **WHEN** the overlay opens with an active Space colour provided
- **THEN** the more-opaque card SHALL still carry a tint toward that Space's hue (or the
  resting ember hue when none is provided)

### Requirement: Synthesized web-search and navigation results

For a **non-empty** query the launcher-suggestions response SHALL include
**synthesized action results** alongside the four-provider results, built
service-worker-side from the user's configured default search engine (see the
`settings` capability). Synthesis SHALL live in `apps/extension/src/launcher/shared/web-actions.ts`
(`classifyInput`, `buildSearchUrl`, `resolveDefaultEngine`, `buildWebActionResults`)
as a pure module; the SW suggestions handler SHALL invoke it and compose the final
list as `[ websearch, navigate?, ...providerResults ]`.

- A **`websearch`** result (`source: 'websearch'`) SHALL always be present for a
  non-empty query and SHALL be ordered **first** — it is the preselected default
  (roving selection index 0), so pressing Enter on a query web-searches it; a
  matching open tab / bookmark is reached with `↓`. Its `url` SHALL be the resolved
  default engine's `urlTemplate` with `%s` replaced by the
  `encodeURIComponent`-escaped query. Its title SHALL name the engine and echo the
  query (e.g. `Search Google for "react hooks"`).
- A **`navigate`** result (`source: 'navigate'`) SHALL be present **only** when the
  raw input is URL-shaped or ambiguous (per the classification below) and SHALL be
  ordered **second**, immediately after the `websearch` row. Its `url` SHALL be the
  resolved target (`https://`-prefixed when the input carries no scheme); its title
  SHALL read `Go to ⟨url⟩`.

`classifyInput(raw)` SHALL classify the trimmed input as:

- an `http://`/`https://` scheme present → **url** (navigate offered);
- any other scheme present (`javascript:`, `file:`, `chrome:`, …) → **search**
  (no navigate — the launcher SHALL NOT synthesize navigation to a non-web scheme);
- no scheme, no whitespace, containing a dot whose last label is ≥ 2 letters (or
  `localhost`, or an IPv4) → **ambiguous** (BOTH a navigate and the websearch row
  are offered so the user chooses — the launcher SHALL NOT guess a single intent);
- otherwise (whitespace present, or no dot) → **search** (websearch only).

The synthesized action results SHALL NOT be scored, de-duplicated, or capped with
the provider results; they are additive (the response MAY exceed `MAX_RESULTS` by
up to two). An **empty/whitespace query SHALL still return no results** (no action
rows on the idle home).

#### Scenario: A non-empty query always offers a web-search action first

- **WHEN** the suggestions handler answers a non-empty query
- **THEN** the result list SHALL include a `websearch` result ordered first (the
  preselected default)
- **AND** its `url` SHALL be the default engine's template with the
  `encodeURIComponent`-escaped query substituted for `%s`

#### Scenario: A URL-shaped query offers a go-to action under the search row

- **WHEN** the query is `https://example.com/x` (or scheme-less `example.com/x`)
- **THEN** the list SHALL include the `websearch` result first and a `navigate`
  result second whose `url` is `https://example.com/x`

#### Scenario: An ambiguous token offers both go-to and web-search

- **WHEN** the query is `react.dev` (no scheme, no whitespace, dotted)
- **THEN** the list SHALL include BOTH a `navigate` result (to `https://react.dev`)
  and the `websearch` result, and SHALL NOT collapse them into a single guess

#### Scenario: A multi-word query offers web search only

- **WHEN** the query is `how to center a div` (contains whitespace)
- **THEN** the list SHALL include the `websearch` result and SHALL NOT include a
  `navigate` result

#### Scenario: A non-web scheme is not offered as navigation

- **WHEN** the query is `javascript:alert(1)` or `file:///etc/passwd`
- **THEN** the list SHALL NOT include a `navigate` result (it is treated as search)

#### Scenario: An empty query yields no action results

- **WHEN** the query is empty or whitespace-only
- **THEN** the response SHALL contain no results at all (no `websearch` or
  `navigate` rows)

### Requirement: The open overlay isolates keystrokes from the host page

While the `Alt+L` overlay is open, keystrokes typed into it SHALL NOT propagate
to the host page's keyboard handlers. The overlay's closed shadow root retargets
bubbled events to the host element, so a page's single-key shortcut handler
(e.g. Gmail "q", Linear "b") would otherwise see a non-input target and fire — or
`preventDefault` the key so the character never reaches the launcher input. The
overlay SHALL stop propagation of `keydown`/`keypress`/`keyup` at its root
(bubble phase, without `preventDefault`) so page document/window handlers never
see keys meant for the launcher, while the input still receives them. (This makes
the web-search query box usable on any web app; it does not affect the
capture-phase `Alt+L` toggle, which still closes the open overlay.)

#### Scenario: A single-key host shortcut does not steal a launcher keystroke

- **WHEN** the overlay is open over a page whose document has a single-key
  keyboard shortcut, and the user types that key into the launcher input
- **THEN** the page's keyboard handler SHALL NOT receive the key
- **AND** the character SHALL appear in the launcher input

### Requirement: Tab-to-search engine keyword switching

The launcher SHALL let the user switch into a specific search engine by keyword.

The engine registry SHALL be assembled by `buildEngineRegistry(settings)`
(`apps/extension/src/shared/search-engines.ts`): the `BUILT_IN_ENGINES` (each now carrying a
`keyword`) plus the custom engine when it is valid — its `customSearchUrl` contains
`%s`, its `customSearchKeyword` is non-empty, and that keyword does not collide
with a built-in keyword. The new-tab page SHALL build the registry from settings
directly; for the `Alt+L` overlay the service worker SHALL attach the registry as
an additive optional `engines` field (`{ id, name, keyword, urlTemplate }[]`,
`EngineSummary`) on the `lunma/toggle-launcher` open message and the
`lunma/current-window-result` response, alongside the existing window id and Space
hue, so the overlay needs no settings access. The `urlTemplate` SHALL ride so the
overlay can build the active engine's search URL via `buildSearchUrl` (including a
custom engine, whose template is not a code constant). The default engine id SHALL
NOT be added to those messages.

`resolveEngine(raw, registry)` (`apps/extension/src/launcher/shared/web-actions.ts`) SHALL match
the leading whitespace-delimited token **case-insensitively** as a prefix of each
engine's **keyword OR its name**, and return — without consuming — every matching
registry engine in registry order (the `candidates`), plus the remaining query.
Matching the name (not only the short keyword) lets a name prefix beyond the
keyword resolve the engine (e.g. `g`/`go`/`google` → Google, `p`/`per` →
Perplexity); the short keyword alias (e.g. `yt`, `ddg`) also matches even when it is
not a name prefix.

When no engine is active and a prefix is recognized (≥1 candidate), the surface
SHALL show a "⇥ Tab" affordance listing the candidate engine(s), each with its
favicon. Pressing **Tab** SHALL activate the first candidate: the surface SHALL
display the engine as a removable `Chip` (engine favicon + name, composed in a
`leading` slot of `SearchField`; the overlay mirrors it in vanilla), set the input
to the remaining query, and enter **engine mode**. When the prefix is ambiguous
(≥2 candidates), repeated **Tab** SHALL cycle through the candidates in order
(wrapping), and **Shift+Tab** SHALL cycle in reverse. A recognized keyword SHALL
NOT auto-activate — Tab is the only opt-in; plain `Enter` on a recognized keyword
SHALL behave per `launcher-web-search` (search the default engine for the literal
text). When no prefix is recognized, Tab SHALL NOT be intercepted (normal focus
traversal). The engine favicon SHALL be sourced from the engine domain via the
shared `_favicon` helper.

In **engine mode** the surface SHALL render a single action result —
`Search ⟨Engine⟩ for "⟨query⟩"` — built client-side via `buildSearchUrl(engine,
query)` wrapped as a `websearch` `LauncherResult`; the four-source finder and the
default web-search row SHALL be suppressed. Acting on it SHALL dispatch `openUrl`
(per "Acting on a launcher result"). An empty query in engine mode SHALL render the
chip with no action row.

The active engine SHALL be cleared (the chip popped) by Backspace when the query is
empty, by the chip's remove (×) control, or by Escape (which also closes the
overlay / returns the new-tab page to its idle home).

#### Scenario: A recognized keyword shows the Tab affordance

- **GIVEN** the registry contains an engine with keyword `yt` named `YouTube`
- **WHEN** the user types `yt` with no engine active
- **THEN** the surface SHALL show a "⇥ Tab to search YouTube" affordance
- **AND** SHALL NOT have switched engines yet

#### Scenario: A name prefix beyond the keyword still recognizes the engine

- **GIVEN** the registry contains `Google` (keyword `g`) and `Perplexity` (keyword `p`)
- **WHEN** the user types `goo` (a prefix of the name, not of the keyword `g`)
- **THEN** the surface SHALL recognize `Google` and show its "⇥ Tab" affordance
- **AND** typing `per` SHALL likewise recognize `Perplexity`
- **AND** matching SHALL be case-insensitive (`Google`, `GOO` recognize `Google`)

#### Scenario: Tab activates the engine and shows the chip

- **GIVEN** the keyword `yt` is recognized and the input is `yt lofi`
- **WHEN** the user presses `Tab`
- **THEN** the surface SHALL display a `YouTube` chip (favicon + name) in the input
- **AND** the input query SHALL become `lofi`

#### Scenario: An ambiguous prefix cycles engines on repeated Tab

- **GIVEN** the registry contains `Bing` (keyword `bing`) and `Brave` (keyword `brave`)
- **AND** the input leading token is `b` (a prefix of both)
- **WHEN** the user presses `Tab`, then `Tab` again
- **THEN** the first `Tab` SHALL activate `Bing` and the second SHALL switch to `Brave`
- **AND** a further `Tab` SHALL wrap back to `Bing`

#### Scenario: A recognized keyword does not auto-activate on Enter

- **GIVEN** the keyword `g` is recognized and the input is `g force`
- **WHEN** the user presses `Enter` (not `Tab`)
- **THEN** the surface SHALL act on the selected result per `launcher-web-search`
  (e.g. the default web-search row for the literal text `g force`)
- **AND** SHALL NOT enter engine mode

#### Scenario: Engine mode searches that engine

- **GIVEN** the `YouTube` engine is active with query `lofi`
- **WHEN** the user presses `Enter`
- **THEN** the surface SHALL dispatch `openUrl` with the URL from
  `buildSearchUrl(youtube, 'lofi')`

#### Scenario: Engine mode suppresses the finder and the default row

- **GIVEN** an engine is active with a non-empty query
- **THEN** the surface SHALL render only the single `Search ⟨Engine⟩ for "…"` row
- **AND** SHALL NOT render four-source finder results or the default web-search row

#### Scenario: Backspace on an empty query pops the chip

- **GIVEN** an engine is active and the query input is empty
- **WHEN** the user presses `Backspace`
- **THEN** the active engine SHALL be cleared and the chip removed
- **AND** focus SHALL remain in the input

#### Scenario: The overlay receives the registry on open

- **WHEN** the `Alt+L` overlay opens (via the command or the keydown fallback)
- **THEN** the open message / current-window response SHALL carry an `engines`
  array of `{ id, name, keyword, urlTemplate }`
- **AND** the overlay SHALL recognize keyword prefixes, render the chip, and build
  the engine search URL from it without reading settings

#### Scenario: Tab is not intercepted without a recognized keyword

- **WHEN** no engine is active, no keyword is recognized, and the user presses `Tab`
- **THEN** the surface SHALL NOT intercept the key (normal focus traversal occurs)

### Requirement: Alt+L reaches a typeable launcher when the sidebar is focused

The `toggle-launcher` (`Alt+L`) command SHALL open the **new-tab launcher** in the
focused window — not the in-page overlay — when the Lunma sidebar (side panel) holds
keyboard focus, because Chrome forbids moving focus from the side panel into the
page's document (the in-page overlay would open unfocusable). The sidebar
SHALL report its focus state to the service worker via a fire-and-forget
`lunma/sidebar-focus` message keyed by its `windowId` (the panel is not a tab, so
the SW cannot derive the window from the sender); the initial report SHALL be gated
on the panel actually holding focus (`document.hasFocus()`), since a panel does not
auto-focus on open. The service worker SHALL persist this per-window focus state in
`chrome.storage.session` so it survives a service-worker teardown — otherwise the
`Alt+L` command that re-wakes a dormant worker would find no state and wrongly open
the unfocusable overlay. The single `toggle-launcher` handler SHALL consult this
state BEFORE messaging or injecting the active tab's overlay and, when the focused
window's sidebar is focused, open/focus the new-tab launcher and return. Stale
per-window state SHALL be pruned on `chrome.windows.onRemoved`.

This path fires only via the global `chrome.commands` shortcut (the sidebar adds no
keydown, to avoid double-triggering an unfocusable overlay), so it depends on that
shortcut being bound. The sidebar's **launcher button** — an `IconButton` at the
trailing edge of the Space switcher bar (see the `spaces-and-tabs` capability,
Requirement: Bottom space switcher) — SHALL also open the new-tab launcher on click via
a `lunma/open-newtab-launcher` request, giving a launcher entry point independent of the
`chrome.commands` binding. This launcher button is the **replacement** for the former
`SearchTrigger` search pill, which the favicon-row shell reorg removes; the
click-to-launcher fallback (the one that works even when `Alt+L` is unbound) is preserved
on the new element.

#### Scenario: Alt+L with the sidebar focused opens the new-tab launcher

- **GIVEN** the Lunma sidebar holds keyboard focus over an ordinary `http(s)` tab
- **WHEN** the `toggle-launcher` command fires for that window
- **THEN** the service worker SHALL open or focus the new-tab launcher in that window
  (a focused, typeable surface) and SHALL NOT message or inject the in-page overlay
- **AND** no unfocusable in-page overlay SHALL appear in the tab behind the panel

#### Scenario: Sidebar-focus state survives a service-worker teardown

- **GIVEN** the sidebar reported `focused: true` for its window and the service
  worker was then torn down
- **WHEN** the `toggle-launcher` command re-wakes a fresh service worker for that window
- **THEN** the handler SHALL read the persisted sidebar-focus state from
  `chrome.storage.session` and still route to the new-tab launcher

#### Scenario: Clicking the sidebar launcher button opens the launcher

- **WHEN** the user clicks the sidebar's launcher button (the `IconButton` in the Space
  switcher bar)
- **THEN** the sidebar SHALL request the new-tab launcher for its window and the
  service worker SHALL open or focus it — independent of whether the `Alt+L` shortcut
  is bound

#### Scenario: A web page with the page (not the panel) focused is unchanged

- **GIVEN** an ordinary web page is focused (the sidebar does not hold focus)
- **WHEN** the `toggle-launcher` command fires
- **THEN** the in-page overlay SHALL toggle as before (the sidebar-focus branch does
  not apply)

### Requirement: The in-page launcher overlay dismisses when it loses focus

The in-page `Alt+L` overlay SHALL dismiss itself as soon as it loses focus, and
SHALL NOT linger when it never received focus. It SHALL close on a `focusout` whose
focus destination is outside the overlay, on `window` blur (tab switch or app
switch), and — as a safety net — one animation frame after opening if its search
input never received focus. A focus move that stays **within** the overlay (typing
in the input, moving to a result row, the engine chip's × button) SHALL NOT close
it.

#### Scenario: Clicking outside dismisses the overlay

- **GIVEN** the overlay is open on a web page
- **WHEN** focus leaves the overlay (the user clicks the page, switches tab, or the
  window loses focus)
- **THEN** the overlay SHALL close

#### Scenario: Interacting within the overlay does not dismiss it

- **GIVEN** the overlay is open and focused
- **WHEN** focus moves within it (typing, selecting a result row, or popping the
  engine chip via its × button)
- **THEN** the overlay SHALL remain open

#### Scenario: An overlay that never received focus self-closes

- **GIVEN** an overlay was opened in a context where its input could not receive
  focus
- **WHEN** one animation frame passes after opening and the input still does not hold
  focus
- **THEN** the overlay SHALL close itself rather than linger unfocusable

### Requirement: Comfort density renders two-line result rows

In **Comfort** density the launcher result row SHALL render in **two lines**: the
favicon leading and vertically centred across both; line 1 the **title** (taking
the available width, ellipsised) followed by the **type** badge; line 2 the
resolved **URL**, smaller and dimmed, beneath the title. In **Compact** and
**Normal** density the row SHALL remain a single line (favicon · title · type ·
url), as today.

The layout SHALL be **CSS-driven** — the row reads the ambient `:root[data-density]`
(new-tab) or the host `data-density` (overlay), with **no per-row density prop** —
and SHALL change no result data, no ordering, and not the set of rendered elements
(the same favicon / title / type / url simply reflow). Both surfaces SHALL render
the same layout: `apps/extension/src/ui/ResultRow.svelte` for the new-tab page and the vanilla
mirror in `apps/extension/src/launcher/overlay.css` for the overlay (the documented
component-library exception).

#### Scenario: Comfort renders the title and URL on separate lines

- **WHEN** a result row renders under Comfort density
- **THEN** the title (with the type badge) occupies the first line and the URL
  occupies a second line beneath it, smaller and dimmed

#### Scenario: Compact and Normal keep a single-line row

- **WHEN** a result row renders under Compact or Normal density
- **THEN** the favicon, title, type badge, and URL sit on one line (today's layout)

#### Scenario: The overlay renders the same Comfort layout

- **WHEN** the overlay renders results under Comfort density
- **THEN** its rows render two-line (title + type, then a dimmed URL), matching the
  new-tab `ResultRow`

### Requirement: The overlay bundle budget is enforced by a verify-time guard

The dormant overlay content-script bundle SHALL be held to its "no Svelte runtime" and "<15KB gzipped" constraints (see the *Alt+L overlay surface* requirement) mechanically, by an automated guard test run under `pnpm verify` rather than by code comment alone. The guard SHALL bundle the overlay entry
(`apps/extension/src/launcher/overlay.ts`) in isolation and SHALL fail when
either (a) the bundle's dependency graph includes any Svelte runtime module, or
(b) the gzipped bundle size is at or above 15KB (15 × 1024 bytes).

#### Scenario: A Svelte runtime import fails the guard

- **WHEN** the overlay entry's bundled dependency graph includes a module under `node_modules/svelte/`
- **THEN** the guard test SHALL fail, naming the offending input(s)

#### Scenario: An over-budget bundle fails the guard

- **WHEN** the overlay bundle's gzipped size is at or above 15 × 1024 bytes
- **THEN** the guard test SHALL fail, reporting the measured gzipped size

#### Scenario: The current overlay passes the guard

- **WHEN** the overlay is bundled as shipped (vanilla TypeScript + a closed shadow DOM + a constructable stylesheet, no Svelte runtime)
- **THEN** the guard test SHALL pass with the gzipped size below 15 × 1024 bytes
- **AND** no `node_modules/svelte/` input SHALL appear in the bundle's dependency graph

### Requirement: The overlay's ARIA contract matches the new-tab surface

The Alt+L overlay SHALL expose the same assistive-technology contract the
new-tab launcher surface already renders: the query input SHALL carry
`role="combobox"`, `aria-expanded` reflecting whether results are shown, and
`aria-activedescendant` referencing the selected result row's `id`; each
result row SHALL carry `role="option"`, a stable `id`, and `aria-selected`
reflecting the current selection under the existing `role="listbox"`
container. Attributes SHALL update as arrow keys move the selection. The
overlay's scrollable result list SHALL set `overscroll-behavior: contain` so
wheel/touch scrolling at the list's end does not chain-scroll the host page
behind the scrim. Result, chip, and hint favicon images SHALL fall back to the
globe glyph on load error (the vanilla equivalent of the shared `Favicon`
primitive's staged fallback) rather than showing a broken-image glyph.

#### Scenario: Arrow-key selection is exposed to assistive technology

- **WHEN** the overlay shows results and the user presses ArrowDown
- **THEN** the input's `aria-activedescendant` references the newly selected
  row's `id` and that row's `aria-selected` is `"true"` while the previous
  row's is `"false"`

#### Scenario: Combobox state reflects result visibility

- **WHEN** the overlay's query is empty and no results render
- **THEN** the input's `aria-expanded` is `"false"`
- **AND WHEN** typing produces results
- **THEN** `aria-expanded` is `"true"`

#### Scenario: Scrolling the list does not scroll the host page

- **WHEN** the user wheels past the end of the overlay's result list
- **THEN** the host page behind the scrim does not scroll

#### Scenario: A failed favicon falls back to the globe

- **WHEN** a result row's favicon URL fails to load
- **THEN** the row renders the globe fallback glyph, not a broken image

