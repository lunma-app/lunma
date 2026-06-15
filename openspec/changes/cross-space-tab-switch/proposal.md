## Why

The launcher can now reach a pinned saved tab in **any** Space
(`launcher-fuzzy-smart-folders`), but activating one is half-broken across Spaces:
`openSavedTab` opens a Space-B pin into **B's** Chrome group while the window keeps
showing Space A, so the tab you asked for is dropped into a group you can't see;
`focusSavedTab` focuses the bound tab without switching either. The user lands on a
tab whose Space isn't active — confusing, and the deferred follow-up explicitly
carved out of `launcher-fuzzy-smart-folders`. This change makes activating a
Space-bound saved tab **also switch the window to that tab's Space**, so "jump to
that thing" includes "go to where it lives."

## What Changes

- **Activating a coupled (pinned) saved tab switches the window to its Space when
  that Space isn't already active.** Both activation paths gain it:
  - `openSavedTab` — before/while opening + grouping the new tab, when
    `saved.spaceId !== null` and `saved.spaceId !== activeSpaceByWindow[windowId]`,
    run the **same activation sequence** the `activateSpace` command uses (store +
    Chrome group show/hide via the group orchestrator), so the freshly-opened tab
    is visible in its now-active Space's group rather than hidden in a background
    group.
  - `focusSavedTab` — when the bound tab's `saved.spaceId !== null` and differs
    from the window's active Space, switch to that Space, then focus the tab.
- **Caller-agnostic, so it benefits the launcher without special-casing it.** The
  switch lives in the command handlers, which are user-initiated. The **sidebar**
  only ever activates pins of the *already-active* Space, so the condition is a
  no-op there; the **launcher** is the real cross-Space caller. No launcher,
  surface, or message-bus change is needed — the launcher keeps dispatching the
  same `openSavedTab`/`focusSavedTab` commands.
- **Favorites and non-Space-bound results never switch.** A favicon-row favorite
  (`spaceId === null`) is global/ungrouped and stays visible across Spaces — no
  switch. **Smart-folder items** act via generic `openUrl` (an external link opened
  as a temporary tab, with no Space binding), so they do **not** switch the window
  to their folder's Space (a PR you open is not a Space-bound tab); `tab`,
  `bookmark`, `history`, and the synthesized actions are likewise out of scope.
  (Rationale + the considered alternative captured in `design.md`.)

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `lunma-bookmark-bindings`: the *Clicking a dormant bookmark opens a new tab and
  binds it* and *Clicking an active bookmark focuses its bound tab* requirements
  gain a normative clause — when the activated saved tab is **coupled**
  (`spaceId !== null`) and its Space is not the focused window's active Space,
  Lunma SHALL activate that Space in the window as part of the activation (open +
  group, or focus). Favorites (`spaceId === null`) are unaffected.

The `launcher` capability is **not** modified: *Acting on a launcher result* still
dispatches the same `openSavedTab`/`focusSavedTab` commands; the Space switch is
emergent handler behaviour, not a new dispatch. The `spaces-and-tabs` activation
contract is **reused, not changed** (the handler invokes the existing activation
sequence).

## Impact

- **Modified handlers** — `apps/extension/src/background/handlers/pinned-tabs.ts`:
  `openSavedTab` and `focusSavedTab` gain the conditional Space switch (reusing the
  group orchestrator's activation sequence, the same path
  `apps/extension/src/background/handlers/spaces.ts`'s `activateSpace` uses — not a
  re-implementation).
- **No new state, schema, message, permission, or dependency.** `activateSpace`,
  the group orchestrator, and `SavedTab.spaceId` already exist; the launcher
  already carries `spaceId` on its results (informational only — the handler reads
  the authoritative `SavedTab.spaceId` from the store, never a URL/field on the
  wire).
- **Tests** — `pinned-tabs`/coordinator handler tests gain cross-Space cases
  (dormant open switches Space + groups visibly; bound focus switches Space;
  same-Space activation does **not** re-activate; a favorite never switches).
- **Docs** — the `openspec/specs/lunma-bookmark-bindings` spec notes the
  activation-time Space switch; the `openspec/specs/launcher` spec cross-links it
  from the saved-result action. No other docs (no layer-DAG, schema, or stack change).
