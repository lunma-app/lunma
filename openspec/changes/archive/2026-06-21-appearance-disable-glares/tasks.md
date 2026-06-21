## 1. Settings declaration

- [x] 1.1 Add `showGlares` toggle to `SETTINGS` in `apps/extension/src/shared/settings.ts` (`type: 'toggle'`, `group: 'Appearance'`, `label: 'Background effects'`, `default: true`)
- [x] 1.2 Verify `Settings` interface gains `showGlares: boolean` and `DEFAULTS.showGlares === true` via the derived schema (no manual additions needed)

## 2. Token suppression block

> **Deviation (agreed):** The design planned a single `[data-show-glares="false"]` block in `packages/tokens/tokens.css`. This won't work — `.sidebar`, `.home`, and `.page` each redeclare `--glow-space`/`--glow-hearth` at their own scope, and their CSS files load after `tokens.css`, overriding any generic attribute selector in tokens.css. The suppression instead lives in each surface's CSS file (tasks 3.1–3.3). No `tokens.css` change is made.

- [x] 2.1 ~~Add a `[data-show-glares="false"]` override block in `packages/tokens/tokens.css`~~ — moved into surface CSS files (see 3.1–3.3)

## 3. Surface wiring

- [x] 3.1 Sidebar: create `show-glares-state.svelte.ts` (module-level `$state`); `main.ts` seeds + watches it via `applyShowGlares`; `App.svelte` gates Aurora with `{#if sidebarGlares.value}`; `app.css` suppresses glow tokens at `.sidebar[data-show-glares="false"]`
- [x] 3.2 New-tab launcher (`apps/extension/src/launcher/newtab/`): `main.ts` calls `applyShowGlares` to set `data-show-glares` on `.home`; `newtab.css` hides `.aurora` and `.hearth`, and suppresses glow tokens at `.home[data-show-glares="false"]`
- [x] 3.3 Options (`apps/extension/src/options/Options.svelte`): Aurora gated with `{#if settings.showGlares}`; `data-show-glares` bound as attribute on `.page`; CSS suppresses glow tokens at `.page[data-show-glares="false"]`

## 4. Options page preview

- [x] 4.1 The live appearance preview reflects `showGlares` automatically — Aurora is gated by `{#if settings.showGlares}` and glow is suppressed by the `.page[data-show-glares="false"]` CSS rule, both driven by the same reactive `settings` object that the controls write to

## 5. Verification

- [x] 5.1 Run `pnpm verify` at workspace root — `tsc`, `biome check`, `svelte-check`, `stylelint`, and `vitest` all pass
- [x] 5.2 Manually confirm: toggling "Background effects" Off in options removes aurora and glow from the sidebar and launcher live (no reload), and toggling back On restores them
