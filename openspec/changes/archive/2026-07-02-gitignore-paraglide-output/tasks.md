## 1. Git tracking and ignore rules

- [x] 1.1 Add `apps/extension/src/shared/paraglide/**` to the root `.gitignore`, with a comment explaining what regenerates it and when (mirroring the existing `derived-controls.generated.ts` entry's style).
- [x] 1.2 `git rm -r --cached apps/extension/src/shared/paraglide` so the files are untracked but remain on disk, landing in the same commit as 1.1.
- [x] 1.3 Remove the paraglide-specific `linguist-generated=true -diff` line from `.gitattributes`; leave the `icon-loaders.generated.ts` line untouched.

## 2. Build scripts

- [x] 2.1 Remove the `gen:i18n` prestep from `apps/extension/package.json`'s `dev` and `build` scripts (the Vite plugin already compiles on its own `buildStart` hook).
- [x] 2.2 Add explicit `--output-structure message-modules --is-server "typeof window === 'undefined'"` flags to the `gen:i18n` script, matching `vite.config.ts`'s pins.
- [x] 2.3 Add a `postinstall` script to `apps/extension/package.json` running `pnpm gen:i18n`.

## 3. Vite config

- [x] 3.1 Confirm the `isServer`/`outputStructure` pins already applied to `vite.config.ts`'s `paraglideVitePlugin` call remain in place, matching 2.2 exactly.
- [x] 3.2 Add a short comment at both the `gen:i18n` script (package.json) and the `paraglideVitePlugin` config (vite.config.ts) cross-referencing each other, so a future edit to one prompts checking the other.

## 4. Docs and specs

- [x] 4.1 Update `docs/tech-stack.md`'s two mentions of the paraglide output being "committed" to describe it as gitignored and regenerated via the Vite plugin / `postinstall`.
- [x] 4.2 Update `docs/architecture.md`'s source-tree diagram line and its two prose mentions the same way.
- [x] 4.3 Confirm this change's `specs/i18n/spec.md` delta (already drafted) matches the final implementation before archiving.

## 5. Verification

- [x] 5.1 Simulate a clean checkout: delete `node_modules` and `apps/extension/src/shared/paraglide`, run `pnpm install`, and confirm the `postinstall` hook regenerates the directory without any further manual step.
- [x] 5.2 Confirm `pnpm typecheck` and `pnpm check` (svelte-check) pass immediately after that `pnpm install`, with no separate `gen:i18n` invocation.
- [x] 5.3 Run `pnpm verify` (workspace root) and confirm it is fully green.
- [x] 5.4 Run `pnpm --filter @lunma/extension dev` and `pnpm --filter @lunma/extension build` and confirm both work with `gen:i18n` no longer in their script chain, and that `git status` reports no changes under `apps/extension/src/shared/paraglide/` afterward.
- [x] 5.5 Run `pnpm test:e2e` and confirm the Playwright smoke still passes.
- [x] 5.6 Confirm (empirically, e.g. by inspecting a real or simulated CI run) that CI's `pnpm install --frozen-lockfile` step triggers the new `postinstall` before each of the 5 extension matrix jobs, per design.md's Open Questions; if it does not, raise this with the user before adding any CI workflow change (not assumed by this task list).
