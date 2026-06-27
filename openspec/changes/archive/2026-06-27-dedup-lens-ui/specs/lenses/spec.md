## ADDED Requirements

### Requirement: Section identity is computed identically across surfaces

A lens section's identity key (`sourceKey`) SHALL be derived by a single
canonical function shared by the service worker, the sidebar, and the overview
page. The service worker is the single writer that drains results keyed by this
identity, so the sidebar and the overview page MUST key sections by the exact
same function — for every source, including a self-hosted GitHub Enterprise or
GitLab instance reachable on a non-default port, and a source whose `baseUrl` is
malformed. No surface may maintain its own variant.

The key SHALL be `` `${source}:${host}` `` for a feed-style source (no filter)
and `` `${source}:${host}:${query}` `` for a filtered source, where `host`
includes any non-default port carried by `baseUrl`.

#### Scenario: The same source keys identically on every surface

- **WHEN** a lens references one source and the SW, the sidebar, and the overview
  page each derive that section's key
- **THEN** all three produce the same `sourceKey` string

#### Scenario: A self-hosted source on a non-default port keys consistently

- **WHEN** a source's `baseUrl` carries a non-default port (e.g. a self-hosted
  GitLab at `https://git.example.com:8443`)
- **THEN** the overview page's `sourceKey` includes the port and matches the key
  the service worker drained results under, so the section lines up rather than
  resolving as a distinct or empty section

#### Scenario: A filtered source keys by source, host, and query

- **WHEN** a source carries a `query` (a filter)
- **THEN** its `sourceKey` is `` `${source}:${host}:${query}` ``, distinct from
  the same source under a different filter
