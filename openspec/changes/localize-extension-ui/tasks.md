## 0. Preconditions

- [ ] 0.1 Confirm `add-i18n-foundation` is archived (its `i18n` capability is live and the generated `src/shared/paraglide/` runtime exists); this change depends on it.

## 1. String inventory

- [ ] 1.1 Enumerate every hardcoded user-facing string in `sidebar/`, `launcher/` (new-tab + `overlay.ts`), and `options/` (target ~124); record each as `surface · file:line · text · proposed key`. This list drives sections 2–4 and seeds the enforcement-guard allowlist review.
- [ ] 1.2 Agree the key-naming convention (flat, surface-namespaced: `sidebar_*`, `launcher_*`, `options_*`) and the ICU plural/interpolation cases.

## 2. Sidebar migration

- [ ] 2.1 Add the sidebar message keys to `messages/en.json`.
- [ ] 2.2 Replace sidebar literals with `m.*` calls (App, PinnedTabs, TempTabs, SpaceSwitcher, editors, menus); keep locale state via `shared/i18n.ts`, render via `m.*`.

## 3. Launcher (new-tab) migration

- [ ] 3.1 Add the new-tab/launcher message keys to `messages/en.json`.
- [ ] 3.2 Replace new-tab + inline-launcher literals with `m.*`.

## 4. Options migration + settings labels (D2)

- [ ] 4.1 Add the options message keys to `messages/en.json` (card headings, group intros, control descriptions, hints, footer).
- [ ] 4.2 Replace options literals with `m.*`.
- [ ] 4.3 Create `apps/extension/src/options/labels.ts` mapping each setting `key` → label/description message thunks; consume it in `Options.svelte` for `decl.label`/`decl.description`. Keep `settings.ts` catalog-free (foundation D4); endonym option labels stay literal. Confirm `biome check`'s `noImportCycles` passes (no `settings → i18n` edge).

## 5. Overlay decision (D3)

- [ ] 5.1 Measure Plan A (overlay imports `m.*`) against `src/launcher/overlay.budget.test.ts` (<15KB). Record the number in `design.md` D3.
- [ ] 5.2 Implement the chosen plan: Plan A (overlay `m.*`, budget-permitting) OR Plan B (SW sends pre-localized labels over `launcher-contract`); update `design.md` D3 with the committed choice. Keep the overlay SW-safe and the budget guard green.

## 6. Translations

- [ ] 6.1 Author real translations for `messages/{es,pt-PT,fr,de,ja,ko,zh-CN,ru}.json` (replace English seeds), length- and context-conscious, Lunma voice.
- [ ] 6.2 Author real translations for `public/_locales/{locale}/messages.json` (description, action title, command descriptions).
- [ ] 6.3 Confirm `i18n-parity.test.ts` stays green (key-complete, no empty values) across all 9 locales for both catalog families.

## 7. Enforcement gate (D4)

- [ ] 7.1 Create `apps/extension/src/i18n-no-literal.test.ts`: parse each migrated surface `.svelte` template (Svelte compiler AST) and fail on a user-visible literal text node, with the allowlist (whitespace/punctuation-only, brand "Lunma", `code`/`pre`/`<style>`, fixed `class`/`data-testid`/non-visible `aria`) and the inline `i18n-exempt` escape hatch; report `file:line` + text. Scope to `sidebar/`, `launcher/`, `options/`.
- [ ] 7.2 Wire the inlang missing-key / unused-message lint into `apps/extension` `verify` (fail on an `m.*` with no catalog key).
- [ ] 7.3 Run the guard against the migrated tree; resolve real findings (migrate or mark `i18n-exempt` with a reason) until green.

## 8. Docs

- [ ] 8.1 Update `docs/architecture.md`: the localized-strings contract (surfaces render via `m.*`), the enforcement guard, and the committed overlay path (D3).
- [ ] 8.2 Update `docs/tech-stack.md` with a one-line note that i18n enforcement rides `verify` (no new tooling).

## 9. Verify

- [ ] 9.1 Run `pnpm --filter @lunma/extension verify` — green, now including `i18n-no-literal`, the inlang lint, parity, and locale-set guards.
- [ ] 9.2 `pnpm --filter @lunma/extension build`; load `dist/` unpacked and confirm each surface renders translated under a non-`en` locale (e.g. `de`), the picker switches live (reload), and the overlay localizes per the chosen plan.
- [ ] 9.3 Run `openspec validate localize-extension-ui` and (optionally) the `spec-reviewer` agent before applying.
