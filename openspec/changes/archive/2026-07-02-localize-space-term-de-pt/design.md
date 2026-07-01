## Context

The workspace "Space" concept is surfaced in the sidebar (create/edit/delete
Space, Space colour, tooltips) and Options (launcher scope, tint description,
backup copy). Its label lives in the message catalogs. Six of the eight non-base
locales already localize it; `de` and `pt` still carry the English word "Space"
across ~19 catalog strings each, plus 2 strings each in their native manifest
catalogs (`_locales/{de,pt}/messages.json`). This is a string-content fix only —
no keys, code, schema, or surfaces change. The `pt` catalog is European
Portuguese (post `rename-pt-pt-to-pt`), coded `pt`.

## Goals / Non-Goals

**Goals:**
- Every `de`/`pt` catalog string that names the "Space" concept reads in German /
  Portuguese, matching the other six locales.
- No key/parity/locale-set regression; `pnpm --filter @lunma/extension verify`
  stays green.

**Non-Goals:**
- No change to `en` (source of truth) or the other six locales.
- No new keys, code, primitives, or UI surfaces; no visual/motion change.
- No revisiting the brand-string ("Lunma") or endonym-label exemptions.

## Decisions

- **German term = `Raum`.** Chosen to preserve Arc's spatial metaphor for the
  workspace concept (a "Space" you move between). It declines across every string
  form the catalog needs: sing. `Raum`, genitive `Raums` (e.g. "Farbe des aktiven
  Raums"), dative `Raum` ("im aktuellen Raum"), pl. `Räume` ("Alle Räume"),
  dative pl. `Räumen` ("aus anderen Räumen"), and the compound `Raumfarbe`
  (replacing `Space-Farbe`). Alternatives considered: `Bereich`/`Bereiche` — the
  conventional, unambiguous term for a workspace context, but flatter and less
  evocative of the Space metaphor; rejected in favour of the more distinctive
  `Raum`. Keeping English `Space` — rejected: it is the status quo this change
  exists to fix and leaves `de` half-translated.
- **Portuguese term = `Espaço` / `Espaços`.** Natural European Portuguese, the
  term the rest of the `pt` catalog already implies. No decapitalisation question:
  it stays capitalised as a UI concept-label where it currently is.
- **Genitive/agreement pass, not blind find-replace.** German needs case-aware
  edits ("dieses Spaces" → "dieses Raums", "des aktiven Spaces" → "des aktiven
  Raums", plural "aus anderen Spaces" → dative "aus anderen Räumen"), so each of
  the ~19 strings is edited in context rather than by a single token swap. Portuguese is a straight `Space→Espaço` / `Spaces→Espaços`
  swap but is still reviewed per string for article agreement.
- **Spec captured via MODIFY, not ADD.** The behaviour belongs inside the
  existing "Authored translations for every supported non-base locale"
  requirement (which already forbids verbatim English copies); tightening it
  closes the loophole in place rather than adding a parallel requirement.

## Risks / Trade-offs

- [A stray "Space" is missed in one catalog] → after editing, `grep -n "Space"
  messages/{de,pt}.json public/_locales/{de,pt}/messages.json` must return zero
  hits (the string "Lunma" contains no "Space"; no false positives expected).
- [Term choice is subjective and hard to reverse across ~19 strings] → the
  German term (`Raum`, chosen over `Bereich`) is a catalog-only value; if
  reversed later it is another content pass, no code impact.
- [Verify regression] → keys are untouched, so `i18n-parity` and
  `i18n-locale-set` cannot break; `i18n-no-literal` guards only `en`. Run the
  extension `verify` to confirm.

## Migration Plan

Not applicable — no data, storage, or API surface. Ships as a catalog content
edit; rollback is reverting the string values.
