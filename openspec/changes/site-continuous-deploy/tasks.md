## 1. Cloudflare Pages project + domain (guided-manual + wrangler)

- [x] 1.1 **(manual gate)** Create a Cloudflare Pages project named `lunma` of the
  **direct-upload** type (no connected Git repo — CI pushes the prebuilt output,
  design D2). Confirm it exists: `wrangler pages project list` shows `lunma`.
  → Done: `CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=… wrangler pages project
  create lunma --production-branch main`; `wrangler pages project list` shows
  `lunma` (Git Provider: No → direct-upload), domain `lunma.pages.dev`.
- [x] 1.2 Bind the custom domain: add `lunma.app` (apex) as a custom domain on the
  `lunma` Pages project, on the already-Cloudflare-managed `lunma.app` zone, and
  add a `www.lunma.app` → apex redirect. Confirm the apex domain shows "Active" in
  the project's Custom domains. (Account state — record the exact dashboard/CLI
  steps here for reproducibility.)
  → Done: apex attached via API —
  `curl -X POST .../accounts/$ACCT/pages/projects/lunma/domains -d '{"name":"lunma.app"}'`.
  The API attach does **not** auto-create the apex DNS record, so it was added in
  the dashboard: **DNS → Records** `lunma.app` `CNAME → lunma.pages.dev`, **Proxied**
  (Cloudflare flattens the apex CNAME). `www → apex` 301 via **Rules → Redirect
  Rules → "Redirect from WWW to root"** template (pattern `https://www.*` →
  `https://${1}`, 301, preserve query string) plus the Cloudflare-created proxied
  `www` record; verified live (`curl -sI https://www.lunma.app/` → `301
  location: https://lunma.app/`). Apex edge cert is serving (TLS terminates; an
  un-deployed apex returns `522`); the Pages domain finishes validating to
  **Active** once the first production deployment exists (§7) — the documented
  "bound, awaiting deployment" state, not a misconfiguration.
- [x] 1.3 Mint a Cloudflare API token scoped to **Account › Cloudflare Pages ›
  Edit** only (least privilege, design D3/risks). Note the Account ID. Do **not**
  grant DNS/Workers/other scopes.
  → Done: an **account-owned** API token (Manage Account → API Tokens), single
  policy *Cloudflare Pages: Read + Edit* at **Entire Account** scope (the Pages
  template's pair; "Edit" implies write). No DNS/Workers/other scopes — the apex
  DNS record (1.2) was therefore added via the dashboard, not this token.

## 2. GitHub repo secrets

- [x] 2.1 Set the two repo secrets (never committed):
  `gh secret set CLOUDFLARE_API_TOKEN` (the Pages:Edit token from 1.3) and
  `gh secret set CLOUDFLARE_ACCOUNT_ID` (the account id). Confirm with
  `gh secret list` showing both names (values are masked).
  → Done on `lunma-app/lunma`: both `CLOUDFLARE_API_TOKEN` and
  `CLOUDFLARE_ACCOUNT_ID` set (values piped via stdin, never echoed/committed);
  `gh secret list -R lunma-app/lunma` shows both. The token is also stored in
  1Password ("Cloudflare Pages deploy — lunma"); the local `/tmp` stash used for
  the setup commands was securely deleted.

## 3. Deploy workflow (`.github/workflows/deploy.yml`)

- [x] 3.1 New workflow file, **separate from `ci.yml`** (design D1). Triggers:
  `on: push` with `branches-ignore: ['dependabot/**']` — `main` → production,
  other human branches → previews, **Dependabot branches excluded** (their runs
  get no secrets, so a deploy can only fail); **no `pull_request` trigger**
  (design D3 — keeps the token off fork PRs). Top-level `permissions: { contents: read }` (the deploy auth is the
  Cloudflare token, not `GITHUB_TOKEN`).
- [x] 3.2 `deploy` job (ubuntu-latest), reusing `ci.yml`'s proven setup steps
  verbatim: `actions/checkout@v6` → `actions/setup-node@v6` (`node-version: 24`)
  → `corepack enable` (with `COREPACK_ENABLE_DOWNLOAD_PROMPT: 0`) → resolve the
  pnpm store path into a step output → `actions/cache@v5` on it → `pnpm install
  --frozen-lockfile`.
- [x] 3.3 Build the site: `pnpm --filter @lunma/site build` → produces
  `apps/site/build/`.
- [x] 3.4 Publish wrangler with no `package.json` dep (design D6). Pass the two
  secrets as env; command `pages deploy apps/site/build --project-name=lunma` with
  `--branch` derived from `github.ref_name` so `main` → production and any other
  branch → a preview deployment.
  → **Deviation (agreed):** the pinned `cloudflare/wrangler-action` could not
  install wrangler in this strict pnpm monorepo (root-add guard →
  npm `workspace:` protocol → pnpm build-script gate). Switched to
  `pnpm dlx wrangler@3.114.14` in a `run:` step (isolated install, zero committed
  deps — D6's goal holds); the `*.pages.dev` URL is parsed from wrangler stdout
  for the preview smoke. design D6 + proposal + docs updated to match.
- [x] 3.5 Add the post-deploy liveness smoke (design D7): on the **production**
  (`main`) deploy, `curl --fail` `https://lunma.app/` and
  `https://lunma.app/privacy` expecting `200`, with a bounded retry/poll to absorb
  CDN propagation lag; fail the job if either does not resolve. (Preview deploys
  assert against the returned `*.pages.dev` URL, not the apex.)
- [x] 3.6 Pin every third-party action to a major tag/SHA; confirm the job name is
  exactly `deploy`.

## 4. Hardened response headers + CSP (design D5)

- [x] 4.1 Add `apps/site/static/_headers` carrying `Strict-Transport-Security`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`,
  and a `Permissions-Policy` denying unused features. Apply to all paths (`/*`).
- [x] 4.2 Configure the CSP in `apps/site/svelte.config.js` via `kit.csp` in
  **`mode: 'hash'`** with strict same-origin `directives` (`default-src 'self'`;
  `object-src 'none'`; `base-uri 'self'`; `form-action 'none'`; `img-src 'self'
  data:`; `font-src 'self'`; `connect-src 'self'`). `script-src` MUST NOT use
  `'unsafe-inline'`.
- [x] 4.3 Build (`pnpm --filter @lunma/site build`) and inspect the real output:
  confirm `build/_headers` is present and `build/**/*.html` carry the
  `content-security-policy` `<meta>`. Resolve `style-src` against the actual
  output — prefer hashes; **only if** Svelte emits inline `style=` attributes that
  aren't worth refactoring, apply the agreed narrow fallback (`'unsafe-inline'` on
  `style-src` *only*) and record it as a deviation note here + in design D5.
  → **Fallback taken (deviation note).** The built output (`build/index.html`,
  `build/privacy.html`, `build/og.html`) carries the CSP `<meta>` and
  `build/_headers` is present at the root. The output contains inline `style="…"`
  attributes (per-space colour custom properties in `Chapters`/`StageWindow`/`og`
  + `app.html`'s `display:contents` wrapper), which CSP style-hashes cannot cover,
  so `style-src 'self' 'unsafe-inline'` was applied (the pre-agreed narrow
  fallback). `script-src` stays strict: `'self'` + SvelteKit's build-time
  `'sha256-…'` hash, no `'unsafe-inline'`. No inline `<style>` block is emitted, so
  no style hash forces a CSP-3 browser to ignore the `'unsafe-inline'`. Recorded
  in design D5 ("Apply-time resolution").
- [x] 4.4 Verify locally with no CSP violations: serve `build/` (e.g. `pnpm
  --filter @lunma/site preview`) and load every route (`/`, `/privacy`, `/og`),
  confirming the browser console reports **zero** CSP violations. (The post-deploy
  check in §6 repeats this against the live site.)

## 6. Documentation (doc-lockstep — required this change)

- [x] 6.1 `docs/tech-stack.md` — extend the CI/release-engineering note: the site
  is built in CI on the pinned toolchain and published to Cloudflare Pages via
  `wrangler` (production from `main`, previews from same-repo branches);
  cross-reference the existing toolchain rows rather than restating the pins.
- [x] 6.2 `docs/architecture.md` — add a short "Continuous deployment" subsection
  alongside the existing "Continuous integration" one: `apps/site` →
  `wrangler pages deploy` → `lunma.app`, build-time-only, nothing in the extension
  bundle; deploy is a separate workflow from the read-only gate; note the
  served-site hardening (CSP via `kit.csp` hash mode + `static/_headers`).
- [x] 6.3 Confirm design D1–D7 are recorded in this change's `design.md` (they are)
  and that no decision was introduced during implementation that isn't logged —
  if one was, surface it (deviation policy) and update design + this file before
  marking done.

## 7. First deploy + verification (against the spec scenarios)

- [ ] 7.1 Land `deploy.yml` on a **branch** first and push it; confirm a
  **preview** deployment is published and its `*.pages.dev` URL serves the site
  (spec: "A non-main branch publishes a preview, not production"). No production
  risk yet.
- [ ] 7.2 Confirm the deploy workflow did **not** run for the branch's PR event,
  only the push (spec: "A pull request does not run the deploy").
- [ ] 7.3 Merge/fast-forward to `main`; confirm the production deploy publishes to
  `lunma.app` from the CI-built artifact (spec: "Push to main publishes
  production" + "The CI build is the source of the deployed bytes").
- [ ] 7.4 Confirm the post-deploy smoke passed — `https://lunma.app/` and
  `https://lunma.app/privacy` both `200` (spec: "The privacy URL must resolve").
  This is the URL `extension-release-pipeline` needs for the Chrome Web Store
  listing.
- [ ] 7.5 Confirm the live site sends the hardened headers and a strict CSP:
  `curl -I https://lunma.app/` shows HSTS / nosniff / `Referrer-Policy` /
  `X-Frame-Options` / `Permissions-Policy`; the page carries the CSP and its
  `script-src` has no `'unsafe-inline'`; and a headless load of `/`, `/privacy`,
  `/og` reports **zero CSP violations** (spec: the "hardened response headers"
  requirement — all three scenarios).
- [ ] 7.6 Confirm the deploy is a **separate** workflow and `ci.yml`'s jobs remain
  `contents: read` (spec: "Deploy is isolated from the read-only gate").
- [ ] 7.7 Confirm the Cloudflare token is Pages-scoped only and the secrets are not
  in the tree (spec: "The deploy token is Pages-scoped").
- [ ] 7.8 Confirm the site deployed in its honest pre-launch state (`LAUNCHED =
  false`, "coming soon" CTAs) — flipping it is `extension-release-pipeline`/launch
  work, out of scope here.
- [ ] 7.9 Confirm docs (§6) and this change's artifacts agree with what shipped
  (doc-lockstep); reconcile either side if they drifted.
