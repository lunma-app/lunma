// Catalog design & UX review — reusable, adversarially-verified, GLOBAL-FIRST
// audit of the Lunma component catalog (apps/extension/src/ui primitives).
//
// Philosophy: the design system is the unit of repair. A finding is a symptom;
// the fix targets the ROOT CAUSE, which is almost always a shared layer (a
// @lunma/tokens custom property, a recipe in recipes.css, a shared src/ui
// primitive, or a convention). If the same or a similar issue shows up in
// several primitives it is a design-system problem, not a component one — fix it
// once, everywhere. A local, component-specific fix is a rare exception that
// must prove it cannot be systemic. The report is led by design-system fixes;
// per-component findings are traced back to the fix that repairs them.
//
// Non-findings ledger (docs/design/catalog-non-findings.md): a curated record of
// FALSE POSITIVES — patterns that look like bugs but are deliberate decisions — so
// the reviewer stops re-raising them. Injected into review + verify as a
// FALSIFIABLE prior (suppress the pattern, but flag a regression against its cited
// reference). Auto-maintained WITHOUT a human gate: this run's verified deliberate
// confirmations that carry a canonical reference are merged in (deduped by decision,
// recurrence bumped); an unreferenced "seems intentional" never enters. The
// mandatory reference is the quality filter a human approval would otherwise be.
//
// Run all primitives:
//   Workflow({ name: 'catalog-ux-review' })
// Focus on one or a set (by primitive title — case/punct-insensitive):
//   Workflow({ name: 'catalog-ux-review', args: 'Button' })
//   Workflow({ name: 'catalog-ux-review', args: ['Button', 'TextInput', 'Menu'] })
// A focused run writes docs/design/catalog-review-<slug>.md so it never clobbers
// the full report.
//
// Models are matched to task difficulty: Opus (high effort) for the
// reasoning-heavy review + synthesis, Sonnet for the mechanical discover / write
// steps. Verify is ADAPTIVE: skipped entirely when a component has no findings,
// Sonnet for the routine adversarial check, and escalated to Opus only for
// components carrying a P0/P1 or any WCAG-tagged (a11y) finding — where the
// spec-subtlety and stakes justify the stronger reviewer.
export const meta = {
  name: 'catalog-ux-review',
  description:
    'Global-first UI/UX + WCAG 2.2 audit of the Lunma component catalog: find issues, verify them, cluster shared root causes into design-system fixes (@lunma/tokens / recipes / primitives / conventions), and write a report led by those global fixes. Pass args to focus on a primitive or set.',
  whenToUse:
    'Design/UX/a11y audit of the src/ui component catalog — full or scoped — that prioritizes design-system-level fixes over per-component patches.',
  phases: [
    { title: 'Discover', detail: 'list catalog stories + metadata, load the non-findings ledger, apply focus filter' },
    { title: 'Review', detail: 'one reviewer per primitive; classify each finding by root cause', model: 'opus' },
    { title: 'Verify', detail: 'adversarially confirm findings; skip when none, Sonnet default, Opus for P0/P1 or a11y' },
    { title: 'Synthesize', detail: 'cluster shared root causes into global fixes; exceptions stay local', model: 'opus' },
    { title: 'Report', detail: 'write the review markdown + auto-merge referenced non-findings into the ledger' },
  ],
}

const DISCOVER_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['components'],
  properties: { components: { type: 'array', items: {
    type: 'object', additionalProperties: false, required: ['title', 'group', 'story', 'source'],
    properties: { title: { type: 'string' }, group: { type: 'string' }, story: { type: 'string' }, source: { type: 'string' } },
  } } },
}

const FINDING = {
  type: 'object', additionalProperties: false,
  required: ['id', 'category', 'severity', 'problem', 'evidence', 'scope', 'rootCause', 'fix', 'effort'],
  properties: {
    id: { type: 'string' }, category: { type: 'string' },
    severity: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] },
    problem: { type: 'string' }, // The defect AND its concrete user/a11y impact, ONE tight sentence.
    evidence: { type: 'string' }, // Terse refs ONLY — file:line + token/prop/class names, NOT prose.
    // Root-cause classification — the reviewer's hypothesis about WHERE the fix belongs.
    scope: { type: 'string', enum: ['system-likely', 'local'] },
    rootCause: { type: 'string' }, // short label, e.g. "token:--accent", "recipe:.lunma-glass", "primitive:Button .btn", "convention:icon-button min size"
    fix: { type: 'string' }, effort: { type: 'string', enum: ['S', 'M', 'L'] }, wcag: { type: 'string' }, // fix = smallest correct change, ONE sentence
  },
}
const DELIBERATE = { type: 'array', items: { type: 'object', additionalProperties: false, required: ['note'], properties: { note: { type: 'string' }, reference: { type: 'string' } } } } // note = ONE line

const REVIEW_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['component', 'findings'],
  properties: { component: { type: 'string' }, findings: { type: 'array', items: FINDING }, deliberateConfirmed: DELIBERATE },
}
const VERIFY_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['component', 'findings'],
  properties: {
    component: { type: 'string' }, findings: { type: 'array', items: FINDING }, deliberateConfirmed: DELIBERATE,
    dropped: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'reason'], properties: { id: { type: 'string' }, reason: { type: 'string' } } } },
  },
}
const SYNTH_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['executiveSummary', 'systemicFixes', 'localFixes', 'prioritizedTodo'],
  properties: {
    executiveSummary: { type: 'string' },
    systemicFixes: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      required: ['id', 'title', 'layer', 'rootCause', 'problem', 'fix', 'severity', 'effort', 'reach', 'componentsAffected', 'findingIds'],
      properties: {
        id: { type: 'string' }, title: { type: 'string' },
        layer: { type: 'string', enum: ['token', 'recipe', 'primitive', 'convention'] },
        rootCause: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' },
        severity: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] }, effort: { type: 'string', enum: ['S', 'M', 'L'] },
        reach: { type: 'number' }, componentsAffected: { type: 'array', items: { type: 'string' } },
        findingIds: { type: 'array', items: { type: 'string' } }, wcag: { type: 'string' },
      },
    } },
    localFixes: { type: 'array', items: {
      type: 'object', additionalProperties: false,
      required: ['id', 'component', 'problem', 'fix', 'severity', 'effort', 'whyLocal'],
      properties: {
        id: { type: 'string' }, component: { type: 'string' }, findingId: { type: 'string' },
        problem: { type: 'string' }, fix: { type: 'string' },
        severity: { type: 'string', enum: ['P0', 'P1', 'P2', 'P3'] }, effort: { type: 'string', enum: ['S', 'M', 'L'] },
        whyLocal: { type: 'string' }, wcag: { type: 'string' },
      },
    } },
    prioritizedTodo: { type: 'array', items: {
      type: 'object', additionalProperties: false, required: ['order', 'kind', 'ref', 'title', 'severity', 'effort'],
      properties: {
        order: { type: 'number' }, kind: { type: 'string', enum: ['systemic', 'local'] }, ref: { type: 'string' },
        title: { type: 'string' }, severity: { type: 'string' }, reach: { type: 'number' }, effort: { type: 'string' },
      },
    } },
  },
}

const DIMENSIONS = `Review across ALL of these dimensions:
- Visual: hierarchy, spacing rhythm, alignment, size scale, radii, elevation/surfaces, density, icon sizing/optical alignment.
- Color & theming: semantic @lunma/tokens ONLY (NO hardcoded colors/sizes/radii/focus geometry — Stylelint fails raw font-size/z-index in src/ui); light + dark parity (BOTH stage themes). CRITICAL Lunma requirement: contrast meets WCAG 2.2 AA and HOLDS across the colour-intensity tiers (subtle -> standard -> vivid, the Intensity control) AND across the Space hues, on BOTH the neutral and aurora canvases — give the measured ratio for text and for UI components/state. Status colors distinct from --accent. Glass/glow/aurora surfaces (--glass-*, --glow-*, .lunma-glass) must stay legible.
- Typography: the dual-typeface system (Instrument Serif display + Mona Sans body via @lunma/tokens); scale, weight, line-height, truncation/wrapping, tabular-nums for aligned digits, balanced headings.
- States: default, hover, focus-visible, active, disabled, loading, invalid/error, empty, selected, read-only. EVERY interactive element must have a visible focus-visible ring (the tokenized ring, not a re-rolled one); disabled must be perceivable and inert; loading/error/empty must be designed, not missing.
- Accessibility (WCAG 2.2 AA): full keyboard operability + logical focus order; focus trap + restore for overlays (Menu, BottomSheet); correct roles/labels (aria-invalid, aria-expanded, aria-current, associated labels); color never the sole signal; prefers-reduced-motion respected AT EVERY intensity (the aurora/motion must calm); SR-only text where needed. EXPLICITLY verify the criteria NEW in 2.2 (reviewers default to 2.1 and miss them) and TAG each a11y finding with its exact SC:
  - 2.5.8 Target Size (Minimum, AA): targets >=24x24 CSS px (IconButton, checkbox/radio/switch hit areas, close "x", tab/menu/select items); note the spacing/inline exception before flagging dense inline text links.
  - 2.4.11 Focus Not Obscured (Minimum, AA): focused control not hidden by sticky UI or its own overlay.
  - 2.5.7 Dragging Movements (AA): drag interactions need a single-pointer alternative (drag-reorder, tab drag).
  - 3.3.7 Redundant Entry (A) and 3.3.8 Accessible Authentication (Minimum, AA): input primitives (TextInput, SearchField) must allow paste and not gate on memory/transcription.
  - 2.4.13 Focus Appearance (AAA, aim for it): the focus ring itself - >=2px thick perimeter, >=3:1 contrast vs adjacent states.
  Do NOT raise 4.1.1 Parsing - it was removed in WCAG 2.2.
- Responsiveness: the primitive survives its consuming surfaces (sidebar rail, launcher, options, new-tab) — wrapping/overflow, touch targets, no horizontal overflow.
- Motion: 150-250ms token tweens, easing, no jank, reduced-motion honored.
- UX writing / i18n: labels, placeholders, empty states, error messages are specific, active-voice, actionable, in the interface voice; strings are paraglide messages (en base) and survive a longer translation without truncation.
- Consistency: padding/radius/icon-size/variant-naming match sibling primitives; no near-duplicate-but-divergent patterns; feature-facing props stay minimal + composable (ui-primitives.md).
- Robustness/edge cases: zero/one/many, long strings, async, error, nested, overflow.
- API/props ergonomics: sensible defaults, complete variant/size coverage, missing states a consumer would need.`

const ROOTCAUSE = `GLOBAL-FIRST STANCE (critical). The design system is the unit of repair, not the primitive. For EVERY finding, identify the ROOT CAUSE and prefer a fix at the shared layer:
- Ask: does this stem from a @lunma/tokens custom property (TOKEN), a shared RECIPE in packages/tokens/recipes.css (.lunma-glass / .lunma-space-scope / glow), a shared PRIMITIVE this composes (Button / IconButton / Icon / Surface), or a CONVENTION (icon size, radius, spacing scale, focus-ring geometry — ui-primitives.md)? If yes -> set scope="system-likely" and rootCause to that layer + the exact target, e.g. "token:--accent-soft", "recipe:.lunma-glass border (recipes.css)", "primitive:IconButton min-size", "convention:focus-ring geometry (ui-primitives.md)". Write the \`fix\` as the GLOBAL change (the one edit that repairs every instance), NOT a local patch.
- Use scope="local" ONLY when the issue is intrinsic to THIS primitive's unique structure/content and could not recur elsewhere. When unsure, choose system-likely.
You see one primitive in isolation, so you cannot confirm a pattern spans others — but you CAN recognize when a root cause is shared. Flag it; the synthesis clusters across primitives and turns shared root causes into single design-system fixes.`

const TERSE = `OUTPUT DISCIPLINE — be terse (this saves a lot of tokens): every string field is ONE tight sentence; \`evidence\` is file:line + token/prop/class names ONLY, never prose; \`problem\` states the defect AND its impact together, no separate impact field. Do NOT restate the same fact across problem/evidence/fix, and do NOT re-narrate what severity/category already say. Keep EVERY real item — cut words, never findings. deliberateConfirmed notes are ONE line each.`

// Injected into review + verify: the curated non-findings ledger as a FALSIFIABLE
// prior. Suppresses known false positives so they aren't re-raised, WITHOUT going
// blind — the reviewer must re-check each against its cited reference and flag a
// regression. Returns '' when the ledger is empty (first run / none yet).
function ledgerBlock(ledger) {
  if (!ledger) return ''
  return `KNOWN NON-FINDINGS — a FALSIFIABLE prior (already-confirmed deliberate decisions, each with a cited reference). Do NOT raise any of these as a finding, and do NOT re-list them under deliberateConfirmed. They are NOT immune: re-check each against its cited reference in the CURRENT code — if the code now CONTRADICTS the reference (the decision regressed or changed), flag THAT as a finding and note it supersedes the ledger entry. Only emit deliberateConfirmed for a deliberate decision that is genuinely NEW (not already listed here) AND carries its own canonical reference.

${ledger}
`
}

// A single cheap agent maintains the ledger: dedupe by DECISION (semantic), bump a
// recurrence count, add only referenced newcomers, never drop entries. Reference is
// mandatory — an unreferenced "seems intentional" never enters (it stays per-run).
function mergeLedgerPrompt(existing, additions) {
  return `Maintain the catalog non-findings ledger at docs/design/catalog-non-findings.md — the record of design-review FALSE POSITIVES (patterns that look like bugs but are deliberate decisions) so the reviewer stops re-raising them. It is AUTO-maintained: deduped by DECISION (semantic, not exact text), one entry per decision, never incremented blindly.

EXISTING LEDGER (verbatim, or "NONE" if it does not exist yet):
${existing || 'NONE'}

NEW referenced deliberate-confirmations from this run (each is a confirmed non-finding WITH a canonical reference):
${JSON.stringify(additions)}

Then Write the COMPLETE updated file to docs/design/catalog-non-findings.md (create the docs/design dir if needed):
1. Keep or create the header below.
2. For each addition, find a semantically-matching existing entry (same underlying decision, even if worded differently). If found: increment its "Seen" count by 1, and tighten wording only if the newcomer is clearer — do NOT add a duplicate. If not found: append a new entry with the next NF-<nn> id and Seen: 1.
3. NEVER add an entry without a Reference. If an addition somehow lacks a real canonical reference, drop it.
4. Terse, one entry per decision, sorted by component then id. Do NOT remove existing entries.

Entry format:
### NF-<nn> · <component or scope> · <short title>
- Falsely flagged: <the pattern reviewers keep raising — one line>
- Deliberate because: <one line>
- Reference: <canonical spec / ADR / code-comment>
- Still flag if: <the deviation that WOULD make it a real finding>
- Seen: <count>

Header (keep at top, verbatim):
# Catalog non-findings ledger

> Auto-maintained by the catalog-ux-review workflow. Each entry is a design-review FALSE POSITIVE — a pattern that looks like a bug but is a deliberate decision — that reviewers must NOT re-raise. Every entry cites a canonical reference and is a FALSIFIABLE prior: if the current code contradicts the cited reference, the reviewer flags the deviation and the entry is stale. Curation is automatic (referenced confirmations only, deduped by decision); prune by hand only if an entry drifts.

Write the whole file verbatim; output nothing else.`
}

function idPrefix(title) { return title.replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'CMP' }

function reviewPrompt(c, ledger) {
  return `You are a senior product designer AND frontend engineer reviewing ONE Lunma design-system primitive.

Primitive: ${c.title}  (nav group: ${c.group})
Primitive source: ${c.source}  - read the whole file incl. its scoped <style> and Props interface.
Story (intended states, examples, props, authored controls): ${c.story}

Read before judging:
- The primitive source above (its scoped <style> + Props), and the story.
- Design tokens the primitive must consume: packages/tokens/tokens.css, packages/tokens/recipes.css, packages/tokens/fonts.css (space/hue, accent, glass, glow, spacing, typography, radii, shadows). Flag ANY hardcoded color/size/radius/focus-geometry that should be a token — Stylelint gates raw font-size/z-index in src/ui.
- The authoritative invariants: CLAUDE.md, .claude/rules/ui-primitives.md, and the specs openspec/specs/visual-system/spec.md, openspec/specs/ui-accessibility/spec.md, openspec/specs/ui-density/spec.md. Several things that look wrong are DELIBERATE (the immersive aurora/glass system, dark-first surfaces, reduced-motion handling). Do NOT report a documented decision as a bug - put it under deliberateConfirmed with the reference.

This is a STATIC review (no browser). Reason about rendered states from the code; where a claim truly needs pixel confirmation, say "needs visual" in evidence (confirm later in the catalog: pnpm --filter @lunma/extension catalog).

${ledgerBlock(ledger)}
${ROOTCAUSE}

${DIMENSIONS}

${TERSE}

Rules: every finding needs a concrete repro (which state/theme/intensity/hue/canvas) AND a real user or a11y impact stated inside \`problem\` - no speculative or pure-taste claims dressed as defects (unlabeled taste -> P3, and say it is subjective in problem). Cite file:line + the exact token/prop/class in \`evidence\`. Every finding MUST carry scope + rootCause, and its \`fix\` must target that root cause (global when system-likely). If unsure whether it is a bug or a deliberate decision, use P3. Give findings stable ids like ${idPrefix(c.title)}-01, ${idPrefix(c.title)}-02.

Severity: P0 = broken/inaccessible (keyboard trap, no visible focus, failing contrast on primary text/controls at any intensity/hue, unusable state). P1 = real usability/a11y/consistency defect most users hit. P2 = meaningful polish. P3 = nit/subjective.

Return findings (each fully populated, incl. scope + rootCause) and deliberateConfirmed.`
}

function verifyPrompt(c, r, ledger) {
  return `You are ADVERSARIALLY verifying proposed design/UX findings for Lunma's "${c.title}" primitive. Re-read the source (${c.source}), the story (${c.story}), the relevant packages/tokens/*.css, and the invariants (CLAUDE.md, .claude/rules/ui-primitives.md, openspec/specs/{visual-system,ui-accessibility,ui-density}/spec.md) - then judge each proposed finding on the evidence.

${ledger ? ledgerBlock(ledger) + 'Any proposed finding matching a KNOWN NON-FINDING above SHALL be dropped (reason: "ledger non-finding NF-xx") UNLESS the current code actually contradicts that entry\'s cited reference — then keep it as a real regression.\n' : ''}

Keep a finding ONLY if it is real: a concrete repro, a genuine user/a11y impact, correct about the actual code/token, not a duplicate, and NOT contradicting a documented deliberate decision. Drop the rest - speculative, unlabeled taste, factually wrong, duplicate - and move any that contradict a documented invariant into deliberateConfirmed. For kept findings: correct the severity if over/understated, tighten the fix to the smallest correct change, and ensure a11y findings carry the right WCAG 2.2 SC.

ALSO validate the root-cause classification (global-first): if a finding's real fix is a token / recipe / shared-primitive / convention change, it MUST be scope="system-likely" with the correct rootCause and a GLOBAL fix - correct any finding mislabeled "local" that actually shares a root cause, and rewrite any \`fix\` that patches one primitive when the right fix is at a shared layer. Default to dropping when uncertain a finding is real.

${TERSE} When you keep a finding, also TIGHTEN its wording to this bar (trim any prose the reviewer over-wrote).

Proposed findings:
${JSON.stringify(r.findings || [])}

Already-noted deliberate decisions:
${JSON.stringify(r.deliberateConfirmed || [])}

Return the kept (verified) findings (with corrected scope/rootCause), the deliberateConfirmed list, and a dropped list (id + reason) for everything you removed.`
}

function synthPrompt(compact, n) {
  return `You are the DESIGN-SYSTEM lead for Lunma. Philosophy: GLOBAL-FIRST. The design system is the unit of repair. A finding is a symptom; the fix must target the ROOT CAUSE, which is almost always a shared layer (a @lunma/tokens property, a recipe, a shared primitive, or a convention). A local, component-specific fix is a RARE EXCEPTION, allowed only when an issue is proven intrinsic to one primitive and cannot share a root cause with anything else.

You have ${compact.length} verified findings across ${n} primitive(s). Each carries a component, category, severity, effort, and the reviewer's scope + rootCause hypothesis:
${JSON.stringify(compact)}

Do this:
1) CLUSTER findings across primitives by shared root cause or the same/similar underlying problem — SEMANTIC, not exact-text (e.g. "focus ring missing", "focus ring too faint", "focus ring wrong color" are ONE cluster: focus ring not standardized; "hardcoded gray border", "raw hex instead of token" are ONE cluster: border not tokenized). If the same or a similar issue appears in 2+ primitives, it is a DESIGN-SYSTEM issue — treat it as systemic even if the reviewers marked instances "local".
2) systemicFixes: for every cluster spanning >=2 primitives, AND for any single finding whose root cause is a shared layer (token/recipe/primitive/convention) even if seen once, emit ONE global fix. Name the exact target (token/recipe/primitive/convention), the single change that repairs ALL instances, the layer, componentsAffected, findingIds (every member id, for traceability), max severity, effort, and reach (# primitives repaired).
3) localFixes: emit ONLY for findings that are (a) in exactly one primitive, (b) intrinsic to that primitive's unique structure/purpose, and (c) have no plausible shared root cause. Each REQUIRES a whyLocal justification. Be skeptical — default to folding into a systemic fix. If you cannot clearly justify why a fix must be local, make it systemic.
4) prioritizedTodo: ONE ordered checklist. ALL systemic fixes FIRST, ordered by (reach x severity) — a token/recipe fix repairing many high-reach primitives (Button/IconButton/Icon/TextInput/Chip are highest reach) is #1. Local exceptions come LAST. Each item: order, kind ('systemic'|'local'), ref (the DS-xx or LOC-xx id), title, severity, reach (omit for local), effort.
5) executiveSummary (markdown, no header, ONE tight paragraph, <=4 sentences): how many systemic fixes resolve how many findings across how many primitives, how few are genuinely local, and the single highest-leverage fix to do first. No preamble.

${TERSE} Each systemicFix \`problem\`/\`fix\` and each localFix \`problem\`/\`fix\`/\`whyLocal\` is ONE tight sentence — name the target and the change, don't re-narrate the findings.

Assign ids DS-01.. to systemicFixes and LOC-01.. to localFixes. EVERY finding id must be claimed by exactly one systemicFix (in its findingIds) or one localFix (its findingId) — do not drop any.`
}

const SEVW = { P0: 3, P1: 2, P2: 1, P3: 0 }
const SEV = { P0: 0, P1: 1, P2: 2, P3: 3 }
function assemble(results, syn, components, title) {
  const byTitle = new Map(components.map((c) => [c.title, c]))
  const sys = ((syn && syn.systemicFixes) || []).slice()
  const loc = ((syn && syn.localFixes) || []).slice()
  // finding id -> owning fix ref (for the traceability appendix)
  const owner = new Map()
  for (const s of sys) for (const fid of s.findingIds || []) owner.set(fid, s.id)
  for (const l of loc) if (l.findingId) owner.set(l.findingId, l.id)

  let md = '# ' + title + '\n\n'
  md += '> Global-first static review — findings are symptoms; fixes target the design-system root cause (token / recipe / primitive / convention). "needs visual" items confirm in the catalog (`pnpm --filter @lunma/extension catalog`); a11y findings carry WCAG 2.2 SC.\n\n'
  md += '## Executive summary\n\n' + ((syn && syn.executiveSummary) || '_n/a_') + '\n\n'

  md += '## Prioritized TODO (global-first)\n\n'
  const todo = ((syn && syn.prioritizedTodo) || []).slice().sort((a, b) => (a.order || 999) - (b.order || 999))
  for (const t of todo) {
    const tag = t.kind === 'local' ? 'LOCAL EXCEPTION' : 'DS'
    md += '- [ ] **' + t.severity + '** [' + tag + ' ' + t.ref + '] ' + t.title + ' _(' + (t.reach ? 'reach ' + t.reach + ', ' : '') + 'effort ' + (t.effort || '?') + ')_\n'
  }
  md += '\n'

  md += '## Design-system fixes — do these first\n\n'
  const sysSorted = sys.sort((a, b) => (b.reach || 0) * (SEVW[b.severity] ?? 0) - (a.reach || 0) * (SEVW[a.severity] ?? 0))
  if (!sysSorted.length) md += '_No systemic issues identified._\n\n'
  for (const s of sysSorted) {
    md += '### ' + s.id + ' · ' + s.title + '  _(' + s.layer + ')_\n\n'
    md += s.problem + '\n\n'
    md += '- **Root cause:** ' + s.rootCause + '\n'
    md += '- **Fix (global):** ' + s.fix + '\n'
    md += '- **Severity:** ' + s.severity + (s.wcag ? ' · ' + s.wcag : '') + ' — **Effort:** ' + s.effort + ' — **Reach:** ' + (s.reach || (s.componentsAffected || []).length) + ' primitive(s)\n'
    md += '- **Repairs:** ' + ((s.componentsAffected || []).join(', ') || '—') + '\n'
    md += '- **Findings:** ' + ((s.findingIds || []).join(', ') || '—') + '\n\n'
  }

  md += '## Component-specific fixes — exceptions\n\n'
  if (!loc.length) md += '_None — every issue reduced to a design-system fix._\n\n'
  for (const l of loc) {
    md += '### ' + l.id + ' · ' + l.component + '\n\n'
    md += l.problem + '\n\n'
    md += '- **Fix (local):** ' + l.fix + '\n'
    md += '- **Why local (not systemic):** ' + l.whyLocal + '\n'
    md += '- **Severity:** ' + l.severity + (l.wcag ? ' · ' + l.wcag : '') + ' — **Effort:** ' + l.effort + (l.findingId ? ' — **Finding:** ' + l.findingId : '') + '\n\n'
  }

  md += '## Appendix — findings by primitive (traceability)\n\n'
  const sorted = results.slice().sort((a, b) => {
    const ca = byTitle.get(a.component), cb = byTitle.get(b.component)
    return ((ca && ca.group) || '').localeCompare((cb && cb.group) || '') || a.component.localeCompare(b.component)
  })
  for (const r of sorted) {
    const c = byTitle.get(r.component)
    md += '### ' + r.component + (c ? ' (' + c.group + ')' : '') + '\n\n'
    const fs = (r.findings || []).slice().sort((a, b) => (SEV[a.severity] ?? 4) - (SEV[b.severity] ?? 4))
    if (!fs.length) md += '_No issues found._\n\n'
    for (const f of fs) {
      const own = owner.get(f.id) || 'UNMAPPED'
      md += '- **' + f.id + ' · ' + f.severity + ' · ' + f.category + (f.wcag ? ' · ' + f.wcag : '') + '** — ' + f.problem + (f.evidence ? ' _(' + f.evidence + ')_' : '') + '  → **' + own + '** _(' + (f.scope || '?') + ')_\n'
    }
    const dc = r.deliberateConfirmed || []
    if (dc.length) {
      md += '\n  <details><summary>Deliberate (confirmed, not bugs)</summary>\n\n'
      for (const d of dc) md += '  - ' + d.note + (d.reference ? ' — ' + d.reference : '') + '\n'
      md += '  </details>\n'
    }
    md += '\n'
  }
  return md
}

// ---- Focus filter (args) -----------------------------------------------------
function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, '') }
const focus = args == null ? [] : (Array.isArray(args) ? args : [args])
const focusKeys = focus.map(norm).filter(Boolean)

phase('Discover')
const disc = await agent(
  'List every Lunma catalog story. Run: ls apps/extension/catalog/stories/ui/*.stories.svelte (from the repo root). For each story file, read its <script module> "meta" (export const meta = defineStory({...})) and extract title and group. Return one entry per story with: title; group; story = the repo-relative story path; source = "apps/extension/src/ui/<title>.svelte" (the primitive the story renders; title equals the primitive filename). Return ALL of them with no omissions.',
  { label: 'discover', phase: 'Discover', agentType: 'general-purpose', model: 'sonnet', schema: DISCOVER_SCHEMA },
)
let components = (disc && disc.components) || []
if (!components.length) return { error: 'no components discovered' }
if (focusKeys.length) {
  // Per-key: an exact title match wins; only fall back to substring when NO
  // primitive's title equals the key — so 'Button' hits Button alone, not every
  // *Button, while 'Fav' (no exact) still fans out to Favicon/FaviconTile.
  const matched = new Set()
  for (const k of focusKeys) {
    const exact = components.filter((c) => norm(c.title) === k)
    const picks = exact.length ? exact : components.filter((c) => norm(c.title).indexOf(k) >= 0)
    for (const c of picks) matched.add(c)
  }
  components = components.filter((c) => matched.has(c))
  if (!components.length) return { error: 'no primitives matched focus: ' + JSON.stringify(focus) }
  log('Focused to ' + components.length + ' primitive(s): ' + components.map((c) => c.title).join(', '))
} else {
  log('Reviewing all ' + components.length + ' primitives')
}

const scoped = focusKeys.length > 0
const slug = scoped ? components.map((c) => norm(c.title)).join('-').slice(0, 40) : ''
const outPath = scoped ? 'docs/design/catalog-review-' + slug + '.md' : 'docs/design/catalog-review.md'
const reportTitle = scoped
  ? 'Component review (global-first) — ' + components.map((c) => c.title).join(', ')
  : 'Component catalog — design & UX review (global-first)'

// Load the curated non-findings ledger (a falsifiable prior injected into review +
// verify so known false positives aren't re-raised). The script has no filesystem
// access, so an agent reads it; empty on the first run.
const ledgerRaw = await agent(
  'Read the file docs/design/catalog-non-findings.md and return its FULL contents verbatim. If the file does not exist, return exactly NONE. Output only the file text or NONE — nothing else.',
  { label: 'read-ledger', phase: 'Discover', agentType: 'general-purpose', model: 'sonnet' },
)
const ledgerText = typeof ledgerRaw === 'string' && ledgerRaw.trim() && ledgerRaw.trim() !== 'NONE' ? ledgerRaw.trim() : ''
if (ledgerText) log('Loaded non-findings ledger (falsifiable prior)')

phase('Review')
const reviewed = await pipeline(
  components,
  (c) => agent(reviewPrompt(c, ledgerText), { label: 'review:' + c.title, phase: 'Review', agentType: 'general-purpose', model: 'opus', effort: 'high', schema: REVIEW_SCHEMA }),
  (r, c) => {
    if (!r) return null
    const findings = r.findings || []
    // Skip verify when there's nothing to check — verify only validates PROPOSED
    // findings (it never discovers new ones), so an empty finding list has nothing
    // to adversarially confirm. The review object flows straight through.
    if (!findings.length) return r
    // Adaptive model: Sonnet handles the routine adversarial check; escalate to
    // Opus only where the stakes or spec-subtlety warrant the stronger reviewer —
    // a P0/P1 finding, or ANY accessibility finding (carries a WCAG SC). The
    // spec-contended cases (a proposed finding that is actually a deliberate a11y
    // decision — the IconButton "no pressed state" case) are exactly where a
    // cheaper verifier is likeliest to slip, and they surface as WCAG-tagged
    // findings. Routine visual/consistency/ergonomics P2/P3 verify on Sonnet.
    const escalate = findings.some((f) => f.severity === 'P0' || f.severity === 'P1' || !!f.wcag)
    const model = escalate ? 'opus' : 'sonnet'
    return agent(verifyPrompt(c, r, ledgerText), { label: 'verify:' + c.title, phase: 'Verify', agentType: 'general-purpose', model, effort: 'high', schema: VERIFY_SCHEMA })
  },
)
const results = reviewed.filter(Boolean)
const allFindings = results.flatMap((r) => (r.findings || []).map((f) => ({ ...f, component: r.component })))
log(allFindings.length + ' verified findings across ' + results.length + ' primitive(s)')

phase('Synthesize')
const compact = allFindings.map((f) => ({ component: f.component, id: f.id, severity: f.severity, category: f.category, problem: f.problem, scope: f.scope, rootCause: f.rootCause, effort: f.effort }))
const syn = await agent(synthPrompt(compact, components.length), { label: 'synthesize', phase: 'Synthesize', model: 'opus', effort: 'high', schema: SYNTH_SCHEMA })

const md = assemble(results, syn, components, reportTitle)

phase('Report')
await agent(
  'Create the directory docs/design if it does not exist, then write the report below to ' + outPath + ' using the Write tool. Write ONLY the report content that follows the marker line, exactly and verbatim - do not summarize, reformat, or add commentary.\n\n===== REPORT CONTENT BELOW =====\n' + md,
  { label: 'write-report', phase: 'Report', agentType: 'general-purpose', model: 'sonnet' },
)

// Auto-maintain the non-findings ledger: feed this run's REFERENCED deliberate
// confirmations to the merge agent (dedupes by decision, bumps recurrence). The
// reference requirement is the quality filter that replaces a human gate; an
// unreferenced "seems intentional" never enters and stays per-run.
const newReferenced = results.flatMap((r) =>
  (r.deliberateConfirmed || [])
    .filter((d) => d && d.reference && String(d.reference).trim())
    .map((d) => ({ component: r.component, note: d.note, reference: String(d.reference) })),
)
if (newReferenced.length) {
  await agent(mergeLedgerPrompt(ledgerText, newReferenced), { label: 'merge-ledger', phase: 'Report', agentType: 'general-purpose', model: 'sonnet' })
  log('Merged ' + newReferenced.length + ' referenced non-finding(s) into docs/design/catalog-non-findings.md')
}

const systemicCount = ((syn && syn.systemicFixes) || []).length
const localCount = ((syn && syn.localFixes) || []).length
return { path: outPath, components: components.length, findings: allFindings.length, systemicFixes: systemicCount, localFixes: localCount, ledgerCandidates: newReferenced.length, scoped }
