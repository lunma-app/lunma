<script lang="ts">
import type { Snippet } from 'svelte';

/**
 * The shared options-card heading — the editorial `<h2>` set in the display
 * serif at `--text-xl` in sentence case, carrying the identity-hue override under
 * the `standard`/`vivid` tints. Defined once so the registry setting-groups and
 * the standalone management cards (Backup, Feeds, Recently archived, Connectors,
 * Result sources) cannot drift apart (one card's heading had already regressed to
 * the retired uppercase micro-label). Token-only — no raw font sizes or colours.
 *
 * A heading whose row shares space with an action (e.g. Recently archived's
 * "Clear all") passes that control through the `actions` snippet, so the card
 * composes this primitive instead of re-rolling its own `<h2>`.
 */
interface Props {
  /** The card heading text (sentence case — the registry stores names this way). */
  heading: string;
  /** Optional control(s) rendered on the heading row, to the heading's right. */
  actions?: Snippet | undefined;
  /** `data-testid` passthrough for the `<h2>`. */
  testid?: string | undefined;
}

const { heading, actions, testid }: Props = $props();
</script>

{#if actions}
  <div class="card-heading-row">
    <h2 class="card-heading" data-testid={testid}>{heading}</h2>
    <div class="card-heading-actions">{@render actions()}</div>
  </div>
{:else}
  <h2 class="card-heading" data-testid={testid}>{heading}</h2>
{/if}

<style>
  /* Editorial hierarchy: identity in the display serif at `--text-xl`, sentence
   * case, in the cool editorial accent (`--accent-heading`) — the redesign's
   * section-card heading colour, fixed across Spaces and themed dark/light by the
   * token. Serif carries identity; the sans body and controls carry information. */
  .card-heading {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: var(--weight-regular);
    line-height: 1.1;
    color: var(--accent-heading);
  }

  /* When the heading shares its row with an action, the two sit on one line with
   * the action pushed to the trailing edge. */
  .card-heading-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
  }
  .card-heading-actions {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }
</style>
