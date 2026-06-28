## Why

`add-i18n-foundation` shipped the i18n plumbing — the Paraglide catalog + generated
runtime, the SW-safe locale resolver (`src/shared/i18n.ts`), the `language` picker, and
native manifest `_locales` — but **every in-app UI string is still hardcoded English**.
Picking French in Options today reloads the surfaces and changes nothing visible. This
change delivers the actual user-visible payoff: it migrates the ~124 hardcoded
sidebar / launcher / options strings onto the message catalog and authors **real
translations** for the eight non-`en` locales, so the app genuinely speaks nine
languages.

It is the named downstream consumer the foundation was built for — it exercises the
catalog, the generated runtime (`m.*`), the resolver, and the picker. It also closes the
gap the foundation could not: there is **no guard** stopping a developer from hardcoding a
new English string, so without enforcement the catalog silently rots. This change adds a
CI gate that fails `pnpm verify` on a new un-localized user-facing string.

**Sequencing:** this change ships *after* `add-i18n-foundation` is archived (it depends on
that change's `i18n` capability + the generated runtime). The marketing site is a separate
change (`localize-marketing-site`, its own inlang project — cross-app imports are
Biome-banned).

## What Changes

- **String migration:** replace the ~124 hardcoded user-facing strings in `sidebar/`,
  `launcher/` (new-tab + the `overlay.ts` content script), and `options/` with Paraglide
  message functions (`m.*`). Locale *state* still comes only from `src/shared/i18n.ts`;
  message *rendering* uses the generated `m.*` directly (the intended split the foundation
  spec set out). New message keys land in `messages/en.json` (source of truth).
- **Real translations:** replace the English-copy seeds in `messages/{es,pt-PT,fr,de,ja,
  ko,zh-CN,ru}.json` with context-aware, length-conscious translations; same for the
  native `public/_locales/{locale}/messages.json` (description, action title, command
  descriptions). The parity test from the foundation already guards key-completeness.
- **Settings label localization (no `settings → i18n` edge):** the existing control
  labels/descriptions become message-backed through a new `options/labels.ts` indirection
  that maps a setting `key` → `m.*`, consumed by `Options.svelte` at render. `settings.ts`
  stays catalog-free (foundation D4 — endonym option labels remain literal; only the
  English control *labels* move).
- **Overlay decision:** resolve the foundation's deferred open question — whether the
  `Alt+L` launcher overlay imports Paraglide (Plan A, gated on the existing
  `overlay.budget.test.ts` <15KB ceiling) or receives pre-localized labels over the
  message bus (Plan B). The design picks one with the budget evidence.
- **i18n enforcement gate (NEW):** a guard that fails `pnpm verify` on a new un-i18n'd
  user-facing string. Biome has no `no-literal-string` rule and the repo is Biome-only (no
  ESLint), so the mechanism is a custom test `src/i18n-no-literal.test.ts` that parses
  `.svelte` templates and flags literal text nodes outside an explicit allowlist + an
  inline `// i18n-exempt` escape hatch (exempting class/`aria` fixed values, `code`/`pre`,
  the brand string "Lunma", test ids). Plus wiring inlang's missing-key / unused-message
  lint into `verify`. Both ride `pnpm verify` like `version-parity` / `overlay.budget`.

## Capabilities

### New Capabilities
<!-- none — this change extends existing capabilities -->

### Modified Capabilities
- `i18n`: adds the **localized-UI-strings contract** (every user-facing string in the
  sidebar/launcher/options surfaces SHALL render through a Paraglide message function, not
  a literal), the **real-translation** requirement for the eight non-`en` locales, the
  **overlay localization** decision, and the **no-un-i18n'd-strings enforcement gate**
  (CI-failing guard). Builds on the `i18n` capability introduced by `add-i18n-foundation`.
- `settings`: control labels/descriptions become message-backed via an `options/labels.ts`
  indirection (rendered through `m.*`), **without** introducing a `settings → i18n` import
  edge — `settings.ts` itself stays catalog-free.

## Impact

- **Depends on:** `add-i18n-foundation` (archived) — its catalog, generated runtime,
  `i18n.ts` resolver, and `language` picker.
- **Modified files (broad):** `messages/{locale}.json` (×9, new keys + real
  translations), `public/_locales/{locale}/messages.json` (×9, real translations), the
  sidebar / launcher / options `.svelte` + `.ts` surfaces (literal → `m.*`), new
  `apps/extension/src/options/labels.ts`, `Options.svelte` (consume `labels.ts`),
  `overlay.ts` (per the Plan A/B decision), `apps/extension/package.json` (`verify` wires
  the inlang lint), possibly `apps/extension/src/shared/i18n.ts` if the overlay path needs
  a wire-handoff.
- **New files:** `apps/extension/src/options/labels.ts`,
  `apps/extension/src/i18n-no-literal.test.ts` (the enforcement guard).
- **Quality gates:** `pnpm verify` stays green AND gains two new failing conditions — a
  new un-i18n'd `.svelte` literal, and a missing/unused message key. The overlay budget
  guard (`overlay.budget.test.ts`) still holds whichever overlay plan is chosen.
- **Docs updated in this change:** `docs/architecture.md` (the localized-strings contract
  + the enforcement guard + the chosen overlay path); `docs/tech-stack.md` only if the
  enforcement mechanism adds tooling (it does not — it is a Vitest guard).
- **Non-goals:** marketing-site localization (`localize-marketing-site`); RTL / per-locale
  fonts (all 9 locales are LTR; CJK system-face fallback as noted in the foundation).
