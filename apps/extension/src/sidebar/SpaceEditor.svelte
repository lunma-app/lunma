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
  'teal',
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
import { m } from '../shared/paraglide/messages';
import { normalizeSpaceName } from '../shared/space-names';
import type { IconName, SpaceAutoArchive, SpaceId } from '../shared/types';
import BottomSheet from '../ui/BottomSheet.svelte';
import Button from '../ui/Button.svelte';
import ColorSwatch from '../ui/ColorSwatch.svelte';
import { DEFAULT_ICON, isIconName } from '../shared/icon-names';
import IconPicker from '../ui/IconPicker.svelte';
import SegmentedControl from '../ui/SegmentedControl.svelte';
import { colourToOklch, colourToOn } from '../shared/space-hue';
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
const AUTO_ARCHIVE_OPTIONS = $derived([
  { value: 'inherit', label: m.sidebar_autoArchiveModeInherit() },
  { value: 'off', label: m.sidebar_autoArchiveModeOff() },
  { value: 'custom', label: m.sidebar_autoArchiveModeCustom() },
]);
const DEFAULT_AUTO_ARCHIVE_MINUTES = 60;
let autoArchiveMode = $state<AutoArchiveMode>('inherit');
let autoArchiveMinutes = $state(DEFAULT_AUTO_ARCHIVE_MINUTES);

const isCreate = $derived(mode.kind === 'create');
const primaryLabel = $derived(isCreate ? m.sidebar_spaceEditorConfirmCreate() : m.sidebar_spaceEditorConfirmSave());

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

let nameInputWrap = $state<HTMLElement>();

// Re-seed each time the editor opens (the BottomSheet mounts/unmounts the body
// via `open`), so a stale draft never leaks between openings.
let wasOpen = false;
$effect(() => {
  if (open && !wasOpen) void handleOpened();
  if (!open) {
    confirmingDelete = false;
  }
  wasOpen = open;
});

async function handleOpened(): Promise<void> {
  seed();
  await tick();
  // Focus the name field so typing starts immediately. The BottomSheet's focus
  // scope auto-focuses the sheet on open; moving focus to the name input is a
  // deferred override (no `autofocus` attribute — that trips Chrome's "document
  // already has a focused element" warning).
  await tick();
  nameInputWrap?.querySelector<HTMLInputElement>('input')?.focus();
}

function seed(): void {
  if (mode.kind === 'create') {
    name = '';
    color = nextUnusedColor(store.state.spaces);
    icon = DEFAULT_ICON;
    // A brand-new Space inherits the global default; the user may opt into an
    // override up front (carried in the createSpace payload on submit).
    autoArchiveMode = 'inherit';
    autoArchiveMinutes = DEFAULT_AUTO_ARCHIVE_MINUTES;
  } else {
    name = mode.space.name;
    color = mode.space.color;
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

/** Build the override the current local state represents, or `undefined` for
 * `inherit` (the createSpace payload omits the field in that case). */
function currentAutoArchiveOverride(): SpaceAutoArchive | undefined {
  if (autoArchiveMode === 'off') return { mode: 'off' };
  if (autoArchiveMode === 'custom') {
    return { mode: 'custom', idleMinutes: clampMinutes(autoArchiveMinutes) };
  }
  return undefined;
}

/** Switch the override mode. In EDIT mode it dispatches `setSpaceAutoArchive`
 * immediately (the Space already exists); in CREATE mode it only updates the
 * local draft, which `submit` folds into the `createSpace` payload (no Space id
 * exists yet to target). */
function selectAutoArchiveMode(next: string): void {
  if (next === 'inherit') autoArchiveMode = 'inherit';
  else if (next === 'off') autoArchiveMode = 'off';
  else if (next === 'custom') {
    autoArchiveMode = 'custom';
    autoArchiveMinutes = clampMinutes(autoArchiveMinutes);
  } else return;

  if (mode.kind === 'edit') {
    sendAutoArchive(mode.space.id, currentAutoArchiveOverride() ?? null);
  }
}

/** Edit a custom threshold (positive integer, floor 1). Ignores non-numeric /
 * empty input. Dispatches in edit mode; in create mode it only updates the draft
 * (applied via the createSpace payload on submit). */
function onAutoArchiveMinutesInput(raw: string): void {
  if (autoArchiveMode !== 'custom') return;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return;
  const minutes = clampMinutes(Number.parseInt(trimmed, 10));
  autoArchiveMinutes = minutes;
  if (mode.kind === 'edit') {
    sendAutoArchive(mode.space.id, { mode: 'custom', idleMinutes: minutes });
  }
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

// Dismissal (Esc / scrim / ✕ / focus-leave) is owned by the BottomSheet shell,
// which routes every close path to `onClose`. The editor keeps only its draft +
// dispatch logic below.

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
    const autoArchive = currentAutoArchiveOverride();
    dispatch({
      kind: 'createSpace',
      payload: { name: name.trim(), color, icon, windowId: mode.windowId, autoArchive },
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

<!-- Comp §7: the editor is re-homed in a BottomSheet (bits-ui Dialog sheet
     scoped to the sidebar panel), replacing the former "morph grows up from the
     switcher" presentation. The sheet owns the scrim + ✕ + Esc + interact-outside
     dismissal (all routed to `onClose`), the focus trap, return-focus to the
     trigger, and the Instrument Serif title header. The editor keeps only its
     hue-rebound accent panel, the glass-Surface chrome, and its form. -->
<BottomSheet {open} title={isCreate ? m.sidebar_spaceEditorTitleNew() : m.sidebar_spaceEditorTitleEdit()} {onClose} portalTo=".sidebar">
  <div
    class="panel"
    data-testid="space-editor"
    data-mode={mode.kind}
    style:--space-h={String(previewOklch.h)}
    style:--space-chroma={String(previewOklch.c)}
    style:--space-l={String(previewOklch.l)}
    style:--space-on={previewOn}
  >
    <!-- Full-bleed in the BottomSheet (the sheet IS the container) so the New
         Space form matches the New Lens sheet — no inner glass card. The `.panel`
         stays chromeless, owning only the selected-hue `--accent` rebind its
         descendants inherit (live-previewing the colour you pick). -->
    <div class="editor">
            <div class="name-field">
              <div class="field" bind:this={nameInputWrap}>
                <span class="field-label">{m.sidebar_spaceName()}</span>
                <TextInput
                  ariaLabel={m.sidebar_spaceName()}
                  bind:value={name}
                  placeholder={m.sidebar_spaceNamePlaceholder()}
                  invalid={nameTaken}
                  onenter={submit}
                />
              </div>
              <!-- Duplicate-name feedback. Always in the DOM (so the `aria-live`
                   announcement fires on toggle and tests can read `data-visible`),
                   but COLLAPSED to zero height when hidden — otherwise it reserves
                   a phantom line that opens an unexplained gap before COLOR. It
                   expands in place when a duplicate name is typed. -->
              <p
                class="dupe-msg"
                class:visible={nameTaken}
                data-visible={nameTaken}
                data-testid="space-name-error"
                aria-live="polite"
              >
                {m.sidebar_spaceDuplicate({ name: name.trim() })}
              </p>
            </div>

            <div class="field">
              <span class="field-label">{m.sidebar_spaceColor()}</span>
              <!-- Roving tabindex: focus lives on the swatches; the group is
                   removed from the tab order with tabindex=-1.
                   `role="group"`, not `radiogroup`: the `ColorSwatch` members are
                   `aria-pressed` toggle buttons, not `aria-checked` radios, so a
                   labelled group of toggles is the conformant pattern
                   (COLORSWATCH-01). The roving arrow-keys are kept as a
                   convenience, so the group carries a keydown handler + tabindex. -->
              <!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_no_noninteractive_tabindex -->
              <div
                bind:this={swatchRowEl}
                class="swatch-row"
                role="group"
                aria-label={m.sidebar_spaceColorLabel()}
                tabindex={-1}
                style:--swatch-count={String(COLORS.length)}
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
              <span class="field-label">{m.sidebar_spaceIcon()}</span>
              <IconPicker value={icon} onselect={(i) => (icon = i)} />
            </div>

            <!-- Per-Space auto-archive override (auto-archive). Shown in BOTH
                 create + edit: an eyebrow + helper, the Inherit/Off/Custom
                 segmented control, and (for Custom) an inline "after N minutes"
                 field. In edit it dispatches immediately; in create it folds into
                 the createSpace payload on submit. -->
            <div class="field">
              <span class="field-label">{m.sidebar_spaceAutoArchive()}</span>
              <p class="field-help">
                {#if isCreate}
                  {m.sidebar_autoArchiveCreateHelp()}
                {:else}
                  {m.sidebar_autoArchiveEditHelp()}
                {/if}
              </p>
              <SegmentedControl
                name="auto-archive-mode"
                options={AUTO_ARCHIVE_OPTIONS}
                value={autoArchiveMode}
                ariaLabel={m.sidebar_spaceAutoArchive()}
                onchange={selectAutoArchiveMode}
                block
              />
              {#if autoArchiveMode === 'custom'}
                <div class="aa-custom">
                  <span class="aa-custom-label">{m.sidebar_archiveAfterLabel()}</span>
                  <span class="aa-custom-field">
                    <TextInput
                      ariaLabel={m.sidebar_idleMinutesAria()}
                      inputmode="numeric"
                      value={String(autoArchiveMinutes)}
                      placeholder="60"
                      testid="auto-archive-minutes"
                      oninput={onAutoArchiveMinutesInput}
                    />
                  </span>
                  <span class="aa-custom-label">{m.sidebar_minutesIdleLabel()}</span>
                </div>
              {/if}
            </div>

            {#if !isCreate && confirmingDelete}
              <div class="delete-confirm">
                <p class="delete-msg">{m.sidebar_deleteSpaceConfirm()}</p>
                <div class="actions">
                  <Button variant="secondary" onclick={cancelDelete}>{m.common_cancel()}</Button>
                  <Button variant="secondary" onclick={executeDelete}>{m.common_delete()}</Button>
                </div>
              </div>
            {:else}
              <div class="actions">
                {#if !isCreate}
                  <Button variant="ghost" onclick={confirmDelete}>{m.sidebar_deleteSpaceButton()}</Button>
                {/if}
                <div class="actions-end">
                  <Button variant="secondary" onclick={onClose}>{m.common_cancel()}</Button>
                  <Button variant="primary" disabled={!canSubmit} onclick={submit}>{primaryLabel}</Button>
                </div>
              </div>
            {/if}
          </div>
      </div>
</BottomSheet>

<style>
  .panel {
    /* Re-declare the accent family HERE, resolved from the selected hue
     * (`--space-h`). `--accent` is declared at `:root`, so its `var(--base-hue)`
     * is substituted there (ember) and inherits frozen — rebinding `--base-hue`
     * lower down can't re-colour it. Declaring the family on the panel means the
     * editor's descendants inherit a Space-tinted accent, so the input focus,
     * selected-icon fill, primary button and focus rings preview the colour
     * you're picking. (gray → hue 62 → the default accent, as intended.) */
    --accent: oklch(calc(var(--space-l, 0.62) + 0.065) var(--space-chroma, 0.15) var(--space-h));
    --accent-soft: oklch(calc(var(--space-l, 0.62) + 0.065) var(--space-chroma, 0.15) var(--space-h) / 0.18);
    --accent-on: var(--space-on);
    --accent-text: oklch(0.965 0.01 var(--space-h));
    box-sizing: border-box;
    /* Chromeless: the BottomSheet is the container, so the panel owns only the
     * `--accent` rebind its descendants inherit — the input focus, selected-icon
     * fill, primary button + focus rings preview the colour you're picking. */
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
    /* Comp §8 section rhythm (~16px between field groups). */
    gap: var(--space-4);
    /* No own padding — the BottomSheet body provides it (matches LensEditor),
       so New Space + New Lens align. */
  }

  .field {
    display: flex;
    flex-direction: column;
    /* Comp §8: ~8px between an eyebrow and its control, so the label doesn't
       crowd the swatches / search. */
    gap: var(--space-2);
  }
  /* Comp §8: an uppercase eyebrow — 11px, semibold, letter-spaced, --text-dim. */
  .field-label {
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    line-height: 1.2;
    font-family: var(--font-sans);
    color: var(--text-dim);
  }

  /* Name field + its (collapsible) error, grouped so the section gap to COLOR
     applies once, to the group — not once to the field AND once to the error. */
  .name-field {
    display: flex;
    flex-direction: column;
  }

  /* One-line helper under an eyebrow (faint caption, matches LensEditor). */
  .field-help {
    margin: 0 0 var(--space-1);
    font: var(--weight-medium) var(--text-xs) / 1.4 var(--font-sans);
    color: var(--text-faint);
  }

  /* Custom auto-archive threshold as a sentence: "Archive after [N] minutes
     idle" — the bare number field read ambiguously, so it's framed inline with a
     compact, content-width input and quiet unit labels. */
  .aa-custom {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
  .aa-custom-label {
    font: var(--weight-medium) var(--text-sm) / 1 var(--font-sans);
    color: var(--text-muted);
  }
  .aa-custom-field {
    width: 72px;
  }
  .aa-custom-field :global(.input) {
    text-align: center;
  }

  /* Duplicate-name feedback (unique-space-names). Inset to the input's left edge,
   * danger-toned. Collapsed (max-height/margin 0) when hidden so it reserves NO
   * vertical space — it expands + fades in over --motion-fast when a duplicate
   * name is typed. `nowrap` + ellipsis keep it one line for any name. */
  .dupe-msg {
    margin: 0;
    padding-left: var(--space-1);
    max-height: 0;
    font: var(--weight-medium) var(--text-xs) / 1.3 var(--font-sans);
    color: var(--danger);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0;
    transition:
      max-height var(--motion-fast) var(--ease-standard),
      margin-top var(--motion-fast) var(--ease-standard),
      opacity var(--motion-fast) var(--ease-standard);
  }
  .dupe-msg.visible {
    max-height: 1.5rem;
    margin-top: var(--space-1);
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .dupe-msg {
      transition: none;
    }
  }

  /* Comp §8: one row of FIXED 30px swatches at ~10px spacing. We can't use a
   * static 10px gap (10 swatches × 30px + 9 × 10px = 390px overflows a ~388px
   * panel) nor a tiny fixed gap (the selected swatch's 4px ring then collides
   * with its neighbours). So: `space-between` distributes the swatches, and a
   * `max-width` of (count × 30 + gaps × 10) CAPS the row so on a wide panel the
   * gaps settle at the comp's ~10px (ring fully clear) instead of ballooning;
   * on a narrower panel space-between tightens the gaps down gracefully, and
   * `wrap` is the last-resort fallback only below ~370px. Swatch width (30px)
   * matches ColorSwatch; count tracks the live palette via --swatch-count. */
  .swatch-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    /* Inset by the selected swatch's 4px ring overflow so that ring's outer edge
     * lands on the form's left alignment line (the label/input edge) instead of
     * poking past it — the first swatch is selected by default, so this is always
     * visible. The padding is added back into max-width so the swatch spacing
     * stays the comp's ~10px. */
    box-sizing: border-box;
    padding-inline: var(--space-1);
    max-width: calc(
      var(--swatch-count) * 30px + (var(--swatch-count) - 1) * 10px + 2 * var(--space-1)
    );
    gap: var(--space-1);
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
</style>
