# Tech Stack

What Lunma is built with, and why each non-obvious choice was made. Read this before adding or bumping a dependency. The pinned versions live in `pnpm-lock.yaml`; this doc is the rationale and the source-of-truth pointer.

## At a glance

| Layer | Choice | Why |
|---|---|---|
| Language | `TypeScript` (strict) | Type-checked contracts at every boundary |
| UI framework | `Svelte 5` (runes) | Tiny runtime, scoped styles, signals built in; fits MV3 byte budgets |
| Build | `Vite` + `@crxjs/vite-plugin` | MV3-native build, manifest typing, HMR where Chrome allows it |
| State | Single store class (`$state` + mutation methods + serial queue) | One mutation point, framework-grain reactivity |
| Schema / validation | `Zod` | Versioned schemas plus runtime validation at storage boundaries |
| Tests | `Vitest` + `@testing-library/svelte` + `Playwright` | Unit for store methods and search; E2E for sidebar happy paths |
| Lint / format | `Biome` | One binary, fast, minimal config. Also enforces the layer DAG (see below) |
| CSS linting | `Stylelint` (`+ postcss-html + stylelint-declaration-strict-value`) | Enforces CSS *values* Biome cannot, guarding the primitive-to-token contract |
| CSS | Svelte scoped styles + CSS variables | Per-component isolation; theming via variables; design tokens from `@lunma/tokens` |
| Brand fonts | Instrument Serif (display) + Mona Sans (body), bundled woff2 | Editorial identity, served locally. The MV3 CSP forbids remote fonts; the extension runs offline |
| Marketing site | `SvelteKit` + `@sveltejs/adapter-static` | `apps/site` only, prerendered to static output for `lunma.app`. Nothing ships in the extension bundle ([ADR 0004](adr/0004-workspace-and-marketing-site.md)) |
| Chrome API types | `@types/chrome` | Official, Chrome-only |
| Icon library | `@lucide/svelte` | Lazy per-icon loaders from a generated allowlist (`pnpm gen:icons`, guarded in `verify`) |
| Headless UI primitives | `bits-ui` | Svelte 5 port of Radix Primitives, used only where hand-rolling accessibility is hard |
| Drag and drop | Custom pointer-drag (`apps/extension/src/sidebar/drag.svelte.ts`) | First-party controller for the sidebar lists |
| Feed parsing | `saxes` (DOM-free streaming SAX) | RSS 2.0 / Atom parsing for the `rss` smart-folder connector; the MV3 SW has no `DOMParser` |
| Fuzzy search | `@leeoniya/ufuzzy` | Typo-tolerant launcher matching, service-worker-side only |

## Non-obvious choices

### Svelte 5 over Lit, Preact, or React

The sidebar is the most complex surface: drag-drop, nested folders, dozens of Chrome event listeners. Components plus reactivity make it tractable. The launcher overlay injects at `document_start` on `<all_urls>`, where every byte counts. Svelte 5 compiles away most of the framework, so overlay bundles land at 5-15KB gzipped against roughly 40KB for React. Runes (`$state`, `$derived`, `$effect`) provide signals natively, so no Zustand, Jotai, or Redux is needed.

Lit is the alternative if you want a zero compile step and maximum web-standards alignment. Preact with signals is defensible at roughly 3KB, but loses Svelte's scoped-style ergonomics.

### `@crxjs/vite-plugin` as the build foundation

`@crxjs/vite-plugin` handles MV3 build concerns natively. It parses `manifest.json`, marks the entries that must be IIFE (content scripts), and provides HMR for the sidebar and options pages. Chrome blocks HMR for the service worker and content scripts. No custom build plugin is needed.

### Single store class with method mutations

Svelte 5 runes give per-property reactivity, so the store is a class with `$state` and mutation methods, with no action union, reducer, or `Object.assign` reconciliation.

```ts
// apps/extension/src/shared/store.svelte.ts
class LunmaStore {
  state = $state<AppState>(initial);

  activateSpace(windowId: WindowId, spaceId: SpaceId) {
    this.state.activeSpaceByWindow[windowId] = spaceId;
    if (!this.state.spaceInstancesByWindow[windowId]) {
      this.state.spaceInstancesByWindow[windowId] = {
        spaceId, groupId: -1, tempTabIds: [],
      };
    }
    this.state.lastActivatedSpaceId = spaceId;
  }
  // ... one method per state transition
}
export const store = new LunmaStore();
```

Mutations serialize through a single in-flight promise chain, so two methods never interleave. The `EventCoordinator` in the service worker queues `chrome.tabs.*` and `chrome.bookmarks.*` events and invokes the matching store method serially. Mutating `$state` in place, rather than returning a new object, lets runes track which properties changed so components re-render only the slice they read.

### Zod at the storage boundary

Every read from `chrome.storage.local` goes through `SpacesSchema.parse(raw)`. Corrupted data fails loudly at the boundary, not three async hops later. A single `migrations[]` array indexed by `schemaVersion` carries the versioned-storage contract.

### Bundled brand fonts

Lunma ships its own type. `--font-display: 'Instrument Serif'` carries Space identity: Space names, the wordmark, large headings. `--font-sans: 'Mona Sans'` carries body and UI text. Both are bundled as Latin-subset woff2 and declared with `@font-face` plus `font-display: swap`, with the system stack as the swap fallback. There is no CDN, because the MV3 CSP forbids remote font loading and the extension must render offline.

The two faces live once in `@lunma/tokens` (`packages/tokens/fonts/`), so the extension and the site render the same type from one source:

- `MonaSans-Variable.woff2` — variable face, weight axis `200..900` (≈40KB).
- `InstrumentSerif-Regular.woff2` — single 400 weight (≈15KB); Instrument Serif has no variable axis, which suits its display-only role.

Each consumer serves the fonts at the stable `/fonts/*` path declared by `@lunma/tokens/fonts.css`:

- The extension's Vite config copies them into its served root at build. The generated `apps/extension/public/fonts/` is gitignored, and `fonts/*` stays valid in the manifest's `web_accessible_resources`.
- The site copies them into `static/fonts/`.

The extension pages (sidebar, new-tab, options) load the fonts by URL. The launcher overlay, a content script in an arbitrary page, registers the same faces on `document.fonts` via `chrome.runtime.getURL('fonts/...')`.

### Biome over ESLint + Prettier

Biome is one binary with about five lines of config, fast enough to run on save. It also enforces architecture integrity. The one-way layer DAG is encoded as per-layer `noRestrictedImports` overrides plus `noImportCycles` in `biome.json`, and a violation fails `biome check`. Biome lints inside `.svelte` `<script>` blocks, which covers the Svelte-heavy `ui` layer, so no separate import-graph tool is needed. See [architecture](architecture.md) for the full DAG.

### Stylelint for the CSS token contract

Biome lints CSS structure but cannot require a *value*, such as "`font-size` must be a `var(--text-*)` token". Stylelint enforces that half of the component-library contract, with `postcss-html` to parse `.svelte` `<style>` blocks and `stylelint-declaration-strict-value` to require token references, scoped to the `src/ui` primitives. Press-scale, control-height, and feature-side token use stay at proposal review, because raw `scale()` and heights are not mechanically separable from legitimate use.

### uFuzzy for launcher matching, service-worker-side only

The launcher finder matches a query against open tabs, saved tabs, smart-folder items, bookmarks, and history with typo-tolerant fuzzy matching. uFuzzy (`@leeoniya/ufuzzy`) is a tiny dependency-free batch matcher. Lunma derives a bounded match strength from its per-match info and keeps it inside the existing `× SOURCE_WEIGHT (+ history recency)` envelope, so source ordering and the recency tiebreaker survive.

uFuzzy runs only in the service worker. `scoring.ts` and `search-engine.ts` are imported by `background/` and `launcher/shared/`, never by `overlay.ts` (the `Alt+L` content script imports only `launcher-contract`). The fuzzy library never enters the sub-15KB content-script bundle policed by the overlay budget guard (`src/launcher/overlay.budget.test.ts`), so the overlay stays vanilla.

## What to avoid

- **React** — 40KB+ runtime cost on the overlay, for a component model Svelte already provides.
- **Tailwind** — Svelte scoped styles plus CSS variables keep total CSS under 10KB.
- **Redux Toolkit / Zustand / Jotai** — Svelte runes already give signals.
- **webextension-polyfill** — only worth it for a Firefox build; Chrome-only uses `chrome.*` with `@types/chrome` directly.
- **tRPC / message libraries** — a 30-line typed `sendMessage<T>` wrapper covers SW-to-sidebar messaging.

## Versions pinned

Resolved at project start; `pnpm-lock.yaml` is the source of truth from here. When bumping, run `pnpm view <pkg> version`, prefer current minors, and update the lockfile.

| Package | Pinned | Notes |
|---|---|---|
| Node.js | 24.x (LTS) | Provided by devbox (`nodejs@24`) |
| pnpm | 11.x | Provided by Corepack; pinned in `package.json` via `packageManager` |
| TypeScript | 6.x | Strict mode |
| Svelte | 5.x | Runes mode enabled in `svelte.config.js` |
| Vite | 8.x | |
| `@crxjs/vite-plugin` | 2.x | |
| Vitest | 4.x | |
| `@testing-library/svelte` | 5.x | |
| Playwright | 1.6x | |
| Biome | 2.x | Enforces the layer DAG (`noRestrictedImports` + `noImportCycles`) |
| Stylelint | 17.x | `+ postcss-html` + `stylelint-declaration-strict-value`; primitive-to-token CSS contract |
| Zod | 4.x | |
| `@types/chrome` | 0.1.x | |
| `bits-ui` | 2.18.x | |
| `saxes` | 6.x | DOM-free streaming SAX XML parser for RSS 2.0 / Atom feeds in the SW (no `DOMParser` in MV3); direct dep |
| `@leeoniya/ufuzzy` | 1.0.19 (exact) | Typo-tolerant launcher matching. Service-worker-side only; absent from the overlay bundle (overlay budget guard) |
| `@sveltejs/kit` | 2.x | `apps/site` only, build-time |
| `@sveltejs/adapter-static` | 3.x | `apps/site` only, prerender to static output for `lunma.app` |
| `simple-icons` | 16.x | `apps/site` only, build-time brand glyphs (CC0-1.0); nothing ships in the extension |
| `release-please` | `googleapis/release-please-action@v4` | Versioning/release automation (pinned GitHub Action, CI-only — no runtime dep). Derives the next semver from Conventional Commits; see `docs/releasing.md` |

## Continuous integration

CI (GitHub Actions, `.github/workflows/ci.yml`) runs the same gate as local, on the same pinned toolchain:

- Provisions Node 24 and activates pnpm through Corepack from the root `package.json` `packageManager` field, so CI never re-declares a pnpm version and cannot drift from local.
- Installs with `pnpm install --frozen-lockfile`. A stale `pnpm-lock.yaml` fails the install.
- Runs the same checks as local `pnpm -r verify`, but **fanned across parallel jobs** so the slow steps overlap instead of running in series: the extension's `verify` is split into one runner each for `typecheck` (tsc), `lint` (Biome), `check` (svelte-check), `lint:styles` (Stylelint), and `test:run` (Vitest), plus a `site` job for the marketing site. A no-op `verify` job aggregates them (`needs:` all, fails if any did) so **`verify` stays the single required status check** — the branch-protection required set is unchanged.
- A parallel `e2e` job runs the Playwright MV3 smoke under `xvfb-run`. The fixture loads the unpacked extension via `--load-extension`, which Chromium permits only headed, so CI needs a virtual display.

devbox is the local-dev story only; CI needs the pinned Node plus pnpm, not the local shell. CI runs `verify` (the aggregate) and `e2e` on every PR and push to `main`.

Planned: enforcing these checks as a branch-protection merge gate, deferred until the repo is public.

## Versioning and releases

The extension's version is **derived from commit history, not hand-edited**.
[release-please](https://github.com/googleapis/release-please) runs as a pinned
GitHub Action (`googleapis/release-please-action@v4`, `.github/workflows/release-please.yml`,
push-to-`main` only) and reads the Conventional-Commit log to maintain a rolling
**Release PR**: it bumps the canonical `apps/extension/package.json` `version`,
bumps `apps/extension/public/manifest.json` in lockstep (its `extra-files`
updater), and regenerates `apps/extension/CHANGELOG.md`. Merging that PR cuts the
`vX.Y.Z` tag + GitHub release, and the same run builds the extension and attaches
a downloadable `lunma-<version>.zip` asset to that release (the
`extension-release-pipeline` capability; the Chrome Web Store upload is a deferred
later phase). Monotonic increase and tag↔version agreement hold
by construction. A parity test (`apps/extension/src/version-parity.test.ts`) rides
`pnpm verify` and fails if the two version fields ever diverge — so versioning
adds **no** new required CI status context (it rides `verify`) and **no** runtime
dependency (the Action is CI-only). The full bump policy (`fix`/`feat`/breaking →
patch/minor/major), the squash-merge convention, and the `0.1.0` bootstrap live in
[releasing](releasing.md).

## Continuous deployment (marketing site)

The marketing site (`apps/site`) is deployed to **Cloudflare Pages** from CI — a separate workflow, `.github/workflows/deploy.yml`, not a job on `ci.yml`. On every push it builds the static output with the *same* pinned toolchain described above (Node 24 + Corepack-pinned pnpm + frozen install — no second build environment) and publishes the prebuilt `apps/site/build/` by running the pinned `wrangler` via `pnpm dlx wrangler@<version>` — no `package.json` dependency (the `cloudflare/wrangler-action` doesn't work in this strict pnpm workspace, so wrangler is invoked directly). It deploys `main` only (production, `lunma.app`) — no per-branch previews. The workflow never triggers on `pull_request`, so the Cloudflare token stays off fork PRs. See `docs/architecture.md` § "Continuous deployment" and the `release-engineering` capability.

## Fit for MV3

| MV3 constraint | How this stack handles it |
|---|---|
| Service workers can't use most window APIs | The Svelte runtime compile target keeps SW code free of DOM imports |
| Content scripts run in isolated worlds | The overlay is vanilla TS plus shadow DOM; isolation is explicit |
| Bundle size matters on `<all_urls>` injection | Svelte 5 compiles away framework overhead; the overlay stays sub-15KB |
| No HMR for SW or content scripts | `@crxjs/vite-plugin` provides HMR for the sidebar, options, and new-tab |
| CSP forbids `eval` and inline scripts | Vite plus Svelte 5 produce CSP-safe builds |
| SW can be terminated at any time | The store rehydrates from `chrome.storage.local` via a Zod-validated load on every SW boot |
