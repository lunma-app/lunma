## 1. Foundation — `shared/permissions.ts`

- [x] 1.1 Create `apps/extension/src/shared/permissions.ts` exporting `hasApiPermission`, `requestApiPermission` (for `'history' | 'bookmarks'`), `hasHostPermissions(origins)` / `requestHostPermissions(origins)` (all-granted semantics over a set), `originPatternForBaseUrl`, and `onPermissionsChange` (wrapping `chrome.permissions.onAdded`/`onRemoved`, returning an unsubscribe). No `remove*` exports.
- [x] 1.2 Implement `originPatternForBaseUrl(baseUrl)` as `new URL(baseUrl).origin + '/*'` (port preserved); handle malformed `baseUrl` defensively (never throw).
- [x] 1.3 Add `apps/extension/src/shared/permissions.test.ts` covering origin derivation (incl. non-default port), has/request for API + host with all-granted semantics, and the change-subscription/unsubscribe behaviour (mock `chrome.permissions`).
- [x] 1.4 Confirm the layer DAG holds (`shared/` imports nothing else in `src/`); `biome check` stays green.
- [x] 1.5 Add a guard (test or Biome rule) asserting no `background/**` module calls `requestApiPermission`/`requestHostPermissions` — the gesture-bound requests must originate only from surfaces.

## 2. Manifest — least privilege

- [x] 2.1 In `apps/extension/public/manifest.json`, remove `<all_urls>` from `host_permissions` (leave the two `content_scripts` matches on `<all_urls>` unchanged).
- [x] 2.2 Move `history` and `bookmarks` from `permissions` to `optional_permissions`.
- [x] 2.3 Add `optional_host_permissions`: `https://github.com/*`, `https://api.github.com/*`, `https://gitlab.com/*`, `https://*.atlassian.net/*`, `https://*/*`, `http://*/*`.
- [x] 2.4 **Verify `favicon` (D6):** RETAINED — the `_favicon/` endpoint Lunma uses pervasively requires the `favicon` permission per Chrome's platform contract; outcome recorded in `design.md` (D6).

## 3. Background — connector required origins + gate

- [x] 3.1 Add `requiredOrigins(node): string[]` to the `SourceConnector` contract (`background/connectors/connector.ts`) and implement per source: GitHub → `['https://api.github.com/*']` on `github.com`, else the `baseUrl` origin; GitLab, Jira, and RSS → the `baseUrl` origin.
- [x] 3.2 Add `'needs-access'` to the `SmartFolderRuntime['state']` union in `apps/extension/src/shared/types.ts`.
- [x] 3.3 In `background/smart-folders.ts`, before dispatching any connector fetch (all sources incl. RSS), `hasHostPermissions(connector.requiredOrigins(node))`-check; when not all granted, resolve to `'needs-access'` with no network request. This gate runs BEFORE the connector's auth short-circuit (`needs-access` precedes `signed-out`).
- [x] 3.4 Subscribe (in the SW) via `onPermissionsChange`, handling BOTH directions: on grant, refetch folders whose required origins are now all granted and that are due/`needs-access` (`needs-access` → `pending` → `ok`); on revoke, set affected folders to `needs-access` and broadcast.
- [x] 3.5 Update connector + engine tests (`connectors/*.test.ts` incl. `rss.test.ts`, `smart-folders.test.ts`) for `requiredOrigins`, the gated path, the GitHub api-origin case, the RSS case, precedence, and grant/revoke; keep connectors bounded/never-throwing.

## 4. Background — gate launcher providers

- [x] 4.1 In `background/launcher-suggestions-handler.ts`, `hasApiPermission('history')` / `hasApiPermission('bookmarks')`-check before invoking the history/bookmarks providers; omit an ungranted provider entirely (no `chrome.history.*` / `chrome.bookmarks.*` call).
- [x] 4.2 Confirm the engine merges only available providers and never treats an absent optional provider as an error (open/saved tabs always run).
- [x] 4.3 Update launcher engine/provider tests for granted, partially-granted, and ungranted permutations.

## 5. UI — smart-folder grant affordance (sidebar)

- [x] 5.1 In `sidebar/SmartFolder.svelte`, render the `needs-access` state as a calm muted row (key/lock-open `Icon`, "Lunma needs access to ⟨host⟩" copy, a "Grant access" `Button`) — composing primitives only; activating it calls `requestHostPermissions(requiredOriginsForNode(node))` (the shared helper — surfaces can't import `background/connectors`; see design D8/D10).
- [x] 5.2 In `sidebar/SmartFolderEditor.svelte`, call `requestHostPermissions(requiredOriginsForNode(node))` on confirm of create / origin-changing edit; deny/dismiss still saves the folder (it lands in `needs-access`).
- [x] 5.3 Update `SmartFolder.test.ts` and `SmartFolderEditor.test.ts` for the new state, the grant call, and the never-block-on-deny behaviour. (The options Connectors section is unchanged — token management only.)

## 6. UI — launcher enable affordance

- [x] 6.1 On the new-tab launcher surface, render "Enable history results" / "Enable bookmark results" when ungranted (from `SuggestionsResult.ungrantedSources`, a new SW-computed field — agreed via AskUserQuestion); activating calls `requestApiPermission(name)` directly; on grant, re-query via `onPermissionsChange`.
- [x] 6.2 In the Alt+L overlay (content script — no `chrome.permissions`), render the same affordance in the vanilla-DOM idiom; activation sends `lunma/open-options-grant` to the SW to open the options page at the grant location (`#result-sources`).
- [x] 6.3 Add the SW message handler the overlay uses to open the options page at the grant location, plus the **new "Result sources" options section** it deep-links to (agreed via AskUserQuestion — the proposal's "Connectors section unchanged" holds; this is a separate section). Uses `getURL(...#result-sources)` + `chrome.tabs` (reuse-or-create) rather than `chrome.runtime.openOptionsPage`, which cannot carry the grant-location hash the spec requires.
- [x] 6.4 Add/update launcher surface tests for both contexts (inline request on new-tab; options-routing-via-SW on overlay) + the new options Result sources section.

## 7. Docs (lockstep — required before archive)

- [x] 7.1 Update `docs/architecture.md` with the permission/grant model: required vs optional permissions, the "SW queries/observes, surfaces request" split, and the load-bearing-content-script constraint (broad-host review is not escaped).
- [x] 7.2 Update `openspec/specs/` to add the `runtime-permissions` capability and note the smart-folders (`needs-access`) and launcher (graceful degradation) changes.

## 8. Quality gate

- [x] 8.1 `pnpm --filter @lunma/extension verify` green (tsc, biome incl. layer DAG, svelte-check, lint:styles, vitest — 2083 tests pass).
- [x] 8.2 `pnpm test:e2e` green (10 passed, 1 pre-existing `.skip`). The smart-folder-bindings e2e passes with a harness grant (the SW's `chrome.permissions.contains` is forced true — a real `request()` pops a native dialog Playwright can't accept). NOTE: that spec was pre-existing-RED on HEAD (its committed binding-slot assertions read a bare number; the committed store stores `{ tabId, allowGlob }`) — fixed the stale `.tabId` assertions here as an incidental, test-only alignment.
- [ ] 8.3 Manual smoke (the one genuinely-manual step — requires loading unpacked in Chrome). Structurally covered by automated checks: the manifest has no `<all_urls>` host permission and `history`/`bookmarks` are `optional_permissions` (no install prompt — verified by inspection); the connector host gate, `needs-access` deny path, and grant-heal-without-reload are covered by unit tests (`SmartFolder.test.ts`, `SmartFolderEditor.test.ts`, `smart-folders.test.ts` reconcile) and the e2e (the fetch needed an explicit grant to run). Left for a human to click through in a real browser before release.
