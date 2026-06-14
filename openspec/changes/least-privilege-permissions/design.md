## Context

Lunma's manifest declares `<all_urls>` as a required `host_permission` and `history` + `bookmarks` as required `permissions`, all granted at install. Only two consumers actually need broad website access — the launcher overlay and the pinned-tab boundary — and they need it as content-script *injection*, declared separately under `content_scripts.matches`. The `host_permissions` grant exists solely so the smart-folder connectors (`background/connectors/*.ts`, via `boundedFetch`) can `fetch()` GitHub/GitLab/Jira, including arbitrary self-hosted hosts. `history`/`bookmarks` exist solely for the launcher's two suggestion providers.

This change is the least-privilege pass before the first public Chrome Web Store release. The runtime state machine for connectors already models calm, recoverable states (`pending | ok | signed-out | error`, see the smart-folders "Calm failure and pending states" requirement), which we extend rather than replace.

Two hard platform constraints shape every decision below:

1. **`chrome.permissions.request()` requires a user gesture** and is only callable from contexts where the gesture lives. The background service worker has no gesture; it can `contains()` (query) and observe `onAdded`/`onRemoved`, but it cannot `request()`.
2. **`chrome.permissions` is not exposed to content scripts** — only to extension pages (sidebar, options, new-tab) and the background SW. The Alt+L launcher *overlay* is a content script, so it cannot call `request()` itself.

## Goals / Non-Goals

**Goals:**
- Remove `<all_urls>` from required `host_permissions`; request connector hosts at runtime per host.
- Make `history` + `bookmarks` optional; the launcher degrades to its remaining sources when they are absent.
- Give the user a reversible, in-context "Enable / Grant access" control wherever a feature is gated.
- Keep the connector state machine calm: a missing grant is a first-class `needs-access` state, not an `error`.
- Centralise all `chrome.permissions` access behind one typed foundation module (`shared/permissions.ts`).

**Non-Goals:**
- Escaping Chrome's broad-host manual-review tier. The two content scripts stay on `<all_urls>`, so manual review remains; this is accepted (see proposal).
- Narrowing the content scripts themselves, or any of `tabs`, `tabGroups`, `storage`, `sidePanel`, `alarms`, `scripting`, `commands`.
- The marketing-site `/privacy` route and the store dashboard text (separate change / operational).

## Decisions

### D1 — One foundation module, `shared/permissions.ts`; the gesture-bound `request()` runs in surfaces, `contains()`/observe run anywhere
`shared/` imports nothing else in `src/`, and every layer may import it, so the wrapper is reachable by the background (gating, observing) and by surfaces (requesting). The module is a thin, pure mapping over `chrome.permissions` and carries no policy beyond origin-pattern derivation. Exports (normative):
- `hasApiPermission(name: 'history' | 'bookmarks'): Promise<boolean>`
- `requestApiPermission(name): Promise<boolean>`
- `hasHostPermissions(origins: string[]): Promise<boolean>` — true only if **every** origin in the set is granted (a connector may fetch more than one)
- `requestHostPermissions(origins: string[]): Promise<boolean>`
- `originPatternForBaseUrl(baseUrl): string` — `new URL(baseUrl).origin + '/*'`; a building block, not the gate input — connectors decide which origins they need (see D8)
- `onPermissionsChange(listener): () => void` — wraps `onAdded`/`onRemoved`, returns an unsubscribe.

`remove*` helpers are intentionally **not** exported: revocation happens through Chrome's own UI, observed via `onPermissionsChange` (see D5 and the smart-folders revoke requirement), so Lunma never needs to programmatically remove a grant.

`request*` calls are invoked only from click handlers in extension-page surfaces; the background never calls them. **Alternative considered:** scatter `chrome.permissions` calls at each call site — rejected; it would duplicate the origin-derivation logic and make the gesture/context rules easy to violate. **Alternative considered:** route requests through the SW via a message — rejected; the SW cannot satisfy the gesture requirement.

### D2 — `optional_host_permissions` lists known hosts + broad fallback for self-hosted
Connector `baseUrl`s are user-entered and include arbitrary self-hosted GitLab/GHE/Jira. To `request()` a specific origin at runtime it must match an `optional_host_permissions` pattern, so we declare the known SaaS hosts explicitly **and** `https://*/*` + `http://*/*` as the self-hosted fallback. These are optional, so none appear in the install prompt; the runtime prompt is scoped to the one origin requested. **Alternative considered:** only specific known hosts — rejected; breaks self-hosted, a real connector use case. **Trade-off:** broad optional patterns still appear in the manifest and do not lower the review tier (already accepted).

### D3 — A new `needs-access` connector runtime state
`SmartFolderRuntime.state` becomes `'pending' | 'ok' | 'signed-out' | 'error' | 'needs-access'`. The engine in `smart-folders.ts` checks `hasHostPermissions(connector.requiredOrigins(node))` (see D8) before dispatch and short-circuits when any required origin is ungranted to `needs-access` **without a fetch** — mirroring the existing token-absent → `signed-out` short-circuit. This keeps the distinction the UI needs: `needs-access` renders a calm grant prompt; `error`/`signed-out` keep their current meanings. **Alternative considered:** reuse `signed-out` — rejected; conflates "no token" (re-enter a PAT) with "no host permission" (grant access), which need different affordances. Connectors stay bounded and never throw.

### D4 — Requesting a host on folder create/enable does not block creation
When the editor (an extension-page surface, has gesture) saves a smart folder, it calls `requestHostPermissions(connector.requiredOrigins(node))` (see D8 — for a github.com folder that is `https://api.github.com/*`, not `github.com`). Grant → normal poll. Deny/dismiss → the folder still saves and sits in `needs-access` with the inline Enable affordance. **Rationale:** never lose the user's configuration to a permission dialog; degrade, don't block.

### D5 — Launcher providers gate in the SW; the Enable affordance lives where `chrome.permissions` exists
`launcher-suggestions-handler.ts` runs in the SW: it `hasApiPermission()`-checks before invoking `chrome.history.search` / `chrome.bookmarks.search` and simply omits an ungranted provider (the de-dup/scoring requirement already tolerates a missing source). It also reports the ungranted optional sources back to the surfaces via a new optional `SuggestionsResult.ungrantedSources` field — the stateless overlay cannot query `chrome.permissions` itself, so it depends on this signal; the new-tab surface uses the same field for one consistent source of truth (decided during apply, agreed via AskUserQuestion).

The inline "Enable history/bookmark results" affordance is rendered on the **new-tab launcher surface** (an extension page — can `request()` directly; on grant `onPermissionsChange` re-queries so results appear without a refresh). **In the Alt+L overlay (a content script that cannot touch `chrome.permissions`), the affordance instead opens the options page** to its grant control, via a new `lunma/open-options-grant` message to the SW. Because `chrome.runtime.openOptionsPage()` cannot carry a deep-link hash, the SW helper (`background/open-options-grant.ts`) opens `src/options/index.html#result-sources` via `chrome.tabs` (reuse-or-create), the same pattern as the sidebar's `openOptionsAt`. **This overlay divergence is a direct consequence of platform constraint #2 and is the one place the "inline request" UX is mediated rather than inline.**

**New options "Result sources" section (decided during apply, agreed via AskUserQuestion).** The overlay's "open the options page to the grant location" needs a grant control to exist in options. The proposal keeps the **Connectors** section token-only; this adds a *separate* "Result sources" section (`#result-sources`) with the inline "Enable history/bookmark results" controls (composing primitives, calling `requestApiPermission` directly — options is an extension page) and live grant indicators kept current via `onPermissionsChange`. It is both the new-tab affordance's sibling control and the overlay's deep-link target.

### D6 — `favicon` removal is gated on a verification step, not assumed
A task loads the built extension without the `favicon` permission and confirms `tab.favIconUrl` still populates and `_favicon/*` still resolves on Chrome 123+. If confirmed, `favicon` is dropped; if not, it stays and the reason is recorded in this design before archiving. **No silent assumption either way.**

**Outcome (recorded during apply): `favicon` is RETAINED.** The verification short-circuits on a Chrome platform contract that makes the experiment's failing case certain: the `_favicon/` page-URL endpoint (`chrome.runtime.getURL('/_favicon/?pageUrl=…')`, built in `ui/favicon.ts`) is documented to require the `"favicon"` permission alongside the `_favicon/*` `web_accessible_resources` entry. Lunma depends on that endpoint pervasively — it is the favicon fallback for every tile/row (`ui/Favicon.svelte`, `ui/FaviconTile.svelte`, `ui/TabRow.svelte`, `ui/ResultRow.svelte`, the sidebar `FaviconRow`/`PinnedTabs`, the launcher overlay) whenever a live `tab.favIconUrl` is absent (dormant favorites, saved tabs with no bound tab, smart-folder and bookmark/history result rows). Dropping `favicon` would silently break favicon rendering for all of those, so it stays as a required permission. (`tab.favIconUrl` itself rides the `tabs` permission and is unaffected — but it does not cover the dormant/unbound cases the `_favicon/` endpoint exists to serve.)

### D7 — Docs updated in this change
`docs/03-architecture.md` gains the permission/grant model (required vs optional, the SW-queries / surface-requests split, the load-bearing-content-script constraint). `docs/04-capabilities.md` gains the `runtime-permissions` capability and notes the smart-folders/launcher degradation. No other `docs/` files change.

### D8 — Each connector declares the origins it fetches; the gate keys on those, not on `baseUrl`
The gate cannot key on `node.baseUrl`, because the origin a connector fetches is not always the folder's `baseUrl` origin. The `SourceConnector` contract (`background/connectors/connector.ts`) gains `requiredOrigins(node): string[]`, and `smart-folders.ts` gates on `hasHostPermissions(connector.requiredOrigins(node))` and requests that same set. Per source:
- **GitHub** — `github.com` → `['https://api.github.com/*']` (the connector fetches `api.github.com`, never `github.com`); GitHub Enterprise (`{baseUrl}/api/v3`) → `[originPatternForBaseUrl(baseUrl)]` (same origin).
- **GitLab** (`{baseUrl}/api/v4`) and **Jira** (`{baseUrl}/rest/api/3`) → `[originPatternForBaseUrl(baseUrl)]` (same origin).
- **RSS** → `[originPatternForBaseUrl(baseUrl)]` (it fetches the feed URL directly).

**This is the fix for the headline correctness bug:** without it, a `github.com` folder would request `github.com`, never authorize the `api.github.com` fetch, and sit broken forever. **Alternative considered:** a single `originPatternForBaseUrl(baseUrl)` gate (the first draft) — rejected as incorrect for GitHub. **Alternative considered:** special-case `github.com` inside the permissions module — rejected; `permissions.ts` stays source-agnostic (origin-pattern derivation only).

**Single derivation (decided during apply, agreed via AskUserQuestion).** The grant *request* runs in the sidebar/editor surfaces (D1), but a surface cannot import `background/connectors` under the layer DAG. So the per-source derivation lives in a pure `shared/connector-origins.ts` export, `requiredOriginsForNode(node)` (it imports only `shared/permissions`'s `originPatternForBaseUrl` and `shared/types`, keeping `permissions.ts` itself source-agnostic). The four `SourceConnector.requiredOrigins` members **delegate** to it, and the surfaces call it directly — exactly ONE derivation, no SW/surface drift. This mirrors the existing `launcher/shared` precedent (pure logic both the background and a surface need lives in a shared module). The SW gate keeps calling `connector.requiredOrigins(node)` (which delegates), preserving D8's contract.

### D9 — RSS is gated like the others; `needs-access` precedes `signed-out`
RSS feeds are fetched cross-origin from the SW; once `<all_urls>` is gone they cannot be fetched without a host grant, so RSS joins the gate uniformly (its `requiredOrigins` is the feed's own origin). A feed on an ungranted origin shows `needs-access` ("Lunma needs access to ⟨feed host⟩ to read this feed") rather than failing — the same model as the forges, no special path. **Trade-off:** a user with feeds from many hosts grants each once; accepted as the honest least-privilege cost. **Precedence:** because the gate runs *before* dispatch and the token short-circuit runs *inside* the connector, a folder that is both host-ungranted and token-absent shows `needs-access` first; after the host is granted, the refetch may then surface `signed-out`. This two-step (grant access → then add a token) is intentional and specified, not an accident of ordering.

### D10 — The grant affordance lives only where the folder node is available
The grant lives on the smart-folder card and in the `SmartFolderEditor` (both have the `node`, hence its required origins via the shared `requiredOriginsForNode(node)` — surfaces cannot import the connector, see D8). The options **Connectors** section is left unchanged (token management only): it is keyed by bare host string with no scheme and no source, so it cannot reliably derive the origin set to request. **Alternative considered:** add a per-host grant there by assuming `https://<host>/*` — rejected; it would be wrong for GitHub (needs `api.github.com`) and ambiguous for http-only self-hosted, and the card/editor already cover every grant path.

## Visual language

The change ships one user-visible pattern — the **grant affordance** — in two surfaces: the smart-folder card (`needs-access` state) and the new-tab launcher. In both, it is built by composing existing primitives (`Surface`, `Icon`, `Button`/`IconButton`, `Stack`); no primitive is re-rolled and no new primitive is added. (The options Connectors section does **not** carry it — D10.) The one exception is the budget-constrained Alt+L **overlay**: it has no Svelte runtime and a hard gzip budget, so it cannot import primitives; there the "Enable" affordance is rendered in the overlay's existing vanilla-DOM idiom (the same way it already mirrors `Icon`/`SearchField`) and routes to the options page via a SW message (D5) rather than importing `shared/permissions.ts` or any `ui/` primitive.

- **Tone & hierarchy.** `needs-access` is a *calm, neutral* state, deliberately distinct from `error`. It reuses the existing calm-failure layout: a centred `Icon` (a key/lock-open glyph, not a warning triangle), one muted explanatory line ("Lunma needs access to `github.com` to load this folder"), and a single primary `Button` ("Grant access"). No red, no alarm colour — muted foreground tokens on the frosted-glass `Surface`, consistent with `pending`/`signed-out`.
- **Colour.** The affordance inherits the active Space tint only through the standard `Button` primitive's existing token usage; the surrounding prompt stays on neutral muted tokens so a missing permission never reads as a failure. WCAG-AA contrast holds at subtle/standard/vivid (the prompt text uses the same muted-on-glass pair already proven by the `signed-out` state).
- **Motion.** State transitions (`needs-access` ⇄ `pending` ⇄ `ok`) use the established 150–250ms settle/fade tween shared by the other connector states — no new motion vocabulary. On grant, the card cross-fades `needs-access` → `pending` → results. `prefers-reduced-motion` collapses these to instant swaps, matching existing behaviour.
- **Interaction feedback.** The `Button` primitive already supplies hover, active (press scale), focus-ring, disabled, and loading states from tokens. While a request dialog is open the button shows the primitive's loading state; on deny it returns to rest (re-pressable, reversible). The launcher's "Enable …" affordance is a focusable row consistent with the result-row interaction model.
- **Improvement over Arc.** Arc grants broad access up front; Lunma's per-feature, in-context, reversible grant — surfaced as a calm state rather than a modal wall — is the deliberate divergence.

## Risks / Trade-offs

- **Existing dev/beta installs lose `<all_urls>` on update** → Chrome revokes a required host permission removed on update, so configured connector folders drop to `needs-access` until re-granted. *Mitigation:* the per-folder `needs-access` affordance re-grants the connector's required origins in one action (correct for GitHub too, since D8 requests `api.github.com`, not `github.com`). This is a real dev-flow papercut — local/e2e installs need a re-grant after the manifest change — not a no-op; acceptable only because it precedes the first public release. Not "nobody is affected."
- **Overlay cannot inline-request (constraint #2)** → the Alt+L overlay routes "Enable" to the options page instead of an inline dialog. *Mitigation:* D5; the new-tab launcher (the primary launcher surface) keeps the fully inline flow.
- **Broad optional host patterns remain in the manifest** → does not reduce the review tier. *Mitigation:* none possible without breaking self-hosted; expectation set in the proposal and store dashboard text.
- **`http://*/*` fallback** → needed for self-hosted instances on plain HTTP (internal networks). *Trade-off:* slightly broader optional surface; accepted because it is optional and only requested for a host the user explicitly entered.
- **Per-origin churn** → a user with many self-hosted hosts grants each once. *Mitigation:* grants persist; `onPermissionsChange` means no reload needed; this matches user mental model ("I'm connecting *this* server").

## Open Questions

- None blocking. D6 (`favicon`) is resolved by a verification task during apply; its outcome is recorded back into this design before archive.
