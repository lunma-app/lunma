export const meta = {
  name: 'repo-fix',
  description: 'Fix ranked findings from repo-review — sequential with per-fix verify gate and model selection by severity',
  phases: [
    { title: 'Load', detail: 'Read ranked findings from persistent memory' },
    { title: 'Fix', detail: 'Apply fixes sequentially, verify + commit after each' },
    { title: 'Persist', detail: 'Write resolved/skipped status back to memory' },
  ],
}

// args (all optional):
//   maxFixes    — cap how many findings to attempt this run (default: all)
//   minSeverity — 'critical'|'high'|'medium'|'low' (default: 'low', i.e. all)
//   dimension   — restrict to one dimension key (default: all)

const ROOT = '/Users/emanuel.fonseca/Workspaces/lunma'
const HISTORY_PATH = `${ROOT}/.claude/repo-review-history.json`

const SEVERITY_RANK = { critical: 4, high: 3, medium: 2, low: 1 }

const HISTORY_SCHEMA = {
  type: 'object',
  properties: {
    found: { type: 'boolean' },
    items: { type: 'array', items: { type: 'object', additionalProperties: true } },
  },
  required: ['found', 'items'],
}

const FIX_RESULT_SCHEMA = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    summary: { type: 'string' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    skipReason: { type: 'string' },
  },
  required: ['success', 'summary'],
}

function modelForFinding(f) {
  if (f.dimension === 'security' || f.severity === 'critical') return 'claude-opus-4-8'
  if (f.severity === 'high') return 'claude-sonnet-4-6'
  if (['typesafety', 'architecture', 'testing'].includes(f.dimension)) return 'claude-sonnet-4-6'
  return 'claude-haiku-4-5-20251001'
}

function modelLabel(model) {
  if (model.includes('opus')) return 'opus'
  if (model.includes('sonnet')) return 'sonnet'
  return 'haiku'
}

// ── Load ──────────────────────────────────────────────────────────────────────

phase('Load')

const historyResult = await agent(
  `Read the file at path: ${HISTORY_PATH}

If the file exists and contains valid JSON with an "items" array, return:
  { found: true, items: <the full items array, preserving all fields> }

If the file does not exist or is unreadable, return:
  { found: false, items: [] }

Do not create or modify any files.`,
  { label: 'Load findings', phase: 'Load', schema: HISTORY_SCHEMA }
)

if (!historyResult?.found || !historyResult.items?.length) {
  log('No findings in history — run /repo-review first')
  return { fixed: 0, skipped: 0, message: 'No findings to fix. Run repo-review first.' }
}

const allItems = historyResult.items

// Filter
const minSev = SEVERITY_RANK[args?.minSeverity ?? 'low'] ?? 1
const dimFilter = args?.dimension ?? null
const maxFixes = args?.maxFixes ?? Infinity

const todo = allItems
  .filter(i => i.status !== 'resolved' && i.status !== 'skipped')
  .filter(i => (SEVERITY_RANK[i.severity] ?? 0) >= minSev)
  .filter(i => !dimFilter || i.dimension === dimFilter)
  .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
  .slice(0, maxFixes)

const alreadyDone = allItems.filter(i => i.status === 'resolved' || i.status === 'skipped').length
log(`${todo.length} to fix | ${alreadyDone} already resolved/skipped | ${allItems.length} total`)

if (!todo.length) {
  log('Nothing left to fix with current filters.')
  return { fixed: 0, skipped: 0, message: 'All findings already resolved or skipped.' }
}

// ── Fix (sequential) ─────────────────────────────────────────────────────────

phase('Fix')

const results = []

for (const finding of todo) {
  const model = modelForFinding(finding)
  log(`[#${finding.rank}] ${modelLabel(model)} · ${finding.severity} · ${finding.dimension} — ${finding.title.slice(0, 55)}`)

  const result = await agent(
    `You are fixing one specific engineering issue in the Lunma Chrome MV3 extension.
Root: ${ROOT}
Stack: TypeScript strict, Svelte 5 (runes), Vite 8, Biome 2, Zod 4, pnpm workspace.

FINDING
  Rank:      ${finding.rank}
  Dimension: ${finding.dimension}
  Severity:  ${finding.severity}
  Title:     ${finding.title}
  Location:  ${finding.location ?? '(see action)'}
  Action:    ${finding.action}
  Rationale: ${finding.rationale}

INSTRUCTIONS
1. Read every file mentioned in Location before touching anything.
2. Implement EXACTLY the action — nothing more. Do not improve surrounding code.
3. After editing, run the full verify suite:
     cd ${ROOT} && pnpm verify
4. If verify passes:
   a. Stage and commit the change:
        git -C ${ROOT} add -A
        git -C ${ROOT} commit -m "fix(${finding.dimension}): ${finding.title.slice(0, 60).replace(/"/g, "'")}"
   b. Return { success: true, summary: "<one sentence: what you changed>", filesChanged: ["<path>", ...] }
5. If verify fails:
   a. Revert only your changes (working tree is otherwise clean from prior fixes):
        git -C ${ROOT} checkout -- .
   b. Return { success: false, summary: "<what broke and why>", filesChanged: [] }

HARD RULES
- Touch ONLY the files named in the location/action.
- If the action is genuinely ambiguous, would require a large structural refactor (>60 lines changed),
  or touches a file you cannot safely reason about, do NOT attempt it.
  Return { success: false, skipReason: "<reason>", summary: "skipped: <reason>", filesChanged: [] }
- Never push. Never modify openspec/changes/archive/.`,
    {
      label: `[#${finding.rank}] ${finding.title.slice(0, 40)}`,
      phase: 'Fix',
      model,
      schema: FIX_RESULT_SCHEMA,
    }
  )

  const status = result?.success ? 'resolved' : 'skipped'
  results.push({ finding, result, status })
  log(`  → ${status}: ${(result?.summary ?? 'no summary').slice(0, 90)}`)
}

// ── Persist ───────────────────────────────────────────────────────────────────

phase('Persist')

const resolvedRanks = new Set(results.filter(r => r.status === 'resolved').map(r => r.finding.rank))
const skippedRanks = new Set(results.filter(r => r.status === 'skipped').map(r => r.finding.rank))

const updatedItems = allItems.map(item => {
  if (resolvedRanks.has(item.rank)) return { ...item, status: 'resolved' }
  if (skippedRanks.has(item.rank)) return { ...item, status: 'skipped' }
  return item
})

await agent(
  `Write the following JSON exactly to the file at path: ${HISTORY_PATH}
Overwrite if exists, create if not.

${JSON.stringify({ items: updatedItems }, null, 2)}`,
  { label: 'Persist status', phase: 'Persist' }
)

const fixed = results.filter(r => r.status === 'resolved').length
const skipped = results.filter(r => r.status === 'skipped').length
log(`Done — ${fixed} fixed, ${skipped} skipped`)

return {
  fixed,
  skipped,
  results: results.map(r => ({
    rank: r.finding.rank,
    title: r.finding.title,
    dimension: r.finding.dimension,
    severity: r.finding.severity,
    status: r.status,
    summary: r.result?.summary,
    filesChanged: r.result?.filesChanged ?? [],
  })),
}
