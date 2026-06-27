## Why

Users install Lunma from the **Chrome Web Store** — and right now nothing puts it
there. Phase 1 of `extension-release-pipeline` produces a downloadable
`lunma-<version>.zip` on each GitHub release; this change (phase 2) **uploads that
build to the Chrome Web Store and submits it for publish automatically on each
release**, so a merged Release PR reaches actual users instead of stopping at a
GitHub asset. That is the user-visible value: a released version becomes an
installable product.

It is also the **gating milestone** named throughout the roadmap: the
`open-source-public-launch` flip is blocked on the first Chrome Web Store publish
(its tasks §3.1 first gate). This change is what makes that publish happen, so it
directly unblocks the public launch (user-value policy, shape b — named
downstream consumer: `open-source-public-launch`).

## What Changes

- **CWS upload + publish on release.** `.github/workflows/release-please.yml`
  gains, after the existing build-and-attach step (and gated the same way on
  `steps.release.outputs['apps/extension--release_created'] == 'true'`), a step that uploads the
  freshly built zip to the Chrome Web Store and submits it for publish, using
  `chrome-webstore-upload-cli` run via `pnpm dlx` at a pinned version (no
  `package.json` dependency — the same no-dep pattern as the site's `wrangler`
  deploy), authenticated with CWS API OAuth credentials from repo secrets. The
  phase-1 GitHub release asset is still produced regardless.
- **New repo secrets (user-provided).** `CWS_EXTENSION_ID`, `CWS_CLIENT_ID`,
  `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN` — set via `gh secret set` from
  1Password; never echoed. Not present in the repo until the maintainer creates
  them (see Impact → external prerequisites).
- **Documented release + setup flow.** `docs/releasing.md` gains the CWS publish
  step and the one-time dashboard/OAuth setup; `docs/tech-stack.md` notes the
  publish tool (CLI via `pnpm dlx`, no dependency).

This change ships **no `src/` code and no user-visible surface** in the extension
or site — no `Visual language` section and no `src/ui/` primitive work apply
(explicit exemption per the visual-quality and component-library policies, same as
phase 1).

## Capabilities

### New Capabilities
<!-- None. This extends an existing capability. -->

### Modified Capabilities
- `extension-release-pipeline`: ADD requirements for Chrome Web Store
  upload/publish. Phase 1 established "build the artifact and attach it to the
  GitHub release"; this phase adds "upload that artifact to the Chrome Web Store
  and submit it for publish on each release", completing the build→ship pipeline.

## Impact

- **Modified files:**
  - `.github/workflows/release-please.yml` — add the gated CWS upload+publish step
    after build-and-attach.
  - `docs/releasing.md`, `docs/tech-stack.md` — the CWS publish step + one-time
    setup (doc-lockstep).
- **Modified OpenSpec spec (on archive):** `openspec/specs/extension-release-pipeline/spec.md`
  (adds the store-publish requirements to the existing living spec).
- **Untouched docs (stated per doc-lockstep):** `docs/architecture.md` — release
  tooling, no import-layer/DAG impact.
- **New repo secrets (not files):** `CWS_EXTENSION_ID`, `CWS_CLIENT_ID`,
  `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`.
- **External, maintainer-owned prerequisites (the automation cannot run until
  these exist — named here so the dependency is explicit):**
  1. A **Chrome Web Store developer account** (one-time US$5 registration fee).
  2. The extension **registered once in the CWS Developer Dashboard** via an
     initial manual upload of `lunma-0.1.0.zip` (the back-filled phase-1 asset),
     which creates the listing and yields the `CWS_EXTENSION_ID` item id. The
     **store listing** itself (description, screenshots, category, privacy
     practices) is authored and maintained in the dashboard — out of scope here.
  3. A **Google Cloud OAuth client + refresh token** for the Chrome Web Store API
     (provides `CWS_CLIENT_ID`/`CWS_CLIENT_SECRET`/`CWS_REFRESH_TOKEN`).
  Because the item id can only exist after the first manual dashboard upload, the
  automation begins meaningfully from the **next release after** the listing +
  secrets exist (design D4).
- **CI / required checks:** the publish step runs inside the existing
  push-to-`main` `Release` workflow, gated on `release_created` — **not** a PR
  status check. `open-source-public-launch`'s required-check set
  (`verify` + `e2e` + `dco` + `identity`) is **unchanged**.
- **Dependencies:** none added to any `package.json` (`chrome-webstore-upload-cli`
  runs via `pnpm dlx` at a pinned version).
- **Out of scope:** store listing copy/screenshots/metadata management
  (dashboard-owned); promotion through Google's (asynchronous) review queue;
  release channels (beta / trusted-tester); rollback/unpublish automation.
