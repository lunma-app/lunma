<script lang="ts">
import { onMount, tick } from 'svelte';
import { dispatch } from '../../shared/bus';
import { labelFor } from '../../shared/label-for';
import { onStateBroadcast, requestLauncherSuggestions } from '../../shared/messages';
import { modifierLabel } from '../../shared/platform';
import type { SearchEngine } from '../../shared/search-engines';
import type { Tint } from '../../shared/settings';
import type {
  AppState,
  IconName,
  SavedTabId,
  Space,
  SpaceColor,
  WindowId,
} from '../../shared/types';
import '@lunma/tokens/tokens.css';
import '@lunma/tokens/fonts.css';
import '@lunma/tokens/recipes.css';
import './newtab.css';
import type { LauncherResult } from '../../shared/launcher-contract';
import {
  colourToOklch,
  colourToOn,
  DEFAULT_HUE,
  DEFAULT_L,
  DEFAULT_ON,
  SPACE_CHROMA,
} from '../../shared/space-hue';
import Aurora from '../../ui/Aurora.svelte';
import Chip from '../../ui/Chip.svelte';
import FaviconTile from '../../ui/FaviconTile.svelte';
import { faviconCacheKey, faviconFor, faviconUrl } from '../../ui/favicon';
import Icon from '../../ui/Icon.svelte';
import Kbd from '../../ui/Kbd.svelte';
import type { ResultListApi } from '../../ui/ResultList.svelte';
import ResultList from '../../ui/ResultList.svelte';
import SearchField from '../../ui/SearchField.svelte';
import Surface from '../../ui/Surface.svelte';
import { buildSearchUrl, resolveEngine } from '../shared/web-actions';

interface Props {
  /** This tab's window, resolved by `main.ts` via `chrome.windows.getCurrent`. */
  windowId: WindowId;
  /** SW snapshot seed (from `state-request`). May be null on a cold start —
   * the page shows the neutral home until the first `state-broadcast` lands. */
  initialState?: AppState | null;
  /** Colour-intensity level, resolved by `main.ts` from the `tint` setting
   * (default `vivid`, mirroring the sidebar `App`). Drives `data-tint` and the
   * `<Aurora intensity>` backdrop; `main.ts` re-applies it on settings change. */
  tint?: Tint;
  /** Tab-to-search engine registry, built by `main.ts` from settings via
   * `buildEngineRegistry` (launcher-tab-to-search). Captured at mount like
   * `tint`; an edit in options is reflected on the next page open. */
  engines?: SearchEngine[];
}

const { windowId, initialState = null, tint = 'vivid', engines = [] }: Props = $props();

// Read-only mirror of SW state — exactly the sidebar's read-only consumer
// pattern. Until the first `state-broadcast` lands we render the boot snapshot
// (`initialState`, possibly null); after that the live broadcast wins.
let liveState = $state<AppState | null>(null);
// NB: NOT named `state` — a local `state` collides with the `$state` rune (Svelte
// reads `$state` as `$`-prefixed access of a `state` variable), which breaks
// rune type-checking for the whole component.
const appState = $derived<AppState | null>(liveState ?? initialState);

// This tab's own id, learned once at mount (newtab-hearth): a dormant favorite
// activated on the home opens IN PLACE — `openSavedTab` carries this as
// `replaceTabId` so the background navigates THIS tab to the favorite instead of
// stranding the home behind a new tab. `chrome.tabs` is absent in unit tests
// (only `chrome.runtime` is faked), so guard the call; a missing id simply omits
// `replaceTabId` and the favorite opens in a new tab (the unchanged path).
let homeTabId = $state<number | undefined>();

onMount(() => {
  chrome.tabs
    ?.getCurrent?.()
    .then((tab) => {
      homeTabId = tab?.id;
    })
    .catch(() => {
      // No own-tab id (e.g. not a real tab context) — leave undefined; dormant
      // favorites then open in a new tab rather than in place.
    });
  const unsubscribe = onStateBroadcast((msg) => {
    liveState = msg.state;
  });
  // Refocus the idle-home input when the page is REACTIVATED (launcher-reach D5).
  // The Alt+L fallback focuses an already-open new-tab via chrome.tabs.update —
  // the page is not remounted, so the input's mount-time `autofocus` never re-runs
  // and the caret is left in <body>, defeating the reuse path. `visibilitychange`
  // (→ visible) is the event Chrome fires when a background tab is reactivated
  // (also a manual tab-switch back); window `focus` is belt-and-braces for the
  // orthogonal whole-window OS-focus-regain case (where visibilitychange does not
  // fire). Only the IDLE HOME reclaims focus — never steal it from a locked engine
  // or a typed query the user left mid-search, and never fight `popEngine` (which
  // runs on an already-visible/focused tab, so neither event fires there). Deferred
  // one frame so it can't race the mount autofocus / tick focus paths; focus() on
  // an already-focused input is a no-op, so the double-event case is flicker-free.
  const refocusIdleHome = (): void => {
    if (document.visibilityState !== 'visible') return;
    if (activeEngine !== null || query.trim() !== '') return;
    requestAnimationFrame(() => searchField?.focus());
  };
  document.addEventListener('visibilitychange', refocusIdleHome);
  window.addEventListener('focus', refocusIdleHome);
  return () => {
    unsubscribe();
    document.removeEventListener('visibilitychange', refocusIdleHome);
    window.removeEventListener('focus', refocusIdleHome);
  };
});

const activeSpaceId = $derived(appState?.activeSpaceByWindow[windowId] ?? null);
const activeSpace = $derived<Space | null>(
  activeSpaceId === null ? null : (appState?.spaces.find((s) => s.id === activeSpaceId) ?? null),
);

// Unresolved active Space → neutral substrate (resting ember) with no name/icon.
// No spinner, no loading flash (design Visual language). When resolved, the
// canonical OKLCH (`--space-l`/`--space-chroma`/`--space-h`) + on-colour ink
// (`--space-on`) render the Space's TRUE colour across the home identity.
const activeOklch = $derived(activeSpace ? colourToOklch(activeSpace.color as SpaceColor) : null);
const spaceHue = $derived(activeOklch?.h ?? DEFAULT_HUE);
const spaceChroma = $derived(activeOklch?.c ?? SPACE_CHROMA);
const spaceL = $derived(activeOklch?.l ?? DEFAULT_L);
const spaceOn = $derived(activeSpace ? colourToOn(activeSpace.color as SpaceColor) : DEFAULT_ON);

// Quiet meta line — this Space's open (temporary) tabs in THIS window and its
// total pinned saved tabs, derived from the read-only state (folder children
// counted as leaves). Both default to 0 before the instance/pins exist.
const tabCount = $derived(
  activeSpace
    ? (appState?.spaceInstancesByWindow[windowId]?.[activeSpace.id]?.tempTabIds.length ?? 0)
    : 0,
);
const pinnedCount = $derived.by(() => {
  if (!activeSpace) return 0;
  let count = 0;
  for (const node of appState?.pinnedBySpace[activeSpace.id] ?? []) {
    // Smart folders hold connector results, not pinned saved tabs — count 0.
    count += node.kind === 'tab' ? 1 : node.kind === 'folder' ? node.children.length : 0;
  }
  return count;
});
const metaLine = $derived(`${tabCount} ${tabCount === 1 ? 'tab' : 'tabs'} · ${pinnedCount} pinned`);
// Brand-voice caption (newtab-hearth): the counts line renders only when the
// Space has something to count; a fresh/empty Space is welcomed, not counted
// (the brief's empty line) — nothing a dashboard would say.
const hasCounts = $derived(tabCount + pinnedCount > 0);
const EMPTY_CAPTION =
  "Nothing kept here yet. Open a few tabs — anything you don't pin settles out on its own.";

// --- Global favorites on the idle home (newtab-hearth) ----------------------
// Project `faviconRow` into renderable tiles, deriving each favorite's
// bound-vs-dormant state for THIS window from the broadcast bindings (a small
// launcher-side derivation — the sidebar's `FaviconRow` projection lives in the
// sidebar layer and is unimportable here). Tiles are activate-only and carry NO
// drift affordances (the sidebar owns management); de-dup like the sidebar so a
// duplicate id can't collide the keyed `{#each}`.
interface FavTile {
  id: SavedTabId;
  title: string;
  faviconSrc: string;
  faviconFallbackSrc: string;
  /** Dormant: no live tab bound in THIS window. */
  unbound: boolean;
}
const favorites = $derived.by<FavTile[]>(() => {
  if (!appState) return [];
  const seen = new Set<string>();
  const out: FavTile[] = [];
  for (const id of appState.faviconRow) {
    if (seen.has(id)) continue;
    seen.add(id);
    const saved = appState.savedTabs[id];
    if (!saved) continue;
    const boundTabId = appState.tabBindings[id]?.[windowId];
    const bound = boundTabId !== undefined;
    const live = bound ? appState.liveTabsById[boundTabId] : undefined;
    const liveUrl = live?.url;
    const url = bound
      ? liveUrl && liveUrl !== ''
        ? liveUrl
        : saved.originalURL
      : (saved.currentURL ?? saved.originalURL);
    out.push({
      id,
      title: saved.customTitle ?? labelFor(live?.title ? live.title : saved.title, url),
      // Hi-res (64px) favicon to match the larger plated tile, mirroring the
      // sidebar row's request so a retina plate stays crisp.
      faviconSrc: faviconFor(url, live?.favIconUrl, 64),
      faviconFallbackSrc: faviconUrl(url, 64, faviconCacheKey(live?.favIconUrl)),
      unbound: !bound,
    });
  }
  return out;
});

/** Activate a favorite tile (newtab-hearth): a bound favorite focuses its tab;
 * a dormant one opens IN PLACE — `openSavedTab` carries `replaceTabId` = this
 * home's own tab id so the background navigates this tab to the favorite. When
 * the own-tab id is unknown (no `chrome.tabs`), it falls back to the new-tab
 * open. Activate-only: no drag, reorder, or context menu on this surface. */
function activateFavorite(fav: FavTile): void {
  if (fav.unbound) {
    dispatch({
      kind: 'openSavedTab',
      payload: {
        savedTabId: fav.id,
        windowId,
        ...(homeTabId !== undefined ? { replaceTabId: homeTabId } : {}),
      },
    });
  } else {
    dispatch({ kind: 'focusSavedTab', payload: { savedTabId: fav.id, windowId } });
  }
}

// --- Launcher search (launcher-v1 + launcher-tab-to-search) ---------------
// Empty query → the identity home (idle). Non-empty → debounced suggestions
// over the pure-read channel, rendered as a ResultList beneath the input. Tab
// on a recognized keyword prefix switches into an engine (chip + engine-mode
// row built client-side); repeated Tab cycles ambiguous matches.
const DEBOUNCE_MS = 120;

let query = $state('');
let suggestResults = $state<LauncherResult[]>([]);
let list = $state<ResultListApi | undefined>();
// id of the result the roving selection currently highlights — mirrored onto the
// search input's `aria-activedescendant` so the combobox announces it (a11y).
const LISTBOX_ID = 'newtab-launcher-results';
let activeOptionId = $state<string | null>(null);
// The SearchField instance, bound so we can restore focus after popping the
// engine chip (its × lives in the leading slot, which unmounts on pop).
let searchField = $state<{ focus: () => void } | undefined>();
let debounceHandle: ReturnType<typeof setTimeout> | undefined;
// Latest-wins: each keystroke bumps `latest`; a response renders only if its
// keystroke is still the most recent (the wire `requestId` enables the SW echo;
// here the monotonic counter drops superseded responses).
let latest = 0;

// Tab-to-search engine mode. `activeEngine` is the locked engine (chip shown);
// `cycle` is the candidate set frozen at activation and `cycleIndex` the spot
// in it, so repeated Tab rotates an ambiguous prefix (e.g. `b` → Bing, Brave).
let activeEngine = $state<SearchEngine | null>(null);
let cycle = $state<SearchEngine[]>([]);
let cycleIndex = $state(0);

// In engine mode the single action row is a pure function of (engine, query) —
// built client-side via `buildSearchUrl`, the four-source finder + default row
// suppressed (design D3). In default mode the async suggestions stand.
const engineRow = $derived.by<LauncherResult | null>(() => {
  if (!activeEngine) return null;
  const q = query.trim();
  if (q === '') return null;
  return {
    id: 'websearch',
    source: 'websearch',
    title: `Search ${activeEngine.name} for "${q}"`,
    url: buildSearchUrl(activeEngine, q),
    score: 0,
  };
});
const results = $derived<LauncherResult[]>(
  activeEngine ? (engineRow ? [engineRow] : []) : suggestResults,
);

const hasQuery = $derived(query.trim() !== '');
// Searching (identity collapses to the compact chip) once an engine is locked
// OR the query is non-empty. The results card shows only when there's a row to
// show or a default-mode query is in flight (so engine-mode-empty shows just the
// chip, never a "No matches" box).
const searching = $derived(activeEngine !== null || hasQuery);
const showCard = $derived(results.length > 0 || (hasQuery && activeEngine === null));

// The quiet "⇥ Tab" affordance: before locking, the recognized engine(s) for the
// current prefix; once locked with an ambiguous prefix, the cycle alternatives.
// Carries the engine list (not a flat string) so each name shows its favicon.
const hintModel = $derived.by<{ verb: string; list: SearchEngine[] } | null>(() => {
  if (activeEngine) {
    if (cycle.length <= 1) return null;
    return { verb: 'Tab to switch', list: cycle };
  }
  const { candidates } = resolveEngine(query, engines);
  if (candidates.length === 0) return null;
  return { verb: candidates.length === 1 ? 'Tab to search' : 'Tab to cycle', list: candidates };
});

/** Favicon URL for an engine — its domain, via the shared favicon helper (the
 * same source the engine-mode result row uses). */
function engineIcon(engine: SearchEngine): string {
  return faviconFor(buildSearchUrl(engine, ''));
}

function scheduleSearch(q: string): void {
  if (debounceHandle) clearTimeout(debounceHandle);
  if (q.trim() === '') {
    suggestResults = [];
    return;
  }
  debounceHandle = setTimeout(() => {
    void runQuery(q);
  }, DEBOUNCE_MS);
}

async function runQuery(q: string): Promise<void> {
  const mine = ++latest;
  try {
    const res = await requestLauncherSuggestions(q, windowId);
    if (mine === latest) suggestResults = res.results;
  } catch {
    if (mine === latest) suggestResults = [];
  }
}

function onInput(value: string): void {
  query = value;
  // Engine mode: the row is derived from (engine, query); skip the SW round-trip.
  if (activeEngine) {
    if (debounceHandle) clearTimeout(debounceHandle);
    return;
  }
  scheduleSearch(query);
}

/** Clear the active engine (chip popped), keeping focus in the input. The query
 * text stays as a plain search — Backspace-on-empty lands on the idle home; the
 * chip × on a typed query falls back to a default search for it. Popping unmounts
 * the leading slot (the × button), so refocus the input once it has — otherwise a
 * mouse click on the × would drop focus to <body>. */
function popEngine(): void {
  activeEngine = null;
  cycle = [];
  cycleIndex = 0;
  scheduleSearch(query);
  void tick().then(() => searchField?.focus());
}

/** Escape: clear the engine + query back to the idle identity home. */
function resetToIdle(): void {
  activeEngine = null;
  cycle = [];
  cycleIndex = 0;
  query = '';
  suggestResults = [];
  if (debounceHandle) clearTimeout(debounceHandle);
}

/** Tab — the only opt-in. With no engine active, a recognized keyword prefix
 * locks the first candidate (remainder becomes the query); with an engine active
 * and an ambiguous prefix, cycle through the candidates (Shift+Tab reverses).
 * When nothing is recognized, Tab is NOT intercepted (normal focus traversal). */
function handleTab(e: KeyboardEvent): void {
  if (!activeEngine) {
    // Shift+Tab with no engine active is backward focus traversal, never
    // activation — only forward Tab opts in (cycling Shift+Tab needs an engine).
    if (e.shiftKey) return;
    const { candidates, query: rest } = resolveEngine(query, engines);
    if (candidates.length === 0) return; // let Tab traverse
    e.preventDefault();
    cycle = candidates;
    cycleIndex = 0;
    activeEngine = candidates[0] ?? null;
    query = rest;
    if (debounceHandle) clearTimeout(debounceHandle);
    suggestResults = [];
    return;
  }
  if (cycle.length > 1) {
    e.preventDefault();
    const delta = e.shiftKey ? -1 : 1;
    cycleIndex = (cycleIndex + delta + cycle.length) % cycle.length;
    activeEngine = cycle[cycleIndex] ?? activeEngine;
  }
  // Single-candidate engine: don't trap Tab — focus traverses normally.
}

function onKeydown(e: KeyboardEvent): void {
  // Escape returns to the idle home even before any results exist (the list may
  // not be mounted yet, so handle it here rather than only via the list model).
  if (e.key === 'Escape') {
    resetToIdle();
    return;
  }
  if (e.key === 'Tab') {
    handleTab(e);
    return;
  }
  // Backspace on an empty engine-mode query pops the chip (design D6).
  if (e.key === 'Backspace' && activeEngine && query === '') {
    e.preventDefault();
    popEngine();
    return;
  }
  // Forward navigation/act keys to the shared keyboard model without stealing
  // focus from the input.
  list?.handleKeydown(e);
}

/** Act on a chosen result via the existing bus (never by mutating state). */
function act(result: LauncherResult): void {
  switch (result.source) {
    case 'tab':
      if (result.tabId !== undefined) {
        dispatch({ kind: 'focusTab', payload: { tabId: result.tabId } });
      }
      break;
    case 'saved': {
      const savedTabId = result.savedTabId;
      if (savedTabId === undefined) break;
      // A bound saved result carries the live `tabId` (set by the provider);
      // focus it. A dormant one has no `tabId` — open it.
      if (result.tabId !== undefined) {
        dispatch({ kind: 'focusSavedTab', payload: { savedTabId, windowId } });
      } else {
        dispatch({ kind: 'openSavedTab', payload: { savedTabId, windowId } });
      }
      break;
    }
    default: // 'bookmark' | 'history' | 'websearch' | 'navigate' — open the carried url.
      dispatch({ kind: 'openUrl', payload: { url: result.url, windowId } });
      break;
  }
}

const faviconSrc = (result: LauncherResult): string => faviconFor(result.url);
</script>

<main
  class="home lunma-space-scope"
  class:searching={searching}
  data-testid="newtab-home"
  data-tint={tint}
  style:--space-h={String(spaceHue)}
  style:--space-chroma={String(spaceChroma)}
  style:--space-l={String(spaceL)}
  style:--space-on={spaceOn}
>
  <!-- Immersive backdrop: the active Space's colour as a drifting aurora,
       intensity tracking the tint level. aria-hidden, never interactive. -->
  <Aurora intensity={tint} />

  <!-- The hearth (newtab-hearth): a single fixed low-centre radial bloom reading
       the `--glow-hearth` colour — the brand's "fire in the nook". Sits above the
       ambient aurora but beneath the content (`.stage` is `--z-raised`), never
       intercepts pointer events, and softens while searching. Recolours with the
       active Space via the scoped hue; rests on the ember when no Space resolves. -->
  <div class="hearth" data-testid="newtab-hearth-bloom" aria-hidden="true"></div>

  <div class="stage">
    {#if activeSpace}
      <!-- Identity band — the full home identity (idle) crossfading to a compact
           chip (searching). Both share one grid cell so neither displaces the
           anchored search input below (newtab-anchored-search). -->
      <div class="identity-band" class:searching={searching} data-testid="newtab-identity-band">
        <div class="identity" data-testid="newtab-identity" aria-hidden={searching}>
          <div class="icon-tile">
            <Surface variant="glass" glow radius="lg" testid="newtab-icon">
              <Icon name={activeSpace.icon as IconName} size={40} color="var(--space-c)" />
            </Surface>
          </div>
          <h1 class="name" data-testid="newtab-name">{activeSpace.name}</h1>
          <!-- Brand-voice caption: counts only when there's something to count;
               otherwise the warm empty line (set quieter + width-constrained). -->
          <p class="meta" class:empty={!hasCounts} data-testid="newtab-meta">
            {hasCounts ? metaLine : EMPTY_CAPTION}
          </p>
        </div>
        <div class="identity-chip" data-testid="newtab-identity-chip" aria-hidden={!searching}>
          <Surface variant="glass" testid="newtab-chip">
            <Icon name={activeSpace.icon as IconName} size={16} color="var(--space-c)" />
            <span class="chip-name">{activeSpace.name}</span>
          </Surface>
        </div>
      </div>
    {/if}

    <!-- Live search — the launcher-v1 surface. Empty → idle home above; typing
         expands the results card below. The frosted pill is the SearchField
         primitive; onkeydown forwards the roving keyboard model to the list. In
         engine mode the engine Chip rides the SearchField `leading` slot. -->
    {#snippet engineChip()}
      {#if activeEngine}
        <Chip
          label={activeEngine.name}
          tone="accent"
          iconUrl={engineIcon(activeEngine)}
          onRemove={popEngine}
          removeLabel={`Exit ${activeEngine.name} search`}
          testid="newtab-engine-chip"
        />
      {/if}
    {/snippet}
    <div class="search-row">
      <SearchField
        bind:this={searchField}
        mode="input"
        testid="newtab-search"
        placeholder="Search tabs, bookmarks…"
        ariaLabel="Search tabs, bookmarks, and history"
        kbd="{modifierLabel}L"
        autofocus
        value={query}
        oninput={onInput}
        onkeydown={onKeydown}
        leading={activeEngine ? engineChip : undefined}
        combobox
        controls={LISTBOX_ID}
        expanded={showCard && results.length > 0}
        activeDescendant={activeOptionId ?? undefined}
      />
    </div>

    <!-- Global favorites (newtab-hearth): the idle home only — a centred wrapping
         row of the `FaviconTile` primitive beneath the search field, one click
         from any new tab to a kept place. Composed directly (the sidebar's
         `FaviconRow` feature component stays out of the launcher layer per the
         import DAG); capped at two rows (CSS), no row when empty, no drift props
         (no dot / return affordance — the sidebar owns management). When searching
         the bottom band belongs to the results, so the row hides. -->
    {#if !searching && favorites.length > 0}
      <div class="favorites" data-testid="newtab-favorites">
        {#each favorites as fav (fav.id)}
          <FaviconTile
            title={fav.title}
            faviconSrc={fav.faviconSrc}
            faviconFallbackSrc={fav.faviconFallbackSrc}
            unbound={fav.unbound}
            onclick={() => activateFavorite(fav)}
          />
        {/each}
      </div>
    {/if}

    <!-- Below the anchored input (bottom band): the quiet Tab affordance, then
         the results card. Sharing one grid cell keeps the input pinned. -->
    {#if hintModel || showCard}
      <div class="below">
        {#if hintModel}
          <!-- Recognized engine(s) before locking, or the cycle alternatives
               once locked — each with its favicon. Never competes with results. -->
          <p class="engine-hint" data-testid="newtab-engine-hint" aria-live="polite">
            <Kbd>⇥</Kbd>
            <span class="engine-hint-verb">{hintModel.verb}</span>
            {#each hintModel.list as engine, i (engine.id)}
              {#if i > 0}<span class="engine-hint-sep" aria-hidden="true">·</span>{/if}
              <span class="engine-hint-engine">
                <img class="engine-hint-icon" src={engineIcon(engine)} alt="" width="14" height="14" />
                <span>{engine.name}</span>
              </span>
            {/each}
          </p>
        {/if}

        {#if showCard}
          <div class="results" data-testid="newtab-results">
            <Surface variant="glass" radius="lg">
              <ResultList
                {results}
                {faviconSrc}
                listboxId={LISTBOX_ID}
                onact={(result) => act(result)}
                onescape={resetToIdle}
                onready={(api) => {
                  list = api;
                }}
                onactivedescendant={(id) => {
                  activeOptionId = id;
                }}
              />
              {#if results.length === 0}
                <p class="empty" data-testid="newtab-empty">No matches</p>
              {/if}
            </Surface>
          </div>
          <!-- Polite count announcement for screen readers (the visible list is a
               listbox the combobox input controls). Off-screen, never focusable. -->
          <span class="sr-only" role="status" aria-live="polite" data-testid="newtab-results-status">
            {results.length === 0
              ? 'No matches'
              : `${results.length} result${results.length === 1 ? '' : 's'}`}
          </span>
        {/if}
      </div>
    {/if}
  </div>
</main>
