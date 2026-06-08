<script lang="ts">
/**
 * Inline label ↔ input morph. The parent owns the `editing` flag and the
 * trigger (double-click, a menu item, …); this primitive owns the editing
 * mechanics shared by every rename surface (folder, Space, pinned tab, temp
 * tab): seed the draft on entry, focus + select, commit on Enter/blur, cancel
 * on Escape, and the trim/empty policy.
 *
 * - `oncommit(next)` fires with the trimmed value on Enter or blur.
 * - `oncancel()` fires on Escape, or on an empty commit when `allowEmpty` is
 *   false (the default) — the caller keeps the previous value.
 * - With `allowEmpty`, an empty commit emits `''` via `oncommit` instead, so
 *   callers can use a blank submit to clear a custom name.
 */
interface Props {
  /** The current text. Shown as a label when not editing; seeds the draft on edit. */
  value: string;
  /** Parent-owned: when true the field is an editable input, else a static label. */
  editing: boolean;
  /** Commit a (trimmed) value — Enter or blur. */
  oncommit: (next: string) => void;
  /** Abandon the edit — Escape, or empty commit when `allowEmpty` is false. */
  oncancel?: (() => void) | undefined;
  /** Input placeholder. */
  placeholder?: string | undefined;
  /** Treat an empty commit as `oncommit('')` (clear) rather than `oncancel()`. */
  allowEmpty?: boolean | undefined;
  /** Accessible name for the input. */
  ariaLabel?: string | undefined;
  /** `data-testid` for the input element. Default `'editable-label-input'`. */
  testid?: string | undefined;
}

const {
  value,
  editing,
  oncommit,
  oncancel,
  placeholder,
  allowEmpty = false,
  ariaLabel,
  testid = 'editable-label-input',
}: Props = $props();

let inputEl = $state<HTMLInputElement>();
// Uncontrolled draft: seeded from `value` on the edit transition (which also
// fires on mount-while-editing, since `wasEditing` starts false), then owned by
// the field so typing isn't reverted by re-renders of the `value` prop.
let draft = $state('');
let wasEditing = false;
// Set when Escape cancels the edit. Escape unmounts the field (the parent flips
// `editing` off), which fires the input's `onblur` → `commit()`; without this
// guard that trailing blur would write the abandoned draft. Reset on each open.
let cancelled = false;

$effect(() => {
  if (editing && !wasEditing) {
    draft = value;
    cancelled = false;
    // Focus + select on the tick the field appears, so renaming starts ready to type.
    queueMicrotask(() => {
      inputEl?.focus();
      inputEl?.select();
    });
  }
  wasEditing = editing;
});

function commit(): void {
  if (cancelled) return;
  const next = draft.trim();
  if (next) oncommit(next);
  else if (allowEmpty) oncommit('');
  else oncancel?.();
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault();
    commit();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    cancelled = true;
    oncancel?.();
  }
}
</script>

{#if editing}
  <!-- svelte-ignore a11y_autofocus -->
  <input
    bind:this={inputEl}
    bind:value={draft}
    class="edit"
    type="text"
    {placeholder}
    aria-label={ariaLabel}
    data-testid={testid}
    onkeydown={onKeydown}
    onblur={commit}
  />
{:else}
  <span class="label" data-testid="editable-label-text">{value}</span>
{/if}

<style>
  /* The resting label reads as the surrounding row text — the primitive imposes
   * no colour/size of its own so each surface's typography flows through. */
  .label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  /* Editing field: the label truly "becomes editable" — the text stays exactly
   * where it sat, gains a caret, and nothing else. No box, no border, no halo:
   * the surrounding ROW owns the single focus affordance (its `.editing` ring),
   * so the field must stay chromeless or it stacks a second outline on top.
   * Transparent fill + zero padding keep the glyph→text alignment from shifting
   * on the swap; `font: inherit` keeps the type from jumping. */
  .edit {
    flex: 1;
    min-width: 0;
    box-sizing: border-box;
    width: 100%;
    height: 22px;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--text);
    font: inherit;
    caret-color: var(--accent);
  }

  .edit::selection {
    background: var(--accent-soft);
  }

  .edit:focus {
    outline: none;
  }
</style>
