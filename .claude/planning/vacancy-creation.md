# Plan: Vacancy creation frontend (feature slug: `vacancy-creation`)

Status: FINAL — ready for `taldo-web-developer`. **Revised 2026-09-20** for
design-parity with the real, high-fidelity handoff (see §10 below) — §1-9 are the
original architecture pass and remain valid except where §10 explicitly supersedes them.
**Further revised 2026-09-25** for a PO-reported fine-tuning pass on the shipped,
design-parity build (see §11 below) — §1-10 remain valid except where §11 explicitly
supersedes them.
Source spec: `specs/spec.md` (GitHub issue #4). Design source: `specs/design-notes.md`
(now VERIFIED, see its own status line — supersedes its own 2026-09-19 approximate
capture).
Contract: `specs/vacancy.yml` (OpenAPI 3.1.1, `taldo-contracts` VacancyApi, copied as-of 2026-09-19).
Task list: `specs/tasks.md` (Speckit-style task IDs T001-T043, this plan is their source of truth).
Companion ADRs: `.claude/adr/0001-runtime-config-mechanism.md`,
`.claude/adr/0002-hours-per-week-edit-after-creation.md`,
`.claude/adr/0003-design-token-adoption.md`, `.claude/adr/0004-dropdown-implementation.md`,
`.claude/adr/0005-holiday-period-input.md`.

This file is also mirrored at `.claude/planning/vacancy-creation.md` for
`taldo-web-developer`'s workflow, which reads plans from that fixed path. If the two
ever diverge, `specs/plan.md` is the source of truth — copy forward into the mirror.

---

## 1. Contract findings that shape this plan (read this first)

Before laying out FSD slices: `specs/vacancy.yml` has two things that change what's
buildable in this pass. Both are cross-team contract issues, not FE bugs — flag upstream
to `taldo-contracts`/backend, don't try to route around them cleverly client-side.

1. **`VacancyUpdateRequest` (the `PATCH /vacancy/{id}` body) cannot carry hours-per-week.**
   `VacancyCoreRequest` and `VacancyResponse` both use `minHoursPerWeek`/`maxHoursPerWeek`,
   but `VacancyUpdateRequest` only has a single `hoursPerWeek` field that doesn't exist
   anywhere else in the schema (`required` on `VacancyCoreRequest`/`VacancyResponse` also
   lists a nonexistent `hoursPerWeek` alongside the real min/max properties — almost
   certainly a copy-paste leftover across three schemas). Practical effect: once a
   vacancy is created via `POST /vacancy`, there is no contract-valid way to change its
   hours-per-week afterward. See ADR-0002 for the resolution.
2. **`SalaryPeriod` enum has no `DAILY`** (`HOURLY`/`MONTHLY`/`ANNUAL` only), but the
   design describes a "per-dag" option in the Salarisperiode dropdown. Resolution:
   build the Step 3 dropdown from the API enum (source of truth), i.e. 3 options, not 4.
   Confirmed unchanged by the verified design pass — flagged in `specs/open-questions.md`.

Everything below assumes these two resolutions. `specs/vacancy.yml` uses singular
`/vacancy` (not `/vacancies`) — confirmed still consistent with the design handoff's own
`Jobzy_Vacancy_OpenAPI_Instructions.md` illustrative examples (which use plural as a
generic illustration, not this repo's actual contract); no drift found between this
repo's contract and the design handoff's assumptions about staged creation, JSON Merge
Patch semantics, or the `/publish` endpoint's existence.

## 2. Tech setup (already implemented, unchanged)

- Vite + React 19 + TypeScript strict, `src/` houses all FSD layers. Already scaffolded.
- `openapi-typescript`-generated types committed at
  `src/shared/api/generated/vacancy-api.ts`. Unchanged.
- Vitest + React Testing Library; Playwright for the one `create-vacancy` flow (§7,
  T017, already implemented — extend, don't replace, per §10.7 below).
- Steiger + FSD ESLint boundary lint wired into `npm run lint`/CI. Already implemented —
  every new slice in §10 must pass it, no exceptions.
- Runtime config (`public/config.json`, ADR-0001). Unchanged, not touched by this pass.

## 3. FSD layer plan (original — see §10.2 for the revised, current layout)

```
src/
  app/
  pages/
    vacancy-create/
  widgets/
    app-shell/
  features/
    create-vacancy-core/
    generate-vacancy-description/
    edit-vacancy-description/
    edit-vacancy-contact-offer/
    review-vacancy/
  entities/
    vacancy/
    vacancy-description/
    location/
  shared/
    api/
    config/
    lib/
    ui/
```

Import direction is strictly `app → pages → widgets → features → entities → shared`.
This section describes the layout as originally planned and as it exists in the repo
today (all of it is implemented). §10.2 lists exactly what's added/changed on top of it
for design parity — nothing here is deleted, this is additive plus several targeted
reworks of feature internals (not their FSD placement).

### 3.1-3.6

Unchanged from the original pass — `shared/`, `entities/`, `features/`, `widgets/`,
`pages/vacancy-create/`, `app/` are all implemented as originally planned in
`src/`. See the repo itself as the source of truth for what exists; §10 below is the
delta on top of it. (The original prose describing each slice is preserved in git
history / the pre-2026-09-20 version of this file if needed for archaeology — not
reproduced here to avoid this document drifting from the actual code as it evolves.)

## 4. API boundary summary (original — extended in §10.4)

| Concern | Adapter method | Endpoint | Contract status |
|---|---|---|---|
| Create vacancy (Step 1, first save) | `vacancyApi.createVacancy` | `POST /vacancy` | Covered |
| Edit core fields (Step 1, resubmit) | `vacancyApi.patchVacancyCore` | `PATCH /vacancy/{id}` | Covered *except hours* — ADR-0002 |
| Start AI generation (Step 2 modal) | `descriptionApi.generateDescription` | `POST /vacancy/{id}/generate-description` | Covered |
| Poll generation status | `descriptionApi.getGenerationStatus` | `GET /vacancy/{id}/generate-description/{generationId}` | Covered |
| Save manual/edited description (Step 3/4) | `descriptionApi.saveDescription` | `POST /vacancy/{id}/description` | Covered |
| Save contact + offer (Step 3) | `vacancyApi.patchVacancyContactOffer` | `PATCH /vacancy/{id}` | Covered |
| **Publish (Preview → Published)** | **`vacancyApi.publishVacancy` — new, §10.4** | `POST /vacancy/{id}/publish` | Covered, not yet wired client-side |

All calls route through `entities/vacancy` or `entities/vacancy-description`'s adapters
— never `fetch`/the generated client directly from a feature, widget, or page. This
discipline is already enforced and must not regress in any of §10's new slices.

## 5. State management (original — extended in §10.5)

Local/component state only, as decided. Unchanged reasoning: wizard state is
single-page, single-user, must not survive navigation or land in `localStorage`/
`sessionStorage` (PII). §10.5 lists the additional state the page must now hold to
support mode choice, view switching, and generation phase.

## 6. PII handling (unchanged)

`ContactPerson` (name, email, phone) is the only candidate/personal-data-shaped input in
this feature. Rules unchanged: never log it, never persist wizard state to browser
storage, `http-client` error logging never echoes `errors[].message` verbatim. The new
preview screen renders the contact line **read-only, on-screen only** — same rule
applies (no analytics event, no storage). The published-confirmation screen shows only
the job title, no PII.

## 7. Test plan (original — extended in §10.6)

Original Vitest/RTL and Playwright plan stands for all already-implemented slices.
§10.6 lists what's added for the new/reworked slices — same standard (real logic gets a
failing-test-first Vitest/RTL case; purely presentational wrappers don't need dedicated
tests, noted explicitly per task rather than silently skipped).

## 8. Architectural risks (original — see §10.8 for new/updated risks)

- **Contract gap (hours-per-week on PATCH)** — unchanged, ADR-0002 still governs.
- Steiger/FSD-lint — already landed (T001), no longer a live risk.
-~~"Design notes are only fully observed for Step 1"~~ — **resolved by this revision**:
  the verified design pass (`specs/design-notes.md`) now covers every screen. See §10.8
  for the risks this revision itself introduces.
- `public/config.json` vs `.env` — unchanged, not touched by this pass.

## 9. Task list (superseded — see §10.9 and `specs/tasks.md`)

`specs/tasks.md` now runs T001-T033: T001-T019 are the original pass (all implemented
and reviewed — do not redo them), T020-T032 are this revision's new/rework tasks
(§10.9), and **T033 is the new, single trailing `[review-gate]` task**, depending on
every implementation task including the original T001-T018 and the new T020-T032 (T019,
the original review-gate, is superseded — its sign-off stands for what it reviewed, but
final sign-off for the feature as a whole now happens at T033).

---

## 10. Design-parity revision (2026-09-20)

Trigger: the real, high-fidelity design handoff (`design_handoff_vacancy_creation/`) is
now available and has been read in full (`specs/design-notes.md` is the verified
capture, cited by README section throughout). The first implementation pass shipped
against approximate, Step-1-only-observed design notes; this revision closes every gap
between what's built and what the real handoff specifies, for **full parity**: all
screens, all modals, all tokens, tablet-down-to-1024px responsiveness. Confirmed scope
with the user: no mobile (<640px) support required, matching the design's own
"not designed yet" note.

### 10.1 What's a style gap vs. what's a real behavioural gap

Read this before assigning tasks — it changes how much rework each task actually is.

**Pure style/token gaps** (component exists, logic is right, CSS needs to match the real
tokens): navbar chrome, Step 1's pill toggle styling, card/input/button visual chrome
across every step, salary/contact grid layout, chip/badge styling in the (new) preview
screen.

**Real behavioural gaps** (logic itself is missing or shaped wrong, not just unstyled):

1. **Step 2 is currently a dual-panel step (AI inputs + manual fields shown together);
   the design is a mode-choice step** (`design-notes.md` "Step 2 — Vacaturetekst").
   `mode: null | 'manual' | 'ai'` doesn't exist as page state today.
2. **The 3-questions modal doesn't exist.** AI question inputs are currently inline on
   step 2, not gated behind step 2's "Volgende" via a modal.
3. **Step 3 doesn't have two variants.** Description editing currently happens entirely
   on step 2 (`edit-vacancy-description`); the design puts it on step 3 (manual mode
   only) or shows a generating/ready banner instead (AI mode).
4. **Step 4 ("Overzicht") is read-only today; the design makes it editable** — job
   description sections are editable textareas with per-section "Opnieuw" regenerate in
   AI mode, plus "Aanpassen" links back to steps 1 and 3, plus skeleton loading while
   generation is in flight.
5. **No "Liever niet delen" salary-hidden checkbox** — `edit-vacancy-contact-offer`
   always shows salary fields.
6. **The Stepper is presentational only** — no click-to-navigate, no reachability
   gating (steps 3-4 blocked until a mode is chosen).
7. **"Concept opgeslagen" is rendered inside the Step 1 card**, not page-level next to
   the H1 as the design specifies — needs lifting to `pages/vacancy-create`.
8. **Preview view, Published view, and the publish-confirmation modal don't exist at
   all** — entirely new screens/features, no prior partial implementation to build on.
9. **`vacancyApi` has no `publishVacancy` method** — `POST /vacancy/{id}/publish` is in
   the contract and unused.
10. **The account-menu dropdown is a static list**, not an interactive open/close menu
    with outside-click dismissal.
11. **Dropdowns are unstyled native `<select>`s** with no ISO2 mono suffix for Land —
    see ADR-0004 for the resolution (restyled native `<select>`, not a rebuild).

### 10.2 Revised FSD layer plan

Additive on top of the existing tree (§3), nothing removed:

```
src/
  app/
    styles/tokens.css          — REPLACED wholesale, ADR-0003 (T020)
  widgets/
    app-shell/                 — REWORKED: real chrome, icons, interactive account menu (T021)
  features/
    choose-vacancy-text-mode/  — NEW: Step 2 mode-choice UI (T023)
    generate-vacancy-description/  — REWORKED: owns the 3-questions modal +
                                      a `useGenerateVacancyDescription` phase hook,
                                      no longer renders inline on step 2 (T024)
    edit-vacancy-description/  — REWORKED: moves to Step 3 (manual variant only),
                                  drops the "Volgende" duplication with step 4 (T025)
    edit-vacancy-contact-offer/ — REWORKED: two variants (manual adds description
                                   fields; both add "Liever niet delen" + AI banner) (T026)
    review-vacancy/            — REWORKED: editable Overzicht, skeletons, "Opnieuw",
                                  "Aanpassen" links, "Bekijk je vacature" → view switch (T027)
    preview-vacancy/           — NEW: candidate's-view screen (T028)
    publish-vacancy/           — NEW: publish-confirmation modal + publish call +
                                  the Published confirmation screen (same lifecycle,
                                  kept together — see reasoning below) (T029)
  entities/
    vacancy/
      api/vacancyApi.ts        — add `publishVacancy` (T022)
  shared/
    ui/
      Modal.tsx                — NEW: generic modal (focus trap, Escape, scrim),
                                  used by both new modals (T020b)
      Skeleton.tsx              — NEW: animated bar loading primitive (T020b)
      Checkbox.tsx              — NEW: "Liever niet delen" (T020b)
      ChoiceCard.tsx            — NEW: the two Step 2 mode cards' shared shell (T020b)
```

**FSD placement reasoning for the two new features:**

- `features/preview-vacancy` — a verb-noun feature ("preview the vacancy"), reads the
  in-memory `VacancyResponse` (no new GET), renders the candidate-facing layout, and
  exposes the footer actions (Terug/Bewaren als concept/Publiceer vacature). It's
  feature-shaped (one clear user action: review-as-candidate + trigger publish intent),
  not a widget — it's used on exactly one page, same reasoning as the existing stepper
  pragmatic-call precedent in §3.4.
- `features/publish-vacancy` — owns the **publish lifecycle** end to end: the
  confirmation modal, the `publishVacancy` call, and the resulting Published screen.
  These three are kept in one feature (not three) because they're one state machine
  (`idle → confirming → publishing → published`), not three independent concerns; splitting
  them would force the page to shuttle publish-in-flight state between three feature
  boundaries for no reuse benefit (none of the three pieces is independently reusable
  elsewhere). If a future page ever needs to trigger a publish-confirmation modal
  without the full-page Published screen (e.g. a future vacancies-list page's "publish"
  row action), split `PublishConfirmModal` out at that point — not preemptively now.
- Neither feature imports the other's internals; the page (`pages/vacancy-create`)
  orchestrates `view` transitions between them, per existing FSD discipline (features
  don't import sideways).

### 10.3 Public API / index.ts discipline for the new slices

- `features/choose-vacancy-text-mode/index.ts` exports `<VacancyTextModeChoice>` only
  (props: `mode`, `onModeChange`, `onNext` — page owns `mode` state, this feature is a
  controlled component, consistent with the existing pattern of features not owning
  cross-step state themselves).
- `features/generate-vacancy-description/index.ts` exports `<ThreeQuestionsModal>`,
  `useGenerateVacancyDescription()` (the phase/poll hook), and its existing types. The
  hook is the seam `review-vacancy` (for skeletons/"Opnieuw") and
  `edit-vacancy-contact-offer` (for the generating/ready banner) both need — **it must
  live here, not be duplicated**, since this feature already owns the
  generate+poll API calls. Both consumers receive `phase`/`result`/`regenerate` via
  props from the page, which holds the hook instance — features still don't import each
  other directly.
- `features/preview-vacancy/index.ts` exports `<VacancyPreview>` only.
- `features/publish-vacancy/index.ts` exports `<PublishConfirmModal>`,
  `<PublishedConfirmation>`, and `usePublishVacancy()` (owns the `publishVacancy` call +
  its own loading/error state — page doesn't need to know the HTTP details, just
  `publish(): Promise<VacancyResponse>` and a `publishing`/`error` pair).
- `shared/ui/index.ts` gains `Modal`, `Skeleton`, `Checkbox`, `ChoiceCard` exports.

No feature reaches into another feature's or entity's internals beyond its `index.ts` —
this doesn't change from the original plan's discipline.

### 10.4 API boundary additions

| Concern | Adapter method | Endpoint |
|---|---|---|
| Publish (Preview → Published) | `vacancyApi.publishVacancy(id): Promise<VacancyResponse>` | `POST /vacancy/{id}/publish` |

No other new endpoint is needed — every other new screen reads the already-in-memory
`VacancyResponse`/`VacancyDescriptionResponse` the wizard already holds. `publishVacancy`
must surface a `409 Conflict` (illegal transition, per the contract's Problem Details
spec) as a visible `ErrorBanner` in the publish-confirmation modal, not a silent failure
or an uncaught rejection — same unhappy-path discipline as every other adapter call.

### 10.5 State management additions

`pages/vacancy-create/ui/VacancyCreatePage.tsx` gains, on top of its existing
`currentStep`/`vacancy`/`generatedDraft` state:

- `view: 'wizard' | 'preview' | 'published'` — drives which top-level screen renders.
- `mode: null | 'manual' | 'ai'` — set by `choose-vacancy-text-mode`, gates step 2's
  "Volgende" (disabled while `null`) and steps 3-4's stepper-click reachability.
- `questionsOpen: boolean` — 3-questions modal visibility.
- `confirmOpen: boolean` — publish-confirmation modal visibility.
- `hasSaved: boolean` / `savedAt: string | undefined` — lifted up from
  `create-vacancy-core` (which currently owns this locally); rendered next to the H1,
  not inside the step 1 card. `create-vacancy-core` calls `onSaved` (already does) and
  the page sets `hasSaved`/`savedAt` from that, same as it already threads `onSaved`
  into `setVacancy`.
- The generation phase (`idle | generating | ready | failed`) lives in the
  `useGenerateVacancyDescription()` hook instance the page holds (§10.3) — not
  duplicated as separate page state.

Still no store library — this is still genuinely page-local, single-user state; the
addition of `view`/`mode`/modal-open booleans doesn't change the reasoning in §5, it's
just more of the same kind of state.

### 10.6 Test plan additions

**Vitest + RTL:**

- `shared/ui/Modal` — traps focus, closes on Escape and on scrim click, returns focus
  to the trigger on close.
- `shared/ui/Skeleton`, `Checkbox`, `ChoiceCard` — `Skeleton` and `Checkbox` get a
  cheap render/interaction test (checked state toggles, ARIA); `ChoiceCard` is mostly
  presentational (selected/unselected classNames) — a single snapshot-style assertion is
  enough, don't over-test styling per the existing plan's own explicit note.
- `features/choose-vacancy-text-mode` — "Volgende" disabled until a mode is picked,
  label changes to "Beantwoord 3 vragen" in AI mode, `onNext` fires with the chosen mode.
- `features/generate-vacancy-description` — `ThreeQuestionsModal` submit calls
  `generateDescription` + starts polling and closes itself; `useGenerateVacancyDescription`
  hook's phase transitions (`idle→generating→ready`, `idle→generating→failed`) with fake
  timers, `regenerate(section)` re-triggers generation and only replaces the requested
  section (see open-questions.md new #10 on this simplification's exact shape).
- `features/edit-vacancy-contact-offer` — "Liever niet delen" hides the salary grid and
  clears/nulls salary fields on save; AI-mode banner reflects the shared generation
  phase (`generating` violet / `ready` teal) via a prop, not its own polling.
- `features/review-vacancy` — skeleton renders while `phase === 'generating'`; editable
  textareas save via `saveDescription`; "Opnieuw" wired to `regenerate`; "Aanpassen"
  links call the page's step-navigation callback with the right target step.
- `features/preview-vacancy` — renders chips/sections from a given `VacancyResponse`;
  "Solliciteren" is disabled; "Publiceer vacature" opens `confirmOpen` (assert via the
  callback prop, not by reaching into `publish-vacancy`'s internals).
- `features/publish-vacancy` — modal calls `publishVacancy` on confirm, surfaces a 409
  as a visible error and does not transition `view`; on success transitions to
  `PublishedConfirmation` with the vacancy title.
- `widgets/app-shell` — account menu opens on click, closes on outside mousedown,
  matches the existing `[data-dd]`-equivalent pattern.
- `pages/vacancy-create` — full click-through **twice**: once for manual mode (step 1 →
  step 2 choose manual → step 3 manual variant → step 4 → preview → publish → published),
  once for AI mode (step 2 choose AI → 3-questions modal → step 3 AI variant/banner →
  step 4 skeleton → ready → preview → publish → published) — this is the actual
  integration surface that proves the mode-branching behaviour end to end, more valuable
  here than in either individual feature's isolated test.
- Tablet-width regression: a component/page test asserting the multi-field grids
  (`repeat(auto-fit, minmax(...))`) don't require a media query to reflow — assert via
  computed style or a snapshot at a reduced container width if the test setup supports
  it; if not practically assertable in JSDOM (grid reflow is a real-layout concern
  JSDOM doesn't compute), downgrade this to a manual verification step recorded in the
  task summary (open a real browser at ~800px width) rather than a fake-passing test.

**Playwright** — extend the existing single `create-vacancy` flow (T017) rather than
adding a second flow: it must now also exercise the mode choice (manual, to keep it
deterministic — same reasoning as the original plan), the new step 4 editable overzicht,
the preview screen, and the publish confirmation through to the Published screen. This
is still the one canonical end-to-end flow for this feature — extending it to its now-
longer real length is the right call, not a second Playwright test for "preview" or
"published" in isolation.

### 10.7 Responsive (tablet, down to ~768-1024px)

No new component-level task beyond what §10.2's CSS rework already requires — this is a
cross-cutting CSS discipline applied while building every new/reworked slice, not a
separate feature. Task T032 is a dedicated **verification** pass (not new
implementation): resize every screen down to 768px and 1024px and confirm every
`repeat(auto-fit, minmax(...))` grid (Step 1's Land+Stad and hours-min/max rows, Step
3's contact and salary rows, Step 2's choice-card grid) reflows to single/double column
without a horizontal scrollbar or clipped content, and that header rows (`flex-wrap:
wrap`) don't overlap. Record pass/fail per screen in the task summary. Confirmed with
the user: no mobile (<640px) support required.

### 10.8 Architectural risks (this revision)

- **Shared generation-phase hook fan-out** (§10.3): `useGenerateVacancyDescription`'s
  phase now drives three consumers (step 3's banner, step 4's skeleton/regenerate, and
  the modal that starts it) via page-held state instead of each owning its own polling.
  Real risk if a future developer reaches for a second polling instance "for
  convenience" instead of threading the existing one through props — would silently
  double the generation calls against the backend. Mitigate by making this explicit in
  the task instructions (T024, T026, T027) and flagging it again at the review gate.
- **Step 4 becoming editable is a bigger behavioural change than a visual one** — the
  original plan's `review-vacancy` was deliberately read-only ("no new GET call needed…
  every section was already persisted"). It's still true no new GET is needed, but
  "editable" means step 4 now makes its own `saveDescription` PATCH calls, which the
  original plan's architecture didn't anticipate. Not a layering violation (still routes
  through `entities/vacancy-description`'s existing adapter), but worth naming so nobody
  mistakes this for scope creep — it's a confirmed, cited design requirement
  (`design-notes.md` "Step 4 — Overzicht: editable, not read-only"), not an invented one.
- **"Opnieuw" (regenerate) has no dedicated backend endpoint** — the contract only has
  one `generate-description` call producing the whole description in one shot. Per-section
  regenerate is a client-side simplification (re-run generation, keep only the requested
  section's new value, discard the rest) — see open-questions.md new #10. Low severity
  (cosmetic mismatch between "feels like per-section AI" and "actually re-runs the whole
  generation"), but worth a human confirming this UX reads honestly rather than
  misleadingly before it ships.
- **Logo/icon assets are reconstructions, not final brand files** (`design-notes.md`
  "Assets") — low severity, cosmetic, flagged for a pre-ship swap, not blocking this
  pass.
- **New `lucide-react` dependency** — first icon library in this codebase; low risk, but
  note it in the task summary so it's visible in the diff rather than silently appearing
  in `package.json`.

### 10.9 New/revised task list

See `specs/tasks.md` T020-T033 for the ordered, ID-tagged breakdown. T020-T032 are
implementation tasks (all traceable to this section); T033 is the single trailing
`[review-gate]` task depending on all of T001-T018 and T020-T032.

---

## 11. Fine-tuning pass (2026-09-25)

Trigger: the PO (Martijn) browser-tested the shipped, design-parity build (open PR
`MartijnvCitteren/Taldo-web#5`, `feature/4-redesign-vacancy-creation`) and reported
5 issues. Root causes below are diagnosed against the actual current code, not
guessed. This is a **polish pass** — no new screens, no new FSD slices; T034-T042 rework
existing slices in place, T043 is this pass's own single review gate.

### 11.1 Issues → root cause → fix, by FSD location

1. **Card heading/description spacing** (step 1, and — for consistency — every other
   card with an intro line). `shared/ui/Card` is `display:flex; flex-direction:column;
   gap: var(--space-3)` (24px between *every* child, including a heading and its very
   next paragraph), and `VacancyCoreForm`'s `<p>` inherits body-copy size. Fix: a new
   `shared/ui/CardHeader` primitive (`title`, `description?`, `level?: 2 | 3`, default
   `2`) that groups heading+description at `gap: var(--space-1)` (8px, not the card's
   24px), description in `--text-secondary` at `--text-ui-size` (14px) — matching the
   design tokens' own "helper/meta" scale. Adopted in `create-vacancy-core`
   (Basisgegevens), `choose-vacancy-text-mode` (Vacaturetekst — choose view), and
   `review-vacancy` (Overzicht, "Alles staat er…"); also adopted (heading only, bumped
   `h3`→`h2`) in `edit-vacancy-description` once it becomes a standalone step-2 view
   under item 2 below, since it's no longer a co-located sub-card next to another `h2`.
   Exported from `shared/ui/index.ts`.

2. **Vacaturetekst and Contact en voorwaarden must be separate pages (manual mode).**
   Today `pages/vacancy-create/ui/VacancyCreatePage.tsx` (lines ~116-133) renders
   `VacancyDescriptionEditor` **and** `VacancyContactOfferForm` stacked on step 3 when
   `mode === 'manual'`. New: step 2 gets a page-local sub-view,
   `step2View: 'choose' | 'write'` (only meaningful in manual mode). Choosing "Zelf
   schrijven" and clicking "Volgende" sets `step2View: 'write'` and **stays on step 2**
   (stepper label unchanged: "Vacaturetekst") instead of jumping to step 3. The write
   view renders `edit-vacancy-description`'s editor alone, with a normal primary
   **"Volgende"** button (not the current italic "Concept opslaan" — delete
   `.saveDraftButton`'s `font-style: italic` from `VacancyDescriptionEditor.module.css`
   and rename the label) that calls `saveDescription` and *then* advances to step 3.
   Step 3 now renders **only** `edit-vacancy-contact-offer` in both modes (the AI-mode
   branch already did this — the two `currentStep === 3` JSX branches on the page
   collapse into one, `mode` still threaded through for the banner). Returning to step 2
   via the Stepper shows whatever `step2View` was last left on — a small ghost "Terug
   naar tekstkeuze" link on the write view resets it to `'choose'` so the user can switch
   mode; nothing is ever trapped, and this needs no new state beyond the one enum.
   `mode`/`step2View` stay page-local, no store (§5/§10.5 reasoning unchanged).

   **Deliberate divergence from the design handoff**, recorded here per the PO's explicit
   request rather than silently decided: `design-notes.md` "Step 3 — Contact en
   voorwaarden: two real variants" specifies the manual variant as *one* card with
   description textareas **plus** contact + salary blocks together. The PO tested the
   build in a browser and explicitly asked for these as two separate pages instead — his
   tested, in-product feedback supersedes the design mock here. Not an ADR (it's a
   product-priority call about page composition, not an architecture trade-off with
   competing technical consequences) — flagged so a future pass doesn't "fix" this back
   to match `design-notes.md`.

3. **Textareas resize wider than the card.** `shared/ui/fields.module.css`'s `.control`
   has no `width`/`max-width`, and a `<textarea>` defaults to `resize: both`. Global fix
   in `shared/ui` (not per-feature, since every multiline field shares this class):
   `.control { width: 100%; max-width: 100%; }`, plus `textarea.control { resize:
   vertical; }` to stop horizontal resize specifically.

4. **Vakantiedagen** (`edit-vacancy-contact-offer/ui/VacancyContactOfferForm.tsx`):
   a. The Salarisperiode `<select>` visually overflows its `repeat(auto-fit,
      minmax(150px, 1fr))` grid cell and covers "Aantal vakantiedagen" next to it. Item
      3's width fix removes the intrinsic-width overflow itself, but CSS Grid tracks
      don't shrink a native `<select>`'s intrinsic min-width just because a sibling has
      `width: 100%` — add `min-width: 0` to `.salaryGrid > *` as the actual fix for the
      grid-track collapse, on top of item 3.
   b. Real bug: `numberOfHolidays` is rendered inside the `{!hideSalary && …}` block
      (line 176), so "Liever niet delen" hides holidays too, even though holidays aren't
      salary. Fix: pull it out into its own always-visible row (`grid-column: 1 / -1`,
      full width — also directly addresses 4a's crowding by giving it more room),
      rendered regardless of `hideSalary`.
   c. **New requirement**: a period selector (week/maand/jaar) for vakantiedagen.
      Contract gap — `Offer.numberOfHolidays` is a bare `number | null`, "Full-time-
      equivalent holiday days… never pre-computed/prorated server-side", no period
      field. Resolved by **ADR-0005** (client-side conversion to annual FTE days before
      the API call; upstream `taldo-contracts` ask filed in `open-questions.md`).

5. **Overzicht (step 4)**, `features/review-vacancy/ui/ReviewVacancy.tsx`:
   a. Meta line (`{category} · {city} · {workplaceType}`) lacks weekly hours.
      `VacancyPreview.tsx:41` already inlines equivalent-but-not-quite-right JSX
      (`{min}–{max} uur per week`, always a range, never collapses when equal) — extract
      one `entities/vacancy/lib/hours.ts` (`formatHoursPerWeek(min, max)`: `"40 uur per
      week"` when `min === max`, else `"32–40 uur per week"`) and use it in both
      `review-vacancy` and `preview-vacancy` instead of leaving two near-duplicate
      formatters to drift (same reasoning `formatSalary` already followed).
   b. Textareas are always editable (no read-only state), each section's label renders
      twice (the section header *and* `TextField`'s own `label` prop both show the same
      text), and a bare `<hr />` inside the flex-column `Card` renders as a stray "."
      instead of a visible rule. Fix: sections render as read-only
      `<p style="white-space: pre-wrap">` by default; each section's own "Aanpassen"
      swaps *only that section* into an editable textarea with "Opslaan"/"Annuleren"
      ("Opslaan" → `saveDescription` with the full current `values` object — same
      whole-object PATCH the API already expects, no new endpoint; "Annuleren" → revert
      that field to the last-saved value, close edit mode). "Bekijk je vacature" is
      disabled while any section is mid-edit — simplest guard against silently losing an
      open edit, no autosave-on-navigate needed. Add a `hideLabel?: boolean` option to
      `shared/ui/TextField` (visually-hidden label, `sr-only`, keeps the accessible name)
      so edit mode doesn't re-render a second visible label. Divider: replace `<hr />`
      with an explicit `<div className={styles.divider} aria-hidden="true" />`
      (`border-top: 1px solid var(--border-hairline); height: 0;`). "Opnieuw"/skeleton
      behaviour for AI mode is unchanged.
   c. The contact block only renders when `vacancy.contactPerson` is truthy, and there's
      no holiday-days line next to the salary line. Root cause is **not** this
      component — see §11.2. Fix here: always render the contact block
      (name/role/phone/email) and a holiday-days line (via ADR-0005's formatter,
      preferring the page-local `holidayInput` if present, else reconstructing from
      `vacancy.offer.numberOfHolidays` as a plain annual figure) once §11.2 makes
      `vacancy` reliably carry what was submitted.
   d. "Bekijk je vacature" moves from a sibling of the `Card` into the `Card` itself, in
      a right-aligned footer row (`justify-content: flex-end`).

### 11.2 Page-level data-loss fix (root cause behind issue 5c)

`ReviewVacancy` only ever renders what's on its `vacancy` prop, and
`VacancyCreatePage` replaces its `vacancy` state **wholesale** with each PATCH response
(the `onSaved` callbacks at `VacancyCreatePage.tsx:127,141`, and `handleCoreSaved`).
`specs/vacancy.yml`'s `VacancyResponse` does **not** list `contactPerson`/`offer` as
`required` — a response that omits a section the user just submitted is contract-legal,
and nothing in the current code defends against it. This matches the PO's exact repro
(contact person and salary both filled in, both missing at Overzicht).

**Decision: the merge lives inside each form's own save handler**
(`VacancyContactOfferForm.save`, `VacancyCoreForm.save`), not at the page level:
- *Pragmatic (chosen)* — each `save()` already holds both the just-submitted payload and
  the raw API response in scope; before calling `onSaved`, merge:
  `{ ...response, contactPerson: response.contactPerson ?? submittedContactPerson, offer:
  response.offer ?? submittedOffer }` in `VacancyContactOfferForm`, and the equivalent for
  `minHoursPerWeek`/`maxHoursPerWeek` in `VacancyCoreForm`'s `patchVacancyCore` branch
  (source: its own `values`, which mirror `initialValues` since hours are disabled/
  read-only post-creation per ADR-0002). This keeps `onSaved(vacancy: VacancyResponse)`
  a contract the page can keep trusting as "complete enough," instead of making the page
  track submitted-vs-returned state per form. No cross-feature import is needed either
  way (each form only reasons about its own submission), so this doesn't touch the
  "features don't import each other" rule — not an ADR-level call, just recorded here.
- *Strict variant (rejected for now)* — page-level merge, with a parallel "last-
  submitted" shadow per section held on `VacancyCreatePage`. More correct in the
  abstract (one place owns "what does the user think is saved"), but adds page state
  surface for a defensive edge case two small feature-local patches already close.
  Revisit if a third form needs the same treatment and duplicating the pattern a third
  time starts to hurt.

### 11.3 State additions

`pages/vacancy-create/ui/VacancyCreatePage.tsx` gains:

- `step2View: 'choose' | 'write'` (default `'choose'`) — §11.1 item 2.
- `holidayInput: { amount: number; period: HolidayPeriod } | undefined` — set from
  `edit-vacancy-contact-offer`'s save (via `onSaved` or a small dedicated
  `onHolidayInputChange` prop, developer's call), threaded as a prop into
  `review-vacancy` and `preview-vacancy` so both can display the period the user
  actually chose, in-session (ADR-0005). Still page-local, single-session, never written
  to browser storage — same reasoning as §10.5, just one more field of the same kind.

### 11.4 API boundary

No new endpoints and no contract change required to ship this pass. `numberOfHolidays`
is still sent as a single annual-FTE number — the client converts week/month → annual
before the existing `patchVacancyContactOffer` call (ADR-0005). The upstream
`taldo-contracts` ask (a `holidayPeriod` field on `Offer`, mirroring `SalaryPeriod`'s
shape) is flagged in `specs/open-questions.md`, not blocking this pass.

### 11.5 Test plan additions

**Vitest + RTL** (failing-test-first for real logic; presentational-only bits noted
explicitly rather than silently skipped, per the plan's existing convention):

- `shared/ui/CardHeader` — renders `title` at the right heading level plus
  `description`; omits the `<p>` when no `description` is passed.
- `entities/vacancy/lib/hours.test.ts` — `formatHoursPerWeek`: collapse-when-equal case,
  range case.
- `entities/vacancy/lib/holidays.test.ts` — `toAnnualHolidayDays`/
  `fromAnnualHolidayDays` per period (week ×52, month ×12, year ×1) and
  `formatHolidayDays`'s output strings.
- `edit-vacancy-contact-offer` — vakantiedagen renders and stays visible with "Liever
  niet delen" checked (regression test for 4b); changing the period Select changes the
  *converted* value in the outgoing `patchVacancyContactOffer` call body, not just
  on-screen state; merge-on-response-omission case from §11.2 (mock a response missing
  `contactPerson`/`offer`, assert `onSaved` still receives the submitted values).
- `create-vacancy-core` — same merge case for `minHoursPerWeek`/`maxHoursPerWeek` on the
  `patchVacancyCore` path.
- `edit-vacancy-description` — save button renders "Volgende" (not "Concept opslaan"),
  calls `saveDescription` then the page-supplied advance callback.
- `review-vacancy` — read-only-by-default sections; "Aanpassen" → editable → "Opslaan"
  calls `saveDescription`, "Annuleren" reverts without calling it; "Bekijk je vacature"
  disabled while any section is mid-edit; contact block and holiday-days line render
  unconditionally once `vacancy` carries them; "Bekijk je vacature" renders inside the
  `Card`'s DOM subtree.
- `pages/vacancy-create` — update the existing manual-mode click-through: step 2 choose
  → write view → step 3 (contact-only, no description fields present) → step 4; one
  assertion that returning to step 2 via the Stepper after a manual draft exists lands
  on `'write'`, not `'choose'`.

**Playwright** — extend `e2e/create-vacancy.spec.ts` (no new spec file): the manual path
now fills Samenvatting and clicks "Volgende" on step 2's write view (landing on step 3
with only contact fields, not "Concept opslaan" immediately followed by contact fields
on the same page), and exercises one Overzicht "Aanpassen" → edit → "Opslaan" round-trip
before "Bekijk je vacature". Still the one canonical flow this feature earns.

### 11.6 PII

No new PII surface introduced. `ContactPerson` remains the only PII-shaped data in this
feature; §6's rules are unchanged (on-screen only, never logged, never persisted to
browser storage, never sent to analytics). The behaviour change in 5c/§11.2 makes
contact details render *unconditionally* once present, rather than conditionally on a
truthiness check — this is a data-loss bug fix (previously-submitted data was being
silently dropped, not legitimately absent), not a new exposure.

### 11.7 Risks

- **Per-section save-in-Overzicht is a real UX/complexity increase over "one save on
  Volgende"** (5b) — low-to-medium severity: more surface for a user to leave a section
  mid-edit. Mitigated by disabling "Bekijk je vacature" during an open edit rather than
  risking silent loss; worth a human sanity-check at review that this reads as helpful
  friction rather than an annoyance.
- **Client-side annual-FTE conversion (ADR-0005) means the chosen input period doesn't
  survive a backend round-trip** — low severity now (this is a session-only wizard, no
  "resume an existing draft" flow in scope), but will become a real gap the moment such
  a flow is built; the ADR names the upstream fix that closes it.
- **Feature-local merge (§11.2) is a narrow, repeatable pattern, not a general
  mechanism** — fine for two forms; if a third form develops the same "response may omit
  what I just sent" shape, that's the signal to revisit the page-level alternative
  instead of copying the pattern a third time.

### 11.8 Task list

See `specs/tasks.md` T034-T042 for the ordered, ID-tagged breakdown (all traceable to
this section via `Plan: §11.x`); T043 is this pass's single trailing `[review-gate]`,
depending on all of T034-T042. T001-T033 already carry T033's own sign-off and aren't
re-reviewed here — the reviewer should still sanity-check that nothing in T034-T042
regresses what T033 already approved (FSD boundaries, API-boundary discipline, PII
handling, the shared-generation-hook single-instance discipline).

---

## 12. PO follow-up pass (2026-09-25, second round)

Trigger: PO re-tested after §11 and asked for four more changes. All four are small,
local fixes with no architectural trade-off, so the lead wrote this addendum directly
(no new slices, no new endpoints, no ADR). Tasks T044-T047, review gate T048.

1. **Steps are only reachable after "Volgende"** (T044). Today
   `VacancyCreatePage`'s `isReachable={(index) => index <= 1 || mode !== null}` lets the
   user click straight to step 2 (Vacaturetekst) without any Basisgegevens — the page then
   renders a blank step, because step 2 needs `vacancy`. New page-local state
   `maxReachedStep: 1 | 2 | 3 | 4` (starts at `1`); every forward transition that happens
   through a "Volgende"-style action (step 1 Volgende, step 2 write-view Volgende, the
   3-questions modal submit, step 3 Volgende) goes through one `advanceTo(step)` helper
   that sets `currentStep` and raises `maxReachedStep`. The Stepper's `isReachable` becomes
   `index + 1 <= maxReachedStep`. Backward navigation (Stepper clicks on reached steps,
   Overzicht "Aanpassen" links, "Terug naar tekstkeuze") never lowers it. "Bewaren als
   concept" on step 1 saves the draft but does **not** unlock step 2. Picking a mode on the
   step-2 choice view alone does not unlock step 3. Unreachable steps must look inert
   (no hover affordance), not just have `cursor: not-allowed`.

2. **Land dropdown order** (T045). `entities/location` gets a fixed preferred list
   `['NL', 'BE', 'FR', 'DE']` (Nederland, België, Frankrijk, Duitsland — in that order,
   not alphabetical), then a visual separator, then the remaining 25 countries in Dutch
   alphabetical order (`localeCompare(…, 'nl')`, as today). Keep `countries` (the full
   list) exported for code-to-label lookup (`VacancyPreview` uses it). `shared/ui/Select`
   gains separator support (e.g. an `options` entry `{ type: 'separator' }` or a
   `dividerAfter` flag — developer's call, but keep it generic, not country-specific),
   rendered as a disabled, non-selectable `<option>` containing a line of `─` characters
   (a native `<hr>` inside `<select>` is not reliably supported across browsers/React
   DOM nesting). The separator must never be selectable or become the value.

3. **Salarisperiode unreadable** (T046). Root cause: `.holidaysRow` sits *inside*
   `.salaryGrid` with `grid-column: 1 / -1`; a spanning item occupies every explicit
   track, so `repeat(auto-fit, minmax(150px, 1fr))` no longer collapses the empty 4th
   track and the three salary fields shrink to ~150px — too narrow for the Salarisperiode
   select ("Kies een p…"). Also, native selects render shorter than the text inputs next
   to them on macOS. Fix:
   - Lay out "Salaris en voorwaarden" as three sibling rows using the same two-column grid
     as the contact rows (`repeat(auto-fit, minmax(220px, 1fr))`): Salaris minimum |
     Salaris maximum; Valuta | Salarisperiode; Aantal vakantiedagen | Periode vakantiedagen.
     The first two rows hide with "Liever niet delen"; the vakantiedagen row never does
     (§11 item 4b). This also puts Valuta next to the salary it belongs to instead of below
     the holiday row.
   - `shared/ui/Select`: `appearance: none` plus a Lucide `ChevronDown` positioned in the
     existing `.controlWrapper` (pointer-events none), right padding reserved for it (and
     for the Land ISO2 suffix, which sits left of the chevron), so every select has the
     same height, padding and font as the text inputs in every browser. Still a native
     `<select>` — consistent with ADR-0004, no ADR change.

4. **Remove "Tekst aanpassen" from the preview** (T047). `VacancyPreview` renders an
   unstyled `<button>Tekst aanpassen</button>` under its H1; remove it. The footer's
   "Terug" (same `onBack`) stays as the way back to the Overzicht.

Testing: Vitest+RTL test-first for T044 (page-level: step 2 not clickable before step 1
Volgende, not after "Bewaren als concept" either; step 3 not reachable from the choice
view alone; reached steps stay clickable when going back), T045 (country order +
separator position in `entities/location`; Select renders the separator disabled and it
can't be selected), T047 (button gone). T046 is CSS/markup: one RTL assertion for the
row grouping (Valuta and Salarisperiode in the same row, vakantiedagen row visible with
"Liever niet delen"), plus a real-browser screenshot at ~800px and ~1280px proving the
Salarisperiode select shows its full placeholder and matches the inputs' height (per the
team-learnings rule: JSDOM can't verify layout). Update the Playwright flow only if it
breaks.
