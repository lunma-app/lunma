## Context

`apps/extension/src/background/connectors/bitbucket.ts` fetches PRs for a
`review` lens over two non-API-compatible Bitbucket deployments. The
Server/DC path (`fetchServer`) calls
`GET {baseUrl}/rest/api/1.0/dashboard/pull-requests?state=OPEN&role=AUTHOR|REVIEWER`
and normalizes each returned PR via `serverItem`/`serverChange`.

The archived change `2026-06-29-add-bitbucket-connector` designed this
normalizer on the (incorrect) assumption that the dashboard endpoint's PR
shape carries no draft signal, and hardcoded `draft: false`
(`design.md` D1 table, row "draft"; Risks section, "DC version variance").
That assumption has now been disproved against a live Bitbucket Data Center
instance: a direct call to the same endpoint the connector uses returns PR
objects with a real `draft` boolean, `true` for actual drafts. This change
corrects the normalizer to read that field, matching how `serverVerdict`/
`serverReviewers` already read other optional fields off the same response
shape defensively.

This design **supersedes** the D1-table "draft" row and the "DC version
variance" risk note's draft-related sentence in the archived
`2026-06-29-add-bitbucket-connector/design.md` — that file is not edited (the
archive is immutable), but its normative claim about the Server/DC shape no
longer holds and this document is the record of that correction.

## Goals / Non-Goals

**Goals:**
- Read the real `draft` field from the Server/DC dashboard PR response
  instead of hardcoding `false`.
- Give Server/DC draft items the same `Draft: ` title prefix Bitbucket Cloud,
  GitHub, and GitLab already apply, so the lens overview's existing hollow
  CI-light glyph (`overview-vm.ts`) picks them up for free — no UI code
  changes needed.
- Cover the new behavior with fixtures in `bitbucket.test.ts`.
- Audit every other connector's draft handling against its actual test
  suite (not just a code read) before calling this fixed — the Server/DC bug
  was exactly an unverified assumption; the same class of gap could exist
  elsewhere undetected.

**Non-Goals:**
- Bitbucket Cloud is out of scope. `CloudPrSchema`/`cloudChange` already
  parse `draft` from the Cloud list response and `fetchCloud` already applies
  the title prefix (`bitbucket.ts` current code) — unaffected by this change.
- No change to which PRs are fetched (no new request, no new query
  parameter, no pagination change) — this is a normalization-only fix; the
  field was already present in every response the connector already
  receives.
- No change to `openspec/specs/connector-accounts/spec.md` — grepped for
  draft-related requirements; none exist there (it covers account/token
  storage, not per-item normalization).

## Decisions

### D1 — Read `draft` directly off the existing dashboard response (no new request)

Add `draft: z.boolean().optional()` to `ServerPrSchema` and set
`draft: pr.draft === true` in `serverChange()` (mirroring the `=== true`
pattern `fetchCloud`'s `cloudChange` already uses, so a missing/non-boolean
field degrades to `false` rather than throwing).

Alternative considered: re-verify against Bitbucket's OpenAPI/REST docs
before trusting the live-instance observation. Rejected — Atlassian's public
docs for this endpoint don't document the field either way (checked during
triage), and the live response is stronger evidence than absent
documentation; the schema's `.optional()` keeps this safe even if some DC
versions omit the field.

### D2 — Title-prefix Server/DC drafts the same way Cloud/GitHub/GitLab do

In `serverItem()`, prefix the title with `Draft: ` when `pr.draft === true`,
copying the exact ternary `fetchCloud` already uses
(`pr.draft === true ? \`Draft: ${pr.title}\` : pr.title`). This keeps the
at-a-glance behavior identical across every Bitbucket deployment and every
other connector, rather than relying solely on the hollow CI-light glyph
(which is a smaller, easy-to-miss visual signal on its own — see
`lenses/spec.md` scenario "A draft change shows a hollow CI light").

Alternative considered: rely on the hollow CI-light glyph alone (no title
change), since `change.draft` alone already drives that glyph in
`overview-vm.ts` regardless of the title. Rejected for consistency — every
other source in the lens (GitHub, GitLab, Bitbucket Cloud) prefixes the
title, and a user scanning a mixed-source lens would otherwise see Bitbucket
Server drafts treated differently for no principled reason.

### D3 — Cross-source audit method: read code AND run/extend its tests, don't just re-read the code

Trusting a code read alone was exactly how the Server/DC bug shipped — the
archived design's D1 table asserted "no draft concept on the listed shape"
and nobody had a test that could contradict it. So for each other connector
this change:

1. Reads the normalizer code that sets `change.draft` / the title prefix.
2. Confirms whether an existing test actually exercises the `draft: true`
   path (not just reads the code and assumes it works).
3. Adds a test if step 2 finds a gap, rather than accepting "the code looks
   right" as sufficient.

Results:
- **GitHub** — `github.ts` derives `draft` and the title prefix from the same
  PR-detail field (`d.draft === true`); `github.test.ts:460` already asserts
  `draft: true` → `Draft: ` prefix end to end. Verified, no gap, no change.
- **GitLab** — `gitlab.ts:373` (`mr.draft ?? mr.work_in_progress ?? false`)
  is correct; GitLab (unlike GitHub) bakes `Draft:` into the MR title itself
  server-side, so there's no separate title-prefix step to test. But every
  fixture in `gitlab.test.ts` hardcodes `draft: false` — no test proves the
  `true` path populates `change.draft` correctly. Gap; this change adds a
  `draft: true` case to the existing review-lens change-enrichment test.
- **Bitbucket Cloud** — `fetchCloud`'s `cloudChange` reads `pr.draft === true`
  and `serverItem`'s Cloud sibling already applies the title prefix;
  `bitbucket.test.ts:249` ("draft PRs carry the draft flag and a 'Draft:'
  title prefix") already exercises `draft: true` end to end. Verified, no
  gap, no change. (Residual risk: this is confirmed against the connector's
  own test fixture, not against a live Cloud API response the way Server/DC
  was — Cloud's `draft` field is part of Atlassian's public, versioned REST
  API, which is a materially different confidence level than the
  undocumented Server/DC dashboard endpoint that motivated this change.)

Alternative considered: skip the audit, ship only the Server/DC fix. Rejected
— the user explicitly asked this change to confirm the other sources, and a
code-only read is the same failure mode that let this bug through in the
first place.

## Risks / Trade-offs

- **Undocumented field, version variance** → some older/newer DC releases
  might name or shape this differently. Mitigation: `.optional()` on the
  Zod field means a missing/differently-shaped field degrades to `draft:
  false` (today's behavior) rather than failing the whole section; this is
  the same defensive posture the schema already uses for `reviewers`,
  `fromRef`, and `links`.
- **Spec drift with the archived change** → the archived
  `2026-06-29-add-bitbucket-connector/design.md` still asserts the old,
  wrong claim and cannot be edited. Mitigation: this document explicitly
  records the supersession (see Context); the living
  `openspec/specs/lenses/spec.md` requirement is corrected via this change's
  spec delta, which is the actual source of truth going forward.

## Migration Plan

Additive, non-breaking, no data model or schema-version change (this is
runtime-fetched data, not persisted state). Ships as a normal code change;
no rollback concerns beyond reverting the commit.
