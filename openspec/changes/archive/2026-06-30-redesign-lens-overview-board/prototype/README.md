# Lens-overview board prototype

A throwaway static prototype of this change's direction (width-aware board, the
"Waiting on you" lane, two-row change/issue rows, quiet feed), validated with the
maintainer before implementation. It is **not** the shipped surface — the real
work lives in `apps/extension/src/launcher/lenspage/`. Kept here as the
point-in-time record of what was agreed.

It loads the real `@lunma/tokens` CSS (same fonts, neutrals, per-Space hue,
glass/glow) via a relative link, so it renders with the actual design language.

## View it

`file://` can't load the linked package CSS, so serve the repo root over HTTP:

```sh
# from the repo root
python3 -m http.server 8000
```

Then open:

- Code board (board + lane):
  `http://localhost:8000/openspec/changes/redesign-lens-overview-board/prototype/lens-board-proto.html`
- News List (capped single column):
  `…/lens-board-proto.html?space=news`
- News Grid (responsive multi-column):
  `…/lens-board-proto.html?space=news&news=grid`

The in-page toggle at the top switches Code ↔ News. Hover a feed row/card to see
the quiet-at-rest thumbnail wake to full colour.

## Headless screenshot

```sh
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars --window-size=1600,1100 \
  --screenshot=out.png \
  "http://localhost:8000/openspec/changes/redesign-lens-overview-board/prototype/lens-board-proto.html"
```
