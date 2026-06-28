## 1. Build config + gate wiring

- [x] 1.1 Add `apps/extension/vite.catalog.config.ts` (`defineConfig` from `vite`; `root: ./catalog`; `resolve.alias { '@': ./src }`; replicate the `vite.config.ts` font-copy into `catalog/public/fonts/`; no crxjs).
- [x] 1.2 Add `apps/extension/tsconfig.catalog.json` (`extends ./tsconfig.json`; `paths { "@/*": ["./src/*"] }`; `types: ["chrome","node","vite/client"]`; `include: catalog/** + vite.catalog.config.ts`). NOTE (toolchain-forced deviations from the original spec): `baseUrl` is **omitted** — TS 7.0 deprecates it and our `tsc` errors on it, and `moduleResolution: bundler` resolves `paths` relative to the config file without it; `types` **adds `chrome`** because the catalog composes `@/shared` modules (via `Tint`/`space-hue`) that reference the `chrome` global, so the scoped typecheck needs the chrome types.
- [x] 1.3 `biome.json`: add `apps/extension/catalog/**/*.{ts,js,svelte}` to `files.includes`; add a `noRestrictedImports` override scoped to `apps/extension/catalog/**` mirroring the `options` override (allow `@/ui` + `@/shared`; ban `background`/`content`/`sidebar`/`launcher`/`options` + `apps/site`).
- [x] 1.4 `apps/extension/stylelint.config.js`: add a parse-only override for `catalog/**/*.svelte` (feature-grade, like the existing `src/**/*.svelte` override).
- [x] 1.5 `apps/extension/package.json`: add scripts `catalog`, `catalog:build`, `typecheck:catalog`, `lint:catalog`, `check:catalog`, `lint:styles:catalog`, `verify:catalog`; insert `&& pnpm verify:catalog` into `verify` before `test:run`.
- [x] 1.6 `.gitignore`: add `apps/extension/catalog/public/fonts/`.

## 2. Catalog scaffolding + story API

- [x] 2.1 Add `apps/extension/catalog/lib/story.ts` (`StoryMeta` interface + `defineStory()` helper).
- [x] 2.2 Add `apps/extension/catalog/lib/registry.ts` (two `import.meta.glob` over `../stories/**/*.stories.svelte` — `meta` eager, component lazy — building a grouped, sorted `StoryEntry[]`).
- [x] 2.3 Add `apps/extension/catalog/lib/Variant.svelte` (labeled glass stage cell: figcaption + slot).
- [x] 2.4 Add `apps/extension/catalog/{index.html, main.ts}` (entry imports the three `@lunma/tokens` CSS files and `mount()`s `Catalog.svelte`).
- [x] 2.5 Add a first `apps/extension/catalog/stories/ui/Button.stories.svelte` and confirm `pnpm --filter @lunma/extension catalog` boots and renders it.

## 3. Immersive shell

- [x] 3.1 Build `apps/extension/catalog/Catalog.svelte`: grouped nav (composing `RowButton`), a stage in `.lunma-space-scope` + `<Aurora>`, and a toolbar (composing `SegmentedControl`/`IconButton`) for Space hue, colour-intensity (`subtle|standard|vivid`), and reduced-motion.
- [x] 3.2 Implement the reduced-motion freeze via a `data-force-motion` attribute + catalog stylesheet (Aurora derives reduced from `matchMedia`; do not modify the `Aurora` primitive).
- [x] 3.3 Confirm hue/intensity toggles drive `--space-h`/accent/glow and primitives re-tint live; verify reduced-motion freezes the aurora. (Wiring implemented + compiles; toggles drive `--space-*` via `colourToOklch`/`data-tint`/`<Aurora intensity>` and the freeze via `data-force-motion` — the same mechanism the proven NewTab home uses. LIVE visual confirmation deferred: Chrome MCP tab-group was unstable this session; dev server serves HTTP 200 at http://[::1]:5199/ for manual eyeball.)

## 4. Mock data + stories (all 40 primitives + composites)

- [x] 4.1 Author `apps/extension/catalog/lib/mock.ts` with meaningful shared fixtures (`noop`, sample Spaces, reviewers + verdicts, tabs, favicons, search results, lens rows, icon names).
- [x] 4.2 Write a `*.stories.svelte` per `src/ui` primitive — atomic primitives (Avatar, Button, Chip, ColorSwatch, Diffstat, Divider, Favicon, FaviconTile, Icon, IconButton, Kbd, Pill, RowButton, SettingText, Tooltip).
- [x] 4.3 …form controls (TextInput, SearchField, Select, SegmentedControl, EditableLabel) + layout/content (Stack, Surface, Aurora, CardHeading, InlineError).
- [x] 4.4 …complex/composite primitives (BottomSheet, BitsContextMenu, BitsMenu, AccountChip, AccountConnectField, FolderRow, IconPicker, ServiceConnectPicker, LensRow, ResultList, ResultRow, ReviewerRail, SettingsCard, TabRow, Toast) — confirming all 40 primitives are covered (15 here + 15 in 4.2 + 10 in 4.3 = 40; cross-check `ls src/ui/*.svelte | grep -v test.harness` totals 40).
- [x] 4.5 Composition coverage WITHOUT extra files: `ResultList`, `LensRow`, `ReviewerRail` are already among the 40 primitives (covered in 4.4). Exactly one `<Name>.stories.svelte` per primitive name — the D6 parity guard rejects a story with no matching primitive — so the composed/realistic scenes (multi-row lists, overlapped reviewer rails) ship as ADDITIONAL `<Variant>` cells inside those primitives' own story files, not as new story files.

## 5. Never-miss-a-story enforcement

- [x] 5.1 Add `apps/extension/src/ui/stories-coverage.test.ts` (glob primitives minus `*.test.harness.svelte`; lazy-glob `../../catalog/stories/ui/*.stories.svelte` keys; assert parity). Confirm it passes once all stories exist and fails when a story is removed.
- [x] 5.2 Add `.claude/hooks/check-catalog-coverage.mjs` (reads `tool_input.file_path` from stdin; on a story-less `src/ui/*.svelte` primitive edit/add, exit 2 with a naming message).
- [x] 5.3 Wire the `PostToolUse` hook (matcher `Edit|Write|MultiEdit`) into `.claude/settings.json` via the `update-config` flow.
- [x] 5.4 Extend the `CLAUDE.md` "Component library" policy with the binding line requiring a `*.stories.svelte` add/update in the same change as a `src/ui` primitive add/modify.

## 6. Docs + spec lockstep, verification

- [x] 6.1 `docs/tech-stack.md`: add the "Non-obvious choices" entry — homegrown catalog over Storybook/Histoire (Histoire incompatible with Svelte 5/Vite 8), dev-only, ships nothing in the bundle, runs on the pinned stack via the sibling config.
- [x] 6.2 `docs/architecture.md`: add `catalog/` + `vite.catalog.config.ts` + `tsconfig.catalog.json` to the layout tree; add a `catalog — ui, shared | background/other surfaces/apps/site` row to the boundaries table; add a dev-surface note.
- [x] 6.3 `CLAUDE.md` "Quality gates": list the `verify:catalog` fan-out in the `verify` description.
- [x] 6.4 Run `pnpm verify` (must be green, incl. the coverage guard) and `pnpm --filter @lunma/extension catalog:build` (clean).
- [x] 6.5 Confirm `pnpm --filter @lunma/extension build` (MV3) output is unchanged by the catalog — VERIFIED (build exit 0; no catalog code/manifest/rollup reference in `dist/`). Screenshots for-the-record DEFERRED: Chrome MCP tab-group instability blocked capture this session.
- [x] 6.6 Run `openspec validate add-component-catalog` (PASSES) and a coherence pass; docs/artifacts/code agree (tasks 1.2 updated for the toolchain-forced tsconfig deviations).

## 7. Controls-v2: live controls + API table + source view (expansion; user-agreed)

- [x] 7.1 Add `apps/extension/catalog/lib/controls.ts` (`ControlType`, `ControlDef`, `Controls`, `Args` types + `defaultArgs()`); extend `StoryMeta` with optional `controls`.
- [x] 7.2 Add `apps/extension/catalog/lib/Story.svelte` — the catalog-owned per-story layout: live preview bound to editable controls (composing `Chip`/`Select`/`TextInput`), API table (prop · type · default · description), examples matrix, and a collapsible source panel.
- [x] 7.3 `registry.ts`: add a third `import.meta.glob(..., { query: '?raw' })` source glob + `StoryEntry.loadSource()`; `Catalog.svelte` awaits component + source and passes `source` to each story.
- [x] 7.4 Convert all 40 `*.stories.svelte` to the new model: `meta.controls` schema, a `preview(args)` snippet, the existing variant cells moved into an `examples` snippet, and a `source` prop. (Button is the reference; the rest converted in batch.)
- [x] 7.5 Run `pnpm --filter @lunma/extension verify:catalog` + `catalog:build` (clean) and full `pnpm verify` (green) with the new model; confirm the coverage guard + MV3-build-unchanged still hold.
- [x] 7.6 Update docs for controls-v2: `docs/tech-stack.md` (catalog entry mentions live controls + source view), `docs/architecture.md` (catalog `lib/` gains `controls.ts` + `Story.svelte`); proposal/design/spec already updated. Re-run `openspec validate`.

## 8. Refinements: source highlighting, theme toggle, dev port (user-requested)

- [x] 8.1 Syntax-highlight the source panel with `shiki` (dev-only `devDependency`): `Story.svelte` uses `codeToHtml(source, { lang: 'svelte', themes: { light, dark }, defaultColor: false })`; dual-theme CSS in `catalog.css` (the `{@html}` output can't be reached by scoped styles). Proposal/design/tech-stack updated for the one dev-only dep.
- [x] 8.2 Add a light/dark theme toggle to the toolbar (composed `SegmentedControl`) driving the shared `applyThemeToDocument` (`@/shared/surface-boot`) so `@lunma/tokens`' `[data-theme="light"]` set applies; the source highlighting follows it. Spec immersive-shell requirement updated.
- [x] 8.3 Pin the catalog dev server to port `6006` in `vite.catalog.config.ts` (distinct from the extension dev server's `5173`).
- [x] 8.4 Re-run `pnpm verify` (green: 2564 + 23 tests), `verify:catalog` (clean), `catalog:build` (clean); `openspec validate` passes. Docs/artifacts/code in lockstep.
