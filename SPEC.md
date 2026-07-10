# Fitness — Current Spec

## Overview
A Progressive Web App (PWA) for generating exactly one workout at a time, logging it reliably, and using workout history to decide the next focus. Must be accessible over cellular.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + PWA (next-pwa)
- **Backend**: Next.js API routes
- **Database**: SQLite via better-sqlite3
- **Hosting**: Mac mini — Caddy reverse proxy, accessible via Tailscale or public URL
- **Port**: 3102 (dev), 3103 (if separate live needed)

## Core Features

### 1. Single-Workout Generator
- Primary UX is `/workout`, not a weekly schedule.
- Minimal inputs: **workout type** and **number of exercises**.
- Supported workout types: full body, push, pull, legs, core, sprints, athletic conditioning.
- Generated workout opens in `/log` and can be completed like any prior planned session.
- `/schedule` is retained only as a redirect to `/workout` for old links.

### 2. History-Guided Next Focus
- `/workout` and `/progress` summarize recent logged focuses.
- The app recommends a next focus by avoiding the most recent sessions and filling gaps in the rotation.
- Core work rotates emphasis across abs, plank, stability, rotation, and obliques.

### 3. Exercise Library
- Curated exercise database.
- Categories: chest, back, shoulders, arms, legs, core, cardio, plyometrics.
- Each exercise includes name, description, target muscle groups, equipment, media, cues, default sets/reps/rest.
- Search and filter by muscle group, equipment, type.

### 4. Workout Logging
- Log each exercise performed during a generated session.
- Preserves FP-016 completion behavior: partial unsaved data is surfaced instead of silently dropped; Mark Complete remains reliable.
- Fields per exercise: sets, reps, weight, duration, notes.
- Bodyweight/cardio/plyo sessions support duration-based logging.

### 5. Progress / History
- View past workout logs by date.
- See total recent volume and exercises logged.
- Drill into past sessions and exercise histories.
- No planned-vs-completed weekly adherence metric; weekly schedule is no longer first-class.

### 6. Exercise Media
- Every exercise should have at least one instructional media pair or be intentionally unmapped.
- No user-facing surface should rely on generated SVG exercise diagrams as the primary media source.

## Data Model

The existing SQLite tables are preserved to avoid data/history churn. `workout_plans` now stores generated single workouts as one-day plans keyed by the workout date; legacy column names such as `week_start_date` remain for compatibility with logs/offline sync.

### Exercise
```
id, name, description, category, muscleGroups[], equipment, type, diagrams[], cues[], defaultSets, defaultReps, defaultRestSeconds
```

### Generated Workout
```
id, weekStartDate(date), days[{date, label, workoutType, focus, exercises[{exerciseId, sets, reps, restSeconds}]}]
```

### WorkoutLog
```
id, date, planId?, exercises[{exerciseId, sets[{reps, weight?, duration?, notes?}], completed}]
```

## UI/UX Decision
- Bottom nav: Workout | Log | Exercises | History.
- Schedule and Log are consolidated around one generated workout: Generate creates the workout; Log captures it; History advises what to do next.
- This is the simplest coherent flow and avoids resurrecting weekly-plan state.

## PWA Requirements
- Service worker for offline caching.
- Web app manifest starts at `/workout`.
- Background sync for logs when back online.

## Out of Scope
- Weekly schedule generation as primary UX.
- Social features / sharing.
- Nutrition tracking.
- Heart rate / wearable integration.
