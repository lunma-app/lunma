<script lang="ts">
import type { LensEntity, LensFilter } from '../../shared/types';
import Chip from '../../ui/Chip.svelte';
import Divider from '../../ui/Divider.svelte';
import IconButton from '../../ui/IconButton.svelte';
import type { SelectOption } from '../../ui/Select.svelte';
import Select from '../../ui/Select.svelte';

// LensFilterBar (lens-view-filters): persistent per-lens filter bar rendered on
// the overview between the identity row and the first section. Type facets first
// (Changes / Issues / Articles / Other as Chip toggle pills), a Divider, then
// scope facets (repos for Changes, projects for Issues — Chips up to 5, Select
// past that). A Clear IconButton appears only when a filter is active.
interface Props {
  /** The currently persisted filter (from node.filter ?? {}). */
  filter: LensFilter;
  /** Present facets derived from the lens's currently-held items. */
  facets: { entities: LensEntity[]; repos: string[]; projects: string[] };
  /** Called on every toggle or clear — caller dispatches setLensFilter. */
  onfilter: (filter: LensFilter) => void;
}

const { filter, facets, onfilter }: Props = $props();

const ENTITY_LABEL: Record<LensEntity, string> = {
  change: 'Changes',
  ticket: 'Issues',
  article: 'Articles',
  generic: 'Other',
};

// Union of present + selected so a selected-but-absent value stays clearable.
const visEntities = $derived([
  ...new Set([...facets.entities, ...(filter.entities ?? [])]),
] as LensEntity[]);
const visRepos = $derived([...new Set([...facets.repos, ...(filter.repos ?? [])])]);
const visProjects = $derived([...new Set([...facets.projects, ...(filter.projects ?? [])])]);

const hasTypeFacets = $derived(visEntities.length > 1);
const hasScopeFacets = $derived(visRepos.length > 0 || visProjects.length > 0);
const isActive = $derived(
  (filter.entities?.length ?? 0) > 0 ||
    (filter.repos?.length ?? 0) > 0 ||
    (filter.projects?.length ?? 0) > 0,
);

// Repos/projects past the threshold use a single-select Select instead of Chips.
const CHIP_THRESHOLD = 5;

// Select options for overflow repos (single-select).
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

function toggleEntity(e: LensEntity): void {
  const current = filter.entities ?? [];
  const next = current.includes(e) ? current.filter((x) => x !== e) : [...current, e];
  onfilter({ ...filter, entities: next });
}

function toggleRepo(r: string): void {
  const current = filter.repos ?? [];
  const next = current.includes(r) ? current.filter((x) => x !== r) : [...current, r];
  onfilter({ ...filter, repos: next });
}

function toggleProject(p: string): void {
  const current = filter.projects ?? [];
  const next = current.includes(p) ? current.filter((x) => x !== p) : [...current, p];
  onfilter({ ...filter, projects: next });
}

function onRepoSelectChange(value: string): void {
  onfilter({ ...filter, repos: value === 'all' ? [] : [value] });
}

function onProjectSelectChange(value: string): void {
  onfilter({ ...filter, projects: value === 'all' ? [] : [value] });
}

function clear(): void {
  onfilter({});
}
</script>

{#if hasTypeFacets || hasScopeFacets}
  <div class="filter-bar" data-testid="lens-filter-bar">
    {#if hasTypeFacets}
      <div class="facet-group" data-testid="entity-facets">
        {#each visEntities as entity (entity)}
          <Chip
            label={ENTITY_LABEL[entity]}
            onToggle={() => toggleEntity(entity)}
            selected={(filter.entities ?? []).includes(entity)}
            testid="entity-chip-{entity}"
          />
        {/each}
      </div>
    {/if}

    {#if hasTypeFacets && hasScopeFacets}
      <Divider />
    {/if}

    {#if hasScopeFacets}
      <div class="facet-group" data-testid="scope-facets">
        {#if visRepos.length > 0}
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
        {/if}

        {#if visProjects.length > 0}
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
        {/if}
      </div>
    {/if}

    {#if isActive}
      <IconButton
        icon="x"
        onclick={clear}
        title="Clear filter"
        ariaLabel="Clear filter"
        testid="filter-clear"
      />
    {/if}
  </div>
{/if}

<style>
  .filter-bar {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: 0 var(--space-4) var(--space-2);
    flex-wrap: wrap;
  }

  .facet-group {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    flex-wrap: wrap;
  }
</style>
