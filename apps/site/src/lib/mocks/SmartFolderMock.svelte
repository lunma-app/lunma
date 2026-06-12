<script lang="ts">
// A smart folder of live GitLab merge requests — the shipped v1 connector. Mirrors
// the extension's result-row contract: a folder header (a git source mark + name +
// a quiet item-count badge) over rows of source mark + title + EXACTLY ONE
// pipeline-status dot (the one-glyph restraint), each dot painted from the
// @lunma/tokens semantic tone tokens (--success / --info / --warning). Decorative
// (aria-hidden) like the other mocks — the beat copy carries the meaning. No motion
// (a running pipeline is a static --info dot), so the page's reduced-motion contract
// is untouched. The folder name rides the surrounding Space colour with the
// SectionHeader's max(l, 0.72) lightness floor, so it stays WCAG-AA.
interface Mr {
  title: string;
  tone: 'success' | 'info' | 'warning';
}

const items: Mr[] = [
  { title: 'Sidebar: fix the drift-dot ring', tone: 'success' },
  { title: 'Launcher: tab-completion across engines', tone: 'info' },
  { title: 'Auto-archive: settle the idle clock', tone: 'warning' },
];
</script>

<!-- The smart folder's own mark — lucide `folder-git-2`, the glyph the extension
     mints for a smart folder. Distinct from the per-row merge mark below. -->
{#snippet folderMark()}
  <svg
    viewBox="0 0 24 24"
    width="15"
    height="15"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M18 19a5 5 0 0 1-5-5v8" />
    <path d="M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v5" />
    <circle cx="13" cy="12" r="2" />
    <circle cx="20" cy="19" r="2" />
  </svg>
{/snippet}

<!-- A single merge request — lucide `git-merge`. -->
{#snippet mergeMark()}
  <svg
    viewBox="0 0 24 24"
    width="15"
    height="15"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <circle cx="18" cy="18" r="3" />
    <circle cx="6" cy="6" r="3" />
    <path d="M6 21V9a9 9 0 0 0 9 9" />
  </svg>
{/snippet}

<div class="folder" aria-hidden="true">
  <div class="head">
    <span class="mark">{@render folderMark()}</span>
    <span class="name">Review queue</span>
    <span class="count">{items.length}</span>
  </div>
  {#each items as mr (mr.title)}
    <div class="row">
      <span class="mark">{@render mergeMark()}</span>
      <span class="title">{mr.title}</span>
      <span class="dot" data-tone={mr.tone}></span>
    </div>
  {/each}
</div>

<style>
  .folder {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px;
  }

  /* The folder header — a row mirroring SpaceHeader: a source mark, the name at
     title weight riding the Space colour (0.72 lightness floor → WCAG-AA), and a
     quiet item-count badge. */
  .head {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: var(--row-h);
    padding: 0 var(--space-3);
    color: oklch(from var(--space-c) max(l, 0.72) c h / 0.95);
  }
  .head .name {
    flex: 1 1 auto;
    font: var(--weight-medium) var(--text-base) / 1 var(--font-sans);
  }
  .count {
    flex: none;
    min-width: 18px;
    height: 18px;
    padding: 0 6px;
    display: inline-grid;
    place-items: center;
    border-radius: var(--r-pill);
    background: var(--surface);
    color: var(--text-muted);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: var(--row-h);
    padding: 0 var(--space-3);
    border-radius: var(--r-md);
    color: var(--text-2);
    font-size: var(--text-base);
  }
  .row .title {
    flex: 1 1 auto;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .mark {
    flex: none;
    display: inline-flex;
    width: var(--favicon-size);
    height: var(--favicon-size);
    align-items: center;
    justify-content: center;
    color: var(--text-dim);
  }
  .head .mark {
    color: inherit;
    opacity: 0.9;
  }

  /* Exactly ONE status dot per row — the MR's pipeline state, from the @lunma/tokens
     semantic tone tokens. Static at every motion level (a running pipeline is a
     static --info dot), so the page's reduced-motion contract is untouched. */
  .dot {
    flex: none;
    width: 9px;
    height: 9px;
    border-radius: var(--r-pill);
    background: var(--dot);
    box-shadow: 0 0 8px oklch(from var(--dot) l c h / 0.5);
  }
  .dot[data-tone='success'] {
    --dot: var(--success);
  }
  .dot[data-tone='info'] {
    --dot: var(--info);
  }
  .dot[data-tone='warning'] {
    --dot: var(--warning);
  }
</style>
