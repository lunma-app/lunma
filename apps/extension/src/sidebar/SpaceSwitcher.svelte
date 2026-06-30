<script lang="ts">
import '../ui/drop-line.css';
import { dispatch } from '../shared/bus';
import { log } from '../shared/logger';
import { m } from '../shared/paraglide/messages';
import { colourToOklch, colourToOn } from '../shared/space-hue';
import type { Space, WindowId } from '../shared/types';
import Icon from '../ui/Icon.svelte';
import IconButton from '../ui/IconButton.svelte';
import Surface from '../ui/Surface.svelte';
import Tooltip from '../ui/Tooltip.svelte';
import { type DropResult, drag } from './drag.svelte';
import SpaceEditor, { type SpaceEditorMode } from './SpaceEditor.svelte';
import { useStore } from './store-context.svelte';

interface Props {
  windowId: WindowId;
}

const { windowId }: Props = $props();
const store = useStore();

const activeSpaceId = $derived(store.state.activeSpaceByWindow[windowId] ?? null);

// Defensive de-dup: a duplicate Space id in (corrupted or same-tick
// re-broadcast) state would collide the keyed {#each} below and crash the
// switcher. First occurrence wins. (The store also de-dups on the read path.)
const spaces = $derived.by<Space[]>(() => {
  const seen = new Set<string>();
  return store.state.spaces.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
});

// Editor open-state. One morph instance serves both create (opened by the `+`)
// and edit. Editing is opened two ways: clicking the already-active chip (the
// discoverable primary), or right-clicking any chip (secondary — edits without
// switching to it). The initial mode is a placeholder; every entry point resets
// it before opening. `triggerEl` is the element that opened it, so focus can
// return there on close.
function createMode(): SpaceEditorMode {
  return { kind: 'create', windowId };
}
let editorOpen = $state(false);
let editorMode = $state<SpaceEditorMode>(createMode());
let triggerEl: HTMLElement | null = null;

function activate(spaceId: string): void {
  dispatch({ kind: 'activateSpace', payload: { windowId, spaceId } });
}

function openCreate(event: MouseEvent): void {
  editorMode = createMode();
  triggerEl = event.currentTarget as HTMLElement;
  editorOpen = true;
}

function openEditFor(space: Space, el: HTMLElement | null): void {
  editorMode = { kind: 'edit', space };
  triggerEl = el;
  editorOpen = true;
}

// Exposed to App.svelte (via `bind:this`) so the Space-header menu — which lives
// in App but does NOT own the editor — can open it. No triggering element, so
// focus simply isn't returned to a chip on close (the sheet manages its own).
export function openEditForSpace(spaceId: string): void {
  const space = store.state.spaces.find((s) => s.id === spaceId);
  if (space) openEditFor(space, null);
}

export function openCreateSpace(): void {
  editorMode = createMode();
  triggerEl = null;
  editorOpen = true;
}

// Left-click: an inactive chip activates its Space; the already-active chip
// opens its editor ("click to switch, click again to edit"). A click that
// follows a real drag is suppressed so reordering never also activates/edits.
function onChipClick(event: MouseEvent, space: Space, isActive: boolean): void {
  if (drag.consumeJustDragged()) return;
  if (isActive) openEditFor(space, event.currentTarget as HTMLElement);
  else activate(space.id);
}

// --- drag-reorder ----------------------------------------------------------
// The switcher chip row is a single horizontal drag zone. The source chip stays
// put (dimmed), a chip-shaped clone follows the cursor, and a vertical insertion
// line marks the drop. Nothing reorders until drop, which dispatches the full
// post-drop order; the chips re-render from the authoritative broadcast.
const ZONE = 'spaces';
let switcherEl = $state<HTMLElement>();
let chipEls = $state<HTMLElement[]>([]);

$effect(() => {
  if (!switcherEl) return;
  return drag.registerZone(ZONE, {
    el: switcherEl,
    // Only the per-Space chips are draggable / valid drop slots — not the `+`
    // add-chip or the out-of-flow editor.
    itemEls: () => chipEls.filter(Boolean),
    axis: 'x',
  });
});

const isDragSource = (space: Space): boolean =>
  drag.state.active && drag.state.data?.zone === ZONE && drag.state.data?.id === space.id;

/** X of the vertical insertion line (relative to `.switcher`): mid-gap before the
 * target chip, or after the last chip when inserting at the end. */
function lineLeft(index: number): number {
  const els = chipEls.filter(Boolean);
  if (els.length === 0) return 0;
  const GAP_HALF = 4; // half of --space-2 (8px) so the line sits in the chip gap
  if (index >= els.length) {
    const last = els[els.length - 1] as HTMLElement;
    return last.offsetLeft + last.offsetWidth + GAP_HALF;
  }
  return (els[index] as HTMLElement).offsetLeft - GAP_HALF;
}

function onChipPointerDown(event: PointerEvent, space: Space): void {
  const el = event.currentTarget as HTMLElement;
  const ok = colourToOklch(space.color);
  drag.press(
    {
      id: space.id,
      zone: ZONE,
      title: space.name,
      faviconSrc: '',
      chip: {
        icon: space.icon,
        hue: ok.h,
        chroma: ok.c,
        l: ok.l,
        on: colourToOn(space.color),
      },
    },
    event,
    el,
    handleDrop,
  );
}

function handleDrop(r: DropResult): void {
  if (r.data.zone !== ZONE) return;
  // Released outside every zone → cancel: snap back, dispatch nothing (cancellable-drag).
  if (r.targetZone === null) return;
  const ids = spaces.map((s) => s.id);
  const from = ids.indexOf(r.data.id);
  if (from === -1) return; // chip vanished mid-drag (Space deleted elsewhere)
  ids.splice(from, 1);
  // The dragged id was removed, so a target past the source shifts left by one.
  const insertAt = r.targetIndex > from ? r.targetIndex - 1 : r.targetIndex;
  ids.splice(insertAt, 0, r.data.id);
  dispatch({ kind: 'reorderSpaces', payload: { spaceIds: ids } });
}

// Right-click: edit any chip's Space without switching to it; suppress the
// browser context menu.
function onChipContextMenu(event: MouseEvent, space: Space): void {
  event.preventDefault();
  openEditFor(space, event.currentTarget as HTMLElement);
}

function closeEditor(): void {
  editorOpen = false;
  triggerEl?.focus();
}

// Trailing Settings button: open the extension options page.
function openOptions(): void {
  try {
    chrome.runtime.openOptionsPage(() => {
      if (chrome.runtime.lastError) {
        log.warn('openOptionsPage failed', { message: chrome.runtime.lastError.message });
      }
    });
  } catch (err) {
    log.warn('openOptionsPage failed', { message: String(err) });
  }
}
</script>

<div class="switcher" data-testid="space-switcher" data-no-swipe="1" bind:this={switcherEl}>
  {#if drag.state.active && drag.state.targetZone === ZONE}
    <div class="drop-line-x" style:left={`${lineLeft(drag.state.targetIndex)}px`}></div>
  {/if}
  {#each spaces as space, i (space.id)}
    {@const ok = colourToOklch(space.color)}
    {@const isActive = space.id === activeSpaceId}
    <Tooltip label={isActive ? m.sidebar_spaceTooltipEdit({ name: space.name }) : space.name}>
      {#snippet children(triggerProps)}
        <button
          type="button"
          {...triggerProps}
          class="chip"
          class:dragging={isDragSource(space)}
          data-testid="space-chip"
          data-space-id={space.id}
          data-name={space.name}
          data-active={isActive ? 'true' : 'false'}
          aria-current={isActive ? 'true' : undefined}
          aria-label={isActive
            ? m.sidebar_spaceEditAria({ name: space.name })
            : m.sidebar_spaceTooltipActivate({ name: space.name })}
          style:--space-h={String(ok.h)}
          style:--space-chroma={String(ok.c)}
          style:--space-l={String(ok.l)}
          style:--space-on={colourToOn(space.color)}
          bind:this={chipEls[i]}
          onpointerdown={(event) => onChipPointerDown(event, space)}
          onclick={(event) => onChipClick(event, space, isActive)}
          oncontextmenu={(event) => onChipContextMenu(event, space)}
        >
          {#snippet tile()}
            <span class="tile"><Icon name={space.icon} size={16} /></span>
          {/snippet}
          {#if isActive}
            <!-- The active chip reads as "lit from within": its Space-colour tile
                 sits on a frosted-glass Surface carrying the soft hue glow. The
                 opacity-based active model (below) is unchanged; the glow is
                 additive identity, not a new active affordance. -->
            <Surface variant="glass" glow radius="md" testid="chip-glass">
              {@render tile()}
            </Surface>
            <!-- Reliable, hover-only "click to edit" cue on the active chip
                 (the tooltip carries the same hint as text). -->
            <span class="edit-hint" aria-hidden="true"><Icon name="pencil" size={12} /></span>
          {:else}
            {@render tile()}
          {/if}
        </button>
      {/snippet}
    </Tooltip>
  {/each}
  <Tooltip label={m.sidebar_addSpace()}>
    {#snippet children(triggerProps)}
      <button
        type="button"
        {...triggerProps}
        class="chip chip-add"
        data-testid="add-space"
        aria-label={m.sidebar_addSpace()}
        onclick={openCreate}
      >
        <Icon name="plus" size={14} />
      </button>
    {/snippet}
  </Tooltip>

  <!-- Trailing Settings button (composing the `IconButton` primitive). The launcher
       trigger moved to the top search bar (see App.svelte) — the search pill is back,
       so the redundant launcher icon here is gone. -->
  <span class="bar-actions">
    <IconButton
      icon="settings"
      title={m.sidebar_openOptions()}
      ariaLabel={m.sidebar_openOptionsAria()}
      testid="open-options"
      onclick={openOptions}
    />
  </span>
</div>

<!-- The editor now lives in a BottomSheet (SpaceEditor wraps itself in one).
     Rendered as a SIBLING of the `.switcher` bar so the sheet's
     `position:absolute;inset:0` anchors to the full sidebar panel (the nearest
     positioned ancestor), not the short switcher bar. The switcher opens it for
     create (the `+`/add-chip) and edit (active-chip click / any-chip right-click);
     `closeEditor` returns focus to the trigger chip. -->
<SpaceEditor open={editorOpen} mode={editorMode} onClose={closeEditor} />

<style>
  /* Comp §6: a bordered-top bar over a faint dark wash, holding a row of rounded
   * Space tiles, a dashed add-tile, and a trailing settings gear. */
  .switcher {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: 11px 14px;
    border-top: 1px solid var(--border-soft);
    background: oklch(0 0 0 / 0.14);
  }

  /* Each Space tile is a 34px rounded chip. Active = Space-hue ring (the
   * `--space-line` equivalent, `--space-c`) over a soft Space-hue fill
   * (`--space-soft` ≡ `--space-c-soft`); inactive = calm `--surface` chip.
   * The active fill/ring crossfades so when the active state migrates between
   * chips, one lights up while the other settles. */
  .chip {
    position: relative;
    flex: 0 0 34px;
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 0;
    background: var(--surface);
    border: 1px solid transparent;
    border-radius: var(--r-md);
    color: var(--text);
    cursor: pointer;
    /* Chips are pointer-draggable to reorder; suppress touch scrolling on them. */
    touch-action: none;
    /* Durations read the motion tokens (no hard-coded ms literals) so they collapse
     * to the fast tick under prefers-reduced-motion via the token override block. */
    transition:
      background-color var(--motion-base) ease,
      border-color var(--motion-base) ease,
      transform var(--motion-fast) var(--ease-standard);
  }

  .chip[data-active='true'] {
    background: var(--space-c-soft);
    border-color: var(--space-c);
    /* The active chip is clickable — clicking it opens its editor. */
    cursor: pointer;
  }

  /* Drag source stays in place but dims while its chip-shaped clone is carried.
   * Listed after the active rule so it wins for a dragged active chip. */
  .chip.dragging {
    opacity: 0.3;
  }

  /* Press + focus follow the one foundation convention for every chip (active,
   * inactive, and the `+` add-chip, which also carries `.chip`): the press scale
   * and the single `--focus-*` ring (auto-hue inside `.sidebar`). */
  .chip:active {
    transform: scale(var(--press-scale));
  }
  .chip:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }

  /* The active chip's frosted-glass backing fills the tile and centres the
   * Space-colour swatch on it. Only the active chip composes a `Surface`, so this
   * sizing applies to it alone; it adjusts layout, not the primitive's chrome.
   * Transparent so the chip's own `--space-soft` fill reads through. */
  .chip[data-active='true'] :global(.surface) {
    width: 100%;
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 0;
  }

  /* "Click to edit" cue: a dim scrim + pencil that fades in over the active
   * chip on hover. Pure CSS, so it never depends on the tooltip rendering. */
  .edit-hint {
    position: absolute;
    inset: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--r-md);
    background: var(--scrim);
    color: var(--text);
    opacity: 0;
    transition: opacity var(--motion-fast) var(--ease-standard);
    pointer-events: none;
  }
  .chip[data-active='true']:hover .edit-hint,
  .chip[data-active='true']:focus-visible .edit-hint {
    opacity: 1;
  }

  .chip[data-active='false']:hover {
    background: var(--hover);
  }

  /* Inactive icon swatch: a muted glyph on the calm chip (comp's
   * `--text-muted` icon). The active chip recolours its swatch to the Space hue. */
  .tile {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
  }
  /* The active glyph reads the same theme-aware, contrast-capped `--space-c` the
     chip's identity ring uses, so glyph and ring share one identity and the icon
     darkens correctly on the light `--space-c-soft` fill (a gray Space's glyph
     becomes the neutral `--space-c` rather than the prior near-white 0.84, which
     was effectively invisible on light paper). */
  .chip[data-active='true'] .tile {
    color: var(--space-c);
  }

  /* Settings cluster, pushed to the bar's trailing edge (chips + the add-chip
   * sit on the leading side). */
  .bar-actions {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
  }

  /* Dashed "add Space" tile (comp's `--text-faint` glyph on a dashed outline);
   * hover lifts the glyph + border per the comp. The outline uses `--border-strong`,
   * not the decorative `--border`: this is an interactive control, so its boundary
   * must clear the WCAG 3:1 non-text floor (decorative `--border` is ~1.45:1 on the
   * light surface). Gated in contrast.test.ts. */
  .chip-add {
    background: transparent;
    color: var(--text-faint);
    border: 1px dashed var(--border-strong);
  }
  .chip-add:hover {
    background: transparent;
    color: var(--text-2);
    border-color: var(--text-faint);
  }

  /* Vertical insertion line — the X-axis sibling of the Pinned/Temp `.drop-line`:
   * a glowing bar + leading dot in the active Space hue, zero-width so it never
   * reflows the chip row. `top`/`bottom` match the switcher's vertical padding so
   * it spans the chip height. */
  .drop-line-x {
    position: absolute;
    top: var(--space-2);
    bottom: var(--space-2);
    width: 0;
    z-index: var(--z-raised);
    pointer-events: none;
  }
  .drop-line-x::before {
    content: '';
    position: absolute;
    top: 6px;
    bottom: 0;
    left: -1px;
    width: 2px;
    border-radius: var(--r-pill);
    background: linear-gradient(180deg, var(--space-c), color-mix(in oklch, var(--space-c) 35%, transparent));
    box-shadow: 0 0 7px var(--space-c-dim);
  }
  .drop-line-x::after {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    width: 6px;
    height: 6px;
    border-radius: var(--r-pill);
    background: var(--space-c);
    box-shadow: 0 0 6px var(--space-c);
  }

</style>
