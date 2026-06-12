<script lang="ts">
import { reveal } from '$lib/reveal';

// A positioning beat for visitors arriving from Arc (and Arc-style extensions):
// it names the lineage and Lunma's own footing in the brand voice — no comparison
// matrix. The point-by-point answers (and the Arcify credit) live in the FAQ,
// which also feeds the FAQPage rich-results.
</script>

<section class="from-arc wrap-narrow" use:reveal>
  <p class="kicker">Coming from Arc</p>
  <h2>Arc's Spaces, in the browser you already use.</h2>
  <p class="body">
    Colour-coded Spaces, vertical tabs, and a keyboard launcher — without a new
    browser or an account. Lunma is an open-source extension for Chrome and Edge,
    and it stays out of the way: your favourites and pinned tabs are ordinary
    bookmarks, so nothing is locked in, and the same Space can be open in as many
    windows as you like.
  </p>
</section>

<style>
  .from-arc {
    padding: 88px 24px 16px;
    text-align: center;
  }

  h2 {
    font-size: clamp(30px, 4.6vw, 46px);
    line-height: 1.1;
  }

  .body {
    max-width: 56ch;
    margin: 22px auto 0;
    font-size: var(--text-lg);
    color: var(--text-muted);
  }
</style>
