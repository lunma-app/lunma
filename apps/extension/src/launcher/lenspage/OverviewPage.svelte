<script lang="ts">
import { untrack } from 'svelte';
import { PROVIDER_LABEL } from '../../shared/account-ui';
import { applyLensFilter } from '../../shared/lens-filter';
import { m } from '../../shared/paraglide/messages';
import type { LensEntity, LensFilter } from '../../shared/types';
import Avatar from '../../ui/Avatar.svelte';
import Chip from '../../ui/Chip.svelte';
import Diffstat from '../../ui/Diffstat.svelte';
import EntityBadge from '../../ui/EntityBadge.svelte';
import Icon from '../../ui/Icon.svelte';
import MultiSelect, { type MultiSelectOption } from '../../ui/MultiSelect.svelte';
import ReviewerRail from '../../ui/ReviewerRail.svelte';
import {
  bucketByEntity,
  changeMeta,
  ciLight,
  feedLabel,
  groupByRelation,
  groupByStatus,
  hostOf,
  initialsOf,
  isStale,
  type LaneReason,
  type LensNode,
  monoFor,
  priorityHue,
  RELATION_LABEL,
  relTime,
  reviewersForRail,
  statusDot,
  statusVM,
  stripKeyPrefix,
  type Tagged,
  waitingOnYou,
} from './overview-vm';

// OverviewPage (lens-overview board): the active lens as a width-aware triage
// board. A serif identity row, then a cross-entity "Waiting on you" lane (only when
// non-empty), then the board — Changes and Issues side-by-side as two columns when
// both are populated (a single populated entity spans full width), with Articles and
// Other full-width beneath. Change/Issue rows are two-line (title on its own line;
// triage/owner metadata on a second line). Scope filters (repos/projects/feeds) live
// inside their owning entity card. Item-merged: a github source's PRs land in
// Changes, its issues in Issues. The page shell (--lens-h, aurora) lives in LensPage.
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
  /** Dispatch setLensArticleLayout (wired by LensPage). */
  setArticleLayout: (layout: 'grid' | 'list') => void;
}

const {
  node,
  tagged,
  facets,
  lensSub,
  readSet,
  openItem,
  toggleRead,
  setFilter,
  setArticleLayout,
}: Props = $props();

const lensLetter = $derived((node.name.trim()[0] ?? '·').toUpperCase());
const filter = $derived(node.filter ?? {});

// Scope facets: union of present + selected (D6) — per entity card.
const CHIP_THRESHOLD = 5;
const visRepos = $derived([...new Set([...facets.repos, ...(filter.repos ?? [])])]);
const visProjects = $derived([...new Set([...facets.projects, ...(filter.projects ?? [])])]);
const visFeeds = $derived([...new Set([...facets.feeds, ...(filter.feeds ?? [])])]);

// The overflow MultiSelect popovers' checked state is tracked separately from
// `filter.*` because a full selection is normalized back to `[]` for storage
// (so future-arriving facets stay auto-included — see the collapse below). If
// the popover's `values` mirrored `filter.*` directly, that collapse would make
// "Select all" and "Clear" look identical (both land on `[]`), so neither button
// would ever visibly do anything. These mirror the user's last explicit action
// instead, and only resync from `filter.*` when the pinned lens itself changes.
let reposDisplay = $state<string[]>(untrack(() => filter.repos ?? []));
let projectsDisplay = $state<string[]>(untrack(() => filter.projects ?? []));
let feedsDisplay = $state<string[]>(untrack(() => filter.feeds ?? []));
$effect(() => {
  node.id;
  reposDisplay = untrack(() => filter.repos ?? []);
  projectsDisplay = untrack(() => filter.projects ?? []);
  feedsDisplay = untrack(() => filter.feeds ?? []);
});

// Overflow (>CHIP_THRESHOLD) picker options — no synthetic "all" row; clearing
// is the MultiSelect's own Clear action.
const repoOptions = $derived<MultiSelectOption[]>(visRepos.map((r) => ({ value: r, label: r })));
const projectOptions = $derived<MultiSelectOption[]>(
  visProjects.map((p) => ({ value: p, label: p })),
);
const feedOptions = $derived<MultiSelectOption[]>(visFeeds.map((f) => ({ value: f, label: f })));

// Closed-trigger summary for an overflow scope picker: the "All …" label when
// nothing is picked, the lone name when one is, else an "{n} selected" count.
function scopeLabel(sel: string[], all: string): string {
  if (sel.length === 0) return all;
  if (sel.length === 1) return sel[0] ?? all;
  return m.launcher_lensScopeSelected({ count: sel.length });
}
const repoTriggerLabel = $derived(scopeLabel(filter.repos ?? [], m.launcher_lensAllRepos()));
const projectTriggerLabel = $derived(
  scopeLabel(filter.projects ?? [], m.launcher_lensAllProjects()),
);
const feedTriggerLabel = $derived(scopeLabel(filter.feeds ?? [], m.launcher_lensAllFeeds()));

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

// "Waiting on you" — the cross-entity actionable set, derived from the filtered
// items so it honours the active scope filters.
const lane = $derived(waitingOnYou(filteredTagged));

// Two-column board only when BOTH Changes and Issues are populated; otherwise the
// single populated section spans full width (no empty column).
const boardTwoUp = $derived(changes.length > 0 && tickets.length > 0);

function reasonLabel(r: LaneReason): string {
  if (r === 'review') return m.launcher_lensReasonReview();
  if (r === 'ci') return m.launcher_lensReasonCi();
  return m.launcher_lensReasonAssigned();
}

// Sections default OPEN (the comp's `collapsed = {}`); a header click toggles.
let collapsed = $state<Record<string, boolean>>({});
const toggle = (key: string): void => {
  collapsed[key] = !collapsed[key];
};

// Changes: relation groups.
const changeGroups = $derived(groupByRelation(changes));

// Issues: status groups (todo / in-progress / done).
const issueGroups = $derived(groupByStatus(tickets));

// Articles: unread toggle + Grid/List. The layout is a persisted per-lens
// preference (persist-lens-article-layout) — derived from the node, written via
// the bus (no local optimistic copy); the broadcast round-trip re-derives it.
let unreadOnly = $state(false);
const articleView = $derived(node.articleLayout ?? 'grid');
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

  <!-- "Waiting on you" lane (lens-overview board): the cross-entity actionable set,
       above the board. Only renders when non-empty; carries the Space hue glow. -->
  {#if lane.items.length > 0}
    <section class="lane" data-testid="lens-lane">
      <div class="lane-head">
        <span class="lane-star" aria-hidden="true"><Icon name="star" size={14} /></span>
        <span class="lane-title">{m.launcher_lensWaitingOnYou()}</span>
        <span class="lane-count">{lane.items.length}{#if lane.overflow > 0}+{/if}</span>
      </div>
      <div class="lane-body">
        {#each lane.items as li (li.t.sk + li.t.item.id)}
          {@const it = li.t.item}
          {@const refLabel = li.entity === 'ticket' ? it.ticket?.key : it.refs?.[0]?.label}
          {@const sec = li.entity === 'ticket' ? it.ticket?.project : it.change?.repo}
          <button class="lane-row" type="button" data-testid="lane-row" data-reason={li.reason} onclick={() => openItem(li.t)}>
            <EntityBadge entity={li.entity} />
            <span class="row-body">
              <span class="row-title-line">
                <span class="row-title lane-rt">{it.title}</span>
                {#if refLabel}<span class="ticket-ref">{refLabel}</span>{/if}
              </span>
              <span class="row-meta"><span class="prov">{PROVIDER_LABEL[li.t.cfg.source]}</span>{#if sec} · {sec}{/if}</span>
            </span>
            <span class="why" class:danger={li.reason === 'ci'}>{reasonLabel(li.reason)} <span class="arrow" aria-hidden="true">→</span></span>
          </button>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Board: Changes | Issues (two-up only when both populated), Articles + Other below. -->
  <div class="board" class:two={boardTwoUp}>
    <!-- Changes -->
    {#if changes.length > 0}
      {@const open = !collapsed.change}
      <section class="card" data-testid="overview-section" data-entity="change">
        <button class="sec-head" type="button" aria-expanded={open} onclick={() => toggle('change')}>
          <span class="chev" class:open aria-hidden="true"><Icon name="chevron-right" size={11} /></span>
          <span class="sec-dot" style:--dot-h="252" aria-hidden="true"></span>
          <span class="sec-title">{m.entity_changes()}</span>
          <span class="count" data-testid="section-count">{changes.length}</span>
        </button>
        {#if open}
          <div class="sec-body">
            {#if visRepos.length > 1}
              <div class="scope-filter" data-testid="change-scope-filter">
                {#if visRepos.length <= CHIP_THRESHOLD}
                  {#each visRepos as repo (repo)}
                    <span class="scope-chip" title={repo}>
                      <Chip
                        label={repo}
                        onToggle={() => toggleRepo(repo)}
                        selected={(filter.repos ?? []).includes(repo)}
                        testid="repo-chip"
                      />
                    </span>
                  {/each}
                {:else}
                  <div class="scope-picker">
                    <MultiSelect
                      options={repoOptions}
                      values={reposDisplay}
                      onchange={(vals) => {
                        reposDisplay = vals;
                        setFilter({ ...filter, repos: vals.length >= visRepos.length ? [] : vals });
                      }}
                      label={repoTriggerLabel}
                      ariaLabel={m.launcher_lensFilterByRepo()}
                      clearLabel={m.launcher_lensClearFilter()}
                      selectAllLabel={m.common_selectAll()}
                      searchPlaceholder={m.launcher_lensScopeSearch()}
                      variant="chip"
                      testid="repo-select"
                    />
                  </div>
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
                  <button class="row crow" type="button" data-testid="change-row" onclick={() => openItem(t)}>
                    <span class="mono" aria-hidden="true">{monoFor(t.cfg.source)}</span>
                    <span class="crow-body">
                      <span class="row-title-line">
                        <span class="row-title">{t.item.title}</span>
                        {#if t.item.refs?.[0]}
                          <span class="ticket-ref" data-testid="ticket-ref">{t.item.refs[0].label}</span>
                        {/if}
                      </span>
                      <span class="crow-meta">
                        {#if t.item.change}<span class="row-meta">{changeMeta(t.item.change)}</span>{/if}
                        {#if t.item.change}
                          <span class="row-right">
                            {#if ci}
                              <span class="ci" class:hollow={ci.draft} class:ci--passed={ci.tone === 'passed'} class:ci--failing={ci.tone === 'failing'} class:ci--running={ci.tone === 'running'} title={ci.label} aria-hidden="true">{ci.glyph}</span>
                            {/if}
                            <ReviewerRail reviewers={reviewersForRail(t.item.change)} />
                            <Diffstat additions={t.item.change.additions} deletions={t.item.change.deletions} />
                          </span>
                        {/if}
                      </span>
                    </span>
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
          <span class="sec-title">{m.entity_issues()}</span>
          <span class="count" data-testid="section-count">{tickets.length}</span>
        </button>
        {#if open}
          <div class="sec-body">
            {#if visProjects.length > 1}
              <div class="scope-filter" data-testid="issue-scope-filter">
                {#if visProjects.length <= CHIP_THRESHOLD}
                  {#each visProjects as project (project)}
                    <span class="scope-chip" title={project}>
                      <Chip
                        label={project}
                        onToggle={() => toggleProject(project)}
                        selected={(filter.projects ?? []).includes(project)}
                        testid="project-chip"
                      />
                    </span>
                  {/each}
                {:else}
                  <div class="scope-picker">
                    <MultiSelect
                      options={projectOptions}
                      values={projectsDisplay}
                      onchange={(vals) => {
                        projectsDisplay = vals;
                        setFilter({ ...filter, projects: vals.length >= visProjects.length ? [] : vals });
                      }}
                      label={projectTriggerLabel}
                      ariaLabel={m.launcher_lensFilterByProject()}
                      clearLabel={m.launcher_lensClearFilter()}
                      selectAllLabel={m.common_selectAll()}
                      searchPlaceholder={m.launcher_lensScopeSearch()}
                      variant="chip"
                      testid="project-select"
                    />
                  </div>
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
                    <button class="row crow" type="button" data-testid="issue-row" onclick={() => openItem(t)}>
                      <span class="issue-key" aria-hidden="true">{tk.key}</span>
                      <span class="crow-body">
                        <span class="row-title-line">
                          <span class="row-title">{stripKeyPrefix(t.item.title, tk.key)}</span>
                        </span>
                        <span class="crow-meta">
                          <span class="assignee">
                            {#if tk.assignee}
                              <Avatar initials={initialsOf(tk.assignee)} size="sm" title={tk.assignee} />
                              <span class="nm">{tk.assignee}</span>
                            {:else}
                              <span class="assignee-none" aria-hidden="true">?</span>
                              <span class="nm">{m.launcher_lensUnassigned()}</span>
                            {/if}
                          </span>
                          <span class="idot" aria-hidden="true">·</span>
                          <span class="age" class:stale={isStale(tk.updatedAt)}>{relTime(tk.updatedAt)}</span>
                          {#if tk.priority}<span class="row-right"><Chip label={tk.priority} hue={priorityHue(tk.priority)} testid="issue-priority" /></span>{/if}
                        </span>
                      </span>
                    </button>
                  {/if}
                {/each}
              </div>
            {/each}
          </div>
        {/if}
      </section>
    {/if}
  </div>

  <!-- Articles (full width, beneath the board) -->
  {#if articles.length > 0}
    {@const open = !collapsed.article}
    <section class="card" data-testid="overview-section" data-entity="article">
      <button class="sec-head" type="button" aria-expanded={open} onclick={() => toggle('article')}>
        <span class="chev" class:open aria-hidden="true"><Icon name="chevron-right" size={11} /></span>
        <span class="sec-dot" style:--dot-h="150" aria-hidden="true"></span>
        <span class="sec-title">{m.entity_articles()}</span>
        <span class="count" data-testid="section-count">{visArticles.length}</span>
        <!-- i18n-exempt: RSS is a protocol name, not translated -->
        <span class="sec-trail">RSS</span>
      </button>
      {#if open}
        <div class="sec-body">
          <div class="filter-row article-controls">
            {#if visFeeds.length > 1}
              <div class="scope-filter" data-testid="article-scope-filter">
                {#if visFeeds.length <= CHIP_THRESHOLD}
                  {#each visFeeds as feed (feed)}
                    <span class="scope-chip" title={feed}>
                      <Chip
                        label={feed}
                        onToggle={() => toggleFeed(feed)}
                        selected={(filter.feeds ?? []).includes(feed)}
                        testid="feed-chip"
                      />
                    </span>
                  {/each}
                {:else}
                  <div class="scope-picker">
                    <MultiSelect
                      options={feedOptions}
                      values={feedsDisplay}
                      onchange={(vals) => {
                        feedsDisplay = vals;
                        setFilter({ ...filter, feeds: vals.length >= visFeeds.length ? [] : vals });
                      }}
                      label={feedTriggerLabel}
                      ariaLabel={m.launcher_lensFilterByFeed()}
                      clearLabel={m.launcher_lensClearFilter()}
                      selectAllLabel={m.common_selectAll()}
                      searchPlaceholder={m.launcher_lensScopeSearch()}
                      variant="chip"
                      testid="feed-select"
                    />
                  </div>
                {/if}
              </div>
            {/if}
            <button class="chip-btn" class:on={unreadOnly} type="button" onclick={toggleUnreadFilter}>{m.launcher_lensUnread({ count: unreadCount })}</button>
            <span class="seg" role="group" aria-label={m.launcher_lensArticleLayout()}>
              <button class="seg-btn" class:on={articleView === 'grid'} type="button" onclick={() => setArticleLayout('grid')}>{m.launcher_lensGrid()}</button>
              <button class="seg-btn" class:on={articleView === 'list'} type="button" onclick={() => setArticleLayout('list')}>{m.launcher_lensList()}</button>
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

  <!-- Other (untyped fallback, full width) -->
  {#if generic.length > 0}
    {@const open = !collapsed.generic}
    <section class="card" data-testid="overview-section" data-entity="generic">
      <button class="sec-head" type="button" aria-expanded={open} onclick={() => toggle('generic')}>
        <span class="chev" class:open aria-hidden="true"><Icon name="chevron-right" size={11} /></span>
        <span class="sec-dot" style:--dot-h="0" aria-hidden="true"></span>
        <span class="sec-title">{m.entity_other()}</span>
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
    <p class="empty" data-testid="overview-empty">{m.launcher_lensEmpty()}</p>
  {/if}
</div>

<style>
  .overview {
    /* Container so the board's two-column switch tracks the content box, not the
       window (the page may be embedded narrower than the viewport). */
    container-type: inline-size;
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

  /* ── "Waiting on you" lane (the signature) ────────────────────────────────── */
  .lane {
    border-radius: var(--r-2xl);
    /* A faint top wash of the Space hue over the surface, plus the Space hue glow —
       the one place boldness is spent. */
    background:
      linear-gradient(180deg, oklch(0.62 var(--space-chroma, 0.15) var(--space-h, 62) / 0.1), transparent 60%),
      var(--surface);
    border: 1px solid var(--lens-border);
    /* A neutral elevation lift, not a hue-tinted glow: identity already reads through
       the border + top wash above, and a coloured blur at this size read as a muddy
       smudge on the dark substrate (vs. --glow-space-soft used elsewhere, where the
       glow IS the only hue signal, e.g. the launcher overlay card). */
    box-shadow: 0 10px 28px -6px oklch(0.04 0 0 / 0.45);
    overflow: hidden;
  }
  .lane-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 18px 11px;
  }
  .lane-star {
    display: inline-flex;
    color: var(--lens-text);
  }
  .lane-title {
    font-size: 13px;
    font-weight: var(--weight-semibold);
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--lens-text);
  }
  .lane-count {
    padding: 1px 8px;
    border-radius: var(--r-pill);
    background: var(--lens-soft);
    color: var(--lens-text);
    font-size: var(--text-xs);
  }
  .lane-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 0 12px 12px;
  }
  .lane-row {
    appearance: none;
    border: 0;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 10px 12px;
    border-radius: var(--r-lg);
    background: var(--surface-2);
    cursor: pointer;
    text-align: left;
    transition: background var(--motion-fast) var(--ease-standard);
  }
  .lane-row:hover {
    background: var(--hover);
  }
  .lane-row:focus-visible {
    outline: var(--focus-width) solid var(--focus-color);
    outline-offset: var(--focus-offset);
  }
  .lane-row .prov {
    color: var(--text-dim);
  }
  /* The lane is a compact summary, so its title MAY clamp to two lines (the section
     rows below never truncate). */
  .lane-rt {
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .why {
    flex-shrink: 0;
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: var(--weight-semibold);
    color: var(--lens-text);
  }
  .why.danger {
    color: var(--danger);
  }
  .why .arrow {
    transition: transform var(--motion-fast) var(--ease-standard);
  }
  .lane-row:hover .why .arrow {
    transform: translateX(2px);
  }

  /* ── Width-aware board ────────────────────────────────────────────────────── */
  .board {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  /* Two-up only when both Changes and Issues are populated; each column keeps its
     reading measure. Below the container threshold (or single entity), it stacks. */
  .board.two {
    display: grid;
    grid-template-columns: 1fr;
    gap: 18px;
    align-items: start;
  }
  @container (min-width: 1040px) {
    .board.two {
      grid-template-columns: 1fr 1fr;
    }
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
  /* Bounds a single toggle chip's rendered width (2-5 count range) so a long
     repo/project/feed value truncates with an ellipsis instead of stretching the
     row; the wrapping span (not Chip.svelte) carries the cap and the title
     tooltip, since Chip is a shared primitive used elsewhere with short labels. */
  .scope-chip {
    display: inline-flex;
    max-width: 16rem;
  }
  /* The overflow multi-select is a compact dropdown, not a full-width bar — cap it
     (and its popover, which tracks the trigger width) so a short "N selected"
     summary and the option rows don't stretch across the whole card. */
  .scope-picker {
    width: min(22rem, 100%);
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
  /* Filters (feed scope + Unread) cluster on the left; the layout toggle is a
     different kind of control, so it's pushed to the right. */
  .article-controls {
    gap: 8px;
  }
  .article-controls .seg {
    margin-left: auto;
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
    /* The accent "waiting on you" heading. Use the theme-aware, contrast-gated
     * `--accent-heading` token rather than an inline `oklch(var(--accent-text-l) …)`:
     * the raw lightness channel left this label at the dark-theme value (~1.7:1) on
     * the light surface. Gated in contrast.test.ts. */
    color: var(--accent-heading);
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
  }
  /* CI glyph composes the theme-aware status tokens (which carry both-theme
     contrast gates) instead of a hard-coded ~0.82 lightness that washed out on
     light paper; the CI hues map exactly onto the status tokens. */
  .ci--passed {
    color: var(--success);
    background: color-mix(in oklch, var(--success) 18%, transparent);
  }
  .ci--failing {
    color: var(--danger);
    background: color-mix(in oklch, var(--danger) 18%, transparent);
  }
  .ci--running {
    color: var(--warning);
    background: color-mix(in oklch, var(--warning) 18%, transparent);
  }
  /* Draft: a hollow ring (no fill) so the locus reads as "not yet under CI",
     distinguished by shape, not colour alone. */
  .ci.hollow {
    color: var(--text-dim);
    background: none;
    box-shadow: inset 0 0 0 1.5px var(--border);
  }

  /* ── Two-line change / issue rows ─────────────────────────────────────────── */
  /* Title gets a full-width line of its own (wrapping, NEVER truncated — the
     no-truncation guarantee holds); the triage / owner metadata drops to a second
     line. Lets the title breathe in the narrower board column. */
  .crow-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .crow-body .row-title {
    flex: 1;
    min-width: 0;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
    line-height: 1.3;
  }
  .crow-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .crow-meta .row-meta {
    min-width: 0;
  }
  .crow-meta .row-right {
    margin-left: auto;
  }
  /* The leading issue-key rides the TITLE line (not the row's vertical centre), so
     it reads as the title's label rather than floating between the two lines. */
  .crow .issue-key {
    align-self: flex-start;
    line-height: 17px;
  }

  /* Issue meta line: assignee (Avatar + name) · updated age, priority pill right. */
  .assignee {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    font-size: 11px;
    color: var(--text-muted);
  }
  .assignee .nm {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .assignee-none {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: var(--r-pill);
    font-size: 9px;
    color: var(--text-faint);
    box-shadow: inset 0 0 0 1.5px var(--border);
  }
  .idot {
    color: var(--text-faint);
  }
  .age {
    font-size: 11px;
    color: var(--text-faint);
    white-space: nowrap;
  }
  /* Stale (older than the 1-week threshold) warms so an aging ticket stands out. */
  .age.stale {
    color: var(--warning);
  }

  /* ── Articles ─────────────────────────────────────────────────────────────── */
  .article-grid {
    display: grid;
    /* Responsive magazine columns: cards hold a readable ~340px so a wide window
       yields several quiet cards rather than two billboard-sized hero images
       (the 16:9 thumb then lands ~340×190, supporting the headline, not dwarfing
       it). Narrow widths collapse to a single column. */
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
    gap: 11px;
  }
  .article-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
    /* List is a full-width single column — its rows span the content measure like
       the section header and controls above them (Grid is the multi-column browse
       view, so the two still don't duplicate). */
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
    /* Quiet at rest: dimmed + desaturated so loud feed images don't break the
       "quiet magazine" calm; wakes to full colour on hover/focus. */
    opacity: 0.62;
    filter: saturate(0.7);
    transition:
      opacity var(--motion-base) var(--ease-standard),
      filter var(--motion-base) var(--ease-standard);
  }
  .art-open:hover .art-thumb,
  .art-open:focus-visible .art-thumb {
    opacity: 1;
    filter: saturate(1);
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
    opacity: 0.45;
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
    line-clamp: 2;
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
    line-clamp: 2;
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
    .chev,
    .art-thumb,
    .why .arrow {
      transition: none;
    }
  }
</style>
