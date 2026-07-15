export const meta = {
  name: 'repo-review',
  description: 'Multi-dimensional engineering review with persistent memory: scan 8 dimensions, adversarially triage real-vs-accepted, rank, and remember non-issues + new/recurring/resolved across runs. Humans are asked only for the residue with no automated answer.',
  phases: [
    { title: 'Remember', detail: 'Load persistent review memory + git baseline' },
    { title: 'Scan', detail: 'Parallel review across 8 engineering dimensions' },
    { title: 'Triage', detail: 'Adversarially adjudicate each dimension: real vs accepted non-issue' },
    { title: 'Synthesize', detail: 'Rank verified findings into an action list' },
    { title: 'Persist', detail: 'Write updated memory (non-issues, open findings, resolved log)' },
  ],
}

const ROOT = '/Users/emanuel.fonseca/Workspaces/lunma'
const HISTORY_PATH = `${ROOT}/.claude/repo-review-history.json` // legacy (pre-memory); migrated once on first memory run, then unused
const MEMORY_PATH = `${ROOT}/.claude/repo-review-memory.json`

function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, '') }
// Deterministic fingerprint so new/recurring/resolved is set math, not LLM matching.
function fp(dimension, key) { return dimension + '::' + norm(key) }

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

// Adversarial triage output, per dimension: real findings vs accepted non-issues.
const TRIAGE_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          title: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          location: { type: 'string' },
          action: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'low'] },
        },
        required: ['key', 'title', 'severity', 'action'],
      },
    },
    nonIssues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          reason: { type: 'string' },
          contested: { type: 'boolean' },
        },
        required: ['key', 'reason'],
      },
    },
    dropped: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, reason: { type: 'string' } },
        required: ['title', 'reason'],
      },
    },
  },
  required: ['findings'],
}

// Persistent memory (read at start, written at end). Findings are fingerprinted
// dimension::key so new/recurring/resolved is deterministic set math.
const MEMORY_SCHEMA = {
  type: 'object',
  properties: {
    found: { type: 'boolean' },
    headSha: { type: 'string' },
    memory: {
      type: 'object',
      properties: {
        run: { type: 'number' },
        headSha: { type: 'string' },
        nonIssues: { type: 'array', items: { type: 'object', properties: { fp: { type: 'string' }, dimension: { type: 'string' }, key: { type: 'string' }, reason: { type: 'string' }, firstRun: { type: 'number' }, lastRun: { type: 'number' } }, required: ['fp', 'dimension', 'key', 'reason'] } },
        open: { type: 'array', items: { type: 'object', properties: { fp: { type: 'string' }, dimension: { type: 'string' }, key: { type: 'string' }, title: { type: 'string' }, severity: { type: 'string' }, firstRun: { type: 'number' }, lastRun: { type: 'number' }, runsSeen: { type: 'number' } }, required: ['fp', 'dimension', 'key', 'title', 'severity'] } },
        resolvedLog: { type: 'array', items: { type: 'object', properties: { fp: { type: 'string' }, dimension: { type: 'string' }, title: { type: 'string' }, resolvedRun: { type: 'number' } }, required: ['fp', 'dimension', 'resolvedRun'] } },
      },
      required: ['run', 'nonIssues', 'open', 'resolvedLog'],
    },
  },
  required: ['found', 'headSha', 'memory'],
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
          key: { type: 'string' },
          title: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          location: { type: 'string' },
          action: { type: 'string' },
          rationale: { type: 'string' },
        },
        required: ['rank', 'dimension', 'title', 'severity', 'action', 'rationale'],
      },
    },
  },
  required: ['items'],
}

// Known-non-issue suppression injected into scan + triage (built from memory).
function nonIssuesBlock(memNonIssues) {
  if (!memNonIssues || !memNonIssues.length) return ''
  const lines = memNonIssues.map((n) => `- [${n.dimension}] ${n.key ? n.key + ' — ' : ''}${n.reason}`).join('\n')
  return `KNOWN NON-ISSUES (treat as SETTLED — do NOT raise anything these cover; already adjudicated as deliberate/accepted by a prior run's triage). If you now believe one is WRONG given the current code, do NOT re-raise it as a normal finding — flag it as a nonIssue with contested=true. Otherwise stay silent on them.
${lines}`
}

// Adversarial triage of one dimension's raw scan findings.
function triagePrompt(d, findings, nib) {
  return `You are ADVERSARIALLY triaging proposed ${d.label} findings for the Lunma Chrome extension (root ${ROOT}). Verify each against the ACTUAL code before accepting it.

${nib}

For each proposed finding decide if it is a REAL issue (correct about the code, genuine impact, not speculative, not a duplicate, not a deliberate/accepted trade-off):
- KEEP real ones. Give each a stable "key": a short normalized slug of the underlying issue (e.g. "unvalidated-message-bus", "hardcoded-color-in-sidebar") that will be the SAME across runs for the same issue, so it can be matched over time. Set confidence='low' if you are genuinely unsure real-vs-deliberate (a human will adjudicate), else 'high'.
- MOVE deliberate decisions / accepted trade-offs / out-of-scope into nonIssues with the same "key" + a one-line reason. Set contested=true ONLY when it matches a KNOWN NON-ISSUE you now judge WRONG.
- DROP speculative / factually-wrong / duplicate ones into dropped (title + reason).
Default to dropping when a finding is not clearly real — but prefer confidence='low' over dropping when the uncertainty is real-vs-deliberate. Keep it terse: one sentence per field.

Proposed findings:
${JSON.stringify(findings)}

Return kept findings (key, title, severity, location, action, confidence), nonIssues (key, reason, contested), and dropped.`
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

// ── Remember ──────────────────────────────────────────────────────────────────

phase('Remember')

const mem = await agent(
  `Load the persistent review memory. Read the JSON file at ${MEMORY_PATH}. If it exists and is valid JSON, return found=true with its contents in "memory" (fields: run, nonIssues, open, resolvedLog). If it does NOT exist, MIGRATE the legacy history at ${HISTORY_PATH}: if that file exists, seed memory.nonIssues from its items whose status="skipped" — map each to { fp: "<dimension>::<title lowercased, non-alphanumerics stripped>", dimension, key: "<a short slug of its title>", reason: "<its rationale, else its title>" } — and set memory.open=[], memory.resolvedLog=[], run=0. If neither file exists, return found=false and memory={ run:0, nonIssues:[], open:[], resolvedLog:[] }. Also run \`git rev-parse HEAD\` and return the SHA as "headSha" (empty string if it fails). Read only — do not modify any file.`,
  { label: 'Load memory', phase: 'Remember', schema: MEMORY_SCHEMA }
)

const memory = mem?.memory ?? { run: 0, nonIssues: [], open: [], resolvedLog: [] }
const headSha = mem?.headSha ?? ''
const nib = nonIssuesBlock(memory.nonIssues)
log(`Memory: run ${memory.run ?? 0} · ${(memory.nonIssues ?? []).length} known non-issues · ${(memory.open ?? []).length} open`)

// ── Scan ──────────────────────────────────────────────────────────────────────

phase('Scan')
log('Scanning across 8 dimensions in parallel...')

const scanResults = await parallel(
  DIMENSIONS.map(d => () =>
    agent(d.prompt + (nib ? '\n\n' + nib : ''), {
      label: d.label,
      phase: 'Scan',
      model: d.model,
      schema: FINDINGS_SCHEMA,
    }).then(r => r ? { dimension: d.key, label: d.label, findings: r.findings } : null)
  )
)

const populated = scanResults.filter(Boolean)
const total = populated.reduce((sum, r) => sum + r.findings.length, 0)
log(`${total} findings across ${populated.length} dimensions — triaging...`)

// ── Triage ────────────────────────────────────────────────────────────────────
// Automated adversarial adjudication (real vs accepted non-issue) — replaces the
// human "skipped" bottleneck. Per dimension, adaptive model.

phase('Triage')

const triaged = await parallel(
  populated.map(p => () => {
    if (!p.findings || !p.findings.length) return Promise.resolve({ dimension: p.dimension, findings: [], nonIssues: [] })
    const d = DIMENSIONS.find(x => x.key === p.dimension)
    const esc = p.findings.some(f => f.severity === 'critical' || f.severity === 'high')
    const model = esc ? 'claude-opus-4-8' : 'claude-sonnet-4-6'
    return agent(triagePrompt(d, p.findings, nib), { label: `Triage ${p.label}`, phase: 'Triage', model, schema: TRIAGE_SCHEMA })
      .then(r => r
        ? { dimension: p.dimension, findings: r.findings ?? [], nonIssues: r.nonIssues ?? [] }
        : { dimension: p.dimension, findings: [], nonIssues: [] })
  })
)

const keptFindings = triaged.flatMap(t => (t.findings ?? []).map(f => ({ ...f, dimension: t.dimension, fp: fp(t.dimension, f.key) })))
const keptNonIssues = triaged.flatMap(t => (t.nonIssues ?? []).map(n => ({ ...n, dimension: t.dimension, fp: fp(t.dimension, n.key) })))
log(`${keptFindings.length} verified findings · ${keptNonIssues.length} non-issues after triage`)

// ── Reconcile against memory (deterministic set math) ──────────────────────────

const thisRun = (memory.run ?? 0) + 1
const memOpen = memory.open ?? []
const memNI = memory.nonIssues ?? []
const memOpenFp = new Set(memOpen.map(o => o.fp))
const memNIFp = new Set(memNI.map(n => n.fp))
const curFp = new Set(keptFindings.map(f => f.fp))

const conflictFps = new Set(keptFindings.filter(f => memNIFp.has(f.fp)).map(f => f.fp))
const contested = keptNonIssues.filter(n => n.contested)
const contestedFps = new Set(contested.map(n => n.fp))

const newCount = keptFindings.filter(f => !memOpenFp.has(f.fp) && !memNIFp.has(f.fp)).length
const recurringCount = keptFindings.filter(f => memOpenFp.has(f.fp)).length
const resolved = memOpen.filter(o => !curFp.has(o.fp)).map(o => ({ fp: o.fp, dimension: o.dimension, title: o.title, resolvedRun: thisRun }))

// The ONLY human queue: verify low-confidence, memory-vs-run conflicts, contested non-issues.
const needsHuman = []
const seen = new Set()
for (const f of keptFindings) {
  if ((f.confidence ?? 'high') === 'low') needsHuman.push({ dimension: f.dimension, why: 'low-confidence', detail: f.title })
  if (conflictFps.has(f.fp) && !seen.has(f.fp)) { needsHuman.push({ dimension: f.dimension, why: 'conflict (memory: non-issue · this run: real)', detail: f.title }); seen.add(f.fp) }
}
for (const n of contested) needsHuman.push({ dimension: n.dimension, why: 'contested non-issue', detail: n.reason })

// Merged non-issues = memory + this run's confirmed, MINUS contested/conflicted (await human).
const niMap = new Map()
for (const n of memNI) niMap.set(n.fp, n)
for (const n of keptNonIssues) {
  if (n.contested) continue
  const prev = niMap.get(n.fp)
  niMap.set(n.fp, { fp: n.fp, dimension: n.dimension, key: n.key, reason: n.reason, firstRun: prev ? prev.firstRun : thisRun, lastRun: thisRun })
}
for (const x of contestedFps) niMap.delete(x)
for (const x of conflictFps) niMap.delete(x)
const mergedNI = [...niMap.values()]

// Open set = this run's findings, carrying first-seen / runs-seen from memory.
const openMap = new Map()
for (const f of keptFindings) {
  if (openMap.has(f.fp)) continue
  const prev = memOpen.find(o => o.fp === f.fp)
  openMap.set(f.fp, { fp: f.fp, dimension: f.dimension, key: f.key, title: f.title, severity: f.severity, firstRun: prev ? prev.firstRun : thisRun, lastRun: thisRun, runsSeen: prev ? (prev.runsSeen ?? 1) + 1 : 1 })
}
const newOpen = [...openMap.values()]
const resolvedLog = (memory.resolvedLog ?? []).concat(resolved).slice(-200)
log(`${newCount} new · ${recurringCount} recurring · ${resolved.length} resolved · ${mergedNI.length} known non-issues · ${needsHuman.length} need human`)

// ── Synthesize ────────────────────────────────────────────────────────────────

phase('Synthesize')

const synthesis = keptFindings.length ? await agent(
  `Rank these VERIFIED engineering findings for the Lunma Chrome extension into a single action list (1 = highest priority). Include EVERY finding — do not drop any.

${JSON.stringify(keptFindings.map(f => ({ dimension: f.dimension, key: f.key, title: f.title, severity: f.severity, location: f.location, action: f.action })), null, 2)}

Rules:
- Rank by real impact: a critical security finding beats a low visual one regardless of dimension.
- Default tiebreaker: security > architecture > typesafety > openspec > testing > code-quality > visual > performance.
- 'action' must be concrete: what to change, in which file. One sentence. 'rationale': why this rank. One sentence.
- Preserve each finding's dimension, key, title, severity, and location.`,
  { label: 'Rank & Synthesize', phase: 'Synthesize', model: 'claude-opus-4-8', schema: SYNTHESIS_SCHEMA }
) : { items: [] }

// ── Persist ───────────────────────────────────────────────────────────────────

phase('Persist')

const newMemory = { run: thisRun, headSha, nonIssues: mergedNI, open: newOpen, resolvedLog }

await agent(
  `Write the following JSON to the file at path: ${MEMORY_PATH}

Overwrite the file if it exists. Create it if it does not. Create any parent directory as needed.

Content to write (write exactly this, nothing else):
${JSON.stringify(newMemory, null, 2)}`,
  { label: 'Persist memory', phase: 'Persist' }
)

log(`Memory persisted to ${MEMORY_PATH}`)

return { items: synthesis?.items ?? [], new: newCount, recurring: recurringCount, resolved: resolved.length, needsHuman }
