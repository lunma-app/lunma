## 1. Manifest catalog directories

- [x] 1.1 Create `apps/extension/public/_locales/pt_BR/messages.json` with the
      current content of `apps/extension/public/_locales/pt/messages.json`
- [x] 1.2 Create `apps/extension/public/_locales/pt_PT/messages.json` with the
      same content
- [x] 1.3 Delete `apps/extension/public/_locales/pt/`

## 2. Test guards

- [x] 2.1 Update `apps/extension/src/i18n-locale-set.test.ts`'s
      `manifestCatalogLocales()` to fold `pt-BR`/`pt-PT` back to the single
      app locale `pt` (dedupe) before comparing against `EXPECTED`
- [x] 2.2 Add a test in `i18n-locale-set.test.ts` asserting
      `_locales/pt_BR/messages.json` and `_locales/pt_PT/messages.json` are
      byte-identical
- [x] 2.3 Update `apps/extension/src/i18n-parity.test.ts`'s `chromeDir()`
      helper to resolve the `pt` app locale to the `pt_PT` manifest directory
      for the key-parity check

## 3. Documentation

- [x] 3.1 Update `docs/architecture.md`'s "Native manifest / store-listing
      localization" paragraph to describe the `pt_BR`/`pt_PT` fan-out, why it
      exists (Chrome's manifest-locale enum has no bare `pt`), and that it is
      Store-metadata only

## 4. Verify

- [x] 4.1 Run `pnpm --filter @lunma/extension verify` and confirm the new and
      updated tests pass
