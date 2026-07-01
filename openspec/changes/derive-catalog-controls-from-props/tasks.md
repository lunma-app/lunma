## 1. Derivation core (no story changes yet)

- [x] 1.1 Add `apps/extension/catalog/lib/derive-controls.ts`: extract each primitive's instance-script range via `svelte/compiler`'s `parse()`, parse it with the TypeScript compiler API, walk the `Props` interface's `PropertySignature` members and the `$props()` destructuring statement's default values. Export a pure `deriveControls(source: string): { controls: Controls; unclassified: string[] }` (or equivalent shape covering decision 2/4/5 in `design.md`).
- [x] 1.2 Add `apps/extension/catalog/lib/derive-controls.test.ts` (unit tests against small fixture source strings, not real `src/ui` files yet): boolean/number/string/string-literal-union classify correctly; `Snippet`/function/array/object/imported-type props land in `unclassified`; destructured defaults are read; JSDoc becomes `description`; type text becomes `typeLabel`; required-prop fallback defaults per decision 4.
- [x] 1.3 Run `pnpm --filter @lunma/extension vitest run derive-controls` and confirm the new unit tests pass in isolation.

## 2. StoryMeta wiring, registry merge, codegen

- [x] 2.1 `apps/extension/catalog/lib/story.ts`: add `excludeControls?: Record<string, string>` and `controlOverrides?: Partial<Controls>` to `StoryMeta`. Leave `controls` in place for now (removed in task 3.3) so migration can proceed incrementally.
- [x] 2.2 `apps/extension/vite.catalog.config.ts`: before `defineConfig`, glob-read every `apps/extension/src/ui/*.svelte` (excluding `*.test.*`), run `deriveControls()` per file, and write the result to a gitignored `apps/extension/catalog/lib/derived-controls.generated.ts` (mirrors the existing font-copy side effect in the same file).
- [x] 2.3 `.gitignore`: add `apps/extension/catalog/lib/derived-controls.generated.ts` alongside the existing `catalog/public/fonts/` entry.
- [x] 2.4 `apps/extension/catalog/lib/registry.ts`: for each story entry, merge `derived-controls.generated.ts`'s entry for that primitive with the story's `excludeControls` (remove) and `controlOverrides` (shallow-merge per prop) to produce the final `Controls` passed to `Story.svelte`. Fall back to `meta.controls` (task 3's old field) while it still exists, preferring the derived+override result once a story has migrated.
- [x] 2.5 Confirm `pnpm --filter @lunma/extension catalog` boots and `Button`'s live preview/API table now includes `type`, `title`, `testid` once `Button.stories.svelte` is migrated (task 3.1) — spot-check before migrating the rest.

## 3. Migrate existing stories

- [x] 3.1 Migrate `Button.stories.svelte` first (the reference case for this change — confirms `type`/`title`/`testid` now surface): replace `meta.controls` with `controlOverrides`/`excludeControls`, verify the live preview/API table in the dev server matches or improves on the prior hand-authored version.
- [x] 3.2 Migrate the remaining atomic/form primitives: AccountChip, AccountConnectField, Aurora, Avatar, Chip, ColorSwatch, Diffstat, EditableLabel, EntityBadge, Favicon, FaviconTile, Icon, IconButton, InlineError, Kbd, RowButton, SearchField, SegmentedControl, Select, SettingText, Surface, TextInput, Tooltip.
- [x] 3.3 Migrate the remaining composite/layout primitives: BottomSheet, CardHeading, FolderRow, IconPicker, LensRow, Menu, MultiSelect, ResultList, ResultRow, ReviewerRail, ServiceConnectPicker, SettingsCard, TabRow, Toast.
- [x] 3.4 Remove `StoryMeta.controls` from `apps/extension/catalog/lib/story.ts` and drop the now-dead fallback in `registry.ts` (task 2.4) once no story references it (`grep -rL controlOverrides apps/extension/catalog/stories/ui | xargs grep -l 'controls:'` returns nothing beyond `excludeControls`/`controlOverrides`).
- [x] 3.5 Update `apps/extension/catalog/lib/controls.ts`'s doc comment: it no longer describes a fully hand-authored schema — note that `Controls`/`ControlDef` are now the shape produced by derivation + overrides, not authored from scratch per story.

## 4. Drift guard

- [x] 4.1 Add `apps/extension/catalog/lib/derive-controls.test.ts`'s real-source assertions (extends task 1.2's fixture tests in the same file, or a second `describe` block): for every `apps/extension/src/ui/*.svelte` primitive (glob, excluding `*.test.*`), assert every `Props` member is in `deriveControls().controls` or the story's `excludeControls`; assert every `excludeControls`/`controlOverrides` key still names a real `Props` member.
- [x] 4.2 Confirm the guard is green against the fully migrated story set (task 3), then confirm it fails when a prop is intentionally added to a scratch primitive without updating its story (manual check, revert after).

## 5. Docs + spec lockstep, verification

- [x] 5.1 No `docs/tech-stack.md` or `docs/architecture.md` change expected (no new dependency, no DAG change) — confirm during review and add an entry only if implementation surfaces a deviation requiring one (per the deviation policy). Confirmed: no `package.json` diff, no new dependency; the two agreed deviations (vite.config.ts test.include, controlOverrides type) touch neither doc.
- [x] 5.2 Run `pnpm --filter @lunma/extension verify:catalog`, `pnpm --filter @lunma/extension catalog:build`, and full `pnpm verify` (green, including the new guard).
- [x] 5.3 Run `openspec validate derive-catalog-controls-from-props` and a coherence pass confirming code/artifacts agree. `openspec validate` reports "Change 'derive-catalog-controls-from-props' is valid". Coherence pass: proposal.md/design.md/specs/component-catalog/spec.md updated in-place for the two agreed implementation deviations (vite.config.ts test.include widening; controlOverrides typed as `Record<string, Partial<ControlDef>>` instead of `Partial<Controls>`) — code and artifacts agree.
