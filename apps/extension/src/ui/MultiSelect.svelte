<script lang="ts" module>
export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  /** Extra text folded into the search corpus but never displayed — e.g. a source's
   * provider/type keyword, so typing the type finds rows whose visible label omits it. */
  keywords?: string;
}

/** Case-insensitive subsequence ("fuzzy") match: every char of `query` appears in
 * `text` in order (e.g. `hcr` matches `Hacker News`). Powers the in-popover search. */
function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let i = 0;
  for (let j = 0; j < t.length && i < q.length; j++) {
    if (t[j] === q[i]) i++;
  }
  return i === q.length;
}
</script>

<script lang="ts">
import { Popover } from 'bits-ui';
import { type Snippet, tick } from 'svelte';
import { scrollFade } from './scroll-fade';
import SearchField from './SearchField.svelte';
import Surface from './Surface.svelte';

interface Props {
  /** The selectable options. */
  options: MultiSelectOption[];
  /** Currently-selected values (any number). */
  values: string[];
  /** Fired with the next full selection whenever a row toggles or Clear fires. */
  onchange: (values: string[]) => void;
  /** Closed-trigger summary (parent-computed: "All feeds" / a name / "3 feeds").
   * Unused in `inline` mode (there is no trigger). */
  label: string;
  /** `dropdown` (trigger + popover, the default) or `inline` (always-open list). */
  mode?: 'dropdown' | 'inline';
  /** Trigger look (dropdown mode only): `field` (recessed control, the default) or
   * `chip` (a pill matching the filter chips, for compact filter toolbars). */
  variant?: 'field' | 'chip';
  /** Show the in-popover search box once `options.length` exceeds this. Default 8. */
  searchThreshold?: number;
  /** Placeholder for the search box (when shown). */
  searchPlaceholder?: string | undefined;
  /** Accessible name (the visible label lives outside the primitive). */
  ariaLabel?: string | undefined;
  /** Text for the in-popover Clear action (shown only when ≥1 selected). */
  clearLabel?: string | undefined;
  /** Text for the in-popover "Select all" action. When set, the header shows it
   * while not every (enabled) option is selected; paired with `clearLabel` it reads
   * as a select-all ⟷ clear toggle. Acts on ALL options, ignoring the search. */
  selectAllLabel?: string | undefined;
  /** Optional content rendered before each row's label (e.g. an AccountChip). */
  leading?: Snippet<[MultiSelectOption]> | undefined;
  /** `data-testid` for the trigger (dropdown) / list root (inline). Default
   * `'multi-select'`. */
  testid?: string | undefined;
}

const {
  options,
  values,
  onchange,
  label,
  mode = 'dropdown',
  variant = 'field',
  searchThreshold = 8,
  searchPlaceholder,
  ariaLabel,
  clearLabel,
  selectAllLabel,
  leading,
  testid = 'multi-select',
}: Props = $props();

let open = $state(false);
let query = $state('');
let rootEl = $state<HTMLElement>();
let triggerEl = $state<HTMLButtonElement>();
// Dropdown mode only: the portaled popover content (bits-ui `Popover.Content`,
// rendered into `document.body` — NOT a descendant of `rootEl`, so `optionEls()`
// must search here, not `rootEl`, once the popover is open. Inline mode has no
// portal; `rootEl` itself holds the options and is used as the fallback.
let contentEl = $state<HTMLElement | null>(null);

const selectedSet = $derived(new Set(values));
const selectedCount = $derived(values.length);
const showSearch = $derived(options.length > searchThreshold);
// "Select all" acts on every enabled option (a master toggle, search-independent).
const enabledValues = $derived(options.filter((o) => !o.disabled).map((o) => o.value));
const allSelected = $derived(
  enabledValues.length > 0 && enabledValues.every((v) => selectedSet.has(v)),
);
// The header (count + Select all / Clear) shows when either action is offerable.
const showSelectAll = $derived(selectAllLabel !== undefined && enabledValues.length > 0 && !allSelected);
const showClear = $derived(clearLabel !== undefined && selectedCount > 0);
const showHead = $derived(showSelectAll || showClear);
const visibleOptions = $derived(
  showSearch && query.trim() !== ''
    ? options.filter((o) => fuzzyMatch(query.trim(), `${o.label} ${o.keywords ?? ''}`))
    : options,
);

/** bits-ui `Popover.Root`'s open/close lifecycle hook (dismiss-on-outside-click,
 * dismiss-on-Escape, and the trigger's own click-to-toggle all come from bits-ui
 * now — this only owns OUR side effects: reset the search query and hand focus
 * to the right row/field on open. */
function handleOpenChange(next: boolean): void {
  if (next) {
    query = '';
  }
}

function close(): void {
  open = false;
  triggerEl?.focus();
}

/** Toggle membership; the list STAYS open so several can be picked in a row. */
function toggle(option: MultiSelectOption): void {
  if (option.disabled) return;
  const next = selectedSet.has(option.value)
    ? values.filter((v) => v !== option.value)
    : [...values, option.value];
  onchange(next);
}

/** Add every enabled option to the selection (keeping any already-selected values
 * that aren't in the current option set), ignoring the active search. */
function selectAll(): void {
  onchange([...new Set([...values, ...enabledValues])]);
}

function clear(): void {
  onchange([]);
}

function optionEls(): HTMLButtonElement[] {
  const root = contentEl ?? rootEl;
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLButtonElement>('[role="option"]'));
}

/** Focus the first ENABLED row at or after `start`, stepping by `step` with
 * wrap-around. Native-`disabled` rows can't take focus, so the roving model must
 * skip them or it stalls at a disabled boundary (MS-04). */
function focusEnabledFrom(start: number, step: number): void {
  const els = optionEls();
  const n = els.length;
  if (n === 0) return;
  for (let i = 0; i < n; i++) {
    const idx = (((start + i * step) % n) + n) % n;
    const el = els[idx];
    if (el && !el.disabled) {
      el.focus();
      return;
    }
  }
}

/** Dropdown open: focus the first selected row (or first enabled row). When the
 * search box is shown it auto-focuses itself, so leave focus to it. */
async function focusOnOpen(): Promise<void> {
  if (showSearch) return;
  await tick();
  const first = Math.max(
    0,
    options.findIndex((o) => selectedSet.has(o.value)),
  );
  focusEnabledFrom(first, 1);
}

/** Closed dropdown trigger focused: the arrow keys open the list (bits-ui's
 * Trigger handles click-to-toggle and Enter/Space itself; this adds the
 * arrow-key affordance on top). Inline mode has no trigger, so unused there. */
function onTriggerKeydown(event: KeyboardEvent): void {
  if (open) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    open = true;
  }
}

/** Roving keyboard model over the option rows — dropdown-open content AND the
 * always-open inline panel both use this. Enter/Space toggle the focused row via
 * its native button click (list stays open), so they aren't intercepted here.
 * When focus is in the search field, `idx` is -1, so ArrowDown → first row.
 * bits-ui `Popover` also dismisses on Escape/outside-click by itself; Escape is
 * still handled explicitly here too so focus reliably returns to the trigger
 * (`close()`) rather than depending on bits-ui's own restore-focus behavior. Tab
 * explicitly closes as well (matching a plain field, not a focus-trapped dialog:
 * `trapFocus={false}` on `Popover.Content` lets Tab leave naturally; this just
 * also collapses the popover as it does). */
function onListKeydown(event: KeyboardEvent): void {
  const els = optionEls();
  const idx = els.indexOf(document.activeElement as HTMLButtonElement);
  if (event.key === 'Escape') {
    if (mode === 'dropdown') {
      event.preventDefault();
      close();
    }
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    focusEnabledFrom(idx + 1, 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    focusEnabledFrom(idx - 1, -1);
  } else if (event.key === 'Home' && idx >= 0) {
    event.preventDefault();
    focusEnabledFrom(0, 1);
  } else if (event.key === 'End' && idx >= 0) {
    event.preventDefault();
    focusEnabledFrom(els.length - 1, -1);
  } else if (event.key === 'Tab' && mode === 'dropdown') {
    open = false;
  }
}
</script>

<!--
  A multi-select sibling of `Select`: the same recessed trigger field and frosted
  `elevated` popover, but the open list is a multi-selectable listbox whose rows are
  persistent toggles (a checkbox square that fills with the active Space accent +
  check). `dropdown` mode shows a trigger + count pill + popover; `inline` mode renders
  the list always-open (no trigger). A `SearchField` filters long lists past the
  threshold, and an optional `leading` snippet customises each row (e.g. an AccountChip).
-->
{#snippet panel()}
  {#if showSearch}
    <div class="search">
      <SearchField
        mode="input"
        value={query}
        oninput={(v) => (query = v)}
        ariaLabel={searchPlaceholder ?? ariaLabel}
        autofocus={mode === 'dropdown'}
        testid="multi-select-search"
        {...searchPlaceholder !== undefined ? { placeholder: searchPlaceholder } : {}}
      />
    </div>
  {/if}
  {#if showHead}
    <div class="head">
      <span class="head-count">{selectedCount}</span>
      {#if showSelectAll}
        <button type="button" class="head-action" data-testid="multi-select-all" onclick={selectAll}>
          {selectAllLabel}
        </button>
      {/if}
      {#if showClear}
        <button type="button" class="head-action" data-testid="multi-select-clear" onclick={clear}>
          {clearLabel}
        </button>
      {/if}
    </div>
  {/if}
  <ul
    class="list"
    role="listbox"
    aria-multiselectable="true"
    aria-label={ariaLabel}
    tabindex={-1}
    use:scrollFade
  >
    {#each visibleOptions as option (option.value)}
      {@const checked = selectedSet.has(option.value)}
      <li>
        <button
          type="button"
          role="option"
          class="option"
          class:selected={checked}
          aria-selected={checked}
          aria-label={option.label}
          disabled={option.disabled}
          data-testid="multi-select-option"
          data-value={option.value}
          onclick={() => toggle(option)}
        >
          <span class="box" class:checked aria-hidden="true">
            {#if checked}
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            {/if}
          </span>
          {#if leading}
            <!-- A leading snippet (e.g. an AccountChip) carries the row's whole
                 visible identity, so the plain label span is suppressed to avoid
                 a duplicate name; `option.label` still drives search + the option's
                 accessible name (the button's `aria-label`). -->
            <span class="lead">{@render leading(option)}</span>
          {:else}
            <span class="opt-label">{option.label}</span>
          {/if}
        </button>
      </li>
    {/each}
  </ul>
{/snippet}

<div
  class="multiselect"
  class:inline={mode === 'inline'}
  class:chip-variant={variant === 'chip'}
  bind:this={rootEl}
  data-testid={mode === 'inline' ? testid : undefined}
>
  {#if mode === 'dropdown'}
    <Popover.Root bind:open onOpenChange={handleOpenChange}>
      <Popover.Trigger>
        {#snippet child({ props })}
          <button
            {...props}
            bind:this={triggerEl}
            type="button"
            class="trigger"
            class:chip={variant === 'chip'}
            class:open
            class:active={selectedCount > 0}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={ariaLabel !== undefined ? `${ariaLabel}: ${label}` : label}
            data-testid={testid}
            onkeydown={onTriggerKeydown}
          >
            <!-- The trigger's accessible name folds the field name AND the visible
                 selection summary so the collapsed value reaches AT (a bare
                 `aria-label` would suppress the summary — MS-03). -->
            <span class="value">{label}</span>
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
        {/snippet}
      </Popover.Trigger>

      <!-- Portaled to `document.body` (bits-ui, mirrors Menu.svelte/BottomSheet.svelte)
           so the popover escapes an owning feature container's `overflow: hidden`
           (e.g. a rounded card clipped to its own bounds) instead of being clipped
           whenever that container is shorter than the popover — see
           fix-lens-scope-filter-clear-semantics, where a lens-overview entity card
           can legitimately render with zero rows and a still-open scope picker. -->
      <Popover.Portal>
        <Popover.Content
          bind:ref={contentEl}
          class="ms-popover"
          side="bottom"
          align="start"
          sideOffset={6}
          trapFocus={false}
          onkeydown={onListKeydown}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            void focusOnOpen();
          }}
        >
          <Surface variant="elevated" radius="md">
            {@render panel()}
          </Surface>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  {:else}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="inline-panel" onkeydown={onListKeydown}>
      {@render panel()}
    </div>
  {/if}
</div>

<style>
  .multiselect {
    position: relative;
    display: flex;
    width: 100%;
  }
  /* Chip variant sizes to its trigger (a pill) rather than filling the row, so it
     sits inline in a compact filter toolbar. */
  .multiselect.chip-variant {
    width: auto;
  }
  .multiselect.inline {
    display: block;
  }

  /* Closed trigger mirrors Select/TextInput: a recessed filled field with a crisp
   * idle border that glides into the accent halo on focus/open. */
  .trigger {
    appearance: none;
    width: 100%;
    box-sizing: border-box;
    height: var(--control-h-md);
    padding: 0 var(--space-3);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    border: 1px solid var(--border-field);
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
  /* Chip trigger: a pill matching the filter chips (Chip / the Unread toggle) so a
     compact filter toolbar reads as one family. Sizes to content; the active/open
     state fills like a selected chip. */
  .trigger.chip {
    width: auto;
    height: auto;
    padding: 4px 11px;
    gap: 6px;
    border-radius: var(--r-pill);
    border-color: var(--border-soft);
    background: transparent;
    color: var(--text-muted);
    font-size: var(--text-xs);
  }
  .trigger.chip.active,
  .trigger.chip.open {
    border-color: transparent;
    background: var(--surface-3);
    color: var(--text);
  }
  .trigger.chip .chevron {
    margin-left: 0;
  }
  .trigger:hover {
    border-color: var(--border-strong);
  }
  /* Any active selection tints the resting border toward the accent. */
  .trigger.active {
    border-color: oklch(from var(--accent) l c h / 0.4);
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

  /* `:global`, collision-safe name — `class="ms-popover"` is passed as a PROP
     into bits-ui's `Popover.Content`, which renders the actual DOM div itself
     (not a literal element in this template), so Svelte's scoped-CSS hash never
     reaches it and the selector must be global (mirrors `Menu.svelte`'s
     `:global(.lunma-menu)` for the same reason) — a global class needs a
     collision-safe name since it's no longer scoped to this component (plain
     `.popover` would otherwise leak into `Select.svelte`'s own, differently
     unrelated `.popover` class). Positioning (top/left/fixed-vs-portal
     placement) is bits-ui `Popover`'s own doing now (side="bottom" align="start"
     sideOffset={6} on `Popover.Content`, portaled to `document.body` — see the
     template comment). This class only styles the box itself. */
  :global(.ms-popover) {
    /* A definite, comfortable width — at least as wide as the trigger
       (`--bits-popover-anchor-width`, set by bits-ui from the trigger's measured
       width now that the popover isn't a same-containing-block sibling anymore),
       otherwise ~20rem (viewport-bounded). NOT content-sized: `.list` is a
       flex-column scroll container, which doesn't propagate its options' width up
       to a `max-content` ancestor, so the popover collapsed to the trigger width
       and names truncated to "RTP N…". A fixed width sidesteps that; long labels
       ellipsise (see `.opt-label`). */
    width: max(var(--bits-popover-anchor-width, 100%), min(20rem, 90vw));
    z-index: var(--z-dropdown);
    animation: ms-in var(--motion-fast) var(--ease-emphasised);
  }

  /* Inline panel: a bordered always-open container (no float / blur). */
  .inline-panel {
    box-sizing: border-box;
    border: 1px solid var(--border-soft);
    border-radius: var(--r-md);
    background: var(--bg);
    padding: var(--space-1);
  }

  /* Search box sits above the list, separated by a hairline. */
  .search {
    padding: var(--space-1) var(--space-1) var(--space-2);
    border-bottom: 1px solid var(--border-soft);
    margin-bottom: var(--space-1);
  }

  /* Sticky-feel header: live count + Select all / Clear actions, set apart by a
     hairline. */
  .head {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-2) var(--space-1);
    border-bottom: 1px solid var(--border-soft);
    margin-bottom: var(--space-1);
  }
  .head-count {
    flex: 1 1 auto;
    color: var(--text-muted);
    font: var(--weight-medium) var(--text-2xs) / 1 var(--font-sans);
    letter-spacing: 0.02em;
  }
  .head-action {
    appearance: none;
    border: 0;
    padding: 2px var(--space-2);
    border-radius: var(--r-sm);
    background: transparent;
    /* Select-all/Clear action text on a plain popover surface → `--accent-label`
       (the AA-tuned accent-on-surface token), not the `--accent` fill hue. */
    color: var(--accent-label);
    font: var(--weight-semibold) var(--text-xs) / 1 var(--font-sans);
    cursor: pointer;
    transition: background var(--motion-fast) var(--ease-standard);
  }
  .head-action:hover {
    background: var(--accent-soft);
  }
  .head-action:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
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
  .inline-panel .list {
    padding: 0;
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
    min-height: 36px;
    padding: var(--space-1) var(--space-2);
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
  .option.selected {
    background: var(--accent-soft);
    color: var(--text);
  }
  .option:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: -2px;
  }
  .option:disabled {
    color: var(--text-dim);
    cursor: default;
  }

  /* Checkbox square — the multi-toggle signature. An outlined box that fills with
   * the Space accent (+ a contrast check) when on, so selection reads as a real
   * toggle, not just a row tint. */
  .box {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: var(--r-xs, 5px);
    box-shadow: inset 0 0 0 1.5px var(--border-strong);
    /* The check is drawn on the solid `--accent` fill (`.box.checked`), so it uses
       `--accent-on` (theme-flipping ink-on-accent), not the frozen `--accent-text`. */
    color: var(--accent-on);
    transition:
      background var(--motion-fast) var(--ease-standard),
      box-shadow var(--motion-fast) var(--ease-standard);
  }
  .box.checked {
    background: var(--accent);
    box-shadow: inset 0 0 0 1.5px var(--accent);
  }
  /* A leading snippet stands in for the label (it carries the row identity), so it
   * grows to fill the row and ellipsises within. */
  .lead {
    flex: 1 1 auto;
    display: inline-flex;
    align-items: center;
    min-width: 0;
  }
  .opt-label {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @keyframes ms-in {
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
    :global(.ms-popover) {
      animation: none;
    }
    .chevron {
      transition: color var(--motion-base) var(--ease-standard);
    }
    .chevron.open {
      transform: none;
    }
    .box {
      transition: none;
    }
  }
</style>
