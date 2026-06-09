# Architecture Decision Records

This directory holds Lunma's ADRs — kept design decisions about capabilities
that are not yet implemented (or about cross-cutting concerns that don't
belong to a single capability spec). ADRs are point-in-time decisions with
rationale and alternatives; capability specs are normative contracts about
behavior the current code obeys.

OpenSpec capability specs are never written directly. They are produced by
proposing OpenSpec changes whose `specs/<capability>/spec.md` deltas add,
modify, or remove requirements; archiving the change applies the delta to
`openspec/specs/<capability>/spec.md`. ADRs sit upstream of that workflow —
they capture decisions that will later be turned into spec deltas by a real
change.

## Spec vs ADR

| | OpenSpec spec | ADR |
|---|---|---|
| Lives under | `openspec/specs/<capability>/spec.md` | `docs/adr/NNNN-<title>.md` |
| Produced when | an OpenSpec change is archived whose delta adds/modifies/removes requirements for the capability | a design decision is made ahead of implementation |
| Edited how | never directly — only by archiving a new change with a delta | never (accepted ADRs are immutable; supersede with a new ADR) |
| Language | SHALL-language requirements + `#### Scenario:` blocks | prose: context, decision, alternatives, consequences |
| Verifiable today? | Yes — drift is a bug | No — it's a kept promise about future work |

When in doubt: if a developer reading the document would expect the *current*
codebase to obey it, the content belongs in a capability spec — propose a
change whose delta defines it. If they'd read it to understand *why* a
future capability will be shaped a certain way, write an ADR.

## Workflow

1. **Capturing a decision ahead of time** — write an ADR. The implementing
   phase's OpenSpec change later turns the ADR's decisions into spec
   requirements via its `specs/<capability>/spec.md` delta; archiving the
   change produces the living spec. The change's `proposal.md` /
   `design.md` should cite the ADR for rationale.
2. **Superseding an ADR** — never edit an accepted ADR. Write a new ADR that
   says "supersedes ADR NNNN" and update the index below.
3. **Data shape now, behavior later** — when ahead-of-time work touches the
   data model (e.g. adding a field to `AppState`), the data-shape requirement
   belongs in the appropriate **capability spec today** (usually
   `storage-and-migrations`) — propose a change whose delta adds the
   requirement, archive it. The surrounding behavior can still be captured
   as an ADR until the implementing phase's change defines it.

## Index

| # | Title | Status | Supersedes |
|---|---|---|---|
| 0001 | [Launcher v1 shape](0001-launcher-v1-shape.md) | Accepted | — |
| 0002 | [Auto-archive v1 shape](0002-auto-archive-v1-shape.md) | Accepted | — |
| 0003 | [Sidebar drag-and-drop library](0003-sidebar-dnd-library.md) | Superseded by 0006 | — |
| 0004 | [Lucide Svelte icons](0004-lucide-svelte-icons.md) | Accepted | — |
| 0005 | [Drop bookmark backing](0005-drop-bookmark-backing.md) | Accepted | — |
| 0006 | [Custom sidebar pointer-drag](0006-custom-sidebar-drag.md) | Accepted | 0003 |
| 0007 | [Tab-group materialization of Spaces](0007-tab-group-materialization.md) | Accepted | — |
| 0008 | [Pinned-tab domain boundary](0008-pinned-tab-domain-boundary.md) | Accepted | — |
| 0009 | [Per-window tab bindings](0009-per-window-tab-bindings.md) | Accepted | — |
| 0010 | [Favicon row v1 shape](0010-favicon-row-v1-shape.md) | Accepted | 0009 |
| 0011 | [Auto-archive restore + full loop](0011-auto-archive-restore-and-full-loop.md) | Accepted | 0002 (in part) |
| 0012 | [pnpm workspace + the marketing site](0012-workspace-and-marketing-site.md) | Accepted | — |

## Format

Use the following template for new ADRs:

```markdown
# NNNN — <Title>

- **Status:** Proposed | Accepted | Superseded by ADR-NNNN
- **Date:** YYYY-MM-DD
- **Implementing phase:** Phase N (see docs/05-roadmap.md)

## Context

What is the situation? What forces are at play? What constraints apply?

## Decision

What was decided. Stated as a list of normative-ish bullets, but understand
these aren't SHALL-language contracts — they're a kept promise.

## Alternatives considered

What else was on the table and why it was rejected.

## Consequences

What does this commit us to? What does it foreclose? What does the
implementing phase have to do to satisfy this ADR?
```
