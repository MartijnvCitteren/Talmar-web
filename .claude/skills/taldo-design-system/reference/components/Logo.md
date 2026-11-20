The symbol is a hub (a squircle) with a signal — a small upward-pointing badge for the next step Jobzy points you to, and for candidates moving forward through the pipeline. It works standalone as an app icon or favicon.

**This system's logo files (`assets/Logo/jobzy-symbol.svg`, `assets/Logo/jobzy-lockup.svg`) are a reconstruction, not the original vector file** — the source PDF only showed the mark rendered inside page mockups, with no SVG, AI or Figma export supplied. The geometry was measured directly from the mockup's pixels (corner radius, badge size and position, badge-to-hub ratio) rather than eyeballed, so proportions should be close, but replace these with the real vectors as soon as they're available.

- Use the symbol alone (no wordmark) for app icons and favicons, at 28, 48, 72, 112 or 168px.
- Pair the symbol with the "Jobzy" wordmark (Inter 800) for headers and marketing.
- Minimum clearspace on every side equals the symbol's height ÷ 2.
- Never stretch, rotate, or add a drop shadow to the symbol.
- Never recolor the signal badge to match the hub — it must stay `violet` against `teal`.
- The ring around the badge is a knockout to whatever surface it sits on, not a fixed white fill — measured from the source, it switches to the dark surface color on the dark-background lockup below.
- On dark backgrounds, the source guideline shows a visibly lighter, brighter hub color (sampled from the mockup at roughly `#2a937c`, versus `teal`'s `#0f6759`-ish rendering in print) — no exact token was given for it, so the dark lockup here reuses standard `teal`. Confirm and add a proper `teal-on-dark` token before shipping on a dark surface.
