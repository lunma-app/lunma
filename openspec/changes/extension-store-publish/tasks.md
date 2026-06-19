> Status: **authored, not yet implemented.** All tasks pending `/opsx:apply`.
> The workflow step (§1) + docs (§2) are implementable now; *arming* it (§3) waits
> on the maintainer's one-time Chrome Web Store + OAuth setup (design D4).

## 1. CWS upload + publish step

- [x] 1.1 In `.github/workflows/release-please.yml`, after the existing
  build-and-attach step, add a Chrome Web Store publish step gated on **both**
  `steps.release.outputs.release_created == 'true'` **and** `env.HAS_CWS == 'true'`
  (a job-level env flag `HAS_CWS: ${{ secrets.CWS_EXTENSION_ID != '' }}`, since
  secrets can't be read in `if:` — so it skips cleanly until configured, design D2).
- [x] 1.2 The step runs `pnpm dlx --package=chrome-webstore-upload-cli@4.0.1
  chrome-webstore-upload --source "lunma-<version>.zip"` (no subcommand = upload +
  publish), with `EXTENSION_ID` / `CLIENT_ID` / `CLIENT_SECRET` / `REFRESH_TOKEN`
  set via `env` from the `CWS_*` secrets (never echoed) — design D1/D3. Reuse the
  zip the build step produced.
- [x] 1.3 Confirm the step adds **no** new required PR status context (runs in the
  push-triggered Release workflow gated on `release_created`), **no** runtime
  dependency (CLI via `pnpm dlx`), and that a missing `CWS_EXTENSION_ID` skips the
  step while the release + GitHub asset still succeed (spec: both ADDED
  requirements).

## 2. Documentation (doc-lockstep)

- [x] 2.1 `docs/releasing.md`: add the CWS publish step to the release flow and a
  **one-time setup** section — register a CWS developer account ($5), manually
  upload `lunma-0.1.0.zip` to create the listing + obtain the item id, create a
  Google OAuth client + refresh token, and `gh secret set` the four `CWS_*`
  secrets. Note auto-publish vs draft (design D2) and the refresh-token-expiry
  recovery.
- [x] 2.2 `docs/tech-stack.md`: note CWS publish via `chrome-webstore-upload-cli`
  (`pnpm dlx`, no dependency) in the versioning/releases section. Confirm
  `docs/architecture.md` needs no change (release tooling, no DAG impact) —
  stated, not edited.

## 3. Arm + verify (maintainer-owned external prerequisites — design D4)

- [ ] 3.1 Land §1–§2 on a branch; PR green on `verify` + `e2e`; merge to `main`
  (clean noreply identity). The step is inert until the secrets exist (§1.1 gate).
- [ ] 3.2 **(maintainer)** One-time bootstrap: CWS developer account; manual
  dashboard upload of `lunma-0.1.0.zip` + listing → obtain `CWS_EXTENSION_ID`;
  Google OAuth client + refresh token; `gh secret set` the four `CWS_*` secrets.
- [ ] 3.3 **(maintainer)** Perform the first store submission manually from the
  dashboard (accompanies listing copy/screenshots) — this is the "first Chrome
  Web Store publish" milestone (design D5).
- [ ] 3.4 On the next release after arming, confirm the new version auto-uploads
  and appears in the dashboard as pending review (spec: "A configured release
  publishes to the store").
- [ ] 3.5 Mark `open-source-public-launch` tasks §3.1's store-publish gate
  satisfiable; archive this change once §1–§3 are green; the
  `extension-release-pipeline` spec gains the store-publish requirements.
