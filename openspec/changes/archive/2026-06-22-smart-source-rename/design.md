## Context

A `SmartSourceConfig` is `{ source, baseUrl, queries }`. The sidebar labels each
resolved section `host` (rss) or `host · filter` (queue); there is no per-source
friendly name. The persisted schema is at `CURRENT_SCHEMA_VERSION = 9`.

## Goals / Non-Goals

**Goals:**
- An optional per-source `name` that labels its section(s) in the sidebar header
  and shows in the editor; host label unchanged when unset.
- A clean, convention-following schema bump (existing state loads unchanged).

**Non-Goals:**
- No change to the folder-level name, the connector fetch, or section identity
  keys (`sourceKey` stays `source:host[:query]` — the name is display-only).
- No new primitives.

## Decisions

- **`name` is display-only and optional.** It never participates in
  `sourceKey`, the merge rule, or the connector — purely the section label and
  the editor card's identity. So fetching, dedup, and bindings are untouched.
- **Schema bump v9 → v10 with an identity migration.** `name` is a new optional
  field on `SmartSourceConfig`; pre-v10 nodes simply lack it and remain valid.
  The v10 migration is therefore **additive (identity)** — no data transform —
  following the append-only convention and keeping `schemaVersion` honest about
  the schema shape. (This change also corrects the envelope requirement's stale
  "version 8" text — code has been at 9 since `multi-source-smart-folders`.)
- **Label resolution:** `SmartSectionHeader` uses `name?.trim() || host`; for a
  queue source it remains `<label> · filter`. The sidebar's `sections`
  derivation copies `name` onto each `ResolvedSourceConfig`.
- **Editor:** a per-card optional Name `TextInput` (placeholder = the host); the
  card header identity prefers `name`; `confirm` carries `name` trimmed, omitting
  it when blank so an unnamed source stays `{ source, baseUrl, queries }`.

## Risks / Trade-offs

- **strictObject + downgrade:** new data carries a `name` key that an older
  build's strict v9 schema would reject — but downgrades aren't supported, and
  the version bump is exactly the signal that records the new shape.
- **Empty vs absent name:** the editor omits an empty name on confirm, so a
  blank field never persists `name: ''` (which would render as an empty label).
