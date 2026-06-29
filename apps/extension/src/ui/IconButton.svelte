<script lang="ts">
import Icon from './Icon.svelte';

/**
 * Icon-only square control — the `--icon-btn` box, ghost tint, the standard
 * focus ring, and the `--press-scale` squish on `:active`. Extracted from
 * `SearchTrigger`'s former inline `.settings` button (sidebar-favicon-row D1)
 * and shipped as a primitive so the relocated Settings + launcher affordances
 * compose it instead of re-rolling the same square inline. Tokens only — no raw
 * font sizes, radii, focus rings, or press transforms (component-library policy).
 */
interface Props {
  /** Any lucide icon name — rendered via the generic `Icon` primitive, which
   * accepts the full lucide set, NOT just the curated `IconName` catalogue. */
  icon: string;
  /** Activation handler (skipped while `disabled`). */
  onclick: () => void;
  /** Native tooltip text (e.g. `"Open launcher (⌥L)"`). Doubles as the accessible
   * name when `ariaLabel` is omitted. */
  title?: string | undefined;
  /** Accessible name for the button; the rendered icon stays decorative. Falls
   * back to `title` when omitted. This icon-only control needs one of the two —
   * a dev-mode warning fires when both are missing. */
  ariaLabel?: string | undefined;
  disabled?: boolean | undefined;
  /** Tint treatment. `ghost` is the quiet default (the only variant today; the
   * prop + `data-variant` hook keep room for future fills without re-rolling). */
  variant?: 'ghost' | undefined;
  /** Icon size in px. */
  size?: number | undefined;
  type?: 'button' | 'submit' | undefined;
  /** `data-testid` passthrough so call sites can target the control. */
  testid?: string | undefined;
}

const {
  icon,
  onclick,
  title,
  ariaLabel,
  disabled = false,
  variant = 'ghost',
  size = 16,
  type = 'button',
  testid,
}: Props = $props();

function handleClick(): void {
  if (disabled) return;
  onclick();
}

// The icon is decorative (no `label` passed to `Icon`), so the button's only
// accessible name is `ariaLabel`, falling back to the native `title`. Warn in dev
// when a consumer ships this icon-only control with neither (ICONBUTTON-NEW1).
const accessibleName = $derived(ariaLabel ?? title);
$effect(() => {
  if (import.meta.env.DEV && accessibleName === undefined) {
    console.warn(
      '[lunma] IconButton: icon-only control rendered with no accessible name — pass `ariaLabel` (or at least `title`).',
    );
  }
});
</script>

<button
  {type}
  {title}
  {disabled}
  class="icon-btn"
  data-variant={variant}
  data-testid={testid}
  aria-label={accessibleName}
  onclick={handleClick}
>
  <Icon name={icon} {size} />
</button>

<style>
  .icon-btn {
    flex: 0 0 auto;
    width: var(--icon-btn);
    height: var(--icon-btn);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: transparent;
    color: var(--text-muted);
    border: 1px solid transparent;
    border-radius: var(--r-md);
    cursor: pointer;
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard),
      transform var(--motion-fast) var(--ease-standard);
  }

  .icon-btn[data-variant='ghost']:hover:not(:disabled) {
    background: var(--hover);
    color: var(--text);
  }

  .icon-btn:active:not(:disabled) {
    transform: scale(var(--press-scale));
  }

  .icon-btn:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }

  .icon-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Reduced motion keeps the colour cross-fade but drops the press-scale
   * transition — the `:active` squish still applies, just without easing. */
  @media (prefers-reduced-motion: reduce) {
    .icon-btn {
      transition:
        background var(--motion-fast) var(--ease-standard),
        color var(--motion-fast) var(--ease-standard);
    }
  }
</style>
