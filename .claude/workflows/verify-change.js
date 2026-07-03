export const meta = {
  name: 'verify-change',
  description: 'Invariant sweep over a change branch: parallel reviewers per Lunma invariant, adversarial verification of every finding',
  whenToUse: 'At the end of an OpenSpec change or before merging/committing a branch. Checks the diff against the repo invariants (import DAG, Zod trust boundaries, design tokens & primitive composition, catalog story parity, accessibility, OpenSpec artifact alignment, test coverage). Pass {base: "<ref>"} to diff against something other than main. Complements repo-review (whole-repo) and spec-reviewer (pre-implementation).',
  phases: [
    { title: 'Scope', detail: 'diff the branch, decide which invariant dimensions apply' },
    { title: 'Review', detail: 'one reviewer per relevant dimension' },
    { title: 'Verify', detail: 'adversarial refutation of each finding' },
  ],
}

const base = (args && args.base) || 'main'

const SCOPE_SCHEMA = {
  type: 'object',
  required: ['files', 'dimensions'],
  properties: {
    files: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
    dimensions: {
      type: 'object',
      required: ['dag', 'boundaries', 'tokens', 'stories', 'a11y', 'openspec', 'tests'],
      properties: {
        dag: { type: 'boolean' },
        boundaries: { type: 'boolean' },
        tokens: { type: 'boolean' },
        stories: { type: 'boolean' },
        a11y: { type: 'boolean' },
        openspec: { type: 'boolean' },
        tests: { type: 'boolean' },
      },
    },
  },
}

const FINDINGS_SCHEMA = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'summary', 'severity', 'evidence'],
        properties: {
          file: { type: 'string' },
          line: { type: 'integer' },
          summary: { type: 'string' },
          severity: { enum: ['critical', 'major', 'minor'] },
          evidence: { type: 'string', description: 'What you read in the code that demonstrates the violation, with file:line references' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['refuted', 'reasoning'],
  properties: {
    refuted: { type: 'boolean' },
    reasoning: { type: 'string' },
  },
}

const COMMON = `You are reviewing a change branch in the Lunma repo — an Arc-style vertical-workspace Chrome MV3 extension. pnpm workspace: apps/extension (the extension), apps/site (the SvelteKit marketing site, build-time only), packages/tokens (@lunma/tokens, CSS-only design language). Work read-only. First run: git diff ${base}...HEAD -- <paths relevant to your dimension> to see the change, then read surrounding code as needed to judge it. Only report violations introduced or touched by this diff — pre-existing issues outside the diff are out of scope. Every finding needs concrete file:line evidence from code you actually read; do not speculate. If the diff gives you nothing to review for your dimension, return an empty findings array.`

phase('Scope')
log(`Diffing against ${base}`)

const scope = await agent(
  `Run: git diff ${base}...HEAD --stat and git diff ${base}...HEAD --name-only in the Lunma repo. Return the changed file list, a one-paragraph summary of what the change does, and which review dimensions apply:
- dag: true if any imports changed under apps/extension/src/ or apps/site/src/ (when unsure, true)
- boundaries: true if apps/extension/src/shared/ changed (Zod schemas/migrations, store, message bus), or any storage/message-bus access changed
- tokens: true if any .svelte or .css under apps/extension/src/ or apps/site/src/ changed
- stories: true if any apps/extension/src/ui/*.svelte primitive changed
- a11y: true if any UI-surface .svelte or .css changed (sidebar, launcher, options, content, or apps/site)
- openspec: true if there is an active change under openspec/changes/ (not archive/) that this branch implements
- tests: true unless the diff is docs/config only`,
  { label: 'scope-diff', phase: 'Scope', schema: SCOPE_SCHEMA }
)

if (!scope || scope.files.length === 0) {
  return { confirmed: [], note: `No changes found between ${base} and HEAD` }
}
log(`${scope.files.length} changed files: ${scope.summary || ''}`)

const DIMENSIONS = [
  {
    key: 'dag',
    critical: true,
    prompt: `${COMMON}

Dimension: one-way import DAG. apps/extension/src/ layers may only import in one direction (enforced by Biome noRestrictedImports + noImportCycles):
- shared/ imports nothing else in src/
- ui/ imports shared only (design values come from @lunma/tokens as a CSS import, never a TS edge)
- background/ imports shared (+ launcher/shared for the search engine); no DOM, no surfaces
- sidebar/, options/, launcher/ import ui + shared (launcher may use launcher/shared)
- content/ imports shared only
- apps/site and apps/extension must NOT import each other (both directions gated)
- @lunma/tokens is CSS-only — no JS/TS import from it

Check this diff for: wrong-direction imports, layer leaks (a feature surface reaching past ui/ straight to tokens, or ui/ importing a surface), a component placed in the wrong layer, background/ touching the DOM, cross-app imports between apps/site and apps/extension, or a new import cycle. Biome catches the mechanical cases — you are looking for the subtler placement/layering mistakes and anything that would newly trip the rule. Read docs/architecture.md first so you know the intended layering.`,
  },
  {
    key: 'boundaries',
    critical: true,
    prompt: `${COMMON}

Dimension: Zod trust boundaries. Data crossing a trust boundary — chrome.storage reads, typed message-bus receives, and any external/untrusted input — must be validated by a Zod schema (with a migration when a persisted shape changes) in apps/extension/src/shared/ before the rest of the code trusts it. Unvalidated storage or message payloads are a security and data-integrity risk.

Check in this diff: (1) new/changed persisted state — is there a schema AND a migration so old stored data still parses (not silently dropped/rejected)? (2) new/changed message types — is the payload validated on receive, or trusted raw? (3) any storage read or message handler that consumes a field without parsing it. Findings here are security-adjacent: report anything suspicious even at low confidence, marked minor.`,
  },
  {
    key: 'tokens',
    critical: false,
    prompt: `${COMMON}

Dimension: design tokens & primitive composition. Design values live in @lunma/tokens (packages/tokens, CSS custom properties). Stylelint fails raw font-size/z-index/colour in apps/extension/src/ui. The contract: (1) ui/ primitives reference tokens, never hard-code hex/rgb/hsl, px font sizes, or z-index. (2) feature surfaces (sidebar/, launcher/, options/) COMPOSE ui/ primitives — they never re-roll buttons/tooltips/tiles and never reach past primitives to tokens. (3) a change adding a feature component either composes existing primitives or ships the new ones it needs, in the same change. (4) apps/site composes @lunma/tokens tokens/recipes directly and does NOT reach into the extension's ui/ primitives.

Check this diff for: hard-coded design values that should be tokens, a feature surface bypassing or re-rolling a primitive, or the site importing extension ui/. Read packages/tokens/ to know which tokens exist before flagging a "missing token".`,
  },
  {
    key: 'stories',
    critical: false,
    prompt: `${COMMON}

Dimension: catalog story parity. Every apps/extension/src/ui/<Name>.svelte primitive MUST have a matching apps/extension/catalog/stories/ui/<Name>.stories.svelte (one story file per primitive name). src/ui/stories-coverage.test.ts fails pnpm verify on a story-less primitive.

Check this diff: for every src/ui/*.svelte primitive it ADDS or MODIFIES, is there a corresponding stories file added/updated in the same change? A new primitive without its story is a finding (major). A modified primitive whose story no longer reflects it is a finding (minor). Ignore *.test.* fixtures — they are not primitives.`,
  },
  {
    key: 'a11y',
    critical: false,
    prompt: `${COMMON}

Dimension: accessibility & motion. Every user-visible surface must hold WCAG-AA contrast at every colour-intensity level, support prefers-reduced-motion, and keep motion in the 150–250ms band (Arc-style immersive bar). apps/site has an automated WCAG-AA contrast test; the extension surfaces rely on review.

Check this diff for: (1) new colour pairings that could fail AA contrast (foreground on frosted-glass/aurora backdrops especially). (2) animation/transition declarations with no prefers-reduced-motion fallback. (3) motion durations outside 150–250ms. (4) interactive elements missing accessible names/roles/keyboard handling. Read the relevant tokens so you judge contrast against real values, not guesses.`,
  },
  {
    key: 'openspec',
    critical: false,
    prompt: `${COMMON}

Dimension: OpenSpec artifact alignment. This branch should implement exactly one active change under openspec/changes/<name>/ (proposal.md, design.md, specs/ deltas, tasks.md). Names are normative: file paths and type/method/field names in the artifacts are binding — code must match them, or the artifact was updated in the same change. Deviations require agreement, not silent resolution.

Check this diff against the change's artifacts: (1) does code use a different name (type/method/file/field) than design.md or the spec delta says, with no matching artifact edit in the diff? (2) are tasks.md checkboxes honest — checked items actually implemented, and implemented work checked? (3) is there a behaviour in the code absent from proposal/design, or vice-versa? (4) does the diff touch openspec/specs/ directly (only archiving may) or openspec/changes/archive/ (immutable)? Report drift as a finding with the artifact path and the mismatch.`,
  },
  {
    key: 'tests',
    critical: false,
    prompt: `${COMMON}

Dimension: test coverage (Vitest 4 unit/integration, Playwright e2e smoke). For each new behaviour in this diff (new store transition/reducer arm, new message handler, new Zod schema/migration, new business logic, bug fix), is there a test that exercises it? A bug fix without a reproducing test is a finding (major). New store/reducer or message-bus logic with no test is a finding (major) — the store is expected at ~90% branch coverage. A new Zod schema with no valid/invalid/migration test is a finding (minor). Tests that only exercise a mock of the code under test are findings (minor). Thin wiring/plumbing and generated code do not require tests.`,
  },
]

const active = DIMENSIONS.filter((d) => scope.dimensions[d.key])
log(`Reviewing ${active.length} dimensions: ${active.map((d) => d.key).join(', ')}`)

const results = await pipeline(
  active,
  (d) => agent(d.prompt, { label: `review:${d.key}`, phase: 'Review', schema: FINDINGS_SCHEMA }),
  (review, d) => {
    if (!review || review.findings.length === 0) return []
    const votes = d.critical ? 2 : 1
    return parallel(
      review.findings.map((f) => () =>
        parallel(
          Array.from({ length: votes }, (_, i) =>
            () =>
              agent(
                `${COMMON}

You are an adversarial verifier (perspective ${i + 1} of ${votes}). A reviewer claims this violation in the ${d.key} dimension:

File: ${f.file}${f.line ? ':' + f.line : ''}
Claim: ${f.summary}
Their evidence: ${f.evidence}

Try to REFUTE it. Read the actual code — the cited file plus enough context to be sure. It is refuted if: the code does not do what the reviewer claims, the invariant is actually satisfied (e.g. the value IS validated by a Zod schema further up, the primitive DOES have a story file, the import IS within the allowed layer, the token IS referenced), the code is outside this diff, or the cited rule does not apply here. If after reading the code the claim genuinely holds, refuted=false. If you cannot confirm it from the code, refuted=true.`,
                { label: `verify:${d.key}:${f.file.split('/').pop()}`, phase: 'Verify', schema: VERDICT_SCHEMA }
              )
          )
        ).then((verdicts) => {
          const valid = verdicts.filter(Boolean)
          const upheld = valid.filter((v) => !v.refuted).length
          return { ...f, dimension: d.key, confirmed: valid.length > 0 && upheld > valid.length / 2 }
        })
      )
    )
  }
)

const all = results.filter(Boolean).flat().filter(Boolean)
const confirmed = all.filter((f) => f.confirmed)
const order = { critical: 0, major: 1, minor: 2 }
confirmed.sort((a, b) => order[a.severity] - order[b.severity])

log(`${all.length} raw findings, ${confirmed.length} survived adversarial verification`)
return {
  base,
  filesReviewed: scope.files.length,
  dimensionsReviewed: active.map((d) => d.key),
  confirmed,
  refutedCount: all.length - confirmed.length,
}
