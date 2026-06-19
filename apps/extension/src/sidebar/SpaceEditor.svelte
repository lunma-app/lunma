<script lang="ts" module>
import type { Space, SpaceColor, WindowId } from '../shared/types';

/**
 * The Space editor runs in one of two modes. `create` seeds an empty form with
 * a sensible default colour/icon and dispatches `createSpace`; `edit` seeds
 * from an existing Space and dispatches only the granular commands whose field
 * actually changed.
 */
export type SpaceEditorMode =
  | { kind: 'create'; windowId: WindowId }
  | { kind: 'edit'; space: Space };

/** The palette colours, in canonical (hue-ordered) order, rendered as a swatch row. */
const COLORS: readonly SpaceColor[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'cyan',
  'blue',
  'purple',
  'pink',
  'gray',
];
</script>

<script lang="ts">
import { tick } from 'svelte';
import { dispatch } from '../shared/bus';
import { normalizeSpaceName } from '../shared/space-names';
import type { IconName, SpaceAutoArchive, SpaceId } from '../shared/types';
import Button from '../ui/Button.svelte';
import ColorSwatch from '../ui/ColorSwatch.svelte';
import { DEFAULT_ICON, isIconName } from '../shared/icon-names';
import IconPicker from '../ui/IconPicker.svelte';
import SegmentedControl from '../ui/SegmentedControl.svelte';
import { colourToOklch, colourToOn } from '../shared/space-hue';
import Surface from '../ui/Surface.svelte';
import TextInput from '../ui/TextInput.svelte';
import { nextUnusedColor } from './next-unused-color';
import { useStore } from './store-context.svelte';

interface Props {
  /** Controlled open state, owned by the parent (the switcher). */
  open: boolean;
  /** Called when the editor dismisses (submit, cancel, Esc, click-outside). */
  onClose: () => void;
  /** Create vs edit. */
  mode: SpaceEditorMode;
}

const { open, onClose, mode }: Props = $props();

const store = useStore();

let name = $state('');
let color = $state<SpaceColor>('red');
let icon = $state<IconName>(DEFAULT_ICON);
let colorFocus = $state(0);

// Per-Space auto-archive override (auto-archive), edit-mode only. Local draft
// seeded from the edited Space's override; each change dispatches
// `setSpaceAutoArchive` immediately (like TabBoundaryEditor), independent of the
// name/colour/icon draft applied on Save.
type AutoArchiveMode = 'inherit' | 'off' | 'custom';
const AUTO_ARCHIVE_OPTIONS = [
  { value: 'inherit', label: 'Inherit' },
  { value: 'off', label: 'Off' },
  { value: 'custom', label: 'Custom' },
];
const DEFAULT_AUTO_ARCHIVE_MINUTES = 60;
let autoArchiveMode = $state<AutoArchiveMode>('inherit');
let autoArchiveMinutes = $state(DEFAULT_AUTO_ARCHIVE_MINUTES);

const isCreate = $derived(mode.kind === 'create');
const primaryLabel = $derived(isCreate ? 'Create' : 'Save');

let confirmingDelete = $state(false);

// Space names are unique (unique-space-names). The trimmed name is a duplicate
// when its normalized (trim + casefold) form matches another Space's — in edit
// mode the edited Space is excluded, so an unchanged or casing-only name is
// never flagged. Empty names are handled by the `name.trim() !== ''` guard, not
// here. The backend (`store.createSpace`/`renameSpace`) throws on the same
// collision; this inline check normally keeps the user from ever reaching it.
const editedSpaceId = $derived(mode.kind === 'edit' ? mode.space.id : undefined);
const nameTaken = $derived.by(() => {
  const trimmed = name.trim();
  if (trimmed === '') return false;
  const normalized = normalizeSpaceName(trimmed);
  return store.state.spaces.some(
    (s) => s.id !== editedSpaceId && normalizeSpaceName(s.name) === normalized,
  );
});
const canSubmit = $derived(name.trim() !== '' && !nameTaken);

// Live identity preview: the panel rebinds its canonical OKLCH (`--space-l` /
// `--space-chroma` / `--space-h`) + on-colour ink (`--space-on`) to the
// *currently selected* colour, so every accent inside (input focus, selected-icon
// fill, the primary button, swatch/icon focus rings) recolours to the TRUE
// colour the Space will take.
const previewOklch = $derived(colourToOklch(color));
const previewOn = $derived(colourToOn(color));

let panelEl = $state<HTMLElement>();
let nameInputWrap = $state<HTMLElement>();
// The morph grows by animating the clip's height from 0 → the panel's measured
// height (the panel is absolutely bottom-anchored, so the clip unrolls it
// upward out of the switcher). `revealed` flips true a couple of frames after
// mount so the collapsed (height 0) state paints first and the height actually
// transitions instead of snapping open.
let revealed = $state(false);
let panelH = $state(0);

// Re-seed + animate-in each time the editor opens (the parent mounts/unmounts
// the panel via `open`), so a stale draft never leaks between openings.
let wasOpen = false;
$effect(() => {
  if (open && !wasOpen) void handleOpened();
  if (!open) {
    revealed = false;
    panelH = 0;
    confirmingDelete = false;
  }
  wasOpen = open;
});

async function handleOpened(): Promise<void> {
  seed();
  revealed = false;
  panelH = 0;
  await tick();
  // Measure the panel's natural height (it's position:absolute, so this is the
  // content height regardless of the clip being collapsed).
  if (panelEl) panelH = panelEl.offsetHeight;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      revealed = true;
    });
  });
  await tick();
  // Focus the name field so typing starts immediately (no `autofocus` attribute
  // — that races the morph and trips Chrome's "document already has a focused
  // element" warning).
  nameInputWrap?.querySelector<HTMLInputElement>('input')?.focus();
}

function seed(): void {
  if (mode.kind === 'create') {
    name = '';
    color = nextUnusedColor(store.state.spaces);
    icon = DEFAULT_ICON;
  } else {
    name = mode.space.name;
    color = mode.space.color as SpaceColor;
    // Stored space icons are plain strings; the picker model + dispatch contract
    // are `IconName`. Narrow at the seam — a non-catalogue stored icon (legacy or
    // imported) falls back to the default rather than a lying cast.
    icon = isIconName(mode.space.icon) ? mode.space.icon : DEFAULT_ICON;
    const aa = mode.space.autoArchive;
    if (aa === undefined) {
      autoArchiveMode = 'inherit';
      autoArchiveMinutes = DEFAULT_AUTO_ARCHIVE_MINUTES;
    } else if (aa.mode === 'off') {
      autoArchiveMode = 'off';
      autoArchiveMinutes = DEFAULT_AUTO_ARCHIVE_MINUTES;
    } else {
      autoArchiveMode = 'custom';
      autoArchiveMinutes = aa.idleMinutes;
    }
  }
  colorFocus = Math.max(0, COLORS.indexOf(color));
}

function clampMinutes(n: number): number {
  return n < 1 ? 1 : n;
}

function sendAutoArchive(spaceId: SpaceId, autoArchive: SpaceAutoArchive | null): void {
  dispatch({ kind: 'setSpaceAutoArchive', payload: { spaceId, autoArchive } });
}

/** Switch the override mode. `Inherit` clears it (null), `Off` disables this
 * Space, `Custom` archives at its own threshold (seeded from the current draft
 * minutes). Dispatches immediately. */
function selectAutoArchiveMode(next: string): void {
  if (mode.kind !== 'edit') return;
  const spaceId = mode.space.id;
  if (next === 'inherit') {
    autoArchiveMode = 'inherit';
    sendAutoArchive(spaceId, null);
  } else if (next === 'off') {
    autoArchiveMode = 'off';
    sendAutoArchive(spaceId, { mode: 'off' });
  } else if (next === 'custom') {
    autoArchiveMode = 'custom';
    const minutes = clampMinutes(autoArchiveMinutes);
    autoArchiveMinutes = minutes;
    sendAutoArchive(spaceId, { mode: 'custom', idleMinutes: minutes });
  }
}

/** Persist an edited custom threshold (positive integer, floor 1). Ignores
 * non-numeric / empty input — never dispatches a non-number. */
function onAutoArchiveMinutesInput(raw: string): void {
  if (mode.kind !== 'edit' || autoArchiveMode !== 'custom') return;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return;
  const minutes = clampMinutes(Number.parseInt(trimmed, 10));
  autoArchiveMinutes = minutes;
  sendAutoArchive(mode.space.id, { mode: 'custom', idleMinutes: minutes });
}

function chooseColor(next: SpaceColor, index: number): void {
  color = next;
  colorFocus = index;
}

let swatchRowEl = $state<HTMLElement>();

function onColorKeydown(event: KeyboardEvent): void {
  let next = colorFocus;
  if (event.key === 'ArrowRight') next = colorFocus + 1;
  else if (event.key === 'ArrowLeft') next = colorFocus - 1;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = COLORS.length - 1;
  else return;
  event.preventDefault();
  next = Math.max(0, Math.min(COLORS.length - 1, next));
  colorFocus = next;
  swatchRowEl?.querySelectorAll<HTMLButtonElement>('[data-testid="color-swatch"]')?.[next]?.focus();
}

// --- dismissal (hand-rolled — its own Esc/click-outside/focus pattern) -------

function focusables(): HTMLElement[] {
  if (!panelEl) return [];
  return Array.from(panelEl.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled])'));
}

function onPanelKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    onClose();
    return;
  }
  if (event.key === 'Tab') {
    const f = focusables();
    if (f.length === 0) return;
    const first = f[0];
    const last = f[f.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first?.focus();
    }
  }
}

function onDocPointerDown(event: PointerEvent): void {
  if (panelEl && event.target instanceof Node && !panelEl.contains(event.target)) {
    onClose();
  }
}

$effect(() => {
  if (!open) return;
  // Defer attaching so the same click that opened the editor doesn't immediately
  // close it.
  let attached = false;
  const id = requestAnimationFrame(() => {
    document.addEventListener('pointerdown', onDocPointerDown, true);
    attached = true;
  });
  return () => {
    cancelAnimationFrame(id);
    if (attached) document.removeEventListener('pointerdown', onDocPointerDown, true);
  };
});

// --- dispatch ----------------------------------------------------------------

function confirmDelete(): void {
  confirmingDelete = true;
}

function cancelDelete(): void {
  confirmingDelete = false;
}

function executeDelete(): void {
  if (mode.kind !== 'edit') return;
  dispatch({ kind: 'deleteSpace', payload: { spaceId: mode.space.id } });
  onClose();
}

function submit(): void {
  if (!canSubmit) return;
  if (mode.kind === 'create') {
    dispatch({
      kind: 'createSpace',
      payload: { name: name.trim(), color, icon, windowId: mode.windowId },
    });
  } else {
    const original = mode.space;
    const trimmed = name.trim();
    if (trimmed !== original.name) {
      dispatch({ kind: 'renameSpace', payload: { spaceId: original.id, newName: trimmed } });
    }
    if (color !== original.color) {
      dispatch({ kind: 'recolourSpace', payload: { spaceId: original.id, color } });
    }
    if (icon !== original.icon) {
      dispatch({ kind: 'changeSpaceIcon', payload: { spaceId: original.id, icon } });
    }
  }
  onClose();
}
</script>

{#if open}
  <!-- The morph grows UPWARD out of the switcher: position:absolute + bottom
       anchored to the switcher's top edge, so the sidebar's height never
       changes and the tab list above is overlaid, not pushed. -->
  <div class="morph" class:revealed data-testid="space-editor-morph">
    <div class="clip" style:height={revealed ? `${panelH}px` : '0px'}>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        bind:this={panelEl}
        class="panel"
        role="dialog"
        aria-modal="true"
        aria-label={isCreate ? 'New Space' : 'Edit Space'}
        tabindex={-1}
        data-testid="space-editor"
        data-mode={mode.kind}
        style:--space-h={String(previewOklch.h)}
        style:--space-chroma={String(previewOklch.c)}
        style:--space-l={String(previewOklch.l)}
        style:--space-on={previewOn}
        onkeydown={onPanelKeydown}
      >
        <!-- The panel's visual chrome (frosted glass + hue glow) is the shared
             `Surface`, not hand-rolled here. The glow tracks the SELECTED colour
             because the panel rebinds `--space-h`/`--space-chroma` above, which
             `--glow-space-soft` (and the glass fill) read — so the chrome
             live-previews the colour you're shaping. The panel keeps only its
             positioning, the morph opacity tween, and the `--accent` rebind its
             descendants inherit. -->
        <Surface variant="glass" glow radius="lg">
          <div class="editor">
            <div bind:this={nameInputWrap}>
              <TextInput
                label="Name"
                bind:value={name}
                placeholder="Space name"
                invalid={nameTaken}
                onenter={submit}
              />
              <!-- Height-reserving slot: the message is always in the DOM (its
                   height is part of the panel's measured open height) and only
                   its opacity toggles, so the morph never jumps when it appears.
                   `nowrap` + ellipsis keep it exactly one line for any name. -->
              <p
                class="dupe-msg"
                class:visible={nameTaken}
                data-visible={nameTaken}
                data-testid="space-name-error"
                aria-live="polite"
              >
                A space named “{name.trim()}” already exists.
              </p>
            </div>

            <div class="field">
              <span class="field-label">Colour</span>
              <!-- Roving tabindex: focus lives on the swatches; the group is
                   removed from the tab order with tabindex=-1. -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                bind:this={swatchRowEl}
                class="swatch-row"
                role="radiogroup"
                aria-label="Space colour"
                tabindex={-1}
                onkeydown={onColorKeydown}
              >
                {#each COLORS as c, index (c)}
                  <ColorSwatch
                    color={c}
                    selected={c === color}
                    tabindex={index === colorFocus ? 0 : -1}
                    onclick={() => chooseColor(c, index)}
                  />
                {/each}
              </div>
            </div>

            <div class="field">
              <span class="field-label">Icon</span>
              <IconPicker value={icon} onselect={(i) => (icon = i)} />
            </div>

            {#if !isCreate}
              <!-- Per-Space auto-archive override (auto-archive). Reuses the
                   editor's control idiom — a SegmentedControl row + a conditional
                   numeric field — so it reads as a native part of the editor; the
                   composed primitives carry reduced-motion + WCAG-AA. -->
              <div class="field">
                <span class="field-label">Auto-archive</span>
                <SegmentedControl
                  name="auto-archive-mode"
                  options={AUTO_ARCHIVE_OPTIONS}
                  value={autoArchiveMode}
                  ariaLabel="Auto-archive"
                  onchange={selectAutoArchiveMode}
                  block
                />
                {#if autoArchiveMode === 'custom'}
                  <TextInput
                    ariaLabel="Idle minutes before archiving"
                    inputmode="numeric"
                    value={String(autoArchiveMinutes)}
                    placeholder="60"
                    testid="auto-archive-minutes"
                    oninput={onAutoArchiveMinutesInput}
                  />
                {/if}
              </div>
            {/if}

            {#if !isCreate && confirmingDelete}
              <div class="delete-confirm">
                <p class="delete-msg">Are you sure? This will remove the space and unpin all its tabs.</p>
                <div class="actions">
                  <Button variant="secondary" onclick={cancelDelete}>Cancel</Button>
                  <Button variant="secondary" onclick={executeDelete}>Delete</Button>
                </div>
              </div>
            {:else}
              <div class="actions">
                {#if !isCreate}
                  <Button variant="ghost" onclick={confirmDelete}>Delete Space…</Button>
                {/if}
                <div class="actions-end">
                  <Button variant="secondary" onclick={onClose}>Cancel</Button>
                  <Button variant="primary" disabled={!canSubmit} onclick={submit}>{primaryLabel}</Button>
                </div>
              </div>
            {/if}
          </div>
        </Surface>
      </div>
    </div>
  </div>
{/if}

<style>
  .morph {
    position: absolute;
    left: var(--space-2);
    right: var(--space-2);
    /* Bottom edge pinned to the switcher's top edge (1px overlap), so the panel
     * grows UPWARD out of the switcher and the sidebar height never changes. */
    bottom: calc(100% - 1px);
    z-index: 60;
    pointer-events: none;
  }
  .morph.revealed {
    pointer-events: auto;
  }

  /* The grow clip: its height animates 0 → the panel's measured height. The
   * panel is absolutely bottom-anchored inside it, so as the clip's height
   * grows (and, being bottom-pinned via .morph, extends upward) the panel
   * unrolls from the switcher edge up — bottom (buttons) first, name last. */
  .clip {
    position: relative;
    overflow: hidden;
    height: 0;
    transition: height var(--motion-base) var(--ease-emphasised);
  }

  .panel {
    /* Re-declare the accent family HERE, resolved from the selected hue
     * (`--space-h`). `--accent` is declared at `:root`, so its `var(--base-hue)`
     * is substituted there (ember) and inherits frozen — rebinding `--base-hue`
     * lower down can't re-colour it. Declaring the family on the panel means the
     * editor's descendants inherit a Space-tinted accent, so the input focus,
     * selected-icon fill, primary button and focus rings preview the colour
     * you're picking. (gray → hue 62 → the default accent, as intended.) */
    --accent: oklch(calc(var(--space-l) + 0.065) var(--space-chroma) var(--space-h));
    --accent-soft: oklch(calc(var(--space-l) + 0.065) var(--space-chroma) var(--space-h) / 0.18);
    --accent-on: var(--space-on);
    --accent-text: oklch(0.965 0.01 var(--space-h));
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    box-sizing: border-box;
    /* Visual chrome (glass fill, border, glow, radius) is the child `Surface`;
     * the panel itself is now chromeless and owns only positioning and the morph
     * opacity tween. The Surface's glass + `--glow-space-soft` read the panel's
     * rebound `--space-h`/`--space-chroma`, so the chrome live-previews the
     * selected colour. */
    opacity: 0;
    transition: opacity var(--motion-base) var(--ease-emphasised);
  }
  .morph.revealed .panel {
    opacity: 1;
  }

  /* Light theme uses a darker accent lightness + light on-accent text. */
  :global(:root[data-theme='light']) .panel {
    --accent: oklch(0.54 0.18 var(--space-h));
    --accent-soft: oklch(0.54 0.18 var(--space-h) / 0.16);
    --accent-on: oklch(0.985 0.005 var(--space-h));
    --accent-text: oklch(0.985 0.005 var(--space-h));
  }

  .editor {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  .field-label {
    font: 500 11px/1.2 var(--font-sans);
    color: var(--text-muted);
  }

  /* Duplicate-name feedback (unique-space-names). Inset to the input's left
   * edge, danger-toned, and faded in over --motion-fast so it reads as
   * responsive without flashing on every mid-word keystroke. Always rendered
   * (opacity-toggled) + single-line so the panel height never jumps. */
  .dupe-msg {
    margin: var(--space-1) 0 0;
    padding-left: var(--space-1);
    font: var(--weight-medium) var(--text-xs) / 1.3 var(--font-sans);
    color: var(--danger);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0;
    transition: opacity var(--motion-fast) var(--ease-standard);
  }
  .dupe-msg.visible {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .dupe-msg {
      transition: none;
    }
  }

  /* One row, evenly distributed across the full panel width (each swatch in a
   * 1fr column, centred), so the palette uses the available width. */
  .swatch-row {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: var(--space-1);
    justify-items: center;
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-2);
    margin-top: var(--space-1);
  }

  /* When there's a delete button on the left, spread the row */
  .actions:has(:global(.btn[data-variant='ghost'])) {
    justify-content: space-between;
  }

  .actions-end {
    display: flex;
    gap: var(--space-2);
  }

  /* Danger-toned ghost button for Delete Space */
  .actions :global(.btn[data-variant='ghost']:first-child) {
    color: var(--danger);
  }
  .actions :global(.btn[data-variant='ghost']:first-child:hover) {
    background: color-mix(in oklch, var(--danger) 12%, transparent);
    color: var(--danger);
  }

  .delete-confirm {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-top: var(--space-1);
  }

  .delete-msg {
    margin: 0;
    font: var(--text-xs) / 1.4 var(--font-sans);
    color: var(--text-muted);
  }

  /* The delete confirm's Delete button gets danger colouring */
  .delete-confirm .actions {
    justify-content: flex-end;
  }
  .delete-confirm .actions :global(.btn:last-child) {
    color: var(--danger);
    border-color: color-mix(in oklch, var(--danger) 40%, transparent);
  }
  .delete-confirm .actions :global(.btn:last-child:hover) {
    background: color-mix(in oklch, var(--danger) 12%, var(--surface));
    color: var(--danger);
  }

  @media (prefers-reduced-motion: reduce) {
    .clip,
    .panel {
      transition-duration: var(--motion-fast);
    }
  }
</style>
