---
paths:
  - "openspec/**"
---
# OpenSpec artifact conventions

- Capability specs at `openspec/specs/<capability>/spec.md` are NEVER
  hand-edited. They change only when a change is archived (its
  `specs/<capability>/spec.md` delta is applied). To change a living spec,
  propose a new change.
- Spec deltas in a change use `## ADDED Requirements`, `## MODIFIED
  Requirements`, or `## REMOVED Requirements` blocks; requirements are normative
  and written as Given/When/Then scenarios.
- `openspec/changes/archive/**` is immutable — never edit archived changes (a
  PreToolUse hook blocks it).
- Keep `tasks.md` checkboxes current as you implement. Any deviation from
  proposal/design/specs requires user agreement AND same-change updates to the
  artifact plus any affected `docs/` file (CLAUDE.md deviation policy).
- There is no `openspec` CLI installed here; the workflow runs through the
  `openspec-*` skills.
