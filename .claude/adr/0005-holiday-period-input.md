# ADR-0005: Holiday days entered per week/month/year, converted client-side to annual FTE for the API

Status: Accepted (pragmatic workaround pending an upstream contract addition)
Date: 2026-09-25
Feature: vacancy-creation (issue #4), fine-tuning pass (plan §11, PO feedback on PR #5)

## Context

The PO tested the shipped wizard and asked for "Aantal vakantiedagen" to be entered per
week, per maand, or per jaar — not just as a single bare number, mirroring how
"Salarisperiode" already works for salary.

`specs/vacancy.yml`'s `Offer` schema:

```yaml
numberOfHolidays:
  type: [number, 'null']
  description: >
    Full-time-equivalent holiday days. Never pre-computed/prorated server-side.
```

Unlike `salaryMin`/`salaryMax` (paired with `salaryPeriod`), there is no
`holidayPeriod` field anywhere in the contract — `numberOfHolidays` is a single,
period-less annual-FTE figure by the API's own description. The FE has to decide how to
offer a period-aware input against a period-less API field.

## Decision

- The UI offers a `HolidayPeriod = 'WEEKLY' | 'MONTHLY' | 'ANNUAL'` select next to the
  vakantiedagen `NumberField` (`entities/vacancy/lib/holidays.ts`: `holidayPeriodOptions`/
  `holidayPeriodLabels`, same pattern as the existing `salaryPeriodLabels`).
- Before the `patchVacancyContactOffer` call, the entered amount is converted to an
  annual FTE figure client-side (`toAnnualHolidayDays`: ×52 for weekly, ×12 for monthly,
  ×1 for annual) and sent as the one `numberOfHolidays` number the contract expects — no
  new field is invented on the wire.
- The user's raw entered amount + chosen period are kept in page-local state
  (`VacancyCreatePage`'s `holidayInput`, plan §11.3), threaded into `review-vacancy` and
  `preview-vacancy` so Overzicht/Preview can redisplay what the user actually typed
  ("5 vakantiedagen per week") rather than always showing the converted annual figure
  ("260 vakantiedagen per jaar") within the same session.
- Raise an upstream `taldo-contracts` request to add a `holidayPeriod` field to `Offer`
  (mirroring `SalaryPeriod`'s shape) — tracked in `specs/open-questions.md` #15, cross-
  team, not fixable from this repo alone.

## Alternatives considered

- **Block this requirement until the contract adds `holidayPeriod`.** Rejected: the
  annual-FTE number the contract already wants is exactly what a client-side conversion
  produces — nothing about the desired behavior is actually blocked by the missing
  field, only the *redisplay* of the originally-chosen period across a reload is. Making
  the PO wait on a cross-team contract change for an input-convenience feature the FE
  can fully deliver today is disproportionate.
- **Encode the period into the existing field somehow** (e.g. a sentinel, a second
  hidden value smuggled via `whatWeOffer` or similar). Rejected outright — silently
  abusing an unrelated field to carry data the schema doesn't model is exactly the kind
  of contract-undermining trick the project's "don't invent endpoints/DTOs" discipline
  exists to prevent (same reasoning as ADR-0002's rejected alternative).

## Consequences

- Within a single wizard session, Overzicht/Preview show the period the user actually
  chose, backed by page-local state (never persisted to browser storage, consistent with
  the rest of the wizard's PII/no-persistence rules — holiday days aren't PII, but the
  same page-local-only discipline applies for consistency).
- If the session ends before publish and a future "resume an existing draft" flow reads
  the vacancy back from the API (out of scope today, no such flow exists), only the
  converted annual number is available — the period a user chose is not recoverable from
  the backend. The FE must fall back to displaying the raw annual figure
  (`fromAnnualHolidayDays(numberOfHolidays, 'ANNUAL')`, i.e. "X vakantiedagen per jaar") in that
  case, not guess a period. This is the gap the upstream `holidayPeriod` field would
  close.
- Week/month → annual conversion (×52, ×12) can produce non-integer results; the
  contract types `numberOfHolidays` as `number`, not `integer`, so this is valid as-is —
  no client-side rounding is applied before sending it.
