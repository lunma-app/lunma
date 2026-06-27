## ADDED Requirements

### Requirement: Each configured release is published to the Chrome Web Store

The release workflow SHALL upload the packaged extension to the Chrome Web Store
and submit it for publish whenever it cuts a release and the store credentials
are configured, authenticated with the stored OAuth credentials (client id,
client secret, refresh token) for the configured store item id. The upload SHALL
run after the artifact is built and only when a release is created. When the
store credentials are absent, the publish step SHALL be skipped and the release
SHALL still succeed — the downloadable GitHub release asset is always produced
regardless.

#### Scenario: A configured release publishes to the store

- **WHEN** a release is cut and the Chrome Web Store credentials/item id are
  present in the repo secrets
- **THEN** the built extension is uploaded to the Chrome Web Store for that item
  and submitted for publish (entering Google's review queue)

#### Scenario: An unconfigured release still ships the GitHub asset

- **WHEN** a release is cut but the Chrome Web Store credentials are not yet
  configured (e.g. before the listing is bootstrapped)
- **THEN** the store publish step is skipped, no error fails the release, and the
  `lunma-<version>.zip` GitHub release asset is still produced

#### Scenario: No upload when no release is cut

- **WHEN** the release automation runs on a push that does not create a release
- **THEN** no store upload runs

### Requirement: Store publish adds no PR-required check, no runtime dependency, and never exposes credentials

The Chrome Web Store publish SHALL run inside the existing push-triggered release
workflow (gated on a release being created), SHALL NOT introduce a new required
pull-request status check, and SHALL NOT add any runtime dependency to any
`package.json` (the upload CLI runs via `pnpm dlx` at a pinned version). Store
credentials SHALL be stored as repository secrets and never written to logs.

#### Scenario: Required-check set is unchanged

- **WHEN** the store-publish step is in place
- **THEN** it adds no new required pull-request status context; it runs in the
  push-triggered release workflow, not as a PR gate

#### Scenario: No runtime dependency and no leaked credentials

- **WHEN** the store publish runs
- **THEN** it adds no entry to any workspace `package.json` `dependencies`, and
  the OAuth credentials are read from secrets without being echoed to the log
