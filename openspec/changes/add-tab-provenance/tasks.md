## 1. Spikes (GATE — nothing below starts until these are answered)

Both questions are undocumented in Chrome. This repo's precedent is to settle
them by experiment, not by reasoning: `2026-07-02-fix-direct-url-tab-dedup`
Decision 1 records documentation-based reasoning arriving at the exact opposite
of the empirical truth about `openerTabId`. The harness is committed —
`apps/extension/e2e/fixtures.ts` (persistent context + real built extension) and
the `sw.evaluate()` pattern in `user-group-survives-restart.spec.ts` (arbitrary
code in the real service worker global, full `chrome.*` access). CDP is reachable
via `ctx.newCDPSession(page)`. Note the constraint at
`user-group-survives-restart.spec.ts:94-96`: CDP `evaluate` serializes plain data
only, so the probe must stringify its own observations.

- [ ] 1.1 Write a throwaway probe spec: `sw.evaluate` a
  `chrome.webNavigation.onCommitted` listener pushing
  `{tabId, frameId, url, transitionType, transitionQualifiers, openerTabId}`
  onto `self.__probe`, readable back via a second `sw.evaluate`.
- [ ] 1.2 **Spike 1 — what transition does an external-app open produce?** Trigger
  an OS-level handoff (`open -a "Google Chrome" <url>` on macOS is the closest
  scriptable analogue; also test a real click from a native app if feasible) and
  record the `transitionType` / `transitionQualifiers` of the first main-frame
  commit. Test BOTH warm-start (Chrome already running) and cold-start — the
  command-line/startup path and the protocol-handler dispatch path may differ.
  Record whether `openerTabId` is present.
- [ ] 1.3 **Evaluate Spike 1 against the design.** If external opens are
  indistinguishable from in-page link clicks (i.e. `link` + a live
  `openerTabId`), `design.md` Decision 1's cross-tab branch MUST change: first
  commits that cannot be positively attributed become roots. Raise via
  AskUserQuestion, update `design.md` Decision 1 + the `tab-provenance` spec's
  resolution requirement, then continue. Do not proceed on the current rule if
  the spike contradicts it.
- [ ] 1.4 **Spike 2 — does `openerTabId` survive browser session restore?**
  Relaunch the same persistent profile (the `launch()` helper in
  `user-group-survives-restart.spec.ts` already does exactly this) with tabs
  restored, and `chrome.tabs.query({})` for `openerTabId`.
- [ ] 1.5 **Evaluate Spike 2.** If openers survive restore, note whether a boot
  pass could recover one level of lineage and raise it as a scope question — it
  is NOT in the current design. If they do not survive, the "browser-session
  scoped" requirement in the `tab-provenance` spec stands as written and the
  options copy must say so. Either way, record the result in `design.md` Open
  Questions (resolve #1 and #2).
- [ ] 1.6 Delete the throwaway probe, or promote it to a committed e2e spec if it
  encodes a regression worth keeping. Record which, and why, in `design.md`.

## 2. Foundation — permission + setting

- [ ] 2.1 Add `webNavigation` to `optional_permissions` in
  `apps/extension/public/manifest.json`.
- [ ] 2.2 Extend `OptionalApiPermission` to
  `'history' | 'bookmarks' | 'webNavigation'` in
  `apps/extension/src/shared/permissions.ts`. RED first: a test asserting
  `requestApiPermission('webNavigation')` routes through the foundation module.
- [ ] 2.3 Add the `trackTabProvenance` toggle declaration to `SETTINGS`
  (`apps/extension/src/shared/settings.ts`), `Tabs` group, default `false`.
  Verify the `AssertEqual<z.infer<typeof SettingsSchema>, Settings>` guard still
  holds.
- [ ] 2.4 Wire the options toggle to request the permission within the user
  gesture; write back `false` on a declined grant. RED first on the declined-grant
  scenario — the stuck-on toggle is the bug this test exists to prevent.
- [ ] 2.5 Implement the effective-state helper
  (`trackTabProvenance && hasApiPermission('webNavigation')`) and the
  "enabled, needs permission on this device" options state. Wire
  `onPermissionsChange` for mid-session revocation.
- [ ] 2.6 Options copy: set expectations BEFORE the Chrome prompt (which reads
  "Read your browsing history"), and state the browser-restart limit. Add i18n
  messages — `src/i18n-no-literal.test.ts` will fail on a bare literal.

## 3. Schema + store

- [ ] 3.1 Define `TabProvenance`, `ProvenanceEdge`, `isRootTransition()`,
  `resolveParent()` in `apps/extension/src/shared/provenance.ts`. RED first:
  `resolveParent()` is a pure function and every scenario in the
  `tab-provenance` spec's resolution requirements is a table-driven unit test.
  `isRootTransition()` MUST accept both `start_page` and `auto_toplevel`.
- [ ] 3.2 Add `ProvenanceEdgeSchema`; add `AppStateV18Schema` with
  `provenanceByTabId`; freeze `AppStateV17Schema`; point `EnvelopeSchema` at v18;
  bump `CURRENT_SCHEMA_VERSION` to 18 (`src/shared/schemas.ts`).
- [ ] 3.3 Add the v17 → v18 migration defaulting `provenanceByTabId` to `{}`
  (`src/shared/migrations.ts`). Verify `assertMigrationsTerminal` passes.
- [ ] 3.4 Add `openerTabId?: number` to `LiveTab` / `LiveTabSchema` as a mirror
  field (stripped on persist with the rest of `liveTabsById`).
- [ ] 3.5 Store mutators: record a resolved edge; evict + reparent-to-grandparent
  on `tabs.onRemoved`; clear the slice on disable. RED first on the reparent
  chain (A ← B ← C, close B, assert C's parent is A and C is not a root).
- [ ] 3.6 Reconcile `provenanceByTabId` against `chrome.tabs.query({})` in
  `runRestartRecovery` — drop entries for tabs that vanished while the worker was
  dead.

## 4. Event wiring

- [ ] 4.1 Add the `webNavigation.onCommitted` listener shim to
  `src/background/index.ts`: registered synchronously at top level, guarded by
  `chrome.webNavigation?.onCommitted`, filtering `frameId === 0`, enqueueing via
  `enqueueAfterBoot`. No work in the listener.
- [ ] 4.2 Add the `EventPolicy` entry coalescing `webNavigation.onCommitted` by
  `tabId` (`src/background/coordinator.ts`).
- [ ] 4.3 Implement `src/background/handlers/web-navigation.ts` calling the store
  mutator. RED first on the out-of-order case: a commit for a `tabId` absent from
  `liveTabsById` takes the first-commit branch and does not throw.
- [ ] 4.4 Register/unregister on `onPermissionsChange` so a mid-session grant
  starts collection without a browser restart.
- [ ] 4.5 Extend the fake-chrome test harness with `chrome.webNavigation`. Note
  the existing mock's `chrome.tabs.get(id)` is synchronous while the real API
  returns a promise — if any new code path needs `tabs.get`, reconcile the mock
  first rather than testing against a lie.

## 5. Sidebar rendering

- [ ] 5.1 Project lineage in `TempTabs.svelte`: nest children under parents
  present in the same list, preserving `tempTabIds` order, depth 0 for absent
  parents, flat when the feature is off.
- [ ] 5.2 Add `depth?: number` to `TabRow.svelte` — `padding-inline-start` (not
  margin) so the whole row stays a hit target; cap at 3; `aria-level` matching
  rendered depth.
- [ ] 5.3 Lineage rail: 1px `--color-border-subtle`, Space-hue tinted at `vivid`,
  neutral at `subtle`, `aria-hidden`, terminating at the last child.
- [ ] 5.4 Motion: 180ms `--ease-out` settle on indent; 200ms on reparent so the
  tree visibly shortens; both 0ms under `prefers-reduced-motion: reduce`.
- [ ] 5.5 "from <hostname>" in `TabRow`'s existing `meta` slot on hover/focus.
  Resolve the precedence rule against `drifted`, which uses the same slot
  (`design.md` Open Question 4) — raise via AskUserQuestion if they can collide.
- [ ] 5.6 Resolve `role="tree"` vs `aria-level`-on-listitem against what 5.1
  actually renders (`design.md` Open Question 3). If the projection stays flat
  with visual nesting, `role="tree"` is a lie — use `aria-level`. Record the
  choice in `design.md`.
- [ ] 5.7 Assert drag-reorder does not rewrite lineage (spec: dropping under an
  unrelated tab must not adopt it).

## 6. Catalog + docs

- [ ] 6.1 Update `apps/extension/catalog/stories/ui/TabRow.stories.svelte` with
  depth 0–3 including the cap boundary, the lineage rail, the `meta` line, and
  focus-at-depth-3 (the focus ring must not clip against the indent).
  `src/ui/stories-coverage.test.ts` gates this.
- [ ] 6.2 Update `docs/architecture.md`: the permission enumeration at :223
  (currently a closed list of seven), the SW event-source list, and the AppState
  slice inventory. `docs/tech-stack.md` is untouched — no new dependency.

## 7. Verification

- [ ] 7.1 `pnpm verify` at the workspace root (green, read the output — do not
  claim from memory).
- [ ] 7.2 `pnpm test:e2e`.
- [ ] 7.3 Manual: enable → grant → open a link in a new tab → assert the indent
  appears and is CORRECT. Then Ctrl+T while a tab is focused → assert it does NOT
  indent under it. That second check is the whole design in one gesture; if it
  fails, the feature is the confidently-wrong thing this change exists to avoid.
- [ ] 7.4 Manual: disable → assert the slice clears, the permission is released,
  and the list goes flat.
- [ ] 7.5 Manual: idle the SW past ~30s (leave Chrome untouched), then navigate →
  assert lineage recorded before the death is still rendered.
- [ ] 7.6 Manual: revoke `webNavigation` in Chrome's extension settings
  mid-session → assert collection stops and the options page shows the
  needs-permission state without a restart.
