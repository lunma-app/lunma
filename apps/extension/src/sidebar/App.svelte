<script lang="ts">
import { onDestroy, onMount, untrack } from 'svelte';
import { bus, dispatch } from '../shared/bus';
import { log } from '../shared/logger';
import { requestNewTabLauncher } from '../shared/messages';
import { loadOnboarding, setAutoArchiveNoticeDismissed } from '../shared/onboarding';
import { modifierLabel } from '../shared/platform';
import { readSettings, type Tint, watchSettings } from '../shared/settings';
import type { LunmaStore } from '../shared/store.svelte';
import type { Space, SpaceColor, SpaceId, WindowId } from '../shared/types';
import '@lunma/tokens/tokens.css';
import '@lunma/tokens/fonts.css';
import '@lunma/tokens/recipes.css';
import './app.css';
import {
  colourToOklch,
  colourToOn,
  DEFAULT_HUE,
  DEFAULT_L,
  DEFAULT_ON,
  SPACE_CHROMA,
} from '../shared/space-hue';
import Aurora from '../ui/Aurora.svelte';
import Button from '../ui/Button.svelte';
import Divider from '../ui/Divider.svelte';
import Icon from '../ui/Icon.svelte';
import RowButton from '../ui/RowButton.svelte';
import SearchField from '../ui/SearchField.svelte';
import { scrollFade } from '../ui/scroll-fade';
import Toast from '../ui/Toast.svelte';
import ArchivedChip from './ArchivedChip.svelte';
import DragClone from './DragClone.svelte';
import FaviconRow from './FaviconRow.svelte';
import FirstRunNotice from './FirstRunNotice.svelte';
// LensEditor (and any future conditionally-shown panel) is statically
// imported — no code splitting. A dynamic import would reduce first-parse cost
// but needs bundle-size measurement before it's worth the complexity.
import LensEditor from './LensEditor.svelte';
import { openOptionsAt } from './open-options';
import PinnedTabs from './PinnedTabs.svelte';
import SectionHeader from './SectionHeader.svelte';
// biome-ignore lint/style/useImportType: rendered as a component in the Svelte template (Biome only sees the `typeof` use, not the template).
import SpaceSwitcher from './SpaceSwitcher.svelte';
import { sidebarGlares } from './show-glares-state.svelte';
import { setStore } from './store-context.svelte';
import { swipe } from './swipe';
import { setSwipeLive } from './swipe-live';
import TempTabs from './TempTabs.svelte';

interface Props {
  store: LunmaStore;
  windowId: WindowId;
  /** Colour-intensity level driving the immersive treatment. Seeded by
   * `main.ts` from the `tint` setting (default `vivid`); `main.ts` re-applies it
   * on the `.sidebar` root live via `watchSettings`, so this prop is the
   * first-paint value only and is never reassigned here. */
  tint?: Tint | undefined;
}

const { store, windowId, tint = 'vivid' }: Props = $props();
setStore(() => store);

// ── First-run auto-archive disclosure notice (auto-archive) ──────────────────
// A one-time, dismissible heads-up that discloses auto-archive BEFORE it acts,
// gated on `autoArchiveEnabled && !autoArchiveNoticeDismissed`. Settings + the
// onboarding flag live in `chrome.storage.sync` (read directly through `shared`,
// like the options surface writes settings directly — sidebar → shared, no bus).
// Defaults keep the notice HIDDEN until the async load resolves, so it never
// flashes before we know the real state. Disclosure-only: nothing here enqueues a
// sweep or mutates a setting.
let autoArchiveEnabled = $state(false);
let autoArchiveIdleMinutes = $state(720);
let autoArchiveNoticeDismissed = $state(true);
const showFirstRunNotice = $derived(autoArchiveEnabled && !autoArchiveNoticeDismissed);

onMount(() => {
  let cancelled = false;
  void (async () => {
    const [settings, onboarding] = await Promise.all([readSettings(), loadOnboarding()]);
    if (cancelled) return;
    autoArchiveEnabled = settings.autoArchiveEnabled;
    autoArchiveIdleMinutes = settings.autoArchiveIdleMinutes;
    autoArchiveNoticeDismissed = onboarding.autoArchiveNoticeDismissed;
  })();
  // Keep the gate + threshold copy live if the user changes auto-archive in the
  // options page while the sidebar is open (e.g. toggling it off hides the notice).
  const unwatch = watchSettings((settings) => {
    autoArchiveEnabled = settings.autoArchiveEnabled;
    autoArchiveIdleMinutes = settings.autoArchiveIdleMinutes;
  });
  return () => {
    cancelled = true;
    unwatch();
  };
});

// Dismiss → persist the flag (best-effort) and hide for this + future sessions.
function dismissFirstRunNotice(): void {
  autoArchiveNoticeDismissed = true;
  void setAutoArchiveNoticeDismissed(true);
}

// ── Authoritative active Space (store) ──────────────────────────────────────
// The store stays the single source of truth for WHICH Space is active. It drives
// the root wash / aurora colour, and is the value the carousel's LOCAL index
// (below) reconciles to. The local index only drives the optimistic animation, so
// the settle is one clean tween instead of an async re-key/mount race.
const activeSpaceId = $derived(store.state.activeSpaceByWindow[windowId] ?? null);
// (The immersive wash / aurora / edge-stripe colour is driven by the OPTIMISTIC centred
// Space — `centredSpace` below — so it travels WITH the slide, not a beat behind it.)

interface Panel {
  space: Space;
  hue: number;
  chroma: number;
  l: number;
  on: string;
}
const panelOf = (space: Space): Panel => {
  const ok = colourToOklch(space.color);
  return { space, hue: ok.h, chroma: ok.c, l: ok.l, on: colourToOn(space.color) };
};

// ONE panel per Space — all pre-rendered (the spike model), so a commit is a PURE
// TRANSFORM with no per-switch mount (that on-switch mount was the stall that made
// the old async ease snap). Each panel carries its own colour tokens so an
// off-centre panel previews its Space's colour as it slides in. When there is no
// active Space the carousel is empty (the no-active-Space behaviour).
const panels = $derived<Panel[]>(activeSpaceId === null ? [] : store.state.spaces.map(panelOf));

// ── Single-track carousel (spike model) ─────────────────────────────────────
// The Space the carousel is optimistically centred on — tracked by IDENTITY, not
// position, so a Space-list REORDER (chip drag) repositions instantly without a
// spurious slide. Seeded from the authoritative active Space; reconciled to it.
let centredId = $state<string | null>(untrack(() => activeSpaceId));
// Space ids THIS sidebar has optimistically committed and is still awaiting the store
// to confirm. A swipe commit advances `centredId` instantly but the authoritative
// store only catches up one broadcast round-trip later — and on a RAPID re-swipe the
// store emits the intermediate steps in order (s1, then s2…), each arriving AFTER we
// have already moved past it. Without this trail the reconcile below reads that lagging
// `s1` echo as a foreign activation and glides the rail BACK to s1 — the "jumps two" the
// user sees. Every id we commit is parked here so its own echo is recognised and
// ignored; only a genuinely foreign id is a real external activation. (The store, unlike
// the spike, broadcasts our own commits back at us — this trail is what makes the
// optimistic local index authoritative the way the spike's plain `activeIndex` is.)
const pendingCommits = new Set<string>();
// Visual index of the centred Space — DERIVED, so reordering store.state.spaces
// re-centres at once (the rest-sync transform follows) with no animation.
const activeIndex = $derived(
  centredId === null ? -1 : store.state.spaces.findIndex((s) => s.id === centredId),
);
// Immersive wash / aurora / edge-stripe colour, driven by the CENTRED Space (the
// optimistic visual index that advances AT commit), not the store's authoritative
// active Space (which arrives a beat later via broadcast). So the Space's identity
// colour changes the instant you commit — it travels with the slide, no lag. Each
// sliding panel also carries its OWN per-panel colour, so the destination colour is
// already on screen as it slides in; this is the ambient wash catching up to it.
const centredSpace = $derived(
  centredId === null ? null : (store.state.spaces.find((s) => s.id === centredId) ?? null),
);
const centredOklch = $derived(centredSpace ? colourToOklch(centredSpace.color) : null);
const spaceHue = $derived(centredOklch?.h ?? DEFAULT_HUE);
const spaceChroma = $derived(centredOklch?.c ?? SPACE_CHROMA);
const spaceL = $derived(centredOklch?.l ?? DEFAULT_L);
const spaceOn = $derived(centredSpace ? colourToOn(centredSpace.color) : DEFAULT_ON);
let stageEl: HTMLElement | undefined = $state();
let trackEl: HTMLElement | undefined = $state();
// Track position in px, written IMPERATIVELY to the DOM each rAF frame (exactly
// like the spike's tight rAF→transform loop) — NOT through a reactive $state
// binding, which batches/coalesces the per-frame updates so the settle stutters
// and its speed varies with main-thread load. `live` is true during a drag or
// settle (guards the rest-sync effect). Both are plain locals (no reactivity).
let currentX = 0;
let live = false;

function applyTransform(): void {
  if (trackEl) trackEl.style.transform = `translate3d(${currentX}px, 0, 0)`;
}

// `live` is true during a drag or settle; it guards the rest-sync effect so it never
// fights an in-flight transform. (Like the spike, the store is NOT gated/buffered —
// broadcasts apply immediately; the sustain re-arm + compositor settle make that safe.)
function setLive(value: boolean): void {
  live = value;
}

// Report the WHEEL-STREAM-active window (gesture + whole momentum tail) to the shared
// flag main.ts reads, so it DEFERS the heavy broadcast-driven tab re-render out of the
// momentum window — the spike's `armRenderIdle`. Distinct from `live` (the settle, which
// ends well before macOS momentum does): flushing the render at settle-end would still
// freeze the thread mid-momentum and manufacture the phantom gap that commits a 2nd Space.
function onStreamActive(active: boolean): void {
  setSwipeLive(active);
}

// Measured content-stage width = one panel's width. The single source for baseX,
// the live-drag clamp, AND the responsive 15% commit threshold.
let stageWidth = $state(0);
$effect(() => {
  const el = stageEl;
  if (!el) return;
  stageWidth = el.clientWidth;
  if (typeof ResizeObserver === 'undefined') return;
  const ro = new ResizeObserver(() => {
    stageWidth = el.clientWidth;
  });
  ro.observe(el);
  return () => ro.disconnect();
});

// 15% of the stage width — a short, deliberate swipe commits (D5). The swipe
// action stays a generic px primitive; this width-relative policy lives in the
// host. Falls back to the action's 80px default before the stage is measured.
const swipeThreshold = $derived(stageWidth > 0 ? Math.round(0.15 * stageWidth) : 80);
const swipeMaxDrag = $derived(stageWidth > 0 ? stageWidth : 999);
// Whether a neighbour exists in each direction — passed to the action so a
// no-neighbour wheel push LOCKS at the edge (+ glow) instead of over-scrolling,
// and no commit ever wraps. Re-derived as the centred Space changes.
const canGoNext = $derived(activeIndex >= 0 && activeIndex < panels.length - 1);
const canGoPrev = $derived(activeIndex > 0);

/** Resting px offset of the track that centres panel `i`. */
function baseX(i: number): number {
  return -i * stageWidth;
}

// ───────────────────────────────────────────────────────────────────────────
// Compositor-driven settle for the single track.
//
// The settle is a CSS transition on `transform`, which the browser runs on the
// COMPOSITOR thread — so it keeps gliding smoothly even when the MAIN thread is busy
// (a heavy commit re-render, the aurora, reactivity). The previous JS-rAF loop ran on
// the main thread and got STARVED under that load → the freeze/flicker mid-switch.
// CSS transitions also re-base from the current computed position for free, so a rapid
// re-swipe (a fresh `easeTo` mid-transition) glides on seamlessly, and a settle is
// never interrupted by a re-render. The 1:1 live-drag path (`snapTo`) disables the
// transition for an instant follow. (Validated against the Model C spike under
// simulated main-thread load — the rAF settle froze; the CSS transition stayed smooth.)
// ───────────────────────────────────────────────────────────────────────────

// Settle duration, sourced from the `--motion-space-switch` token so tokens.css stays
// authoritative; the easing mirrors `--ease-emphasised`. Reduced motion collapses to an
// instant snap. `localStorage['lunma.space-switch-ms']` is a no-rebuild tuning knob.
const SETTLE_MS_FALLBACK = 250;
const prefersReducedMotion =
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
function readTokenMs(name: string, fallback: number): number {
  if (typeof getComputedStyle === 'undefined' || typeof document === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const ms = Number.parseFloat(raw);
  return Number.isFinite(ms) && ms > 0 ? ms : fallback;
}
let settleMs = SETTLE_MS_FALLBACK;
onMount(() => {
  const override =
    typeof localStorage !== 'undefined'
      ? Number.parseFloat(localStorage.getItem('lunma.space-switch-ms') ?? '')
      : Number.NaN;
  settleMs =
    Number.isFinite(override) && override > 0
      ? override
      : readTokenMs('--motion-space-switch', SETTLE_MS_FALLBACK);
});

// `live` (the settle-in-flight flag) is cleared by a timer settleMs after the last
// retarget — robust to CSS transitions being interrupted by a rapid re-swipe. It
// guards the rest-sync effect and contributes to the broadcast gate.
let settleTimer: ReturnType<typeof setTimeout> | undefined;
function finishSettle(): void {
  if (settleTimer !== undefined) {
    clearTimeout(settleTimer);
    settleTimer = undefined;
  }
  setLive(false);
}

function easeTo(value: number): void {
  currentX = value;
  if (prefersReducedMotion) {
    if (trackEl) trackEl.style.transition = 'none';
    applyTransform();
    finishSettle();
    return;
  }
  // A compositor CSS transition glides from the CURRENT computed position to `value`;
  // a fresh easeTo mid-transition re-bases for free.
  if (trackEl) trackEl.style.transition = `transform ${settleMs}ms cubic-bezier(0.16, 1, 0.3, 1)`;
  applyTransform();
  setLive(true);
  if (settleTimer !== undefined) clearTimeout(settleTimer);
  settleTimer = setTimeout(finishSettle, settleMs + 80);
}

// 1:1 live drag — instant, no transition.
function snapTo(value: number): void {
  if (settleTimer !== undefined) {
    clearTimeout(settleTimer);
    settleTimer = undefined;
  }
  currentX = value;
  if (trackEl) trackEl.style.transition = 'none';
  applyTransform();
}

// Cancel any settle (used when the carousel empties / on teardown).
function stopAnim(): void {
  if (settleTimer !== undefined) {
    clearTimeout(settleTimer);
    settleTimer = undefined;
  }
  if (trackEl) trackEl.style.transition = 'none';
}

// Keep the track at the centred Space's rest position when NOT animating — covers
// first mount (once stageWidth is measured), a Space-list reorder (activeIndex
// changes), and width changes. Instant (no transition), so it never fights a settle.
$effect(() => {
  const idx = activeIndex;
  const w = stageWidth;
  untrack(() => {
    if (live) return;
    currentX = -idx * w;
    if (trackEl) trackEl.style.transition = 'none';
    applyTransform();
  });
});

// ── Reconcile the local index ⇐ the authoritative store ─────────────────────
// A single effect tracking ONLY the authoritative active Space id. `centredId` is
// seeded equal to it and our own commit advances `centredId` FIRST, so the confirming
// broadcast lands with `activeSpaceId === centredId` — a no-op that clears the pending
// trail. The subtle case is a RAPID re-swipe: we commit s1 then s2 before s1's echo
// returns, so the store emits s1 (lagging) WHILE centredId is already s2. That `s1` is
// one of OUR commits, not a foreign change, so it must NOT glide the rail back — the
// `pendingCommits` trail recognises and drops it. Only an id we never committed is a
// genuine EXTERNAL activation (chip click, another window, a multi-step jump) and glides
// this track to it via the settle tween. (Supersedes design D6's "identity check alone
// suffices": the store echoes our own commits back, so identity alone glides back on a
// lagging echo — the trail is required to keep the optimistic index authoritative.)
$effect(() => {
  const aid = activeSpaceId;
  untrack(() => {
    if (aid === centredId) {
      pendingCommits.clear(); // store caught up to our latest optimistic commit
      return;
    }
    if (aid !== null && pendingCommits.has(aid)) {
      // A lagging echo of one of OUR earlier commits — centredId has already moved past
      // it. Drop it and ignore; gliding back is exactly the "jumps two" regression.
      pendingCommits.delete(aid);
      return;
    }
    pendingCommits.clear(); // a genuine external activation supersedes our optimistic trail
    const newIdx = aid === null ? -1 : store.state.spaces.findIndex((s) => s.id === aid);
    if (aid === null || newIdx < 0) {
      centredId = aid;
      setLive(false);
      stopAnim();
      return;
    }
    if (stageWidth === 0) {
      // Pre-measure: just advance — the rest-sync effect parks the track at the
      // centred panel's px rest position the moment the stage width is measured.
      centredId = aid;
      setLive(false);
      return;
    }
    if (!live) {
      currentX = baseX(activeIndex); // anchor at the current centred position
      setLive(true);
    }
    centredId = aid; // activeIndex (derived) becomes newIdx
    easeTo(baseX(newIdx));
  });
});

onDestroy(() => {
  stopAnim();
});

/** Temp-tab count for a Space's own per-window instance (drives the Clear action +
 * whether the panel renders its temporary list). Every panel reads its OWN Space —
 * no active gate — so a pre-rendered panel slides in already populated (no
 * mid-settle mount / `temp-row-in` replay, the last spike divergence; §9). */
function tempCountFor(space: Space): number {
  return store.state.spaceInstancesByWindow[windowId]?.[space.id]?.tempTabIds.length ?? 0;
}

// Fire-and-forget dispatch (results arrive via the state broadcast) via the
// shared `dispatch`. New Tab / Clear act on the PANEL's OWN Space (carrying
// spaceId): every carousel panel is fully live (§9), so nothing toggles
// enabled/disabled at commit and the switch stays a pure transform.
function onNewTab(spaceId: SpaceId): void {
  dispatch({ kind: 'newTab', payload: { windowId, spaceId } });
}
// Top search bar → open the new-tab launcher in this window (the click-to-launcher
// entry; works independently of the ⌥L command binding).
function openLauncher(): void {
  requestNewTabLauncher(windowId);
}
// Clear → archive + a transient "Cleared N — Undo" toast (safety-destructive-
// actions). The cleared tabIds are captured LOCALLY before dispatch (mirroring the
// coordinator's filter): the SW archives exactly these, and undo carries them back
// — no value returns through the (void) bus ack. Only show the toast once the clear
// actually committed (the ack resolved).
let clearedToast = $state<{ message: string; tabIds: number[] } | null>(null);
function onClearTemp(spaceId: SpaceId): void {
  const tempTabIds = store.state.spaceInstancesByWindow[windowId]?.[spaceId]?.tempTabIds ?? [];
  const tabIds = tempTabIds.filter((id) => store.state.liveTabsById[id]?.windowId === windowId);
  if (tabIds.length === 0) return;
  bus
    .send({ kind: 'clearTempTabs', payload: { windowId, spaceId } })
    .then(() => {
      clearedToast = {
        message: `Cleared ${tabIds.length} ${tabIds.length === 1 ? 'tab' : 'tabs'}`,
        tabIds,
      };
    })
    .catch((err: unknown) => {
      log.debug('App: clearTempTabs failed', { err });
    });
}
function onUndoClear(tabIds: number[]): void {
  dispatch({ kind: 'undoClearTempTabs', payload: { windowId, tabIds } });
}

// Recently archived (auto-archive): the chip on the New Tab row opens the options
// "Recently archived" subpage (a roomy management view), rather than an inline
// popover — archived tabs are secondary, so they live out of the sidebar.
// `openOptionsAt` lives in `open-options.ts` (extracted by github-connector so
// Lens's Connectors row composes the same deep-link).
function openArchivedOptions(): void {
  void openOptionsAt('#recently-archived');
}
// "Manage in settings" (first-run notice) → the options Auto-archive settings
// group, anchored by `#auto-archive` (Options.svelte's per-group `groupSlug`).
function openAutoArchiveSettings(): void {
  void openOptionsAt('#auto-archive');
}
function onNewFolder(spaceId: SpaceId): void {
  // The New-folder trigger lives in the pinned header now, but the post-create
  // inline-rename still belongs to PinnedTabs. Arm the active PinnedTabs to open
  // the new folder's rename the moment it broadcasts — the SAME cross-surface
  // bridge TempTabs uses after folding a temp tab onto a pinned tab.
  store.setAutoRenameNextFolder(windowId, true);
  dispatch({ kind: 'createFolder', payload: { spaceId } });
}

// "New lens…" (smart-folders, design D9): the header kebab drills in
// place into the LensEditor panel for the Space whose id is held here.
// Confirm closes the morph (via the bindable open); back/close just dismisses.
let newLensSpaceId = $state<SpaceId | null>(null);
let headerMenuOpenBySpace = $state<Record<SpaceId, boolean>>({});

// The SpaceSwitcher owns the Space editor (BottomSheet). The Space-header menu
// lives here, so we hold the switcher instance to drive Edit/New Space from it.
let switcherRef = $state<ReturnType<typeof SpaceSwitcher> | undefined>();

// ── swipe action callbacks ──────────────────────────────────────────────────

function onDrag(offset: number): void {
  if (stageWidth === 0) return;
  // 1:1 follow from the active panel's rest position — no easing lag. `snapTo`
  // cancels any running settle, so a genuine re-swipe mid-momentum re-bases from
  // wherever the rail is and follows the finger immediately (the spike's live
  // drag; the post-commit momentum tail is dropped by the action, so it never
  // reaches here to jolt a clean settle).
  setLive(true);
  let d = offset;
  // No-neighbour edge: lock the rail (no over-scroll, no feedback) — clamp the push to rest.
  if (d < 0 && activeIndex >= panels.length - 1) d = 0;
  if (d > 0 && activeIndex <= 0) d = 0;
  if (d > stageWidth) d = stageWidth;
  if (d < -stageWidth) d = -stageWidth;
  snapTo(baseX(activeIndex) + d);
}

function onCommit(direction: 'next' | 'prev'): void {
  const fromIdx = activeIndex;
  const destIdx = direction === 'next' ? fromIdx + 1 : fromIdx - 1;
  const target = panels[destIdx];
  if (destIdx < 0 || !target) {
    // No wrap at the edges (the touch path can reach here at a list edge).
    onCancel();
    return;
  }
  const newId = target.space.id;
  // Park this optimistic commit so its own lagging broadcast echo is recognised (and
  // ignored) by the reconcile effect instead of gliding the rail back to it.
  pendingCommits.add(newId);
  if (stageWidth === 0) {
    // Unmeasured: advance and broadcast — the rest-sync effect parks the track at
    // the new centred panel once the stage width is measured.
    centredId = newId;
    setLive(false);
  } else {
    // Advance the LOCAL centred Space synchronously and ease to its rest in ONE
    // tween (activeIndex is derived from centredId, so it follows to destIdx).
    if (!live) {
      currentX = baseX(fromIdx);
      setLive(true);
    }
    centredId = newId;
    easeTo(baseX(destIdx));
  }
  dispatch({ kind: 'activateSpace', payload: { windowId, spaceId: newId } });
}

function onCancel(): void {
  // Spring back to the current panel's rest position. No-op if no drag moved the rail
  // (nothing to spring back from).
  if (!live || stageWidth === 0) return;
  easeTo(baseX(activeIndex));
}
</script>

<main
  class="sidebar lunma-space-scope"
  data-testid="sidebar"
  data-tint={tint}
  style:--space-h={String(spaceHue)}
  style:--space-chroma={String(spaceChroma)}
  style:--space-l={String(spaceL)}
  style:--space-on={spaceOn}
  use:swipe={{
    onDrag,
    onCommit,
    onCancel,
    onStreamActive,
    canGoNext,
    canGoPrev,
    threshold: swipeThreshold,
    maxDrag: swipeMaxDrag,
  }}
>
  <!-- Ambient backdrop at --z-base, drift + opacity tint-driven (no `intensity`
       prop — opacity inherits the scoped `--aurora-opacity`, see app.css). The
       wrapper masks the aurora to the upper region so it reads as one soft glow
       cohesive with the top wash, and the dense working area below stays clean.
       Sits behind every foreground region; aria-hidden, never interactive. -->
  {#if sidebarGlares.value}
    <div class="sidebar-aurora"><Aurora /></div>
  {/if}
  <!-- Top search bar: a trigger-mode `SearchField` that opens the new-tab launcher
       (the search pill restored above the favicon grid). `position: relative` so it
       paints above the aurora by DOM order, plumb-aligned via `--list-pad`. -->
  <div class="shell-search">
    <SearchField
      mode="trigger"
      leadingIcon="search"
      placeholder="Search or enter URL…"
      kbd="{modifierLabel}L"
      ariaLabel="Open launcher"
      testid="sidebar-search"
      onclick={openLauncher}
    />
  </div>
  <!-- Global favicon grid: a fixed, Space-independent grid of plated favorites above
       the carousel. A SIBLING of `.content-stage`, so it never rides the carousel
       track — it stays put through a Space swipe and re-hues with the centred Space
       in lockstep with the wash (D3 / D8). -->
  <FaviconRow {windowId} />
  <div class="content-stage" data-testid="sidebar-content" bind:this={stageEl}>
    {#if panels.length > 0}
      <!-- Single composited track: all Space panels in a flex row; the active one
           is centred by translating the whole track. The transform is written
           IMPERATIVELY (applyTransform / the rAF loop), never via a reactive
           binding — that is what keeps the settle smooth and constant-speed. -->
      <div class="track" data-testid="carousel-track" bind:this={trackEl}>
        {#each panels as panel, i (panel.space.id)}
          {@const temps = tempCountFor(panel.space)}
          <div
            class="content-slide"
            data-testid="content-slide"
            data-space-id={panel.space.id}
            style:--space-h={String(panel.hue)}
            style:--space-chroma={String(panel.chroma)}
            style:--space-l={String(panel.l)}
            style:--space-on={panel.on}
          >
            {#snippet newLensPanel()}
              <LensEditor
                spaceId={panel.space.id}
                {windowId}
                onDone={() => {
                  newLensSpaceId = null;
                  headerMenuOpenBySpace[panel.space.id] = false;
                }}
              />
            {/snippet}
            <SectionHeader
              icon={panel.space.icon}
              label={panel.space.name}
              menu={[
                {
                  id: 'new-folder',
                  label: 'New folder',
                  icon: 'folder-plus',
                  onSelect: () => onNewFolder(panel.space.id),
                },
                {
                  id: 'new-smart-folder',
                  label: 'New lens…',
                  icon: 'folder-git-2',
                  keepOpen: true,
                  submenu: true,
                  onSelect: () => {
                    newLensSpaceId = panel.space.id;
                  },
                },
                {
                  id: 'edit-space',
                  label: 'Edit Space…',
                  icon: 'pencil',
                  onSelect: () => switcherRef?.openEditForSpace(panel.space.id),
                },
                {
                  id: 'new-space',
                  label: 'New Space…',
                  icon: 'plus',
                  onSelect: () => switcherRef?.openCreateSpace(),
                },
              ]}
              panel={newLensSpaceId === panel.space.id ? newLensPanel : undefined}
              panelTitle={newLensSpaceId === panel.space.id ? 'New lens' : undefined}
              onPanelBack={() => {
                newLensSpaceId = null;
              }}
              bind:open={
                () => headerMenuOpenBySpace[panel.space.id] ?? false,
                (v) => {
                  headerMenuOpenBySpace[panel.space.id] = v;
                }
              }
            />
            <!-- Only this inner region scrolls; the Space header (SectionHeader)
                 above stays pinned at the slide's top so the icon + name never
                 ride away with the tab list. -->
            <div class="slide-scroll" data-testid="slide-scroll" use:scrollFade>
              <PinnedTabs {windowId} spaceId={panel.space.id} active={i === activeIndex} />
              {#if temps > 0}
                <Divider>
                  {#snippet action()}
                    <Button
                      variant="ghost"
                      onclick={() => onClearTemp(panel.space.id)}
                      title="Close all temporary tabs"
                    >
                      <Icon name="arrow-down" size={12} /> Clear
                    </Button>
                  {/snippet}
                </Divider>
              {:else}
                <Divider />
              {/if}
              <div class="new-tab-row">
                <RowButton
                  icon={'plus'}
                  label="New Tab"
                  onclick={() => onNewTab(panel.space.id)}
                />
                <!-- Recently archived (auto-archive): a quiet chip on the New Tab row's
                     trailing edge (renders only when this Space has archived tabs). Opens
                     the roomy options "Recently archived" subpage — no inline sidebar list. -->
                <ArchivedChip spaceId={panel.space.id} onOpen={openArchivedOptions} />
              </div>
              {#if temps > 0}
                <TempTabs {windowId} spaceId={panel.space.id} active={i === activeIndex} />
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
  <!-- First-run auto-archive disclosure notice (auto-archive). A SIBLING of the
       carousel (never rides the track), placed just above the Space switcher so it
       reads as a quiet bottom banner rather than pushing the tab lists down. Gated
       on `autoArchiveEnabled && !autoArchiveNoticeDismissed`. Disclosure-only — its
       actions just dismiss (persist the flag) or open the options Auto-archive group. -->
  {#if showFirstRunNotice}
    <FirstRunNotice
      {autoArchiveIdleMinutes}
      onDismiss={dismissFirstRunNotice}
      onManage={openAutoArchiveSettings}
    />
  {/if}
  <SpaceSwitcher bind:this={switcherRef} {windowId} />
  <!-- Floating drag clone, rendered at the sidebar root (outside the transformed
       track) so its position:fixed is viewport-relative, not clipped. -->
  <DragClone />
  <!-- Transient "Cleared N — Undo" toast (safety-destructive-actions). Mounted at
       the root so its fixed position is viewport-relative; the parent owns its
       lifetime (auto-dismiss + Undo both clear it). -->
  {#if clearedToast}
    {@const toast = clearedToast}
    <Toast
      message={toast.message}
      actionLabel="Undo"
      onAction={() => onUndoClear(toast.tabIds)}
      onDismiss={() => {
        clearedToast = null;
      }}
    />
  {/if}
</main>
