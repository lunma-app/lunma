<script lang="ts">
// The sidebar's Space identity header — a Space-coloured icon tile + the Space
// name in the display serif, mirroring the extension's SectionHeader. Reads the
// Space colour family from the surrounding `.lunma-space-scope` (@lunma/tokens).
interface Props {
  icon: string;
  name: string;
}

let { icon, name }: Props = $props();
</script>

<header class="space-head">
  <span class="space-icon">{icon}</span>
  <span class="space-name">{name}</span>
</header>

<style>
  .space-head {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 2px 6px 0;
  }

  .space-icon {
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: var(--r-sm);
    background: var(--space-c);
    color: var(--space-on);
    font-size: 12px;
  }

  .space-name {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    color: var(--text);
    text-shadow: var(--glow-space);
  }
</style>
