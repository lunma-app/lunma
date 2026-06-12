---
name: lunma-voice
description: The Lunma marketing-copy voice and the anti-AI-tell checklist. Use whenever writing or editing user-facing copy for the marketing site (apps/site) — Hero, Chapters, FromArc, TrustBand, FAQ (seo.ts), CTAs, footer, and the SEO title/description — or any other Lunma marketing text. Draft in this voice, then run the tell-hunter pass and revise until zero tells remain.
license: MIT
metadata:
  author: lunma
  version: "1.0"
---

Write Lunma's marketing copy so a sharp human wrote it — never an LLM. Hold this
voice and pass the tell-hunter checklist before any copy ships. "Zero AI tells" is
measured against the banned list below, so it is verifiable, not a vibe.

## The Lunma voice

Warm, human, and a little wry. A sharp person who's used a hundred tab tools, knows
exactly why this one is calmer, and tells you plainly — like a friend who happens to
have built the thing, not a brand talking at you.

- **Warm and personal.** Talk to the reader, not at a market. Meet them where they
  are ("You came here from Arc.", "Your tabs got away from you again."). Contractions
  are good (you'll, it's, doesn't). A dry, confident aside is welcome when it's true.
- **Plain and direct.** Say the true thing in the fewest words. No build-up, no
  throat-clearing, no payoff lines.
- **Confident, not boastful.** State what the product does and why it feels good. Don't
  tell the reader it's powerful or delightful; show the behaviour and let them feel it.
- **Concrete over abstract.** Name the real key (`Alt+L`), the real behaviour ("opens
  in a new tab beside it"), the real fact ("stored locally, survives restarts"). Never
  gesture at a benefit you could just state.
- **Second person, present tense, active voice.** "You pin a site." Not "Sites can be
  pinned" or "Lunma is designed to let you pin sites."
- **One idea per sentence. Mostly short.** Vary length so it reads like speech, not a
  cadence machine. A two-word sentence is allowed when it lands.
- **British spelling** to match the codebase: colour, favourites, behaviour, organise.

**Warmth without the charm-tells.** Personality comes from *what you notice about the
reader's real day* and *a confident, plain turn of phrase* — never from rhetorical
questions, exclamation marks, cutesy whimsy, winking kicker lines, or forced
enthusiasm. Those are AI cosplaying "fun" and they're on the banned list below. Warm
means human, not bubbly.

## Banned AI tells (the checklist — every one of these is a fail)

**Structural**
- The em-dash dramatic pause or splice (` — `). This is the #1 tell here and the
  current copy is riddled with it. Default: split into two sentences, or use a comma,
  colon, or full stop. An em-dash is allowed only when no other punctuation works, and
  almost never more than once in a paragraph.
- The rule-of-three / tricolon rhythm ("X, Y, and Z") used as a recurring beat.
- "Not just X — it's Y" / "It's not about X, it's about Y" / "more than just".
- "Whether you're X or Y…".
- Balanced antithesis for its own sake ("less noise, more focus").
- Rhetorical-question openers ("Ever wish…?", "What if…?").
- Closing kicker one-liners ("That's the difference.", "Simple as that.", "— it's
  that simple.").
- Parenthetical asides used as a verbal tic.

**Lexical (banned words/phrases)**
- seamless, effortless(ly), elevate, unlock, supercharge, empower, robust, powerful,
  delightful, intuitive, cutting-edge, game-changing, revolutionise, streamline,
  leverage, harness, dive in, at your fingertips, take it to the next level,
  best-in-class, world-class, beautifully crafted, thoughtfully curated, meticulously.
- Filler intensifiers: simply, just, truly, really, actually, basically.
- Hedge verbs that dodge the claim: "designed to", "helps you", "allows you to",
  "enables you to". Use the direct verb instead ("Pin a site" not "lets you pin sites").
- "in today's world", "in the age of", "in a world where".

**Tonal**
- Hype or superlatives with no substance behind them.
- Forced enthusiasm and exclamation marks.
- Explaining the obvious, or restating the heading in the body.
- Symmetry and parallelism polished until it sounds composed rather than said.

## Before → after

The "after" is warm and human, with zero tells — personality from noticing the
reader's day and saying it plainly, not from charm tricks.

- ✗ "Lunma seamlessly elevates your workflow — effortlessly organising your tabs so
  you can focus on what matters." → ✓ "Give every project its own Space. Switch to it
  and the sidebar shows that work and nothing else. Your forty open tabs finally stay
  where they belong."
- ✗ "Whether you're a developer or a designer, pinned tabs stay right where you need
  them — it's that simple." → ✓ "Pin a site and it acts like an app. It stays on its
  own page, and a link that wanders off opens in a new tab next to it, not on top of
  what you had."
- ✗ "Your data is truly yours — stored locally, synced everywhere, always at your
  fingertips." → ✓ "Everything you keep stays on your device and is there after a
  restart. Nothing gets uploaded, because there's nowhere to upload it to."

## The tell-hunter pass (run before shipping)

1. Draft in the voice above.
2. Hunt: read every sentence against the banned list. For copy of any size, spawn a
   critic subagent whose only job is to flag tells — give it this checklist and have it
   return each offending phrase with the rule it breaks and a fix. A second, fresh
   critic catches what the first rationalised away.
3. Revise to zero flagged tells. Re-run step 2. Repeat until a pass returns nothing.
4. Read it aloud once. If a line sounds composed rather than spoken, it isn't done.

Accuracy first: never trade a true statement for a punchier false one. A tell-free line
that misleads is worse than a clumsy true one. (See the marketing-site "Local-only …
trust signals" requirement for the binding factual claims.)
