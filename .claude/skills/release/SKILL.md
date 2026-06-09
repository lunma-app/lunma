---
name: release
description: Build, verify, and package the Lunma extension into a versioned zip
  of dist/ for Chrome Web Store upload. User-triggered only.
disable-model-invocation: true
argument-hint: "[--skip-verify]"
allowed-tools: Bash(git status*) Bash(pnpm verify) Bash(pnpm --filter *) Bash(node -p *) Bash(mkdir -p release) Bash(zip *) Bash(cd apps/extension/dist*)
---
Package a release of the Lunma Chrome extension.

1. Confirm a clean tree (`git status --short`). If dirty, stop and report —
   releases are cut from committed code.
2. Unless `$ARGUMENTS` contains `--skip-verify`, run `pnpm verify`; abort on any
   failure (type-check, Biome + layer DAG, Stylelint, Vitest).
3. Build: `pnpm --filter @lunma/extension build` (outputs to `apps/extension/dist/`).
4. Read the version: `node -p "require('./apps/extension/public/manifest.json').version"`.
5. Zip from inside `apps/extension/dist/` so `manifest.json` sits at the archive root (the Web
   Store requires this):
   `mkdir -p release && (cd apps/extension/dist && zip -r -X "../../../release/lunma-<version>.zip" .)`
6. Report the artifact path, version, and size. If the version is still `0.0.0`,
   remind me to bump `public/manifest.json` before a real release.
