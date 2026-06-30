<script lang="ts" module>
export type Entity = 'change' | 'ticket' | 'article';
</script>

<script lang="ts">
import Icon from './Icon.svelte';

// EntityBadge (lens-overview board): the immediate entity-type signal used by the
// "Waiting on you" lane, where Changes and Issues are mixed. A distinct glyph
// (pull-request / issue-dot / article) over the entity's section-dot hue (change
// 252 / ticket 295 / article 150). Shape carries the meaning for colour-blind
// readers; the hue reinforces. Reads tokens only (visual-system contract):
// the theme-aware `--accent-text-l` / `--accent-fill-a` accent recipe, so it stays
// legible in dark AND light at every Colour-intensity level.
interface Props {
  /** Which entity the badged row represents. */
  entity: Entity;
  /** `data-testid` for the badge. Default `'entity-badge'`. */
  testid?: string | undefined;
}

const { entity, testid = 'entity-badge' }: Props = $props();

const GLYPH: Record<Entity, string> = {
  change: 'git-pull-request',
  ticket: 'circle-dot',
  article: 'newspaper',
};
const HUE: Record<Entity, number> = { change: 252, ticket: 295, article: 150 };
</script>

<span
  class="entity-badge"
  data-entity={entity}
  data-testid={testid}
  style:--ent-h={String(HUE[entity])}
  aria-hidden="true"
><Icon name={GLYPH[entity]} size={14} /></span>

<style>
  .entity-badge {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: var(--r-md);
    color: oklch(var(--accent-text-l) 0.11 var(--ent-h));
    background: oklch(0.55 0.13 var(--ent-h) / var(--accent-fill-a));
  }
</style>
