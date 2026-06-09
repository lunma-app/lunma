<script lang="ts">
import { reveal } from '$lib/reveal';
</script>

<section class="faq wrap-narrow" use:reveal>
  <h2>Questions</h2>
  <details>
    <summary>Does it change my browser?</summary>
    <p>
      No. Lunma is an extension: it adds a vertical sidebar, a new-tab page, and
      the Alt+L launcher. It can't redraw the browser's own window or tab strip,
      and it doesn't try to — it works on top of the browser you already have.
    </p>
  </details>
  <details>
    <summary>Why does it need those permissions?</summary>
    <p>
      The launcher reads your tabs, bookmarks, and history so it can search them,
      and the overlay renders on the page you're on. All of it is read locally,
      nothing is transmitted, and the source is public so you can verify it.
    </p>
  </details>
  <details>
    <summary>Where is my data stored?</summary>
    <p>
      On your device. Spaces and settings live in local extension storage;
      pinned tabs and favourites are ordinary bookmarks, so they sync wherever
      your browser profile syncs. There is no Lunma server.
    </p>
  </details>
  <details>
    <summary>Does it work on Edge?</summary>
    <p>
      Yes — Edge is Chromium, so it's the same extension. Chromium 123 or newer.
    </p>
  </details>
</section>

<style>
  .faq {
    padding: 72px 24px;
  }

  h2 {
    margin-bottom: 28px;
    font-size: var(--text-2xl);
    line-height: 1.12;
    text-align: center;
  }

  details {
    padding: 22px 4px;
    border-bottom: 1px solid var(--border-soft);
  }

  summary {
    cursor: pointer;
    list-style: none;
    font-family: var(--font-sans);
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    line-height: 1.4;
    color: var(--text-2);
    transition: color var(--motion-base) var(--ease-emphasised);
  }

  summary:hover {
    color: var(--text);
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::after {
    content: '+';
    float: right;
    margin-left: 16px;
    color: var(--text-dim);
  }

  details[open] summary::after {
    content: '–';
  }

  details p {
    max-width: 70ch;
    margin-top: 12px;
    color: var(--text-muted);
  }

  @media (prefers-reduced-motion: reduce) {
    summary {
      transition: none;
    }
  }
</style>
