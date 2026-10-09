---
name: jobzy-design-system
description: Jobzy's design system (colors, type, spacing, radius, motion, components, iconography, voice & tone). Use for any UI work in this repo — writing or reviewing CSS modules, building or changing shared/ui components, choosing icons, or writing user-facing copy (labels, errors, empty states).
---

# Jobzy Design System

Source of truth: the "Jobzy - Design System" artifact on claude.ai —
https://claude.ai/artifact/S2ACsWNfY7U7Mg6WQuMeZW. The files under `reference/` are a
snapshot of it (synced 2026-10-09). If the artifact changes, re-sync `reference/` and
`src/app/styles/tokens.css` together.

## Where the design system lives in code

- **Tokens:** `src/app/styles/tokens.css` — the DS token names verbatim (ADR-0003), plus
  semantic aliases (`--text-primary`, `--surface-card`, `--action-primary`, …). Loaded once
  in `src/app/boot.tsx`. Matches `reference/tokens.json` 1:1.
- **Components:** `src/shared/ui` (exported via `src/shared/ui/index.ts`).
- **Logo:** in the UI always `<Logo />` / `<Logo variant="lockup" />` from `shared/ui` — never
  an `<img>` of the SVGs (an SVG loaded as an image can't use Inter, and its badge ring isn't
  a knockout). `public/branding/*.svg` are the DS asset files, used for the favicon only.
- **Icons:** `lucide-react`.
- **Enforcement:** `npm run lint:css` (Stylelint, `stylelint.config.js`, part of `npm run lint`)
  rejects color literals, unit literals for spacing/radius/type/motion, literal font weights,
  families and line-heights, and breakpoints other than 639/640 and 1023/1024px in CSS modules.
- **Repo extensions** (in `tokens.css`, not yet in the DS artifact): `--text-h2-*` (19px),
  `--text-h3-*` (15px), `--text-title-*` (22px), `--font-weight-*`, `--tracking-*`,
  `--line-snug`, `--radius-checkbox`, `--scrim`, `--duration-loading`, `--logo-*`,
  `--text-step-title-*` (26px, onboarding questions), `--tracking-caption`. Propose
  them to the DS before relying on them more widely.

## Hard rules

1. Never hardcode a color, spacing, radius, font size or duration in a CSS module — use
   `var(--…)` from `tokens.css`. Prefer the semantic alias where one fits
   (`--text-secondary` over `--ink-secondary`). A missing value means a new token in
   `tokens.css`, not a literal.
2. `--violet` / `--status-insight` only for advice, insight and genuinely new things. Never
   decorative.
3. `--sand` only for "needs attention" and warm accents — never a second primary.
4. Status never by color alone: passed = circle, attention = square, rejected = triangle,
   insight = diamond, always with a label.
5. `--font-mono` / `figure` style only for dashboard numbers (cost, %, days).
6. Spacing: `--space-1/2` inside controls, `--space-3/4` between fields and inside cards,
   `--space-5/6` between page sections. Controls use `--radius-control`, cards
   `--radius-card`. Circles use `--radius-pill`.
7. Motion: one easing (`--duration` 280ms ease-out); hover is a background/border tint
   only (`--transition-hover`, 200ms), never shadow or lift. Loading = `Skeleton` bars,
   never a spinner. At most one motion moment per screen.
8. Layout: content max `--content-max` (840px); breakpoints mobile < 640px, tablet <
   1024px. Light theme only for v1.
9. Copy: Dutch, informal "je". Advice is a suggestion with the number attached; errors are
   calm and never blame the user or show raw codes; empty states are encouraging.

## Component mapping (DS → `shared/ui`)

| DS component | In code | Notes |
| --- | --- | --- |
| Buttons — primary / secondary / ghost | `Button` `variant="primary" \| "secondary" \| "text"` | DS "ghost" = `text`; 15px/600, teal secondary outline, shared disabled style |
| Buttons — reject candidate | not yet | Add as a `Button` variant using `--action-destructive` when first needed |
| Inputs (default / focus / error / disabled) | `TextField`, `NumberField`, `Select` (`fields.module.css`), `Checkbox` | Focus = teal border; error helper text follows voice & tone |
| Status badges | not yet | Build per `reference/components/StatusBadges.md` (shape + color + label) |
| Motion — loading | `Skeleton` | |
| Logo | `Logo` `variant="symbol" \| "lockup"`, `size` 28/48/72/112/168 | Never recolor the violet badge; clearspace = height ÷ 2 |
| (HR signup hi-fi) dot progress | `DotProgress` | Decorative; always paired with a "Stap n van m" caption |
| (HR signup hi-fi) focused frame | `OnboardingLayout` | Nav-less top bar + 340px column for one-question-per-screen flows |

## Reference files — read the one you need

- `reference/brand-book.md` — principles, color, typography, spacing, layout, motion, imagery
- `reference/tokens.json` — every token with its usage note
- `reference/components/{Buttons,Inputs,StatusBadges,Motion,Logo}.md` — component guidelines
- `reference/iconography.md` — Lucide icon per concept, nav active state
- `reference/voice-and-tone.md` — copy rules with Dutch examples
- `reference/platform-notes.md` — stack, breakpoints, GDPR consent, dark mode

## Open items flagged by the design system itself

- `--danger` is approximated — confirm the real value before shipping.
- No `teal-on-dark` token yet; the dark logo lockup reuses `--teal`.
- The Lucide mapping in `iconography.md` is inferred; verify names (especially "signal").
