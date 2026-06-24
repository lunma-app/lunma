# marketing-site Specification

## ADDED Requirements

### Requirement: Lenses are positioned as a live-queue platform and demonstrated

The features section SHALL include a beat that presents Lunma's **lenses** as a
**live-queue capability** — a pinned folder whose contents are live items pulled from a
service the visitor keeps checking, refreshed on their own — framed as the general
capability with a **GitLab review queue** shown as the concrete example. The beat SHALL
render in the shared editorial-chapter form (a numbered chapter with a kicker, a display
heading, copy, and a staged product visual) and compose the shared design language
(`@lunma/tokens` + the site's own mock components), not re-roll primitives.

The claim SHALL be **factual** and stated in the brand voice. The page SHALL name the
connectors that ship — **GitLab, GitHub, Jira, and RSS feeds** — and SHALL NOT name or
imply that any **unshipped** connector (for example Notion or a calendar) is available.
A calm, name-free and date-free indication that further connectors are planned is
permitted; naming an unshipped connector or promising a date is not. The copy SHALL
state that lenses work with a self-hosted instance and that data stays on the
visitor's device (no Lunma server), consistent with the shipped connectors. The beat
SHALL hold WCAG-AA contrast and SHALL introduce no motion that violates the page's
reduced-motion contract.

The staged visual SHALL show the capability rather than only assert it: a lens
header with an item count over merge-request rows, each row carrying exactly one
pipeline-status indicator (no more than one status mark per row), in keeping with the
product's one-glyph restraint.

#### Scenario: The features section presents lenses as a live queue

- **WHEN** a visitor reaches the features section
- **THEN** a chapter SHALL present lenses as a live queue pinned in the Space, with a GitLab review queue shown as the example
- **AND** the chapter SHALL render in the shared editorial-chapter form composing the shared design language

#### Scenario: The beat names the connectors that ship

- **WHEN** the lenses beat renders its copy
- **THEN** it SHALL name the shipped connectors — GitLab, GitHub, Jira, and RSS feeds — as available
- **AND** it SHALL NOT name or imply any unshipped connector (Notion, a calendar, etc.) is available
- **AND** any indication of future connectors SHALL be name-free and date-free

#### Scenario: The beat frames lenses as local and self-hostable

- **WHEN** the lenses beat renders its copy
- **THEN** it SHALL state that lenses work with a self-hosted instance
- **AND** it SHALL state that the data stays on the visitor's device with no Lunma server

#### Scenario: The staged visual shows the queue with one status mark per row

- **WHEN** the lenses beat renders its visual
- **THEN** it SHALL show a lens header with an item count over merge-request rows
- **AND** each row SHALL carry exactly one pipeline-status indicator, never more than one
- **AND** all text in the visual SHALL hold WCAG-AA contrast

## MODIFIED Requirements

### Requirement: A privacy policy page is published at /privacy

The site SHALL publish a statically prerendered privacy policy page at `/privacy`
that is true to the extension's behavior and consistent with the site's trust
signals. Its copy SHALL state that workspace data is stored locally in
`chrome.storage.local` on the user's device; that user preferences sync across
the Chrome profile via `chrome.storage.sync` but connector tokens never do; that
there is no Lunma account or server and no analytics or telemetry; that when the
user connects a lens to a service, Lunma contacts that host directly
using **either** an access token the user provides (stored locally, sent only to
that host) **or** the user's existing signed-in browser session, with nothing
sent to Lunma and tokens never logged; that public feeds are fetched directly
without sign-in; that content scripts read only the user's launcher input and the
link they click, never page content; and that backup/export is a user-controlled
local file. The copy SHALL describe connectors generically (a code host / issue
tracker / feed), SHALL state that Lunma is not a data controller (it collects and
transmits nothing to itself), SHALL explain each permission, and SHALL include
sections for retention/deletion, children, policy changes, and a contact method.
The page SHALL NOT contradict `TrustBand.svelte`, and this change SHALL correct
TrustBand's "settings … on this device only" wording so the two agree.

#### Scenario: The page is prerendered and reachable

- **WHEN** the static site is built
- **THEN** `/privacy` SHALL be emitted as prerendered HTML (no server runtime), reachable at the canonical origin

#### Scenario: The policy states the data handling honestly

- **WHEN** a reader opens `/privacy`
- **THEN** it SHALL state that workspace data lives in on-device local storage, that preferences sync via the browser while tokens do not, that there is no Lunma server or account, and that there is no analytics/telemetry
- **AND** it SHALL state that a connected service is contacted directly using **either** a user-provided token **or** the existing signed-in session, with nothing sent to Lunma and tokens never logged

## REMOVED Requirements

### Requirement: Smart folders are positioned as a live-queue platform and demonstrated

**Reason**: Renamed to lens vocabulary by establish-lens-model.
