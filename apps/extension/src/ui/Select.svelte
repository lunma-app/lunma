<script lang="ts" module>
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
</script>

<script lang="ts">
import { onDestroy, tick } from 'svelte';
import { scrollFade } from './scroll-fade';
import Surface from './Surface.svelte';

interface Props {
  /** The selectable options. */
  options: SelectOption[];
  /** Currently-selected value. */
  value: string;
  /** Fired with the newly-picked value. */
  onchange: (value: string) => void;
  /** Accessible name (the visible label lives outside the primitive). */
  ariaLabel?: string | undefined;
  /** `data-testid` for the trigger button. Default `'select'`. */
  testid?: string | undefined;
}

const { options, value, onchange, ariaLabel, testid = 'select' }: Props = $props();

let open = $state(false);
let rootEl = $state<HTMLElement>();
let triggerEl = $state<HTMLButtonElement>();

const selectedLabel = $derived(options.find((o) => o.value === value)?.label ?? '');

onDestroy(removeOutside);

function setOpen(next: boolean): void {
  if (next === open) return;
  open = next;
  if (next) {
    addOutside();
    void focusSelectedSoon();
  } else {
    removeOutside();
  }
}

function close(): void {
  setOpen(false);
  triggerEl?.focus();
}

function choose(option: SelectOption): void {
  if (option.disabled) return;
  if (option.value !== value) onchange(option.value);
  close();
}

function optionEls(): HTMLButtonElement[] {
  if (!rootEl) return [];
  return Array.from(rootEl.querySelectorAll<HTMLButtonElement>('[role="option"]'));
}

/** Open with the roving highlight already on the current value. */
async function focusSelectedSoon(): Promise<void> {
  await tick();
  const els = optionEls();
  const current = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  els[current]?.focus();
}

function moveTo(index: number): void {
  const els = optionEls();
  if (els.length === 0) return;
  els[((index % els.length) + els.length) % els.length]?.focus();
}

function onKeydown(event: KeyboardEvent): void {
  if (!open) {
    // Trigger focused + closed: the arrow keys open the list (Enter/Space open
    // via the button's native click, so they are NOT handled here — that would
    // open-then-toggle-closed).
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
    }
    return;
  }
  // Open: roving keyboard model over the options. Enter/Space activate the
  // focused option via its native button click, so they aren't intercepted.
  const els = optionEls();
  const idx = els.indexOf(document.activeElement as HTMLButtonElement);
  if (event.key === 'Escape') {
    event.preventDefault();
    close();
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    moveTo(idx + 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    moveTo(idx - 1);
  } else if (event.key === 'Home') {
    event.preventDefault();
    moveTo(0);
  } else if (event.key === 'End') {
    event.preventDefault();
    moveTo(els.length - 1);
  } else if (event.key === 'Tab') {
    setOpen(false); // let focus leave naturally
  }
}

// --- outside-click dismissal -------------------------------------------------
function onDocPointerDown(event: PointerEvent): void {
  if (rootEl && event.target instanceof Node && !rootEl.contains(event.target)) setOpen(false);
}
function addOutside(): void {
  document.addEventListener('pointerdown', onDocPointerDown, true);
}
function removeOutside(): void {
  document.removeEventListener('pointerdown', onDocPointerDown, true);
}
</script>

<!--
  A custom listbox dropdown. The closed trigger matches the `TextInput`
  primitive (filled `--surface-2`, hover lift, `--accent` focus halo); the open
  popover is an OPAQUE `elevated` `Surface` (not glass — a dropdown over a form
  must not let the content behind bleed through) whose selected row carries the
  active Space's accent wash + check, so it reads on-brand rather than the OS
  list. Used for `enum` settings with more options than a `SegmentedControl` can
  hold on one row (the search-engine picker, launcher-web-search).
-->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="select" bind:this={rootEl} onkeydown={onKeydown}>
  <button
    bind:this={triggerEl}
    type="button"
    class="trigger"
    class:open
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-label={ariaLabel}
    data-testid={testid}
    data-value={value}
    onclick={() => setOpen(!open)}
  >
    <span class="value">{selectedLabel}</span>
    <span class="chevron" class:open aria-hidden="true">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  </button>

  {#if open}
    <div class="popover">
      <Surface variant="elevated" radius="md">
        <ul class="list" role="listbox" aria-label={ariaLabel} tabindex={-1} use:scrollFade>
          {#each options as option (option.value)}
            <li>
              <button
                type="button"
                role="option"
                class="option"
                class:selected={option.value === value}
                aria-selected={option.value === value}
                disabled={option.disabled}
                data-testid="select-option"
                data-value={option.value}
                onclick={() => choose(option)}
              >
                <span class="check" aria-hidden="true">
                  {#if option.value === value}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  {/if}
                </span>
                <span class="opt-label">{option.label}</span>
              </button>
            </li>
          {/each}
        </ul>
      </Surface>
    </div>
  {/if}
</div>

<style>
  .select {
    position: relative;
    display: flex;
    width: 100%;
  }

  /* The closed trigger mirrors TextInput: a soft filled field that lifts on
   * hover and glides into a gentle accent halo on focus. The trailing chevron
   * flips when the list is open. */
  .trigger {
    appearance: none;
    width: 100%;
    box-sizing: border-box;
    height: var(--control-h-md);
    padding: 0 var(--space-3);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    /* Recessed dark trigger with a crisp idle border — matches the evolved
       TextInput (sources-redesign / comp). */
    border: 1px solid var(--border);
    border-radius: var(--r-md);
    background: var(--bg);
    color: var(--text);
    font: var(--weight-medium) var(--text-base) / 1 var(--font-sans);
    text-align: left;
    cursor: pointer;
    transition:
      border-color var(--motion-base) var(--ease-standard),
      box-shadow var(--motion-base) var(--ease-standard),
      background var(--motion-base) var(--ease-standard);
  }
  .trigger:hover {
    border-color: var(--border-strong);
  }
  .trigger:focus-visible,
  .trigger.open {
    outline: none;
    border-color: oklch(from var(--accent) l c h / 0.55);
    box-shadow: 0 0 0 3px var(--accent-soft);
    background: var(--bg-elev);
  }

  .value {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .chevron {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    color: var(--text-muted);
    transition:
      transform var(--motion-base) var(--ease-emphasised),
      color var(--motion-base) var(--ease-standard);
  }
  .trigger:hover .chevron {
    color: var(--text-2);
  }
  .chevron.open {
    transform: rotate(180deg);
    color: var(--accent);
  }

  /* Popover spans the trigger's full width (left:0/right:0), so it never
   * misaligns; it floats just below on the dropdown layer as a frosted Surface. */
  .popover {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: var(--z-dropdown);
    animation: select-in var(--motion-fast) var(--ease-emphasised);
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding: var(--space-1);
    max-height: 320px;
    overflow-y: auto;
    list-style: none;
  }
  .list li {
    display: flex;
  }

  .option {
    appearance: none;
    border: 0;
    margin: 0;
    width: 100%;
    box-sizing: border-box;
    height: 36px;
    padding: 0 var(--space-2);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    background: transparent;
    color: var(--text-2);
    font: var(--weight-medium) var(--text-base) / 1 var(--font-sans);
    text-align: left;
    cursor: pointer;
    border-radius: var(--r-sm);
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard);
  }
  .option:hover {
    background: var(--hover);
    color: var(--text);
  }
  /* Selection reads in the active Space's accent — a soft wash + an accent
   * check — NOT the OS highlight, so the open list stays on-brand. */
  .option.selected {
    background: var(--accent-soft);
    color: var(--text);
  }
  .option:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: -2px;
  }
  .check {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    color: var(--accent);
  }
  .opt-label {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @keyframes select-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .popover {
      animation: none;
    }
    .chevron {
      transition: color var(--motion-base) var(--ease-standard);
    }
    .chevron.open {
      transform: none;
    }
  }
</style>
