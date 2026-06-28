<script lang="ts">
import { onMount } from 'svelte';
import { dispatch } from '../../shared/bus';
import { onStateBroadcast } from '../../shared/messages';
import type { Tint } from '../../shared/settings';
import { colourToOklch, DEFAULT_HUE, DEFAULT_L, SPACE_CHROMA } from '../../shared/space-hue';
import type { AppState, LensItem, PinNode, SpaceId } from '../../shared/types';
import '@lunma/tokens/tokens.css';
import '@lunma/tokens/fonts.css';
import '@lunma/tokens/recipes.css';
import { applyLensFilter, deriveLensFacets } from '../../shared/lens-filter';
import { m } from '../../shared/paraglide/messages';
import type { LensFilter } from '../../shared/types';
import Aurora from '../../ui/Aurora.svelte';
import Icon from '../../ui/Icon.svelte';
import OverviewPage from './OverviewPage.svelte';
import {
  bucketByEntity,
  collectItems,
  feedLabel,
  hostOf,
  type LensNode,
  resolveRefs,
  sourceKey,
  type Tagged,
} from './overview-vm';

// LensPage (lens-overview): the SINGLE-lens page. Lunma's side panel is the lens
// navigation (Spaces + the lens tree); this page renders the ONE lens its
// `?folderId` opened as a single collapsible inline overview (the redesign
// handoff's model — Changes → Issues → Articles, no drill-down sub-pages).
// Switching lenses is the sidebar's job, not a second rail here. The page tints
// `--lens-h` to the lens's owning-Space hue. Theme is applied globally by
// `main.ts` from the setting (no in-page toggle).
interface Props {
  /** This tab's window, resolved by `main.ts`. */
  windowId: number;
  /** The lens to render, from `?folderId=…`. Null → the calm missing state. */
  folderId?: string | null;
  /** SW snapshot seed; null until the first broadcast lands. */
  initialState?: AppState | null;
  /** Colour-intensity level, from `main.ts` (the `tint` setting; default `vivid`,
   * mirroring the new-tab home). Drives the `<Aurora intensity>` backdrop opacity,
   * captured at first paint; `main.ts` toggles `data-show-glares` live to hide the
   * aurora when the atmosphere glow is switched off. */
  tint?: Tint;
}

const { windowId, folderId = null, initialState = null, tint = 'vivid' }: Props = $props();

let liveState = $state<AppState | null>(null);
const appState = $derived<AppState | null>(liveState ?? initialState);

onMount(() => onStateBroadcast((msg) => (liveState = msg.state)));

function isLens(n: PinNode): n is LensNode {
  return n.kind === 'lens';
}

// Locate the lens + its owning Space (the page tints to the lens's identity hue,
// and opening items needs that owning spaceId).
const located = $derived.by<{ spaceId: SpaceId; node: LensNode } | null>(() => {
  if (!appState || folderId === null) return null;
  for (const [spaceId, nodes] of Object.entries(appState.pinnedBySpace)) {
    const node = nodes.find((n): n is LensNode => isLens(n) && n.id === folderId);
    if (node) return { spaceId, node };
  }
  return null;
});

const node = $derived(located?.node ?? null);
// The lens's owning-Space colour in canonical OKLCH — drives `--lens-h` (the
// identity hue) AND the aurora's `--space-l`/`--space-chroma`/`--space-h`, so the
// ambient backdrop recolours with the lens's Space (a `gray` Space washes neutral).
// Falls back to the resting ember when the lens/Space is unresolved.
const activeOklch = $derived.by(() => {
  if (!located || !appState) return null;
  const space = appState.spaces.find((s) => s.id === located.spaceId);
  return space ? colourToOklch(space.color) : null;
});
const spaceHue = $derived(activeOklch?.h ?? DEFAULT_HUE);
const spaceChroma = $derived(activeOklch?.c ?? SPACE_CHROMA);
const spaceL = $derived(activeOklch?.l ?? DEFAULT_L);

// Last-known items per section (lens-overview, mirrors the sidebar's
// `heldItemsBySection`). A re-fetch flips a section to `'pending'` with its items
// cleared; without holding, the overview would blank + flicker (and a click would
// miss) on every refresh — and on SW wake the runtime is empty until the refetch
// lands. Updated whenever a section is `'ok'` (or carries items).
let heldItemsBySection = $state<Record<string, LensItem[]>>({});
$effect(() => {
  if (!node || !appState) return;
  for (const cfg of resolveRefs(node, appState.sources)) {
    const sk = sourceKey(cfg);
    const rt = appState.lenses[node.id]?.sections[sk];
    if ((rt?.items.length ?? 0) > 0 || rt?.state === 'ok') {
      heldItemsBySection[sk] = rt?.items ?? [];
    }
  }
});

// Derived overview model for the lens (never stored).
const tagged = $derived(node && appState ? collectItems(node, appState, heldItemsBySection) : []);
// Facets from all currently-held items (unfiltered) for the LensFilterBar.
const allRows = $derived(
  tagged.map((t) => ({ item: t.item, host: hostOf(t.cfg.baseUrl), feedName: feedLabel(t) })),
);
const facets = $derived(deriveLensFacets(allRows));
const readSet = $derived(new Set(node && appState ? (appState.lensReadState[node.id] ?? []) : []));

const PROVIDER_NAME = { github: 'GitHub', gitlab: 'GitLab', jira: 'Jira', rss: 'Feeds' } as const;
const lensSub = $derived.by(() => {
  if (!node || !appState) return '';
  const provs = [
    ...new Set(node.sources.map((r) => appState.sources[r.sourceId]?.provider).filter((p) => p)),
  ] as (keyof typeof PROVIDER_NAME)[];
  if (provs.length === 0) return m.launcher_lensNoConnections();
  if (provs.length === 1 && provs[0] === 'rss') return m.launcher_lensFeedsSubtitle();
  const names = provs.map((p) => PROVIDER_NAME[p]);
  return names.length === 1
    ? (names[0] ?? '')
    : `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
});

const pageTitle = $derived(node ? `${node.name} · Lunma` : 'Lens · Lunma');

function openItem(t: Tagged): void {
  if (!node || !located) return;
  dispatch({
    kind: 'openLensItem',
    payload: {
      spaceId: located.spaceId,
      folderId: node.id,
      itemId: `${t.sk}:${t.item.id}`,
      windowId,
      fromPage: true,
    },
  });
}

// Toggle an article's read state (the overview's mail/open-mail control).
function toggleRead(t: Tagged, makeRead: boolean): void {
  if (!node) return;
  dispatch({
    kind: makeRead ? 'markLensItemRead' : 'markLensItemUnread',
    payload: { folderId: node.id, itemId: `${t.sk}:${t.item.id}` },
  });
}

function setFilter(filter: LensFilter): void {
  if (!located || !node) return;
  dispatch({
    kind: 'setLensFilter',
    payload: { spaceId: located.spaceId, folderId: node.id, filter },
  });
}
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<div
  class="lenspage"
  data-testid="lenspage-root"
  data-tint={tint}
  style:--lens-h={String(spaceHue)}
  style:--space-h={String(spaceHue)}
  style:--space-chroma={String(spaceChroma)}
  style:--space-l={String(spaceL)}
>
  <!-- Immersive backdrop: the lens's Space colour as a drifting aurora, intensity
       tracking the tint level. aria-hidden, never interactive. `main.ts` sets
       `data-show-glares` to hide it when the atmosphere glow is off. -->
  <Aurora intensity={tint} />

  <main class="main">
    {#if node === null || appState === null}
      <section class="missing" data-testid="lenspage-missing">
        <Icon name="layers" size={40} color="var(--text-dim)" />
        <h1 class="missing-title">{m.launcher_lensMissingTitle()}</h1>
        <p class="missing-copy">
          {m.launcher_lensMissingCopy()}
        </p>
      </section>
    {:else}
      <OverviewPage {node} {tagged} {facets} {lensSub} {readSet} {openItem} {toggleRead} {setFilter} />
    {/if}
  </main>
</div>

<style>
  .lenspage {
    position: relative;
    isolation: isolate;
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-sans);
    font-size: var(--text-md);
    line-height: 1.5;
  }

  /* Atmosphere glow off (`showGlares: false`, set live by `main.ts`): the aurora
     intensity is captured at first paint and can't update live, so CSS is the
     toggle path — mirrors the new-tab home. Fully `:global` because the
     `data-show-glares` attribute is set on the root externally (not in this
     template) and `.aurora` lives in the child Aurora component. */
  :global(.lenspage[data-show-glares='false'] .aurora) {
    display: none;
  }

  .main {
    position: relative;
    /* Above the ambient aurora (`--z-base`), like the new-tab `.stage`. */
    z-index: var(--z-raised);
    width: 100%;
    /* Responsive: fills the viewport (minus a small gutter) up to a 1080px cap, so
       the overview breathes on wide screens (the article grid gains columns) while
       single-column change/issue lists keep a sane measure. */
    max-width: min(94vw, 1080px);
    margin: 0 auto;
    padding: 34px 28px 80px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .missing {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-6) var(--space-4);
    text-align: center;
  }
  .missing-title {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: var(--weight-regular);
    color: var(--text);
  }
  .missing-copy {
    margin: 0;
    max-width: 40ch;
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
</style>
