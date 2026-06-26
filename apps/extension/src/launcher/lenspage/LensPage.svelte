<script lang="ts">
import { onMount } from 'svelte';
import { onStateBroadcast } from '../../shared/messages';
import type { Tint } from '../../shared/settings';
import {
  colourToOklch,
  colourToOn,
  DEFAULT_HUE,
  DEFAULT_L,
  DEFAULT_ON,
  SPACE_CHROMA,
} from '../../shared/space-hue';
import type { AppState, PinNode, Space, SpaceId } from '../../shared/types';
import '@lunma/tokens/tokens.css';
import '@lunma/tokens/fonts.css';
import '@lunma/tokens/recipes.css';
import './lenspage.css';
import Aurora from '../../ui/Aurora.svelte';
import Icon from '../../ui/Icon.svelte';
import GeneralLens from './GeneralLens.svelte';
import ReviewQueue from './ReviewQueue.svelte';

type LensNode = Extract<PinNode, { kind: 'lens' }>;

interface Props {
  /** This tab's window, resolved by `main.ts` via `chrome.windows.getCurrent`. */
  windowId: number;
  /** The target folder, from `?folderId=…`. Null when the param is missing. */
  folderId?: string | null;
  /** SW snapshot seed; null on a cold start until the first broadcast lands. */
  initialState?: AppState | null;
  /** Colour-intensity level, mirrored onto `data-tint` + the `<Aurora>` backdrop. */
  tint?: Tint;
}

const { windowId, folderId = null, initialState = null, tint = 'vivid' }: Props = $props();

// Read-only mirror of SW state — the sidebar/new-tab consumer pattern. NOT named
// `state` (collides with the `$state` rune). `appState` prefers the live broadcast.
let liveState = $state<AppState | null>(null);
const appState = $derived<AppState | null>(liveState ?? initialState);

onMount(() => {
  // Read-only live mirror. A host-permission grant from the needs-access
  // affordance flips a section in the SW, which re-polls and re-broadcasts on its
  // own — this subscription picks that up, so the page needs no permissions hook.
  const unsubscribe = onStateBroadcast((msg) => {
    liveState = msg.state;
  });
  return unsubscribe;
});

// Locate the folder + its owning Space (the page only has folderId from the URL).
// The page tints to the FOLDER'S Space — its identity — not the window's active
// Space; opening items needs that same owning spaceId.
const located = $derived.by<{ spaceId: SpaceId; node: LensNode } | null>(() => {
  if (!appState || folderId === null) return null;
  for (const [spaceId, nodes] of Object.entries(appState.pinnedBySpace)) {
    const node = nodes.find((n): n is LensNode => n.kind === 'lens' && n.id === folderId);
    if (node) return { spaceId, node };
  }
  return null;
});

const node = $derived(located?.node ?? null);
const spaceId = $derived(located?.spaceId ?? null);
const space = $derived<Space | null>(
  spaceId === null ? null : (appState?.spaces.find((s) => s.id === spaceId) ?? null),
);

// Space colour → the scoped OKLCH hue vars the aurora/hearth/glass read.
const activeOklch = $derived(space ? colourToOklch(space.color) : null);
const spaceHue = $derived(activeOklch?.h ?? DEFAULT_HUE);
const spaceChroma = $derived(activeOklch?.c ?? SPACE_CHROMA);
const spaceL = $derived(activeOklch?.l ?? DEFAULT_L);
const spaceOn = $derived(space ? colourToOn(space.color) : DEFAULT_ON);

// The browser tab title (smart-folder-page): the folder's name when resolved,
// so the Chrome tab strip reads "Feeds" instead of the static fallback.
const pageTitle = $derived(node ? `${node.name} · Lunma` : 'Lens · Lunma');
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<main
  class="lenspage lunma-space-scope"
  data-testid="lenspage-root"
  data-tint={tint}
  style:--space-h={String(spaceHue)}
  style:--space-chroma={String(spaceChroma)}
  style:--space-l={String(spaceL)}
  style:--space-on={spaceOn}
>
  <Aurora intensity={tint} />
  <div class="hearth" aria-hidden="true"></div>

  <div class="stage">
    {#if located === null || appState === null}
      <!-- Calm neutral state: no folderId, or the folder isn't in state (yet, or
           deleted). Never an error card. -->
      <section class="missing" data-testid="lenspage-missing">
        <Icon name="layers" size={40} color="var(--text-dim)" />
        <h1 class="missing-title">No lens to show</h1>
        <p class="missing-copy">
          This page didn't get a folder to open, or that folder is no longer around.
        </p>
      </section>
    {:else if located.node.lensKind === 'review'}
      <!-- The typed Review lens renders the triage queue archetype (review-lens, D3). -->
      <ReviewQueue node={located.node} spaceId={located.spaceId} {appState} {windowId} />
    {:else}
      <!-- Every other (general) lens renders the generic section grid, unchanged. -->
      <GeneralLens node={located.node} spaceId={located.spaceId} {appState} {windowId} />
    {/if}
  </div>
</main>
