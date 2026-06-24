<script lang="ts">
import {
  CHROME_WEB_STORE_URL,
  EDGE_ADDONS_URL,
  EDGE_LAUNCHED,
  GITHUB_URL,
  LAUNCHED,
  PRIVACY_PATH,
} from '$lib/links';
import Wordmark from '$lib/Wordmark.svelte';
</script>

<footer class="wrap">
  <div class="top">
    <Wordmark href="#top" size={24} />
    <p class="links">
      <!-- Same-tab internal link (no target/rel), distinct from the external
           store/repo links beside it. -->
      <a href={PRIVACY_PATH}>Privacy</a>
      <a href={GITHUB_URL} target="_blank" rel="noopener">GitHub</a>
      <!-- Store links are gated on LAUNCHED, like the install CTAs: pre-launch
           there is no Lunma listing, so we omit them rather than point at a store
           homepage. They appear (with the real listing URLs) when the flag flips. -->
      {#if LAUNCHED}
        <a href={CHROME_WEB_STORE_URL} target="_blank" rel="noopener">Chrome Web Store</a>
      {/if}
      {#if EDGE_LAUNCHED}
        <a href={EDGE_ADDONS_URL} target="_blank" rel="noopener">Edge Add-ons</a>
      {/if}
    </p>
  </div>
  <p class="tagline">Free and open source. For Chrome and Edge (Chromium 123+).</p>
  <p class="credit">
    Built from scratch, with thanks to
    <a
      href="https://chromewebstore.google.com/detail/ghbflkcnhdpkmbbdoflmemnifphjehec"
      target="_blank"
      rel="noopener">Arcify</a
    >
    for showing this could live in an extension.
  </p>
</footer>

<style>
  footer {
    padding: 56px 24px 56px;
    border-top: 1px solid var(--border-soft);
    color: var(--text-dim);
    font-size: var(--text-md);
  }

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }

  .links {
    display: flex;
    gap: 22px;
    flex-wrap: wrap;
  }

  .links a,
  .credit a {
    color: var(--text-muted);
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color var(--motion-base) var(--ease-emphasised);
  }

  .links a:hover,
  .credit a:hover {
    color: var(--text);
  }

  .tagline {
    color: var(--text-dim);
  }

  .credit {
    max-width: 64ch;
    margin-top: 12px;
    color: var(--text-dim);
    font-size: var(--text-sm);
    line-height: 1.7;
  }

  @media (prefers-reduced-motion: reduce) {
    .links a,
    .credit a {
      transition: none;
    }
  }
</style>
