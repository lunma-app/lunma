## 1. Rename the locale at its source and assets

- [x] 1.1 In `apps/extension/project.inlang/settings.json`, change `"pt-PT"` → `"pt"` in `locales`
- [x] 1.2 `git mv apps/extension/messages/pt-PT.json apps/extension/messages/pt.json` (content unchanged)
- [x] 1.3 `git mv apps/extension/public/_locales/pt_PT apps/extension/public/_locales/pt` (Chrome underscore-code dir)

## 2. Update resolver and settings

- [x] 2.1 In `apps/extension/src/shared/i18n.ts`, change `BASE_TAG_TO_LOCALE` `pt: 'pt-PT'` → `pt: 'pt'` and update the two comments naming `pt → pt-PT` to `pt → pt`
- [x] 2.2 In `apps/extension/src/shared/settings.ts`, change the language option `{ value: 'pt-PT', label: 'Português' }` → `{ value: 'pt', label: 'Português' }` (label unchanged)

## 3. Regenerate the Paraglide runtime

- [x] 3.1 Run `pnpm --filter @lunma/extension gen:i18n` and stage the regenerated `apps/extension/src/shared/paraglide/` (verify `locales` now lists `pt`, not `pt-PT`)

## 4. Update tests

- [x] 4.1 `apps/extension/src/i18n-locale-set.test.ts`: change `EXPECTED` `'pt-PT'` → `'pt'`
- [x] 4.2 `apps/extension/src/shared/i18n.test.ts`: update the resolver test so `pt-BR` (and `pt-PT`) resolve to `pt`; fix the test name (`pt-BR → pt-PT` → `pt-BR → pt`)
- [x] 4.3 `apps/extension/src/i18n-parity.test.ts`: update the `pt_PT` underscore-code comment/mapping to `pt` (verify the `-`→`_` mapping still resolves the renamed dir)

## 5. Docs

- [x] 5.1 In `docs/architecture.md`, update the `pt-BR → pt-PT` resolution example to `pt-BR → pt` and the `pt_PT` `_locales`-code example to `pt`

## 6. Verify

- [x] 6.1 Run `pnpm --filter @lunma/extension verify` (tsc, biome, svelte-check, stylelint, vitest — incl. i18n-locale-set + i18n-parity + resolver tests) and confirm green
- [x] 6.2 Confirm no stale `pt-PT`/`pt_PT` references remain: `git grep -nE 'pt-PT|pt_PT' apps/extension docs` returns nothing (outside archived changes)
