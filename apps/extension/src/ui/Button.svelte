<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | undefined;
  /** Control density. `md` (default) is the standard control — the 36px button
   * the design system specs (`--control-h-md`); `sm` is a compact 28px variant
   * (`--control-h-sm`) for tertiary / inline affordances (smaller `--text-xs`). */
  size?: 'sm' | 'md' | undefined;
  disabled?: boolean | undefined;
  type?: 'button' | 'submit' | undefined;
  onclick: () => void;
  title?: string | undefined;
  /** `data-testid` passthrough for the button element. */
  testid?: string | undefined;
  children: Snippet;
}

const {
  variant = 'secondary',
  size = 'md',
  disabled = false,
  type = 'button',
  onclick,
  title,
  testid,
  children,
}: Props = $props();

function handleClick(): void {
  if (disabled) return;
  onclick();
}
</script>

<button
  {type}
  {title}
  class="btn"
  data-variant={variant}
  data-size={size}
  data-testid={testid}
  {disabled}
  onclick={handleClick}
>
  {@render children()}
</button>

<style>
  .btn {
    appearance: none;
    border: 0;
    margin: 0;
    border-radius: var(--r-md);
    padding: 0 var(--space-4);
    height: var(--control-h-md);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    font: var(--weight-medium) var(--text-base) / 1 var(--font-sans);
    cursor: pointer;
    /* Smooth hover/press/disabled transitions (150–250ms motion policy) — the
       base control had none, so md buttons snapped on hover. */
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard),
      border-color var(--motion-fast) var(--ease-standard),
      transform var(--motion-fast) var(--ease-standard);
  }

  /* Compact density for tertiary / inline affordances. */
  .btn[data-size='sm'] {
    height: var(--control-h-sm);
    padding: 0 var(--space-3);
    font: var(--weight-medium) var(--text-xs) / 1 var(--font-sans);
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard),
      border-color var(--motion-fast) var(--ease-standard),
      transform var(--motion-fast) var(--ease-standard);
  }

  .btn:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }

  /* Commit / CTA buttons take the fixed cool `--primary` (the redesign reserves it
     for commits), distinct from the per-Space `--accent` identity hue. */
  .btn[data-variant='primary'] {
    background: var(--primary);
    color: var(--primary-on);
    border: 1px solid transparent;
    /* The CTA reads as the dominant, raised action (comp: semibold + a top
       highlight and short drop). */
    font-weight: var(--weight-semibold);
    box-shadow: var(--shadow-raise);
  }
  .btn[data-variant='primary']:hover:not(:disabled) {
    background: var(--primary);
    filter: brightness(1.06);
  }
  .btn[data-variant='primary']:active:not(:disabled) {
    transform: scale(var(--press-scale));
  }

  .btn[data-variant='secondary'] {
    background: transparent;
    color: var(--text-2);
    /* Idle boundary of a standalone control: `--border-strong` clears the 3:1
       non-text minimum (WCAG 1.4.11), not the decorative `--border`. */
    border: 1px solid var(--border-strong);
  }
  .btn[data-variant='secondary']:hover:not(:disabled) {
    background: var(--surface-2);
  }
  .btn[data-variant='secondary']:active:not(:disabled) {
    background: var(--press);
    transform: scale(var(--press-scale));
  }

  .btn[data-variant='ghost'] {
    /* Ghost is tertiary — the comp gives it tighter padding than primary/secondary. */
    padding: 0 var(--space-3);
    background: transparent;
    color: var(--text-muted);
    border: 1px solid transparent;
  }
  .btn[data-variant='ghost']:hover:not(:disabled) {
    background: var(--hover);
    color: var(--text);
  }
  .btn[data-variant='ghost']:active:not(:disabled) {
    background: var(--press);
    transform: scale(var(--press-scale));
  }

  /* Comp disabled palette (explicit muted fill, not a blanket opacity). Placed
     after the variant rules so it wins on equal specificity for every variant. */
  .btn:disabled {
    background: var(--disabled-bg);
    color: var(--text-faint);
    border-color: transparent;
    box-shadow: none;
    cursor: not-allowed;
  }
  .btn:disabled:hover {
    transform: none;
  }
</style>
