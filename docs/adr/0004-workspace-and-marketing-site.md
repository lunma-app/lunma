# 0004 — pnpm workspace + the marketing site

- **Status:** Accepted
- **Date:** 2026-06-08
- **Implementing change:** `lunma-workspace-and-site` (the second of the two launch-baseline changes; runs after `rebrand-to-lunma`).
- **Depends on:** the `architecture-integrity` capability (the one-way layer DAG it re-paths but does not reshape).

## Context

The launch baseline needs a public landing page at `lunma.app` that earns the
install. The page must render Lunma's *exact* design language — the same tokens,
brand fonts, and immersive atmosphere the extension ships — or it drifts from the
product the moment either side changes a value. The single-file POC
(`the landing POC`) proved this risk: it hand-mirrored the `:root`
tokens and would desync on the first token edit.

So the page needs to consume the extension's design language from a shared
source, which means the repo — until now a single extension package — has to grow
a second app and a shared package. This ADR records the three structural choices
that restructure makes. The detailed rationale lives in the change's `design.md`
(D1, D2, D4); this ADR is the durable summary.

## Decision

### D1 — pnpm workspaces, not Nx or Turborepo

Adopt **pnpm workspaces** (`pnpm-workspace.yaml`: `apps/*`, `packages/*`) as the
only monorepo layer. `apps/extension`, `apps/site`, and `packages/tokens` are
workspace packages; the root `package.json` is the private workspace root and
`pnpm -r verify` fans the quality gate out to every package.

- **Nx — rejected.** Its headline feature, enforced module boundaries
  (`@nx/enforce-module-boundaries`), is an ESLint rule. The repo deliberately
  enforces its layer DAG with **Biome only** (`docs/tech-stack.md`); adding Nx would either
  leave its boundary rule unused or drag ESLint back in to fight Biome. Its
  generators / executors / project-graph are weight this two-app repo doesn't
  need.
- **Turborepo — deferred, not rejected forever.** Its value (task-graph caching,
  affected-only runs) only pays off at a scale (many packages, slow CI) this repo
  isn't at, and it bolts onto pnpm workspaces later with no lock-in.

This narrows `docs/tech-stack.md`'s original "avoid monorepo tooling (pnpm workspaces, Nx,
Turbo)" line — written when the repo was extension-only — to "pnpm workspaces yes
(extension + site); Nx/Turbo deferred."

### D2 — exactly one shared package, `packages/tokens` (CSS-only), not `packages/ui`

The shared thing is the **language** (tokens), not the **widgets**.
`@lunma/tokens` (`packages/tokens`) holds the design-token custom properties
(moved out of `src/ui/tokens.css`), the two bundled brand-font woff2 + their
`@font-face`, and a `recipes.css` of the aurora / frosted-glass / hue-glow
effects as pure-CSS classes. **Zero JS/TS**, zero dependency on the extension's
`shared` layer — so it sits outside the import-layer DAG, and a primitive
importing `@lunma/tokens` via a stylesheet is not a boundary violation. Both apps
depend on it via `workspace:*`. Its public surface is exactly three CSS export
specifiers: `./tokens.css`, `./fonts.css`, `./recipes.css`.

- **Also extracting `packages/ui` (the Svelte primitives) — rejected.** The
  primitives are proven coupled to `shared` (`Icon` / `Aurora` / `ResultRow`
  import `../shared/*`), and most are extension-domain widgets (`TabRow`,
  `FolderRow`, `Favicon`, `IconPicker`, `SearchField`, `Menu`, …) a marketing
  site has no use for. Sharing them would leak the store, Zod schemas, and
  `chrome`-typed code into a static website. `packages/ui` stays YAGNI until a
  second extension-like surface (e.g. a Firefox build) needs the widgets.

The aurora atmosphere is shared **as a var-driven CSS recipe**: the recipe reads
the token custom properties; *who sets the vars* differs per app (the extension
drives `--aurora-opacity` / the scoped hue vars at runtime via its existing
`Aurora.svelte`, which stays in the extension; the site sets them statically). So
the atmosphere is shared without moving any JS into the package.

### D3 — SvelteKit + `@sveltejs/adapter-static` for `apps/site`

The site is a **SvelteKit** app with `prerender` enabled site-wide via
`@sveltejs/adapter-static` → fully static output deployable to any host bound to
`lunma.app`, no server runtime. This is a tech-stack addition **scoped to
`apps/site`** (build-time only; nothing new ships in the extension bundle),
recorded in `docs/tech-stack.md`.

- **Astro — rejected.** Strong for content sites, but it's a second framework
  paradigm in an otherwise pure-Svelte repo; the team is Svelte-native and the
  site mirrors the app's visual language.
- **Evolving the single-file POC HTML — rejected.** It can't import
  `@lunma/tokens` (it hand-mirrors `:root`), so it perpetuates the exact drift
  the restructure exists to kill. The page is rebuilt as Svelte components under
  `apps/site/src/lib` composing the shared tokens/recipes — it does not copy the
  HTML, and does not reach into the extension's `ui/` primitives.

## Alternatives considered

- **Fold the restructure into `rebrand-to-lunma`.** Rejected — it forces every
  rename delta to target the post-restructure layout in one archive, mixing
  rename and structural spec edits. Sequencing the two changes keeps each one's
  deltas coherent with its own layout while still squashing to one commit.
- **Leave the atmosphere per-app.** Rejected — it re-creates drift for the most
  visually load-bearing effect; the var-driven recipe (D2) shares it cleanly.

## Consequences

- New `pnpm-workspace.yaml`; the extension moves under `apps/extension/` (its
  layer DAG re-paths `src/…` → `apps/extension/src/…` but is unchanged in shape);
  new `packages/tokens/` and `apps/site/`. `biome.json` re-paths its layer rules
  and gains a cross-app `noRestrictedImports` guard (both ways), proven by a
  planted violation.
- New build-time deps in `apps/site` only: `@sveltejs/kit`,
  `@sveltejs/adapter-static`, the SvelteKit Vite plugin. The shipped extension
  bundle gains nothing.
- The brand fonts live once in `packages/tokens/fonts/` and are copied into each
  app's served root at build (gitignored), keeping the manifest's
  `web_accessible_resources` `fonts/*` valid with no second copy in git.
- `the landing POC` (the hand-mirrored-token POC) is removed; the
  rest of `that tree` stays.
- A new `marketing-site` capability is added; `architecture-integrity` and the
  other path-bearing living specs re-path to `apps/extension/src/…` on archive.

## Related work

- `docs/tech-stack.md` — the narrowed monorepo line + the scoped `apps/site` stack.
- `docs/architecture.md` — the workspace project layout + the workspace package boundary.
- The `marketing-site` and `architecture-integrity` capability specs (produced by archiving `lunma-workspace-and-site`).
