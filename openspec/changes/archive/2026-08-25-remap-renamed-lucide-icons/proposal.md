## Why

A user who picked Smile, Frown, Smile-Plus, Podcast, or History as their Space or
folder icon keeps that icon. Lucide 1.31.0 renamed all five (`@lucide/svelte`
ships the rename map in `dist/aliases/aliases.js`), and Lunma persists the icon as
a bare string that `Icon.svelte` resolves through a generated allowlist — an
unmatched name renders **nothing** and logs a console warning. Taking the
`@lucide/svelte` 1.23.0 → 1.31.0 bump without a remap therefore silently blanks
those icons in the sidebar, the Space switcher, and the icon picker for anyone who
chose one. The bump itself is not optional: it arrives inside the grouped
Dependabot update that also carries Vite, Svelte, Biome, Playwright, and
`@sveltejs/kit` security-and-maintenance releases.

## What Changes

- Replace the five removed names in the curated `ICON_NAMES` list with their
  lucide-declared successors:
  `frown → face-slightly-frowning`, `smile → face-slightly-smiling`,
  `smile-plus → face-slightly-smiling-plus`, `podcast → mic-signal`,
  `history → rotate-ccw-clock`. The list stays the same length; no icon is
  dropped from the picker.
- Point the sidebar's "Reset name" context-menu item at `rotate-ccw-clock`
  (`apps/extension/src/sidebar/PinnedTabs.svelte`).
- Regenerate `apps/extension/src/ui/icon-loaders.generated.ts` via `pnpm gen:icons`.
- Add schema migration **v18**: rewrite the five legacy names wherever an icon is
  persisted — `state.spaces[].icon` and every `kind: 'folder'` node in
  `state.pinnedBySpace`. `CURRENT_SCHEMA_VERSION` goes 17 → 18.
- Bump `@lucide/svelte` to `1.31.0` in `apps/extension/package.json`.

No **BREAKING** change: the remap is forward-only and idempotent, and an icon
Lunma cannot recognise was already tolerated (blank render, warning).

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `storage-and-migrations`: adds the v18 chain entry and raises
  `CURRENT_SCHEMA_VERSION` to 18, with the v18 entry specified as a real
  transformation (not an identity pass-through). The same delta repairs the
  spec's stale account of v17 (`persist-lens-article-layout` archived its
  requirement describing itself as version 15, and the envelope requirement was
  never advanced past 16) so the documented chain matches
  `apps/extension/src/shared/migrations.ts`.

`spaces-and-tabs` is deliberately NOT modified: its `Space identity and storage`
requirement binds `icon` to "a member of `IconName` … from
`apps/extension/src/shared/icon-names.ts`" without enumerating the names, so the
requirement text stays true as the union's members change.

## Impact

**Code**

- `apps/extension/src/shared/icon-names.ts` — five entries renamed.
- `apps/extension/src/shared/schemas.ts` — `CURRENT_SCHEMA_VERSION` 17 → 18.
- `apps/extension/src/shared/migrations.ts` — new `{ toVersion: 18 }` entry plus
  one new module-private helper, `RENAMED_ICONS` (a
  `Record<string, string>` legacy→current map). No new exported symbol.
- `apps/extension/src/sidebar/PinnedTabs.svelte` — one icon literal.
- `apps/extension/src/ui/icon-loaders.generated.ts` — regenerated.
- `apps/extension/package.json`, `apps/site/package.json`, `package.json`,
  `pnpm-workspace.yaml` (the shared `catalog:` block), `pnpm-lock.yaml` — the
  grouped bump: `@lucide/svelte` 1.31.0 plus Biome 2.5.8, Vite 8.2.1,
  Svelte 5.56.8, `@sveltejs/kit` 2.70.2, `@sveltejs/vite-plugin-svelte` 7.3.0,
  `svelte-check` 4.7.5, `@inlang/paraglide-js` 2.23.2, Playwright 1.62.1,
  `@types/chrome` 0.2.5, shiki 4.4.3, stylelint 17.14.1, simple-icons 16.28.0.
- `apps/extension/src/shared/messages.ts`, `backup.ts`, `chrome/storage.ts` —
  repointed from `AppStateV17Schema`/`AppStateV17` to the V18 aliases so
  "current-version schema" keeps one name. Behaviourally inert (V18 *is* V17).
- `apps/extension/src/background/coordinator.home-tab.test.ts` and
  `apps/extension/src/sidebar/PinnedTabs.svelte` (the `swap` helper's type
  parameter) — reformatted by Biome 2.5.8, which changed how it wraps
  `test.each` and now requires the disambiguating `<T,>` in `.svelte`. Formatting
  only; carried here because the Biome bump ships in the same group.

**Tests**

- `apps/extension/src/shared/migrations.test.ts` — v18 remap coverage
  (Space icons, folder-node icons, idempotency, unknown names left alone).
- `apps/extension/src/ui/icon-loaders.generated.test.ts` — passes unchanged; it is
  the guard that caught this.

**Docs**

- Updates: none. The five names appear in no `docs/` file, and
  `docs/tech-stack.md` pins `@lucide/svelte` by major line only.
- Left untouched: `docs/architecture.md`, `docs/tech-stack.md`.

**UI primitives**

- Composes existing: `Icon` (`apps/extension/src/ui/Icon.svelte`) — unchanged.
- New primitives: none. No `src/ui/*.svelte` file changes, so no catalog story is
  added or updated.
