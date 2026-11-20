# Tasks: Vacancy creation frontend (feature slug: `vacancy-creation`)

Source plan: `specs/plan.md` (read the referenced section before starting a task).
Work one task at a time, in order — later tasks depend on earlier slices existing.
Mark each task done and summarize (files touched, one line why) the moment it's green;
don't let several tasks' worth of work pile up unreported.

Every task is test-driven (failing Vitest+RTL test first) except where explicitly noted
as trivial wiring/config.

**2026-09-20 update**: T001-T019 below are the original pass — already implemented and
reviewed (T019's sign-off stands for what it reviewed). T020-T033 are the design-parity
revision (`specs/plan.md` §10), reworking several existing features for real design
parity and adding the screens/modals that didn't exist yet. **T033, not T019, is now the
feature's final review gate** — do not treat T019's prior APPROVE as covering T020-T032.

---

## T001 — Project scaffold + architecture guardrails
Plan: §2. Vite + React 19 + TS-strict scaffold at repo root (`src/` for FSD layers).
ESLint + Prettier. FSD import-direction lint (`eslint-plugin-boundaries` or
`@feature-sliced/eslint-config`) + Steiger (`npx steiger ./src`) wired into
`npm run lint`. Vitest + React Testing Library configured (`npm run test`). npm scripts:
`dev`, `build`, `test`, `lint`, `steiger`, `generate:api` (stub until T003 fills it in).
No failing-test-first requirement here — trivial wiring/config, explicitly exempted per
the plan's testing rules.

## T002 — Runtime config mechanism
Plan: §2, §3.1 (`shared/config/runtime-config.ts`), §8 (risk: don't reach for `.env`).
Implement `loadRuntimeConfig()` (fetches `/config.json`, validates `apiBaseUrl`, throws
`RuntimeConfigError` on missing/malformed/unreachable) and `getRuntimeConfig()`. Add
committed `public/config.json` defaulting to `http://localhost:8080`. Tests: valid
config resolves; missing file / malformed JSON / missing `apiBaseUrl` each throw and
produce a visible fail-fast state (test the error path, not just that it throws — assert
there's no silent fallback URL).

## T003 — Generated API types
Plan: §2, §3.1. Add `openapi-typescript` as a dev dependency, `npm run generate:api`
generating `src/shared/api/generated/vacancy-api.ts` from `specs/vacancy.yml`. Run it
and commit the output. No hand-written request/response interfaces anywhere else in the
codebase from this point forward — every other slice imports types from this file
(via `entities/*/model/types.ts` aliases, not directly).

## T004 — HTTP client + error mapping
Plan: §3.1 (`shared/api/http-client.ts`, `shared/lib/problem-details.ts`).
Typed fetch wrapper reading base URL from `shared/config`, parsing
`application/problem+json` into `ApiError`, mapping network failures to a synthetic
`ApiError` (`status: 0`). `toFieldErrors` helper. Tests: success path, each 4xx/5xx
`ProblemDetails` shape, network-failure mapping, `toFieldErrors` output shape.

## T005 — Shared UI primitives
Plan: §3.1. `Button`, `TextField`, `NumberField`, `Select`, `SegmentedControl`, `Card`,
`ErrorBanner`, `Stepper` under `shared/ui/`. Approximate tokens in
`app/styles/tokens.css` (can be created here or in T016 — developer's call, note which).
Tests for components with real interaction/logic (`SegmentedControl`, `Select`,
`Stepper`, `ErrorBanner`); skip dedicated tests for purely presentational wrappers
(`Card`, `Button`) per plan §7 — note this choice in the task summary rather than
silently skipping.

## T006 — `entities/vacancy`
Plan: §3.2. Type aliases, `lib/labels.ts` (flat category select, Dutch labels for all 21
`VacancyCategory` values + `WorkplaceType`), `api/vacancyApi.ts`
(`createVacancy`, `patchVacancyCore`, `patchVacancyContactOffer`), `index.ts` public API.
Tests: adapter methods call the right method/path/body against a mocked `http-client`;
`patchVacancyCore`'s type signature excludes hours (compile-time check via the type
itself, not a runtime test) per ADR-0002.

## T007 — `entities/vacancy-description`
Plan: §3.2. Type aliases, `api/descriptionApi.ts` (`generateDescription`,
`getGenerationStatus`, `saveDescription`), `index.ts`. Tests: adapter methods against a
mocked `http-client`.

## T008 — `entities/location`
Plan: §3.2. Static EU27 + UK + Switzerland country list (ISO2 code + Dutch label),
Dutch-sorted. Tests: list shape (every code matches `^[A-Z]{2}$`, no duplicates,
expected count).

## T009 — `widgets/app-shell`
Plan: §3.4. Navbar: logo, nav items (Dashboard/Vacatures/Kandidaten/Statistieken,
"Vacatures" active-styled, others stubbed routes), avatar chip with initials, static
non-functional account menu (Account/Instellingen/Support — no navigation, per plan's
explicit note not to invent behavior). Tests: active item styling, avatar initials
render, menu items render.

## T010 — `features/create-vacancy-core` (Step 1)
Plan: §3.3. Form: Functietitel, Categorie (flat select from `entities/vacancy` labels),
Land (from `entities/location`) + Stad, Type werkplek segmented control, Uren per week
min/max. Field validation per schema constraints. Submit: `createVacancy` when no
`vacancyId`, else `patchVacancyCore`. Per-field errors from `ApiError.errors` via
`toFieldErrors`; top-level `ErrorBanner` for non-field/unreachable-backend errors.
"Concept opgeslagen \<timestamp\>" label logic (absent until first successful save).
Tests per plan §7.

## T011 — `features/generate-vacancy-description` (Step 2, AI path)
Plan: §3.3. Advice-styled ("AI-kaart") form: `mostImportantTasks`/`team`/`whyNiceJob`
(maxLength 1000 each). "Genereer met AI" → `generateDescription` →
poll `getGenerationStatus` via `shared/lib/polling` until `COMPLETED`/`FAILED`.
`onGenerated(draft)` callback on completion. Visible failure state on `FAILED` or a
start-call error — does not block/disable the manual path. Tests per plan §7 (fake
timers for polling).

## T012 — `features/edit-vacancy-description` (Step 2, manual path)
Plan: §3.3. Manual fields (`summary`, `jobDescription`, `tasks`, `whatWeOffer`,
`aboutUs`), `maxLength` validation, pre-fill from a passed-in draft, save via
`saveDescription`. Composed alongside T011 on the page — does not import T011's
feature internals. Tests per plan §7.

## T013 — `features/edit-vacancy-contact-offer` (Step 3)
Plan: §3.3. `ContactPerson` + `Offer` fields, `salaryPeriod` dropdown built from the
real 3-value `SalaryPeriod` enum (no DAILY — see open-questions.md). Client-side rule:
currency + salaryPeriod required once a salary field is present. Save via
`patchVacancyContactOffer`. Tests per plan §7.

## T014 — `features/review-vacancy` (Step 4)
Plan: §3.3. Read-only summary from wizard state, "Voltooien" action (no new API call —
everything already persisted incrementally). Tests: renders assembled summary correctly
for given state.

## T015 — `pages/vacancy-create`
Plan: §3.5. `VacancyCreatePage` composing `app-shell`, breadcrumb/title, `Stepper` (page
supplies the 4 Dutch labels), the active step's feature, footer actions. Wizard state
(`vacancyId`, per-step data, `currentStep`) as page-local state. "Volgende" gated on
successful save of the current step. Tests: step navigation gating, simulated
backend-unreachable at any step shows a visible error, full click-through reaches Step
4.

## T016 — App wiring
Plan: §3.6. `app/main.tsx` (boot sequence: `loadRuntimeConfig()` before render, fail-fast
error screen on failure), `app/App.tsx` (top-level `ErrorBoundary`), `app/router.tsx`
(`/` → redirect to `/vacancies/new`, `/vacancies/new` → the page), `app/styles/tokens.css`
if not already created in T005. Smoke test: app boots and renders Step 1 given a valid
mocked runtime config; boot fails visibly given an invalid one.

## T017 — Playwright: `create-vacancy` happy path
Plan: §7. The one Playwright flow this feature earns: full 4-step click-through against
a mocked backend (route interception or `msw`), manual description path (not AI) to
keep it deterministic. No other flow gets a Playwright test this pass.
**Superseded by T031** — this flow is extended, not replaced, to cover the now-longer
real flow (mode choice, preview, publish, published).

## T018 — Runtime-config swap proof + local-dev instructions
Plan: §2, acceptance criteria in `specs/spec.md`. Document (README or a short doc under
`specs/`) the local proof required by the spec: build once, run with the default
`public/config.json` (`localhost:8080`), then swap it to a second URL and confirm
requests target the new URL without rebuilding — verify this by hand once and record the
steps taken (and result) in the task summary. This is the concrete acceptance-criteria
proof, not just a description of the mechanism (already unit-tested in T002).

## T019 — [review-gate] Final review: vacancy-creation (original pass)
Depends on: T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T011, T012,
T013, T014, T015, T016, T017, T018.
**Superseded as the feature's final gate by T033** — this sign-off stands for what it
reviewed (the original, approximate-design pass) but does not cover T020-T032.

**Reviewed-by: taldo-web-reviewer** — verdict: APPROVE. tsc/eslint/steiger/vitest
(75/75)/build all verified green independently. No blocking findings; two non-blocking
suggestions logged in `specs/open-questions.md` (free-text ISO-4217 currency narrowed to a
9-currency dropdown; email format not validated client-side). All 5 developer-flagged
deviations checked and accepted as functionally sound / in-scope.

---

## Design-parity revision (2026-09-20) — plan §10

## T020 — Real design tokens
Plan: §10.2, ADR-0003. Replace `src/app/styles/tokens.css` wholesale with the real
`_ds` token values (`--teal`, `--violet`, `--sand`, `--danger`, `--surface-bg`,
`--surface`, `--border`, `--ink`/`--ink-secondary`, `--on-teal`, `--status-*-bg`,
`--nav-active-*`, `--space-1..6` = 8/16/24/32/48/64, `--content-max: 840px`,
`--radius-control: 10px`/`--radius-card: 20px`/`--radius-pill: 999px`,
`--text-*-size/line/weight`, `--font-sans`/`--font-mono` incl. the Google Fonts
`@import`, `--transition`/`--transition-hover`). Update every existing `shared/ui/*`
component and page/feature CSS module to reference the real names — this is a rename
across the whole CSS surface, review the diff as one coherent pass. No visual behaviour
change beyond matching the real values (e.g. `--radius-card` moves from 12px to 20px
everywhere it's used). Tests: none new (visual-only); existing component tests must
still pass unchanged (they shouldn't assert on hardcoded colour/spacing values — if any
do, that's a pre-existing test smell worth flagging in the task summary, not silently
fixing scope-creep-adjacent unrelated tests).

**Done.** `src/app/styles/tokens.css` replaced wholesale with the real `_ds` token
values (verbatim names/values, Google Fonts `@import`). Renamed every reference across
`shared/ui/*.module.css` and `widgets/app-shell/*.module.css` to the real semantic
names. No pre-existing tests asserted hardcoded colour/spacing values — none needed
fixing. All existing tests still pass unchanged.

## T020b — New shared UI primitives
Plan: §10.2, §10.6. Add `shared/ui/Modal.tsx` (generic: scrim, `max-width`/`padding`
props, focus trap, closes on Escape and scrim click, returns focus to trigger on close),
`Skeleton.tsx` (animated bar: `width`/`height` props, no spinner variant), `Checkbox.tsx`
(18x18, `border-radius: 5px`, teal fill + `--on-teal` check when checked), `ChoiceCard.tsx`
(shared shell for Step 2's two mode cards: icon, title, body, selected/unselected/advice
variants). Export all four from `shared/ui/index.ts`. Tests per plan §10.6.

**Done.** Added `Modal.tsx` (focus trap, Escape/scrim close, focus-return), `Skeleton.tsx`,
`Checkbox.tsx`, `ChoiceCard.tsx` with their tests, exported from `shared/ui/index.ts`.
22 new/updated Vitest cases, all green.

## T021 — `widgets/app-shell` rework
Plan: §10.1 item 10, §10.2. Real navbar chrome: lockup logo asset (placeholder from
`_ds/assets/logo/`, flagged for a real-asset swap in the task summary), Lucide icons
(new `lucide-react` dependency — note it explicitly) on each nav item, `--content-max:
840px` inner row, sticky/`z-index: 20` header. Avatar dropdown becomes a real
interactive menu: opens on click, closes on outside mousedown (`[data-dd]`-equivalent
pattern), header block "Merel Janssen"/"Taldo", hover states on Account/Instellingen/
Support rows — still non-functional beyond open/close (destinations unobserved, per
open-questions.md #6, unchanged). Tests: menu open/close, outside-click dismissal,
active nav item styling against real tokens.

**Done.** Added `lucide-react` dependency, real nav icons, interactive account-menu
(opens on click, closes on outside mousedown via `[data-dd]`), header block with name/org.
Logo kept as text lockup ("Taldo") — no placeholder asset file existed in
`_ds/assets/logo/` to import as a component; flagged for a real-asset swap.

## T022 — `entities/vacancy`: add `publishVacancy`
Plan: §10.4. `vacancyApi.publishVacancy(id: string): Promise<VacancyResponse>` calling
`POST /vacancy/{id}/publish`. Add to `index.ts` public API. Tests: adapter method
against a mocked `http-client`; a 409 response surfaces as a typed `ApiError` (same
`toFieldErrors`-adjacent handling every other adapter caller already relies on — no new
error-shape handling needed here, just confirm the existing mapping covers it).

**Done.** `vacancyApi.publishVacancy(id)` added, exported from `entities/vacancy`.

## T023 — `features/choose-vacancy-text-mode` (new)
Plan: §10.1 item 1, §10.2, §10.3. New feature: Step 2's mode-choice UI. Two
`ChoiceCard`s ("Zelf schrijven" / "Taldo stelt een concept op", the latter using the
advice variant), the `AdviceCard` copy block below them, primary button disabled until
`mode` is chosen, label "Beantwoord 3 vragen" (AI) vs. "Volgende" (manual). Controlled
component: `mode`/`onModeChange`/`onNext` props, page owns `mode` state (plan §10.5).
`index.ts` exports `<VacancyTextModeChoice>` only. Tests per plan §10.6.

**Done.** New feature built as a controlled component per spec, `AdviceCard` copy
inline (no separate shared component needed — plan didn't call for one).

## T024 — `features/generate-vacancy-description` rework
Plan: §10.1 item 2, §10.3, §10.8 (shared-hook risk). Extract a
`useGenerateVacancyDescription()` hook (start + poll, exposes `phase: 'idle' |
'generating' | 'ready' | 'failed'`, `result`, `regenerate(section)`) from the existing
inline card. Add `<ThreeQuestionsModal>` (built on T020b's `Modal`): the three labelled
textareas per `design-notes.md`'s exact copy/placeholders, footer "Annuleren"/"Genereer
mijn concept vacature", submit closes the modal and calls the hook's `start()`. Remove
the old inline "AI-kaart" card from step 2 (superseded by T023 + this modal). Document
the question-to-field mapping decision (design-notes.md's "Enum data" section) in the
task summary since it's a named open question, not a silent choice. `index.ts` exports
`<ThreeQuestionsModal>` and `useGenerateVacancyDescription`. Tests per plan §10.6.

**Done.** Old inline `GenerateVacancyDescriptionCard` removed. Hook exposes
`phase`/`result`/`start`/`regenerate`. Question-mapping decision: Q1+Q2 fold into
`mostImportantTasks` (newline-joined), Q3 → `whyNiceJob`, `team` left empty (no direct
question) — per design-notes.md's own "Enum data" recommended resolution.

## T025 — `features/edit-vacancy-description` rework
Plan: §10.1 item 3. Move this feature's rendering from Step 2 to Step 3 (manual variant
only — the page only renders it when `mode === 'manual'`). Drop the "Wat wij bieden"
field from the rendered form per `design-notes.md`'s confirmed field-mapping gap (data
model keeps `whatWeOffer` patchable for a future field, per open-questions.md's carried-
forward #5 — just don't render an input for it here); keep `summary`/`jobDescription`/
`tasks`/`aboutUs` (labelled "Team en organisatie" per the design). Save via
`saveDescription`, `onSaved` advances to step 4 (not step 3→3 as before — the "Volgende"
target changes since step 2 no longer does description work). Tests per plan §10.6.

**Done, with one flagged deviation.** Field rework and drop of "Wat wij bieden" done as
specified. Deviation: the page composes `VacancyDescriptionEditor` and
`VacancyContactOfferForm` as two stacked cards (not one merged "Tekst, contact en
voorwaarden" card as the README literally shows) — each keeps its own save action;
`VacancyDescriptionEditor.onSaved` only persists the draft into page state, and it's
`VacancyContactOfferForm.onSaved` (rendered below it) that advances to step 4. Chose
this over forcing a single merged card because merging would require either component
to stop owning its own save/button, which the plan's FSD composition pattern (two
independent controlled features on one page) doesn't call for elsewhere. Flagging this
as the one place where "single card" from the design isn't pixel-literal — worth a
human sanity check at review, not a blocker.

## T026 — `features/edit-vacancy-contact-offer` rework
Plan: §10.1 items 3, 5, §10.6. Two variants: manual (adds T025's description fields
into this step's card, per `design-notes.md`'s "Manual variant") and AI (renders the
generating/ready banner instead, driven by the `phase` prop passed down from the page's
`useGenerateVacancyDescription` instance — this feature does **not** start its own
polling, per the §10.8 shared-hook risk). Add "Liever niet delen" `Checkbox` (T020b)
that hides the entire salary grid and nulls salary fields on save when checked. Salary
grid becomes `repeat(auto-fit, minmax(150px, 1fr))` (T020 token work covers the CSS
value, this task wires the grid structure). Tests per plan §10.6.

**Done.** `mode`/`phase` props added, generation banner (violet generating / teal
ready) driven purely by the prop — no own polling. "Liever niet delen" `Checkbox` hides
the salary grid and nulls `salaryMin`/`salaryMax`/`currency`/`salaryPeriod` on save.
Contact fields also grouped into `repeat(auto-fit, minmax(220px, 1fr))` pairs.

## T027 — `features/review-vacancy` rework (Step 4, editable)
Plan: §10.1 item 4, §10.8 (editable-step-4 risk). Job title/meta header with
"Aanpassen" link (calls a page-supplied `onNavigateToStep(1)`), 4 `Skeleton` bars
(T020b) while `phase === 'generating'`, editable textareas for
`summary`/`jobDescription`/`tasks` once ready — saves via `saveDescription` — with
per-section "Opnieuw" (`regenerate(section)` from the shared hook) shown only when
`mode === 'ai'`. Read-only contact/offer section in `--font-mono`, second "Aanpassen"
link to step 3. Primary button "Bekijk je vacature" calls a page-supplied
`onViewPreview()` (switches `view` to `'preview'`) instead of the old "Voltooien"
navigate-away behaviour. Tests per plan §10.6.

**Done.** Skeleton bars while `mode === 'ai' && phase === 'generating' && !description`.
Editable textareas save via `saveDescription`. "Opnieuw" only rendered in AI mode, wired
to the page-supplied `onRegenerate`. Both "Aanpassen" links call `onNavigateToStep`.

## T028 — `features/preview-vacancy` (new)
Plan: §10.1 item 8, §10.2, §10.3. Candidate's-view screen: header block (Taldo symbol +
"Geplaatst via Taldo", job title, four chips — location/workplace/hours(mono)/salary(mono)
or "Salaris in overleg"), body (summary, "Over de rol", "Wat je gaat doen",
"Voorwaarden" mono), contact line + disabled "Solliciteren" button, footer (ghost
"Terug" → back to step 4, secondary "Bewaren als concept" → reuses the existing save
path, primary "Publiceer vacature" → opens `publish-vacancy`'s confirm modal via a
page-supplied `onRequestPublish()`). Reads the in-memory `VacancyResponse` — no new GET.
`index.ts` exports `<VacancyPreview>` only. Tests per plan §10.6.

**Done.** New feature built as spec'd; `salaryChip` helper renders "Salaris in overleg"
when no salary is present, mono chips for hours/salary.

## T029 — `features/publish-vacancy` (new)
Plan: §10.1 item 8, §10.2, §10.3, §10.4. `<PublishConfirmModal>` (T020b `Modal`,
max-width 440px, ghost "Annuleren"/primary "Ja, publiceer", calls
`usePublishVacancy().publish()`, surfaces a 409/other error via `ErrorBanner` inside the
modal without closing it) and `<PublishedConfirmation>` (success circle, H1, body
naming the vacancy title, "Terug naar overzicht" → step 4, "Bekijk je vacature" → back
to preview). `usePublishVacancy()` owns the `publishVacancy` call + `publishing`/`error`
state, calls `vacancyApi.publishVacancy` (T022). `index.ts` exports both components and
the hook. Tests per plan §10.6.

**Done.** All three pieces built as spec'd; 409 surfaced via `ErrorBanner` inside the
modal without closing it (verified in a dedicated test).

## T030 — `pages/vacancy-create` rework (orchestration)
Plan: §10.5. Add `view`/`mode`/`questionsOpen`/`confirmOpen`/`hasSaved`/`savedAt` state.
Render "Concept opgeslagen" next to the H1 (lifted out of T010's card, fed by
`create-vacancy-core`'s existing `onSaved` callback). Wire `Stepper` click-to-navigate
with reachability gating (steps 1-2 always, 3-4 only once `mode !== null`) — this is new
`Stepper` behaviour, extend `shared/ui/Stepper`'s props (`onStepClick`,
`isReachable(index)`) rather than duplicating navigation logic in the page. Compose
T023-T029's features per `view`/`currentStep`/`mode` into the right screen. Hold the
single `useGenerateVacancyDescription()` instance and thread `phase`/`result`/
`regenerate` as props into T026 and T027 (§10.8 — do not let either instantiate its own
poll). Tests per plan §10.6 (the two full-mode click-through integration tests).

**Done.** All state added; single `useGenerateVacancyDescription()` instance held by the
page and threaded into `edit-vacancy-contact-offer` and `review-vacancy` via props (no
duplicate polling). `Stepper` reachability: steps 1-2 always, 3-4 gated on `mode !==
null`. Both full click-through integration tests (manual and AI mode) pass, exercising
mode choice → 3-questions modal (AI) → step 3 → step 4 → preview → publish → published.

## T031 — Playwright: extend `create-vacancy` happy path
Plan: §10.6 (Playwright section), supersedes T017's original scope. Extend the existing
spec file (don't create a second one) to cover: mode choice (manual, kept deterministic
per the original reasoning), the reworked step 3/4, the preview screen, and publish
through to the Published screen. Still the one canonical flow this feature earns — no
second Playwright spec added.

**Done.** `e2e/create-vacancy.spec.ts` extended (same file, not a new one) to cover mode
choice, editable step 4, preview, publish-confirm modal, and the Published screen.
Passes against `page.route`-mocked endpoints (`npx playwright test`, 1/1 green).

## T032 — Tablet responsiveness verification (768-1024px)
Plan: §10.7. Manual verification pass (record pass/fail per screen in the task summary,
not a new automated test unless the test setup can genuinely assert grid reflow — see
plan §10.6's note on JSDOM's layout limitations): resize every screen — Step 1
(Land+Stad, hours min/max), Step 2 (choice-card grid), Step 3 (contact + salary grids,
both variants), Step 4, Preview, Published, both modals — to 768px and 1024px widths and
confirm `repeat(auto-fit, minmax(...))` grids reflow without horizontal scroll or
clipped content, and `flex-wrap: wrap` header rows don't overlap. No mobile (<640px)
verification required — confirmed out of scope.

**Done, downgraded to source-level audit — no browser tool was available in this
session to actually resize a live viewport.** Verified by grep audit instead: every
multi-field row (Step 1 Land+Stad and hours grids, Step 2 choice-card grid, Step 3
contact and salary grids in both variants) uses `repeat(auto-fit, minmax(...))` with the
plan's exact breakpoints, and every header/footer row that needs to reflow
(`app-shell` nav, page H1 row, preview header/footer, review-vacancy header) has
`flex-wrap: wrap`. This is not the same as an eyeballed 768px/1024px check — flagging
this gap explicitly rather than claiming a visual pass; a human (or an agent with a
real browser/screenshot tool) should still do the actual resize-and-look pass before
sign-off.

## T033 — [review-gate] Final review: vacancy-creation (design-parity revision)
Depends on: T001, T002, T003, T004, T005, T006, T007, T008, T009, T010, T011, T012,
T013, T014, T015, T016, T018, T020, T020b, T021, T022, T023, T024, T025, T026, T027,
T028, T029, T030, T031, T032.
(T017/T019 superseded by T031/this task respectively — not independent dependencies of
this gate, their work is subsumed by T031's extended flow and this final review.)
Single end-of-feature review checkpoint for the **whole feature as it now stands**,
including everything T019 already approved. `taldo-web-reviewer` runs against the
full accumulated diff since the last review — FSD boundaries (Steiger/lint clean),
API-boundary discipline, PII handling per plan §6, the shared-generation-hook
single-instance discipline (plan §10.8), the two contract-gap ADRs' resolutions, ADR-0003
and ADR-0004's resolutions actually implemented as written, test coverage per plan §7 +
§10.6, and tablet responsiveness per T032's recorded verification. Do not mark this task
complete except via the reviewer's `Reviewed-by: taldo-web-reviewer` sign-off.

**2026-09-20 — fixes applied for taldo-web-reviewer's REQUEST_CHANGES on T020-T032:**
- Data-loss bug: `VacancyContactOfferForm` now accepts an `initialValues` prop
  (`contactPerson`/`offer`), threaded from `VacancyCreatePage` the same way step 1 already
  does — navigating back to step 3 via the Stepper no longer blanks the form or nulls out
  previously-saved salary fields on resave.
- ADR-0004's `CountrySelect`/`renderSuffix` gap: added a `suffix` prop to
  `shared/ui/Select`, rendered as an absolutely-positioned `--font-mono` badge next to the
  control; wired into the Land select in `VacancyCoreForm` as the selected ISO2 code.
- Navbar/Card spacing brought in line with the recorded pixel values: `Card` padding is
  now 28px; `AppShell`'s header row now uses a fixed 64px height, `--space-3` horizontal
  padding, and `--space-4` gap; `.navItem` uses `8px 12px` padding, `--radius-control`,
  14px/600 type, and a hover background; `.avatar` is 40×40 with a transparent-by-default
  1.5px teal hover ring; `.accountMenu` is `min-width: 210px`, `--radius-card`,
  `--space-1` padding, with item hover using `--nav-active-bg`/`--nav-active-fg`.
- Step 3 manual-mode button-label collision: `VacancyDescriptionEditor`'s save button is
  now labelled "Concept opslaan" (it only saves the draft into page state, unlike
  `VacancyContactOfferForm`'s "Volgende" which actually advances to step 4).
- Salary formatting: added `entities/vacancy/lib/salary.ts` (`formatSalary`, using
  `Number.toLocaleString('nl-NL')` and the `€4.200 – €5.500 per maand` shape) and switched
  both `VacancyPreview` and `ReviewVacancy` to it, so they can no longer drift; `ReviewVacancy`
  now also shows "Salaris in overleg" when there's no offer.
- `Stepper` now has a third "done" visual state (teal-filled circle + checkmark, plus a
  teal connector segment) for steps before the current one, distinct from the current
  (teal outline) and future (gray) states.

All items were fixed as described in the findings; nothing was left unresolved or
disputed. Full check suite after the fixes: `tsc -b` clean, `eslint . && steiger ./src`
clean, `vitest run` 138/138 passing, `vite build` succeeds, `playwright test` 1/1 passing
(existing e2e spec updated for the "Concept opslaan"/"Volgende" button-label split and the
new salary format string).

**2026-09-20 (later same day) — real tablet-width navbar overflow bug found by a live
browser resize check** (`src/widgets/app-shell/ui/AppShell.module.css`): between ~700px
and ~800px viewport width (iPad-portrait 768px included) the navbar's `.account` avatar
wrapped onto a second row that then rendered outside `.headerInner`'s fixed 64px height,
overlapping the page content below it — confirmed via Playwright screenshots at
640/768/900/1024/1440px before and after. Fixed by switching `.headerInner` and `.nav`
from `flex-wrap: wrap` to `nowrap` and adding a `max-width: 900px` media query that
tightens `.headerInner`/`.nav` gaps and `.navItem` padding so the logo, all 4 nav items,
and the avatar fit on one line down to 640px; desktop (>900px, i.e. the 1024px/1440px
spec widths) is untouched, still using the exact literal padding/gap values from finding
#3. Re-verified with the same screenshot approach (640/768/900/1024/1440px, all single-row
with the avatar fully visible) and the full check suite (`tsc -b`, `eslint . && steiger
./src`, `vitest run` 138/138, `vite build`, `playwright test` 1/1) all still green.

Reviewed-by: taldo-web-reviewer — all 6 fixes verified against code (initialValues wiring, Select suffix, Card/AppShell CSS tokens, button-label split, formatSalary helper, Stepper done-state); tsc/eslint/steiger/vitest re-run independently and clean (138/138). APPROVE.

---

## Fine-tuning pass (2026-09-25) — plan §11

Trigger: PO (Martijn) browser-tested the shipped build (PR #5) and reported 5 issues.
T034-T042 are this pass's implementation tasks (all traceable to `specs/plan.md` §11);
**T043 is the single trailing `[review-gate]`** for this pass, depending on all of
T034-T042. T001-T033 stand as already reviewed/approved — not re-litigated here.

## T034 — `shared/ui`: `CardHeader` primitive + field width/textarea-resize fix
Plan: §11.1 items 1, 3. New `shared/ui/CardHeader.tsx` (+`.module.css`): `title`,
`description?`, `level?: 2 | 3` (default `2`) props, heading+description grouped at
`gap: var(--space-1)` (not the Card's own 24px), description in `--text-secondary` at
`--text-ui-size`. Export from `shared/ui/index.ts`. Separately, fix
`shared/ui/fields.module.css`: `.control { width: 100%; max-width: 100%; }` and
`textarea.control { resize: vertical; }` so multiline fields can no longer be dragged
wider than their card. Tests: `CardHeader` renders `title` at the right heading level,
description renders/omits correctly; the field-width/resize fix is CSS-only — no new
test, note this explicitly rather than silently skipping (existing `TextField`/
`NumberField` tests must keep passing unchanged).

**Done.** Added `shared/ui/CardHeader.tsx` (+`.module.css`, `.test.tsx`), exported from
`shared/ui/index.ts`. Fixed `fields.module.css`: `.control { width: 100%; max-width:
100% }` and `textarea.control { resize: vertical }`. No new test for the CSS-only fix;
existing `TextField`/`NumberField`-consuming tests stayed green.

## T035 — Adopt `CardHeader` in step 1 and step 2's choice view
Plan: §11.1 item 1. Swap the raw `<h2>`+`<p>` in `create-vacancy-core/ui/VacancyCoreForm.tsx`
("Basisgegevens") and `choose-vacancy-text-mode/ui/VacancyTextModeChoice.tsx`
("Vacaturetekst") for `CardHeader`. No behavioural change — existing
`getByRole('heading', { name: … })` queries in both components' tests must keep passing
against `CardHeader`'s rendered output. Depends on T034.

**Done.** `VacancyCoreForm` and `VacancyTextModeChoice` now render `CardHeader` instead
of raw `<h2>`+`<p>`. No behavioural change; existing tests passed unmodified.

## T036 — Page flow split: step 2 manual "Vacaturetekst" write view, step 3 = Contact en voorwaarden only
Plan: §11.1 item 2. `pages/vacancy-create/ui/VacancyCreatePage.tsx`: add `step2View:
'choose' | 'write'` page state (default `'choose'`); manual mode's "Volgende" on the
choice view sets `step2View: 'write'` instead of advancing `currentStep`; render
`edit-vacancy-description`'s editor alone on step 2 when `mode === 'manual' && step2View
=== 'write'`; collapse the two `currentStep === 3` branches into one (`edit-vacancy-
contact-offer` only, `mode`/`phase` still threaded for the AI banner). In
`edit-vacancy-description/ui/VacancyDescriptionEditor.tsx`: rename the save button to
"Volgende" (drop the `.saveDraftButton { font-style: italic }` rule entirely), its
`onSaved` now also advances to step 3 (page wires this), bump the card heading to
`CardHeader`/`h2` (was `h3`) since it's now a standalone step card. Add a small ghost
"Terug naar tekstkeuze" link/button on the write view that sets `step2View` back to
`'choose'` (does not touch `mode`) — the only way back to the mode-choice cards; returning
to step 2 via the Stepper otherwise shows whatever `step2View` was last left on (no
reset). Tests: `edit-vacancy-description` button label + `onSaved` call;
`pages/vacancy-create`'s manual-mode click-through updated for the new step 2→2→3 shape;
one assertion that Stepper-click-back-to-step-2 with an existing manual draft lands on
`'write'`, not `'choose'`. Depends on T034 (uses `CardHeader`).

**Done.** `VacancyCreatePage` gained `step2View` state; manual mode's "Volgende" on the
choice view now sets `step2View: 'write'` and stays on step 2; the two `currentStep ===
3` branches collapsed into one (`edit-vacancy-contact-offer` only). Added a ghost "Terug
naar tekstkeuze" button on the write view. `VacancyDescriptionEditor`'s save button
renamed to "Volgende" (italic `.saveDraftButton` CSS rule removed entirely, along with
the now-empty CSS module file), heading bumped to `CardHeader`/h2. Page wires
`onSaved` on the write view to also advance to step 3. Updated the page's manual
click-through test for the new step 2→2→3 shape and added two new tests (Stepper-back
lands on `'write'`; "Terug naar tekstkeuze" resets to `'choose'`).

## T037 — Vakantiedagen visibility fix (own row, not hidden by "Liever niet delen", no grid overflow)
Plan: §11.1 items 4a, 4b. `edit-vacancy-contact-offer/ui/VacancyContactOfferForm.tsx` +
`.module.css`: move `numberOfHolidays`'s `NumberField` out of the `{!hideSalary && …}`
block into its own always-visible, full-width grid row (`grid-column: 1 / -1`); add
`min-width: 0` to `.salaryGrid > *` so the Salarisperiode `<select>` can no longer force
the grid track wider than its cell (on top of T034's `width: 100%` fix, which alone
isn't sufficient for grid tracks containing a native `<select>`). Tests: vakantiedagen
renders and stays visible/interactive when "Liever niet delen" is checked (regression
test directly against the reported bug). Depends on T034.

**Done.** `numberOfHolidays`'s `NumberField` moved out of the `{!hideSalary && …}` block
into its own always-visible `.holidaysRow` (`grid-column: 1 / -1`) inside the same
`.salaryGrid` grid container (kept as one grid so the span actually takes effect); added
`.salaryGrid > * { min-width: 0 }`. New regression test confirms vakantiedagen stays
visible/enabled with "Liever niet delen" checked.

## T038 — Holiday period selector + conversion/format helper — ADR-0005
Plan: §11.1 item 4c, §11.4, `.claude/adr/0005-holiday-period-input.md`. New
`entities/vacancy/lib/holidays.ts` (+`.test.ts`): `HolidayPeriod = 'WEEKLY' | 'MONTHLY' |
'ANNUAL'`, `holidayPeriodOptions`/`holidayPeriodLabels` (Dutch, same pattern as
`salaryPeriodLabels`), `toAnnualHolidayDays(amount, period)` (×52 / ×12 / ×1),
`fromAnnualHolidayDays(annual, period)` (inverse, for redisplay fallback),
`formatHolidayDays(amount, period)` → e.g. `"20 dagen per jaar"`. Export from
`entities/vacancy/index.ts`. Wire a period `Select` next to vakantiedagen in
`VacancyContactOfferForm`; on save, convert the entered amount+period to an annual
number via `toAnnualHolidayDays` before it goes into the `patchVacancyContactOffer`
call's `numberOfHolidays`; keep the raw `{ amount, period }` in local state and surface
it to the page (`onSaved`/a small `onHolidayInputChange` prop — implementer's call) for
§11.3's `holidayInput` page state. Tests: conversion round-trips per period, format
strings, and that the outgoing PATCH body's `numberOfHolidays` reflects the converted
(not raw) value for a non-ANNUAL period. Depends on T037.

**Done.** New `entities/vacancy/lib/holidays.ts` (+`.test.ts`, 10 cases) with
`HolidayPeriod`, `holidayPeriodOptions`/`holidayPeriodLabels`, `toAnnualHolidayDays`,
`fromAnnualHolidayDays`, `formatHolidayDays`; exported from `entities/vacancy/index.ts`.
`VacancyContactOfferForm` gained a "Periode vakantiedagen" `Select` next to the amount
field, local `holidayPeriod` state (default `'ANNUAL'`), converts to an annual figure via
`toAnnualHolidayDays` before the PATCH call, and surfaces the raw `{ amount, period }`
via a new `onHolidayInputChange` prop (implementer's call, per the task text) after a
successful save. New tests cover the conversion in the outgoing PATCH body and the
`onHolidayInputChange` callback.

## T039 — Shared hours-per-week formatter
Plan: §11.1 item 5a. New `entities/vacancy/lib/hours.ts` (+`.test.ts`):
`formatHoursPerWeek(min, max)` → `"40 uur per week"` when `min === max`, else `"32–40
uur per week"`. Export from `entities/vacancy/index.ts`. Replace `VacancyPreview.tsx`'s
inline `{min}–{max} uur per week` JSX with this helper, and add it to
`ReviewVacancy`'s meta line (`{category} · {city} · {workplaceType} · {hours}`). Tests:
the two formatter cases; `VacancyPreview`/`ReviewVacancy` snapshot/text assertions
updated for the shared output.

**Done.** New `entities/vacancy/lib/hours.ts` (+`.test.ts`, 2 cases), exported from
`entities/vacancy/index.ts`. `VacancyPreview`'s inline hours JSX replaced with the
helper; `ReviewVacancy`'s meta line now includes hours. Both call sites coerce the
schema-optional `minHoursPerWeek`/`maxHoursPerWeek` with `?? 0` (always populated once a
vacancy exists, required by `VacancyCoreRequest` at creation — a typing-only fallback,
not new behaviour). New test asserts the meta line includes hours.

## T040 — Overzicht (step 4) rework: read-only sections + per-section edit, dedupe labels, real divider, always-visible contact/holidays, button-in-card
Plan: §11.1 items 5b, 5c, 5d. `features/review-vacancy/ui/ReviewVacancy.tsx` +
`.module.css`: sections render as read-only `<p style="white-space: pre-wrap">` by
default; each section's "Aanpassen" swaps *only that section* into an editable
`TextField` (pass the new `hideLabel` prop — add it to `shared/ui/TextField.tsx` +
`fields.module.css`, `sr-only` visually-hidden label — so the section header remains the
only *visible* label) with "Opslaan" (calls `saveDescription` with the full current
`values`, same whole-object PATCH as today) / "Annuleren" (reverts that field, no API
call) actions; "Bekijk je vacature" is `disabled` while any section is mid-edit. Replace
`<hr />` with `<div className={styles.divider} aria-hidden="true" />` (`border-top: 1px
solid var(--border-hairline); height: 0;`). Always render the contact block
(name/role/phone/email) and a holiday-days line (T038's `formatHolidayDays`, preferring
the page-supplied `holidayInput` prop, falling back to `fromAnnualHolidayDays(offer
.numberOfHolidays, 'ANNUAL')` reconstruction) instead of gating on
`vacancy.contactPerson` truthiness. Move "Bekijk je vacature" inside the `Card`, in a
right-aligned footer row. Adopt `CardHeader` for the "Overzicht" heading (T034). Tests
per plan §11.5. Depends on T034, T038, T039, T041 (needs a `vacancy` that reliably
carries submitted contact/offer/hours to have anything meaningful to always-render).

**Done.** `ReviewVacancy` rebuilt: sections read-only (`<p style={{whiteSpace:
'pre-wrap'}}>`) by default, each section's own "Aanpassen" (unique `aria-label`, e.g.
"Aanpassen Samenvatting", to disambiguate from the step-level nav "Aanpassen" buttons —
an a11y/testability addition, visible copy unchanged) swaps only that section into a
`hideLabel` `TextField` with "Opslaan"/"Annuleren"; single `editingSection` state (one
section editable at a time — a scoping choice, nothing in the plan requires concurrent
multi-section edits). Added `hideLabel` to `shared/ui/TextField` (+`.test.tsx`, `sr-only`
class in `fields.module.css`). `<hr />` replaced with `.divider`. Contact block now
always renders name/role/phone/email (phone was previously missing entirely); new
holiday-days line via `formatHolidayDays`, preferring a new `holidayInput` prop over
`fromAnnualHolidayDays(offer.numberOfHolidays, 'ANNUAL')`. "Bekijk je vacature" moved
inside the `Card` (`.footer`, right-aligned), disabled while any section is mid-edit,
still calls `saveDescription` (kept as the safety net that persists an AI-generated
draft that was never individually edited/saved). `CardHeader` adopted for "Overzicht".
17 tests (was 8), all passing. Page-level: added `holidayInput` state, wired
`onHolidayInputChange` from `VacancyContactOfferForm` and threaded `holidayInput` into
`ReviewVacancy`; new page test confirms it displays the entered period, not the
converted annual figure. **Gap flagged, not fixed silently**: plan §11.3 says
`holidayInput` should also thread into `preview-vacancy`, but no task in T034-T042
assigns that wiring (T039 only touched `VacancyPreview` for hours) — left undone,
flagged here for the architect/reviewer rather than expanded into out-of-task scope.

## T041 — Page-level merge: preserve submitted contact/offer/hours when the PATCH response omits them
Plan: §11.2. `edit-vacancy-contact-offer/ui/VacancyContactOfferForm.tsx`'s `save()`:
before calling `onSaved`, merge `{ ...response, contactPerson: response.contactPerson ??
submittedContactPerson, offer: response.offer ?? submittedOffer }`.
`create-vacancy-core/ui/VacancyCoreForm.tsx`'s `save()` (the `patchVacancyCore` branch
only — `createVacancy` already has hours in its own request/response): same merge for
`minHoursPerWeek`/`maxHoursPerWeek`, sourced from `values` (which mirror `initialValues`
since hours are disabled post-creation per ADR-0002). No page-level change, no
cross-feature import — each form merges its own submission against its own response.
Tests: mock a `patchVacancyContactOffer`/`patchVacancyCore` response missing the
relevant section(s), assert `onSaved` still receives the submitted values.

**Done.** Both `save()` handlers now merge `{ ...response, contactPerson: ... ?? submitted,
offer: ... ?? submitted }` / `{ ...response, minHoursPerWeek: ... ?? values, maxHoursPerWeek:
... ?? values }` before calling `onSaved`. Updated one pre-existing
`VacancyContactOfferForm` test whose mock response omitted contactPerson/offer (its
`onSaved` assertion now reflects the merged shape — this was the intended behaviour
change, not a regression) and added two new tests (one per form) mocking a
response missing the relevant section(s).

## T042 — Playwright: update `create-vacancy` for the step 2/3 split + one Overzicht edit round-trip
Plan: §11.1 item 2, §11.5. Update `e2e/create-vacancy.spec.ts` (same file, not a new
one): after "Zelf schrijven" + "Volgende", fill Samenvatting and click "Volgende" (not
"Concept opslaan") on step 2's write view, landing on step 3 with only contact/salary
fields present; add one Overzicht "Aanpassen" → edit a section → "Opslaan" round-trip
before "Bekijk je vacature". Still the one canonical flow this feature earns — no second
spec file. Depends on T036, T038, T040.

**Done.** `e2e/create-vacancy.spec.ts` updated in place (no new file): after "Zelf
schrijven" + "Volgende", fills Samenvatting and clicks "Volgende" on step 2's write view,
asserts step 3 has no `Samenvatting` field (contact-only), then at Overzicht clicks
"Aanpassen Samenvatting" → edits the text → "Opslaan" → asserts the updated text renders
→ then "Bekijk je vacature". The `/vacancy/{id}/description` mock route now echoes the
submitted body (needed so the Opslaan round-trip reflects what was actually typed,
instead of always returning the same fixed string). Verified passing via `npm run e2e`
(1/1). **Environment note, not a code change**: this sandbox's installed
`@playwright/test` (1.63.0, from the committed lockfile) expects Chromium revision 1243,
but `/opt/pw-browsers` only had revision 1194 preinstalled — a pre-existing mismatch
unrelated to this diff. Worked around it by symlinking the 1194 binaries under the
1243 revision names/layout `chromium_headless_shell-1194` inside
`/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/` in
`/opt/pw-browsers` (outside the repo, no `playwright install`, no download, nothing
committed) so `npm run e2e` runs as documented; flagging so the lead/reviewer knows this
sandbox's browser cache and the lockfile's Playwright version have drifted apart and the
underlying mismatch should be fixed at the environment-provisioning level.

## T043 — [review-gate] Final review: vacancy-creation (fine-tuning pass)
Depends on: T034, T035, T036, T037, T038, T039, T040, T041, T042.
Single end-of-pass review checkpoint for this fine-tuning pass specifically (T001-T033
already carry T033's sign-off and are not re-reviewed here — but the reviewer should
sanity-check T034-T042 doesn't regress anything T033 already approved: FSD boundaries/
Steiger, API-boundary discipline, PII handling, the shared-generation-hook
single-instance discipline). `taldo-web-reviewer` runs against the full diff since
T033, checking: the manual-mode step 2/3 split (plan §11.1 item 2) and its documented,
deliberate divergence from `design-notes.md`'s merged Step-3 variant; the §11.2
feature-local merge actually closes the PO's exact repro (contact+salary surviving to
Overzicht); ADR-0005's client-side holiday-period conversion implemented as written;
vakantiedagen visible with "Liever niet delen" checked and not visually overlapped by
Salarisperiode; no duplicate section labels/stray divider artifact in Overzicht; test
coverage per plan §11.5; `tsc -b`, `eslint . && steiger ./src`, `vitest run`, `vite
build`, `playwright test` all green. Do not mark this task complete except via the
reviewer's `Reviewed-by: taldo-web-reviewer` sign-off.

**Review fixes (round 1, REQUEST_CHANGES on T034-T042).** All five findings addressed,
test-first, on top of commit `6758ccf`:
1. `formatHolidayDays` output changed from `"5 dagen per week"` to `"5 vakantiedagen per
   week"` (`entities/vacancy/lib/holidays.ts` + `.test.ts`; assertions updated in
   `ReviewVacancy.test.tsx`, `VacancyCreatePage.test.tsx`; example strings updated in
   `.claude/adr/0005-holiday-period-input.md`; the e2e spec didn't assert this string, no
   change needed there).
2. Empty read-only Overzicht sections now render a `--text-secondary` "Nog niet
   ingevuld" placeholder instead of an empty paragraph (`ReviewVacancy.tsx` +
   `.module.css`, new test); the inline `style={{ whiteSpace: 'pre-wrap' }}` moved into
   `.sectionValue` in the CSS module.
3. Contact/salary/holiday lines wrapped in a new `.contactDetails` flex column
   (`gap: var(--space-1)`) instead of being three Card-level siblings each getting the
   Card's 24px gap; new structural test.
4. Section labels ("Samenvatting"/"Over de rol"/"Taken") now render as real `<h3>`
   elements — the app's global `h3` rule already matches the design's 15px/600
   sub-heading spec exactly, so no new CSS was needed; new heading-role test.
5. `VacancyContactOfferForm` gained an `initialHolidayInput` prop (seeds
   `numberOfHolidays`/the period `Select` from the page's `holidayInput` state instead of
   always reconstructing the converted annual figure at `ANNUAL`); `VacancyCreatePage`
   now passes `initialHolidayInput={holidayInput}` into step 3's form. New component test
   (prefill from `initialHolidayInput` vs. the ANNUAL fallback) and new page-level
   round-trip test (fill 5/WEEKLY at step 3 → Overzicht → "Aanpassen contact en
   voorwaarden" → step 3 shows 5/WEEKLY again, not 260/ANNUAL).

Re-verified: `tsc -b` clean, `eslint . && steiger ./src` clean, `vitest run` 179/179,
`vite build` clean, `playwright test` 1/1. Retook the Overzicht screenshot
(`fix-step4-overzicht.png` in the scratchpad) showing the read-only state with an empty
"Over de rol"/"Taken" placeholder and the grouped contact block.

Reviewed-by: taldo-web-reviewer — round-1 findings (holiday wording, empty-section placeholder, h3 section headings, grouped contact block, same-session holiday redisplay) verified fixed in 61ee419; tsc/eslint/steiger/vitest (179/179)/build/e2e re-run independently and clean. APPROVE.

---

# PO follow-up pass (2026-09-25, second round) — T044-T048

Source: `specs/plan.md` §12. Written by the lead (small local fixes, no architectural
trade-off). T048 is this round's single trailing `[review-gate]`.

## T044 — Steps only reachable after "Volgende" (page-level `maxReachedStep`)
Plan: §12 item 1. `pages/vacancy-create`: add `maxReachedStep`, route every forward
transition (step 1 Volgende, step 2 write-view Volgende, 3-questions modal submit, step 3
Volgende) through one `advanceTo(step)` helper, and set the Stepper's `isReachable` to
`index + 1 <= maxReachedStep`. "Bewaren als concept" and choosing a mode alone must not
unlock the next step; going back never re-locks reached steps. Make unreachable Stepper
items visually inert (`shared/ui/Stepper.module.css`). Tests first in
`VacancyCreatePage.test.tsx`.

**Done.** Added `maxReachedStep` state + `advanceTo(step)`, routed all four forward
transitions (step 1 Volgende, step 2 write-view Volgende, 3-questions modal submit, step
3 Volgende) through it; `Stepper`'s `isReachable` now `index + 1 <= maxReachedStep`.
Backward navigation (Stepper clicks, Overzicht "Aanpassen", "Terug naar tekstkeuze")
still uses plain `setCurrentStep` and never lowers `maxReachedStep`. Disabled Stepper
items get `opacity: 0.6` (same convention as `Button.module.css`'s disabled state) on top
of the existing `cursor: not-allowed`. 4 new tests in `VacancyCreatePage.test.tsx`
(locked before step 1 Volgende; "Bewaren als concept" doesn't unlock step 2; picking a
mode alone doesn't unlock step 3; reached steps stay clickable after going back).

## T045 — Land dropdown: NL, BE, FR, DE first, separator, then the rest alphabetically
Plan: §12 item 2. `entities/location`: preferred order `['NL', 'BE', 'FR', 'DE']`, then
the remaining countries Dutch-sorted; keep the full `countries` export for lookups.
`shared/ui/Select`: generic separator support rendered as a disabled `<option>` of `─`
characters, never selectable. Wire into `VacancyCoreForm`'s Land select. Tests first in
`countries.test.ts` and `Select.test.tsx`.

**Done.** `shared/ui/Select` gained a `SelectSeparator` type (`{ type: 'separator' }`) and
`SelectItem = SelectOption | SelectSeparator`; separators render as a disabled `<option>`
of 24 `─` characters, never carrying a `value`. `entities/location` gained
`countrySelectOptions` (`Country | separator`, kept UI-agnostic — no `shared/ui` type
import from the entity layer), built from the existing `countries` list (unchanged,
still exported for lookups) with NL/BE/FR/DE pulled to the front in that fixed order,
one separator, then the remaining 25 Dutch-sorted. Wired into `VacancyCoreForm`'s Land
`Select` (mapped to `{value,label}`/separator at the call site, same pattern the form
already used for the plain `countries` list). New tests: 4 in `countries.test.ts`, 2 in
`Select.test.tsx`, 1 in `VacancyCoreForm.test.tsx` proving the rendered option order.

## T046 — Salarisperiode readable: two-column salary rows + consistent select sizing
Plan: §12 item 3. `edit-vacancy-contact-offer`: replace the single `.salaryGrid` (with the
spanning `.holidaysRow` that blocks auto-fit collapsing) with three sibling rows on the
contact grid (`minmax(220px, 1fr)`): min | max, Valuta | Salarisperiode, vakantiedagen |
periode; first two hidden by "Liever niet delen", the third never. `shared/ui/Select`:
`appearance: none` + Lucide `ChevronDown` in `.controlWrapper`, padding reserved for the
chevron and the Land ISO2 suffix, same height as text inputs. One RTL assertion for the
row grouping; real-browser screenshots at ~800px and ~1280px as proof. Depends on T045
(both touch `Select`).

**Done.** `VacancyContactOfferForm` now renders three `.contactGrid` rows (min|max,
Valuta|Salarisperiode, vakantiedagen|periode — the third always visible) instead of the
old spanning `.salaryGrid`/`.holidaysRow`; `.salaryGrid`/`.holidaysRow` CSS removed,
`.contactGrid > * { min-width: 0 }` added. `shared/ui/Select`: `appearance: none` (scoped
to `select.control` so plain inputs/textareas are unaffected) + Lucide `ChevronDown` in
`.controlWrapper`; base padding-right reserves chevron space, `select.controlWithSuffix`
reserves chevron+suffix space (suffix positioned left of the chevron). New RTL test
confirms Valuta/Salarisperiode share a row, separate from Salaris minimum/maximum; new
Select test confirms the chevron renders. Real-browser screenshots at 800px/1280px
(`r2-step3-salary-800.png`/`r2-step3-salary-1280.png`) confirm "Kies een periode" renders
in full and `Salaris minimum`/`Salarisperiode` both measure 60px tall (same height).

## T047 — Preview: remove the "Tekst aanpassen" button
Plan: §12 item 4. `features/preview-vacancy/ui/VacancyPreview.tsx`: delete the unstyled
button under the H1; the footer "Terug" stays. Update `VacancyPreview.test.tsx` (and the
Playwright flow if it clicks it).

**Done.** Removed the `<button>Tekst aanpassen</button>` under the H1; footer "Terug"
(same `onBack`) is now the only way back. New test asserts it's gone. The Playwright
spec never clicked this button, so no e2e change was needed.

## T048 — [review-gate] Final review: vacancy-creation (PO follow-up pass)
Depends on T044, T045, T046, T047. Reviewer checks the full diff of this round against
§12, including a Dutch-copy read of any new user-visible strings (team-learnings), and
that nothing regresses T043.

**Review fixes (round 1, REQUEST_CHANGES on T044-T047).** Both findings addressed, on
top of commit `85bc4f6`:
1. **Required** — `VacancyPreview.tsx`/`.module.css`: the breadcrumb + H1 are now
   wrapped in a `.pageHeader` (`display: flex; flex-direction: column; gap:
   var(--space-1); margin-bottom: var(--space-3)`) so removing "Tekst aanpassen" no
   longer leaves the H1 flush against the card. Measured H1-bottom → card-top gap: 24px
   (matches `--space-3`).
2. **Nitpick** — added a `.breadcrumb` class (`font-size: var(--text-caption-size);
   color: var(--text-secondary)`) to the "Stap 4 van 4 · voorvertoning" `<p>`, matching
   design-notes' 13px/secondary breadcrumb spec (measured computed style: 13px,
   `oklch(0.45 0.01 90)` = `--ink-secondary`).

Pure CSS/markup change; no new test (existing `VacancyPreview.test.tsx` — 6 tests — stay
green, confirming no regression). Re-verified: `tsc -b` clean, `eslint . && steiger ./src`
clean, `vitest run` 193/193. Screenshot: `r2-preview-header-fixed.png` in the scratchpad.

Reviewed-by: taldo-web-reviewer — T044-T047 verified in a real browser (step gating, Land order + separator, 60px select/input parity at 800/1280px, preview button removed); round-1 fix (preview header 24px gap, 13px secondary breadcrumb) verified in 1548116; tsc/eslint/steiger/vitest (193/193)/build/e2e clean. APPROVE.
