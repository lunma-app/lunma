## MODIFIED Requirements

### Requirement: Detect and guide when the launcher shortcut is unbound

The options page SHALL detect when the `toggle-launcher` command has no
bound shortcut (via `chrome.commands.getAll()`, an empty `shortcut`) and
SHALL surface guidance: a browser-neutral explanation that `Alt+L` may be
unset and a control that opens the **host browser's** keyboard-shortcuts
page so the user can bind it. The control's destination SHALL be resolved
at runtime from the host browser's own internal scheme via
`getExtensionsShortcutsUrl()` (`shared/platform.ts`) —
`edge://extensions/shortcuts` on Edge, `chrome://extensions/shortcuts` on
Chrome (and Brave/Vivaldi, which accept `chrome://`) — so the recovery path
opens the real shortcuts page on every supported Chromium browser rather
than an error page. The guidance copy SHALL NOT hardcode a browser name
(e.g. "Chrome"). When the shortcut IS bound, the options page SHALL NOT show
the guidance. This covers pages where the keydown fallback cannot run
(browser-internal pages such as `chrome://`/`edge://`, the Web Store, the
PDF viewer), since an extension cannot bind a `chrome.commands` shortcut
programmatically.

#### Scenario: Options shows guidance when the shortcut is unbound

- **WHEN** the user opens the options page
- **AND** `chrome.commands.getAll()` reports the `toggle-launcher` command
  with an empty `shortcut`
- **THEN** the options page SHALL show browser-neutral guidance that the
  launcher shortcut is not set
- **AND** SHALL offer a control that opens the host browser's
  keyboard-shortcuts page (`getExtensionsShortcutsUrl()`)

#### Scenario: The shortcuts control targets the host browser's scheme

- **GIVEN** the unbound-shortcut guidance is shown
- **WHEN** the host browser is Edge (`navigator.userAgent` contains `Edg/`)
- **THEN** the control SHALL open `edge://extensions/shortcuts`
- **WHEN** the host browser is Chrome (or any fork not specially detected)
- **THEN** the control SHALL open `chrome://extensions/shortcuts`

#### Scenario: No guidance when the shortcut is bound

- **WHEN** the user opens the options page
- **AND** the `toggle-launcher` command reports a non-empty `shortcut`
- **THEN** the options page SHALL NOT show the unbound-shortcut guidance
