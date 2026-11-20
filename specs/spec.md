# Spec: Vacancy creation frontend (GitHub issue #4)

Repo: Taldo-web. Epic 1 — Lean ATS core. Prio 1.
Issue: https://github.com/MartijnvCitteren/Taldo-web/issues/4

## Story
As a frontend developer, I want a TypeScript + React project set up with the vacancy generation
pages, so that recruiters have a working UI for creating a vacancy, generating its description via
LLM, and editing it manually — consuming the backend through the existing OpenAPI contract.

Implements the UI for: vacancy creation, LLM-assisted description generation, and manual
description entry. Consumes `specs/vacancy.yml` (copied from
`taldo-api/taldo-contracts/.../VacancyApi.yml`).

## Decisions already made (from the issue, treat as fixed)
1. **Tooling: Vite + React + TypeScript**, not Next.js. Internal authenticated recruiter tool, no
   SEO/SSR need.
2. **API types generated from `specs/vacancy.yml`**, never hand-written request/response interfaces.
3. **Runtime config for the API base URL**, not build-time `.env` files — fetch a `config.json` (or
   equivalent) on app boot so one build artifact can be promoted across dev/test/prod (Azure
   Container Apps target). Missing/malformed runtime config must fail fast with a visible error at
   boot, never silently fall back to a default URL.
4. Design source: `specs/design-notes.md` in this repo (extracted from the referenced Claude Design
   project this session — see that file for what was and wasn't directly observed).

## Scope
Build the full vacancy-creation flow as a 4-step wizard, per `specs/design-notes.md`:
1. Basisgegevens (core fields → `POST /vacancy`)
2. Vacaturetekst (AI-assisted generation via `POST/GET generate-description`, plus manual editing,
   saved via `POST /vacancy/{id}/description`)
3. Contact en voorwaarden (`contactPerson` + `offer`, saved via `PATCH /vacancy/{id}`)
4. Overzicht (review, then finalize — still `DRAFT` status; publishing is out of scope here)

## Happy flow
App boots → loads runtime config for the current environment → user opens "Nieuwe vacature" →
fills Basisgegevens → Next (creates the vacancy as DRAFT) → Vacaturetekst: either generates a
description via AI (polls until COMPLETE) and edits the suggestion, or writes it manually → Next →
Contact en voorwaarden → Next → Overzicht → Save.

## Unhappy flow (must be visibly handled, not silent)
- Backend unreachable at any step → visible error state, not a blank screen or unhandled exception.
- Runtime config missing/malformed at boot → fail fast with a clear error, never a silent
  fallback URL.
- AI generation fails (`FAILED` status, or the start call errors) → show the failure and let the
  user fall back to the manual description fields — never a dead end.
- Field-level validation errors from the API (`400` with `ProblemDetails.errors`) → surface
  per-field, not just a generic toast.

## Acceptance criteria (from the issue)
- [ ] Project builds and runs locally with TypeScript + React (Vite).
- [ ] API request/response types are generated from `specs/vacancy.yml`, not hand-written.
- [ ] API base URL is resolved at runtime per environment, confirmed by running the same build
      artifact against at least two different configured URLs (local dev proof: swap the runtime
      config file and confirm requests target the new URL).
- [ ] Vacancy generation page implements: create vacancy, trigger LLM generation, manually
      edit/write description, save.
- [ ] Backend-unreachable and config-missing scenarios show a visible error state.

## Out of scope
Full pipeline/candidate UI, a from-scratch design-token system (approximate the observed design
pragmatically), state-management library beyond local/component state, publish/fill/close status
transitions, the vacancy list/dashboard page (only the creation flow is in scope — link targets to
it may be stubbed).

## Environment
Build for local development only in this pass (per user instruction) — runtime config should
default to `http://localhost:8080` (or similar) for the backend, overridable via `public/config.json`
so the runtime-config mechanism is exercised for real, not just built for later.
