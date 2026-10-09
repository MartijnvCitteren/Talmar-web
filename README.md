# Jobzy Frontend

Vacancy-creation flow (GitHub issue #4) — Vite + React 19 + TypeScript, Feature-Sliced
Design. Local-dev-only pass; see `specs/spec.md` for the full scope and
`specs/plan.md` / `.claude/planning/vacancy-creation.md` for the implementation plan.

## Local development

```bash
npm install
npm run dev
```

Opens the app against the API base URL in `public/config.json` (defaults to
`http://localhost:8080`).

## Scripts

- `npm run dev` — Vite dev server.
- `npm run build` — type-checks (`tsc -b`) and produces a production build in `dist/`.
- `npm run test` / `npm run test:watch` — Vitest + React Testing Library.
- `npm run lint` — ESLint (FSD import-direction boundaries) + Steiger (`./src`).
- `npm run e2e` — Playwright (`create-vacancy` happy path, mocked backend).
- `npm run generate:api` — regenerates `src/shared/api/generated/vacancy-api.ts` from
  `specs/vacancy.yml`. Run this whenever the OpenAPI contract changes; the output is
  committed, so nobody needs to run it just to build.

## HR signup (UI only, API pending)

`/signup` (4 questions) → `/signup/verify` (check je mail) → `/dashboard` (first-visit
empty state), built from the Claude Design file "HR Signup High Fidelity". The backend
contract doesn't exist yet: `entities/account` exposes an `AccountApi` port that is
currently answered by an in-browser stub (`stubAccountApi.ts`), which marks a new account
verified ~5 s after signup so the whole flow can be clicked through. Wiring the real API
means replacing that implementation (search for `TODO(signup-api)`), not the UI.

## Runtime configuration (ADR-0001)

The API base URL is **not** baked into the build. `src/app/boot.tsx` fetches
`/config.json` once at app boot, before anything that needs the API URL renders. If that
fetch fails, is malformed, or is missing `apiBaseUrl`, the app renders a visible fail-fast
error screen — it never falls back to a default URL silently.

`public/config.json` is committed with a local-dev default:

```json
{ "apiBaseUrl": "http://localhost:8080" }
```

Vite copies `public/` files into `dist/` as-is at build time. Because the file is fetched
at runtime (not inlined by the bundler), **the same build artifact can be pointed at a
different backend just by replacing `dist/config.json` on disk and reloading — no
rebuild required.** This is the mechanism the container-promotion story (Azure Container
Apps, out of scope for this pass) will reuse: an entrypoint script writes `config.json`
from environment variables before the static file server starts.

### Local proof (performed 2026-09-19, this pass)

Verified by hand that the *same* built JS bundle targets whichever URL is in
`config.json`, without rebuilding:

1. `npm run build` → produced `dist/` with the default `config.json`
   (`apiBaseUrl: http://localhost:8080`).
2. `npx vite preview --port 4173` served that build as-is.
3. Ran the Step-1 "Volgende" flow (via a Playwright script with the `POST /vacancy` call
   intercepted) against the running preview build: the request was observed going to
   `http://localhost:8080/vacancy`.
4. **Without rebuilding**, overwrote `dist/config.json` on disk:
   ```json
   { "apiBaseUrl": "http://localhost:9090" }
   ```
5. Reloaded the same running preview and repeated the same Step-1 flow: the request was
   now observed going to `http://localhost:9090/vacancy` — same JS bundle, different
   backend, config-file swap only.

This confirms the spec's acceptance criterion ("API base URL is resolved at runtime per
environment, confirmed by running the same build artifact against at least two different
configured URLs") for the local-dev proof required by this pass. The unit-tested failure
paths (missing file, malformed JSON, missing `apiBaseUrl`) live in
`src/shared/config/runtime-config.test.ts`.

## Architecture

Feature-Sliced Design (`app → pages → widgets → features → entities → shared`), enforced
mechanically by `eslint-plugin-boundaries` (import direction) and Steiger (public-API
imports, `npx steiger ./src`) as part of `npm run lint`. See `specs/plan.md` for the full
slice breakdown and `.claude/adr/` for the two standing architecture decisions (runtime
config mechanism; hours-per-week not editable after vacancy creation, pending an
upstream contract fix).
