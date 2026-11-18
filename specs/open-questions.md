# Open questions / risks — vacancy-creation (issue #4)

Running list of things a human should confirm later. Append new entries under a dated
heading rather than editing history away.

## 2026-09-19 — architect pass (taldo-web-architect)

1. **Contract bug: `VacancyUpdateRequest` cannot carry hours-per-week.**
   `PATCH /vacancy/{id}` only has a `hoursPerWeek` field that doesn't exist as a real
   property anywhere in `specs/vacancy.yml` (should be `minHoursPerWeek`/
   `maxHoursPerWeek`, matching `VacancyCoreRequest`/`VacancyResponse`). Same phantom
   field also appears in those two schemas' `required` arrays without a matching
   property. Worked around in this pass per `.claude/adr/0002-hours-per-week-edit-after-creation.md`
   (hours become read-only once a vacancy exists). **Needs a human to raise this with
   the backend/`taldo-contracts` team** — it's a cross-team fix, not something the FE
   can resolve unilaterally, and it currently caps what Step 1 re-editing can do.

2. **`SalaryPeriod` enum mismatch with the design.** The design (both the original
   notes and the verified 2026-09-20 handoff) shows a Salarisperiode dropdown with
   per-uur / per-dag / per-maand / per-jaar, but the API enum is `HOURLY`/`MONTHLY`/
   `ANNUAL` only — no daily option. Plan builds the dropdown from the API enum (3
   options). **Needs confirmation**: was "per-dag" a genuine product requirement that
   the backend enum is missing, or was it a design mockup error? If the former, that's
   another upstream contract change; if the latter, no action needed beyond what's
   already planned. Confirmed still unresolved as of the 2026-09-20 design-parity pass
   — the real design handoff repeats the same 4-option Salarisperiode dropdown, so this
   is very likely a genuine intended feature, not a mockup error. **Leans toward
   needing the backend enum extended** — worth raising with more confidence now.

3. **Category grouping display ("Software · Backend development").** The design
   handoff's own README explicitly marks its 13-value *grouped* category proposal as
   "a proposal, not a decision — confirm with Martijn before the spec is written" — it
   is not an instruction to rebuild the already-shipped 21-value flat enum. Plan keeps
   the existing flat select (pragmatic simplification, explicitly not an ADR-level
   decision — low stakes, easy to layer grouping in visually later without touching the
   data model). **Needs confirmation**: is grouped-by-friendly-label display actually
   wanted, and if so what are the groups/labels for the real 21-value enum (not the
   design's 13)? Not blocking for this pass.

4. ~~**Exact design tokens unreachable this session.**~~ **RESOLVED 2026-09-20** — the
   real `_ds` token bundle was read in full; `specs/design-notes.md` and
   `.claude/adr/0003-design-token-adoption.md` now carry the verified values. No longer
   an open question.

5. ~~**Steps 2-4 are inferred, not directly observed.**~~ **RESOLVED 2026-09-20** — the
   real design handoff specifies every screen; `specs/design-notes.md` is now the
   verified capture. No longer an open question (superseded by the new questions below
   about specific resolution choices within the now-known design).

6. **Account menu behavior (Account / Instellingen / Support) unobserved.** Still true
   even against the verified 2026-09-20 handoff — the design confirms the menu's visual
   structure (header block, hover states, open/close mechanics) but not what
   Account/Instellingen/Support actually navigate to. Plan builds it as a real
   open/close interactive menu (per the verified design) but still non-functional
   navigation (labels render, no routes) — **needs confirmation** if/when those
   destinations matter — out of scope for issue #4 regardless.

7. **Auth is entirely out of scope for issue #4** but `shared/api/http-client` leaves a
   `getAuthToken(): string | null` seam returning `null` today. **Needs a human decision**
   on when/how auth actually lands (token storage mechanism, login flow) before any
   endpoint requiring a real bearer token can be exercised against a real backend beyond
   local mocking — every endpoint in `specs/vacancy.yml` requires `bearerAuth`, so this
   will block real (non-mocked) local testing against an actual `taldo-api`
   instance, not just this UI's own logic.

## 2026-09-19 — reviewer pass (taldo-web-reviewer)

8. **Currency dropdown narrows the contract.** `Offer.currency` is a free-text
   ISO-4217-pattern field in `specs/vacancy.yml` (`pattern: '^[A-Z]{3}$'`), not an enum.
   `features/edit-vacancy-contact-offer/lib/currencies.ts` restricts the UI to 9
   EU-focused currencies (EUR/GBP/CHF/SEK/DKK/PLN/CZK/HUF/RON), so e.g. a `REMOTE` role
   hiring in USD currently isn't representable through the UI. Non-blocking pragmatic
   simplification, same treatment as items 2-3 above. **Needs confirmation**: is a fixed
   EU currency list actually sufficient, or should this become a free-text/searchable
   field matching the contract?

9. **Client-side email format validation.** `VacancyContactOfferForm` only checks that
   `email` is non-empty, not that it's a plausible email shape — invalid formats are
   currently only caught by the backend's `400` response. Low-stakes nitpick, not
   blocking; would be a small follow-up (regex or `type="email"` + browser validation).
   The verified design handoff (`design-notes.md`, "Validation") actually specifies the
   exact regex and error copy to use (`/^[^@\s]+@[^@\s]+\.[^@\s]+$/`, "Dit adres lijkt
   nog niet compleet — controleer hem even.") — **this nitpick now has a concrete,
   design-sourced fix**, folded into T026's rework rather than left as a follow-up.

## 2026-09-20 — architect pass, design-parity revision (taldo-web-architect)

Full context: `specs/plan.md` §10, `specs/design-notes.md` (now the verified capture).
New questions raised by reading the real, high-fidelity handoff in full:

10. **"Opnieuw" (regenerate) has no dedicated backend endpoint.** The design's Step 4
    gives each description section (Samenvatting/Over de rol/Taken) its own "Opnieuw"
    control that "swaps in an alternative draft" for just that section. The contract
    only exposes one `POST /vacancy/{id}/generate-description` call that regenerates
    the whole description at once — there is no per-section regenerate endpoint. Plan
    resolves this by re-running the whole generation and keeping only the requested
    section's new value (discarding the rest) — see plan §10.8. **Needs confirmation**:
    does this read as honest UX ("Opnieuw" quietly re-runs the full AI call every time,
    not a cheap per-section nudge), or does the product actually want a real per-section
    regenerate endpoint added to the contract? Low severity but worth a human sanity
    check before the "Opnieuw" copy ships unchanged.

11. **3-questions modal copy doesn't map 1:1 onto `GenerateVacancyDescriptionRequest`'s
    3 fields.** The modal's Dutch questions ("Wat doet deze collega op een gemiddelde
    dag?" / "Wat moet iemand zeker kunnen?" / "Waarom zou iemand voor jullie kiezen?")
    don't name-match `mostImportantTasks`/`team`/`whyNiceJob` cleanly — in particular
    "team" (the request field) has no directly corresponding question in the modal's 3
    questions as designed. `design-notes.md`'s "Enum data" section proposes a mapping;
    it's a reasonable best-effort but not something the architect can confirm is
    actually what the product/backend intended. **Needs confirmation** before T024 ships
    the mapping as final.

12. **"Team en organisatie" (manual mode) has no `whatWeOffer` counterpart in the
    design.** Confirmed unchanged from the original pass's item 5 — the design's manual
    variant has exactly 4 textareas (Samenvatting/Over de rol/Taken/Team en organisatie
    → `summary`/`jobDescription`/`tasks`/`aboutUs`), with no field for
    `description.whatWeOffer`. Plan (T025) keeps `whatWeOffer` patchable in the data
    model but doesn't render an input for it, since the verified design confirms this
    isn't an oversight in the original notes — it's genuinely absent from the design.
    **Needs confirmation**: should `whatWeOffer` be dropped from the API contract
    entirely (if it's not a real product need), or does a future design pass need to
    add a field for it? Not blocking — the field simply won't be settable through this
    UI until resolved.

13. **Mobile (<640px) hamburger nav remains explicitly out of scope**, confirmed
    unchanged and now doubly confirmed by the verified handoff's own "Responsive"
    section ("Mobile nav should become a hamburger — not designed yet"). Confirmed with
    the user this pass targets tablet (~768-1024px) down to desktop only. No action
    needed unless a future pass adds mobile support.

14. **Logo and icon assets are reconstructions, not final brand files.** The design
    handoff's own `_ds` bundle flags `jobzy-symbol.svg`/`jobzy-lockup.svg` as "a
    reconstruction measured from mockups, not the original vector — replace them with
    the real files before shipping." Plan uses them as placeholders (T021) and flags
    the swap as a pre-ship follow-up. **Needs a human with access to the real brand
    asset files** before this ships externally.

## 2026-09-25 — architect pass, fine-tuning (taldo-web-architect)

Full context: `specs/plan.md` §11, PO browser-test feedback on PR #5.

15. **Contract gap: `Offer.numberOfHolidays` has no period field.** The PO wants to
    enter vakantiedagen per week/maand/jaar, but `specs/vacancy.yml`'s `Offer` schema
    only has a single `numberOfHolidays: number | null`, documented as "Full-time-
    equivalent holiday days. Never pre-computed/prorated server-side" — no period
    alongside it (unlike `Offer.salaryPeriod` for salary). Resolved pragmatically for
    this pass per `.claude/adr/0005-holiday-period-input.md`: the UI offers a period
    selector and converts to an annual FTE figure client-side before sending
    `numberOfHolidays`; the chosen period + raw entered number are kept in page-local
    state (not persisted) so Overzicht/Preview can redisplay what the user actually
    entered within the same session. **Needs a human to raise this with the
    backend/`taldo-contracts` team**: add a `holidayPeriod` field to `Offer` (same shape
    as `SalaryPeriod`, e.g. `WEEKLY | MONTHLY | ANNUAL`) so the chosen period survives a
    backend round-trip — currently it does not (a page reload or a future "resume an
    existing draft" flow would only ever see the converted annual number). Not blocking
    this pass; blocking the moment reload/resume of an in-progress vacancy is in scope.
