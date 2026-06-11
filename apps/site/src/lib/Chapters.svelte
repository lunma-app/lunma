<script lang="ts">
import Chapter from '$lib/Chapter.svelte';
import { FAV } from '$lib/mocks/apps';
import FaviconGrid from '$lib/mocks/FaviconGrid.svelte';
import LauncherMock from '$lib/mocks/LauncherMock.svelte';
import SpaceHeader from '$lib/mocks/SpaceHeader.svelte';
import TabRowMock from '$lib/mocks/TabRowMock.svelte';
</script>

<Chapter index={1} id="launcher" kicker="Launcher" title="Search everything from Alt+L." layout="left">
  {#snippet copy()}
    <p>
      One overlay searches your open tabs, bookmarks, and history — from any page
      or the new-tab page. Type a few letters and press Enter. It also runs a web
      search, and Tab locks the query to a specific engine.
    </p>
  {/snippet}
  {#snippet visual()}
    <LauncherMock
      query="figma"
      caret
      results={[
        { title: 'Figma — product redesign', fav: FAV.figma, kind: 'open tab', selected: true },
        { title: 'Figma community', fav: FAV.figma, kind: 'bookmark' },
        { title: 'figma keyboard shortcuts', fav: FAV.docs, kind: 'history' },
      ]}
    />
  {/snippet}
</Chapter>

<Chapter index={2} kicker="Spaces" title="Group tabs into colour-coded Spaces." layout="right">
  {#snippet copy()}
    <p>
      Make a Space for each project or context. Each one keeps its own tabs, in
      the order you set, and has a colour from a nine-colour palette. Switch
      Spaces and the sidebar shows only that Space's tabs and recolours to match.
    </p>
    <p class="fine">
      A colour-intensity setting (subtle, standard, vivid) dials the tint up or
      down. Reduced motion is honoured throughout.
    </p>
  {/snippet}
  {#snippet visual()}
    <!-- A "Design" Space pinned to the canonical purple palette colour (sourced
         from the @lunma/tokens --space-purple-* tokens, not hand-copied). -->
    <div
      class="space-panel lunma-space-scope"
      style="--space-h: var(--space-purple-h); --space-l: var(--space-purple-l); --space-chroma: var(--space-purple-c); --space-on: var(--space-purple-on)"
    >
      <SpaceHeader icon="✦" name="Design" />
      <FaviconGrid items={[FAV.figma, FAV.linear, FAV.notes, FAV.reader]} size={36} columns={4} />
      <TabRowMock title="Figma — product redesign" fav={FAV.figma} active />
      <TabRowMock title="Linear — this cycle" fav={FAV.linear} />
      <TabRowMock title="Moodboard — references" fav={FAV.reader} drifted />
    </div>
  {/snippet}
</Chapter>

<Chapter index={3} kicker="Auto-archive" title="Idle tabs archive themselves." layout="left">
  {#snippet copy()}
    <p>
      Tabs you didn't pin move to an archive once they've sat idle past a
      threshold you set. Nothing is deleted — the archive keeps them, and you can
      restore any of them later. Your tab list stays short on its own.
    </p>
  {/snippet}
  {#snippet visual()}
    <!-- A "Work" Space pinned to the canonical blue palette colour (sourced from
         the @lunma/tokens --space-blue-* tokens, not hand-copied). -->
    <div
      class="list-panel lunma-space-scope"
      style="--space-h: var(--space-blue-h); --space-l: var(--space-blue-l); --space-chroma: var(--space-blue-c); --space-on: var(--space-blue-on)"
    >
      <TabRowMock title="Spec — draft v3" fav={FAV.docs} active />
      <TabRowMock title="This cycle's plan" fav={FAV.linear} />
      <div class="rule"></div>
      <TabRowMock title="How OKLCH works" fav={FAV.docs} fading />
      <TabRowMock title="A long read from lunch" fav={FAV.reader} fading meta="archiving…" />
      <TabRowMock title="14 tabs you finished with" fav={FAV.cloud} fading meta="archived" />
    </div>
  {/snippet}
</Chapter>

<Chapter index={4} kicker="Favourites" title="Favourites, one click away in every Space." layout="wide">
  {#snippet copy()}
    <p>
      Drag the sites you open all the time up to the favourites row at the top of
      the sidebar — they stay there in every Space. Favourites and pinned tabs are
      ordinary browser bookmarks underneath, so they sync across your devices and
      survive restarts.
    </p>
  {/snippet}
  {#snippet visual()}
    <FaviconGrid
      items={[FAV.figma, FAV.linear, FAV.github, FAV.mail, FAV.calendar, FAV.music, FAV.maps, FAV.shop]}
    />
  {/snippet}
</Chapter>

<style>
  /* A slice of the sidebar — Space-tinted column with identity + tab rows.
     The Space colour family comes from the shared `.lunma-space-scope` recipe. */
  .space-panel {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    border-radius: var(--r-lg);
    background: linear-gradient(
      180deg,
      oklch(var(--space-l) var(--space-chroma) var(--space-h) / 0.16),
      transparent 62%
    );
  }

  .list-panel {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px;
  }

  .rule {
    height: 1px;
    margin: 6px 8px;
    background: var(--divider);
  }
</style>
