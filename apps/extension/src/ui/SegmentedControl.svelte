<script lang="ts">
interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface Props {
  /** Radio-group name — must be unique per control instance on the page. */
  name: string;
  options: Option[];
  /** Currently-selected value. */
  value: string;
  /** Fired with the newly-selected value. */
  onchange: (value: string) => void;
  /** Accessible name for the radio group, applied to the `<fieldset>`. Pass it
   * whenever the control's visible label sits OUTSIDE the control (e.g. a settings
   * row's separate label, where the per-radio labels are only `Off`/`On`), so the
   * group is not anonymous to assistive tech — mirrors `Select`/`TextInput`. */
  ariaLabel?: string | undefined;
  /** Span the full width with equal-width segments, instead of the default
   * content-width inline control (useful in a narrow column like the sidebar). */
  block?: boolean;
}

const { name, options, value, onchange, ariaLabel, block = false }: Props = $props();

// The sliding pill is measured from the DOM (not computed from label widths)
// so it stays flush with options of any length/locale.
let trackEl = $state<HTMLElement>();
const labelEls: Record<string, HTMLElement> = {};

let pillLeft = $state(0);
let pillWidth = $state(0);
let pillReady = $state(false);

function measure(): void {
  const track = trackEl;
  const active = labelEls[value];
  if (!track || !active) {
    pillReady = false;
    return;
  }
  const t = track.getBoundingClientRect();
  const a = active.getBoundingClientRect();
  pillLeft = a.left - t.left;
  pillWidth = a.width;
  pillReady = true;
}

// Re-measure whenever the selection (or the option set) changes.
$effect(() => {
  value;
  options;
  measure();
});

function select(next: string): void {
  if (next !== value) onchange(next);
}
</script>

<fieldset class="segmented" class:block aria-label={ariaLabel} bind:this={trackEl}>
  {#if pillReady}
    <span
      class="pill"
      aria-hidden="true"
      style:--pill-x={`${pillLeft}px`}
      style:--pill-w={`${pillWidth}px`}
    ></span>
  {/if}
  {#each options as option (option.value)}
    <label
      class="option"
      class:selected={option.value === value}
      class:disabled={option.disabled}
      bind:this={labelEls[option.value]}
    >
      <input
        type="radio"
        {name}
        value={option.value}
        checked={option.value === value}
        disabled={option.disabled}
        onchange={() => select(option.value)}
      />
      <span class="option-label">{option.label}</span>
    </label>
  {/each}
</fieldset>

<style>
  .segmented {
    position: relative;
    display: inline-flex;
    margin: 0;
    padding: 3px;
    border: 0;
    border-radius: var(--r-lg);
    background: var(--surface-2);
  }

  /* Full-width variant: equal-width segments spanning the container. */
  .segmented.block {
    display: flex;
    width: 100%;
  }
  .segmented.block .option {
    flex: 1 1 0;
  }

  /* The sliding selection pill. Position + width are written from the measured
   * active option; it glides on the same emphasised curve as the sidebar's
   * active-tab background. */
  .pill {
    position: absolute;
    top: 3px;
    bottom: 3px;
    left: 0;
    width: var(--pill-w);
    transform: translateX(var(--pill-x));
    border-radius: var(--r-md);
    background: var(--surface-3);
    box-shadow: var(--shadow-sm);
    transition:
      transform var(--motion-base) var(--ease-emphasised),
      width var(--motion-base) var(--ease-emphasised);
    pointer-events: none;
  }

  .option {
    position: relative;
    z-index: var(--z-raised);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 14px;
    border-radius: var(--r-md);
    cursor: pointer;
    user-select: none;
  }
  .option.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Native radio drives semantics + keyboard nav; it's visually hidden but
   * still focusable, so focus styling targets it. */
  .option input {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: 0;
    padding: 0;
    opacity: 0;
    pointer-events: none;
  }

  .option-label {
    font: var(--weight-medium) var(--text-base) / 1 var(--font-sans);
    color: var(--text-muted);
    transition: color var(--motion-base) var(--ease-standard);
  }
  .option.selected .option-label {
    color: var(--text);
    font-weight: var(--weight-semibold);
  }
  .option:not(.selected):not(.disabled):hover .option-label {
    color: var(--text);
  }

  .option:has(input:focus-visible) {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
</style>
