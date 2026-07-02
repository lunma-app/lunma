## Context

`apps/extension/src/shared/paraglide/**` (the compiled Paraglide runtime + per-message
functions) is currently committed, per **D2** in
`openspec/changes/archive/2026-06-28-add-i18n-foundation/design.md`. D2 explicitly
considered and rejected gitignoring it, citing "more script churn" and "a clean
checkout fails `pnpm typecheck` without the prestep."

That risk assessment predates two facts discovered while investigating recurring
working-tree noise on this output:

1. The directory has **two independent producers** — the standalone `paraglide-js
   compile` CLI (`gen:i18n`, run before `vite`/`vite build` in `dev`/`build`) and
   `paraglideVitePlugin` (configured in `vite.config.ts`, which *also* compiles on its
   own `buildStart` hook, unconditionally, every time Vite/Vitest/svelte-check loads
   that config). No official `@inlang/paraglide-js` example (Vite, TanStack Start,
   Astro) runs both; each configures the Vite plugin alone, which self-compiles with
   no separate CLI step needed — confirmed empirically here too (`vite build` alone,
   directory deleted beforehand, fully regenerated all 657 message files with zero
   prestep).
2. `@inlang/paraglide-js`'s own `emitGitIgnore` compiler option **defaults to `true`**
   — the tool expects its own output to be gitignored. Lunma's config explicitly
   overrides that default off on both producers (`--no-emit-git-ignore` on the CLI,
   `emitGitIgnore: false` in `vite.config.ts`).

Because the two producers have independently-versioned, environment-dependent
defaults, they have drifted from each other and from the committed baseline three
times in the same week: the per-message file layout silently flipping between
`message-modules`/`locale-modules` depending on `NODE_ENV` (the Vite plugin's own
default; `gen:i18n`'s CLI always defaults to `message-modules`), the Vite plugin
unconditionally overriding `isServer` to an SSR-aware expression the CLI doesn't use
by default, and the CLI resolving its `--project` flag to a machine/cwd-dependent
absolute path baked into the generated README, where the Vite plugin keeps the
literal relative string. Each incident surfaced as an unexplained dirty working tree
requiring manual diagnosis and re-sync.

This document supersedes D2's "commit + regenerate" decision going forward. Per
CLAUDE.md, `openspec/changes/archive/**` is never hand-edited — D2's original text
stands as the historical record of what was decided and why at the time; this change
records the reversal and its own rationale here instead.

## Goals / Non-Goals

**Goals:**
- Make the generated-output/git-noise incident class structurally impossible, not
  just fix today's specific drift.
- Preserve the guarantee D2 was protecting: a clean checkout's `pnpm typecheck` and
  `pnpm check` (svelte-check) — the two scripts that run outside Vite and can't
  self-heal — keep working without a manually-remembered extra step.
- Align with `@inlang/paraglide-js`'s own documented defaults and integration
  pattern (Vite plugin only; `emitGitIgnore` respected) rather than fighting them.

**Non-Goals:**
- Changing anything about the i18n *behavior* (supported locales, message content,
  the `custom-lunmaSettings` locale strategy, the layer-DAG placement under `shared/`).
  Only the generated-output's git/build lifecycle changes.
- Touching `apps/extension/src/ui/icon-loaders.generated.ts` or its generation
  timing — it has a single deterministic producer (one Node script, no second
  bundler-plugin re-touching its output) and doesn't share paraglide's drift risk, so
  the existing "generated-and-committed" precedent stands for it unchanged.
- Adding CI steps speculatively. Any CI change is decided empirically during
  implementation (see Open Questions), not assumed upfront.

## Decisions

### Gitignore location: root `.gitignore`, not the tool's own emitted one
Add `apps/extension/src/shared/paraglide/**` to the root `.gitignore` with an
explanatory comment, matching the existing `derived-controls.generated.ts` entry's
style (the repo's established convention: every generated/derived path is excluded at
the root, never via a nested `.gitignore`). **Alternative considered:** flip
`emitGitIgnore: true` (restore the library default) and let `paraglide-js` write its
own `.gitignore` inside the output directory. **Rejected**: it would be the only
nested `.gitignore` this repo manages (vs. `.devbox/.gitignore` and
`project.inlang/.gitignore`, which are third-party-tool-owned, not ours), breaking the
single-root-gitignore convention for no benefit — the root file remains the one place
a reviewer checks for "what's excluded and why."

### Drop the `gen:i18n` CLI prestep from `dev`/`build`
Remove `pnpm gen:i18n` from `apps/extension/package.json`'s `dev` and `build` scripts.
`paraglideVitePlugin` already compiles the same output on its own `buildStart` hook;
the CLI step was pure redundancy that happened to also be the thing introducing a
second, differently-configured compiler. **Alternative considered:** keep the CLI
step for symmetry/documentation clarity even though redundant. **Rejected**: it is the
literal mechanism of the drift bug being fixed; keeping a known-redundant step around
"for clarity" reintroduces the exact anti-pattern the docs research identified.

### `postinstall` script, scoped to `apps/extension/package.json`
Add `"postinstall": "pnpm gen:i18n"` to `apps/extension/package.json`. pnpm runs a
workspace package's own lifecycle scripts automatically after every `pnpm install`
(including CI's `pnpm install --frozen-lockfile`), so this seeds the directory once,
centrally, before any consumer (`typecheck`, `check`, or a human opening the repo)
needs it — closing D2's "clean checkout fails `pnpm typecheck`" concern without
prepending `gen:i18n` to every consuming script individually.
**Alternatives considered:** (a) a root-level `postinstall` fanning out via
`pnpm --filter @lunma/extension gen:i18n` — rejected, keeps the concern scoped to the
package that owns it, consistent with how `gen:icons`/`gen:app-icons` are already
package-local; (b) prepend `gen:i18n &&` to `typecheck` and `check` individually
instead of a postinstall hook — rejected, this is exactly the "script churn" D2 warned
about, multiplied across every current and future non-Vite consumer, versus one
centralized hook.
**Verify during implementation** (not assumed): that pnpm's lifecycle-script
execution for a *workspace-local* package's own `postinstall` is unaffected by the
newer pnpm "ignored build scripts" approval gate — that gate targets third-party
dependencies' install scripts, not the project's own workspace packages, but this
should be confirmed empirically (fresh install, clean `node_modules`) rather than
assumed from memory.

### Explicit `--output-structure`/`isServer` on both remaining producers
Pass `--output-structure message-modules --is-server "typeof window === 'undefined'"`
explicitly on `gen:i18n`'s CLI invocation, matching the `outputStructure`/`isServer`
already pinned in `vite.config.ts`'s `paraglideVitePlugin` call (added during this
investigation). Add a short comment at each call site cross-referencing the other, so
a future edit to one is more likely to prompt updating the other.
**Alternative considered:** leave both on their implicit defaults, now that nothing is
committed so a mismatch can no longer cause git noise. **Rejected**: a mismatch would
still cause the on-disk shape to change every time a developer switches between
`postinstall`-driven and `dev`/`build`/`test`-driven regeneration (e.g. IDE language
server re-indexing, redundant disk churn), and leaves both producers exposed to a
future `@inlang/paraglide-js` upgrade silently changing either side's default again —
explicit pins on both sides remove the reliance on upstream defaults staying in sync.

### `.gitattributes` cleanup
Remove the paraglide-specific `linguist-generated=true -diff` line (moot once nothing
is committed). Leave the `icon-loaders.generated.ts` line untouched — different risk
profile (single producer), still committed, unaffected by this change.

### Untracking mechanics
`git rm -r --cached apps/extension/src/shared/paraglide` lands in the same commit as
the `.gitignore` addition, so removal and the ignore rule take effect atomically —
avoids a window where the files are untracked but not yet ignored.

## Risks / Trade-offs

- **A `pnpm install --ignore-scripts` (or a pre-existing `node_modules` copied in
  without a real install) skips `postinstall`, so a cold `typecheck`/`check` fails
  with "Cannot find module" errors** → Mitigation: this matches the pre-existing
  implicit assumption that `pnpm install` runs normally; no current workflow uses
  `--ignore-scripts`. Document the dependency on `docs/tech-stack.md`'s i18n section
  so it's discoverable if it ever bites someone.
- **An editor's `svelte-check`/TS language server, opened before the first
  `postinstall` completes on a brand-new clone, shows transient "module not found"
  squiggles** → Mitigation: bounded to the (short) window between `pnpm install`
  starting and its `postinstall` step finishing; no worse than the existing
  requirement to run `pnpm install` before anything works at all.
- **Loses git history/blame on the generated files themselves** → Accepted: nobody
  debugs by blaming compiled JS; the real source of truth (`project.inlang`'s message
  files, and the `@inlang/paraglide-js` version pinned in `pnpm-lock.yaml`) stays
  fully committed, visible, and reviewable.
- **The two remaining producers (`gen:i18n` CLI via `postinstall`, and the Vite
  plugin) could still drift again if a future edit to one side's explicit flags isn't
  mirrored to the other** → Mitigation: cross-referencing comments at both call sites
  (see Decisions); no fully automatic guard is proposed here, since nothing is
  committed anymore, a re-drift would cause disk churn but not the git-noise/CI
  failures this change eliminates.
- **PRs that change translations lose the generated-JS diff** → Not a real loss:
  reviewers should judge translation changes from the actual source
  (`apps/extension/messages/{locale}.json`), which stays committed; the mechanical
  compiled-output diff was never meaningful to review.

## Migration Plan

1. Add the `.gitignore` entry (with comment) for
   `apps/extension/src/shared/paraglide/**`.
2. `git rm -r --cached apps/extension/src/shared/paraglide` in the same commit.
3. Remove the paraglide-specific line from `.gitattributes`.
4. Edit `apps/extension/package.json`: drop `gen:i18n` from `dev`/`build`; add the
   explicit `--output-structure`/`--is-server` flags to `gen:i18n`; add `postinstall`.
5. Confirm/finalize the `isServer`/`outputStructure` pins already applied to
   `vite.config.ts`'s `paraglideVitePlugin` call; add the cross-referencing comment.
6. Update `docs/tech-stack.md`, `docs/architecture.md`, and the `i18n` capability's
   delta spec (this change's `specs/i18n/spec.md`) to describe the generated runtime
   as gitignored-and-regenerated rather than committed.
7. Verify end-to-end: delete `node_modules` and the paraglide output, `pnpm install`,
   confirm `pnpm typecheck`/`pnpm check` pass with no further manual step; then
   `pnpm verify` (full green), `pnpm build`/`pnpm dev` smoke, `pnpm test:e2e`.
8. **Rollback**: revert the commit. Since the generated directory is fully
   reproducible from `project.inlang` plus the `@inlang/paraglide-js` version already
   pinned in `pnpm-lock.yaml`, re-establishing a committed baseline (if ever needed)
   is just `pnpm gen:i18n && git add -f apps/extension/src/shared/paraglide`.

## Open Questions

- **Does CI need an explicit `gen:i18n`/`build` step, or is the `postinstall` hook
  sufficient on its own?** `.github/workflows/ci.yml` already runs
  `pnpm install --frozen-lockfile` before each of the 5 extension matrix jobs
  (`typecheck`, `lint`, `check`, `lint:styles`, `test:run`), which should trigger the
  new `postinstall`. Recommend relying on that alone and confirming empirically during
  implementation (a real CI run, not just local simulation); add an explicit step only
  if that check fails.
- **Should the workspace root also gain a top-level `postinstall` fan-out** (e.g.
  `pnpm -r run gen:*`) instead of scoping this to `apps/extension`? Recommend keeping
  it scoped — `apps/extension` is the only package with a generated artifact consumed
  by a non-bundler-aware tool; `apps/site` and `packages/tokens` have no equivalent.
