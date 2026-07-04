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

// The sliding pill is measured from the DOM (not computed from label widths) so
// it stays flush with options of any length/locale. We measure the active
// option's FULL box (x/y/w/h) relative to the track's padding box — the same
// coordinate space `position:absolute; top:0; left:0` uses — correcting for the
// track border via clientLeft/clientTop, so the pill exactly overlays the option
// (no off-by-one from the border, no padding/inset mismatch).
let trackEl = $state<HTMLElement>();
const labelEls: Record<string, HTMLElement> = {};

let pillLeft = $state(0);
let pillTop = $state(0);
let pillWidth = $state(0);
let pillHeight = $state(0);
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
  pillLeft = a.left - t.left - track.clientLeft;
  pillTop = a.top - t.top - track.clientTop;
  pillWidth = a.width;
  pillHeight = a.height;
  pillReady = true;
}

// Re-measure whenever the selection (or the option set) changes, AND whenever the
// track resizes (the sidebar panel is resizable, so equal-width block segments
// change size — the pill must track them).
$effect(() => {
  value;
  options;
  measure();
});

$effect(() => {
  const track = trackEl;
  if (!track || typeof ResizeObserver === 'undefined') return;
  const ro = new ResizeObserver(() => measure());
  ro.observe(track);
  return () => ro.disconnect();
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
      style:--pill-y={`${pillTop}px`}
      style:--pill-w={`${pillWidth}px`}
      style:--pill-h={`${pillHeight}px`}
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
  /* Comp segmented track: recessed --bg fill with a hairline border, 9px radius
     (≈ comp 8px), tight 2px inset. The track is a <fieldset>, whose special box
     rendering makes flex `align-items: stretch` + `min-height` unreliable for
     sizing the segments — so the height comes from the OPTION's own padding
     instead (below), which lands the track at ~36px to match the buttons/inputs
     around it (a bare 24px track read too thin). */
  .segmented {
    position: relative;
    display: inline-flex;
    margin: 0;
    padding: 2px;
    /* Track edge of a standalone control: `--border-strong` clears the 3:1
       non-text minimum (WCAG 1.4.11), not the decorative `--border-soft`. */
    border: 1px solid var(--border-strong);
    border-radius: var(--r-md);
    background: var(--bg);
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
  /* Exactly overlays the active option's box (x/y/w/h all measured), so the
     active "button" fills its segment and the label stays centred in it. */
  .pill {
    position: absolute;
    top: 0;
    left: 0;
    width: var(--pill-w);
    height: var(--pill-h);
    transform: translate(var(--pill-x), var(--pill-y));
    border-radius: var(--r-sm);
    background: var(--surface-3);
    box-shadow: var(--shadow-sm);
    transition:
      transform var(--motion-base) var(--ease-emphasised),
      width var(--motion-base) var(--ease-emphasised),
      height var(--motion-base) var(--ease-emphasised);
    pointer-events: none;
  }

  .option {
    position: relative;
    z-index: var(--z-raised);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* 9px block padding + the 12px label ⇒ a 30px segment; with the track's 2px
       inset + 1px border that's a 36px control, matching the buttons/inputs. */
    padding: 9px 14px;
    border-radius: var(--r-sm);
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
    /* Comp: 12px / 600 for both idle and active (only colour changes on select). */
    font: var(--weight-semibold) var(--text-sm) / 1 var(--font-sans);
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
