# Comments, TODOs, and FIXMEs

Applies to all source in the repo (TypeScript, Svelte, CSS, shell, config).
Markdown and design artifacts are exempt — prose lives there by design. If code
diverges from this rule, code wins — update the rule.

## TODO / FIXME / XXX / HACK

Don't add them without explicit confirmation.

When a task — including a task that came from a spec or design doc — asks for a
TODO, stop and surface the choice via **AskUserQuestion** before writing it. Lay
out the options with pros/cons:

- **Do the work now.** Lift, refactor, or implement what the TODO would defer.
  Pro: the code is done; no follow-up debt. Con: the task may grow in scope.
- **Skip the marker; record the rationale in design.md.** Capture the "we
  considered this; chose to defer" decision in the change's design log instead
  of in source. Pro: the rationale survives in the change history. Con: future
  readers of the inlined code won't see the cross-reference.
- **Keep the marker, with a tracking issue.** Add the TODO only if it's tied to
  a tracked issue or ADR (e.g. `// TODO(#123): …`). Pro: visible in code AND
  tracked elsewhere. Con: only justified when the deferral is a real follow-up,
  not a vague "someday."

The default is "do the work now." TODOs accumulate; tracked issues don't.

## Code comments

Default: no comment. Only add one when the WHY is non-obvious — a hidden
constraint, a subtle invariant (e.g. why dispatch is serialized), a workaround
for a specific Chrome/Svelte/toolchain bug, behaviour that would surprise a
reader. If removing the comment wouldn't confuse a future reader, don't write
it.

Never write:

- A comment that restates WHAT the code does. Well-named identifiers already do
  that.
- A reference to the current task, PR, change, or caller (`// used by X`,
  `// added for the Y flow`, `// handles the case from change Z`). Those belong
  in the commit/PR/design.md and rot as the codebase evolves.
- Multi-paragraph docstrings. Keep it to one short line. Use a separate doc
  artifact (docs/architecture.md, an ADR, the change's design.md) for longer
  prose.
- Decorative banners (`// ───`, `// ===`) outside top-of-file section dividers
  that already exist in the codebase.

## Acceptable comments

- A single-line note explaining a non-obvious invariant, a workaround tied to an
  external bug, or a security/concurrency subtlety.
- A one-line note on a Zod migration explaining why a stored shape changed.

This overlaps the `code-quality` dimension of the `repo-review` workflow and the
global comment policy — it is the repo-local, always-injected version.
