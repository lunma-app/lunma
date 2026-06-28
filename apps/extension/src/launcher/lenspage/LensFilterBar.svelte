<script lang="ts">
import { m } from '../../shared/paraglide/messages';
import type { LensEntity, LensFilter } from '../../shared/types';
import Chip from '../../ui/Chip.svelte';
import IconButton from '../../ui/IconButton.svelte';

// LensFilterBar: entity-type chips (Changes / Issues / Articles / Other) +
// a Clear button when any filter is active. Scope filters (repos / projects)
// live inside their respective entity cards in OverviewPage, not here.
interface Props {
  filter: LensFilter;
  facets: { entities: LensEntity[]; repos: string[]; projects: string[] };
  onfilter: (filter: LensFilter) => void;
}

const { filter, facets, onfilter }: Props = $props();

const ENTITY_LABEL: Record<LensEntity, string> = {
  change: 'Changes',
  ticket: 'Issues',
  article: 'Articles',
  generic: 'Other',
};

// Union of present + selected (D6) so absent-but-selected types stay clearable.
const visEntities = $derived([
  ...new Set([...facets.entities, ...(filter.entities ?? [])]),
] as LensEntity[]);

const hasTypeFacets = $derived(visEntities.length > 1);
// The clear (×) sits at the END of the type-facet row, shown only while a filter is
// active. It is intentionally NOT rendered on its own: a lens with no type facets
// shows no bar at all, so selecting a scope value never pops an orphaned × in (which
// caused a reflow and read as a stray control). Scope-only filtering is cleared via
// the scope control's own Clear (the chip row toggles, or the MultiSelect's Clear).
const isActive = $derived(
  (filter.entities?.length ?? 0) > 0 ||
    (filter.repos?.length ?? 0) > 0 ||
    (filter.projects?.length ?? 0) > 0 ||
    (filter.feeds?.length ?? 0) > 0,
);

function toggleEntity(e: LensEntity): void {
  const current = filter.entities ?? [];
  const next = current.includes(e) ? current.filter((x) => x !== e) : [...current, e];
  onfilter({ ...filter, entities: next });
}

function clear(): void {
  onfilter({});
}
</script>

{#if hasTypeFacets}
  <div class="filter-bar" data-testid="lens-filter-bar">
    {#if hasTypeFacets}
      {#each visEntities as entity (entity)}
        <Chip
          label={ENTITY_LABEL[entity]}
          onToggle={() => toggleEntity(entity)}
          selected={(filter.entities ?? []).includes(entity)}
          testid="entity-chip-{entity}"
        />
      {/each}
    {/if}
    {#if isActive}
      <IconButton
        icon="x"
        onclick={clear}
        title={m.launcher_lensClearFilter()}
        ariaLabel={m.launcher_lensClearFilter()}
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
</style>
