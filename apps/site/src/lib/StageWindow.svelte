<script lang="ts">
import { onMount } from 'svelte';
import { FAV } from '$lib/mocks/apps';
import FaviconGrid from '$lib/mocks/FaviconGrid.svelte';
import SpaceHeader from '$lib/mocks/SpaceHeader.svelte';
import TabRowMock from '$lib/mocks/TabRowMock.svelte';

// The favourites shown at the top of the sidebar (real website favicons, no
// selection state — they're shortcuts).
const favourites = [FAV.figma, FAV.linear, FAV.github, FAV.mail, FAV.calendar];

// A faithful mock of the real Lunma window: the vertical sidebar (search pill,
// favicon grid, Space header, pinned + temporary tabs, the bottom Space
// switcher) next to the new-tab identity. Switching a Space re-binds the Space
// hue/lightness/chroma on this window's root only, so the window recolours
// exactly as the product does — without recolouring the marketing page around
// it. Colours are the canonical Space palette, sourced from `@lunma/tokens`
// (the per-colour `--space-<color>-l/-c/-h/-on` custom properties) — no
// hand-copied L/C/H tuples or re-implemented ink() here.
type SpaceColorName = 'blue' | 'purple' | 'green' | 'orange' | 'pink';
interface SpaceDef {
  name: string;
  icon: string;
  color: SpaceColorName;
}

// Plausible user-chosen Space names paired with their canonical palette colour;
// the L/C/H/on values come from the `@lunma/tokens` `--space-<color>-*` tokens.
const spaces: SpaceDef[] = [
  { name: 'Work', icon: '◐', color: 'blue' },
  { name: 'Design', icon: '✦', color: 'purple' },
  { name: 'Reading', icon: '❍', color: 'green' },
  { name: 'Home', icon: '⌂', color: 'orange' },
  { name: 'Writing', icon: '✎', color: 'pink' },
];

const FALLBACK: SpaceDef = { name: 'Work', icon: '◐', color: 'blue' };

let active = $state(0);
// Auto-rotation is GATED on four conditions (the-auto-rotating-space-demo-is-
// pausable-and-viewport-gated): never under reduced motion; stops permanently once
// the visitor picks a Space; pauses while engaged (hover / focus-within); and only
// runs while the stage is on screen (so no recolour repaints happen off-screen).
let stopped = $state(false); // permanent: the visitor manually picked a Space
let inView = $state(false); // the stage is intersecting the viewport
let engaged = $state(false); // pointer over the stage or focus within it
let reduce = false; // prefers-reduced-motion (sampled on mount)
let stageEl = $state<HTMLElement>();
let timer: ReturnType<typeof setInterval> | undefined;

const space = $derived(spaces[active] ?? FALLBACK);

function startTimer(): void {
  if (timer !== undefined) return;
  timer = setInterval(() => {
    active = (active + 1) % spaces.length;
  }, 3800);
}
function stopTimer(): void {
  if (timer !== undefined) {
    clearInterval(timer);
    timer = undefined;
  }
}
/** Run the rotation only while all gates allow it, else stop the timer outright. */
function sync(): void {
  if (!reduce && !stopped && inView && !engaged) startTimer();
  else stopTimer();
}

function select(index: number, viaUser = false): void {
  active = index;
  if (viaUser) {
    stopped = true; // manual pick halts auto-rotation permanently
    stopTimer();
  }
}

function onEngage(): void {
  engaged = true;
  sync();
}
function onDisengage(e: PointerEvent | FocusEvent): void {
  // Ignore focus moves that stay within the stage (e.g. between switcher chips).
  if (
    e.type === 'focusout' &&
    (e as FocusEvent).relatedTarget instanceof Node &&
    stageEl?.contains((e as FocusEvent).relatedTarget as Node)
  ) {
    return;
  }
  engaged = false;
  sync();
}

onMount(() => {
  reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  let io: IntersectionObserver | undefined;
  if (typeof IntersectionObserver !== 'undefined' && stageEl) {
    io = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? false;
      sync();
    });
    io.observe(stageEl);
  } else {
    inView = true; // no observer (test/SSR) — treat as visible
    sync();
  }
  return () => {
    io?.disconnect();
    stopTimer();
  };
});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="stage lunma-space-scope"
  id="demo"
  bind:this={stageEl}
  style:--space-h={`var(--space-${space.color}-h)`}
  style:--space-l={`var(--space-${space.color}-l)`}
  style:--space-chroma={`var(--space-${space.color}-c)`}
  style:--space-on={`var(--space-${space.color}-on)`}
  onpointerenter={onEngage}
  onpointerleave={onDisengage}
  onfocusin={onEngage}
  onfocusout={onDisengage}
>
  <!-- The mock browser's decorative chrome (titlebar, search, favicon grid, tab
       rows, new-tab identity) is hidden from assistive tech — its tab titles/labels
       are not page content. The functional Space switcher (exposed below) and the
       caption carry the meaning. -->
  <div class="window">
    <div class="titlebar" aria-hidden="true">
      <span class="lights"><i></i><i></i><i></i></span>
      <span class="omni">new tab</span>
    </div>

    <div class="body">
      <aside class="side">
        <!-- Decorative sidebar mock — hidden from AT (display:contents keeps it in
             the flex flow). The exposed switcher below sits outside this wrapper. -->
        <div style="display: contents" aria-hidden="true">
          <div class="search">
            <span class="mag">⌕</span>
            <span class="ph">Search or enter URL…</span>
            <span class="kbd">⌥L</span>
          </div>

          <FaviconGrid items={favourites} size={40} columns={5} />

          <SpaceHeader icon={space.icon} name={space.name} />

          <div class="rows">
            <TabRowMock title="Figma — product redesign" fav={FAV.figma} active />
            <TabRowMock title="Linear — this cycle" fav={FAV.linear} />
            <TabRowMock title="Spec — draft v3" fav={FAV.docs} />
          </div>

          <div class="divider"><span class="clear">Clear</span></div>

          <div class="newtab-row">
            <span class="plus">+</span>
            <span class="nt-label">New Tab</span>
            <span class="arch">3 archived</span>
          </div>

          <div class="rows">
            <TabRowMock title="How OKLCH works" fav={FAV.reader} />
            <TabRowMock title="A long read from lunch" fav={FAV.cloud} fading meta="archiving…" />
          </div>
        </div>

        <div class="switcher" role="group" aria-label="Switch Space">
          {#each spaces as s, i (s.name)}
            <button
              type="button"
              class="chip"
              class:on={active === i}
              style:--chip-c={`oklch(var(--space-${s.color}-l) var(--space-${s.color}-c) var(--space-${s.color}-h))`}
              style:--chip-on={`var(--space-${s.color}-on)`}
              aria-pressed={active === i}
              aria-label={`Switch to ${s.name}`}
              onclick={() => select(i, true)}
            >
              <span class="chip-tile">{s.icon}</span>
            </button>
          {/each}
          <span class="bar-gap"></span>
          <span class="gear" aria-hidden="true">⚙</span>
        </div>
      </aside>

      <!-- Decorative new-tab identity — hidden from AT (a generic div carries no
           aria-label; the meaning is the recolour the caption describes). -->
      <div class="pageview" aria-hidden="true">
        <div class="nt-id">
          <span class="nt-icon">{space.icon}</span>
          <div class="nt-name">{space.name}</div>
          <div class="nt-meta">12 tabs · 5 pinned</div>
          <div class="nt-search">
            <span class="mag">⌕</span><span class="ph">Search tabs, bookmarks…</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <p class="caption">Pick a Space — the sidebar and new tab recolour to match.</p>
</div>

<style>
  /* The Space colour family (--space-c…) comes from the shared `.lunma-space-scope`
     recipe (@lunma/tokens); the three axes are bound inline above. */
  .stage {
    /* The mock window's substrate — the colour behind the sidebar rows, reused
       by the window background and the "Clear" chip, and ringed by the drift dot
       in TabRowMock (var(--stage-bg, var(--bg))). Declared once here so the same
       value isn't hand-copied across components. */
    --stage-bg: oklch(0.17 0.008 var(--space-h));
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* Smooth Space-colour morph, scoped to the window (the registered @property
     axes in app.css make the hue/lightness/chroma interpolate). */
  .window {
    overflow: hidden;
    border-radius: var(--r-xl);
    border: 1px solid var(--border-soft);
    background: var(--stage-bg);
    box-shadow: var(--shadow-pop), var(--glow-space-soft);
    transition:
      --space-h 600ms var(--ease-emphasised),
      --space-l 600ms var(--ease-emphasised),
      --space-chroma 600ms var(--ease-emphasised);
  }

  .titlebar {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 36px;
    padding: 0 14px;
    border-bottom: 1px solid var(--border-soft);
    background: oklch(0.2 0.012 var(--space-h) / 0.6);
  }
  .lights {
    display: inline-flex;
    gap: 7px;
  }
  .lights i {
    width: 11px;
    height: 11px;
    border-radius: var(--r-pill);
    background: var(--surface-3);
  }
  .omni {
    flex: 1 1 auto;
    max-width: 240px;
    margin: 0 auto;
    padding: 4px 14px;
    border-radius: var(--r-pill);
    background: oklch(0.14 0.006 var(--space-h) / 0.7);
    border: 1px solid var(--border-soft);
    text-align: center;
    font-size: var(--text-sm);
    color: var(--text-dim);
  }

  .body {
    display: grid;
    grid-template-columns: 264px 1fr;
    min-height: 432px;
  }

  /* ── The sidebar ── */
  .side {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px 12px 0;
    border-right: 1px solid var(--border-soft);
    /* The real top-down Space wash: strongest at the top, gone by ~68%. */
    background:
      linear-gradient(
        180deg,
        oklch(var(--space-l) var(--space-chroma) var(--space-h) / 0.14) 0%,
        oklch(var(--space-l) var(--space-chroma) var(--space-h) / 0.05) 35%,
        transparent 68%
      ),
      var(--glass-bg);
    -webkit-backdrop-filter: blur(var(--glass-blur));
    backdrop-filter: blur(var(--glass-blur));
  }

  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 12px;
    border-radius: var(--r-pill);
    background: oklch(0.14 0.006 var(--space-h) / 0.6);
    border: 1px solid var(--border-soft);
    color: var(--text-dim);
    font-size: var(--text-sm);
  }
  .search .ph {
    flex: 1 1 auto;
  }
  .search .kbd {
    font-weight: var(--weight-semibold);
    font-size: var(--text-xs);
  }

  /* Favourites (FaviconGrid) and the Space header (SpaceHeader) are composed
     mock primitives now — see mocks/. */

  .rows {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .divider {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 1px;
    margin: 4px 8px;
    background: var(--divider);
  }
  .clear {
    transform: translateY(-1px);
    padding-left: 8px;
    background: var(--stage-bg);
    font-size: var(--text-xs);
    color: var(--text-dim);
  }

  .newtab-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: var(--row-h);
    padding: 0 var(--space-3);
    border-radius: var(--r-md);
    color: var(--text-2);
    font-size: var(--text-base);
  }
  .newtab-row .plus {
    color: var(--text-dim);
  }
  .newtab-row .nt-label {
    flex: 1 1 auto;
  }
  .newtab-row .arch {
    font-size: var(--text-xs);
    color: var(--text-dim);
  }

  /* ── The bottom Space switcher (the control) ── */
  .switcher {
    margin-top: auto;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-2);
    border-top: 1px solid var(--divider);
    background: var(--bg-elev);
  }
  .chip {
    flex: 0 0 32px;
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--r-md);
    background: transparent;
    cursor: pointer;
    opacity: 0.42;
    transition:
      opacity 460ms var(--ease-emphasised),
      background var(--motion-base) var(--ease-standard),
      transform var(--motion-fast) var(--ease-standard);
  }
  .chip:hover {
    opacity: 0.7;
  }
  .chip:active {
    transform: scale(var(--press-scale));
  }
  /* Active Space: full opacity, a frosted backing, and a crisp ring in the
     Space colour so it reads as selected regardless of how light/dark that
     colour is (a hovered light chip must never out-shout the active one). */
  .chip.on,
  .chip.on:hover {
    opacity: 1;
    background: var(--glass-bg);
    box-shadow:
      0 0 0 1.5px var(--chip-c),
      var(--glass-highlight),
      var(--glow-space-soft);
  }
  .chip-tile {
    display: inline-grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: var(--r-sm);
    background: var(--chip-c);
    color: var(--chip-on);
    font-size: 11px;
  }
  .bar-gap {
    flex: 1 1 auto;
  }
  .gear {
    color: var(--text-dim);
    font-size: 14px;
    padding-right: 4px;
  }

  /* ── The page area: new-tab identity ── */
  .pageview {
    position: relative;
    display: grid;
    place-items: center;
    padding: 28px;
    background: radial-gradient(
      120% 80% at 50% 8%,
      oklch(var(--space-l) var(--space-chroma) var(--space-h) / 0.12),
      transparent 60%
    );
  }
  .nt-id {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .nt-icon {
    display: inline-grid;
    place-items: center;
    width: 56px;
    height: 56px;
    margin-bottom: 14px;
    border-radius: var(--r-lg);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-highlight), var(--glow-space-soft);
    color: var(--space-c);
    font-size: 24px;
  }
  .nt-name {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    line-height: 1;
    color: var(--text);
    text-shadow: var(--glow-space);
  }
  .nt-meta {
    margin-top: 8px;
    font-size: var(--text-sm);
    color: var(--text-dim);
  }
  .nt-search {
    display: flex;
    align-items: center;
    gap: 8px;
    width: min(280px, 70%);
    margin-top: 22px;
    padding: 9px 14px;
    border-radius: var(--r-pill);
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    -webkit-backdrop-filter: blur(var(--glass-blur));
    backdrop-filter: blur(var(--glass-blur));
    color: var(--text-dim);
    font-size: var(--text-sm);
  }
  .mag {
    color: var(--text-dim);
  }

  .caption {
    text-align: center;
    font-size: var(--text-sm);
    color: var(--text-dim);
  }

  @media (max-width: 560px) {
    .body {
      grid-template-columns: 1fr;
    }
    .pageview {
      min-height: 200px;
      border-top: 1px solid var(--border-soft);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .window {
      transition: none;
    }
    .chip {
      transition: background var(--motion-fast) var(--ease-standard);
    }
  }
</style>
