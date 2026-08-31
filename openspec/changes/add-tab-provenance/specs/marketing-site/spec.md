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
link they click, never page content; that the optional tab-provenance
setting is off by default, and that while it is on Lunma stores a random marker in
the pages visited so a tab tree survives a browser restart — that those pages can
read that marker, so a site can tell Lunma is installed; that turning the setting
off clears the markers Lunma can still reach; that uninstalling Lunma cannot clear
markers already written; and that a marker does not outlive the browsing session it
was written in; and that backup/export is a user-controlled
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

#### Scenario: The policy discloses the provenance marker, its readability, and its limits

- **WHEN** a reader opens `/privacy`
- **THEN** it SHALL state that the tab-provenance setting is off by default; that while on, a random marker is stored in visited pages and those pages can read it; that turning it off clears the markers Lunma can reach; that uninstalling cannot clear markers already written; and that a marker does not outlive the browsing session
- **AND** it SHALL NOT claim unconditionally that turning the setting off clears every marker
