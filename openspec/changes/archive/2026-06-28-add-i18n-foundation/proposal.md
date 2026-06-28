## Why

Lunma is English-only: every UI string is hardcoded and the Chrome Web Store listing
is English-only, so non-English users can neither discover nor comfortably use the
extension. This change lays the **smallest i18n plumbing** needed to make the product
localizable, and delivers one immediately user-visible slice on top of it: a **language
picker in Options** and a **localized store listing** (manifest), so a user can already
pick their language and the install page already speaks it.

This is a foundation change (shape (b) of the user-value policy). Its named downstream
consumer is **`localize-extension-ui`** — the change that migrates the ~124 hardcoded
sidebar/launcher/options strings onto the message catalog this change establishes. A
third change, `localize-marketing-site`, consumes the same library choice for `apps/site`
(a separate inlang project). Neither downstream change is stranded: the picker, the
`_locales` manifest, and the locale resolver shipped here are all exercised by code in
this change.

Target locales: **`en`** (base) + `es`, `pt-PT`, `fr`, `de`, `ja`, `ko`, `zh-CN`, `ru`.

## What Changes

- **New pinned dependency:** add `@inlang/paraglide-js` (v2.x, compiler-based i18n) as a
  workspace devDependency via `catalog:`. This is a stack change → `docs/tech-stack.md`
  is updated in the same change.
- **inlang project (extension):** `apps/extension/project.inlang/settings.json` +
  `apps/extension/messages/{locale}.json` (9 files; `en.json` is source of truth, the
  other 8 seeded as English copies — real translations land in `localize-extension-ui`).
- **Generated runtime:** Paraglide compiles to `apps/extension/src/shared/paraglide/`
  (committed, like `src/ui/icon-loaders.generated.ts`); a `gen:i18n` script prepended to
  `dev`/`build`. The generated dir is excluded from Biome.
- **SW-safe locale resolver:** new `apps/extension/src/shared/i18n.ts` — a custom
  Paraglide client strategy (`custom-lunmaSettings`) backed by the Settings store, plus
  `initLocale()` / `applyLocaleFromSettings()`. Strategy array is
  `['custom-lunmaSettings','baseLocale']` only — the default `url`/`cookie`/`localStorage`
  strategies touch `window`/`document` and would throw in the service worker.
- **Settings:** new `language` field (`SupportedLocale | 'auto'`, default `'auto'` =
  resolve from browser locale on first run) in `src/shared/settings.ts`, with a derived
  Zod enum that tolerates stale values.
- **Language picker:** a new enum setting rendered through the **existing** Options
  `Select` control (10 options → no new primitive needed). Switching persists the locale
  and reloads open surfaces.
- **Manifest localization (native `chrome.i18n`):** `public/manifest.json` gains
  `default_locale: "en"` and `__MSG_*__` placeholders; `public/_locales/{locale}/
  messages.json` for all 9. Localized: `description`, `action.default_title`, the two
  `commands.*.description`. Brand `name`/`short_name` ("Lunma") stay untranslated.
- **Parity test:** `src/i18n-parity.test.ts` asserts every locale (Paraglide messages and
  `_locales`) has the same key set as `en` with no empty values.

## Capabilities

### New Capabilities
- `i18n`: how Lunma resolves, persists, and applies a UI locale across all extension
  surfaces; the message-catalog + generated-runtime contract; the SW-safe locale
  strategy; the user-facing language preference; and native manifest/store-listing
  localization. (Does not itself migrate existing strings — that is the downstream
  `localize-extension-ui` change.)

### Modified Capabilities
- `settings`: adds a `language` preference (new enum setting, default `auto`) to the
  settings schema and Options surface — a spec-level addition to the settings contract.

## Impact

- **New dependency:** `@inlang/paraglide-js` (devDependency, `catalog:` pinned).
- **New files:** `apps/extension/project.inlang/settings.json`,
  `apps/extension/messages/{en,es,pt-PT,fr,de,ja,ko,zh-CN,ru}.json`,
  `apps/extension/src/shared/i18n.ts`, `apps/extension/src/shared/paraglide/**`
  (generated, committed), `apps/extension/public/_locales/{locale}/messages.json` (×9),
  `apps/extension/src/i18n-parity.test.ts`.
- **Modified files:** `apps/extension/vite.config.ts` (Paraglide plugin + `gen:i18n`),
  `apps/extension/package.json` (dep + scripts), `pnpm-workspace.yaml` (catalog),
  `apps/extension/public/manifest.json` (`default_locale` + `__MSG_*__`),
  `apps/extension/src/shared/settings.ts` (`language` field + declaration), the Options
  surface (wire the picker + the `watchSettings` reload path), `biome.json` (exclude
  generated dir).
- **New public types/files (normative — additions beyond this list are deviations):**
  `SupportedLocale` (type, `settings.ts`), `initLocale()`, `applyLocaleFromSettings()`,
  `getLocale`/`setLocale` re-exports (`i18n.ts`), the `language` setting key, the
  `custom-lunmaSettings` strategy name.
- **UI primitives:** composes the existing Options `Select` control + `SettingsCard`
  path; **no new primitive** is added. (If a richer language picker is wanted later, it
  is a separate change that names its consumer.)
- **Docs updated in this change:** `docs/tech-stack.md` (add Paraglide to the pinned
  stack), `docs/architecture.md` (document `shared/paraglide` placement, the SW-safe
  custom strategy, and `_locales`). **Left untouched:** all other `docs/`.
- **Quality gates:** `pnpm verify` stays green (tsc, biome incl. DAG, svelte-check,
  stylelint, vitest); Paraglide runtime placed in `shared/` keeps the import DAG legal.
