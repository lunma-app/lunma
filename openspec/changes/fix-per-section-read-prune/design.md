## Context

Feed read-state lives in `smartReadState[folderId]` as a flat list of
**namespaced** ids `${sourceKey}:${nativeId}` (written by `markSmartItemRead`).
A folder can now resolve to multiple sections (one per `rss` source / per
filter), each fetched independently and landing through the single-writer drain
as a `smartFolders.result` event carrying that section's `sourceKey`.

`pruneSmartReadState(folderId, liveIds)` (store.svelte.ts:1170) was written when
a folder had exactly one section: it filters the folder's entire read list
against `liveIds` and keeps only ids present in that set. The
`smartFolders.result` handler (smart-folders.ts:429) calls it on every section's
`ok` result with **only that section's** item ids. With ≥2 sections, section B's
fetch passes only B's ids, so the filter drops every A id (and vice-versa) — the
folder's read marks get wiped down to whichever section fetched last.

A failing unit test confirms it: after marking one item read in each of two
sections, a section-B `ok` result drops the section-A read id.

## Goals / Non-Goals

**Goals:**
- A section's fetch prunes only its own read ids; other sections' read ids
  survive.
- No behaviour change for single-section folders.
- Keep the slice bounded (sum of per-section fetch windows).

**Non-Goals:**
- The reported "opening one feed zeroes the other feeds' counts" symptom — that
  is a separate, still-unconfirmed runtime transient (ephemeral `smartFolders`
  loss on SW sleep), tracked separately and instrumented out-of-spec. This
  change does NOT claim to fix it.
- No UI/surface change, so no `Visual language` section applies.

## Decisions

- **Signature:** `pruneSmartReadState(folderId: FolderId, sectionKey: string,
  liveIds: string[])`. The caller already holds `sk`; threading it in is cheaper
  and clearer than re-deriving the section from each id.
- **Filter rule:** keep a read id when it does NOT belong to this section, OR it
  is in the section's live set:
  `kept = read.filter((id) => !id.startsWith(`${sectionKey}:`) || live.has(id))`.
  Ids for other sections fall through the `!startsWith` arm untouched; this
  section's stale ids are dropped exactly as before.
- **Empty cleanup:** unchanged — when `kept` is empty, delete the folder entry;
  when nothing changed, return early.
- **Why not derive section from ids inside the function:** the handler already
  knows the section key; passing it avoids parsing namespaced ids and matches
  how the result already carries `sourceKey`.

## Risks / Trade-offs

- **Prefix collision:** a section key is `rss:host` (or `source:host:query`); the
  `${sectionKey}:` guard includes the trailing colon, and resolved section keys
  never prefix one another (hosts carry no `:`-then-host structure), so an id
  cannot be misattributed across sections. Same assumption `openSmartItem`'s
  section resolution already relies on.
- **Single-section parity:** for one section, `!startsWith(prefix)` is false for
  every id (all ids share the prefix), so the filter reduces to the old
  `live.has(id)` — identical behaviour, no regression.
- **Bound size:** the slice is now bounded by the sum of section windows rather
  than one window; still finite and small (≤ `FEED_BUFFER` per feed section).
