## 1. Foundations: entity model, derived kind, bus payload

- [x] 1.1 Add `LensEntity = 'change' | 'article' | 'generic'` and `entityForSource(provider): LensEntity` (github/gitlab→change, rss→article, else→generic) in a DAG-safe `shared/` module (sibling of `shared/connector-origins.ts`), importable by both `sidebar` and `launcher`; unit-test the mapping.
- [x] 1.2 Add a `deriveLensKind(sources, getAccount): LensKind` helper (any github/gitlab source ⇒ `'review'`, else `'general'`) in `shared/`; unit-test git, feed-only, and mixed source sets.
- [x] 1.3 `shared/bus.ts`: remove `lensKind` from the `createLens` and `updateLens` payload schemas (discriminated union); update the exported payload types. Update `bus.test.ts`.
- [x] 1.4 `background/handlers/lenses.ts`: derive and stamp `lensKind` via `deriveLensKind` on create/update instead of reading it from the payload (the handler already accepts a mixed source set — the git-only restriction lived in the editor's kind picker, removed in 4.1). Update `coordinator.lenses.test.ts`.
- [x] 1.5 Confirm git Change-enrichment still gates on `cfg.lensKind` per resolved section (no connector change needed — a git source now always derives `review`); add/adjust a coordinator test for a mixed lens (git enriched, rss/jira not).
- [x] 1.6 On SW boot, run a one-time pass that re-derives `lensKind` for every existing lens node via `deriveLensKind` and persists any change, so a pre-existing `general`+git lens becomes `review` and renders enriched Changes without an edit (design D9). Add a store/coordinator test asserting the flip.

## 2. Overview page (entity-merged)

- [x] 2.1 `launcher/lenspage/OverviewPage.svelte` (new feature component): take `resolvedConfigs(node)`, bucket sections by `entityForSource`, render entity sections in order Changes → Articles → Generic, each as a collapsible `Surface variant="glass"` card; show the lens-level attention sum in the header.
- [x] 2.2 `launcher/lenspage/LensPage.svelte`: stop branching on `node.lensKind`; always render `OverviewPage`.
- [x] 2.3 Changes section: reuse `ReviewQueue`/`ChangeRow` rendering (lanes, CI light, `ReviewerRail`, `Diffstat`, age warming) over the change bucket; render the source+repo filter toolbar only when the change bucket spans >1 source (`LensFilterBar`).
- [x] 2.4 Articles section: reuse `GeneralLens` feed rendering + `LensPageItem` over the article bucket; add page-local feed-filter chips, a Grid/List `SegmentedControl`, and an unread toggle (with count); list rows lead unread items with an accent dot. (Per the agreed D6 split, Articles is a dedicated `ArticlesSection.svelte` reusing `LensPageItem`.)
- [x] 2.5 Generic section: render remaining queue sections (e.g. jira) as the existing per-source glass panels.
- [x] 2.6 Preserve per-section calm states (pending/error/signed-out/needs-access) and `openLensItem` activation in every entity section.
- [x] 2.7 Tests: `OverviewPage.test.ts` — mixed lens renders Changes above Articles; pure-feed lens shows only Articles; pure-review lens renders the queue identically to today; filters/toggles are page-local. Update `LensPage.test.ts`, `ReviewQueue.test.ts`.

## 3. Options: one Connections manager

- [x] 3.1 `options/ConnectionsCard.svelte` (new): one `SettingsCard heading="Connections" id="connectors"` with an **Accounts** group (account rows: `AccountChip` glyph, name, status pip, "powers …" reach, `RowMenu` → replace/add token, rename, disconnect) and a **Feeds** group (feed rows: glyph, name, URL · reach, `RowMenu` → rename, copy URL, remove). Reach reads `pinnedBySpace[*]`.
- [x] 3.2 Build `ui/ServiceConnectPicker.svelte` (new shared `ui/` primitive — design D2/D10): Service `Select` (GitHub/GitLab/Jira/RSS feed) → provider-appropriate fields (host + method-aware token field for accounts; feed-URL for rss); commit via `createAccount` + optional off-bus `setAccountToken`. RSS branch offers OPML import. Add `ServiceConnectPicker.test.ts` + harness. (Token is a method-aware password `TextInput` + the single Connect commit, not the standalone `AccountConnectField` — see design D2.)
- [x] 3.3 Re-home OPML: move the `parseOpml` → `importOpml` confirm flow (copy + toasts) into the picker's RSS branch; place Export OPML as a Feeds-group header utility keyed on a referenced rss account (`buildOpml`).
- [x] 3.4 Wire feed Rename/Remove to the existing `renameAccount`/`deleteAccount`; warn before disconnect/remove when reach > 0.
- [x] 3.5 `options/Options.svelte`: compose `ConnectionsCard` in place of `ConnectorsCard` + `FeedSubscriptions`; delete `ConnectorsCard.svelte`/`FeedSubscriptions.svelte` and their tests; add `ConnectionsCard.test.ts` (groups render, picker mints, per-feed menus, reach, warn-on-disconnect, OPML import/export).

## 4. Sidebar: connection-first editor

- [x] 4.1 `sidebar/LensEditor.svelte`: remove the Kind `SegmentedControl`; the connections picker lists ALL sources (no provider filtering); show per-account filter chips when included; feeds always available.
- [x] 4.2 Add the derived "this lens will show …" entity preview (entity-coloured chips from `entityForSource`).
- [x] 4.3 Replace the inline connect/add-feed beats with the shared `ui/ServiceConnectPicker.svelte` (3.2); a minted source returns pre-selected.
- [x] 4.4 On Create, dispatch `createLens`/`updateLens` without `lensKind`, then open the lens overview page. (Create client-mints the lens id — optional `createLens.id`, mirroring `createAccount` — then dispatches `openLensPage`; see design D4 / typed-message-bus.)
- [x] 4.5 Update `LensEditor.test.ts` (no kind picker; connection-first assembly; derived preview; no `lensKind` on the dispatched payload; Create opens overview). Keep validation rules (≥1 source, queue account needs ≥1 filter).
- [x] 4.6 OPML-in-editor adds feeds INTO the lens (bugfix — the editor's picker was spawning a standalone "Feeds" lens via `importOpml`). Give `ServiceConnectPicker` an `onImportFeeds` mode that the editor passes (no `spaces`); the editor find-or-mints an rss account per feed (deduped by normalized base URL) and pre-selects them — no `importOpml`. Lift `normalizeBaseUrl` to `shared/account-ui` (re-exported from `background/lenses`) so the editor and SW normalize identically. Tests: `ServiceConnectPicker.test.ts` (editor-mode confirm) + `LensEditor.test.ts` (OPML fills the lens, no standalone lens).

## 5. Visual pass (tokens only)

- [x] 5.1 Style all three surfaces from `@lunma/tokens` recipes to match the design (frosted cards, entity dots, chips, status pips, motion 150–250ms); no raw font-size/z-index/colour values (`pnpm lint:styles` clean).
- [x] 5.2 Verify reduced-motion collapses every transition to instant and WCAG-AA holds at each Colour intensity for the new/changed surfaces. (Every animated surface — OverviewPage entity rise/chevron, LensEditor connect-flow/account-pick — carries a `prefers-reduced-motion: reduce` guard; ArticlesSection's grid↔list swap is instant; all colour comes from the token ramp + `--info`/`--success`/`--space-c`, AA-safe at each tint by construction.)

## 6. Docs, quality gate, smoke

- [x] 6.1 Update `docs/lenses-vision.md` (connection-first lens model; `lensKind` derived from connections; entity-merged overview) and `docs/architecture.md` (one Connections manager on the options surface; lens page renders by canonical entity). Leave `docs/tech-stack.md` untouched.
- [x] 6.2 `pnpm verify` green at the workspace root (tsc, biome incl. layer DAG, svelte-check, lint:styles, vitest). — root `pnpm verify` exit 0 (extension 2394 tests + site + tokens).
- [x] 6.3 Update Playwright e2e touching the editor/options/lens page (`e2e/lens-bindings.spec.ts`, `e2e/lens-page.spec.ts`) for connection-first creation + the entity-merged overview; `pnpm test:e2e` green. — `lens-page.spec.ts` updated for the entity-merged overview (overview-entity/change-row); `lens-bindings.spec.ts` needed no change (raw bus + sidebar tree, unchanged by D7); full e2e suite 17 passed / 1 skipped.
- [x] 6.4 `openspec validate sources-redesign --strict` clean; confirm no artifact/doc/code drift remains. — validate clean; proposal/design/specs/tasks + docs updated in lockstep with the agreed deviations (D6 ArticlesSection, D2 token field, D4 client-minted createLens id).
