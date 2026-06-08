# Lunma — agent instructions

Lunma is an Arc-style vertical-workspace Chrome MV3 extension.
Stack (pinned in [docs/02-tech-stack.md](docs/02-tech-stack.md); don't add
alternatives without proposing a change): TypeScript strict, Svelte 5 (runes),
Vite 8, Vitest 4, Biome 2, Stylelint 17, Zod 4, @crxjs/vite-plugin, pnpm,
devbox, Node 24.

Target architecture lives in [docs/01-vision.md](docs/01-vision.md) through
[docs/06-migration.md](docs/06-migration.md), the OpenSpec specs under
[openspec/specs/](openspec/specs/), and in-flight changes under
[openspec/changes/](openspec/changes/). Code, docs, and OpenSpec artifacts stay
in lockstep — neither leads the other silently.

## Architecture (one-way import DAG)

`src/` layers and who may import whom — enforced by Biome (`noRestrictedImports`
+ `noImportCycles`), so a violation fails `biome check`:

- `shared/` — foundation (types, Zod schemas + migrations, store, message bus).
  Imports nothing else in `src/`.
- `ui/` — cross-surface primitives + design tokens (`src/ui/tokens.css`).
  Imports `shared` only.
- `background/` — service worker / event coordinator. Imports `shared`
  (+ `launcher/shared` for the search engine). No DOM, no surfaces.
- `sidebar/`, `options/`, `launcher/` — UI surfaces. Import `ui` + `shared`
  (launcher may use its own `launcher/shared`). Compose primitives.
- `content/` — vanilla content scripts. Import `shared` only.

See [docs/03-architecture.md](docs/03-architecture.md) and the
`architecture-integrity` capability.

## Quality gates

Before marking a task `[x]` or proposing a commit — `pnpm verify` runs all:

- `pnpm exec tsc --noEmit` — clean.
- `pnpm exec biome check src tests` — clean (also enforces the layer DAG +
  import-cycle rules).
- `pnpm lint:styles` (`stylelint 'src/**/*.{svelte,css}'`) — clean (the
  token/primitive CSS contract for `src/ui`).
- `pnpm exec vitest run` — green.
- Any roadmap exit criterion in the change's `tasks.md` for the current section
  (e.g. ≥90% branch coverage for the store).

## OpenSpec workflow

- Non-trivial changes start with the `openspec-propose` skill
  (`openspec-explore` first if requirements are unclear); implement only via
  `openspec-apply-change` against an active change in `openspec/changes/`.
- Re-read the change's `proposal.md`, `design.md`, `specs/`, and `tasks.md`
  before applying tasks; keep `tasks.md` checkboxes current as you go.
- Capability specs under `openspec/specs/` are NEVER hand-edited — they change
  only by archiving a change (its `specs/` delta applies). Propose a new change
  instead of patching a living spec.
- Never modify `openspec/changes/archive/**` (a hook enforces this).
- Spec-authoring policy (the full user-value, visual-quality, component-library,
  and deviation text) lives in [openspec/config.yaml](openspec/config.yaml)
  `context:` + per-artifact `rules:`, injected when creating artifacts — not
  restated here.

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
  `src/ui/` and reference tokens in `src/ui/tokens.css`; they never hard-code
  design values. Feature components compose primitives and never re-roll
  buttons/tooltips/tiles or reach past primitives to tokens. A change adding a
  feature component either composes existing primitives or ships the new ones it
  needs, in the same change.

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
