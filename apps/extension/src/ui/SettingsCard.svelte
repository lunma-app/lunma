<script lang="ts">
import type { Snippet } from 'svelte';
import CardHeading from './CardHeading.svelte';
import Surface from './Surface.svelte';

/**
 * The shared options-card scaffold: a glass `Surface` + the card's inner padding
 * + a serif `CardHeading` + an optional muted lead `description`, with a
 * `children` slot for the body. Every options card composes it instead of
 * re-rolling the glass panel / heading / lead, so the chrome is defined once and
 * the cards stay consistent. Token-only.
 */
interface Props {
  /** The card heading text, rendered via the shared `CardHeading`. */
  heading: string;
  /** Anchor id for deep-linking (e.g. `connectors` → `#connectors`). */
  id?: string | undefined;
  /** `data-testid` for the card's inner `<section>`. */
  testid?: string | undefined;
  /** `data-testid` forwarded onto the `CardHeading`'s `<h2>`. */
  headingTestid?: string | undefined;
  /** Optional muted lead paragraph beneath the heading. */
  description?: string | undefined;
  /** Optional control(s) on the heading row (e.g. Recently archived's Clear all). */
  actions?: Snippet | undefined;
  /** The card body. */
  children: Snippet;
}

const { heading, id, testid, headingTestid, description, actions, children }: Props = $props();
</script>

<Surface variant="glass">
  <section class="settings-card" {id} data-testid={testid}>
    <div class="settings-card-heading">
      <CardHeading {heading} {actions} testid={headingTestid} />
    </div>
    {#if description}
      <p class="settings-card-description">{description}</p>
    {/if}
    {@render children()}
  </section>
</Surface>

<style>
  /* The Surface owns the card chrome; the section owns the internal padding. */
  .settings-card {
    padding: var(--space-4) var(--space-5);
  }
  /* Heading → body rhythm (matches the registry/Backup/Feed `--space-4` margin). */
  .settings-card-heading {
    margin-bottom: var(--space-4);
  }
  .settings-card-description {
    margin: 0 0 var(--space-4);
    font: var(--weight-regular) var(--text-sm) / 1.45 var(--font-sans);
    color: var(--text-muted);
  }
</style>
