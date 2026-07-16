---
name: openspec-archive-change
description: Archive a completed change in the experimental workflow. Use when the user wants to finalize and archive a change after implementation is complete.
allowed-tools: Bash(openspec:*)
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.1"
  generatedBy: "1.6.0"
---

> **Local patch — steps 4-6 diverge from the generated upstream skill.** As
> shipped (verified in 1.3.1 and 1.6.0), this skill never invokes
> `openspec archive`: it hand-rolls the archive with `mv` and routes spec-syncing
> to an `openspec-sync-specs` skill its own generator does not produce. Followed
> literally it archives a change while leaving `openspec/specs/` describing
> behaviour the code no longer has — and its only escape is hand-editing main
> specs, which `.claude/rules/openspec-deltas.md` forbids. Upstream:
> [#863](https://github.com/Fission-AI/OpenSpec/issues/863) (open since Mar 2026),
> [#913](https://github.com/Fission-AI/OpenSpec/issues/913). Re-running
> `openspec init --force` reverts this patch; `openspec update` does not. Drop the
> patch once upstream lands a version that drives the CLI.

Archive a completed change in the experimental workflow.

**Store selection:** If the user names a store (a store is a standalone OpenSpec repo registered on this machine) or the work lives in one, run `openspec store list --json` to discover registered store ids, then pass `--store <id>` on the commands that read or write specs and changes (`new change`, `status`, `instructions`, `list`, `show`, `validate`, `archive`, `doctor`, `context`). Other commands do not take the flag. Hints printed by commands already carry the flag; keep it on follow-ups. Without a store, commands act on the nearest local `openspec/` root.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   Run `openspec list --json` to get available changes. Use the **AskUserQuestion tool** to let the user select.

   Show only active changes (not already archived).
   Include the schema used for each change if available.

   **IMPORTANT**: Do NOT guess or auto-select a change. Always let the user choose.

2. **Check artifact completion status**

   Run `openspec status --change "<name>" --json` to check artifact completion.

   Parse the JSON to understand:
   - `schemaName`: The workflow being used
   - `planningHome`, `changeRoot`, `artifactPaths`, and `actionContext`: path and scope context
   - `artifacts`: List of artifacts with their status (`done` or other)

   **If any artifacts are not `done`:**
   - Display warning listing incomplete artifacts
   - Use **AskUserQuestion tool** to confirm user wants to proceed
   - Proceed if user confirms

3. **Check task completion status**

   Read the tasks file (typically `tasks.md`) to check for incomplete tasks.

   Count tasks marked with `- [ ]` (incomplete) vs `- [x]` (complete).

   **If incomplete tasks found:**
   - Display warning showing count of incomplete tasks
   - Use **AskUserQuestion tool** to confirm user wants to proceed
   - Proceed if user confirms

   **If no tasks file exists:** Proceed without task-related warning.

4. **Note which capabilities the archive will touch**

   Use `artifactPaths.specs.existingOutputPaths` from the status JSON to list the
   delta specs. Name the capabilities so the user knows which main specs the CLI
   is about to update — this is information, not a decision point. Do NOT compare
   deltas against main specs by hand and do NOT ask the user whether to "sync":
   step 5 applies the deltas, and applying them is the whole point of archiving.

   A change with no delta specs (infrastructure, tooling, doc-only) archives with
   `--skip-specs` in step 5.

5. **Perform the archive**

   `openspec archive` is the ONLY sanctioned way to update main specs. It applies
   each delta to `openspec/specs/<capability>/spec.md`, moves the change to
   `openspec/changes/archive/YYYY-MM-DD-<name>/` (creating the directory and
   dating the name itself), and validates the result.

   ```bash
   openspec archive <name> -y
   ```

   For a change with no delta specs:

   ```bash
   openspec archive <name> -y --skip-specs
   ```

   Read the output. It reports the applied operations per capability
   (`+ added, ~ modified, - removed, → renamed`) and the archived directory name.

   **Never** `mv` the change directory by hand, and **never** hand-edit a file
   under `openspec/specs/` — `CLAUDE.md` and `.claude/rules/openspec-deltas.md`
   both bind: main specs change ONLY through this command. A raw `mv` archives the
   change while leaving the main specs describing behaviour the code no longer
   has, which is exactly the drift the workflow exists to prevent.

   **If the command fails**, report the error and stop. Do not fall back to moving
   files or editing specs manually.

   **Known 1.6.0 strictness — scenario renames abort the archive.** A `MODIFIED`
   block that renames a scenario trips:

   > `current spec contains scenario(s) not present in the modified block: "<old name>". Refresh the change spec before archiving to avoid dropping scenarios.`

   The guard exists to catch a real hazard (a `MODIFIED` block that silently drops
   scenarios), but it cannot tell an intentional rename from an accidental
   omission, and there is no scenario-level `RENAMED` operation to express the
   intent. Do NOT work around it by hand-editing specs. Instead: count the
   scenarios the delta declares against the ones the main spec currently has,
   report whether anything would actually be lost, and put the call to the user
   via **AskUserQuestion** (rename the scenario back and re-delta, or archive with
   an older CLI that lacks the guard). 1.3.1 applies such a rename without
   complaint, and correctly.

6. **Verify and summarize**

   Confirm the result rather than assuming it:

   ```bash
   openspec validate --specs --strict
   openspec list
   ```

   Validation passes and the archived change no longer appears as active. Then
   show the summary: change name, schema, archive location, the per-capability
   operation counts the CLI reported, and any warnings from steps 2-3.

   Leave the result staged or uncommitted per the user's wishes — this skill does
   not commit.

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** ✓ <capability>: ~N modified (or "No delta specs (--skip-specs)")
**Validation:** ✓ openspec validate --specs --strict passed

All artifacts complete. All tasks complete.
```

**Guardrails**
- Always prompt for change selection if not provided
- Use artifact graph (openspec status --json) for completion checking
- Don't block archive on warnings - just inform and confirm
- `openspec archive` does the whole job: applies deltas, dates the directory,
  moves it (`.openspec.yaml` included), validates. Never reimplement any of that
  by hand — no `mv`, no `mkdir`, no editing `openspec/specs/`
- Never hand-edit main specs, even when the CLI is unavailable, the archive
  aborts, or a step here seems to call for it. Report the blocker and stop
- Verify with `openspec validate --specs --strict` + `openspec list` before
  claiming success; report what the CLI actually printed, not what you expected
