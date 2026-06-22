## Why

Opening a single feed item drains the entire feed. The reading queue auto-opens
the next unread item whenever a feed tab is removed (`onTabRemoved` →
`nextUnreadFeedItemAfterClose`), but a **consume=close** (you navigate away → the
store marks the item read, then the SW closes its now-inactive tab) also reaches
`onTabRemoved`. So opening one item kicks off a runaway: consume → auto-open next
→ consume → auto-open next → … until the whole section is marked read. The user
value is direct: opening a feed entry no longer detonates the feed — only the
item you actually moved on from is consumed.

(Confirmed by live diagnostic: opening one feed produced a steady stream of
`feed-auto-advance-*` opens, each marking another item read, draining the
opened section end to end while other sections were untouched.)

## What Changes

- Auto-advance fires ONLY when the closing item is still **unread** at close time
  — i.e. a genuine manual close of the tab you're reading. A **consume=close**
  (the closing item is already read, because the drain marked it read before
  closing its tab) does NOT auto-advance.
- `nextUnreadFeedItemAfterClose` returns `undefined` when the closing item's
  namespaced id is already in `smartReadState[folderId]`.
- The previously **undocumented** auto-advance behaviour is written into the
  `smart-folders` "Reading folders are a draining unread queue" requirement,
  together with the consume=close-does-not-advance rule.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `smart-folders`: the "Reading folders are a draining unread queue" requirement
  gains the auto-advance-on-manual-close behaviour and the explicit rule that a
  consume=close (already-read closing item) does NOT auto-advance.

## Impact

- `apps/extension/src/shared/store.svelte.ts` — `nextUnreadFeedItemAfterClose`
  gains an early `return undefined` when the closing item is already read; JSDoc
  updated.
- `apps/extension/src/shared/store.smart-folders.test.ts` — regression test: a
  bound-then-read closing item yields no advance.
- Removes the temporary `[BUG2]` diagnostic from
  `apps/extension/src/sidebar/SmartFolder.svelte` (added during investigation).
- Docs: no `docs/` file documents the auto-advance; none change. The
  `smart-folders` spec is updated (see Modified Capabilities).
- No new public types, files, surfaces, or `src/ui` primitives; no dependency
  changes.
