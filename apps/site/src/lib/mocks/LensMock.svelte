<script lang="ts">
// A multi-source lens — one lens aggregating GitLab MRs and GitHub PRs.
// Mirrors the extension's sectioned result-row contract: a folder header (source
// mark + name + combined badge) then two sections each preceded by a quiet
// section-header divider (source icon + host label, 12px height, --text-dim /
// --text-muted). Per-row: source mark + title + ONE pipeline-status dot from
// @lunma/tokens semantic tone tokens. Decorative (aria-hidden) — the beat copy
// carries the meaning. No motion; reduced-motion contract untouched.
interface Item {
  title: string;
  tone: 'success' | 'info' | 'warning';
}

const gitlab: Item[] = [
  { title: 'Sidebar: fix the drift-dot ring', tone: 'success' },
  { title: 'Launcher: tab-completion across engines', tone: 'info' },
];

const github: Item[] = [{ title: 'Auto-archive: settle the idle clock', tone: 'warning' }];

const totalCount = gitlab.length + github.length;
</script>

<!-- lucide `folder-git-2` — the glyph minted for a lens. -->
{#snippet folderMark()}
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M18 19a5 5 0 0 1-5-5v8" />
    <path d="M9 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v5" />
    <circle cx="13" cy="12" r="2" />
    <circle cx="20" cy="19" r="2" />
  </svg>
{/snippet}

<!-- lucide `git-merge` — per-row MR/PR mark. -->
{#snippet mergeMark()}
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="18" cy="18" r="3" />
    <circle cx="6" cy="6" r="3" />
    <path d="M6 21V9a9 9 0 0 0 9 9" />
  </svg>
{/snippet}

<div class="folder" aria-hidden="true">
  <div class="head">
    <span class="mark">{@render folderMark()}</span>
    <span class="name">Review queue</span>
    <span class="count">{totalCount}</span>
  </div>

  <!-- Section header: GitLab -->
  <div class="section-head">
    <span class="section-mark">{@render folderMark()}</span>
    <span class="section-host">gitlab.com</span>
  </div>
  {#each gitlab as item (item.title)}
    <div class="row">
      <span class="mark">{@render mergeMark()}</span>
      <span class="title">{item.title}</span>
      <span class="dot" data-tone={item.tone}></span>
    </div>
  {/each}

  <!-- Section header: GitHub -->
  <div class="section-head">
    <span class="section-mark">{@render folderMark()}</span>
    <span class="section-host">github.com</span>
  </div>
  {#each github as item (item.title)}
    <div class="row">
      <span class="mark">{@render mergeMark()}</span>
      <span class="title">{item.title}</span>
      <span class="dot" data-tone={item.tone}></span>
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

  /* Section divider — 12px height, quiet source icon + host label. */
  .section-head {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: 12px;
    padding: 4px var(--space-2) 0 var(--space-3);
    margin-bottom: 2px;
  }
  .section-mark {
    flex: none;
    display: inline-flex;
    width: var(--favicon-size);
    height: var(--favicon-size);
    align-items: center;
    justify-content: center;
    color: var(--text-dim);
  }
  .section-host {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 11px;
    line-height: 1;
    color: var(--text-muted);
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
