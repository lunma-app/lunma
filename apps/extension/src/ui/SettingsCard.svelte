<script lang="ts">
import type { Snippet } from 'svelte';
import CardHeading from './CardHeading.svelte';
import Surface from './Surface.svelte';

/**
 * The shared options-card scaffold: the redesign's solid `section` `Surface` + a
 * serif `CardHeading` + an optional muted lead `description`, with a `children`
 * slot for the body. Every options card composes it instead of re-rolling the
 * panel / heading / lead, so the chrome is defined once and the cards stay
 * consistent. Token-only.
 *
 * `flush` switches to the comp's full-bleed layout: the body has no horizontal
 * padding, so its rows own their own `--space-5` inset and edge-to-edge
 * `border-top` dividers reach the card's rounded corners (clipped by the
 * Surface). The hero sections (Connections, Look & feel, Backup) set it; the
 * smaller management cards keep the default inset body.
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
  /** Full-bleed body: rows own their inset + dividers reach the card edges. */
  flush?: boolean | undefined;
  /** The card body. */
  children: Snippet;
}

const {
  heading,
  id,
  testid,
  headingTestid,
  description,
  actions,
  flush = false,
  children,
}: Props = $props();
</script>

<Surface variant="section" radius="2xl">
  <section class="settings-card" class:flush {id} data-testid={testid}>
    <div class="settings-card-head">
      <CardHeading {heading} {actions} testid={headingTestid} />
      {#if description}
        <p class="settings-card-description">{description}</p>
      {/if}
    </div>
    {@render children()}
  </section>
</Surface>

<style>
  /* Default (inset) layout: the section owns the internal padding on all sides. */
  .settings-card:not(.flush) {
    padding: var(--space-4) var(--space-5);
  }
  .settings-card:not(.flush) .settings-card-head {
    margin-bottom: var(--space-4);
  }
  /* Flush layout (comp): the head carries the card's inset; the body is full-bleed
   * so its rows align their own `--space-5` and dividers meet the corners. */
  .settings-card.flush .settings-card-head {
    padding: var(--space-5) var(--space-5) var(--space-4);
  }
  .settings-card-description {
    margin: var(--space-2) 0 0;
    font: var(--weight-regular) var(--text-sm) / 1.45 var(--font-sans);
    color: var(--text-muted);
    max-width: 54ch;
  }
</style>
