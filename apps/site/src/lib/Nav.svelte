<script lang="ts">
import { onMount } from 'svelte';
import InstallCta from '$lib/InstallCta.svelte';
import { CHROME_WEB_STORE_URL, GITHUB_URL } from '$lib/links';
import Wordmark from '$lib/Wordmark.svelte';

// A sticky nav that gains a frosted-glass backing once the page scrolls past the
// hero's top. A 1px sentinel at the very top is observed; when it leaves the
// viewport the nav is "scrolled". No scroll-event polling, no layout shift.
let scrolled = $state(false);
let sentinel = $state<HTMLElement>();

onMount(() => {
  const el = sentinel;
  if (!el || typeof IntersectionObserver === 'undefined') return;
  const io = new IntersectionObserver(([entry]) => {
    scrolled = !(entry?.isIntersecting ?? true);
  });
  io.observe(el);
  return () => io.disconnect();
});
</script>

<div class="sentinel" bind:this={sentinel} aria-hidden="true"></div>
<nav class:scrolled aria-label="Primary">
  <div class="nav-inner wrap">
    <Wordmark href="#top" />
    <div class="links">
      <a class="navlink" href="#features">Features</a>
      <a class="navlink" href="#trust">Privacy</a>
      <a class="navlink" href={GITHUB_URL} target="_blank" rel="noopener">GitHub</a>
      <InstallCta href={CHROME_WEB_STORE_URL} compact soonLabel="Coming soon">Add to Chrome</InstallCta>
    </div>
  </div>
</nav>

<style>
  .sentinel {
    position: absolute;
    top: 0;
    height: 1px;
    width: 1px;
  }

  nav {
    position: sticky;
    top: 0;
    z-index: var(--z-sticky);
    border-bottom: 1px solid transparent;
    transition:
      background var(--motion-base) var(--ease-emphasised),
      border-color var(--motion-base) var(--ease-emphasised);
  }

  nav.scrolled {
    background: var(--glass-bg);
    -webkit-backdrop-filter: blur(var(--glass-blur));
    backdrop-filter: blur(var(--glass-blur));
    border-bottom-color: var(--border-soft);
  }

  .nav-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px;
  }

  .links {
    display: flex;
    gap: 26px;
    align-items: center;
  }

  .navlink {
    color: var(--text-muted);
    text-decoration: none;
    font-family: var(--font-sans);
    font-size: var(--text-md);
    font-weight: var(--weight-medium);
    transition: color var(--motion-base) var(--ease-emphasised);
  }

  .navlink:hover {
    color: var(--text);
  }

  /* ≤720px: keep every destination reachable as a compact link row (one type stop
   * smaller, tighter gaps) rather than hiding the links. The row may scroll
   * horizontally on a very narrow viewport so no link is ever cut off. */
  @media (max-width: 720px) {
    .nav-inner {
      padding: 14px 16px;
      gap: var(--space-3);
    }
    .links {
      gap: var(--space-3);
      min-width: 0;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .links::-webkit-scrollbar {
      display: none;
    }
    .navlink {
      font-size: var(--text-sm);
      white-space: nowrap;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    nav {
      transition: none;
    }
  }
</style>
