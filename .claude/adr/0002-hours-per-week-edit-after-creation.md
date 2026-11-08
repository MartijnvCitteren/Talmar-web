# ADR-0002: Hours-per-week is not editable after vacancy creation (this pass)

Status: Superseded (2026-11-08) — the upstream contract fix landed

> **Superseded.** `VacancyUpdateRequest` now exposes `minHoursPerWeek`/`maxHoursPerWeek`
> (sent together), and the backend implements them in `PATCH /vacancy/{id}`. Step 1 now
> sends every core field — hours and `language` included — on every save after creation,
> and the hours fields stay editable. The rest of this record is kept for history.
Date: 2026-09-19
Feature: vacancy-creation (issue #4)

## Context

`specs/vacancy.yml`'s `VacancyUpdateRequest` (the `PATCH /vacancy/{id}` body) does not
expose `minHoursPerWeek`/`maxHoursPerWeek` — it has a single `hoursPerWeek` field that
doesn't exist as a property anywhere else in the schema (`VacancyCoreRequest` and
`VacancyResponse` both correctly use the min/max pair; their `required` arrays also
name a nonexistent `hoursPerWeek`, suggesting the same copy-paste slip). This is a
contract bug, not an FE design choice, but the FE has to decide how to behave against
the contract as it actually is today.

Consequence: once a vacancy exists (`POST /vacancy` has run), there is no contract-valid
request body that changes its hours-per-week. `jobTitle`, `category`, `location`, and
`workplaceType` *are* independently patchable and unaffected.

## Decision

- Step 1 ("Basisgegevens") accepts and submits `minHoursPerWeek`/`maxHoursPerWeek` only
  on the *first* save (`POST /vacancy`, no `vacancyId` yet).
- If the user navigates back to Step 1 after the vacancy already exists, the hours
  fields render **read-only** (disabled, with a short inline note — copy TBD by the
  developer, something to the effect of "uren per week kunnen na aanmaken niet meer
  worden aangepast"). The other four core fields remain editable via `patchVacancyCore`.
- `entities/vacancy`'s `patchVacancyCore` is typed to accept only
  `jobTitle`/`category`/`location`/`workplaceType` — hours are excluded at the type
  level, not just by UI convention, so a future developer can't accidentally wire them
  through a PATCH call that the contract can't actually satisfy.
- File the contract bug upstream against `talmar-contracts` (add
  `minHoursPerWeek`/`maxHoursPerWeek` to `VacancyUpdateRequest`, drop the phantom
  `hoursPerWeek` from all three `required` arrays) — cross-team dependency, not
  fixable from this repo.

## Alternatives considered

- **Block all Step-1 re-editing once created** (strict variant: once `vacancyId`
  exists, the whole Step 1 form becomes read-only, forcing a restart to change
  anything). Rejected: unnecessarily blocks four fields that *are* patchable, worse UX
  for a plausible correction (typo in job title, wrong city) for no contract reason.
- **Send the (nonexistent) `hoursPerWeek` field anyway, hoping the backend added it
  without updating the spec.** Rejected: contradicts the plan's contract-first
  discipline ("don't invent endpoints/DTOs that don't exist") — if the backend actually
  added it, the fix is to regenerate types from an updated `vacancy.yml`, not to guess
  at an undocumented field.

## Consequences

- A real, if narrow, UX gap ships in this pass: hours-per-week is create-time-only.
  Acceptable because the spec's happy flow is forward-only (no explicit "go back and
  edit everything" requirement), but will need revisiting the moment such a flow is
  requested — at which point this ADR's upstream-fix dependency becomes blocking, not
  just noted.
- `specs/open-questions.md` carries the upstream contract-bug flag for a human to raise
  with the backend/contracts team.
