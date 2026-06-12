<script lang="ts">
import Chapters from '$lib/Chapters.svelte';
import CloseCta from '$lib/CloseCta.svelte';
import Faq from '$lib/Faq.svelte';
import Footer from '$lib/Footer.svelte';
import FromArc from '$lib/FromArc.svelte';
import Hero from '$lib/Hero.svelte';
import Nav from '$lib/Nav.svelte';
import Seo from '$lib/Seo.svelte';
import { SITE_DESCRIPTION, SITE_TITLE } from '$lib/seo';
import TrustBand from '$lib/TrustBand.svelte';
</script>

<svelte:head>
  <title>{SITE_TITLE}</title>
  <meta name="description" content={SITE_DESCRIPTION} />
</svelte:head>

<!-- Canonical, the full Open Graph + Twitter set, and JSON-LD structured data. -->
<Seo />

<!-- Skip link: the FIRST focusable element, visually hidden until focused, so a
     keyboard user can jump straight past the sticky nav to the main content. -->
<a class="skip-link" href="#main">Skip to content</a>
<Nav />
<main id="main" tabindex="-1">
  <Hero />
  <section id="features">
    <Chapters />
  </section>
  <FromArc />
  <TrustBand />
  <Faq />
  <CloseCta />
</main>
<Footer />
