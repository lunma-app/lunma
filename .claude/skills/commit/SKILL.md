---
name: commit
description: Create a git commit following Conventional Commits with a short subject and a one-paragraph "why" body. Use whenever the user asks to commit changes, stage and commit, or "make a commit".
license: MIT
metadata:
  author: lunma
  version: "1.0"
---

Create a single git commit that follows the project's commit conventions.

## The rules

A commit on this project has exactly two parts: a **subject line** and an optional **body**. Both are written for a future reader who is trying to answer "why did this change happen?", not "what does the code do?".

### Subject line — required

Format: `<type>(<scope>)?: <summary>` — Conventional Commits.

- Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`, `ci`, `perf`, `style`, `revert`.
- Scope is optional, lowercase, single word (e.g. `feat(sidebar): …`, `chore(devbox): …`). Omit it if the change touches multiple unrelated areas — that usually means it should be two commits.
- Summary: imperative mood ("add X", not "added X"), lowercase first letter, no trailing period.
- **Hard limit: 72 characters total.** Aim for ≤ 60. If you can't fit it, the commit is doing too much.

### Body — optional, at most one short paragraph

Include a body **only when the why is non-obvious from the subject**. If the subject already tells the story (e.g. `chore(deps): bump vite to 8.0.14`), skip the body.

When you do write one:

- **One paragraph.** Roughly 1–4 sentences. No bullet lists, no headers, no "Changes:" / "Files:" sections.
- **Explain why**, not what. The diff already shows what changed. The body answers: what problem did this solve, what constraint forced this choice, what alternative was rejected and why.
- Wrap at ~72 columns so it reads cleanly in `git log`.
- No file lists. No "this commit also …". If you're tempted to write that, split the commit.

### What NOT to do

- ❌ "Updated foo.ts to add a new method that handles X" — that's the diff.
- ❌ Bullet lists of every file touched.
- ❌ "Co-authored-by:" / "🤖 Generated with …" / any automated trailer unless the user explicitly asks for it.
- ❌ Multi-paragraph essays. If the reasoning needs that much room, it belongs in a PR description or a doc.

## Examples

Good — no body needed:
```
chore(devbox): pin nodejs to 24 with corepack
```

Good — body explains a non-obvious choice:
```
refactor(store): serialize dispatch through inFlight promise

Two chrome events firing concurrently were racing the reducer and
producing inconsistent spaces[]. Chaining off a single inFlight
promise costs nothing measurable and removes the entire class of
interleaving bugs without needing a separate queue abstraction.
```

Good — body justifies a version pin:
```
build: pin vite to 8.x and vitest to 4.x

Docs called for vite 7 / vitest 3, but those don't ship a working
build with @crxjs/vite-plugin 2.4 on node 24. Bumping to current
majors resolves the peer-dep conflict and unlocks the rolldown
backend that vite 8 uses by default.
```

Bad — explains what, not why:
```
feat: add new dispatch function

Added a dispatch function to store.ts. It takes an action and
calls the reducer, then persists state to chrome.storage.local
and broadcasts to other surfaces. Updated types.ts to export
the Action type union.
```

## Workflow

1. **Read the diff before drafting the message.** Run `git status` and `git diff --staged` (or `git diff` if nothing is staged yet). Understand the *intent* behind the changes, not just the lines.
2. **Check recent commits** with `git log --oneline -10` to match the project's tone and existing scopes.
3. **Pick the type and scope.** If you can't pick one because the diff spans unrelated concerns, stop and ask the user whether to split the commit.
4. **Draft the subject.** Confirm it's ≤ 72 chars and imperative mood.
5. **Decide if a body is needed.** Default to no. Add one only if the why isn't obvious from the subject + diff. Cap at one paragraph.
6. **Stage explicitly.** Prefer `git add <file> …` over `git add -A` / `git add .`. Never stage `.env`, credentials, or large binaries without confirming.
7. **Commit.** Use a HEREDOC for the message so the body's line breaks and wrapping are preserved:
   ```
   git commit -m "$(cat <<'EOF'
   <subject>

   <body if any>
   EOF
   )"
   ```
8. **Verify.** Run `git log -1 --stat` and show the result.

## Hard constraints (do not violate without explicit user permission)

- Never `--amend` a commit. If a hook fails, fix and create a new commit.
- Never `--no-verify`. If a pre-commit hook fails, surface the failure and let the user decide.
- Never push. Committing and pushing are separate actions.
- Never add `Co-Authored-By:` or generation trailers unless the user asks.
- If the working tree has no changes, say so and stop — do not create an empty commit.
