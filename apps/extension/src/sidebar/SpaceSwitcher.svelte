<script lang="ts">
import '../ui/drop-line.css';
import { dispatch } from '../shared/bus';
import type { IconName } from '../shared/icon-names';
import { log } from '../shared/logger';
import { colourToOklch, colourToOn } from '../shared/space-hue';
import type { Space, SpaceColor, WindowId } from '../shared/types';
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

function openEditFor(space: Space, el: HTMLElement): void {
  editorMode = { kind: 'edit', space };
  triggerEl = el;
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
  const ok = colourToOklch(space.color as SpaceColor);
  drag.press(
    {
      id: space.id,
      zone: ZONE,
      title: space.name,
      faviconSrc: '',
      chip: {
        icon: space.icon as IconName,
        hue: ok.h,
        chroma: ok.c,
        l: ok.l,
        on: colourToOn(space.color as SpaceColor),
      },
    },
    event,
    el,
    handleDrop,
  );
}

function handleDrop(r: DropResult): void {
  if (r.data.zone !== ZONE) return;
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
    {@const ok = colourToOklch(space.color as SpaceColor)}
    {@const isActive = space.id === activeSpaceId}
    <Tooltip label={isActive ? `${space.name} · click to edit` : space.name}>
      {#snippet children(triggerProps)}
        <button
          type="button"
          {...triggerProps}
          class="chip"
          class:dragging={isDragSource(space)}
          data-testid="space-chip"
          data-space-id={space.id}
          data-active={isActive ? 'true' : 'false'}
          aria-current={isActive ? 'true' : undefined}
          aria-label={isActive ? `Edit ${space.name}` : `Activate ${space.name}`}
          style:--space-h={String(ok.h)}
          style:--space-chroma={String(ok.c)}
          style:--space-l={String(ok.l)}
          style:--space-on={colourToOn(space.color as SpaceColor)}
          bind:this={chipEls[i]}
          onpointerdown={(event) => onChipPointerDown(event, space)}
          onclick={(event) => onChipClick(event, space, isActive)}
          oncontextmenu={(event) => onChipContextMenu(event, space)}
        >
          {#snippet tile()}
            <span class="tile"><Icon name={space.icon as IconName} size={12} /></span>
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
  <Tooltip label="New Space">
    {#snippet children(triggerProps)}
      <button
        type="button"
        {...triggerProps}
        class="chip chip-add"
        data-testid="add-space"
        aria-label="New Space"
        onclick={openCreate}
      >
        <Icon name="plus" size={12} />
      </button>
    {/snippet}
  </Tooltip>

  <!-- Trailing Settings button (composing the `IconButton` primitive). The launcher
       trigger moved to the top search bar (see App.svelte) — the search pill is back,
       so the redundant launcher icon here is gone. -->
  <span class="bar-actions">
    <IconButton
      icon="settings"
      title="Open Lunma options"
      ariaLabel="Open options"
      testid="open-options"
      onclick={openOptions}
    />
  </span>

  <!-- The editor morph is absolutely positioned within the switcher (out of
       flow), so it grows upward over the tab list without changing the
       switcher's or sidebar's height. -->
  <SpaceEditor open={editorOpen} mode={editorMode} onClose={closeEditor} />
</div>

<style>
  .switcher {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-top: 1px solid var(--divider);
    background: var(--bg-elev);
  }

  /* Arc-style: no box around the active chip — just opacity. Active = 1,
   * inactive = dimmed. Opacity transitions smoothly so when the active state
   * migrates from one chip to another, you see one fade up while the other
   * fades down. */
  .chip {
    position: relative;
    flex: 0 0 32px;
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    padding: 0;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--r-md);
    color: var(--text);
    cursor: pointer;
    opacity: 0.4;
    /* Chips are pointer-draggable to reorder; suppress touch scrolling on them. */
    touch-action: none;
    transition:
      opacity 460ms cubic-bezier(0.16, 1, 0.3, 1),
      background-color 220ms ease,
      transform var(--motion-fast) var(--ease-standard);
  }

  .chip[data-active='true'] {
    opacity: 1;
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
   * and the single `--focus-*` ring (auto-hue inside `.sidebar`), replacing the
   * former inline `scale(0.94)` and `outline: 2px solid var(--accent)`. */
  .chip:active {
    transform: scale(var(--press-scale));
  }
  .chip:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }

  /* The active chip's frosted-glass backing fills the 32px chip and centres the
   * Space-colour tile on it. Only the active chip composes a `Surface`, so this
   * sizing applies to it alone; it adjusts layout, not the primitive's chrome. */
  .chip[data-active='true'] :global(.surface) {
    width: 100%;
    height: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
    opacity: 0.85;
    background: var(--hover);
  }

  .tile {
    width: 20px;
    height: 20px;
    border-radius: var(--r-sm);
    background: oklch(var(--space-l, 0.62) var(--space-chroma, 0.15) var(--space-h));
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--space-on);
    flex: 0 0 20px;
  }

  /* Launcher + Settings cluster, pushed to the bar's trailing edge (chips + the
   * add-chip sit on the leading side). */
  .bar-actions {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
  }

  .chip-add {
    background: transparent;
    color: var(--text-dim);
    border: 1px dashed var(--border);
    opacity: 0.45;
  }
  .chip-add:hover {
    opacity: 0.8;
    background: var(--hover);
    color: var(--text);
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
    z-index: 2;
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
