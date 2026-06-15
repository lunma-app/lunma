## Context

Lunma overrides the browser new-tab page via `chrome_url_overrides.newtab`. A tab
whose live URL is that page is a **home tab** — grouped into the active Space but
never listed as a Temporary tab. Recognition funnels through one helper,
`isNewTabUrl()` (`apps/extension/src/shared/new-tab.ts`), consumed by
`background/handlers/chrome-tabs.ts` (onCreated/onUpdated), `seed-existing-tabs.ts`,
`group-orchestrator.ts`, `tab-group-adoption.ts`, and `index.ts`.

`isNewTabUrl` has two branches: a hardcoded literal (`chrome://newtab/`) and a
portable `chrome.runtime.getURL(NEWTAB_PAGE_PATH)` comparison. Each Chromium fork
namespaces internal pages under its **own** scheme: Chrome `chrome://newtab/`,
Edge `edge://newtab/`, Brave `brave://newtab/` (Brave also aliases `chrome://`).
When an overridden NTP opens, the tab momentarily reports the browser's own
internal URL before resolving to the `chrome-extension://` override. Edge keeps
the `chrome-extension:` scheme for compatibility, so the `getURL` branch is
already portable — but it only matches **after** resolution.

The result on Edge: `tabs.onCreated` sees `edge://newtab/`, the literal misses,
`isHome` is false, and the page is adopted into `tempTabIds`. When it later
resolves to `chrome-extension://…`, `tabs.onUpdated`'s adoption-correction is
guarded on `!isNewTabUrl(changeInfo.url)` — but the resolved URL **does** match
(via `getURL`), so the guard skips and nothing un-adopts the tab. It stays a
Temporary tab permanently. A second, independent Chrome-only literal lives in
`Options.svelte`: the unbound-shortcut recovery button opens
`chrome://extensions/shortcuts`, which is an error page on Edge
(`edge://extensions/shortcuts` is the real page; Edge does not alias `chrome://`).

This was found by a multi-agent Edge-compatibility audit (19 raised, 16 confirmed
after adversarial verification, 3 rejected). Chrome+Edge is a committed target
(`the distribution notes` §222 already flags this exact NTP override as "Edge is
fussier here than Chrome"; the launch checklist gates the "works on Edge" claim
on it).

## Goals / Non-Goals

**Goals:**
- An Edge new tab is recognised as a home tab (never listed as a Temporary tab) —
  fixing the reported bug and its five downstream consumers via one source change.
- The "Open keyboard shortcuts" recovery control reaches the host browser's real
  shortcuts page on Edge as well as Chrome.
- No shipped user-facing copy hardcodes "Chrome" where it renders on Edge.
- Regression tests lock the Edge schemes so the bug cannot silently return.
- `docs/` and OpenSpec specs stay in lockstep with the new behaviour.

**Non-Goals:**
- Hardening the `tabs.onUpdated` path to *demote* an already-wrongly-adopted home
  tab (see Decisions — the literal fix removes the wrong adoption at the source,
  so demotion logic is unnecessary surface area).
- Opera / Vivaldi as first-class shortcut-page targets (not named targets;
  Vivaldi reports `chrome://newtab/` and accepts `chrome://` so it is already
  covered; Opera uses a different shortcuts path — see Risks).
- The marketing site's `apps/site/src/lib/seo.ts` "for Chrome" strings (a
  separate `marketing-site` capability; left for a follow-up).
- Any change to injection/boundary gates, favicon handling, launcher
  classification, or manifest keys — the audit verified all portable.

## Decisions

**D1 — Fix at the single source (`isNewTabUrl`), not per consumer.** All five
downstream consumers are already scheme-agnostic; they delegate every scheme
decision to the helper and add no literal of their own. Patching each would
duplicate the rule and invite drift. _Alternative considered:_ normalising
`edge://`→`chrome://` upstream at the event boundary — rejected: it would lie
about the live URL elsewhere (labels, dedup) and is broader than needed.

**D2 — Enumerated, anchored regex for the internal-newtab match.** Replace the
two literal equality checks with
`/^(chrome|edge|brave):\/\/newtab\/?(?:[?#].*)?$/`, keeping the existing
`chrome.runtime.getURL(NEWTAB_PAGE_PATH)` branch as the authoritative
resolved-URL match. The `$` anchor (with optional trailing `/`, query, or hash)
prevents false positives on real sites (`https://newtab`) or sibling internal
pages (`edge://newtab-foo`, `edge://settings`). _Alternatives considered:_ a
fully generic `/^[a-z][a-z0-9.+-]*:\/\/newtab\/?$/` — rejected as slightly too
permissive (matches arbitrary/unknown schemes) for no real benefit; enumerating
`vivaldi`/`opera` — omitted as inert (Vivaldi uses `chrome://newtab/`; Opera has
no `opera://newtab` literal), included only conceptually as future-proofing.
`edge` and `brave` are the load-bearing additions.

**D3 — Derive the shortcuts-page scheme at runtime; special-case only Edge.**
Add `getExtensionsShortcutsUrl()` to `shared/platform.ts`, built on a small
internal scheme detector that returns `edge://` when
`navigator.userAgent` contains `Edg/`, else `chrome://`. `Options.svelte` calls
the helper instead of the hardcoded literal. Default `chrome://extensions/shortcuts`
is correct for Chrome, Brave (alias), and Vivaldi (accepts `chrome://`).
_Why UA sniffing over `navigator.userAgentData.brands`:_ `platform.ts` already
detects platform via `navigator.userAgent`; the synchronous string check stays
consistent, is trivially mockable in Vitest, and avoids `userAgentData` being
`undefined` in the test/JSDOM context. _Why not feature-detect by trying to open
the URL:_ `chrome.tabs.create` does **not** reject for an unreachable internal
URL (it opens the tab and the navigation fails *inside* it), so detection must be
up-front — a try/catch cannot recover it.

**D4 — Helper lives in `shared/platform.ts`.** It is the existing home for
navigator-based host detection, and `shared/` is importable by the `options`
surface under the one-way DAG. No new file, no new dependency.

**D5 — Browser-neutral copy, not runtime brand interpolation.** Change the three
strings to neutral wording ("your browser's extension settings", "Your browser
has to set the keyboard shortcut", drop "for Chrome" from the manifest
description). _Alternative considered:_ interpolating the detected brand name into
copy — rejected as brittle (UA brand strings are noisy) for no user benefit; the
neutral phrasing reads correctly on every Chromium fork.

**Doc change required:** `docs/01-vision.md` (the line stating "Chrome MV3 only")
→ Chrome + Edge (Chromium), matching `the distribution notes` and the shipped
site/manifest positioning. No other `docs/` file needs editing (distribution and
the launch checklist already say Chrome+Edge).

## Visual language

This change is a correctness + copy fix; it introduces **no** new motion, colour,
tokens, or primitives, and reduced-motion / WCAG-AA behaviour is unaffected.

- **Sidebar (spaces-and-tabs):** the only visible delta is corrective — on Edge a
  home tab that previously rendered as an erroneous Temporary `TabRow` now renders
  as it always should (no Temporary row; the empty-Space home surface shows). No
  treatment, spacing, or animation changes; the existing Temporary-list visual
  language governs unchanged.
- **Options (launcher guidance card):** the "Open keyboard shortcuts" control
  keeps composing the existing `Button` primitive with its current variant, sizing,
  hover/active/focus/disabled states and token-driven styling — only the
  destination URL and the surrounding copy change. No new primitive, no restyle.
- **Copy:** neutral wording preserves the existing type scale, hierarchy, and
  card layout; string length stays comparable so no reflow risk.

## Risks / Trade-offs

- **Regex over-matches a real URL** → anchored with `$` and a constrained scheme
  set; covered by negative tests (`https://newtab`, `edge://newtab-foo`,
  `edge://settings`, `chrome://settings`) alongside the positive Edge/Brave cases.
- **UA sniffing is brittle** → it gates only the Edge special-case; the default
  (`chrome://`) is safe for every other current target. The blast radius of a
  mis-detection is limited to one recovery button's URL, not core tab logic.
- **Opera would still get `chrome://extensions/shortcuts` (an error page)** →
  Opera is not a named target, its shortcuts path differs
  (`opera://settings/keyboardShortcuts`), and shipping an unverified Opera branch
  is riskier than the documented default. Recorded as a known limitation; revisit
  if Opera becomes a target.
- **`getURL`-branch timing already worked on Edge for the *resolved* URL** → true,
  which is why the steady state self-heals for some paths; but the reported bug is
  the persistent onCreated→onUpdated trap (the guard no-ops), so the literal fix
  is necessary, not cosmetic. The regression test asserts the transient
  `edge://newtab/` is classified as home.

## Migration Plan

Pure code + copy + test + doc change. No persisted state is touched (home-tab
status is derived from the live URL, never stored), so there is **no** Zod
schema/migration impact and no data backfill. Edge users receive the fix on the
next extension update; existing wrongly-adopted Temporary tabs self-correct on the
next new-tab open (the source fix prevents recurrence). Rollback is a plain revert
of the change with no state cleanup. Quality gate: `pnpm verify` (extension `tsc`,
Biome incl. layer DAG, svelte-check, stylelint, Vitest) plus the new Edge-scheme
tests; `pnpm test:e2e` smoke unaffected.

## Open Questions

_None._ The Opera/Vivaldi shortcuts scheme and the `seo.ts` copy are deliberately
scoped out (see Non-Goals); no blocking unknowns remain.
