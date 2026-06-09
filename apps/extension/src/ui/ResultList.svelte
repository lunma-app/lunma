<script module lang="ts">
/** The keyboard model handle a surface forwards its input's keydown into. */
export interface ResultListApi {
  handleKeydown: (e: KeyboardEvent) => void;
}
</script>

<script lang="ts">
import { onMount } from 'svelte';
import type { LauncherResult } from '../shared/launcher-contract';
import ResultRow from './ResultRow.svelte';

interface Props {
  /** The scored, ordered results to render. */
  results: LauncherResult[];
  /** Act on a result (Enter or click) — the surface maps it to a bus command. */
  onact?: ((result: LauncherResult, index: number) => void) | undefined;
  /** Escape pressed — the surface closes (overlay) or clears to idle (new-tab). */
  onescape?: (() => void) | undefined;
  /** Resolve a favicon URL per result (e.g. `faviconFor`). Globe fallback when absent. */
  faviconSrc?: ((result: LauncherResult) => string | undefined) | undefined;
  /** Hands the surface this list's keyboard model so a focused `<input>` can
   * forward its keydown without stealing focus (the new-tab page). */
  onready?: ((api: ResultListApi) => void) | undefined;
}

const { results, onact, onescape, faviconSrc, onready }: Props = $props();

onMount(() => {
  onready?.({ handleKeydown });
});

// Roving selection. Resets to the top whenever the result set changes (a new
// query starts fresh at the best match).
let selected = $state(0);
$effect(() => {
  results;
  selected = 0;
});

function move(delta: number): void {
  const n = results.length;
  if (n === 0) return;
  selected = (selected + delta + n) % n; // wrap at both ends
}

/**
 * The shared keyboard model (`↑↓` wrap, `Enter` acts, `Escape` closes/clears).
 * Exported so a surface that owns the focused `<input>` (the new-tab page) can
 * forward its keydown here without stealing focus; it also runs when the list
 * root itself receives the event.
 */
export function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    move(1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    move(-1);
  } else if (e.key === 'Enter') {
    const result = results[selected];
    if (result) {
      e.preventDefault();
      onact?.(result, selected);
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    onescape?.();
  }
}
</script>

<div
  class="result-list"
  role="listbox"
  tabindex="-1"
  data-testid="result-list"
  onkeydown={handleKeydown}
>
  {#each results as result, i (result.id)}
    <ResultRow
      title={result.title}
      url={result.url}
      source={result.source}
      faviconSrc={faviconSrc?.(result)}
      selected={i === selected}
      onhover={() => {
        selected = i;
      }}
      onclick={() => onact?.(result, i)}
    />
  {/each}
</div>

<style>
  .result-list {
    display: flex;
    flex-direction: column;
    gap: var(--row-gap);
    padding: var(--list-pad);
    outline: none;
  }
</style>
