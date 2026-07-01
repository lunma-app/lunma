## Context

Lunma's i18n stack (Paraglide v2, added by `add-i18n-foundation`) single-sources the
supported-locale set from `apps/extension/project.inlang/settings.json`; the compiled
`locales` constant drives `SupportedLocale`, and every catalog/`_locales` dir keys off
those codes. The Portuguese entry is currently the region-specific `pt-PT`. The base-tag
resolver (`BASE_TAG_TO_LOCALE` in `src/shared/i18n.ts`) already folds `pt-BR` onto
`pt-PT`, so Brazilian browsers get the one Portuguese catalog — but the code, the picker
option value, and the persisted setting all carry the Portugal region tag.

This change renames that locale to the region-neutral `pt`. It is a pure rename +
resolver-target change: no new catalog, no translation work, no new surface.

## Goals / Non-Goals

**Goals:**
- The supported Portuguese locale is `pt` (region-neutral), single-sourced as always.
- `pt`, `pt-PT`, and `pt-BR` browsers all resolve to `pt`.
- The Options language picker offers `pt` "Português" (label unchanged).
- Graceful handling of a stored `'pt-PT'` preference from before the change.
- `pnpm verify` green: locale-set/parity/resolver tests updated to the new code.

**Non-Goals:**
- No separate Brazilian Portuguese (`pt-BR`) catalog — one Portuguese for everyone.
- No re-translation of the catalog content (stays as authored, European Portuguese).
- No change to any other locale, to the resolver's architecture, or to the
  message-rendering split.
- No visual/UX redesign — only one existing picker option's *value* string changes;
  its label, position, and the surface itself are untouched (hence no `Visual
  language` section: this change ships no new user-visible surface).

## Decisions

### D1 — Rename `pt-PT` → `pt` at the single source; let derivation cascade

Change the one string in `project.inlang/settings.json` `locales`; `SupportedLocale`
re-derives, `settings.ts`'s picker enum re-derives its type, and `pnpm gen:i18n`
regenerates the Paraglide runtime's `locales`/`m` for the new code. Catalog and
`_locales` directory are renamed on disk to match (`messages/pt.json`,
`public/_locales/pt/`). *Alternative — add `pt` alongside `pt-PT`:* rejected; that
keeps two Portuguese locales, the opposite of the intent, and would need a second
catalog.

### D2 — Resolver: fold every Portuguese variant onto `pt`

`BASE_TAG_TO_LOCALE.pt` becomes `'pt'`. `matchSupportedLocale` then resolves:
`pt` → exact-match `pt`; `pt-PT`/`pt-BR` → no exact match → base `pt` → `pt`. So all
three converge on `pt` with no special-casing. *Alternative — an explicit `pt-br`/`pt-pt`
alias map:* unnecessary; the existing base-tag fallback already covers it once the base
maps to `pt`.

### D3 — Stored-preference migration: rely on the existing `.catch('auto')`

The `language` setting's Zod is `z.enum([...]).catch('auto')`. After the rename,
`'pt-PT'` is out of range, so a user who explicitly picked Portuguese before the change
reads back as `'auto'` — which the resolver maps to `pt` for a Portuguese browser. This
is lossless for the common case (Portuguese browser) and degrades to "System" otherwise.
No AppState schema-version bump: `language` lives in `chrome.storage.sync`, separate from
the versioned store. *Alternative — a one-shot `'pt-PT' → 'pt'` rewrite on read:* rejected
as over-engineering; `.catch('auto')` already yields the right visible result and adds no
migration surface.

## Risks / Trade-offs

- **A user who had explicitly chosen Portuguese silently reverts to "System".** → For a
  Portuguese-locale browser the rendered language is unchanged (`auto` → `pt`). Only a
  Portuguese-content user on a non-Portuguese *browser* would see the picker read
  "System" instead of "Português" and could re-select it. Acceptable given how few
  users exist pre-launch and how minor the effect; documented in the settings spec
  scenario.
- **Stale on-disk artifacts after the rename** (old `messages/pt-PT.json` /
  `_locales/pt_PT/` lingering) → the parity + locale-set tests key off the `locales`
  set, so a leftover file with the old code is either ignored or flagged; the tasks
  include deleting the old paths, and `pnpm verify` gates it.
- **Regenerated Paraglide runtime not committed** → `pnpm gen:i18n` is prepended to
  build, but the runtime is committed; tasks run it explicitly and the diff must include
  `src/shared/paraglide/`. `tsc` fails if `m`/`locales` drift from the catalogs.

## Migration Plan

1. Rename the source locale code and the two on-disk asset paths.
2. Update `i18n.ts`, `settings.ts` option, and the three tests.
3. `pnpm gen:i18n` → commit the regenerated runtime.
4. Update `docs/architecture.md`.
5. `pnpm --filter @lunma/extension verify`.

Rollback: revert the change; a stored `'pt'` would then `.catch('auto')` back to a
Portuguese-browser default — symmetric and lossless for the common case.
