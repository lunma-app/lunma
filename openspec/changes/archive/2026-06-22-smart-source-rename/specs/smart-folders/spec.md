## ADDED Requirements

### Requirement: A smart source may carry a display name

A `SmartSourceConfig` MAY carry an OPTIONAL `name: string`, which SHALL be
**display-only**: it SHALL NOT participate in the section identity key
(`sourceKey` stays `source:host[:query]`), the duplicate-`source:host` merge, the
connector fetch, or `smartItemBindings`. It is persisted as part of the source config (see the
`storage-and-migrations` capability — `SmartSourceConfig` schema + the v10
additive migration).

When a source carries a non-empty `name`, that name SHALL **label its resolved
section(s)** in the sidebar in place of the host: a feed (`rss`) section reads
`name`, and a queue section reads `name · filter` (the filter axis is preserved).
When `name` is absent or blank, the section label is unchanged (`host`, or
`host · filter`) — overriding the default host label specified in "Requirement:
Smart-folder rendering and the one-glyph restraint".

The `SmartFolderEditor` SHALL expose a per-source **Name** field (optional;
placeholder shows the host) in each source card's body, and the card's header
identity SHALL prefer the `name` when set. Confirming SHALL carry the trimmed
`name`, omitting it entirely when blank (an unnamed source persists as
`{ source, baseUrl, queries }` with no `name` key). The `createSmartFolder` /
`updateSmartFolder` command source schema SHALL accept the optional `name`.

#### Scenario: A named source labels its section

- **GIVEN** a feed source `{ source: 'rss', baseUrl: 'https://www.theguardian.com/world/rss', name: 'World news' }`
- **WHEN** the folder renders its section header
- **THEN** the header reads `World news` (not `www.theguardian.com`)

#### Scenario: A named queue source keeps the filter axis

- **GIVEN** a queue source `{ source: 'gitlab', baseUrl: 'https://gitlab.com', queries: ['authored', 'review-requested'], name: 'Work' }`
- **WHEN** the folder renders
- **THEN** its two section headers read `Work · authored` and `Work · reviewing`

#### Scenario: An unnamed source is unchanged

- **GIVEN** a source with no `name` (or a blank one)
- **THEN** its section label is the host (`host`, or `host · filter`) exactly as before, and confirming the editor persists no `name` key

#### Scenario: The editor exposes a per-source Name field

- **WHEN** a source card is expanded in the editor
- **THEN** it shows an optional Name field (placeholder = the host) whose value persists as the source's `name` on Create/Save
