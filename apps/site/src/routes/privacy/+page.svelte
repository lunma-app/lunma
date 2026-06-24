<script lang="ts">
// The privacy policy. A normal prerendered route (the site-wide prerender flag
// in +layout.ts covers it; no per-route +page.ts, see design D1). The copy is
// hand-authored long-form content that lives here rather than in a lib/
// component (design D3 — no second consumer), composing the @lunma/tokens design
// language directly (the .lunma-glass recipe over the layout's inherited aurora
// backdrop, the brand faces from app.css's h1/h2 + --font-sans body) and NOT the
// extension's ui/ primitives. Every fact here is true to the shipping extension
// and must stay in step with TrustBand.svelte (design D4).
import { GITHUB_URL, PRIVACY_EMAIL } from '$lib/links';
import Seo from '$lib/Seo.svelte';
import Wordmark from '$lib/Wordmark.svelte';

// The route owns its own <title> + meta description (Seo composes the rest of
// the head); Seo's og:* stay the site-level product card by design (D2 tradeoff).
const title = 'Privacy policy — Lunma';
const description =
  "How Lunma handles your data: everything stays on your device, there's no Lunma account or server, and no analytics. The honest, readable version.";

// Hard-coded literal, bumped by hand on every edit — this is a static page, so
// never Date.now() (which would also break the prerender's reproducibility).
const lastUpdated = '15 June 2026';
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
</svelte:head>

<!-- Canonical + Open Graph/Twitter, but NO FAQPage JSON-LD: this page renders no
     FAQ, so emitting it would describe content the page lacks (design D2). -->
<Seo path="/privacy" faq={false} />

<div class="topbar">
  <Wordmark href="/" size={24} />
</div>

<main class="privacy" id="main">
  <article class="sheet lunma-glass">
    <header class="doc-head">
      <h1>Privacy</h1>
      <p class="updated">Last updated {lastUpdated}</p>
    </header>

    <p class="lead">
      Lunma keeps your data on your device. There's no Lunma account and no Lunma
      server, so nothing you do is sent to us. We run no analytics and we track
      nothing. The rest of this page is the detail behind that.
    </p>

    <section>
      <h2>What Lunma stores, and where</h2>
      <p>
        Your workspace lives in your browser's local extension storage, on this
        device. That covers your Spaces, your pinned tabs, your favourites, and
        the tabs Lunma has archived for you. It's there after a restart, and it
        doesn't leave the machine, because there's nowhere for it to go.
      </p>
      <p>
        Your preferences are the one thing that travels. Settings like Colour
        intensity and density sit in your browser's synced storage, so when
        you're signed into your browser they follow your profile to your other
        machines, the same way your bookmarks do. That's your browser's own sync,
        not ours, and your Spaces and tabs are never part of it.
      </p>
      <p>
        If you give a connector an access token, it stays in local storage on this
        device and never syncs. We keep tokens out of synced storage on purpose,
        so one can't ride your browser account to another machine. A token is
        never written to a log and never shown back to you in the options screen.
      </p>
    </section>

    <section>
      <h2>The permissions Lunma asks for</h2>
      <p>Each permission is here for a job you can point to.</p>
      <ul>
        <li>Your open tabs, so the sidebar can show them and the launcher can search them.</li>
        <li>Tab groups, because a Space is built on your browser's own tab groups.</li>
        <li>An alarm, so Lunma can tell when a tab has gone idle and archive it.</li>
        <li>
          Bookmarks and history are optional. The launcher can fold them into a
          search, and Lunma asks for each the first time you reach for it, not at
          install. Lunma reads them on your machine and sends them nowhere.
        </li>
        <li>
          A small script on the pages you open, so the launcher works wherever you
          are and a pinned tab stays on its own page. It reads the text you type
          into the launcher and the link you click. It never reads the page around it.
        </li>
      </ul>
      <p>All of it reads locally. None of it goes to a server of ours, because we don't have one.</p>
    </section>

    <section>
      <h2>Connecting Lunma to a service</h2>
      <p>
        A lens can pull in your work from a service you already use, like a
        code host, an issue tracker, or a feed. When you connect one, Lunma talks
        to that service directly from your browser. It only asks for that access
        when you connect, and nothing about the connection passes through us.
      </p>
      <p>
        How it signs in depends on the service. Some take an access token you
        create and paste in. That token is your authentication for that host:
        Lunma stores it locally and sends it only to the host it belongs to.
        Others ride the session you're already signed into,
        so the request carries your existing browser cookie to that host, the same
        as if you'd opened the site yourself. Either way the request goes straight
        to the service and the results come straight back.
      </p>
      <p>A public feed needs none of this. Lunma fetches it directly, with no sign-in.</p>
    </section>

    <section>
      <h2>Backup and export</h2>
      <p>
        You can export your workspace to a file and import it back later. That file
        is yours. It's written wherever you choose on your own disk. Lunma never
        uploads it, and it's the only copy unless you make another. Keep it
        somewhere safe if it matters to you.
      </p>
    </section>

    <section>
      <h2>Keeping it, and deleting it</h2>
      <p>
        Lunma holds nothing of yours, so there's nothing for us to keep or delete.
        Your data lasts exactly as long as it sits in your browser. Clear the
        extension's storage, or remove Lunma, and it's gone from that browser. Your
        open tabs stay open either way, since they're ordinary browser tabs. A
        connector token goes when you disconnect the connector or clear storage.
      </p>
    </section>

    <section>
      <h2>Children</h2>
      <p>
        Lunma collects nothing from anyone, children included. There's no account
        to create and no age to enter.
      </p>
    </section>

    <section>
      <h2>Chrome's data policy</h2>
      <p>
        Lunma's use of information received from Chrome and Google APIs adheres to
        the Chrome Web Store User Data Policy, including the Limited Use
        requirements. In plain terms: Lunma reads what it needs to do the job you
        asked for, on your own machine. None of it is sold or passed on.
      </p>
    </section>

    <section>
      <h2>Lunma is not a data controller</h2>
      <p>
        Because Lunma gathers no data about you and sends none to itself, it isn't a
        controller or a processor of your data under laws like the GDPR or CCPA.
        There's no profile of you to hand over or delete, because none was ever
        built. Your data stays in your browser the whole time, and it stays yours.
      </p>
    </section>

    <section>
      <h2>Changes to this policy</h2>
      <p>
        If this policy changes, the new version goes up here and the date at the top
        moves with it. Lunma has no way to email you, so checking back is how you'll
        see what's new. We won't quietly start collecting your data. Nothing here is
        built to.
      </p>
    </section>

    <section>
      <h2>Contact</h2>
      <p>
        If something here needs explaining, email
        <a href="mailto:{PRIVACY_EMAIL}">{PRIVACY_EMAIL}</a>. The code is
        <a href={GITHUB_URL} target="_blank" rel="noopener">public</a> too, so you
        can read what Lunma does and hold this page to it.
      </p>
    </section>
  </article>
</main>

<style>
  /* The back-to-home wordmark sits on the bare substrate above the sheet (over
     the layout's inherited aurora), matching the footer's home affordance. */
  .topbar {
    width: 100%;
    max-width: 680px;
    margin: 0 auto;
    padding: 40px 24px 0;
  }

  .privacy {
    width: 100%;
    max-width: 680px;
    margin: 0 auto;
    /* ~65ch reading measure once the sheet padding is subtracted (design: 62–68ch). */
    padding: 28px 24px 96px;
  }

  .sheet {
    /* .lunma-glass supplies the frosted fill, hairline border, blur, and radius. */
    padding: clamp(28px, 5vw, 56px);
  }

  .doc-head {
    margin-bottom: 32px;
  }

  h1 {
    font-size: var(--text-2xl);
    line-height: 1.1;
  }

  .updated {
    margin-top: 8px;
    color: var(--text-dim);
    font-size: var(--text-md);
  }

  /* The lead is the "short version" — body weight, slightly larger, full --text
     for legibility (never the dimmer --text-dim, per the a11y bar). */
  .lead {
    color: var(--text);
    font-size: var(--text-lg);
    line-height: 1.7;
  }

  section {
    margin-top: 40px;
  }

  h2 {
    margin-bottom: 12px;
    font-size: var(--text-xl);
    line-height: 1.2;
  }

  p,
  li {
    color: var(--text);
    font-size: var(--text-lg);
    line-height: 1.7;
  }

  p + p {
    margin-top: 16px;
  }

  ul {
    margin: 0;
    padding-left: 1.3em;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  ul + p {
    margin-top: 16px;
  }

  li::marker {
    color: var(--text-dim);
  }

  /* Links match Footer.svelte: underlined with offset, hover lifts to --text,
     keyboard focus rings via the global :focus-visible. */
  a {
    color: var(--text-muted);
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color var(--motion-base) var(--ease-emphasised);
  }

  a:hover {
    color: var(--text);
  }

  @media (prefers-reduced-motion: reduce) {
    a {
      transition: none;
    }
  }
</style>
