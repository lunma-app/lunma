## Context

Three surfaces render the same lenses and each maintains its own copy of the
pure helpers that map a resolved source to a section identity, an icon, and a
label. Because the import DAG forbids `launcher/` and `sidebar/` from importing
each other (and forbids them importing `background/`), the only shared home is
`shared/` (imports nothing else in `src/`) or `ui/` (presentational, imports
`shared/`). The helpers in question are pure TS with no DOM, so `shared/` is the
correct home.

Current copies (verified on `main` @ `f9b06ed`):

- `sourceKey` — `background/lenses.ts:53`, `sidebar/Lens.svelte:89`,
  `launcher/lenspage/overview-vm.ts:45`. The SW and sidebar bodies are identical
  (`new URL(baseUrl).host`); the overview-vm body **drifted** to
  `hostOf(baseUrl)` (= `new URL(baseUrl).hostname`), dropping the port and
  degrading to `''` on a parse failure instead of throwing.
- `hostOf` — already exported from `shared/label-for.ts:23`, but re-declared at
  `launcher/lenspage/overview-vm.ts:36`.
- `ICON_BY_SOURCE` + `filterLabel` — `sidebar/LensSectionHeader.svelte:21,30`.
- Relation labels/order (`Relation`, `RELATION_ORDER`, `relationFor`,
  `QUERY_LABEL`) — `overview-vm.ts:~217,255`. These are overview-only triage
  concepts with no sidebar counterpart; not duplicated.

This change rides on top of `sources-redesign` (implemented in code, pending
archive). It touches the lens surfaces that change introduced but none of its
unarchived artifacts.

## Goals / Non-Goals

**Goals:**
- One canonical `sourceKey` so section identity is byte-identical across the SW,
  sidebar, and overview page — fixing the self-hosted-port / malformed-URL drift.
- A single home (`shared/lens-labels.ts`) for the duplicated pure lens helpers,
  so they cannot silently re-diverge.
- Behaviour-preserving for everything except the `sourceKey` fix.

**Non-Goals:**
- Extracting shared *presentational* primitives (`LensItem`, `LensStateRows`,
  `ReadingControls`, `Card`, `StatusPill`). The two surfaces' rendering has
  legitimately diverged post-`sources-redesign`; the sidebar's calm states and
  reading controls are not duplicated on the overview. Forcing a shared
  component layer here would invent duplication that does not exist.
- Moving overview-only triage logic (relations) into `shared/`.
- Any schema, migration, bus, connector, or visual change.

## Decisions

**D1 — Canonical `sourceKey` keeps the port (the SW/sidebar definition wins).**
The service worker is the single writer that drains results into sections keyed
by `sourceKey`; the renderers must match the writer. The SW/sidebar form
(`new URL(baseUrl).host`) is therefore canonical, and the overview page is
brought into line. *Alternative considered:* adopt the port-stripped `hostOf`
form everywhere — rejected, because it would change the key the SW already
drains under (a behavioural change to the writer to accommodate a reader), and
would also collapse two self-hosted instances that differ only by port into one
section. Keeping the writer's form is the minimal, correct fix.

**D2 — Home is `shared/lens-labels.ts`, a new module.** The helpers are pure and
cross-surface. `shared/label-for.ts` already holds `hostOf`/`labelFor`; the lens
helpers are a distinct concern (section identity + lens iconography/labels), so a
dedicated `lens-labels.ts` reads better than overloading `label-for.ts`. It
re-exports (or callers import directly) `hostOf` from `label-for.ts` so there is
still exactly one `hostOf`. *Alternative:* fold everything into `label-for.ts` —
rejected for cohesion (label-for is about tab-row labels, not lenses).

**D3 — Malformed-URL handling lives once.** `new URL(baseUrl)` throws on a bad
URL. The canonical `sourceKey` handles this in one place (degrading to the raw
`baseUrl` string for the host segment) so a malformed self-hosted entry yields a
stable, identical key on every surface rather than throwing on two surfaces and
returning `''` on the third.

**D4 — `background/lenses.ts` imports the shared helper.** `background/` may
import `shared/`. Its `sourceKey` export is replaced by a re-export-or-import
from `shared/lens-labels.ts` so existing background callers are unaffected.

## Risks / Trade-offs

- **[A surface relied on the drifted overview key]** → The overview currently
  keys without the port; if any persisted-but-ephemeral state (e.g. a
  collapsed-section set) was written under the old overview key, it resets once.
  Mitigation: section collapse state is sidebar-local and per-window
  (`collapsedLensSectionsByWindow`), and the sidebar already uses the
  port-bearing key — so the overview never wrote the divergent key into shared
  state. The fix only affects in-memory section matching; no persisted reset.
- **[Test churn]** → `overview-vm.test.ts` and `LensSectionHeader.test.ts`
  assert the local helpers. Mitigation: update them to import from
  `shared/lens-labels.ts`; add `lens-labels.test.ts` covering cloud,
  self-hosted-with-port, and malformed-URL parity as the new source of truth.
- **[Re-divergence later]** → Nothing mechanically stops a fourth copy. Accepted:
  the consolidation + a parity test is the practical guard; a lint rule is
  out of scope.

## Migration Plan

No data migration (section keys are ephemeral). Rollout is a pure refactor +
one-line behavioural fix landed atomically. Rollback = revert the change; the
three copies return. No deploy ordering constraints beyond landing after
`sources-redesign` (already in code).

## Open Questions

None.
