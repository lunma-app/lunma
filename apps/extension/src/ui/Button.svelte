<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | undefined;
  disabled?: boolean | undefined;
  type?: 'button' | 'submit' | undefined;
  onclick: () => void;
  title?: string | undefined;
  children: Snippet;
}

const {
  variant = 'secondary',
  disabled = false,
  type = 'button',
  onclick,
  title,
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
    padding: 0 var(--space-3);
    height: var(--control-h-sm);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    font: var(--weight-medium) var(--text-base) / 1 var(--font-sans);
    cursor: pointer;
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

  .btn[data-variant='primary'] {
    background: var(--accent);
    color: var(--accent-on);
    border: 1px solid transparent;
  }
  .btn[data-variant='primary']:hover:not(:disabled) {
    background: var(--accent);
    filter: brightness(1.06);
  }
  .btn[data-variant='primary']:active:not(:disabled) {
    transform: scale(var(--press-scale));
  }

  .btn[data-variant='secondary'] {
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border-soft);
  }
  .btn[data-variant='secondary']:hover:not(:disabled) {
    background: var(--hover);
  }
  .btn[data-variant='secondary']:active:not(:disabled) {
    background: var(--press);
    transform: scale(var(--press-scale));
  }

  .btn[data-variant='ghost'] {
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

  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn:disabled:hover {
    transform: none;
  }
</style>
