## Why

Users with a Bitbucket Server / Data Center account never see their draft pull
requests marked as drafts in the lens overview — every Server/DC PR renders
identically to a ready-for-review one (no `Draft: ` title prefix, no hollow
CI-light glyph), even though GitHub, GitLab, and Bitbucket Cloud sections
already get that treatment. This was believed correct: the connector's design
(archived change `2026-06-29-add-bitbucket-connector`) recorded, as an
accepted v1 limitation, that "the dashboard list carries no draft flag."

That assumption is wrong. Verified against a live Bitbucket Data Center
instance: `GET {baseUrl}/rest/api/1.0/dashboard/pull-requests?state=OPEN&role=AUTHOR`
returns PR objects that DO carry a `draft` boolean (`draft: true` for actual
drafts) — Lunma's connector already receives this field on every poll and
silently discards it by hardcoding `draft: false`. Fixing the read is a
data-accuracy correction with no new request needed.

## What Changes

- `ServerPrSchema` (`apps/extension/src/background/connectors/bitbucket.ts`)
  gains an optional `draft: z.boolean()` field.
- `serverChange()` sets `draft: pr.draft === true` instead of the hardcoded
  `false`.
- `serverItem()` prefixes the `LensItem` title with `Draft: ` when
  `pr.draft === true`, matching the existing GitHub (`github.ts`), GitLab
  (`gitlab.ts`), and Bitbucket Cloud (`bitbucket.ts` `fetchCloud`) precedent —
  giving Server/DC drafts the same at-a-glance treatment every other source
  already has.
- New fixtures in `bitbucket.test.ts` covering a Server/DC draft PR end to
  end: raw API `draft: true` → normalized `change.draft === true` and a
  `Draft: `-prefixed title.
- **Cross-source audit** (triggered by this bug — a wrong assumption that
  went untested for one source): every other connector's draft handling is
  re-checked against its existing test suite, not just read from code, since
  Bitbucket Server/DC's bug was exactly a false assumption nobody had a test
  to catch. Findings:
  - **GitHub** (`github.ts`/`github.test.ts`): already correct and already
    covered — `github.test.ts:460` ("a draft PR detail prefixes the title
    with Draft: ") exercises `draft: true` end to end. No change.
  - **GitLab** (`gitlab.ts`/`gitlab.test.ts`): the normalizer code is correct
    (`draft = mr.draft ?? mr.work_in_progress ?? false`), but every existing
    fixture hardcodes `draft: false` — there is no test proving the `true`
    path actually works. This change adds one, closing the same class of
    blind spot the Bitbucket Server bug fell through. No behavior change.
  - **Bitbucket Cloud** (`bitbucket.ts` `fetchCloud`/`bitbucket.test.ts`):
    already correct and already covered — `bitbucket.test.ts:249` exercises
    `draft: true` end to end (title prefix + `change.draft`). No change.
    (Unlike Server/DC's undocumented dashboard endpoint, Cloud's `draft`
    field is part of Atlassian's public, versioned Cloud API — lower risk,
    not independently re-verified against a live Cloud instance in this
    change.)
- `docs/architecture.md` is not affected (connector internals only, no
  layer/DAG change). No new files, dependencies, or public types are
  introduced — this is a targeted correction inside an existing connector
  plus one added test elsewhere.
- The archived change `2026-06-29-add-bitbucket-connector` is immutable, so
  this change's `design.md` records that it supersedes that change's D1-table
  "draft" row and the related Risks-section note, rather than editing the
  archive.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `lenses`: the requirement "The Bitbucket connector fetches canned queries
  over the Server and Cloud APIs" currently states the Server/DC path's
  normalization gives `draft` a hardcoded `false` ("Server's listed shape has
  no draft → `false`"). This changes to: Server/DC reads the API's real
  `draft` field (same as Cloud), and the item title is prefixed `Draft: ` when
  true.

## Impact

- **Code**: `apps/extension/src/background/connectors/bitbucket.ts` (schema +
  two normalize functions), `apps/extension/src/background/connectors/bitbucket.test.ts`
  (new fixtures/assertions), `apps/extension/src/background/connectors/gitlab.test.ts`
  (new draft:true coverage, no source change).
- **User-visible**: Server/DC draft PRs in any `review` lens now show the
  `Draft: ` title prefix and the hollow CI-light glyph in the sidebar and
  launcher overview — parity with GitHub/GitLab/Bitbucket Cloud. No new
  network requests, no schema/migration changes, no new permissions.
- **Specs**: `openspec/specs/lenses/spec.md` (the Bitbucket requirement's
  normalization clause, ~line 1811-1821).
