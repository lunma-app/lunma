export const meta = {
  name: 'repo-review',
  description: 'Multi-dimensional engineering review producing ranked actionable items',
  phases: [
    { title: 'Load History', detail: 'Read previous review results for comparison' },
    { title: 'Scan', detail: 'Parallel review across 8 engineering dimensions' },
    { title: 'Synthesize', detail: 'Rank and prioritize all findings into an action list' },
    { title: 'Persist', detail: 'Write results to persistent memory for next run' },
  ],
}

const ROOT = '/Users/emanuel.fonseca/Workspaces/lunma'
const HISTORY_PATH = `${ROOT}/.claude/repo-review-history.json`

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          location: { type: 'string' },
          description: { type: 'string' },
          action: { type: 'string' },
        },
        required: ['title', 'severity', 'description', 'action'],
      },
    },
  },
  required: ['findings'],
}

const HISTORY_SCHEMA = {
  type: 'object',
  properties: {
    found: { type: 'boolean' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rank: { type: 'number' },
          title: { type: 'string' },
          dimension: { type: 'string' },
          severity: { type: 'string' },
          location: { type: 'string' },
        },
        required: ['title', 'dimension'],
      },
    },
  },
  required: ['found', 'items'],
}

const SYNTHESIS_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rank: { type: 'number' },
          dimension: { type: 'string' },
          title: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          location: { type: 'string' },
          action: { type: 'string' },
          rationale: { type: 'string' },
          status: { type: 'string', enum: ['new', 'recurring'] },
        },
        required: ['rank', 'dimension', 'title', 'severity', 'action', 'rationale', 'status'],
      },
    },
    resolvedItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          dimension: { type: 'string' },
          location: { type: 'string' },
        },
        required: ['title', 'dimension'],
      },
    },
  },
  required: ['items', 'resolvedItems'],
}

const DIMENSIONS = [
  {
    key: 'architecture',
    label: 'Architecture Integrity',
    model: 'claude-sonnet-4-6',
    prompt: `You are reviewing the Lunma Chrome MV3 extension for architecture integrity violations.
Root: ${ROOT}

One-way import DAG enforced by Biome:
- shared/ → nothing else in src/
- ui/ → shared only
- background/ → shared only, no DOM
- sidebar/, options/, launcher/ → ui + shared
- content/ → shared only
- apps/site ↔ apps/extension: no cross-imports
- @lunma/tokens is CSS-only; no JS/TS imports from it

Steps:
1. Read docs/architecture.md
2. Grep import statements across apps/extension/src/
3. Check biome.json for noRestrictedImports config

Look for: wrong-direction imports, layer leaks (feature components reaching past ui/ to tokens), cross-app boundary breaches, circular imports, components placed in the wrong layer.

Return findings with exact file paths and concrete fix actions.`,
  },
  {
    key: 'typesafety',
    label: 'Type Safety & Toolchain',
    model: 'claude-sonnet-4-6',
    prompt: `You are reviewing the Lunma Chrome MV3 extension for type safety and toolchain issues.
Root: ${ROOT}
Stack: TypeScript strict, Svelte 5 (runes), Vite 8, Biome 2, Stylelint 17, Zod 4.

Steps:
1. Read tsconfig files and biome.json
2. Grep for 'any', 'as unknown', '@ts-ignore', '@ts-expect-error' across src/
3. Read Zod schemas in shared/ and check coverage of external data boundaries
4. Grep for Svelte 5 rune patterns ($state, $derived, $effect) and check correctness

Look for: unsafe any usage, missing Zod validation at trust boundaries (storage reads, message receives), Svelte 5 runes misuse, Biome suppressions hiding real issues, missing/incorrect type exports, Zod schema/type mismatches.

Return findings with exact file:line references and concrete fix actions.`,
  },
  {
    key: 'security',
    label: 'Security',
    model: 'claude-opus-4-8',
    prompt: `You are a security expert reviewing the Lunma Chrome MV3 extension.
Root: ${ROOT}
Surfaces: service worker (background/), content scripts (content/), sidebar, launcher, options.

Steps:
1. Read apps/extension/manifest.json (or src/manifest.json or vite config for manifest)
2. Read background/ scripts and the message bus in shared/
3. Read content/ scripts
4. Read any storage access code

Look for:
1. Overly broad manifest permissions
2. CSP gaps
3. Message bus trust issues (unvalidated messages from content scripts or web pages)
4. Content script XSS or DOM clobbering risks
5. Sensitive data (URLs, history) stored or exposed insecurely
6. Use of eval, executeScript with dynamic strings, or other dynamic code execution
7. Storage values not validated on read (Zod or otherwise)
8. Cross-origin communication risks

Be thorough — security findings have high blast radius. Return findings with the vulnerable pattern, file:line, and a concrete remediation.`,
  },
  {
    key: 'testing',
    label: 'Test Coverage',
    model: 'claude-sonnet-4-6',
    prompt: `You are reviewing the Lunma Chrome MV3 extension for test coverage gaps.
Root: ${ROOT}
Test stack: Vitest 4 (unit/integration), Playwright (e2e smoke).

Steps:
1. List all test files under apps/extension/src/ and apps/extension/e2e/
2. Read vitest config
3. Cross-reference source files in shared/, background/ against tests
4. Check e2e tests for critical user flow coverage

Look for: untested store operations and state transitions, message bus handlers with no test, Zod schemas not exercised in tests, untested edge cases in business logic, background service worker logic with no coverage, missing e2e coverage for critical flows (tab switching, workspace creation, search).

Return findings naming the specific untested file/function and a concrete action (what test to write, where).`,
  },
  {
    key: 'openspec',
    label: 'OpenSpec Alignment',
    model: 'claude-sonnet-4-6',
    prompt: `You are reviewing whether the Lunma implementation matches its OpenSpec change artifacts.
Root: ${ROOT}
Active changes: openspec/changes/ — each has proposal.md, design.md, specs/, tasks.md.
Capability specs: openspec/specs/.

Steps:
1. List all active changes in openspec/changes/ (exclude archive/)
2. For each change, read tasks.md and note unchecked vs checked tasks
3. For unchecked tasks, check if code exists that implements them
4. For checked tasks, verify the code actually exists
5. Compare type/method/file names in design.md and specs/ against src/

Look for: checkbox drift (unchecked tasks that are implemented), phantom tasks (checked but no code), name mismatches (specs say X, code says Y), behaviors in design.md absent from code.

Return findings with the artifact path, the discrepancy, and the reconciliation action.`,
  },
  {
    key: 'code-quality',
    label: 'Code Quality',
    model: 'claude-sonnet-4-6',
    prompt: `You are reviewing the Lunma Chrome MV3 extension for code quality and clean code issues.
Root: ${ROOT}
Stack: TypeScript strict, Svelte 5 (runes), Vite 8.

Steps:
1. List all source files under apps/extension/src/ and packages/
2. Grep for TODO, FIXME, HACK, XXX comments
3. Read the largest files (>300 lines) and check for single-responsibility violations
4. Grep for duplicated logic patterns across files (repeated switch arms, copy-pasted error handling, identical helper functions)
5. Check for magic strings and magic numbers not backed by a named constant or enum
6. Grep for dead exports: symbols exported but never imported elsewhere in the codebase
7. Check function complexity: functions >40 lines or with deeply nested conditionals (>3 levels)

Look for:
- Dead code: exported symbols, unreachable branches, unused parameters
- Duplication: copy-pasted blocks that should be extracted into a shared helper
- God objects/files: files doing too many things, functions with too many responsibilities
- Magic values: inline string literals or numeric constants that should be named
- Unnecessary comments: comments that restate what the code already says (e.g. \`// increment i\` above \`i++\`), noise JSDoc on obvious getters/setters, section-header comments that just name a block of code
- Stale comments: commented-out code, misleading or outdated comments
- Naming drift: inconsistent naming conventions (camelCase vs snake_case, plural vs singular, Hungarian notation)
- TODO/FIXME debt: annotated issues that should be tracked or resolved
- Unnecessary complexity: overly convoluted logic where a simpler approach exists

Return findings with exact file:line references and a concrete refactor action. Skip findings already covered by Biome's lint rules (those are enforced automatically).`,
  },
  {
    key: 'visual',
    label: 'Visual Quality',
    model: 'claude-sonnet-4-6',
    prompt: `You are reviewing the Lunma Chrome MV3 extension for visual quality and design system compliance.
Root: ${ROOT}
Design system: packages/tokens/ — CSS custom properties only.
Bar: Arc-style — frosted-glass, aurora backdrop, hue glow, 150–250ms motion, Instrument Serif + Mona Sans.
Rules: WCAG-AA contrast at all color intensities, prefers-reduced-motion support, no hard-coded design values.

Steps:
1. Read packages/tokens/ to understand available custom properties
2. Grep for hard-coded hex/rgb/hsl colors, px font sizes, border-radius values in .svelte and .css files
3. Grep for animation/transition declarations and check for prefers-reduced-motion @media
4. Check apps/extension/src/ui/ primitives for token usage
5. Check surface components in sidebar/, launcher/, options/ for primitive composition vs re-rolling

Look for: hard-coded design values that should be tokens, missing reduced-motion handling, motion outside 150–250ms, feature components bypassing ui/ primitives, broken token switching.

Return findings with file:line and the exact token or primitive to use instead.`,
  },
  {
    key: 'performance',
    label: 'Performance',
    model: 'claude-haiku-4-5-20251001',
    prompt: `You are reviewing the Lunma Chrome MV3 extension for performance issues.
Root: ${ROOT}
Surfaces: service worker (background/), content scripts (content/), sidebar, launcher.

Steps:
1. Read apps/extension/src/background/ — look at install/activate handlers and startup cost
2. Read apps/extension/src/content/ — check import size and sync operations
3. Read vite.config in apps/extension/ — check bundle splitting and lazy loading
4. Grep for chrome.storage.sync.get/set patterns and check if they block

Look for: heavy work in service worker install/activate, content scripts importing large modules, missing lazy loading for non-critical UI, synchronous storage reads, unnecessary message round-trips, large bundle chunks with no splitting.

Return findings with specific file paths and concrete optimization actions.`,
  },
]

// ── Load History ──────────────────────────────────────────────────────────────

phase('Load History')

const historyResult = await agent(
  `Read the file at path: ${HISTORY_PATH}

If the file exists and contains valid JSON with an "items" array, return:
  { found: true, items: <the items array> }

If the file does not exist or is unreadable, return:
  { found: false, items: [] }

Do not create or modify any files. Read only.`,
  { label: 'Load previous review', phase: 'Load History', schema: HISTORY_SCHEMA }
)

const previousItems = historyResult?.found ? (historyResult.items ?? []) : []
log(previousItems.length > 0
  ? `Loaded ${previousItems.length} findings from previous review`
  : 'No previous review found — this will be the baseline')

// ── Scan ──────────────────────────────────────────────────────────────────────

phase('Scan')
log('Scanning across 8 dimensions in parallel...')

const scanResults = await parallel(
  DIMENSIONS.map(d => () =>
    agent(d.prompt, {
      label: d.label,
      phase: 'Scan',
      model: d.model,
      schema: FINDINGS_SCHEMA,
    }).then(r => r ? { dimension: d.key, label: d.label, findings: r.findings } : null)
  )
)

const populated = scanResults.filter(Boolean)
const total = populated.reduce((sum, r) => sum + r.findings.length, 0)
log(`${total} findings across ${populated.length} dimensions — synthesizing...`)

// ── Synthesize ────────────────────────────────────────────────────────────────

phase('Synthesize')

const synthesis = await agent(
  `Synthesize these engineering review findings for the Lunma Chrome extension into a single ranked action list.

Current scan findings by dimension:
${JSON.stringify(populated, null, 2)}

Previous review findings (for comparison):
${previousItems.length > 0 ? JSON.stringify(previousItems, null, 2) : 'None — this is the first run, mark all findings as "new".'}

Rules:
- Rank ALL current findings (1 = highest priority). Include every finding — do not drop any.
- Rank by real impact: a critical security finding beats a low visual one regardless of dimension default ordering.
- Default tiebreaker: security > architecture > type-safety > openspec > testing > visual > performance.
- 'action' must be concrete: what to change, in which file. One sentence.
- 'rationale' must say WHY this rank. One sentence.
- Preserve the original 'location' field when present.
- 'status': mark 'recurring' if a finding with the same or very similar title/location exists in the previous review; mark 'new' otherwise.
- 'resolvedItems': list findings from the previous review that do NOT appear in the current scan (i.e. they were fixed). Include title, dimension, and location.`,
  {
    label: 'Rank & Synthesize',
    phase: 'Synthesize',
    model: 'claude-opus-4-8',
    schema: SYNTHESIS_SCHEMA,
  }
)

const newCount = synthesis?.items?.filter(i => i.status === 'new').length ?? 0
const recurringCount = synthesis?.items?.filter(i => i.status === 'recurring').length ?? 0
const resolvedCount = synthesis?.resolvedItems?.length ?? 0
log(`${newCount} new · ${recurringCount} recurring · ${resolvedCount} resolved since last run`)

// ── Persist ───────────────────────────────────────────────────────────────────

phase('Persist')

await agent(
  `Write the following JSON to the file at path: ${HISTORY_PATH}

Overwrite the file if it exists. Create it if it does not.

Content to write (write exactly this, nothing else):
${JSON.stringify({ items: synthesis?.items ?? [] }, null, 2)}`,
  { label: 'Persist results', phase: 'Persist' }
)

log(`Results persisted to ${HISTORY_PATH}`)

return synthesis
