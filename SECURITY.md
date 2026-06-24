# Security Policy

Thanks for helping keep Lunma and its users safe. This document explains how to
report a security vulnerability and what to expect once you do.

## Reporting a vulnerability

**Please report security issues privately — do not open a public issue, pull
request, or discussion.**

Use GitHub's private vulnerability reporting:

1. Go to the [**Security** tab](https://github.com/lunma-app/lunma/security) of
   the repository.
2. Click **Report a vulnerability** (or use the direct link:
   <https://github.com/lunma-app/lunma/security/advisories/new>).
3. Fill in as much detail as you can.

This opens a private advisory visible only to you and the maintainers, so the
issue stays confidential until a fix is ready.

### What to include

A good report lets us reproduce the issue quickly. Where you can, include:

- A clear description of the vulnerability and its impact.
- Step-by-step instructions to reproduce it.
- The extension version (see `chrome://extensions` → Lunma → version) and the
  affected surface (sidebar, options page, background service worker, content
  script, or the marketing site).
- Your browser and OS version.
- Any proof-of-concept, logs, or screenshots — but please redact your own
  personal data.

## Supported versions

Lunma is a Chrome extension distributed through the Chrome Web Store, which
auto-updates installs to the latest published release. We only provide security
fixes for the **most recent published version**. There is no back-porting to
older versions — updating to the latest release is the supported path to a fix.

| Version                         | Supported |
| ------------------------------- | --------- |
| Latest Chrome Web Store release | ✅        |
| Any older version               | ❌        |

## Scope

In scope:

- The Lunma browser extension (`apps/extension`).
- The Lunma marketing site (`apps/site`).
- The shared design-token package (`packages/tokens`).

Out of scope (please report these to the relevant upstream project instead):

- Vulnerabilities in third-party dependencies — report them upstream; we track
  routine updates via Dependabot.
- Vulnerabilities in Chrome itself or the Chrome Web Store.
- Findings that require a already-compromised machine, a malicious extension
  with broad permissions, or physical access to an unlocked device.
- Social engineering, spam, or reports with no demonstrable security impact
  (e.g. missing best-practice headers on a static marketing page with no
  associated exploit).

## What to expect

We are a small project, so we don't commit to a fixed response time, but we take
security reports seriously and will:

- Acknowledge your report on a best-effort basis (typically within a few days).
- Work with you on **coordinated disclosure** — we'll agree on timing before any
  public write-up, and ask that you give us a reasonable window to ship a fix
  before disclosing.
- Credit you in the published advisory if you'd like (let us know how you'd like
  to be named).

We do **not** run a paid bug-bounty program.

## Safe harbor

We consider security research conducted in good faith under this policy to be
authorized. If you make a good-faith effort to comply with this policy during
your research, we will not pursue or support legal action against you for it.
Good faith means: only interacting with accounts and data you own or have
explicit permission to test, avoiding privacy violations and service disruption,
and giving us a reasonable chance to remediate before any public disclosure. If
in doubt about whether a specific action is acceptable, ask us first via a
private advisory.
