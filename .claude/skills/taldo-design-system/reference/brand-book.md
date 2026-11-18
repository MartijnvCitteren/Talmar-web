Jobzy is a calm, trustworthy recruitment hub for HR generalists who handle hiring alongside everything else — a steady advisor, not another dashboard to decode. Every surface should read like a competent colleague built it: direct, unhurried, and willing to say what to do next instead of just reporting numbers.

## Principles

- Reserve `violet` for advice, insight and anything genuinely new — the one-click recommendation, the "new insight" status. If it turns up everywhere, it stops meaning anything.
- Never rely on color alone. Every status (`status-passed`, `status-attention`, `status-rejected`, `status-insight`) pairs its color with a distinct shape — circle, square, triangle, diamond — and a label, so the interface stays deuteranopia/protanopia-safe by construction.
- Let whitespace do the talking. Favor `space-4`–`space-6` gaps between sections over a dense stack; let one confident number or one clear recommendation own the screen rather than competing widgets.

## Color

Teal for trust, violet for the disruptive edge, sand for warmth.

- Set primary actions, active navigation and links in `teal`.
- Reserve `violet` for advice and new-insight moments only (see Principles).
- Use `sand` for the "needs attention" status and warm accents — never as a second primary.
- Set the page background in `surface-bg`, cards and panels in `surface`, hairline dividers and input borders in `border`.
- Set primary text in `ink`, secondary text and captions in `ink-secondary`.
- `danger` is approximated from the guideline's mockups — no exact value was given in the source file. It covers the reject-candidate button and the input error state; confirm the real value and update this token before shipping.
- Status colors never carry meaning alone: pair `status-passed` with a circle, `status-attention` with a square, `status-rejected` with a triangle, `status-insight` with a diamond.

## Typography

Inter for everything — UI, marketing, body copy. `figure` (JetBrains Mono) is reserved for dashboard numbers only, so figures like cost, percentage and days-in-phase stay tabular and scannable.

- Set hero and marketing headlines in `display`.
- Set page and section titles in `h1`.
- Set body copy in `body`.
- Set dashboard figures — cost, %, days — in `figure`. Never use `figure` for headings or body text.

The source gave exact values for `display` (56–64px), `h1` (32px, Inter 700) and `body` (17px, Inter 400); line-heights and the dashboard-figure size weren't specified in the guideline, so reasonable defaults were chosen here — adjust if the product code already defines different ones.

## Spacing & radius

The spacing scale sits one step up from typical UI defaults, on purpose — it's what keeps Jobzy feeling like a calm advisor instead of a dense spreadsheet.

- Use `space-1`–`space-2` inside controls and chips.
- Use `space-3`–`space-4` between fields and within a card.
- Use `space-5`–`space-6` between page sections.
- Round controls — buttons, inputs, chips — with `radius-control` (10px).
- Round cards and panels with `radius-card` (20px).

## Layout

- Web: a fixed top navbar, content centered with a max-width around 840px — plenty of side air even on wide monitors.
- Mobile: a hamburger nav, single column, same content rules.
- Breakpoints: mobile below 640px, tablet below 1024px, desktop from 1024px.

## Motion

One shared easing across the system: 280ms ease-out. Never stack more than one motion moment on a screen at once — no shimmer, pulse and pop-in together. See the Motion component for hover, loading and advice-arrival patterns.

## Imagery

- Use real photography only where trust matters most — marketing hero, testimonials, "meet the team." Candid, natural light, muted grading that doesn't fight the teal/violet palette. Never posed corporate stock.
- Use simple line illustration, matching the icon set's stroke weight, for abstract concepts a photo can't show — a pipeline, "one hub," anonymization.
- Empty states get an icon and copy only, never a custom illustration. This keeps the system fast to extend as new screens ship.

## Components

See Logo, Buttons, Inputs, Status badges and Motion below. Iconography and Voice & tone cover the two brand dimensions that aren't visual components. Platform notes covers stack, apply-flow and GDPR specifics.
