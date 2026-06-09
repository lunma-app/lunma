<script lang="ts">
interface Props {
  title: string;
  subtitle: string;
}

const { title, subtitle }: Props = $props();
</script>

<div class="empty" data-testid="empty-state">
  <div class="title">{title}</div>
  <div class="subtitle">{subtitle}</div>
</div>

<style>
  .empty {
    padding: var(--space-2) var(--space-3) var(--space-4);
    color: var(--text-dim);
    /* Tokenised from the former `400 11.5px`: `--weight-regular` + `--text-xs`
     * (11px) on the type scale. */
    font: var(--weight-regular) var(--text-xs) / 1.5 var(--font-sans);
  }

  .title {
    color: var(--text-muted);
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
    color: var(--text-faint);
  }
</style>
