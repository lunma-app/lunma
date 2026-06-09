# Tech Stack

## At a glance

| Layer | Choice | Why |
|---|---|---|
| Language | **TypeScript** (strict) | Type-checked contracts at every boundary |
| UI framework | **Svelte 5** (with runes) | Tiny runtime, scoped styles, signals built-in; fits MV3 byte budgets |
| Build | **Vite** + `@crxjs/vite-plugin` | Proper MV3 ergonomics, manifest typing, HMR where Chrome allows it |
| State | **Single store class** (`$state` + mutation methods + serial queue) | One mutation point for the whole app, framework-grain reactivity |
| Schema / validation | **Zod** | Versioned schemas + runtime validation at storage boundaries |
| Tests | **Vitest** + **@testing-library/svelte** + **Playwright** | Unit for store methods/search; E2E for sidebar happy paths |
| Lint / format | **Biome** | One binary, fast, minimal config. Also the **architecture-integrity boundary enforcer** — per-layer `noRestrictedImports` + `noImportCycles` in `biome.json` lock the one-way layer DAG (see [03-architecture](03-architecture.md)) |
| CSS linting | **Stylelint** (`+ postcss-html + stylelint-declaration-strict-value`) | The one thing Biome can't do: enforce CSS *values*. Guards the primitive→token contract — `font-size`/`z-index` in `apps/extension/src/ui` primitives must reference design tokens |
| CSS | Svelte scoped styles + CSS variables | Per-component isolation; theming via variables; a design-token contract in the shared **`@lunma/tokens`** package (`packages/tokens` — type scale, weights, z-index, focus, press, control sizes, glass/glow/aurora) |
| Brand fonts | **Instrument Serif** (display) + **Mona Sans** (body), bundled woff2 | Editorial serif + contemporary sans for the immersive identity. SIL OFL, Latin-subset, served locally (no CDN — the MV3 CSP forbids remote font loading and the extension must work offline). Sourced once from `@lunma/tokens`, shared by the extension and the site |
| Marketing site | **SvelteKit** + `@sveltejs/adapter-static` (the SvelteKit Vite plugin) | The `apps/site` landing page only — prerendered to fully static output for `lunma.app`. **Build-time, scoped to `apps/site`; nothing new ships in the extension bundle.** See [ADR 0012](adr/0012-workspace-and-marketing-site.md). |
| Chrome API types | `@types/chrome` | Official, Chrome-only (no Firefox polyfill unless needed later) |
| Icon library | **`@lucide/svelte`** | Per-icon tree-shaken imports; broad coverage; official Svelte 5 wrapper. See [ADR 0004](adr/0004-lucide-svelte-icons.md). |
| Headless UI primitives | **`bits-ui`** | Svelte 5 port of Radix Primitives. We use it sparingly — only the primitives where getting accessibility right by hand is hard (Tooltip, and later Popover / Menu / Dialog / Combobox when the create-edit-space and launcher slices land). Our scoped styles + CSS tokens stay; Bits provides only behaviour. Crucially **not** shadcn-svelte — we keep our own design system and skip Tailwind. |
| Drag and drop | **Custom pointer-drag** (`apps/extension/src/sidebar/drag.svelte.ts`) | First-party pointer-drag controller for the sidebar lists: source row stays put (dimmed), a floating clone follows the cursor, an insertion line marks the landing slot, nothing reorders until drop. Cross-zone pin/unpin (temp→pinned drag, reorder pinned) via a single module-level controller. SW state stays authoritative — no optimistic updates. Replaced `svelte-dnd-action` during implementation; see [ADR 0006](adr/0006-custom-sidebar-drag.md) (supersedes [ADR 0003](adr/0003-sidebar-dnd-library.md)). |

## Non-obvious choices, with rationale

### Svelte 5 over Lit / Preact / React

For a Chrome extension specifically:

- **Sidebar** is the most complex surface — drag-drop, nested folders, dozens of Chrome event listeners. Components + reactivity make this tractable.
- **Overlay content script** (the Phase 4 launcher surface, not yet wired into the manifest) will inject at `document_start` on `<all_urls>` — every byte costs. Svelte 5 compiles away most of the framework; bundles typically land 5–15KB gzipped for the overlay vs. ~40KB for React.
- **Runes (`$state`, `$derived`, `$effect`)** give you signals natively — no Zustand/Jotai/Redux to bolt on.

Reach for **Lit** instead only if you want zero compile step / maximum web-standards alignment. **Preact + signals** is defensible (~3KB) but loses scoped-style ergonomics.

### `@crxjs/vite-plugin` as the build foundation

`@crxjs/vite-plugin` handles MV3 build concerns natively: parses `manifest.json`, knows which entries must be IIFE (content scripts), provides working HMR for sidebar/options pages (Chrome doesn't allow HMR for SW or content scripts). No custom build plugin needed.

### Single store class with method mutations (not Zustand, not Redux)

The discipline matters more than the library. Svelte 5's runes give per-property reactivity natively, so the store is a class with `$state` and mutation methods — no action union, no reducer, no `Object.assign` reconciliation:

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

Mutations are serialized through a single in-flight promise chain so two methods never interleave. Pair with an **EventCoordinator** in the SW that queues `chrome.tabs.*` and `chrome.bookmarks.*` events and invokes the matching store method serially. This is what makes the "state is serial" principle real.

Mutating `$state` directly (instead of returning a new state object) is the framework-grain choice: runes track which properties changed, so components only re-render the slice they read.

### Zod for storage shape

Every read from `chrome.storage.local` goes through `SpacesSchema.parse(raw)`. Corrupted data fails loudly at the boundary, not three async hops later. Define one `migrations[]` array indexed by `schemaVersion`. This realizes the "versioned storage" principle from `01-vision.md`.

### Bundled brand fonts (Instrument Serif + Mona Sans)

Lunma ships its own type. `--font-display: 'Instrument Serif'` carries Space identity (Space names, the wordmark, large headings); `--font-sans: 'Mona Sans'` carries body and UI text. Both are bundled locally as **Latin-subset woff2** and declared with `@font-face` + `font-display: swap` (the system stack remains the swap fallback). No Google Fonts / CDN — the MV3 CSP forbids remote font loading and the extension must render offline.

The two faces live **once** in the shared `@lunma/tokens` package (`packages/tokens/fonts/`), so the extension and the marketing site render the same type from one source — no second copy of the woff2 in git:

- `packages/tokens/fonts/MonaSans-Variable.woff2` — variable face, weight axis `200..900` (~40KB).
- `packages/tokens/fonts/InstrumentSerif-Regular.woff2` — single 400 weight (~15KB); Instrument Serif has no variable axis, which is fine for a display-only role.

Each consumer serves them at the stable `/fonts/*` path (`@lunma/tokens/fonts.css`'s `@font-face` urls): the extension's Vite config copies them into its served root at build (the generated `apps/extension/public/fonts/` is gitignored), so `fonts/*` stays valid in the manifest's `web_accessible_resources`; the site copies them into `static/fonts/`. The extension pages (sidebar, new-tab, options) load them by URL; the launcher overlay — a content script in an arbitrary page — registers the same faces on `document.fonts` via `chrome.runtime.getURL('fonts/...')`.

### Biome over ESLint + Prettier

For a solo extension, the config-bikeshedding-to-value ratio of ESLint is bad. Biome: one binary, ~5 lines of config, fast enough to run on save. If a rule isn't supported, switch later.

Biome also carries the **architecture-integrity** guardrail. The one-way layer DAG (`shared` is a leaf; `ui`→`shared`; `background`→`shared`+the launcher engine; surfaces→`ui`+`shared`; `content`→`shared`) is encoded as per-layer `noRestrictedImports` `overrides` plus `noImportCycles`. Biome 2.4 lints inside `.svelte` `<script>` blocks, so this covers the Svelte-heavy `ui` layer — which is why no separate import-graph tool (dependency-cruiser, madge, eslint-plugin-boundaries) is needed.

### Stylelint for the CSS token contract

Biome can lint CSS structure but cannot require a *value* (e.g. "`font-size` must be a `var(--text-*)` token"). That primitive→token half of the component-library contract is enforced by **Stylelint** + `postcss-html` (parses `.svelte` `<style>`) + `stylelint-declaration-strict-value`, scoped to `src/ui` primitives. It is the project's one deliberate addition beyond the original stack — narrow and load-bearing (the alternative, leaving the contract convention-only, is exactly the drift this guardrail exists to stop). Press-scale / control-height / feature-side token use stay at proposal-review, because raw `scale()` and heights aren't mechanically separable from legitimate use.

## What to avoid

- **React** — 40KB+ for what an extension needs. The component model is fine; the runtime cost on the overlay isn't.
- **Tailwind** — defensible but adds a debate. Svelte scoped styles + CSS variables for theming keeps total CSS under 10KB.
- **Redux Toolkit / Zustand / Jotai** — Svelte runes already give you signals. Adding a state library on top is duplication.
- **webextension-polyfill** — only worth it for a Firefox build. Chrome-only? Use `chrome.*` with `@types/chrome` directly.
- **tRPC / message libraries** — for SW ↔ sidebar messaging, a 30-line typed `sendMessage<T>` wrapper is enough.
- **Nx / Turborepo** — the repo is a **pnpm workspace** (`apps/extension`, `apps/site`, `packages/tokens`) but stops there. Nx's headline feature — enforced module boundaries — is an ESLint rule, which would fight the deliberate Biome-only enforcement; Turborepo's task-graph caching only pays off at a scale (many packages, slow CI) this repo isn't at, and bolts onto pnpm workspaces later with zero lock-in. So: **pnpm workspaces yes (extension + site); Nx/Turbo deferred.** See [ADR 0012](adr/0012-workspace-and-marketing-site.md).

## Versions pinned (as of May 2026)

Resolved at project start; the `pnpm-lock.yaml` is the source of truth from here on.

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
| Biome | 2.x | Also enforces the import-layer DAG (`noRestrictedImports` + `noImportCycles`) |
| Stylelint | 17.x | `+ postcss-html` + `stylelint-declaration-strict-value`; primitive→token CSS contract |
| Zod | 4.x | |
| `@types/chrome` | 0.1.x | |
| `bits-ui` | 2.18.x | |
| `@sveltejs/kit` | 2.x | **`apps/site` only** — build-time, nothing ships in the extension |
| `@sveltejs/adapter-static` | 3.x | **`apps/site` only** — prerender to static output for `lunma.app` |

When bumping: run `pnpm view <pkg> version` for each, prefer current minors, update `pnpm-lock.yaml`.

## Why this stack is a good fit for MV3 specifically

| MV3 constraint | How this stack handles it |
|---|---|
| Service workers can't use most window APIs | TS + Svelte runtime compile-target keeps SW code free of DOM imports |
| Content scripts run in isolated worlds | Overlay = vanilla TS + shadow DOM; isolation is explicit |
| Bundle size matters on `<all_urls>` injection | Svelte 5 compiles away framework overhead; overlay stays sub-15KB |
| No HMR for SW or content scripts | `@crxjs/vite-plugin` provides HMR where allowed (sidebar/options/newtab) |
| CSP forbids `eval` / inline scripts | Vite + Svelte 5 produce CSP-safe builds out of the box |
| SW can be terminated at any time | Store rehydrates from `chrome.storage.local` via Zod-validated load on every SW boot |
