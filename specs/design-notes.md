# Design notes — Taldo Nieuwe Vacature (vacancy creation)

Status: **VERIFIED, high-fidelity** — supersedes the 2026-09-19 approximate pass below.

Source: authoritative design handoff bundle at
`/Users/martijnvancitteren/Documents/Develop/git/Jobzy/design_handoff_vacancy_creation/`
(`README.md`, `_ds/jobzy-design-system-*/tokens/*.css`, `_ds/.../styles.css`,
`Jobzy Nieuwe Vacature - Webpagina.dc.html`, `Jobzy_Vacancy_OpenAPI_Instructions.md`).
Read 2026-09-20. Every fact below cites the README section it came from — treat the
README itself as the primary source if this file and it ever disagree.

The prior capture (bottom of this file, "2026-09-19 — approximate pass") only observed
Step 1 via screenshots and guessed everything else. That pass is kept below for history
but **must not be used for implementation** — every value it guessed is now either
confirmed or corrected here.

---

## Real design tokens (`_ds/.../tokens/*.css`)

Colour (`colors.css`, `semantic.css`) — all `oklch()`, light theme only:

| Token | Value | Semantic alias |
|---|---|---|
| `--teal` | `oklch(0.46 0.09 175)` | `--action-primary`, `--text-link`, `--border-focus`, `--status-passed` |
| `--violet` | `oklch(0.5 0.15 300)` | `--accent-advice`, `--status-insight` |
| `--sand` | `oklch(0.72 0.11 70)` | `--accent-warm`, `--status-attention` (unused in this flow) |
| `--danger` | `oklch(0.5 0.16 25)` | `--text-error`, `--border-error`, `--action-destructive` |
| `--surface-bg` | `oklch(0.985 0.004 90)` | `--surface-page` |
| `--surface` | `oklch(0.97 0.005 90)` | `--surface-card` |
| `--border` | `oklch(0.88 0.006 90)` | `--border-hairline` |
| `--ink` / `--ink-secondary` | `oklch(0.22 0.01 90)` / `oklch(0.45 0.01 90)` | `--text-primary` / `--text-secondary` |
| `--on-teal` | `oklch(0.985 0.004 90)` | `--text-on-accent`, text on teal fills |
| `--status-passed-bg` | `#e3f2ec` | `--nav-active-bg`, selected/ready states |
| `--status-insight-bg` | `#efe8fb` | `--surface-advice` |

Rationed hard: `--violet`/`--accent-advice` appears **only** on AI/advice surfaces (the
"Taldo stelt een concept op" choice card, the generating banner, "Opnieuw" regenerate
links, the sparkles icon chip). Never used decoratively elsewhere.

Scrim: `rgba(18, 24, 26, .5)` — the one alpha value in the system.

Spacing (`spacing.css`): `--space-1..6` = **8 / 16 / 24 / 32 / 48 / 64px**.
`--content-max: 840px`. Breakpoints: `--bp-mobile: 640px`, `--bp-tablet: 1024px`.

Radius (`radius.css`): `--radius-control: 10px` (buttons, inputs, chips, dropdowns) ·
`--radius-card: 20px` (cards, modals, menus) · `--radius-pill: 999px` (pills, avatar).
Nothing else — no other radius values anywhere in this system.

Typography (`typography.css`, `fonts.css`): `--font-sans: "Inter"` (400/500/600/700/800,
Google Fonts CDN), `--font-mono: "JetBrains Mono"` (400/500/600) **only for figures** —
salary lines, hours chips, ISO2 codes — never headings or body. Sizes: `--text-h1-size/
line` 32/40 (page titles), `--text-body-size/line` 17/26 (preview body copy),
`--text-control-size` 15 (inputs), `--text-ui-size` 14 (nav/buttons), `--text-caption-size`
13 (helper/meta), `--text-label-size` 12 (field labels). Non-tokenized one-off sizes used
in specific places: 30px/1.2/700 (preview job title), 22px/700 (overview job title),
19px/700 (card headings), 15px/600-700 (sub-headings, choice-card titles). Negative
tracking only on large headings: `-0.02em` at 30-32px, `-0.01em` at 22px.

Motion (`motion.css`): one shared easing, `ease-out`. `--transition-hover` = 200ms
(background/border/color only, on hover). `--transition` = 280ms (elsewhere). **No
shadows anywhere in this system** except one 0-blur `box-shadow` ring (the AI choice
card's violet selection ring, `0 0 0 2px var(--violet)`) — never elevation, never a lift
or scale on hover. Loading is always animated bars, never a spinner.

### Mapping into this codebase

`src/app/styles/tokens.css` currently defines its own approximate names
(`--color-primary`, `--color-bg`, `--radius-card: 12px`, etc. — see the file's own
header comment admitting this). **Decision: adopt the real design system's token names
verbatim** (`--teal`, `--surface-bg`, `--radius-control`, etc.) rather than keeping this
repo's placeholder names and remapping values into them. Reasoning: the README's own
component-level prose (e.g. "Selected: `border-color: var(--teal)`") is written against
the real names, so keeping them makes every subsequent implementation task directly
copy-referenceable instead of requiring a mental rename step, and avoids a second layer
of indirection with no benefit (this app has exactly one design source, not multiple
themeable brands). See `.claude/adr/0003-design-token-adoption.md`.

---

## Global chrome — top navbar

Fully specified in README "Global chrome — top navbar". Confirmed facts that change the
current build (`src/widgets/app-shell/`):

- Sticky, `z-index: 20`, `background: var(--surface-card)`, `border-bottom: 1px solid
  var(--border-hairline)`. Inner row `max-width: var(--content-max)` (840px, not the
  current 1160px), height 64px.
- Left: Taldo **lockup** logo (`_ds/assets/logo/jobzy-lockup.svg`), size 30 — not the
  plain "Taldo" text currently rendered.
- Nav items use real Lucide icons (`layout-dashboard`, `briefcase`, `users`,
  `chart-bar`) at 17px, `gap: var(--space-1)`, alongside the label — current build has
  no icons.
- Active state: `background: var(--nav-active-bg)`, `color: var(--nav-active-fg)`, no
  shadow/lift (design system forbids both — matches this repo's existing "no shadows"
  instinct, just needed the token values).
- Avatar: 40x40, `border-radius: var(--radius-pill)`, initials "MJ", hover adds a
  1.5px teal border (a transparent 1.5px border is always reserved so nothing shifts on
  hover — implement as `border: 1.5px solid transparent` by default).
- Avatar dropdown is a **real interactive menu**, not the current static list: opens on
  click, closes on outside mousedown (`[data-dd]` pattern, shared with the other
  dropdowns — see below), header block "Merel Janssen" / "Taldo", hairline divider,
  then Account/Instellingen/Support rows with hover state
  (`var(--nav-active-bg)`/`var(--nav-active-fg)`). Still non-functional beyond
  open/close (destinations unobserved — open-questions.md #6 still applies).

## Page frame & wizard header

`main`: `max-width: var(--content-max)` (840px), `padding: 48px 24px 96px`. Breadcrumb
13px secondary, H1 32/40/700 `-0.02em`. "Concept opgeslagen om HH:MM" (circle-check icon
15px teal + text 13px secondary) sits to the **right of the H1**, not inside the Step-1
card's action row (current build renders it next to the Step-1 form's buttons) — this is
a page-level element fed by a page-level `hasSaved`/`savedAt` state, not something each
step's form should render independently.

## Step indicator

Four steps: Basisgegevens · Vacaturetekst · Contact en voorwaarden · Overzicht. Fixed
112px-wide items, 2px connector lines. Dot states: done (teal fill, "✓", teal connector),
current (card-surface fill, teal border+text, number), future (border-colour fill,
secondary text, number). **Clickable navigation gated on reachability**: steps 1-2 always
reachable, steps 3-4 only once a text mode has been chosen. Current build's `Stepper` is
presentational only (no click handling at all) — this is a real behavioural gap, not
just a style one.

## Step 1 — Basisgegevens

Matches the current build's fields and API mapping closely (already correct):
Functietitel, Categorie (dropdown), Land+Stad (grid), Type werkplek (3 pill toggles),
Uren per week min/max. Confirmed exact spec: grid `repeat(auto-fit, minmax(220px, 1fr))`
gap 20px; pill toggle `padding: 9px 18px`, `border-radius: 999px`, 14px/600, 1.5px
border, selected = teal fill + `--on-teal` text. Current `SegmentedControl` needs
restyling to this exact pill spec (it is currently unstyled/generic).

## Step 2 — Vacaturetekst: **now a mode-choice step, not a dual-panel step**

This is the single biggest behavioural gap. The current build renders
`GenerateVacancyDescriptionCard` (AI inputs) and `VacancyDescriptionEditor` (manual
fields) **simultaneously** on step 2. The real design has step 2 show **only a mode
choice**:

- Two choice cards (`repeat(auto-fit, minmax(260px, 1fr))`, gap 16px): "Zelf schrijven"
  (pencil icon, teal border when selected, `--status-passed-bg` fill) and "Taldo stelt
  een concept op" (permanently violet — `--surface-advice` bg, `--violet` border, 40x40
  icon chip with `sparkles`, violet ring `0 0 0 2px var(--violet)` when selected).
- An `AdviceCard` below both, always visible: "Een concept vacaturetekst bespaart
  gemiddeld 20 minuten" / "3 vragen · ±2 min" / ownership reassurance copy.
- Primary button disabled until a mode is picked; label is "Beantwoord 3 vragen" in AI
  mode, "Volgende" in manual mode.
- **Manual mode**: "Volgende" advances straight to step 3 (manual variant).
- **AI mode**: "Volgende" opens the **3-questions modal** (see below) instead of
  advancing directly.

The actual AI question inputs (`mostImportantTasks`/`team`/`whyNiceJob` — mapped from the
design's 3 textareas: "gemiddelde dag" → tasks, "moet iemand kunnen" → also tasks/skills,
"waarom kiezen" → whyNiceJob/team — see mapping note in Enum data below) move into the
**modal**, not step 2 itself.

## Modal — three questions (AI mode only)

New. Opens on step 2's "Volgende" in AI mode. `max-width: 560px`, `--radius-card`,
`padding: 28px`, scrolls at `max-height: 86vh`. Three labelled textareas (see README for
exact copy/placeholders — keep verbatim). Footer: ghost "Annuleren", primary "Genereer
mijn concept vacature". Submitting closes the modal, advances to step 3, and starts
generation (`generateDescription` + poll) in the background.

## Step 3 — Contact en voorwaarden: two real variants, not one

**Manual variant** (mode = manual): one card with the description textareas (Samenvatting
2 rows / Over de rol 5 / Taken 4 "Eén taak per regel" / Team en organisatie 3) **plus**
contact + salary blocks. This is different from the current build, which puts
description editing on step 2 and contact/offer on step 3 as fully separate features.

**AI variant** (mode = ai): a status banner (violet while `generating`, teal
`--status-passed-bg` once `ready`) **instead of** the description textareas — the user
only fills in contact + salary while generation runs in the background. No description
fields appear here at all in AI mode; they show up (editable) on step 4 instead.

Also new: **"Liever niet delen" checkbox** hides the entire salary row (currently no such
control exists — `VacancyContactOfferForm` always shows salary fields). Salary grid is
`repeat(auto-fit, minmax(150px, 1fr))`: Minimum / Maximum / Per periode / Vakantiedagen.

**Field mapping gap** (was already flagged, now confirmed real): the manual variant's 4
textareas are Samenvatting / Over de rol / Taken / Team en organisatie — there is
**no "Wat wij bieden" ("whatWeOffer") field anywhere in the design**. `aboutUs` maps to
"Team en organisatie". Decision needed — see Open questions.

## Step 4 — Overzicht: **editable, not read-only**

Confirmed real gap: the current `features/review-vacancy/ReviewVacancy.tsx` renders a
plain read-only `<p>` dump. The real design's Overzicht:

- While generating (AI mode): **4 skeleton bars** (60%/14px, 100%/10px, 88%/10px,
  94%/10px, `gap: 12px`) instead of any field — never a spinner.
- Once ready: job title 22px/700, meta line, "Aanpassen" link to step 1. **Editable
  textareas** for Samenvatting / Over de rol / Taken (not read-only text) — saves go
  through the same `descriptionApi.saveDescription` PATCH already used by
  `edit-vacancy-description`. In AI mode only, each section gets an "Opnieuw"
  regenerate control (`refresh-cw` icon, violet accent text) that swaps in an
  alternative draft for that section.
- Hairline, then read-only "Contact en voorwaarden": contact line + salary line in
  `--font-mono`, second "Aanpassen" link to step 3.
- Primary button: "Bekijk je vacature" → switches to the **preview** view (not
  "Voltooien" navigating away, as the current build does).

## Preview — candidate's view (missing entirely today)

New screen. Eyebrow + H1 + "Tekst aanpassen" link back to Overzicht. Card
(`padding: 0`): header block (Taldo symbol + "Geplaatst via Taldo", job title 30px/700,
four chips: location / workplace / hours-per-week (mono) / salary range or "Salaris in
overleg" (mono)); body (summary, "Over de rol", "Wat je gaat doen", "Voorwaarden" mono);
contact line + **disabled** "Solliciteren" button (this is a preview, not a real apply
flow). Footer: ghost "Terug", secondary "Bewaren als concept", primary "Publiceer
vacature" → opens the publish-confirmation modal.

## Modal — publish confirmation (missing entirely today)

`max-width: 440px`. H2 "Vacature publiceren?", body naming the vacancy title and channel
consequence, ghost "Annuleren" + primary "Ja, publiceer" → calls
`POST /vacancy/{id}/publish`.

## Published — confirmation screen (missing entirely today)

Centred column, `max-width: 520px`. 56px success circle (`--status-passed-bg` +
`circle-check`), H1 "Je vacature staat live", body naming the title, "Terug naar
overzicht" (secondary, → step 4) + "Bekijk je vacature" (primary, → preview).

## Custom dropdown (used 3x: Categorie, Land, Per periode)

README explicitly flags the prototype's div-based dropdowns as **not keyboard
operable** and tells the real build to use "the codebase's accessible listbox/combobox
… or a native `<select>` where the styling allows". See
`.claude/adr/0003-design-token-adoption.md`'s sibling ADR-0004 for the decision on this
(native `<select>`, restyled, plus a small wrapper for Land's inline ISO2 mono suffix) —
this is a real trade-off worth its own ADR, not a plan-text aside.

## Enum data — confirmed, resolutions unchanged

- **`category`**: this repo's API enum (21 values, `entities/vacancy/lib/labels.ts`) is
  already the one actually implemented against `specs/vacancy.yml` — keep it. The design
  handoff's 13-value *grouped* proposal ("Software · Backend development") is explicitly
  marked in its own README as "a proposal, not a decision — confirm with Martijn", so it
  does not override the already-shipped, contract-matching flat 21-value enum. No change
  from the existing plan's resolution (open-questions.md #3 stays open, non-blocking).
- **`location.country`**: confirmed EU27 + UK + Switzerland, Dutch-sorted, ISO2 stored —
  matches `entities/location/model/countries.ts` already. No change needed, verify the
  exact 29-entry list/order against the README's explicit code list.
- **`offer.salaryPeriod`**: confirmed `DAILY` is design-only, not in the API enum
  (`HOURLY | MONTHLY | ANNUAL`). Existing resolution (3-option dropdown from the API
  enum) stands — unchanged from open-questions.md #2.
- **AI modal's 3 questions → `GenerateVacancyDescriptionRequest`'s 3 fields**: the
  design's question copy ("Wat doet deze collega op een gemiddelde dag?", "Wat moet
  iemand zeker kunnen?", "Waarom zou iemand voor jullie kiezen?") doesn't 1:1 name-match
  `mostImportantTasks`/`team`/`whyNiceJob`. Recommended mapping (semantically closest):
  Q1 ("gemiddelde dag") → `mostImportantTasks`, Q2 ("moet kunnen") → also informs
  `mostImportantTasks`/is folded in, Q3 ("waarom kiezen") → `whyNiceJob`. `team` has no
  direct question in the modal's 3 questions — **flagged as an open question**, likely
  resolved by folding "team" context into whichever question best fits, or accepting a
  slight mismatch between the modal's Dutch copy and the request field names (the field
  names are internal, never shown to the user, so a mapping that "feels right" per HR
  generalist intent is an acceptable resolution — needs a human sanity-check, not a
  blocking one).

## Interactions, validation, formatting, motion, responsive

All confirmed as written in the README sections "Interactions & behaviour" and
"Responsive" — no corrections needed to those sections, treat them as final. Notably:
- Responsive: every multi-field row already uses (or must use)
  `repeat(auto-fit, minmax(220px, 1fr))` (150px for salary), no media queries needed —
  confirms the existing plan's "component state, no store" approach doesn't need to
  change for tablet support, this is pure CSS grid/flex-wrap discipline.
- Mobile (<640px) hamburger nav is explicitly "not designed yet" — **out of scope**,
  confirmed unchanged from open-questions.md #6. Support only tablet (`--bp-tablet:
  1024px`) down to desktop.

## Assets

Logo SVGs (`_ds/assets/logo/jobzy-symbol.svg`, `jobzy-lockup.svg`) are themselves flagged
in the source kit as **reconstructions, not the original vector** — use them as
placeholders, note in the task summary that they need swapping for real brand assets
before shipping. Icons: Lucide, via the `lucide-react` package (not a CDN) — new
dependency, add in the icon-introducing task.

---

## 2026-09-19 — approximate pass (SUPERSEDED, kept for history only)

Source: claude.ai/design project screenshot capture, Step 1 only. Steps 2-4 and all
tokens were inferred/guessed. **Every value below has been superseded by the verified
pass above — do not implement against this section.** Kept verbatim for audit trail:

- Logo: small rounded-square icon, dark green, 30px, violet notification dot — **wrong**,
  real logo is the lockup SVG, no notification dot exists in the design.
- Primary/brand "dark green" — **wrong**, real primary is teal (`oklch(0.46 0.09 175)`).
- `--content-max` "unknown, ~1160px" — **wrong**, confirmed 840px.
- Card radius "~12px" — **wrong**, confirmed 20px (`--radius-card`).
- Steps 2-4 "inferred from stepper labels + API contract" — now fully specified above;
  the actual shape (mode-choice step 2, editable step 4, preview/published/modals) was
  materially different from what was inferred.
