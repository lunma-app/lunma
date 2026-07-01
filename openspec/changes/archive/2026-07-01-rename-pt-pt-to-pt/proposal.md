## Why

The language picker offers "Português" under the region-specific code `pt-PT`, and
the locale resolver maps every Portuguese browser — European (`pt`, `pt-PT`) and
Brazilian (`pt-BR`) — onto that Portugal-tagged locale. A Brazilian user selecting
Portuguese is silently handed a *Portugal*-coded locale. This change makes the
Portuguese locale region-neutral (`pt`), so the picker and the resolved/persisted
locale code read as plain "Portuguese" for every Portuguese browser. It is a
direct, user-visible correctness improvement to the Options language surface — not
plumbing.

Functionally `pt-BR` already falls back to the single Portuguese catalog today (via
the base-tag map), so no user loses coverage; only the locale's *code* and identity
become region-neutral. The catalog content stays as authored (European Portuguese),
now labelled generically.

## What Changes

- Rename the supported UI locale `pt-PT` → `pt` across its single source
  (`project.inlang/settings.json` `locales`) — `SupportedLocale` re-derives
  automatically.
- Rename the Paraglide catalog `apps/extension/messages/pt-PT.json` →
  `messages/pt.json` (content unchanged) and regenerate the committed Paraglide
  runtime (`pnpm gen:i18n`).
- Rename the native manifest catalog dir
  `apps/extension/public/_locales/pt_PT/` → `public/_locales/pt/` (Chrome
  underscore-code convention: `pt_PT` → `pt`).
- `src/shared/i18n.ts`: `BASE_TAG_TO_LOCALE` `pt: 'pt-PT'` → `pt: 'pt'` (+ the
  two comments naming `pt → pt-PT`). Resolution: `pt`, `pt-PT`, and `pt-BR`
  browsers all resolve to `pt`.
- `src/shared/settings.ts`: the language picker option `{ value: 'pt-PT', label:
  'Português' }` → `{ value: 'pt', label: 'Português' }` (label unchanged).
- Tests updated to the new code: `src/i18n-locale-set.test.ts` (EXPECTED set),
  `src/shared/i18n.test.ts` (`pt-BR → pt`), `src/i18n-parity.test.ts` (the
  `pt_PT` underscore-code comment).
- A previously-stored `language: 'pt-PT'` value is no longer a valid enum member;
  the existing `z.enum([...]).catch('auto')` gracefully coerces it to `'auto'`,
  which re-resolves to `pt` for a Portuguese browser. No store schema-version bump
  (the `language` setting lives in `chrome.storage.sync`, not the versioned
  AppState). Covered in design.md.

No **BREAKING** API surface: `SupportedLocale` is a derived union; the only value
changing is one string member.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `i18n`: the fixed supported-locale set changes `pt-PT` → `pt`; the resolver
  scenarios change (`pt → pt-PT` becomes `pt → pt`; the `pt-BR → pt-PT` nearest-match
  scenario becomes `pt-BR → pt`); the native-manifest `_locales` underscore-code note
  changes `pt_PT` → `pt`.
- `settings`: the `language`-preference option list changes its Portuguese entry
  from `pt-PT` "Português" to `pt` "Português".

## Impact

- **Code**: `apps/extension/project.inlang/settings.json`,
  `apps/extension/src/shared/i18n.ts`, `apps/extension/src/shared/settings.ts`,
  and the regenerated `apps/extension/src/shared/paraglide/` runtime.
- **Assets (renames)**: `apps/extension/messages/pt-PT.json` → `messages/pt.json`;
  `apps/extension/public/_locales/pt_PT/` → `public/_locales/pt/`.
- **Tests**: `apps/extension/src/i18n-locale-set.test.ts`,
  `apps/extension/src/shared/i18n.test.ts`,
  `apps/extension/src/i18n-parity.test.ts`.
- **Docs updated in this change**: `docs/architecture.md` (the `pt-BR → pt-PT`
  resolution example and the `pt_PT` `_locales`-code example).
  **Docs left untouched**: `docs/tech-stack.md` (describes the i18n mechanism
  generically; names no specific locale).
- **No new public type, file, method, or field.** No new `src/ui` primitive (no
  new user-visible surface or feature component — only an existing picker option's
  value string changes).
- **Persisted data**: users who had explicitly selected Portuguese fall back to
  `'auto'` on next read (graceful, via the existing `.catch('auto')`); their UI
  stays Portuguese if their browser is Portuguese.
