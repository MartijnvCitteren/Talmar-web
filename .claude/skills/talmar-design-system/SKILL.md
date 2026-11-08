---
name: talmar-design-system
description: Talmar's design system (colors, type, spacing, radius, motion, components, iconography, voice & tone). Use for any UI work in this repo — writing or reviewing CSS modules, building or changing shared/ui components, choosing icons, or writing user-facing copy (labels, errors, empty states).
---

# Talmar Design System

Source of truth: the design system artifact on claude.ai —
https://claude.ai/artifact/S2ACsWNfY7U7Mg6WQuMeZW. The files under `reference/` are a
verbatim snapshot of it (last checked 2026-10-18). If the artifact changes, re-sync
`reference/` and `src/app/styles/tokens.css` together.

The artifact predates the rename and is still titled "Jobzy - Design System", so the
snapshot says "Jobzy" and `jobzy-*.svg`. Read that as Talmar: the product name in UI copy
is "Talmar" and the logo files are `talmar-*.svg`.

## Where the design system lives in code

- **Tokens:** `src/app/styles/tokens.css` — the DS token names verbatim (ADR-0003), plus
  semantic aliases (`--text-primary`, `--surface-card`, `--action-primary`, …). Loaded once
  in `src/app/boot.tsx`. Matches `reference/tokens.json` 1:1.
- **Components:** `src/shared/ui` (exported via `src/shared/ui/index.ts`).
- **Logo:** in the UI always `<Logo />` / `<Logo variant="lockup" />` from `shared/ui` — never
  an `<img>` of the SVGs. The component is drawn from the official Talmar vectors in
  `design/talmar-logo/svg` (next to this repo): the "t"-with-dot icon on a green tile, and
  the wordmark as outlined paths. Its colors are the `--logo-*` tokens, the exact values of
  those files. `public/branding/talmar-symbol.svg` (= `talmar-icon.svg`),
  `talmar-lockup.svg`, `talmar-icon-180.png` and `public/favicon.ico` are copies of the
  official files, used for the favicon only. The old reconstructed Jobzy mark (square hub
  with a signal badge) is gone; `reference/components/Logo.md` still describes it.
- **Icons:** `lucide-react`.
- **Enforcement:** `npm run lint:css` (Stylelint, `stylelint.config.js`, part of `npm run lint`)
  rejects color literals, unit literals for spacing/radius/type/motion, literal font weights,
  families and line-heights, and breakpoints other than 639/640 and 1023/1024px in CSS modules.
- **Repo extensions** (in `tokens.css`, not yet in the DS artifact): `--surface-input` (white
  field background) and `--border-input` (field hairline), `--text-h2-*` (19px),
  `--text-h3-*` (15px), `--text-title-*` (22px), `--font-weight-*`, `--tracking-*`,
  `--line-snug`, `--radius-checkbox`, `--scrim`, `--duration-loading`, `--logo-*`. Propose
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
| Inputs (default / focus / error / disabled) | `TextField`, `NumberField`, `Select` (`fields.module.css`), `Checkbox` | White field (`--surface-input`) on the warm card; focus = teal border; disabled = warm surface; error helper text follows voice & tone |
| Status badges | not yet | Build per `reference/components/StatusBadges.md` (shape + color + label) |
| Motion — loading | `Skeleton` | |
| Logo | `Logo` `variant="symbol" \| "lockup"`, `size` 28/48/72/112/168 | Official Talmar vectors; never recolor the violet dot; clearspace = height ÷ 2 |

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
