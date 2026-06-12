<script lang="ts">
import Chapter from '$lib/Chapter.svelte';
import { FAV } from '$lib/mocks/apps';
import FaviconGrid from '$lib/mocks/FaviconGrid.svelte';
import LauncherMock from '$lib/mocks/LauncherMock.svelte';
import SmartFolderMock from '$lib/mocks/SmartFolderMock.svelte';
import SpaceHeader from '$lib/mocks/SpaceHeader.svelte';
import TabRowMock from '$lib/mocks/TabRowMock.svelte';
import { altKeyLabel } from '$lib/platform.svelte';

// The feature beats use token-faithful mocks (composed from @lunma/tokens, so they
// re-hue with the brand and can show states a static screenshot can't — an
// idle/archiving fade, the pinned-app divider). The real product is shown for real
// in the ProductShowcase section above and the live interactive hero demo.
</script>

<Chapter index={1} id="spaces" kicker="Spaces" title="Group tabs into colour-coded Spaces." layout="left" color="purple">
  {#snippet copy()}
    <p>
      Make a Space for each thing you're juggling. Each one holds its own tabs in
      the order you left them, with a colour pulled from a palette of nine. Switch
      Spaces and the whole sidebar swaps to that work and recolours to match.
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

<Chapter index={2} id="launcher" kicker="Launcher" title={`Search everything from ${altKeyLabel()}+L.`} layout="right" color="cyan">
  {#snippet copy()}
    <p>
      One overlay searches your open tabs, your bookmarks, and your history, from
      any page or the new-tab screen. Type a few letters, press Enter, and you're
      there. It runs web searches too, and a tap of Tab switches which engine
      answers: Google, DuckDuckGo, or one you set yourself.
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

<Chapter index={3} kicker="Auto-archive" title="Idle tabs archive themselves." layout="left" color="blue">
  {#snippet copy()}
    <p>
      The tabs you didn't pin slip into an archive once they've sat idle past a
      limit you choose. Nothing's deleted. The archive holds onto them, and you
      can pull any of them back later. Your list stays short without you tending it.
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

<Chapter index={4} kicker="Favourites" title="Favourites, one click away in every Space." layout="right" color="orange">
  {#snippet copy()}
    <p>
      Drag the sites you open all day up to the favourites row at the top of the
      sidebar. They stay put in every Space. Everything's saved locally and
      survives a restart.
    </p>
  {/snippet}
  {#snippet visual()}
    <!-- A favourites tray on a deeper substrate (`--bg`, like the real sidebar
         behind the favicon row) so the borderless `--surface` tiles read as
         raised plates — the real product's relationship — instead of faint holes
         in the glass panel. -->
    <div class="fav-tray">
      <FaviconGrid
        items={[
          FAV.whatsapp,
          FAV.gmail,
          FAV.ytmusic,
          FAV.gmaps,
          FAV.spotify,
          FAV.photos,
          FAV.calendar,
          FAV.reader,
        ]}
        columns={4}
      />
    </div>
  {/snippet}
</Chapter>

<Chapter index={5} kicker="Pinned tabs" title="Pinned tabs act like apps." layout="left" color="green">
  {#snippet copy()}
    <p>
      Pin a site and it acts like an app, not a bookmark. It holds its own page,
      and a link that heads somewhere else opens in a new tab next to it instead
      of dragging your pinned view along.
    </p>
  {/snippet}
  {#snippet visual()}
    <!-- A "Work" Space pinned to the canonical green palette colour (sourced from
         the @lunma/tokens --space-green-* tokens, not hand-copied). The pinned/temp
         divider is the story: the pinned app stays above the line; the clicked
         off-site link lands below it as a new temporary tab. -->
    <div
      class="space-panel lunma-space-scope"
      style="--space-h: var(--space-green-h); --space-l: var(--space-green-l); --space-chroma: var(--space-green-c); --space-on: var(--space-green-on)"
    >
      <SpaceHeader icon="◆" name="Work" />
      <TabRowMock title="Mail — Inbox" fav={FAV.gmail} active />
      <div class="rule"></div>
      <TabRowMock title="Newsletter — example.com" fav={FAV.reader} meta="opened from a link" />
    </div>
  {/snippet}
</Chapter>

<Chapter index={6} kicker="Smart folders" title="Pin a live queue, not just a page." layout="right" color="pink">
  {#snippet copy()}
    <p>
      A smart folder fills itself from a service you keep checking. The first one talks
      to GitLab and shows your open merge requests with the reviews waiting on you, each
      with its pipeline status, and refreshes on its own. It works with self-hosted
      GitLab, and like everything in Lunma it stays on your device. More connectors are
      on the way.
    </p>
  {/snippet}
  {#snippet visual()}
    <!-- A smart folder of live GitLab merge requests — the shipped v1 connector. One
         pipeline-status dot per row (the one-glyph restraint), from the semantic tone
         tokens. Sits directly in the glass panel like the auto-archive list. -->
    <SmartFolderMock />
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

  /* The favourites tray — a deeper `--bg` shelf the favicon tiles sit on, so the
     borderless tiles read as raised plates (the real sidebar relationship). */
  .fav-tray {
    padding: var(--space-3) var(--space-4);
    border-radius: var(--r-lg);
    background: var(--bg);
  }

  .rule {
    height: 1px;
    margin: 6px 8px;
    background: var(--divider);
  }
</style>
