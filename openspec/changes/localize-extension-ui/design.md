## Context

`add-i18n-foundation` established the i18n machinery but migrated **no** strings — every
in-app label is still a hardcoded English literal. This change does the migration, authors
real translations, and — the part the foundation could not do without strings to police —
adds a CI gate that fails on a new un-localized string.

Constraints carried over from the foundation:
- **Locale state vs message rendering split** (foundation `i18n` spec): surfaces obtain
  locale *state* only via `src/shared/i18n.ts`; they render messages via the generated
  `m.*` directly. This change consumes `m.*` widely for the first time.
- **No `settings → i18n` edge** (foundation D4): `settings.ts` must not import the
  catalog. Endonym option labels stay literal; only the English *control* labels move —
  via an indirection outside `settings.ts`.
- **Overlay byte budget** (`overlay.budget.test.ts`, <15KB): the `Alt+L` content script
  injects on `<all_urls>`; the foundation deferred whether it can afford Paraglide.
- **SW-safety**: unchanged — the overlay and content scripts never touch
  `window`/`document` for locale; locale comes from the resolver / the bus.
- **Catalog parity** (`i18n-parity.test.ts`) and **locale-set equivalence**
  (`i18n-locale-set.test.ts`) already ride `verify`; new keys must keep them green.

## Goals / Non-Goals

**Goals:**
- Replace the ~124 hardcoded sidebar/launcher/options strings with `m.*` calls, keys in
  `messages/en.json`.
- Real, length-conscious translations for `es, pt-PT, fr, de, ja, ko, zh-CN, ru` (Paraglide
  catalogs + native `_locales`).
- Localize settings control labels/descriptions without a `settings → i18n` edge.
- Decide the overlay localization path with budget evidence.
- A `pnpm verify` gate that fails on a new un-i18n'd `.svelte` literal and on a
  missing/unused message key.

**Non-Goals:**
- Marketing-site localization (`localize-marketing-site`).
- RTL layout / per-locale fonts (all 9 locales LTR; CJK system-face fallback).
- ICU message *authoring* tooling beyond what Paraglide already gives (plurals are used
  where grammar needs them, not retrofitted everywhere).
- Translating endonym option labels or the brand "Lunma" (intentionally literal).

## Decisions

### D1 — Migration is per-surface, key-namespaced, `m.*` at the call site
Strings move to `messages/en.json` under a flat, namespaced key convention
(`sidebar_pinnedHeading`, `launcher_emptyHint`, `options_languageDescription`, …) and are
rendered with `m.sidebar_pinnedHeading()` inline. Interpolations and plurals use Paraglide's
ICU (`m.foo({ count })`). No wrapper layer — the generated `m.*` IS the API, per the
foundation's locale-state-vs-rendering split.
- **Alternative:** a `t('key')` indirection. Rejected — loses Paraglide's per-message
  type-safety and tree-shaking, the whole reason the library was chosen.

### D2 — Settings labels via `options/labels.ts`, not `settings.ts`
A new `apps/extension/src/options/labels.ts` maps each setting `key` (and its
description) to a message thunk (`() => m.options_languageLabel()`); `Options.svelte`
resolves the label/description through it at render instead of reading `decl.label`
directly. `settings.ts` keeps its literal `label`/`description` as the
non-localized fallback + the source of truth for the declaration shape, and imports **no**
catalog — so the foundation's `settings → i18n` cycle ban holds (verified by
`biome check`'s `noImportCycles`). Endonym option labels remain literal in `settings.ts`.
- **Alternative:** message-back the labels in `settings.ts` directly. Rejected — forms the
  banned `settings ↔ i18n` edge (foundation D4).

### D3 — Overlay localization: [DECISION PENDING — Plan A vs Plan B]
Plan A: the overlay imports `m.*` for its (few) labels, accepted only if
`overlay.budget.test.ts` stays under 15KB with Paraglide's overlay-reachable messages
tree-shaken in. Plan B: the SW sends pre-localized label strings to the overlay over the
typed message bus (`launcher-contract`), keeping the overlay catalog-free and vanilla.
The implementer measures Plan A against the budget first; if it fits, Plan A (simplest,
no new wire contract); else Plan B. **This design will record the measured choice before
tasks are marked done** — it is the one open decision, mirroring the foundation's deferral.
- **Bias:** Plan B is the safe default if the budget is tight, since the overlay's "every
  byte counts" rule (tech-stack) outranks call-site convenience.

### D4 — Enforcement gate: a Vitest `.svelte`-literal guard + inlang lint, on `verify`
Biome has no `no-literal-string` rule and the repo is Biome-only (adding ESLint for one
rule is a disproportionate stack change). So the gate is two pieces, both already-precedented
as `verify`-riding guards (`version-parity`, `overlay.budget`):
1. **`src/i18n-no-literal.test.ts`** — parses each user-facing `.svelte` template (via the
   Svelte compiler's AST, the same parser `svelte-check` uses) and fails on a literal text
   node that is user-visible, *unless* it is allow-listed. Exemptions: whitespace/punctuation-
   only nodes, the brand string "Lunma", values inside `code`/`pre`/`<style>`, attributes that
   are legitimately fixed (class names, `data-testid`, non-visible `aria` ids), and an inline
   `<!-- i18n-exempt: reason -->` / `// i18n-exempt` escape hatch for the rare intentional
   literal. Scope: the migrated surfaces (`sidebar/`, `launcher/`, `options/`); the guard's
   own allowlist is the single audited list of exceptions.
2. **inlang missing-key / unused-message lint** wired into `verify` (`paraglide-js` /
   inlang validate) — fails on an `m.foo()` with no catalog key, and reports orphaned keys.
- **Alternative:** ESLint + `eslint-plugin-i18next no-literal-string`. Rejected — a second
  lint toolchain for one rule; the Vitest guard reuses the Svelte parser already in the
  graph and rides the existing `verify` aggregation.
- **Risk:** false positives. Mitigated by the `i18n-exempt` escape hatch + a tight,
  reviewed allowlist; the guard reports the file:line and the offending text so a fix or an
  exemption is a one-line change.

### D5 — Translation authoring is length- and context-conscious
Translations respect the UI's space (sidebar rows, launcher chips, button widths) and the
Lunma voice; CJK strings assume the system-face fallback. `en.json` stays the source of
truth; the parity test guarantees no locale is missing a key, but **quality** is a review
concern, not a test (a machine cannot assert a good translation).

### Doc updates in this change
- `docs/architecture.md`: the localized-strings contract (surfaces render via `m.*`), the
  enforcement guard, and the chosen overlay path (D3).
- `docs/tech-stack.md`: only if tooling changes — it does not (the guard is a Vitest test);
  a one-line note that the i18n enforcement rides `verify`.

## Risks / Trade-offs

- **Enforcement false positives churn the guard's allowlist** → the `i18n-exempt` hatch +
  reporting file:line+text keeps each exception a reviewed one-liner; scope limited to the
  three migrated surface dirs so unrelated `.svelte` (e.g. lenspage charts) aren't policed
  until migrated.
- **Overlay budget regression under Plan A** → measured against `overlay.budget.test.ts`
  before committing to Plan A; Plan B is the fallback by construction.
- **Translation drift / quality** → parity test guards completeness; quality stays a
  human review gate (Non-Goal to automate).
- **Large diff (124 strings)** → bounded, mechanical, and reviewable per-surface; the new
  guard prevents backsliding after the migration lands.
- **Settings label indirection adds a layer** → contained to `options/labels.ts`; the
  payoff is keeping the `settings → i18n` cycle ban intact (a hard architecture rule).
