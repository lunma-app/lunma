<script lang="ts">
/**
 * Fresh-Space welcome (sidebar-firstrun-options-polish D3). One consolidated,
 * brand-voice invitation that replaces the favorites placeholder AND the pinned
 * empty-state row when a brand-new user has neither — so first run reads as one
 * warm block, not three stacked notices. It lives in the fixed favicon-grid region
 * (composed by `FaviconRow.svelte` in the placeholder's slot, so it never swipes
 * with the Space carousel) and keeps the placeholder's drag contract: `over`
 * brightens it as the favorites drop target while a pinned/temp tab is dragged in.
 *
 * Pure presentation — the host owns the showing condition (favicon row empty AND
 * the active Space has zero pinned bookmarks) and the drop handling. The ghost
 * tiles are feature-local CSS outline shapes (the placeholder's precedent), NOT
 * `FaviconTile` instances — no primitive API change.
 */
interface Props {
  /** Drag-over highlight: a pinned/temp tab is held over the favorites region, so
   * the welcome brightens to read as the "drop here to favorite" target. */
  over?: boolean | undefined;
}

const { over = false }: Props = $props();
</script>

<div class="welcome" class:over data-testid="sidebar-welcome">
  <!-- Ghost tiles — the favorite shape awaiting use (soft outline shapes, no dashed
       borders), the welcome's visual anchor. Decorative; the copy carries meaning. -->
  <div class="ghosts" aria-hidden="true">
    <span class="ghost"></span>
    <span class="ghost"></span>
    <span class="ghost"></span>
    <span class="ghost"></span>
  </div>
  <h2 class="headline">Make this Space yours.</h2>
  <p class="hint">
    Drag a tab up to favorite it, pin what should stay (Option+D), and everything
    else settles out on its own.
  </p>
</div>

<style>
  /* One calm block: ghost tiles, a serif headline, a short hint. No dashed borders
   * anywhere — the ghost-outline + tint treatment reads like the product's own
   * furniture awaiting use, not a utilitarian drop box. It never exceeds the height
   * of the two empty states it replaces. A drag-over brightens it (the favorites
   * drop target) over `--motion-fast`. */
  .welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-3);
    border-radius: var(--r-lg);
    text-align: center;
    transition: background var(--motion-fast) var(--ease-standard);
  }
  /* Drag-over: the whole block washes the soft Space colour, reading unmistakably
   * as "drop here to favorite" — the same wash the favicon grid's drop target uses. */
  .welcome.over {
    background: var(--space-c-soft);
  }

  .ghosts {
    display: flex;
    gap: var(--space-2);
  }
  /* A ghost is a soft rounded-square outline at the favorite-tile size — the shape
   * of a real `FaviconTile` plate, drawn quiet (a low-emphasis `--border-soft` rule
   * over a whisper of the Space wash). On drag-over the outlines firm up to the
   * Space colour, so the preview "lights up" with the rest of the block. */
  .ghost {
    width: var(--favicon-tile);
    height: var(--favicon-tile);
    border: 1.5px solid var(--border-soft);
    border-radius: var(--r-lg);
    background: var(--space-c-soft);
    opacity: 0.5;
    transition:
      border-color var(--motion-fast) var(--ease-standard),
      opacity var(--motion-fast) var(--ease-standard);
  }
  .welcome.over .ghost {
    border-color: var(--space-c);
    opacity: 1;
  }

  /* The headline carries identity (serif), the hint carries information (sans) —
   * the established pairing rule. */
  .headline {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: var(--weight-regular);
    line-height: 1.1;
    color: var(--text);
  }
  .hint {
    margin: 0;
    max-width: 30ch;
    font: var(--weight-regular) var(--text-sm) / 1.45 var(--font-sans);
    color: var(--text-muted);
  }

  /* Reduced motion: the drag-over recolour is instant; identical end state. */
  @media (prefers-reduced-motion: reduce) {
    .welcome,
    .ghost {
      transition: none;
    }
  }
</style>
