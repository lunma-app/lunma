<script lang="ts">
// The sidebar's Space identity header, mirroring the extension's real
// SectionHeader (apps/extension/src/sidebar/SectionHeader.svelte): a quiet sans
// ROW — a hue-tinted glyph at the favicon column + the Space name at title
// weight/size, sentence-case — NOT a display-serif headline with a glow or a
// filled colour tile. Reads the Space colour from the surrounding
// `.lunma-space-scope` (@lunma/tokens); the hue tint uses the real component's
// `max(l, 0.72)` lightness floor so the tinted text stays WCAG-AA over the wash.
interface Props {
  icon: string;
  name: string;
}

let { icon, name }: Props = $props();
</script>

<div class="space-head">
  <span class="glyph" aria-hidden="true">{icon}</span>
  <span class="label">{name}</span>
</div>

<style>
  /* A row mirroring TabRow / the real SectionHeader: full row height, a leading
     glyph at the favicon column, the name at the title column. */
  .space-head {
    display: flex;
    align-items: center;
    height: var(--row-h);
    padding: 0 var(--space-3);
    border-radius: var(--r-md);
    /* Per-Space hue tint with the real component's max(l, 0.72) lightness floor,
       so the tinted header text clears WCAG-AA over the Space-coloured wash. */
    color: oklch(from var(--space-c) max(l, 0.72) c h / 0.95);
  }

  .glyph {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--favicon-size);
    height: var(--favicon-size);
    margin-right: var(--space-2);
    font-size: var(--text-base);
    opacity: 0.9;
  }

  .label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    /* Title weight/size of a row — sentence case, not a serif headline. */
    font: var(--weight-medium) var(--text-base) / 1 var(--font-sans);
  }
</style>
