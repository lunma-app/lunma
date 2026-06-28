<script lang="ts">
import { applyLensFilter } from '../../shared/lens-filter';
import type { LensEntity, LensFilter } from '../../shared/types';
import Chip from '../../ui/Chip.svelte';
import Diffstat from '../../ui/Diffstat.svelte';
import Icon from '../../ui/Icon.svelte';
import Pill from '../../ui/Pill.svelte';
import ReviewerRail from '../../ui/ReviewerRail.svelte';
import type { SelectOption } from '../../ui/Select.svelte';
import Select from '../../ui/Select.svelte';
import LensFilterBar from './LensFilterBar.svelte';
import {
  bucketByEntity,
  changeMeta,
  ciLight,
  feedLabel,
  feedsOf,
  groupByRelation,
  groupByStatus,
  hostOf,
  type LensNode,
  priorityHue,
  RELATION_LABEL,
  relTime,
  reviewersForRail,
  statusDot,
  statusVM,
  stripKeyPrefix,
  type Tagged,
} from './overview-vm';

// OverviewPage (lens-overview): the active lens's overview — a single collapsible
// inline page (the redesign handoff's model; no drill-down sub-pages). A serif
// identity row, then one collapsible card per non-empty entity: Changes
// (relation-grouped, with reviewer avatars + CI circle + state pill), Issues
// (status-grouped, priority pill), Articles (unread toggle + Grid/List). A
// persistent LensFilterBar (lens-view-filters) sits between the identity row and
// the first section; it replaces the former ephemeral repo/feed chip rows.
// Item-merged: a github source's PRs land in Changes, its issues in Issues.
// The page shell (--lens-h, rail) lives in LensPage.
interface Props {
  node: LensNode;
  /** All items from the lens (flat, unfiltered). LensPage supplies them so
   * OverviewPage can apply applyLensFilter before bucketing by entity. */
  tagged: Tagged[];
  /** Available facets derived from all current items (from LensPage). */
  facets: { entities: LensEntity[]; repos: string[]; projects: string[]; feeds: string[] };
  /** The identity sub-line (derived provider summary). */
  lensSub: string;
  /** Unread keys (`${sk}:${id}`) — drives the Articles unread count + dots. */
  readSet: Set<string>;
  /** Activate an item (opens it via the bus). */
  openItem: (t: Tagged) => void;
  /** Toggle an item's read state (`makeRead` true → mark read, false → unread). */
  toggleRead: (t: Tagged, makeRead: boolean) => void;
  /** Dispatch setLensFilter (wired by LensPage). */
  setFilter: (filter: LensFilter) => void;
}

const { node, tagged, facets, lensSub, readSet, openItem, toggleRead, setFilter }: Props = $props();

const lensLetter = $derived((node.name.trim()[0] ?? '·').toUpperCase());
const filter = $derived(node.filter ?? {});

// Scope facets: union of present + selected (D6) — per entity card.
const CHIP_THRESHOLD = 5;
const visRepos = $derived([...new Set([...facets.repos, ...(filter.repos ?? [])])]);
const visProjects = $derived([...new Set([...facets.projects, ...(filter.projects ?? [])])]);
const visFeeds = $derived([...new Set([...facets.feeds, ...(filter.feeds ?? [])])]);

const repoSelectOptions = $derived<SelectOption[]>([
  { value: 'all', label: 'All repos' },
  ...visRepos.map((r) => ({ value: r, label: r })),
]);
const repoSelectValue = $derived(filter.repos?.length === 1 ? (filter.repos[0] ?? 'all') : 'all');

const projectSelectOptions = $derived<SelectOption[]>([
  { value: 'all', label: 'All projects' },
  ...visProjects.map((p) => ({ value: p, label: p })),
]);
const projectSelectValue = $derived(
  filter.projects?.length === 1 ? (filter.projects[0] ?? 'all') : 'all',
);

const feedSelectOptions = $derived<SelectOption[]>([
  { value: 'all', label: 'All feeds' },
  ...visFeeds.map((f) => ({ value: f, label: f })),
]);
const feedSelectValue = $derived(filter.feeds?.length === 1 ? (filter.feeds[0] ?? 'all') : 'all');

function toggleRepo(r: string): void {
  const current = filter.repos ?? [];
  const next = current.includes(r) ? current.filter((x) => x !== r) : [...current, r];
  setFilter({ ...filter, repos: next });
}

function toggleProject(p: string): void {
  const current = filter.projects ?? [];
  const next = current.includes(p) ? current.filter((x) => x !== p) : [...current, p];
  setFilter({ ...filter, projects: next });
}

function toggleFeed(f: string): void {
  const current = filter.feeds ?? [];
  const next = current.includes(f) ? current.filter((x) => x !== f) : [...current, f];
  setFilter({ ...filter, feeds: next });
}

function onRepoSelectChange(value: string): void {
  setFilter({ ...filter, repos: value === 'all' ? [] : [value] });
}

function onProjectSelectChange(value: string): void {
  setFilter({ ...filter, projects: value === 'all' ? [] : [value] });
}

function onFeedSelectChange(value: string): void {
  setFilter({ ...filter, feeds: value === 'all' ? [] : [value] });
}

// Apply the persisted lens filter before bucketing so both the count and the
// entity sections reflect exactly what the filter allows.
const filteredTagged = $derived.by(() => {
  if (
    !filter.entities?.length &&
    !filter.repos?.length &&
    !filter.projects?.length &&
    !filter.feeds?.length
  )
    return tagged;
  const rows = tagged.map((t) => ({
    item: t.item,
    host: hostOf(t.cfg.baseUrl),
    feedName: feedLabel(t),
  }));
  const passedItems = new Set(applyLensFilter(rows, filter).map((r) => r.item));
  return tagged.filter((t) => passedItems.has(t.item));
});
const byEntity = $derived(bucketByEntity(filteredTagged));

const changes = $derived(byEntity.change);
const tickets = $derived(byEntity.ticket);
const articles = $derived(byEntity.article);
const generic = $derived(byEntity.generic);

// Sections default OPEN (the comp's `collapsed = {}`); a header click toggles.
let collapsed = $state<Record<string, boolean>>({});
const toggle = (key: string): void => {
  collapsed[key] = !collapsed[key];
};

// Changes: relation groups.
const changeGroups = $derived(groupByRelation(changes));

// Issues: status groups (todo / in-progress / done).
const issueGroups = $derived(groupByStatus(tickets));

// Articles: unread toggle + Grid/List.
let unreadOnly = $state(false);
let articleView = $state<'grid' | 'list'>('grid');
const itemKey = (t: Tagged): string => `${t.sk}:${t.item.id}`;
const isUnread = (t: Tagged): boolean => !readSet.has(itemKey(t));
// Items toggled read THIS session stay visible (dimmed) under the Unread filter
// instead of vanishing under the cursor; re-applying the filter clears the set.
let stickyKeys = $state(new Set<string>());
const visArticles = $derived(
  articles.filter((t) => !unreadOnly || isUnread(t) || stickyKeys.has(itemKey(t))),
);
const unreadCount = $derived(articles.filter(isUnread).length);

function onToggleRead(t: Tagged): void {
  const wasUnread = isUnread(t);
  // Marking read keeps the row visible (sticky) so it doesn't disappear instantly.
  if (wasUnread) stickyKeys = new Set(stickyKeys).add(itemKey(t));
  toggleRead(t, wasUnread);
}
function toggleUnreadFilter(): void {
  stickyKeys = new Set(); // re-applying the filter re-evaluates from scratch
  unreadOnly = !unreadOnly;
}

const empty = $derived(
  changes.length === 0 && tickets.length === 0 && articles.length === 0 && generic.length === 0,
);
</script>

<div class="overview" data-testid="lens-overview">
  <!-- Lens identity row. -->
  <header class="identity">
    <span class="lens-tile" aria-hidden="true">{lensLetter}</span>
    <div class="identity-text">
      <h1 class="lens-name" data-testid="lens-name">{node.name}</h1>
      <p class="lens-sub">{lensSub}</p>
    </div>
  </header>

  <!-- Persistent per-lens filter bar (lens-view-filters). Sits between identity
       and the first section. Only renders when the lens has multiple entity types
       or scope facets (repos/projects). -->
  <LensFilterBar {filter} {facets} onfilter={setFilter} />

  <!-- Changes -->
  {#if changes.length > 0}
    {@const open = !collapsed.change}
    <section class="card" data-testid="overview-section" data-entity="change">
      <button class="sec-head" type="button" aria-expanded={open} onclick={() => toggle('change')}>
        <span class="chev" class:open aria-hidden="true"><Icon name="chevron-right" size={11} /></span>
        <span class="sec-dot" style:--dot-h="252" aria-hidden="true"></span>
        <span class="sec-title">Changes</span>
        <span class="count" data-testid="section-count">{changes.length}</span>
        <span class="sec-trail">incl. CI</span>
      </button>
      {#if open}
        <div class="sec-body">
          {#if visRepos.length > 0}
            <div class="scope-filter" data-testid="change-scope-filter">
              {#if visRepos.length <= CHIP_THRESHOLD}
                {#each visRepos as repo (repo)}
                  <Chip
                    label={repo}
                    onToggle={() => toggleRepo(repo)}
                    selected={(filter.repos ?? []).includes(repo)}
                    testid="repo-chip"
                  />
                {/each}
              {:else}
                <Select
                  options={repoSelectOptions}
                  value={repoSelectValue}
                  onchange={onRepoSelectChange}
                  ariaLabel="Filter by repo"
                  testid="repo-select"
                />
              {/if}
            </div>
          {/if}
          {#each changeGroups as group (group.relation)}
            <div class="group">
              <div class="group-head">
                <span class="group-label" class:waiting={group.relation === 'waiting'}>{RELATION_LABEL[group.relation]}</span>
                <span class="group-count">{group.items.length}</span>
              </div>
              {#each group.items as t (t.sk + t.item.id)}
                {@const ci = ciLight(t.item)}
                <button class="row" type="button" data-testid="change-row" onclick={() => openItem(t)}>
                  <span class="mono" aria-hidden="true">{t.cfg.source === 'gitlab' ? 'GL' : 'GH'}</span>
                  <span class="row-body">
                    <span class="row-title-line">
                      <span class="row-title">{t.item.title}</span>
                      {#if t.item.refs?.[0]}
                        <span class="ticket-ref" data-testid="ticket-ref">{t.item.refs[0].label}</span>
                      {/if}
                    </span>
                    {#if t.item.change}<span class="row-meta">{changeMeta(t.item.change)}</span>{/if}
                  </span>
                  {#if t.item.change}
                    <span class="row-right">
                      {#if ci}
                        <span class="ci" class:hollow={ci.draft} style:--ci-h={String(ci.hue)} title={ci.label} aria-hidden="true">{ci.glyph}</span>
                      {/if}
                      <ReviewerRail reviewers={reviewersForRail(t.item.change)} />
                      <Diffstat additions={t.item.change.additions} deletions={t.item.change.deletions} />
                    </span>
                  {/if}
                </button>
              {/each}
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  <!-- Issues -->
  {#if tickets.length > 0}
    {@const open = !collapsed.ticket}
    <section class="card" data-testid="overview-section" data-entity="ticket">
      <button class="sec-head" type="button" aria-expanded={open} onclick={() => toggle('ticket')}>
        <span class="chev" class:open aria-hidden="true"><Icon name="chevron-right" size={11} /></span>
        <span class="sec-dot" style:--dot-h="295" aria-hidden="true"></span>
        <span class="sec-title">Issues</span>
        <span class="count" data-testid="section-count">{tickets.length}</span>
      </button>
      {#if open}
        <div class="sec-body">
          {#if visProjects.length > 0}
            <div class="scope-filter" data-testid="issue-scope-filter">
              {#if visProjects.length <= CHIP_THRESHOLD}
                {#each visProjects as project (project)}
                  <Chip
                    label={project}
                    onToggle={() => toggleProject(project)}
                    selected={(filter.projects ?? []).includes(project)}
                    testid="project-chip"
                  />
                {/each}
              {:else}
                <Select
                  options={projectSelectOptions}
                  value={projectSelectValue}
                  onchange={onProjectSelectChange}
                  ariaLabel="Filter by project"
                  testid="project-select"
                />
              {/if}
            </div>
          {/if}
          {#each issueGroups as group (group.category)}
            {@const st = statusVM(group.category)}
            <div class="group">
              <div class="group-head">
                <span class="status-dot" style:--sd={statusDot(group.category)} aria-hidden="true"></span>
                <span class="group-label">{st.label}</span>
                <span class="group-count">{group.items.length}</span>
              </div>
              {#each group.items as t (t.sk + t.item.id)}
                {@const tk = t.item.ticket}
                {#if tk}
                  <button class="row" type="button" data-testid="issue-row" onclick={() => openItem(t)}>
                    <span class="issue-key" aria-hidden="true">{tk.key}</span>
                    <span class="row-body">
                      <span class="row-title">{stripKeyPrefix(t.item.title, tk.key)}</span>
                      {#if tk.project}<span class="row-meta">{tk.project}</span>{/if}
                    </span>
                    {#if tk.priority}<Pill hue={priorityHue(tk.priority)} testid="issue-priority">{tk.priority}</Pill>{/if}
                  </button>
                {/if}
              {/each}
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}

  <!-- Articles -->
  {#if articles.length > 0}
    {@const open = !collapsed.article}
    <section class="card" data-testid="overview-section" data-entity="article">
      <button class="sec-head" type="button" aria-expanded={open} onclick={() => toggle('article')}>
        <span class="chev" class:open aria-hidden="true"><Icon name="chevron-right" size={11} /></span>
        <span class="sec-dot" style:--dot-h="150" aria-hidden="true"></span>
        <span class="sec-title">Articles</span>
        <span class="count" data-testid="section-count">{visArticles.length}</span>
        <span class="sec-trail">RSS</span>
      </button>
      {#if open}
        <div class="sec-body">
          {#if visFeeds.length > 1}
            <div class="scope-filter" data-testid="article-scope-filter">
              {#if visFeeds.length <= CHIP_THRESHOLD}
                {#each visFeeds as feed (feed)}
                  <Chip
                    label={feed}
                    onToggle={() => toggleFeed(feed)}
                    selected={(filter.feeds ?? []).includes(feed)}
                    testid="feed-chip"
                  />
                {/each}
              {:else}
                <Select
                  options={feedSelectOptions}
                  value={feedSelectValue}
                  onchange={onFeedSelectChange}
                  testid="feed-select"
                />
              {/if}
            </div>
          {/if}
          <div class="filter-row article-controls">
            <span class="controls-right">
              <button class="chip-btn" class:on={unreadOnly} type="button" onclick={toggleUnreadFilter}>Unread · {unreadCount}</button>
              <span class="seg" role="group" aria-label="Article layout">
                <button class="seg-btn" class:on={articleView === 'grid'} type="button" onclick={() => (articleView = 'grid')}>Grid</button>
                <button class="seg-btn" class:on={articleView === 'list'} type="button" onclick={() => (articleView = 'list')}>List</button>
              </span>
            </span>
          </div>

          {#if articleView === 'grid'}
            <div class="article-grid">
              {#each visArticles as t (t.sk + t.item.id)}
                <div class="art-card" class:read={!isUnread(t)} data-testid="article-card">
                  <button class="art-open" type="button" aria-label={`Open ${t.item.title}`} onclick={() => openItem(t)}>
                    <span class="art-thumb" class:img={!!t.item.imageUrl} style:background-image={t.item.imageUrl ? `url(${t.item.imageUrl})` : undefined} aria-hidden="true"></span>
                    <span class="art-text">
                      <span class="art-title">{t.item.title}</span>
                      {#if t.item.excerpt}<span class="art-desc">{t.item.excerpt}</span>{/if}
                      <span class="art-foot">
                        <span class="art-src">{feedLabel(t)}</span>
                        {#if t.item.publishedAt}<span class="art-fdot" aria-hidden="true"></span><span class="art-age">{relTime(t.item.publishedAt)}</span>{/if}
                        {#if t.item.categories?.length}<span class="categories">{#each t.item.categories as cat (cat)}<span class="category">{cat}</span>{/each}</span>{/if}
                      </span>
                    </span>
                  </button>
                  <button class="art-read" class:unread={isUnread(t)} type="button" data-testid="article-read-toggle" title={isUnread(t) ? 'Mark as read' : 'Mark as unread'} aria-label={isUnread(t) ? 'Mark as read' : 'Mark as unread'} onclick={() => onToggleRead(t)}>
                    <Icon name={isUnread(t) ? 'mail' : 'mail-open'} size={14} />
                  </button>
                </div>
              {/each}
            </div>
          {:else}
            <div class="article-list">
              {#each visArticles as t (t.sk + t.item.id)}
                <div class="art-row" class:read={!isUnread(t)} data-testid="article-row">
                  <button class="art-open" type="button" aria-label={`Open ${t.item.title}`} onclick={() => openItem(t)}>
                    <span class="art-thumb sm" class:img={!!t.item.imageUrl} style:background-image={t.item.imageUrl ? `url(${t.item.imageUrl})` : undefined} aria-hidden="true"></span>
                    <span class="art-text">
                      <span class="art-title">{t.item.title}</span>
                      {#if t.item.excerpt}<span class="art-desc">{t.item.excerpt}</span>{/if}
                      <span class="art-foot">
                        <span class="art-src">{feedLabel(t)}</span>
                        {#if t.item.publishedAt}<span class="art-fdot" aria-hidden="true"></span><span class="art-age">{relTime(t.item.publishedAt)}</span>{/if}
                        {#if t.item.categories?.length}<span class="categories">{#each t.item.categories as cat (cat)}<span class="category">{cat}</span>{/each}</span>{/if}
                      </span>
                    </span>
                  </button>
                  <button class="art-read" class:unread={isUnread(t)} type="button" data-testid="article-read-toggle" title={isUnread(t) ? 'Mark as read' : 'Mark as unread'} aria-label={isUnread(t) ? 'Mark as read' : 'Mark as unread'} onclick={() => onToggleRead(t)}>
                    <Icon name={isUnread(t) ? 'mail' : 'mail-open'} size={14} />
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </section>
  {/if}

  <!-- Other (untyped fallback) -->
  {#if generic.length > 0}
    {@const open = !collapsed.generic}
    <section class="card" data-testid="overview-section" data-entity="generic">
      <button class="sec-head" type="button" aria-expanded={open} onclick={() => toggle('generic')}>
        <span class="chev" class:open aria-hidden="true"><Icon name="chevron-right" size={11} /></span>
        <span class="sec-dot" style:--dot-h="0" aria-hidden="true"></span>
        <span class="sec-title">Other</span>
        <span class="count" data-testid="section-count">{generic.length}</span>
      </button>
      {#if open}
        <div class="sec-body">
          <div class="group">
            {#each generic as t (t.sk + t.item.id)}
              <button class="row" type="button" data-testid="generic-row" onclick={() => openItem(t)}>
                <span class="row-body">
                  <span class="row-title">{t.item.title}</span>
                  {#if t.item.status}<span class="row-meta">{t.item.status.label}</span>{/if}
                </span>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </section>
  {/if}

  {#if empty}
    <p class="empty" data-testid="overview-empty">This lens has nothing waiting right now.</p>
  {/if}
</div>

<style>
  .overview {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  /* ── Identity row ─────────────────────────────────────────────────────────── */
  .identity {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  .lens-tile {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: var(--lens-soft);
    color: var(--lens-text);
    font-family: var(--font-display);
    font-size: 28px;
  }
  .identity-text {
    flex: 1;
    min-width: 0;
  }
  .lens-name {
    margin: 0;
    font-family: var(--font-display);
    font-size: 32px;
    line-height: 1;
    font-weight: var(--weight-regular);
    color: var(--text);
  }
  .lens-sub {
    margin: 5px 0 0;
    font-size: 12.5px;
    color: var(--text-muted);
  }

  /* ── Section card (collapsible) ───────────────────────────────────────────── */
  .card {
    border-radius: var(--r-xl);
    background: var(--surface);
    border: 1px solid var(--border-soft);
    overflow: hidden;
  }
  .sec-head {
    appearance: none;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 18px;
    background: none;
    border: 0;
    cursor: pointer;
    text-align: left;
    color: var(--text);
  }
  .sec-head:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: calc(-1 * var(--focus-width));
  }
  .chev {
    display: inline-flex;
    flex-shrink: 0;
    color: var(--text-muted);
    transition: transform 0.15s var(--ease-standard);
  }
  .chev.open {
    transform: rotate(90deg);
  }
  .sec-dot {
    flex-shrink: 0;
    width: 9px;
    height: 9px;
    border-radius: var(--r-2xs);
    background: oklch(0.62 0.15 var(--dot-h));
  }
  .sec-title {
    font-size: 15px;
    font-weight: var(--weight-semibold);
  }
  .count {
    flex-shrink: 0;
    padding: 1px 8px;
    border-radius: var(--r-pill);
    background: var(--surface-3);
    color: var(--text-muted);
    font-size: var(--text-xs);
  }
  .sec-trail {
    margin-left: auto;
    font-size: var(--text-xs);
    color: var(--text-faint);
  }
  .sec-body {
    /* Recessed darker body (the page --bg) beneath the lifted --surface header, so
       chips, state pills, and rows stand out against it; the header keeps the card lift. */
    background: var(--bg);
    border-top: 1px solid var(--border-soft);
    padding: 13px;
    display: flex;
    flex-direction: column;
    gap: 13px;
  }

  /* ── Scope filter (inside entity cards) ──────────────────────────────────── */
  .scope-filter {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1);
  }

  /* ── Filter chips / segmented control ─────────────────────────────────────── */
  .filter-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }
.chip-btn {
    appearance: none;
    padding: 4px 11px;
    border-radius: var(--r-pill);
    border: 1px solid var(--border-soft);
    background: transparent;
    color: var(--text-muted);
    font-size: 11.5px;
    font-weight: var(--weight-medium);
    cursor: pointer;
    white-space: nowrap;
  }
  .chip-btn.on {
    border-color: transparent;
    background: var(--surface-3);
    color: var(--text);
  }
  .chip-btn:focus-visible,
  .seg-btn:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
  .article-controls .controls-right {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .seg {
    display: inline-flex;
    gap: 2px;
    padding: 2px;
    background: var(--surface-2);
    border: 1px solid var(--border-soft);
    border-radius: var(--r-control, 8px);
  }
  .seg-btn {
    appearance: none;
    padding: 4px 11px;
    border: none;
    border-radius: var(--r-sm);
    background: transparent;
    color: var(--text-muted);
    font-size: 11.5px;
    font-weight: var(--weight-semibold);
    cursor: pointer;
  }
  .seg-btn.on {
    background: var(--surface-3);
    color: var(--text);
  }

  /* ── Relation / status groups ─────────────────────────────────────────────── */
  .group {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .group-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 2px;
  }
  .group-label {
    font-size: 10.5px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-weight: var(--weight-semibold);
    color: var(--text-dim);
  }
  .group-label.waiting {
    color: oklch(var(--accent-text-l) 0.09 252);
  }
  .group-count {
    padding: 0 7px;
    border-radius: var(--r-pill);
    background: var(--surface-3);
    color: var(--text-muted);
    font-size: 10px;
  }
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: var(--r-pill);
    background: var(--sd);
  }

  /* ── Rows (Changes / Issues / generic) ────────────────────────────────────── */
  .row {
    appearance: none;
    border: 0;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 11px 12px;
    border-radius: var(--r-lg);
    background: var(--surface-2);
    cursor: pointer;
    text-align: left;
    transition: background var(--motion-fast) var(--ease-standard);
  }
  .row:hover {
    background: var(--hover);
  }
  .row:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
  .mono {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: var(--r-md);
    background: var(--surface-3);
    color: var(--text-2);
    font-size: 9px;
    font-weight: var(--weight-bold);
  }
  .issue-key {
    flex-shrink: 0;
    width: 62px;
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--text-faint);
  }
  .row-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .row-title-line {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .row-title {
    font-size: var(--text-base);
    font-weight: var(--weight-semibold);
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ticket-ref {
    flex-shrink: 0;
    font-family: var(--font-mono);
    font-size: var(--text-2xs);
    padding: 1px 7px;
    border-radius: var(--r-sm);
    color: oklch(var(--accent-text-l) 0.1 295);
    background: oklch(0.55 0.13 295 / var(--accent-fill-a));
  }
  .row-meta {
    font-size: var(--text-xs);
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* Trailing triage cluster: CI light · ReviewerRail · Diffstat — three
     orthogonal signals (pipeline / review / size), none duplicated. */
  .row-right {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  .ci {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: var(--r-pill);
    font-size: 9px;
    font-weight: var(--weight-bold);
    color: oklch(0.82 0.1 var(--ci-h));
    background: oklch(0.55 0.13 var(--ci-h) / 0.2);
  }
  /* Draft: a hollow ring (no fill) so the locus reads as "not yet under CI",
     distinguished by shape, not colour alone. */
  .ci.hollow {
    color: var(--text-dim);
    background: none;
    box-shadow: inset 0 0 0 1.5px var(--border);
  }

  /* ── Articles ─────────────────────────────────────────────────────────────── */
  .article-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 11px;
  }
  .article-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  /* Card / row are containers (position context for the corner toggle); `.art-open`
     is the clickable area, `.art-read` the read/unread toggle button. */
  .art-card,
  .art-row {
    position: relative;
    background: var(--surface-2);
    border-radius: var(--r-lg);
    overflow: hidden;
  }
  .art-open {
    appearance: none;
    border: 0;
    padding: 0;
    width: 100%;
    box-sizing: border-box;
    background: none;
    color: inherit;
    cursor: pointer;
    text-align: left;
    display: flex;
  }
  .art-card .art-open {
    flex-direction: column;
  }
  /* Stretch so the thumbnail runs the full height of the row (top to bottom),
     like the grid card's banner — just rotated to a left strip. */
  .art-row .art-open {
    flex-direction: row;
    align-items: stretch;
    /* Min height of a 1-line-title + 2-line-description row, so single-line rows
       match it — the full-height image gets room and the foot bottom-aligns
       (see `.art-row .art-foot`). */
    min-height: 96px;
  }
  .art-open:hover .art-title {
    color: var(--lens-text);
  }
  .art-open:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: calc(-1 * var(--focus-width));
  }
  .art-thumb {
    position: relative;
    flex-shrink: 0;
    /* Grid hero: a 16:9 frame (the ratio most feed images ship in), so `cover`
       barely crops and faces aren't guillotined by a short letterbox band. */
    aspect-ratio: 16 / 9;
    background: repeating-linear-gradient(135deg, var(--surface-3) 0 8px, var(--surface-2) 8px 16px);
  }
  .art-thumb.sm {
    /* List view: a left strip that runs the FULL row height. `aspect-ratio: auto`
       + `height: auto` drop the grid hero's 16:9 so `align-self: stretch` governs
       (a definite height/ratio would win over stretch and stop the image short). */
    aspect-ratio: auto;
    width: 128px;
    height: auto;
    align-self: stretch;
  }
  .art-thumb.img {
    background-size: cover;
    background-position: center;
  }
  /* Read/unread toggle: a mail (unread) / open-mail (read) icon in the top-right
     corner; click toggles read state. A backdrop keeps it legible over any image. */
  .art-read {
    position: absolute;
    top: 8px;
    right: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: var(--r-md);
    background: color-mix(in oklch, var(--surface) 78%, transparent);
    color: var(--text-muted);
    cursor: pointer;
    transition:
      background var(--motion-fast) var(--ease-standard),
      color var(--motion-fast) var(--ease-standard);
  }
  .art-read.unread {
    color: oklch(var(--accent-text-l) 0.1 150);
  }
  .art-read:hover {
    background: var(--surface-3);
    color: var(--text);
  }
  .art-read:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
  /* In a list row the title sits beside the toggle — pad it clear of the corner. */
  .art-row .art-title {
    padding-right: 30px;
  }
  /* Read items recede: greyish title + description, dimmed thumbnail. */
  .art-card.read .art-title,
  .art-row.read .art-title {
    color: var(--text-muted);
    font-weight: var(--weight-medium);
  }
  .art-card.read .art-desc,
  .art-row.read .art-desc {
    color: var(--text-faint);
  }
  .art-card.read .art-thumb,
  .art-row.read .art-thumb {
    opacity: 0.5;
  }
  .art-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding: 11px 13px 13px;
  }
  .art-row .art-text {
    padding: 11px 13px;
  }
  .art-title {
    font-size: 13px;
    font-weight: var(--weight-semibold);
    line-height: 1.3;
    color: var(--text);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .art-desc {
    margin-top: 6px;
    font-size: 11px;
    line-height: 1.45;
    color: var(--text-muted);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .art-foot {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 10px;
    font-size: 10.5px;
    color: var(--text-muted);
  }
  /* List rows: pin source · age · category to the bottom (title stays at the top),
     so a single-line row aligns its foot with the 2-line rows beside it. */
  .art-row .art-foot {
    margin-top: auto;
    padding-top: 10px;
  }
  .art-fdot {
    width: 3px;
    height: 3px;
    border-radius: var(--r-pill);
    background: var(--text-faint);
  }
  .art-age {
    color: var(--text-faint);
  }
  .categories {
    margin-left: auto;
    display: flex;
    flex-shrink: 0;
    gap: 5px;
  }
  .category {
    padding: 1px 8px;
    border-radius: var(--r-pill);
    font-size: 10px;
    color: oklch(var(--accent-text-l) 0.09 150);
    background: oklch(0.55 0.13 150 / var(--accent-fill-a));
  }

  .empty {
    margin: 0;
    padding: var(--space-3);
    color: var(--text-dim);
    font-size: var(--text-sm);
  }

  @media (prefers-reduced-motion: reduce) {
    .chev {
      transition: none;
    }
  }
</style>
