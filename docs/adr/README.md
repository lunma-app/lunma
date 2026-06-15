# Architecture Decision Records

ADRs record Lunma's durable architecture decisions — the choices that are costly to reverse later. They are a curated set, not a log: a decision that has been reversed, or that is cheap to change, does not get an ADR, and is removed if it stops holding. Each ADR captures the decision, why it was made, the alternatives, and what it commits the project to.

Capability specs under `openspec/specs/<capability>/spec.md` are the other half of the picture: normative, verifiable contracts about how the current code behaves. ADRs explain durable structure and rationale; specs define current behavior.

## Spec vs ADR

| | Capability spec | ADR |
|---|---|---|
| Lives under | `openspec/specs/<capability>/spec.md` | `docs/adr/NNNN-<title>.md` |
| Defines | current behavior the code must obey | a durable architecture decision and its rationale |
| Language | SHALL-language requirements + `#### Scenario:` blocks | prose: context, decision, alternatives, consequences |
| Verifiable today | yes — drift is a bug | no — it is the reasoning behind the structure |
| Produced by | archiving an OpenSpec change whose delta adds, modifies, or removes requirements | recording a decision that shapes the architecture |

If a developer would expect the current code to obey it, it belongs in a capability spec — never hand-edit `openspec/specs/`; propose a change whose delta defines it. If they would read it to understand why the architecture is shaped a certain way, it is an ADR.

## Keeping the set lean

ADRs are curated to durable decisions. When a decision changes, update its ADR in place or remove it: the set reflects what holds today, not the history of how it got there. Capability specs and the OpenSpec change archive carry the development history; ADRs do not duplicate it.

## Index

| # | Decision |
|---|---|
| 0001 | [Lunma owns its state — local-first, no bookmark backing](0001-drop-bookmark-backing.md) |
| 0002 | [Spaces materialize as Chrome tab groups](0002-tab-group-materialization.md) |
| 0003 | [Per-window tab bindings](0003-per-window-tab-bindings.md) |
| 0004 | [pnpm workspace and the marketing site](0004-workspace-and-marketing-site.md) |

## Format

```markdown
# NNNN — <Title>

- **Status:** Accepted
- **Date:** YYYY-MM-DD

## Context

The situation, the forces at play, the constraints.

## Decision

What was decided.

## Alternatives considered

What else was on the table, and why it lost.

## Consequences

What this commits the project to, and what it forecloses.
```
