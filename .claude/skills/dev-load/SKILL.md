---
name: dev-load
description: Build the extension and open it in a real headed Chrome to eyeball
  a change against the Arc-quality visual bar (new-tab + sidebar surfaces).
  User-triggered.
disable-model-invocation: true
allowed-tools: Bash(pnpm build) Bash(node *)
---
Build Lunma and launch it in your real Chrome for manual visual QA.

1. Run `pnpm build` to refresh `dist/`.
2. Launch headed Chromium with the extension loaded:
   `node ${CLAUDE_SKILL_DIR}/scripts/load-chrome.mjs`
   This uses Playwright's bundled Chromium (stable Google Chrome M137+ disables
   `--load-extension`, so the real binary won't load Lunma from the command
   line) with a persistent dev profile at `~/.lunma-dev-chrome`, the automation
   banner suppressed, and `--load-extension=dist`. It lands on Lunma's new-tab
   override only — it does NOT open any `chrome-extension://` page as a tab. It
   prints the resolved extension id.
   Run it un-sandboxed and detached (background) — launching the GUI inside the
   harness sandbox tears the browser down on exit.
   To use your real Chrome instead, load `dist/` manually via
   chrome://extensions → Developer mode → Load unpacked.
3. Inspect against the visual-quality policy: frosted glass, aurora backdrop,
   hue glow, 150–250ms motion, Instrument Serif + Mona Sans, WCAG-AA contrast.
   - New tab → Lunma's launcher (the new-tab override).
   - Sidebar → click the Lunma toolbar icon; it opens as a real side panel
     (the background sets `openPanelOnActionClick`). Do NOT open
     `src/sidebar/index.html` as a tab — it's built for side-panel width and
     renders cramped.
   - Options → opens in a tab from the extension.
   Close the Chrome window (or Ctrl+C in the terminal) to end the session.
