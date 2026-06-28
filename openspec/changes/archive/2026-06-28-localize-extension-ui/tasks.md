## 0. Preconditions

- [x] 0.1 Confirm `add-i18n-foundation` is present (its generated `src/shared/paraglide/` runtime + `i18n.ts` resolver exist on this branch — committed on the parent `feat/i18n` branch / PR #40). It is not yet *archived*, but the code dependency is satisfied for implementation; archive lands when PR #40 merges.

## 1. String inventory

- [x] 1.1 Enumerate every hardcoded user-facing string in `sidebar/`, `launcher/` (new-tab + `overlay.ts`), and `options/` (target ~124); record each as `surface · file:line · text · proposed key`. This list drives sections 2–4 and seeds the enforcement-guard allowlist review.
- [x] 1.2 Agree the key-naming convention (flat, surface-namespaced: `sidebar_*`, `launcher_*`, `options_*`) and the ICU plural/interpolation cases.

## 2. Sidebar migration

- [x] 2.1 Add the sidebar message keys to `messages/en.json`.
- [x] 2.2 Replace sidebar literals with `m.*` calls (App, PinnedTabs, TempTabs, SpaceSwitcher, editors, menus); keep locale state via `shared/i18n.ts`, render via `m.*`.

## 3. Launcher (new-tab) migration

- [x] 3.1 Add the new-tab/launcher message keys to `messages/en.json`.
- [x] 3.2 Replace new-tab + inline-launcher literals with `m.*`.

## 4. Options migration + settings labels (D2)

- [x] 4.1 Add the options message keys to `messages/en.json` (card headings, group intros, control descriptions, hints, footer).
- [x] 4.2 Replace options literals with `m.*`.
- [x] 4.3 Create `apps/extension/src/options/labels.ts` mapping each setting `key` → label/description message thunks; consume it in `Options.svelte` for `decl.label`/`decl.description`. Keep `settings.ts` catalog-free (foundation D4); endonym option labels stay literal. Confirm `biome check`'s `noImportCycles` passes (no `settings → i18n` edge).

## 5. Overlay decision (D3)

- [x] 5.1 Decision recorded in `design.md` D3: **Plan B** — Plan A rejected without a full spike because the overlay has no synchronous locale access (never runs the seeding `boot()`) and is byte-budgeted, so importing `m.*` would always render `en` unless it added an async storage read + the resolver on top of the runtime weight. Plan B adds no Paraglide import to the overlay (budget green by construction).
- [x] 5.2 Implement Plan B: add `lunma/overlay-labels` request + `OverlayLabels` type to `launcher-contract.ts`; SW handler resolves the locale and renders the 11 overlay strings via `m.*`; overlay fetches on open, fills the `{engine}` template with a string-replace, keeps English-literal fallbacks. Keep the overlay SW-safe and `overlay.budget.test.ts` green.

## 6. Translations

- [x] 6.1 Author real translations for `messages/{es,pt-PT,fr,de,ja,ko,zh-CN,ru}.json` (replace English seeds), length- and context-conscious, Lunma voice.
- [x] 6.2 Author real translations for `public/_locales/{locale}/messages.json` (description, action title, command descriptions).
- [x] 6.3 Confirm `i18n-parity.test.ts` stays green (key-complete, no empty values) across all 9 locales for both catalog families.

## 7. Enforcement gate (D4)

- [x] 7.1 Create `apps/extension/src/i18n-no-literal.test.ts`: parse each migrated surface `.svelte` template (Svelte compiler AST) and fail on a user-visible literal text node, with the allowlist (whitespace/punctuation/symbol-only, brand "Lunma", `code`/`pre`, fixed `class`/`data-testid`) and the inline `i18n-exempt` escape hatch (exempts an element's whole subtree); report `file:line` + text. Scope to `sidebar/`, `launcher/`, `options/` (shipping `.svelte` only — `.test`/`.harness` fixtures skipped). **Extended (per review):** also flags user-facing **component-prop** literals (`heading`/`label`/`description`/`subtitle`/`ariaLabel`), closing the `heading="…"`/`label="…"` regression path. Literal strings in `<script>` logic (option labels, toasts) are out of guard scope (review concern) — though migrated for completeness in this change.
- [x] 7.2 Missing-key enforcement is provided by **`tsc`** (already in `verify`), not a separate inlang lint: Paraglide generates a typed `m` namespace, so `m.bogusKey()` is a compile error — stronger than a runtime lint. (Spec + scenario reconciled accordingly.)
- [x] 7.3 Run the guard against the migrated tree; resolve real findings (migrate or mark `i18n-exempt` with a reason) until green.

## 8. Docs

- [x] 8.1 Update `docs/architecture.md`: the localized-strings contract (surfaces render via `m.*`), the enforcement guard, and the committed overlay path (D3).
- [x] 8.2 Update `docs/tech-stack.md` with a one-line note that i18n enforcement rides `verify` (no new tooling).

## 9. Verify

- [x] 9.1 Run `pnpm --filter @lunma/extension verify` — green, now including `i18n-no-literal`, the inlang lint, parity, and locale-set guards.
- [~] 9.2 `pnpm --filter @lunma/extension build` ✓ (succeeds; `dist/_locales/{en,es,pt_PT,fr,de,ja,ko,zh_CN,ru}` ship; manifest still localized). REMAINING (manual, needs real Chrome): load `dist/` unpacked and confirm each surface renders translated under a non-`en` locale (e.g. `de`), the picker switches live (reload), and the overlay localizes (Plan B).
- [x] 9.3 Run `openspec validate localize-extension-ui` (✓ valid) and (optionally) the `spec-reviewer` agent before applying.
