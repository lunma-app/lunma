# Lunma — agent instructions

Lunma is an Arc-style vertical-workspace Chrome MV3 extension.
Stack (pinned in [docs/tech-stack.md](docs/tech-stack.md); don't add
alternatives without proposing a change): TypeScript strict, Svelte 5 (runes),
Vite 8, Vitest 4, Biome 2, Stylelint 17, Zod 4, @crxjs/vite-plugin, pnpm,
devbox, Node 24. The repo is a **pnpm workspace** — `apps/extension` (the
extension), `apps/site` (the marketing landing page; SvelteKit +
`adapter-static`, build-time only, nothing ships in the extension bundle), and
`packages/tokens` (`@lunma/tokens`, the shared CSS-only design language).

Target architecture lives in [docs/tech-stack.md](docs/tech-stack.md) and
[docs/architecture.md](docs/architecture.md), the OpenSpec specs under
[openspec/specs/](openspec/specs/), and in-flight changes under
[openspec/changes/](openspec/changes/). Code, docs, and OpenSpec artifacts stay
in lockstep — neither leads the other silently.

## Architecture (one-way import DAG)

The extension's `apps/extension/src/` layers and who may import whom — enforced
by Biome (`noRestrictedImports` + `noImportCycles`), so a violation fails
`biome check`:

- `shared/` — foundation (types, Zod schemas + migrations, store, message bus).
  Imports nothing else in `apps/extension/src/`.
- `ui/` — cross-surface primitives. Imports `shared` only; design tokens come
  from the `@lunma/tokens` package (a CSS import, not a TS module edge).
- `background/` — service worker / event coordinator. Imports `shared`
  (+ `launcher/shared` for the search engine). No DOM, no surfaces.
- `sidebar/`, `options/`, `launcher/` — UI surfaces. Import `ui` + `shared`
  (launcher may use its own `launcher/shared`). Compose primitives.
- `content/` — vanilla content scripts. Import `shared` only.

**Workspace boundary:** `apps/site` and `apps/extension` must NOT import each
other (gated both ways by Biome); `@lunma/tokens` (`packages/tokens`) is CSS-only
(tokens + fonts + aurora/glass/glow recipes), with no JS/TS, so it sits outside
the import DAG. Both apps depend on it via `workspace:*`.

See [docs/architecture.md](docs/architecture.md) and the
`architecture-integrity` capability.

## Quality gates

Before marking a task `[x]` or proposing a commit — `pnpm verify` at the
workspace root runs `pnpm -r verify`, fanning out to every package:

- **`apps/extension`** (`pnpm --filter @lunma/extension verify`): `tsc --noEmit`,
  `biome check src` (also enforces the layer DAG + import-cycle rules + the
  cross-app guard), `svelte-check` (`.svelte` type coverage `tsc --noEmit`
  cannot see — template bindings, component prop contracts), `lint:styles`
  (`stylelint 'src/**/*.{svelte,css}'`, the token/primitive contract for
  `apps/extension/src/ui`), `vitest run`.
- **`apps/site`** (`pnpm --filter @lunma/site verify`): `biome check src`,
  `svelte-check`, the automated WCAG-AA contrast test (`vitest run`), and the
  static prerender `build`.
- Any roadmap exit criterion in the change's `tasks.md` for the current section
  (e.g. ≥90% branch coverage for the store).

Run `pnpm test:e2e` (root, delegates to the extension) for the Playwright smoke.

## Git commits

Always use `git commit -s` (or `--signoff`). The DCO check is a required PR
status check — any commit without `Signed-off-by: Name <email>` will fail it.
The `prepare-commit-msg` hook auto-appends the trailer as a fallback, but `-s`
is the authoritative signal.

## OpenSpec workflow

Non-trivial changes go through the `openspec-*` skills — they inject the full
workflow. Hard constraints: never hand-edit `openspec/specs/` (only archiving a
change may update them); never modify `openspec/changes/archive/**` (hook
enforced).

## Binding policies (apply at all times, not just authoring)

- **User value (Phase 2+).** Every change delivers user-visible value, or is the
  smallest plumbing for a *named* upcoming change — no stranded infrastructure.
  The proposal's `## Why` opens with that value/consumer.
- **Visual quality.** User-visible surfaces (sidebar, launcher, new-tab,
  options, onboarding) land at a high bar from first sight — Arc's vertical
  workspace pushed immersive/colour-forward: frosted-glass panels, aurora
  backdrop, hue glow, 150–250ms motion, Instrument Serif + Mona Sans.
  Reduced-motion + WCAG-AA hold at every Colour-intensity level. Every change
  shipping a surface carries a `Visual language` section in its `design.md`.
- **Component library.** Build primitives, compose features. Primitives live in
  `apps/extension/src/ui/` and reference the `@lunma/tokens` design tokens; they
  never hard-code design values. Feature components compose primitives and never
  re-roll buttons/tooltips/tiles or reach past primitives to tokens. A change
  adding a feature component either composes existing primitives or ships the new
  ones it needs, in the same change. The marketing site (`apps/site`) composes
  the shared `@lunma/tokens` tokens/recipes directly — it does not reach into the
  extension's `ui/` primitives.

## Policy on deviations and drift (binding, every task/commit)

1. **No silent deviations.** Any deviation from proposal/design/specs found or
   introduced during implementation — new fields, methods, files, dependencies,
   behaviours, or renames of anything the artifacts name — MUST be raised and
   explicitly agreed via AskUserQuestion BEFORE it is committed. "Reasonable
   defaults" do not override this. Silence is not consent.
2. **Doc updates are mandatory.** An agreed deviation updates, in the same
   change: the affected [docs/](docs/) files, the
   `openspec/changes/<change>/{proposal,design,specs,tasks}.md` artifacts, and
   any matching [openspec/specs/](openspec/specs/) spec. Not deferrable — a
   change is not complete while docs/artifacts disagree with code.
3. **Names are normative.** File paths, type/method/field names in artifacts or
   docs are binding. If implementation needs a different name, update the
   artifact + docs in the same change — not the code as de-facto truth.
4. **Even tiny deviations get surfaced.** When forced by a strict TS rule,
   Svelte's compiler, or the toolchain, still surface it briefly first — a
   one-line "I had to do X because Y, ok?" is enough.
