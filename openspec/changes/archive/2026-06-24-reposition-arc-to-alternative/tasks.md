## 1. Marketing site SEO title

- [x] 1.1 In `apps/site/src/lib/seo.ts`, change `SITE_TITLE` from `Lunma — Arc-style Spaces & vertical tabs for Chrome` to `Lunma — Arc alternative: vertical tabs & Spaces for Chrome`.
- [x] 1.2 Leave `SITE_DESCRIPTION` and both Arc/Arcify FAQ entries unchanged; confirm no other `seo.ts` string says "Arc-style".

## 2. Self-definition docs

- [x] 2.1 In `CLAUDE.md` line 3, change `Lunma is an Arc-style vertical-workspace Chrome MV3 extension.` to `Lunma is a vertical-workspace Chrome MV3 extension (the Spaces / vertical-tabs pattern Arc popularised).`
- [x] 2.2 In `README.md` line 11, replace `A Chrome Manifest V3 extension with an Arc-style vertical workspace for tabs:` with a lead-with-Lunma rewrite that keeps one Arc reference: `A Chrome Manifest V3 extension that gives every project its own colour-coded vertical workspace — the Spaces pattern Arc popularised, brought to the browser you already use:`
- [x] 2.3 Confirm `CLAUDE.md` line 81 ("Arc's vertical" visual bar), the README Arcify credit, and all code/comment/ADR Arc references are left untouched (out of scope).

## 3. External: GitHub repo description

- [x] 3.1 Run `gh repo edit --description "Vertical tabs & colour-coded Spaces for Chrome — open source, fully local. An Arc alternative."` (manual, out-of-repo step — not gated by `pnpm verify`).

## 4. Verify

- [x] 4.1 Run the `apps/site` gate: `pnpm --filter @lunma/site verify` (biome, svelte-check, WCAG-AA contrast test, static prerender build). Confirm the regenerated `apps/site/build/*.html` carry the new `<title>` and no hand-editing of generated files occurred.
- [x] 4.2 Run `pnpm verify` at the workspace root to confirm nothing else regressed.
- [x] 4.3 Archive the change so the `marketing-site` spec delta applies to `openspec/specs/marketing-site/spec.md` (via `openspec-archive-change`).
