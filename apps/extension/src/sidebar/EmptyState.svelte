<script lang="ts">
import type { IconName } from '../shared/icon-names';
import Icon from '../ui/Icon.svelte';

interface Props {
  title: string;
  subtitle: string;
  /** Optional glyph rendered in a soft Space-tinted plate beside the title — the
   * visual anchor that turns the bare text into a recognisable drop zone. */
  icon?: IconName | undefined;
  /** Drag-over highlight: a draggable is held over this zone, so the card lifts to
   * an active "drop here" treatment (solid Space-hue frame, filled glyph plate). */
  over?: boolean | undefined;
  /** Test id on the card root (the element that also carries the `over` class), so
   * a composing surface can address its own empty state (e.g. `favicon-empty`). */
  testid?: string | undefined;
}

const { title, subtitle, icon, over = false, testid = 'empty-state' }: Props = $props();
</script>

<div class="empty" class:over data-testid={testid}>
  {#if icon}
    <span class="glyph" class:over aria-hidden="true">
      <Icon name={icon} size={14} />
    </span>
  {/if}
  <div class="text">
    <div class="title">{title}</div>
    <div class="subtitle">{subtitle}</div>
  </div>
</div>

<style>
  /* The redesign's drop-zone card (comp §3 / §5a): a DASHED `--border` rule on a
   * `--r-lg` rounded card — the universal "drop a thing here" affordance, reading as
   * an empty slot waiting to be filled rather than a stray line of text. A glyph plate
   * washed in the soft Space colour sits BESIDE the title + hint, so the card stays a
   * compact band and dropping the first item barely reflows. Calm at rest; a tab
   * dragged over it (`over`) lifts the whole card to a solid Space-hue frame on a
   * filled wash with a popped, filled plate. */
  .empty {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border: 1.5px dashed var(--border);
    border-radius: var(--r-lg);
    color: var(--text-dim);
    /* Tokenised from the former `400 11.5px`: `--weight-regular` + `--text-xs`
     * (11px) on the type scale. */
    font: var(--weight-regular) var(--text-xs) / 1.4 var(--font-sans);
    transition:
      border-color var(--motion-base) var(--ease-standard),
      background var(--motion-base) var(--ease-standard);
  }

  /* The icon plate — a rounded square washed in the soft Space colour with the
   * Space-hue glyph (half a `--favicon-tile`, so the compact row stays one band tall),
   * so the empty state speaks the same plated-tile language as a real favorite/pinned
   * tile. */
  .glyph {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--favicon-tile) / 2);
    height: calc(var(--favicon-tile) / 2);
    border-radius: var(--r-md);
    background: var(--space-c-soft);
    color: var(--space-c);
    transition:
      transform var(--motion-base) var(--ease-emphasised),
      background var(--motion-base) var(--ease-standard),
      color var(--motion-base) var(--ease-standard);
  }

  /* Title + hint stack, left-aligned beside the plate. */
  .text {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 1px;
  }

  .title {
    color: var(--text-muted);
    font-weight: var(--weight-medium);
  }

  /* At `vivid` the empty-pinned title tints toward the active Space's colour so a
   * fresh Space reads on-brand and quiet, not as a dead grey box. The lightness
   * floor (0.72) over the dark vivid substrate keeps it comfortably ≥ WCAG AA
   * (mirrors the SectionHeader label lift); a `gray` Space (chroma 0) stays a
   * true neutral. The calmer tints leave the title neutral. */
  :global(.sidebar[data-tint='vivid']) .title {
    color: oklch(from var(--space-c) max(l, 0.72) c h);
  }

  .subtitle {
    /* Reserve two lines for the hint regardless of copy length, so a short hint
     * (the favicon row's "Drag a tab up here to favorite it." / "Drop to favorite")
     * stands as tall as the pinned row's two-line "…or press Option+D, to pin it." —
     * the two drop zones read at one height — and the card never reflows when the
     * favicon hint swaps on drag-over. `2.8em` = 2 × the `1.4` line-height. */
    min-height: 2.8em;
    max-width: 32ch;
    color: var(--text-faint);
  }

  /* Drag-over: a tab is held over the zone — the dashed frame snaps to a solid
   * Space-line rule (the comp's `--space-line`, mapped to the alpha'd `--space-c-dim`)
   * on a soft `--space-c-soft` wash, the glyph plate fills with the true Space colour
   * and pops, and the title lifts to full strength. Reads unmistakably as "drop
   * here", matching the favicon-row strip's whole-grid drop wash and the active-row
   * Space-line ring used across the tree. */
  .empty.over {
    border-style: solid;
    border-color: var(--space-c-dim);
    background: var(--space-c-soft);
  }
  .glyph.over {
    background: var(--space-c);
    color: var(--bg);
    transform: translateY(-2px) scale(1.04);
  }
  .empty.over .title {
    color: var(--text);
  }

  /* Reduced motion — the over-state still recolours (instant), but the glyph lift
   * is dropped to its end position rather than transitioning. */
  @media (prefers-reduced-motion: reduce) {
    .glyph {
      transition: none;
    }
    .glyph.over {
      transform: none;
    }
  }
</style>
