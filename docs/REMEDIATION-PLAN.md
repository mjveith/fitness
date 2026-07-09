# Fitness — Remediation Plan

Source: a code review of this repo (the "Fable review"), converted into self-contained,
priority-ordered implementation prompts. Each item below is the source of requirements for
a corresponding PR; PRs reference these `P-#` identifiers in their titles/descriptions.

**Execution model:** dev work is implemented by delegated coding agents (GPT-5.5), each on its
own branch → PR. CI (`.github/workflows/ci.yml`: tsc + lint + test on Node 22) gates every PR,
and an Opus reviewer approves + merges. No PR merges without green CI + review.

**Environment note:** this repo's `better-sqlite3` does NOT build on Node 26+. Use Node 22 LTS
(`fnm use 22` / `nvm use 22`) for all install/test/build.

**Status legend:** ⬜ not started · 🟡 in progress · ✅ merged

---

## Sequencing

`P2-1 (CI, done first) → P0-1 → P0-2 → P1-2 → P0-3 → P0-4 → P1-1 → P1-3 → P1-4 → P1-5 → P2-2`

- P0-2 and P1-3 touch overlapping swap-route files → land P0-2 first.
- P0-3's full test depends on P1-2's dependency-injection seam → do P1-2 before P0-3's test.

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| P2-1 | README, ESLint config, and CI | P2 (done first) | ✅ (#1) |
| P0-1 | Fix UTC/local timezone mismatch in date utilities | P0 | ✅ (#2) |
| P0-2 | Validate and harden API route inputs | P0 | ✅ (#3) |
| P0-3 | Guard empty-category crashes in plan generation | P0 | ✅ (#5) |
| P0-4 | Make the offline log queue resilient | P0 | ✅ (#6) |
| P1-1 | Week-start mismatch (/api/plan/current vs user week start) | P1 | ✅ (#7) |
| P1-2 | Decouple plan generation from the database (testability) | P1 | ✅ (#4) |
| P1-3 | Deduplicate exercise-swap logic | P1 | ✅ (#8) |
| P1-4 | Remove committed build artifacts; modernize test harness | P1 | 🟡 (artifacts untracked in #1) |
| P1-5 | Split the 889-line workout-log-form component | P1 | ⬜ |
| P2-2 | Weekly plan variety and quality-of-life improvements | P2 | ⬜ |

---

## P0-1: Fix UTC/local timezone mismatch in date utilities
`lib/date.ts`: `formatDate` returns `date.toISOString().slice(0,10)` (UTC), while `getWeekStart()`/`addDays()` use local time. In negative-UTC-offset timezones, `formatDate(new Date())` returns *tomorrow* every evening — corrupting log dates, week starts, and plan generation.

**Tasks:** rewrite `formatDate` to use local `getFullYear/getMonth/getDate` zero-padded; audit all callers (`lib/plans.ts`, `lib/progress.ts`, `app/log/actions.ts`, `app/schedule/actions.ts`, `app/log/page.tsx`, `app/schedule/page.tsx`); replace `new Date("YYYY-MM-DD")` (UTC) with `new Date("YYYY-MM-DDT00:00:00")` (local); add TZ tests (`process.env.TZ`).
**Acceptance:** existing tests pass; new tests pass under `TZ=America/Los_Angeles` and `TZ=UTC`; logging at 6pm PT stores today's local date.

## P0-2: Validate and harden API route inputs
`app/api/logs/sync/route.ts` and `app/api/swap/route.ts` trust client JSON. Uncaught `request.json()` (500 on malformed), `String(...)` coercion stores `"undefined"`, batch loop applies partially, `synced` count is wrong; swap accepts negative indexes.
**Tasks:** add `zod`; `lib/validation.ts` schemas for the sync payload + swap payload; try/catch + validate in both routes (400 on failure); validate whole batch up front then save; accurate `{ synced, skippedDuplicates }`; extract shared entry-parsing into `lib/log-entry-parse.ts` (dedupe with `app/log/actions.ts`); tests for parser + schemas.
**Acceptance:** malformed JSON → 400; dateless log rejected; duplicate reports `skippedDuplicates`; existing tests pass. **Land before P1-3.**

## P0-3: Guard empty-category crashes in plan generation
`lib/plans.ts` `chooseExercises()` does `matching[(cursor+index) % matching.length]`; empty category → `%0`=NaN → `undefined` exercises crash rendering and serialize as nulls.
**Tasks:** return `[]` when empty (mirror `takeCycled`); filter undefined/null in `buildDay()`; `console.warn` on zero-exercise workout day in `generateDays()`; test against a stubbed catalog missing a category. **Full injected test depends on P1-2.**
**Acceptance:** no undefined exercises regardless of catalog; new test passes.

## P0-4: Make the offline log queue resilient
`components/offline-log-sync.tsx`: unguarded `JSON.parse` crashes on corrupt localStorage every start; only `response.ok` clears the queue, so a 400 re-POSTs forever.
**Tasks:** try/catch parse (drop key on failure); 2xx clear / 4xx → dead-letter key `fp-failed-logs-v1` + one-time toast / 5xx keep; handle `fetch()` rejection; extract `lib/offline-queue.ts` (pure, tested).
**Acceptance:** corrupt data never crashes; 400 stops resubmission + notifies; 5xx keeps retrying; tests pass.

## P1-1: Week-start mismatch between /api/plan/current and user-selected week start day
User picks `weekStartDay`, but `getOrCreateCurrentPlan` always uses Monday → looks up wrong date, silently creates a duplicate plan; progress counts wrong plan.
**Tasks:** persist chosen `weekStartDay` (on plan row + window lookup, OR a settings key); align `lib/progress.ts` `getWeeklySummary`; test Sunday-start plan resolves mid-week without duplicating.
**Acceptance:** no duplicate plans; progress reflects the plan; tests pass.

## P1-2: Decouple plan generation from the database (testability)
`lib/plans.ts` imports `lib/db.ts` directly, forcing every plan test to boot native `better-sqlite3` (unbuildable in restricted CI).
**Tasks:** make the core pure — `generateDays(config, weekStartDate, exercises)`; `createWorkoutPlan` takes optional injected deps (or split `buildWorkoutPlan` pure + `createWorkoutPlan` wrapper); update callers; rewire the 3 plan tests to inject `exerciseCatalog` directly.
**Acceptance:** `npm test` passes without `better-sqlite3` compiled; no behavior change (snapshot a plan before/after). **Provides the DI seam P0-3's test needs.**

## P1-3: Deduplicate exercise-swap logic (API route vs server action)
`app/api/swap/route.ts` and `swapExerciseAction` duplicate ~30 lines and have drifted.
**Tasks:** `lib/swap.ts` `swapPlanExercise(...)` → `{ok:true,swapped}|{ok:false,reason}`; reduce route + action to thin adapters; unit tests.
**Acceptance:** both entry points behave as before; logic exists once; tests pass. **Land after P0-2.**

## P1-4: Remove committed build artifacts and modernize the test harness
(A) `tsconfig.tsbuildinfo`, `public/sw.js`, `public/workbox-*.js` were tracked — **untracked in #1**. (B) Every test hand-rolls the same ~40-line TS loader (dup 5×).
**Remaining task:** extract the shared TS loader into `tests/helpers/ts-loader.cjs` (or migrate to tsx); confirm all tests still run. (Test-script glob already made cross-platform in #1.)
**Acceptance:** loader logic exists once; fresh clone + `npm ci` + `npm test` passes.

## P1-5: Split the 889-line workout-log-form component
`components/workout-log-form.tsx` mixes form state, offline queueing, swap persistence, cardio, timers, toasts, rendering.
**Tasks:** extract `hooks/use-exercise-log-state.ts`, `hooks/use-offline-log-queue.ts` (align with P0-4), `hooks/use-swap-state-persistence.ts`, `components/exercise-log-card.tsx`, `components/cardio-log-section.tsx`; form becomes composition + submit (<250 lines); no `any`; `tsc` clean.
**Acceptance:** tsc clean; identical behavior (log→save, offline queue, swap round-trip); single responsibility per file. **After P0-4.**

## P2-2: Weekly plan variety and quality-of-life improvements
1. `generateDays()` fixed cursors → every week identical; derive a deterministic seed from `weekStartDate` to rotate the catalog reproducibly (test determinism + week-to-week difference). 2. `formatDisplayDate` hardcodes `en-US` → use `undefined` locale. 3. `getLastExerciseEntry`/`getExerciseHistory` parse 100–120 logs to find one exercise → use SQLite `json_each` (preserve return shapes).
**Acceptance:** tests pass; behavior unchanged except week-to-week rotation. **Item 1 after P1-2.**

---
*Known CI caveat: the `mapped media URLs are reachable` test makes real network calls and is skipped by default (`RUN_NETWORK_TESTS=1` to run) — see README.*
