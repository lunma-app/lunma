## 1. Foundation — permission, setting, disclosure copy

- [x] 1.1 Add `webNavigation` to `optional_permissions` in `apps/extension/public/manifest.json`
- [x] 1.2 RED first: extend `OptionalApiPermission` to `'history' | 'bookmarks' | 'webNavigation'` in `apps/extension/src/shared/permissions.ts`, with a test asserting `requestApiPermission('webNavigation')` routes through the foundation module
- [x] 1.3 Add the `trackTabProvenance` toggle to `SETTINGS` (`shared/settings.ts`), `Tabs` group, default `false`; confirm the `AssertEqual<z.infer<typeof SettingsSchema>, Settings>` guard still holds
- [ ] 1.4 Add `effectiveProvenanceState()` to `shared/provenance.ts` — NOT `shared/permissions.ts`, which is specified as carrying no policy — and render the options toggle from it, not from the stored value. Do NOT add a permission-removal export anywhere
- [ ] 1.5 RED first: wire the toggle to request the permission inside the user gesture, writing `false` back on a declined grant — the stuck-on toggle is the bug this test exists to prevent
- [ ] 1.6 RED first: a synced `true` with no local grant renders the toggle off and raises no prompt on boot
- [x] 1.7 Add `options_label_trackTabProvenance`, a ONE-LINE `options_desc_trackTabProvenance` naming the browsing-history prompt and the page-readable marker, and `options_note_trackTabProvenance` — an inline note rendered beneath the toggle carrying the uninstall limit and the browsing-session bound. Do NOT overload `options_tabsGroupIntro`, which describes the whole group. Disclosure copy to `apps/extension/messages/en.json` — naming the "read your browsing history" prompt, the page-readable marker, the uninstall limit, and the browsing-session bound, and NOT claiming unconditionally that turning it off clears every marker — then authored translations for the eight non-base locales; confirm the catalog key-parity test passes

## 2. Token identity

- [ ] 2.1 RED first: `shared/provenance.ts` unit tests for `isRootTransition()` — `start_page`, `typed`, `auto_bookmark`, `generated`, `reload`, `keyword` are roots; both `start_page` and `auto_toplevel` spellings accepted; `link` is not a root
- [x] 2.2 Add `shared/provenance.ts` with `ProvenanceEdge` (`{ parentToken, recordedAt }`), `resolveParentTabId()`, `effectiveProvenanceState()`, `isRootTransition()`, `PROVENANCE_EDGE_CAP` (2000), `PROVENANCE_MAX_DEPTH` (5), `TAB_TOKEN_KEY` (`'lunma.tabToken'`) and `PROVENANCE_SESSION_MARKER_KEY` (`'lunma.provenanceSession'`) — no depth type, since depth is layout
- [x] 2.3 Declare `lunma/provenance-sync`, `lunma/provenance-token` and `lunma/provenance-clear` in `shared/messages.ts` — where the existing `lunma/boundary-*` content-script messages already live, NOT a new module and NOT `shared/bus.ts` — then add `content/tab-token.ts`: dormant until messaged, no settings read, no `chrome.*` beyond `runtime.onMessage`, mirroring `content/tab-boundary.ts`'s budget and re-injection guard. Register it as the third content script in the manifest
- [x] 2.4 RED first: with the effective state OFF, no page `sessionStorage` read or write occurs — the normative property from the `tab-provenance` spec, and the test that keeps it honest
- [ ] 2.5 SW-side identity exchange on every main-frame commit: mint a candidate, send `provenance-sync`, take the token the script replies with (a token already on the page WINS), keep a live `tabId → token` map, and re-send the mapped token on a cross-origin commit. Add `provenanceToken?: string` / `provenanceParentTabId?: TabId` to `LiveTab` plus `setLiveTabToken()` and `setLiveTabParent()`
- [ ] 2.5b RED first: declare `provenanceToken` and `provenanceParentTabId` on `LiveTabSchema` (a `z.strictObject` — an undeclared field rejects the whole broadcast) and make `syncLiveTab` treat a change to either as material; without it the gate swallows the report and the sidebar never re-indents
- [x] 2.6 RED first: a page already holding a token keeps it and the candidate is discarded (this is what makes restore work); a page with none takes the candidate; a cross-origin commit re-sends the mapped token so one tab keeps one identity

## 3. Parent resolution

- [ ] 3.1 RED first: an external handoff (`transitionType: 'start_page'` with a live `openerTabId`) resolves to a ROOT and ignores the opener
- [ ] 3.2 RED first: a `link` commit with a tokenised opener records an edge; an untokenised opener yields a root; a `frameId !== 0` commit is ignored
- [ ] 3.3 Add `background/handlers/web-navigation.ts`; register at top level guarded on `chrome.webNavigation` being DEFINED (a synchronous check that is exactly the permission check) — never an async `permissions.contains`. Filter `frameId !== 0` AT THE LISTENER so subframe commits never enter the queue. Add `ctx.provenanceEnabled()` — a cached synchronous settings mirror matching `ctx.dedupNewTabNavigations()` — and gate the handler on it, keeping the handler pure and dispatching the re-stamp through the side-effect channel
- [ ] 3.4 Add the `PendingEvent` kind with an EMPTY `EventPolicy` entry — no coalescing. `replace` would discard the first commit, which is the one carrying the opener attribution, and no third mode exists. Confirm the exhaustiveness check still passes
- [ ] 3.5 RED first: a commit arriving while the grant is held but the effective state is off records nothing

## 4. Persistence — schema v19

- [x] 4.1 RED first: `AppStateV19Schema` accepts `provenanceByToken` and `provenanceCleanupPending`; `AppStateV18Schema` stays frozen
- [x] 4.2 Raise `CURRENT_SCHEMA_VERSION` to 19, add `AppStateV19Schema` extending v18 with both slices carrying Zod `.default(...)`, point `EnvelopeSchema` at it, export `AppStateV19`, advance the `AssertEqual` coherence guard to V19, and repoint the current-version consumers (`chrome/storage.ts`, `messages.ts`, `backup.ts`)
- [x] 4.3 RED first: the v18 → v19 migration defaults both slices and reshapes nothing; the chain holds eighteen entries ending at 19; a v17 envelope validates only after BOTH the v18 and v19 migrations; a portable backup carrying no provenance slices still imports
- [x] 4.4 Add the `{ toVersion: 19 }` migration entry
- [ ] 4.5 RED first: boot pruning retains the TRANSITIVE closure of reported tokens — a chain three levels deep survives, which a single unordered pass would sever — and the cap drops edges in ascending `recordedAt` order
- [ ] 4.6 Implement `recordProvenanceEdge()` and `pruneProvenanceEdges()` — pruning to a fixpoint AND the `PROVENANCE_EDGE_CAP` eviction both run in the boot prune, not on every record

## 5. Restore and teardown

- [ ] 5.1 RED first: a restored tab reporting a known token recovers its exact parent across new tab ids; an unknown token is a root; no URL or ordering match is attempted
- [ ] 5.2 RED first: toggle-off unregisters the listener, clears the slice, and clears tokens on every loaded tab — and does NOT call any permission-removal API, since the grant is never revoked by Lunma
- [ ] 5.3 RED first: with `provenanceCleanupPending` set, a tab loading later has its token cleared; a sweep finding nothing among LOADED tabs does NOT clear the flag; the flag clears only on a boot where `chrome.storage.session` holds no marker AND `chrome.tabs.query` reports no http(s) tab; re-enabling the toggle clears the flag
- [ ] 5.4 Implement teardown (no permission revocation) + the converge-on-load sweep driven by `tabs.onUpdated`, `setProvenanceCleanupPending()`, and `PROVENANCE_SESSION_MARKER_KEY` in `chrome.storage.session` — READ the marker and evaluate the clear condition BEFORE writing it, or the condition can never be satisfied
- [ ] 5.5 RED first: `resolveParentTabId()` writes `provenanceParentTabId` onto each `LiveTab` (the SW does NOT compute depth — that is layout); a cycle terminates as a root rather than hanging

## 6. Sidebar rendering

- [ ] 6.1 RED first: `TempTabs` derives depth by following `provenanceParentTabId` among the rows IT renders, indenting a child one step under its parent, in `tempTabIds` order, in one flat scroll container; depth caps at `PROVENANCE_MAX_DEPTH`
- [ ] 6.2 RED first: with the effective state off, every row renders at depth 0 with no lineage rule and no reserved indent gutter
- [ ] 6.3 RED first: provenance changes indentation, never order — a resolved parent set leaves `tempTabIds` order untouched
- [ ] 6.3b RED first: a row whose `provenanceParentTabId` is absent from the rendered rows renders at depth 0 with no lineage rule
- [ ] 6.4 Add `depth?: number` to `TabRow.svelte`, indenting one `--space-3` per step with a `--border-soft` hairline lineage rule — existing tokens only; confirm `lint:styles` passes
- [ ] 6.5 Update `apps/extension/catalog/stories/ui/TabRow.stories.svelte` for the `depth` prop — required by the component-library policy, and gated by `src/ui/stories-coverage.test.ts`
- [ ] 6.6 RED first: make `TempTabs`' existing `animate:flip` duration function return 0 unless a drag is in progress (an `animate:` directive cannot be applied conditionally), so a late-arriving parent changes indent with NO transition while drag keeps `reorderFlipMs()`

## 7. Disclosure — privacy policy

- [ ] 7.1 Update `apps/site/src/routes/privacy/+page.svelte`: KEEP the "never page content" clause verbatim (writing a marker is not reading the page) and add the marker — off by default, stored in visited pages while on, readable by those pages so a site can tell Lunma is installed, cleared where Lunma can still reach, not clearable by uninstall, and never outliving the browsing session
- [ ] 7.2 Add the marker to the "What Lunma stores, and where" section — it is the only storage location outside Lunma's own
- [ ] 7.3 Add `webNavigation` to the permissions list, described by the job it does
- [ ] 7.4 Confirm the page does not contradict `TrustBand.svelte` — the retained requirement text obliges this change to keep the two in agreement — and that `apps/site` verify (contrast test + prerender build) passes

## 8. Docs

- [ ] 8.1 `docs/adr/0005-tab-provenance.md` — remove the "not currently implemented" statement, the "whether the two costs are worth it is an open product question" paragraph, and the unresolved re-indent-vs-hold choice (settled by D6); correct its claim that the EXISTING content scripts carry the token (a third one does)
- [ ] 8.2 `docs/architecture.md` — the permission enumeration (a closed list today), the SW event-source list, and the `AppState` slice inventory
- [ ] 8.3 Confirm `docs/tech-stack.md` needs no change (no new dependency)

## 9. Verify

- [ ] 9.1 `pnpm verify` at the workspace root is green
- [ ] 9.2 `pnpm test:e2e` is green
- [ ] 9.3 Write a committed e2e spec asserting the behaviour ADR 0005 records: a token in `sessionStorage` survives `--restore-last-session`, distinct per tab, through same-origin navigation. It guards the Chrome behaviour the whole mechanism rests on, and can only land once the token script exists
- [ ] 9.4 `openspec validate add-tab-provenance --strict` passes
- [ ] 9.5 Release task, outside this repo: write the Chrome Web Store `webNavigation` permission justification, and CONFIRM (do not assume) that the data-usage declaration still reads "no data collected" — it is a signed declaration
