<script lang="ts">
import Chip from '../../ui/Chip.svelte';
import Select from '../../ui/Select.svelte';

// LensFilterBar (review-lens, D7): the review queue's source + repo facets.
// Presentational — the active filter is page-local ephemeral state owned by
// ReviewQueue, threaded here as props + change callbacks. ReviewQueue renders
// this ONLY when the lens spans more than one source.
interface SourceFacet {
  /** `${provider}:${host}` — stable identity (two hosts never merge). */
  key: string;
  /** The host shown on the chip. */
  label: string;
  count: number;
}
interface RepoFacet {
  repo: string;
  count: number;
}

interface Props {
  sources: SourceFacet[];
  /** Repo facets scoped to the active source (empty when "All" is active). */
  repos: RepoFacet[];
  /** Total changes across all sources (the "All" chip count). */
  totalCount: number;
  /** Active source key, or `null` for "All". */
  activeSource: string | null;
  /** Active repo slug, or `null` for all repos within the active source. */
  activeRepo: string | null;
  onSelectSource: (key: string | null) => void;
  onSelectRepo: (repo: string | null) => void;
}

const {
  sources,
  repos,
  totalCount,
  activeSource,
  activeRepo,
  onSelectSource,
  onSelectRepo,
}: Props = $props();

// Past this many distinct repos the chip row would crowd the bar, so it folds
// into a Select (D7).
const REPO_CHIP_THRESHOLD = 5;
</script>

<div class="filterbar" role="group" aria-label="Filter by source" data-testid="lens-filterbar">
  <Chip
    label={`All ${totalCount}`}
    onToggle={() => onSelectSource(null)}
    selected={activeSource === null}
    testid="filter-source-all"
  />
  {#each sources as s (s.key)}
    <Chip
      label={`${s.label} ${s.count}`}
      onToggle={() => onSelectSource(s.key)}
      selected={activeSource === s.key}
      testid={`filter-source:${s.key}`}
    />
  {/each}
</div>

{#if activeSource !== null && repos.length > 0}
  <div class="filterbar repos" role="group" aria-label="Filter by repository">
    {#if repos.length <= REPO_CHIP_THRESHOLD}
      <Chip
        label="All repos"
        onToggle={() => onSelectRepo(null)}
        selected={activeRepo === null}
        testid="filter-repo-all"
      />
      {#each repos as r (r.repo)}
        <Chip
          label={`${r.repo} ${r.count}`}
          onToggle={() => onSelectRepo(r.repo)}
          selected={activeRepo === r.repo}
          testid={`filter-repo:${r.repo}`}
        />
      {/each}
    {:else}
      <Select
        options={[
          { value: '', label: 'All repos' },
          ...repos.map((r) => ({ value: r.repo, label: `${r.repo} (${r.count})` })),
        ]}
        value={activeRepo ?? ''}
        onchange={(v) => onSelectRepo(v === '' ? null : v)}
        ariaLabel="Filter by repository"
        testid="filter-repo-select"
      />
    {/if}
  </div>
{/if}

<style>
  .filterbar {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
  }
  .filterbar.repos {
    margin-top: var(--space-2);
  }
</style>
