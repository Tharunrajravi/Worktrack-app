# WorkTrack — Phase 1 (local foundation)

A personal work-tracking app: plan your day, run a pause/resume-aware timer
against each work item, and build up a historical Work Track. This is Phase 1
of a 7-phase build — local-only, no backend yet.

## Run it

```bash
npm install
npm run dev       # start the app at http://localhost:5173
npm test          # run the timer/business-logic tests
npm run build     # production build + type-check
```

Login accepts any name (mock auth — see "Architecture notes" below). All data
is stored in your browser's `localStorage`, so it persists across refreshes
but is local to that browser only.

## What's implemented (Phase 1 milestone)

- Login (mock) → Dashboard → Set Today's Work Plan → Start/Pause/Resume/Stop
  → Work Session Summary → Work Track, per the spec's user flow.
- Dashboard: dynamic greeting, current date, an interactive weekly progress
  chart (click a day to see work hours / completed tasks / learning time /
  learning sessions for that day).
- Work Plan form: all fields from the spec (Project, Client, Environment,
  Category, Task Title, Description, Status, Priority, Technologies,
  Ticket/Incident ID, Notes, Outcome, repeatable Links). Work ID is
  auto-generated as `WT-YYYYMMDD-NNN`. Start Time is **not** captured when
  the form opens — only when Start is pressed.
- Timer: Start/Pause/Resume/Stop, with **Time Spent = sum of active
  intervals**, not `End − Start`. This is the rule the spec calls out
  most strongly, so it's implemented as pure, isolated, heavily tested
  functions in `src/lib/timer.ts` — see `src/lib/__tests__/timer.test.ts`,
  which includes the exact worked example from the spec (39m50s active out
  of a 54m48s wall-clock span).
- Work Session Summary: shown after Stop, lets you confirm Status and enter
  Outcome/Notes before it's saved.
- Work Track page: full history table with computed active time per item.

## What's intentionally NOT in Phase 1

- Any AWS service. Auth is a local mock, persistence is `localStorage`.
- CSV/XLSX export — the "Export Work Tracking" button is present (matching
  the dashboard spec) but disabled with a tooltip; that's Phase 4.
- The Learning module's scheduling/notifications — Phase 7.

## Architecture notes (things chosen to make later phases painless)

- **`src/lib/storage.ts`** is the only place that touches `localStorage`,
  and every function is `async` even though `localStorage` is synchronous.
  Phase 2 replaces the internals with `fetch()` calls to API Gateway; no
  component should need to change.
- **`src/auth/AuthContext.tsx`** exposes only `user`, `isAuthenticated`,
  `login`, `logout` to the rest of the app. It stores a display name only —
  it does **not** hand out or rely on a "user id" the backend would trust,
  mirroring the eventual rule that authorization identity always comes from
  a verified token (Cognito), never client-supplied data.
- **Timer state (`TimerState`) is an interval list, not a duration.**
  `computeActiveMs()` derives the number from `intervals` every time it's
  needed. This is what makes "authoritative backend timer state" (Phase 2)
  a small change: the backend just becomes the source of truth for the same
  interval list the frontend already works with, instead of introducing a
  new data model.
- **Work Plan vs Work Track fields live on one `WorkItem` record** but are
  clearly separated in `src/types/work.ts` with comments — intent fields
  (project, description, priority, ...) vs. what-actually-happened fields
  (status, timer, outcome, notes).
- **Links are `{ type, url }[]`**, not hardcoded `jiraUrl`/`githubUrl`
  fields, per the spec's extensibility note.

## Project structure

```
src/
  types/work.ts        Domain types (WorkItem, TimerState, enums)
  lib/
    timer.ts            Pure timer state machine + active-time calculation
    stats.ts             Weekly aggregation for the dashboard chart
    storage.ts          Mock persistence (localStorage), API-shaped
    id.ts                 WT-YYYYMMDD-NNN generation
    __tests__/timer.test.ts
  auth/AuthContext.tsx  Mock auth (Cognito-shaped for later swap)
  components/           AppShell, TimerCard, WorkPlanForm, SessionSummary,
                         ProgressChart
  pages/                LoginPage, DashboardPage, WorkTrackPage
```

## Architecture concerns flagged for discussion (not yet decided)

None right now — Phase 1 followed the agreed local-foundation plan as
specified. Anything that comes up while extending this will be called out
explicitly per the "Architecture concern" format before being implemented.
