# Iconography

Lucide (open-source, MIT). 1.5–2px stroke, rounded joins and caps. Icons render in `ink` by default — reserve the brand color for the active or selected state only (see Navigation below).

## Core set — pipeline & product

| Concept | Lucide icon |
| --- | --- |
| Vacancy | `briefcase` |
| Candidates | `users` |
| Pipeline | `git-branch` |
| Passed screening | `check-circle` |
| Rejected | `x-circle` |
| Time in phase | `clock` |
| Channel | `radio` |
| Dashboard | `bar-chart` |
| GDPR | `shield-check` |
| Email | `mail` |
| Apply link | `link` |
| Multipost | `upload` |
| Advice | `lightbulb` |
| Signal | `triangle-alert` |
| Settings | `settings` |
| Invite | `user-plus` |

The icon-to-name mapping above is inferred from the guideline's pictograms — the source file showed rendered glyphs, not Lucide identifiers. Check each against the actual Lucide set before wiring it up; a couple of these (particularly "signal") may map to a different Lucide name depending on the exact glyph intended.

## Navigation state

Color is reserved for the active or selected item only. An inactive nav item is icon + label in `ink`; the active item adds a `teal`-tinted background with a `teal` icon and label.
