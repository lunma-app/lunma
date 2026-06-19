<script lang="ts">
/**
 * The settings-row text column — a label plus an optional secondary description,
 * stacked. The trio the registry card and Backup & restore each re-rolled as
 * `.setting-text` / `.setting-label` / `.setting-desc`. Token-only.
 */
interface Props {
  /** The setting's label. */
  label: string;
  /** Optional secondary description beneath the label. */
  description?: string | undefined;
}

const { label, description }: Props = $props();
</script>

<div class="setting-text">
  <span class="setting-label">{label}</span>
  {#if description}
    <span class="setting-description">{description}</span>
  {/if}
</div>

<style>
  .setting-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .setting-label {
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    line-height: 1.2;
    color: var(--text);
  }
  .setting-description {
    font-size: var(--text-sm);
    font-weight: var(--weight-regular);
    line-height: 1.3;
    color: var(--text-dim);
  }
</style>
