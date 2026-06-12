<script lang="ts">
import type { FaviconSpec } from './apps';
import Favicon from './Favicon.svelte';

// The launcher overlay: a query row + result rows, each with a source badge
// (open tab / bookmark / history) like the extension's launcher. Glass and
// positioning are the caller's job, so it composes cleanly inside a panel.
export interface LauncherResult {
  title: string;
  fav: FaviconSpec;
  kind: string;
  selected?: boolean;
}

interface Props {
  query?: string;
  placeholder?: string;
  caret?: boolean;
  results: LauncherResult[];
}

let { query, placeholder, caret = false, results }: Props = $props();
</script>

<div class="launcher">
  <div class="q">
    <span class="mark">⌕</span>
    {#if query}
      <span class="typed">{query}</span>{#if caret}<span class="caret"></span>{/if}
    {:else}
      <span class="ph">{placeholder}</span>
    {/if}
    <span class="shortcut">Alt+L</span>
  </div>
  {#each results as r (r.title)}
    <div class="row" class:sel={r.selected}>
      <Favicon fav={r.fav} size={16} />
      <span class="title">{r.title}</span>
      <span class="kind">{r.kind}</span>
    </div>
  {/each}
</div>

<style>
  .launcher {
    font-size: var(--text-md);
  }

  .q {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    color: var(--text);
    border-bottom: 1px solid var(--border-soft);
  }

  .mark,
  .shortcut {
    color: var(--text-dim);
  }

  .ph {
    color: var(--text-muted);
  }

  .shortcut {
    margin-left: auto;
    font-size: var(--text-sm);
  }

  .caret {
    width: 1.5px;
    height: 18px;
    background: var(--accent);
    animation: blink 1.1s steps(1) infinite;
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: var(--row-h);
    padding: 0 var(--space-3);
    border-radius: var(--r-md);
    color: var(--text-2);
  }

  .row .title {
    flex: 1 1 auto;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .kind {
    flex: none;
    padding: 2px 8px;
    border-radius: var(--r-sm);
    background: var(--surface-2);
    font-size: var(--text-2xs);
    font-weight: var(--weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-dim);
  }

  /* Selection is the `--accent-soft` wash only — no leading accent bar, matching
     the sidebar TabRow and the updated launcher overlay (wash-only selection). */
  .row.sel {
    background: var(--accent-soft);
    color: var(--text);
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .caret {
      animation: none;
    }
  }
</style>
