## Context

`apps/site` is a SvelteKit app built with `@sveltejs/adapter-static`
(`strict: true`) — it prerenders to a fully static `apps/site/build/` directory
with no server runtime (see ADR 0004, `svelte.config.js`). `pnpm --filter
@lunma/site verify` already runs `vite build` as its last step, so producing the
deployable artifact is a solved problem; the open question this change answers is
*how that directory reaches `lunma.app`*.

The surrounding constraints are already fixed by the first change in the
sequence, `github-repo-and-ci`:

- **Toolchain is pinned and proven in CI.** `ci.yml` already establishes the
  canonical setup — `actions/checkout@v6`, `actions/setup-node@v6` (Node 24),
  `corepack enable` (activates `pnpm@11.3.0`), resolve the pnpm store path into a
  step output, `actions/cache@v5` on it, `pnpm install --frozen-lockfile`. The
  deploy build reuses this verbatim; no new toolchain decision is open.
- **The repo is private on a Free org** until `open-source-public-launch` (the
  fourth change). The same Free-org wall that blocked branch protection in
  `github-repo-and-ci` §5.4 also makes GitHub Pages unavailable for a private
  repo — which is why the host is Cloudflare Pages, not Pages.
- **The domain is decided and already on Cloudflare DNS.** `lunma.app` is baked
  into `sitemap.xml`, `robots.txt`, `Seo.svelte`, and `security.txt`; its DNS is
  Cloudflare-managed, so the apex custom-domain binding is a first-class Pages
  feature, not a registrar-specific CNAME dance.

The user-facing answers gathered during exploration locked the three top-level
choices: **Cloudflare Pages** (host), **CI-driven via `wrangler`** (mechanism,
not Cloudflare's own Git-integration build), and **DNS already on Cloudflare**.
This design records the consequent technical decisions.

This change ships no `src/` code and authors no new visual language — the site
surface and its visual bar were delivered by the `marketing-site` changes — so
there is no `Visual language` section here (explicit exemption, per the
visual-quality policy; this change *publishes* an already-to-bar surface rather
than shipping a new one).

## Goals / Non-Goals

**Goals:**

- `lunma.app` is served, publicly, from this repo's CI on every push to `main`,
  built with the repo-pinned toolchain (no second build environment).
- The load-bearing `https://lunma.app/privacy` URL resolves `200` — the field
  `extension-release-pipeline` needs for the Chrome Web Store listing.
- Least-privilege, fork-safe credentials: the Cloudflare token is Pages-scoped
  and never reachable by a pull-request (so it stays safe when the repo goes
  public in change #4).
- The served site is hardened from first paint: a strict same-origin CSP plus the
  HSTS/nosniff/frame/Referrer/Permissions header set (D5).
- Reproducibility: the Cloudflare project, the domain binding, and the secrets
  are exact commands in `tasks.md`, not tribal knowledge.
- Doc-lockstep: `docs/tech-stack.md` and `docs/architecture.md` record the
  deploy.

**Non-Goals:**

- Fine-grained cache-control tuning beyond Cloudflare Pages' defaults (D5 — Vite's
  content-hashed filenames already get immutable caching). The *security* headers
  and CSP are in scope.
- Re-running `verify` as a precondition of deploy (D4 — the gate already runs on
  the PR and on `push: main`).
- Any extension build/version/release work, or the Chrome Web Store submission
  itself (→ `extension-release-pipeline`).
- The private→public flip, DCO, branch-protection enforcement
  (→ `open-source-public-launch`).
- Flipping `LAUNCHED` / wiring real store URLs in `links.ts` — the site deploys
  in its honest "coming soon" state; the flip is launch work.

## Decisions

### D1 — A separate `deploy.yml`, not a job on `ci.yml`

The deploy needs a Cloudflare token with write access. `ci.yml`'s `verify` and
`e2e` jobs are deliberately `permissions: { contents: read }`. Bolting deploy
onto `ci.yml` would either widen that file's privilege surface or force per-job
permission overrides on a file whose whole point is "read-only gate." A separate
`.github/workflows/deploy.yml` keeps the gate untouchable and isolates the one
workflow that holds a secret.

- *Alternative — one workflow, deploy job `needs: [verify, e2e]`:* couples
  deploy to a job graph and re-runs the gate on every deploy for no benefit (the
  gate already ran on the PR); also drags secret-bearing config into the
  read-only file. Rejected.

### D2 — CI-driven `wrangler`, not Cloudflare's Git-integration build

Cloudflare Pages can watch the repo and build on *its* runners. We instead build
in GitHub Actions with Lunma's pinned toolchain and publish the prebuilt
`apps/site/build/` with `wrangler pages deploy`. Two reasons: (1) it makes
"deploys `lunma.app` from this repo's CI" — the wording `github-repo-and-ci`
committed to — literally true; (2) it avoids a second build environment that
would have to be kept in lockstep with the pinned Node/pnpm versions and could
drift. Cloudflare's Git integration would also need read access to the *private*
repo, an extra trust grant we don't take.

- *Alternative — Cloudflare Git integration:* simpler to click together, but a
  divergent build env + a repo-access grant + loses the "from CI" property.
  Rejected.

### D3 — Production from `main`; previews from same-repo branches; never `pull_request`

The workflow triggers on `push` to `main` (production → `lunma.app`) and on
`push` to other branches (preview → `*.lunma.pages.dev`). It deliberately does
**not** trigger on the `pull_request` event. GitHub does not expose repository
secrets to workflows triggered by a pull request from a fork — and once the repo
is public (change #4), fork PRs are exactly the threat. Driving deploy off
`push` only means the Cloudflare token is reachable only by code that already
landed on a branch in *this* repo (i.e. by a maintainer), today and after the
public flip. Branch vs. production is selected from `github.ref` and passed as
`wrangler`'s `--branch`.

- *Alternative — deploy on `pull_request` for PR previews:* gives preview URLs on
  every PR including forks, but would either leak the token to forks or require
  `pull_request_target` gymnastics. The same-repo-branch preview covers the
  maintainer workflow without the footgun. Rejected.

### D4 — Deploy trusts the existing gate; no `workflow_run` coupling

Merges to `main` are fast-forwards of already-green commits (the
`github-repo-and-ci` §5.3 workflow), and `ci.yml`'s `push: [main]` re-runs
`verify`/`e2e` on `main` independently. A `workflow_run`-gated deploy ("only
after the verify workflow succeeds on this SHA") adds orchestration complexity
and a failure mode (the chaining itself) to guard against a deploy of a
red commit that the team's own merge discipline already prevents — and which, in
any case, only publishes a static marketing page, not runtime code. The deploy
instead runs its own **post-deploy smoke** (D7) so a *broken publish* is caught
even though the *source* was already gated. If real branch protection (change #4)
later makes a red `main` impossible, this stays correct unchanged.

- *Alternative — `on: workflow_run: { workflows: [CI], types: [completed] }` with
  a success conditional:* defensible, but premature given the merge model and the
  low blast radius of a static page. Revisit if `main` ever takes direct
  un-gated pushes. Recorded as movable.

### D5 — Hardened response headers + a strict CSP, via `kit.csp` hash mode + `_headers`

The served site sends a defense-in-depth header set from first paint (user
decision during exploration — "full headers incl. CSP now"). The mechanism splits
along what each transport can actually carry on a *prerendered, server-less*
adapter-static site:

- **CSP via SvelteKit `kit.csp` in `hash` mode** (configured in
  `apps/site/svelte.config.js`). SvelteKit injects its own inline hydration
  script (and may inline critical style); a strict CSP must allow exactly those
  without a blanket `'unsafe-inline'`. `hash` mode computes the SHA hashes of
  SvelteKit's inline bits **at prerender time** and embeds the policy as a
  `<meta http-equiv="content-security-policy">` — the only mode compatible with
  static prerendering (`nonce` mode needs a per-request server). This means **no
  hand-maintained hashes** (they regenerate every build) and **no
  `'unsafe-inline'` for scripts**. The policy is strict same-origin
  (`default-src 'self'`, no external origins — the site has no analytics, no
  external scripts, fonts/images/OG all same-origin), with `object-src 'none'`,
  `base-uri 'self'`, `form-action 'none'`.
- **`apps/site/static/_headers`** carries the headers a `<meta>` tag *cannot*
  express: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: no-referrer` (or `strict-origin-when-cross-origin`),
  `X-Frame-Options: DENY` (clickjacking — `frame-ancestors` is ignored in meta),
  and a `Permissions-Policy` that denies the powerful features the site doesn't
  use. adapter-static copies `static/` to the build root, and Cloudflare Pages
  reads a root `_headers` as config (it is not served as a file).

The known sharp edge — `style-src`. CSP style-hashes do **not** cover inline
`style="…"` *attributes*, which Svelte can emit (e.g. `style:` directives, the
`reveal.ts` transitions). If the built output contains any, a strict `style-src`
would block them. So the exact `style-src` value is **finalized at apply time
against the real `apps/site/build/` output**: prefer hashes; if inline style
attributes are present and not worth refactoring out, a documented narrow
relaxation (`'unsafe-inline'` on `style-src` *only*, never `script-src`) is the
agreed fallback — recorded as a deviation note if taken. Correctness is proven by
a **post-deploy no-CSP-violations check** (load the live page headless, assert the
console reports zero CSP violations) on top of the `verify` build.

**Apply-time resolution (fallback taken).** The built `apps/site/build/` output
does contain inline `style="…"` attributes — the per-space colour custom
properties in `Chapters.svelte`, `StageWindow.svelte`, and `og/+page.svelte`, plus
`app.html`'s `<div style="display: contents">` wrapper. These are
colour/structural and not worth refactoring out, so the agreed narrow fallback was
taken: `style-src 'self' 'unsafe-inline'`. `script-src` stays strict
(`'self'` + SvelteKit's build-time hash, no `'unsafe-inline'`). No inline
`<style>` block is emitted, so no style hash is present to make a CSP-3 browser
ignore the `'unsafe-inline'`. Verified at apply time: all three routes (`/`,
`/privacy`, `/og`) load headless with **zero CSP violations** against the local
`preview` build.

- *Alternative — a single hand-authored CSP in `_headers` with `'unsafe-inline'`:*
  simplest, but `'unsafe-inline'` on `script-src` defeats most of CSP's value;
  rejected for scripts. *Alternative — hand-maintained script hashes in `_headers`:*
  breaks on every build that changes SvelteKit's inline bytes; rejected. *Alternative
  — defer all headers to a later change:* was the original D5; overridden by the
  user's "full headers now" decision.

### D6 — `wrangler` via the pinned `cloudflare/wrangler-action`, zero new deps

`github-repo-and-ci` added zero dependencies to any `package.json` and pinned
every third-party action. This change holds that line: the deploy step uses the
official `cloudflare/wrangler-action`, pinned to a major tag/SHA like the
workflow's other actions, rather than adding `wrangler` to a `package.json`. The
action's version is dependabot-tracked through the `github-actions` ecosystem
already declared in `.github/dependabot.yml`, so it stays current the same way
`checkout`/`setup-node`/`cache` do.

- *Alternative — `pnpm add -D wrangler` (catalog-pinned), `pnpm exec wrangler …`:*
  gives a locally-runnable deploy/rollback and dependabot-via-npm tracking, but
  adds the project's first new dependency and a second tool to pin. Chosen
  against (user decision during exploration) to preserve the zero-new-deps
  posture; the action covers the CI need, and manual `wrangler` can be run ad hoc
  with `pnpm dlx wrangler` if ever needed without a committed dep.

### D7 — Post-deploy liveness smoke

After `wrangler pages deploy` reports success, the production deploy step
`curl --fail`s `https://lunma.app/` and `https://lunma.app/privacy`, asserting
HTTP `200`. Cloudflare's CDN can lag a few seconds on first propagation, so the
check polls with a bounded retry before failing. This turns "wrangler exited 0"
into "the bytes are actually being served, and the privacy URL the store listing
depends on resolves" — catching a binding/propagation problem at deploy time
rather than at store-submission time. (Preview deploys assert against the
returned `*.pages.dev` URL, not the apex.)

## Risks / Trade-offs

- **[Token leak via a malicious PR after the public flip]** → D3: the deploy
  never runs on `pull_request`, only on `push` to a branch in this repo, so a
  fork PR cannot reach `CLOUDFLARE_API_TOKEN`. The token is additionally scoped to
  **Pages:Edit** only, so even a worst-case exposure cannot touch DNS, Workers, or
  other Cloudflare resources.
- **[Deploying a red `main`]** → D4 + D7: the merge model prevents un-gated
  `main`, `ci.yml` re-runs the gate on `main`, and the post-deploy smoke catches a
  broken *publish*. Blast radius is a static marketing page, not runtime code. If
  this risk ever grows (direct pushes to `main`), promote to a `workflow_run`
  gate (recorded as movable in D4).
- **[CDN propagation flake fails the smoke]** → D7 polls with a bounded retry
  before failing, absorbing first-propagation lag without masking a real outage.
- **[A too-strict CSP breaks the live page]** → D5: `kit.csp` hash mode derives
  script/style hashes from the real build (no guesswork), the policy is finalized
  against the actual `apps/site/build/` output, and a **post-deploy
  no-CSP-violations check** (headless load asserting zero console CSP violations)
  gates the deploy — so a CSP regression fails the run, it doesn't reach users.
  `style-src` is the one directive that may need a documented narrow relaxation
  (inline `style=` attributes Svelte emits); `script-src` stays strict regardless.
- **[`wrangler-action` major bump breaks the deploy]** → it is dependabot-tracked
  and pinned; a bump arrives as its own PR that runs the full gate, and the deploy
  surfaces any break on the next `main` push (caught by the D7 smoke), not
  silently.
- **[Spec-ordering: the `release-engineering` base spec isn't living yet]** → the
  base spec materialises when `github-repo-and-ci` archives (deferred on its
  branch-protection task, which `open-source-public-launch` unblocks). This
  change's delta is purely *additive* (`## ADDED Requirements`), so it composes
  cleanly whenever it archives relative to that one; it introduces no edit to an
  existing requirement. Documented so the archive order is understood, not left to
  surprise.

## Migration Plan

Deploy is additive infrastructure — there is nothing to roll back in the product.
Standing up the pipeline:

1. Create the Cloudflare Pages project `lunma` (direct-upload type, since CI
   pushes the prebuilt output — no connected Git repo, per D2).
2. Bind the `lunma.app` apex (+ `www` → apex redirect) as a custom domain on the
   already-Cloudflare-managed zone.
3. Mint a Pages-scoped API token; set `CLOUDFLARE_API_TOKEN` +
   `CLOUDFLARE_ACCOUNT_ID` as GitHub repo secrets.
4. Author the hardening headers (`static/_headers`) and the `kit.csp` block, then
   build and tune the CSP against the real `apps/site/build/` output until a local
   preview loads with zero CSP violations (D5).
5. Land `deploy.yml`; push to a branch first to exercise a **preview** deploy
   (no production risk), confirm the `*.pages.dev` URL serves the site, then let
   the `main` push publish production and watch the D7 smoke + the no-CSP-violations
   check go green.

**Rollback:** Cloudflare Pages keeps every deployment; a bad publish is rolled
back instantly by promoting a previous deployment in the dashboard (or
`wrangler pages deployment` ), independent of the repo. Reverting `deploy.yml`
stops future auto-deploys without taking the current site down.

## Open Questions

- None blocking. D4 (trust-gate vs. `workflow_run`) and D5 (`_headers`/CSP) are
  recorded as deliberately deferred/movable, to revisit if the merge model or the
  site's header needs change — not open questions for this change.
