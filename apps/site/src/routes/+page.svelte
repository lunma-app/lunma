<script lang="ts">
import Chapters from '$lib/Chapters.svelte';
import CloseCta from '$lib/CloseCta.svelte';
import Faq from '$lib/Faq.svelte';
import Footer from '$lib/Footer.svelte';
import Hero from '$lib/Hero.svelte';
import Nav from '$lib/Nav.svelte';
import TrustBand from '$lib/TrustBand.svelte';
</script>

<svelte:head>
  <title>Lunma — Spaces, a launcher, and tabs that archive themselves</title>
  <meta
    name="description"
    content="Lunma is a vertical sidebar for Chrome and Edge: group tabs into colour-coded Spaces, search everything with a keyboard launcher, and let idle tabs archive themselves. Local-only and open source."
  />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Lunma — Spaces, a launcher, and tabs that archive themselves" />
  <meta
    property="og:description"
    content="A vertical sidebar for Chrome and Edge: colour-coded Spaces, a keyboard launcher, and tabs that archive themselves. No account, no server, open source."
  />
  <meta property="og:url" content="https://lunma.app/" />
  <meta property="og:image" content="https://lunma.app/og.png" />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<Nav />
<Hero />
<main>
  <Chapters />
  <TrustBand />
  <Faq />
  <CloseCta />
</main>
<Footer />
