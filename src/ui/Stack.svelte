<script lang="ts">
import type { Snippet } from 'svelte';

interface Props {
  direction?: 'row' | 'column' | undefined;
  gap?: '1' | '2' | '3' | '4' | undefined;
  align?: 'start' | 'center' | 'end' | undefined;
  justify?: 'start' | 'center' | 'end' | 'between' | undefined;
  children: Snippet;
}

const {
  direction = 'column',
  gap = '2',
  align = 'start',
  justify = 'start',
  children,
}: Props = $props();

const gapToken = $derived(`var(--space-${gap})`);
const alignValue = $derived(
  align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center',
);
const justifyValue = $derived(
  justify === 'start'
    ? 'flex-start'
    : justify === 'end'
      ? 'flex-end'
      : justify === 'between'
        ? 'space-between'
        : 'center',
);
</script>

<div
  class="stack"
  style:flex-direction={direction}
  style:gap={gapToken}
  style:align-items={alignValue}
  style:justify-content={justifyValue}
  data-direction={direction}
  data-gap={gap}
  data-align={align}
  data-justify={justify}
>
  {@render children()}
</div>

<style>
  .stack {
    display: flex;
  }
</style>
