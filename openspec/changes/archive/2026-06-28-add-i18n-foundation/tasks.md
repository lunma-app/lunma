## 1. Dependency & toolchain

- [x] 1.1 Add `@inlang/paraglide-js` (v2.x) to `apps/extension` devDependencies via a `catalog:` entry in `pnpm-workspace.yaml`; run `pnpm install`.
- [x] 1.2 Add `"gen:i18n": "paraglide-js compile --project ./project.inlang --outdir ./src/shared/paraglide --strategy custom-lunmaSettings baseLocale --no-emit-git-ignore --emit-ts-declarations"` to `apps/extension/package.json` scripts, and prepend it to the existing `dev` and `build` scripts (mirroring `gen:icons`). The `--strategy` flag keeps the committed runtime identical to the vite-plugin output (D3, no drift); `--no-emit-git-ignore` lets the generated dir be committed (D2 — paraglide otherwise emits a `*` gitignore into the outdir); `--emit-ts-declarations` emits the `.d.ts` D2 relies on so standalone `tsc`/`svelte-check` (run outside Vite, with `allowJs: false`) can type the runtime. The vite plugin mirrors these (`emitGitIgnore: false`, `emitTsDeclarations: true`) so its re-emit stays byte-identical.
- [x] 1.3 Add `"!apps/extension/src/shared/paraglide/**"` to `biome.json` `files.includes` so the generated runtime is excluded from linting/formatting.

## 2. inlang project & catalogs

- [x] 2.1 Create `apps/extension/project.inlang/settings.json` with `baseLocale: "en"`, `locales: ["en","es","pt-PT","fr","de","ja","ko","zh-CN","ru"]`, the message-format plugin, and `pathPattern: "./messages/{locale}.json"`.
- [x] 2.2 Create `apps/extension/messages/en.json` with the foundation message keys this change needs (none of the migrated surface strings yet — those land in `localize-extension-ui`); seed `es,pt-PT,fr,de,ja,ko,zh-CN,ru` as key-identical copies of `en`.
- [x] 2.3 Run `pnpm --filter @lunma/extension gen:i18n`; commit the generated `apps/extension/src/shared/paraglide/**`. Verify `biome check` does not lint it and the generated code imports nothing from other `src/` layers.

## 3. Vite wiring

- [x] 3.1 In `apps/extension/vite.config.ts`, add `paraglideVitePlugin({ project: './project.inlang', outdir: './src/shared/paraglide', strategy: ['custom-lunmaSettings','baseLocale'] })` to `plugins`, ordered before `svelte()`/`crx()`. (Also passes `emitGitIgnore: false` so the build re-emit stays byte-identical to the committed runtime — matches the `gen:i18n` `--no-emit-git-ignore` flag.)

## 4. Locale resolver (`src/shared/i18n.ts`)

- [x] 4.1 Create `apps/extension/src/shared/i18n.ts`: register `defineCustomClientStrategy('custom-lunmaSettings', { getLocale: () => cached, setLocale: (l) => void writeSetting('language', l) })` at module load (import-for-side-effect, so the strategy is registered before any `getLocale()` evaluates) over a module-level sync `cached` locale; re-export `getLocale`/`setLocale`. **Deviation (TS-forced):** `getLocale` is re-exported raw, but `setLocale` is a thin typed wrapper rather than a raw re-export — the picker's `'auto'` sentinel is not a Paraglide `Locale`, so the raw export's type rejects it. The wrapper persists via `writeSetting('language', value)` (identical behaviour) and accepts `'auto'`.
- [x] 4.2 Implement `initLocale()`: `await readSettings()`, and when `language === 'auto'` resolve from `chrome.i18n.getUILanguage() ?? navigator.language`, mapping base tags to the nearest supported locale (`pt → pt-PT`, `zh → zh-CN`, …) with `en` as terminal fallback; otherwise use the stored locale. Seed `cached`.
- [x] 4.3 Implement `applyLocaleFromSettings(language)` to re-seed `cached` (resolving `'auto'` the same way).
- [x] 4.4 Add a guard/unit assertion that the resolver path references no `window`/`document`/`localStorage` (SW-safety).

## 5. Settings: `language` field

- [x] 5.1 In `apps/extension/src/shared/settings.ts`, define `SupportedLocale` by **deriving it from the generated runtime's `locales` constant** (`import type { locales } from './paraglide/runtime'` — `import type` because `locales` is referenced only in a `typeof` type query, which Biome's `useImportType` requires and `tsc` accepts; `type SupportedLocale = (typeof locales)[number]`) rather than hand-writing the union — a `shared → shared` edge, no cycle (D8). Add `language: SupportedLocale | 'auto'` to the `Settings` interface and `language: 'auto'` to `DEFAULTS`. The expected set is `en, es, pt-PT, fr, de, ja, ko, zh-CN, ru`.
- [x] 5.2 Append the `language` enum declaration to `SETTINGS` (`group: 'Appearance'`, `label: 'Language'`, `default: 'auto'`, options = `auto` + 9 endonym labels). Confirm derived Zod is `z.enum([...]).catch('auto')` and that `settings.ts` imports no i18n catalog (no cycle).

## 6. Options picker & switch propagation

- [x] 6.1 The 10-option `language` enum renders via the existing `Select` (stacked) path with no *renderer* change (verified: `Options.svelte` renders `enum && options.length > 4` as a stacked `Select`). But `Options.svelte` **does** change: add a `language` branch to `onSelect` (mirroring the existing `density`/`theme` special-cases) that routes through `setLocale(value, { reload: false })` instead of a bare `writeSetting`; add the one-line description copy for the control.
- [x] 6.2 Add the gated reload path. Extend `sidebar/main.ts` and `launcher/newtab/main.ts` existing `watchSettings` callbacks, and add a **new** `watchSettings` subscription to `Options.svelte` (it has none today), each tracking the previous `language` and calling `applyLocaleFromSettings(s.language)` + `location.reload()` **only when `language` changed**. Non-language changes MUST keep applying live (no reload). `setLocale` uses `{ reload: false }` so this path is the single reload owner (no double reload on the initiating surface).
- [x] 6.3 Seed the locale before first paint: add `initLocale()` to the existing pre-`mount()` `boot()` in `sidebar/main.ts` and `launcher/newtab/main.ts`; **restructure `options/main.ts`** (currently a synchronous `mount`) into an async boot that `await`s `readSettings()` + `initLocale()` before `mount(Options, …)`.

## 7. Manifest `_locales`

- [x] 7.1 In `apps/extension/public/manifest.json`, add `"default_locale": "en"` and convert `description`, `action.default_title`, `commands.pin-active-tab.description`, `commands.toggle-launcher.description` to `__MSG_key__`; leave `name`/`short_name` literal.
- [x] 7.2 Create `apps/extension/public/_locales/{locale}/messages.json` for all 9 locales with the referenced keys (non-`en` seeded as English copies for now). NOTE: Chrome `_locales` subdirectories use underscore locale codes (`pt_PT`, `zh_CN`), not the Paraglide hyphen form — the parity/locale-set tests map `-` → `_`.

## 8. Tests

- [x] 8.1 Create `apps/extension/src/i18n-parity.test.ts` (read catalogs via `readFileSync`, not static import): assert every `messages/{locale}.json` and every `public/_locales/{locale}/messages.json` has the same key set as `en` with no empty values.
- [x] 8.2 Add a unit test for `initLocale()` locale resolution: `'auto'` + `de` → `de`; `'auto'` + `pt-BR` → `pt-PT`; `'auto'` + unsupported → `en`; stored explicit locale honoured.
- [x] 8.3 Add a settings test: `language` defaults to `'auto'`; an out-of-range stored value falls back to `'auto'`.
- [x] 8.4 Add a locale-set equivalence test: the inlang `project.inlang/settings.json` `locales`, the generated runtime's `locales`, and the catalog filenames all equal the same set (`en, es, pt-PT, fr, de, ja, ko, zh-CN, ru`) — guards against the triple-source drift (D8).
- [x] 8.5 Add a switch-propagation test: a `watchSettings` callback reloads only on a `language` delta and applies a non-language change (e.g. `density`) live without reload.

## 9. Docs

- [x] 9.1 Update `docs/tech-stack.md`: add `@inlang/paraglide-js` to the pinned stack with rationale.
- [x] 9.2 Update `docs/architecture.md`: document `shared/paraglide` placement, the SW-safe `custom-lunmaSettings` strategy + `i18n.ts` resolver, and native `_locales` manifest localization.

## 10. Verify

- [x] 10.1 Run `pnpm --filter @lunma/extension verify` (tsc, biome incl. DAG + cycles, svelte-check, stylelint, vitest) — all green.
- [~] 10.2 `pnpm --filter @lunma/extension build` ✓ (succeeds; `dist/manifest.json` carries `default_locale: "en"` + all four `__MSG_*__` placeholders with `name`/`short_name` literal, and `dist/_locales/{en,es,pt_PT,fr,de,ja,ko,zh_CN,ru}/messages.json` are copied through). REMAINING (manual, needs a real Chrome): load `dist/` unpacked and confirm the Options Language picker renders, selecting a locale persists + reloads surfaces, and `action.default_title` localizes under a non-`en` `--lang` (e.g. `de`).
- [x] 10.3 Run `openspec validate add-i18n-foundation` (✓ valid) and (optionally) the `spec-reviewer` agent before applying.
