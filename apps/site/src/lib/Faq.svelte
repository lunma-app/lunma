<script lang="ts">
import { reveal } from '$lib/reveal';
import { FAQ_ENTRIES } from '$lib/seo';

// The questions render from the shared `FAQ_ENTRIES` data so the visible FAQ and
// the `FAQPage` JSON-LD (in Seo.svelte) stay in lockstep — Google requires the
// structured data to match what the page shows.
</script>

<section class="faq wrap-narrow" use:reveal>
  <h2>Questions</h2>
  {#each FAQ_ENTRIES as entry (entry.q)}
    <details>
      <summary>{entry.q}</summary>
      <p>{entry.a}</p>
    </details>
  {/each}
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
