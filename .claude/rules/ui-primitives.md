---
paths:
  - "src/ui/**"
---
# src/ui primitive + token contract

- Primitives reference design tokens from `src/ui/tokens.css` (CSS custom
  properties). Do NOT hard-code design values — no raw font sizes, z-index,
  focus-ring geometry, press-scale transforms, or control heights. Stylelint
  (`pnpm lint:styles`) fails on raw `font-size`/`z-index` here.
- `src/ui` may import `shared` only — never a surface (`sidebar`, `launcher`,
  `options`, `background`, `content`). Biome enforces this.
- A new primitive ships with its test harness (`*.test.harness.svelte`) and
  `*.test.ts`, matching existing primitives (e.g. `Button`, `IconButton`,
  `FaviconTile`).
- Primitives are the contract for feature components; keep props minimal and
  composable rather than surface-specific.
