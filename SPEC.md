# Fitness — V1 Spec

## Overview
A Progressive Web App (PWA) for generating weekly workout schedules, logging exercises, and viewing real-life instructional exercise media. Must be accessible over cellular.

## Tech Stack
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + PWA (next-pwa)
- **Backend**: Next.js API routes
- **Database**: SQLite via better-sqlite3 (local, lightweight, zero config)
- **Hosting**: Mac mini — Caddy reverse proxy, accessible via Tailscale or public URL
- **Port**: 3102 (dev), 3103 (if separate live needed)

## Core Features (V1)

### 1. Weekly Schedule Generator
- Generate a 7-day workout plan based on user preferences
- Workout types: **Strength Training**, **HIIT/Sprints**, **Plyometrics**, **Bodyweight**, **Rest/Recovery**
- Configurable split: push/pull/legs, upper/lower, full body, custom
- Each day shows: workout type, exercise list, target sets/reps, rest periods
- Ability to regenerate or swap individual days

### 2. Exercise Library
- Curated exercise database (~100+ exercises for V1)
- Categories: chest, back, shoulders, arms, legs, core, cardio, plyometrics
- Each exercise includes:
  - Name and description
  - Target muscle groups (primary + secondary)
  - Equipment needed (or "none" for bodyweight)
  - **Open-source real-life media pairs** showing proper form (start + end position)
  - Common cues/tips
- Search and filter by muscle group, equipment, type

### 3. Workout Logging
- Log each exercise performed during a session
- Fields per exercise:
  - **Sets** (number)
  - **Reps** (number per set)
  - **Weight** (optional — hidden/disabled for bodyweight and cardio exercises)
  - **Duration** (optional — for timed exercises like planks, sprints)
  - **Notes** (optional — form cues, how it felt)
- Workout types that skip weight field:
  - Bodyweight exercises (push-ups, pull-ups, dips, etc.)
  - Sprint/plyometric drills (box jumps, burpees, shuttle runs)
  - Cardio/conditioning (jump rope, battle ropes duration-based)
- Quick-log: tap exercise → enter reps → done (weight pre-filled from last session if applicable)

### 4. Progress Tracking (V1 - Basic)
- View past workout logs by date
- See weight/rep progression per exercise over time (simple list view, charts in V2)
- Weekly summary: total volume, sessions completed vs planned

### 5. Exercise Media
- Every exercise MUST have at least one instructional media pair
- Use open-source real-life images for start and end positions
- No user-facing surface should rely on generated SVG exercise diagrams
- Media should show: starting position, ending position, and enough framing to understand body setup
- Displayed inline on exercise detail and during workout logging

## Data Model

### Exercise
```
id, name, description, category, muscleGroups[], equipment, type (strength|bodyweight|cardio|plyo),
diagramUrls[], cues[], defaultSets, defaultReps, defaultRestSeconds
```

### WorkoutPlan
```
id, weekStartDate, days[{dayOfWeek, type, exercises[{exerciseId, sets, reps, restSeconds}]}]
```

### WorkoutLog
```
id, date, planId?, exercises[{exerciseId, sets[{reps, weight?, duration?, notes?}], completed}]
```

## UI/UX
- **Mobile-first** — designed for phone screens (primary use case is at the gym)
- Bottom nav: Schedule | Log | Exercises | Progress
- Dark mode default (gym-friendly)
- Large tap targets for logging (gloves-friendly)
- Offline support via PWA service worker (cache exercise library + current week's plan)
- Install prompt on first visit

## PWA Requirements
- Service worker for offline caching
- Web app manifest with icons
- "Add to Home Screen" support (iOS + Android)
- Background sync for logs when back online

## Deployment
- Caddy config: `fitness.kgo.local` → port 3102
- Accessible via Tailscale for cellular access
- SQLite DB at `data/fitness.db`

## Out of Scope (V1)
- AI-powered plan generation (V2 — use LLM to customize based on goals/history)
- Social features / sharing
- Video demonstrations (static real-life images only for V1)
- Nutrition tracking
- Heart rate / wearable integration
- Charts/graphs (V2)

## Exercise Media Strategy
For V1, use a combination of:
1. **Open-source real-life exercise photography** — source from reusable open-source repositories
2. **Per-exercise media pairs** — each exercise gets 2 images minimum: start position + end position
3. **Attribution-aware source mapping** — document source repo and per-exercise mapping in `MEDIA_SOURCING.md` and `lib/exercise-image-map.ts`
