## Context

`extension-release-pipeline` phase 1 (archived) builds `lunma-<version>.zip` and
attaches it to the GitHub release, gated on release-please's `release_created`
output inside `.github/workflows/release-please.yml`. The release exists and is
downloadable, but nothing puts it in front of users — the Chrome Web Store is the
real install path, and it is empty.

The Chrome Web Store has a published HTTP API for uploading a new package version
to an existing *item* and submitting it for publish, authenticated with a Google
OAuth client (client id + secret + a long-lived refresh token). The well-trodden
wrapper is `chrome-webstore-upload-cli`, runnable without installing it as a
dependency (`pnpm dlx chrome-webstore-upload-cli@<pinned>`), mirroring how the
site deploy runs `wrangler` via `pnpm dlx` with no `package.json` entry.

The API can only target an item that already exists. The first listing — and the
item id — must be created **manually** in the CWS Developer Dashboard (a one-time
US$5-registered account, an initial upload, plus the listing copy/screenshots).
So this change automates every release *after* the listing and credentials exist;
it cannot bootstrap the very first listing.

This change ships no `src/` code and no user-visible surface, so the
visual-quality and component-library policies do not apply (explicit exemption).

## Goals / Non-Goals

**Goals:**
- Every release, when configured, uploads the built extension to the Chrome Web
  Store and submits it for publish — no manual upload per release.
- No new secret leaks, no runtime dependency, no new required CI check.
- Releases still succeed (and still attach the GitHub asset) when the store
  credentials are not yet configured, so phase 1 is never regressed.
- Unblock `open-source-public-launch`'s public flip (its first gate).

**Non-Goals:**
- Creating/maintaining the store listing (copy, screenshots, category, privacy
  practices) — dashboard-owned.
- Driving the package through Google's review queue (review is asynchronous and
  Google's; we submit, we don't approve).
- Release channels (beta / trusted-tester), staged rollout, rollback/unpublish.

## Decisions

### D1 — `chrome-webstore-upload-cli` via `pnpm dlx`, no dependency

Run `pnpm dlx --package=chrome-webstore-upload-cli@4.0.1 chrome-webstore-upload --source <zip>`
(version pinned in the invocation; the package's bin is `chrome-webstore-upload`),
as a step after the build-and-attach step. The no-subcommand default of the CLI
is **upload + publish** (auto-publish); credentials come from the `EXTENSION_ID` /
`CLIENT_ID` / `CLIENT_SECRET` / `REFRESH_TOKEN` env vars.

- **Why the CLI over a pinned third-party Action** (e.g. `mnao305/chrome-extension-upload`):
  it matches the established no-dep pattern already used for the site's `wrangler`
  deploy (`pnpm dlx wrangler@<version>`), keeps the toolchain in one place
  (pnpm/dlx), and avoids granting a third-party Action access to the store
  credentials. Pinned by exact version in the `dlx` call for reproducibility.
- **Considered:** the raw CWS REST API via `curl` — more moving parts (token
  exchange, multipart upload, publish call) for no benefit over the CLI.

### D2 — Upload **and** publish, but skip gracefully when unconfigured

Default to the CLI's no-subcommand command, which **uploads and publishes**
(submit to the default/public audience, entering Google's review). The step is
gated on **both** `release_created == 'true'` **and** the store credentials being
present (surfaced as the `HAS_CWS` env flag from `secrets.CWS_EXTENSION_ID != ''`,
since secrets can't be read in `if:` directly), so before the listing/secrets
exist the step is skipped and the release (and its GitHub asset) still succeeds.

- **Why publish, not draft:** the automation's purpose is to ship; a draft still
  needs a manual dashboard click. Switching to upload-only is a one-word reversal
  — use the CLI's `upload` subcommand (`chrome-webstore-upload upload --source …`)
  instead of the default — if the maintainer prefers to submit by hand.
- **Why skip-when-unconfigured:** a hard failure would red-fail every release
  until the store is set up, and would fail *after* the tag/release already
  exist. Skipping keeps phase 1 fully working in the interim (the
  "unconfigured release still ships the GitHub asset" scenario).
- **First submission:** the very first store submission is typically done by hand
  from the dashboard (it accompanies the listing copy + screenshots Google needs);
  automation takes over from the next release.

### D3 — Least-privilege secrets, never echoed

`CWS_EXTENSION_ID`, `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN` are
repo secrets, passed to the CLI via env, never printed. The OAuth client is
scoped to the Chrome Web Store API only. No `GITHUB_TOKEN` permission change is
needed (the publish talks to Google, not GitHub).

### D4 — Manual bootstrap of the listing + item id (unavoidable)

The CWS API requires an existing item id, which only exists after a first manual
dashboard upload. So:
1. The maintainer registers a CWS developer account, manually uploads the
   back-filled `lunma-0.1.0.zip`, and completes the listing → obtains the item id.
2. Creates a Google OAuth client + refresh token for the CWS API.
3. Sets the four secrets via `gh secret set` (from 1Password).
After that, the next release auto-publishes. This change's automation is therefore
"armed" by those one-time steps; it is correct and inert until then (D2's skip).

### D5 — This change is the gate for `open-source-public-launch`

`open-source-public-launch`'s flip is blocked on "the first Chrome Web Store
publish is live" (its tasks §3.1). The first publish is the manual bootstrap
(D4); thereafter this automation keeps it current. So landing + arming this change
is what satisfies that gate — its named downstream consumer.

## Risks / Trade-offs

- **[Google review rejects or delays a submission]** → Review is asynchronous and
  outside our control; the automation's job ends at "submitted". A rejection is
  handled in the dashboard; it does not corrupt the release (the tag/asset stand).
- **[`chrome-webstore-upload-cli` major changes / is yanked]** → Pinned by exact
  version in the `dlx` call; bump deliberately. CI-only, no runtime blast radius.
- **[Refresh token expires / is revoked]** → The publish step fails (loudly) on
  that release; the release + GitHub asset still succeed (the step runs last).
  Re-mint the token and re-run. Documented in `docs/releasing.md`.
- **[Auto-publishing an unreviewed/bad build]** → Mitigated by the version guard
  + the reviewable Release PR before merge; and Google's own review stands between
  submission and users. `--auto-publish` can be dropped to require a manual
  dashboard submit if tighter control is wanted (D2).
- **[Secrets in logs]** → Passed via env to the CLI, never echoed (D3).

## Migration Plan

Additive; no `src/` changes, phase 1 untouched and never regressed.

1. Add the gated CWS publish step to `release-please.yml`; document setup in
   `docs/releasing.md` + `docs/tech-stack.md`.
2. Maintainer performs the one-time bootstrap (D4): dashboard listing + item id,
   OAuth refresh token, four `gh secret set`.
3. The next release auto-uploads + submits; confirm the new version appears in the
   dashboard as "pending review".

**Rollback:** remove the publish step (releases revert to GitHub-asset-only), or
drop `--auto-publish` to upload-as-draft. Unsetting the secrets disarms it (D2).

## Open Questions

- **Auto-publish vs draft for the steady state** — defaulting to auto-publish;
  revisit if Google's review cadence makes manual submission preferable. Not
  blocking (one-flag change).
- **None blocking.** The change is implementable now; *arming* it waits on the
  maintainer's one-time store/OAuth setup (D4).
