<script lang="ts">
import {
  faqPageLd,
  OG_IMAGE,
  OG_IMAGE_ALT,
  OG_IMAGE_H,
  OG_IMAGE_W,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  softwareAppLd,
  webSiteLd,
} from '$lib/seo';

// Owns the page's discoverability <head>: the canonical link, the complete Open
// Graph + Twitter card set, and the JSON-LD structured data (SoftwareApplication
// + WebSite + FAQPage). The <title> + meta description stay in the route (it owns
// its title); this composes the rest. The JSON-LD is serialised from trusted,
// in-repo data (no user input) so `@html` is safe; `<\/script>` is escaped so the
// closing tag does not terminate this component's own <script> block.
interface Props {
  /** Canonical path for this page. */
  path?: string;
}
let { path = '/' }: Props = $props();

const canonical = $derived(`${SITE_URL}${path}`);
const ldHtml = [softwareAppLd(), webSiteLd(), faqPageLd()]
  // biome-ignore lint/suspicious/noUselessEscapeInString: `<\/` stops this literal from closing the component's own <script> block
  .map((block) => `<script type="application/ld+json">${JSON.stringify(block)}<\/script>`)
  .join('');
</script>

<svelte:head>
  <link rel="canonical" href={canonical} />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={SITE_NAME} />
  <meta property="og:locale" content="en_US" />
  <meta property="og:title" content={SITE_TITLE} />
  <meta property="og:description" content={SITE_DESCRIPTION} />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={OG_IMAGE} />
  <meta property="og:image:width" content={`${OG_IMAGE_W}`} />
  <meta property="og:image:height" content={`${OG_IMAGE_H}`} />
  <meta property="og:image:alt" content={OG_IMAGE_ALT} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={SITE_TITLE} />
  <meta name="twitter:description" content={SITE_DESCRIPTION} />
  <meta name="twitter:image" content={OG_IMAGE} />
  <meta name="twitter:image:alt" content={OG_IMAGE_ALT} />

  <!-- JSON-LD from trusted in-repo data only (no user input) — safe to inline. -->
  {@html ldHtml}
</svelte:head>
