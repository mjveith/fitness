import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { exerciseCatalog } from "@/lib/exercise-catalog";
import { getExerciseImageUrls } from "@/lib/exercise-image-map";
import { Exercise, SplitType, WorkoutLog, WorkoutPlan } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "fitness.db");

declare global {
  // eslint-disable-next-line no-var
  var __fitnessDb: Database.Database | undefined;
}

function initDb(db: Database.Database) {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      muscle_groups_json TEXT NOT NULL,
      equipment_json TEXT NOT NULL,
      type TEXT NOT NULL,
      diagrams_json TEXT NOT NULL,
      cues_json TEXT NOT NULL,
      default_sets INTEGER NOT NULL,
      default_reps TEXT NOT NULL,
      default_rest_seconds INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_plans (
      id TEXT PRIMARY KEY,
      week_start_date TEXT NOT NULL UNIQUE,
      split TEXT NOT NULL,
      workout_days INTEGER NOT NULL DEFAULT 5,
      exercises_per_workout INTEGER NOT NULL DEFAULT 5,
      days_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      day_name TEXT NOT NULL,
      week_start_date TEXT NOT NULL,
      plan_id TEXT,
      entries_json TEXT NOT NULL,
      total_volume REAL NOT NULL DEFAULT 0,
      duration_minutes INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
    CREATE INDEX IF NOT EXISTS idx_exercises_type ON exercises(type);
    CREATE INDEX IF NOT EXISTS idx_logs_date ON workout_logs(date);
    CREATE INDEX IF NOT EXISTS idx_logs_week_start ON workout_logs(week_start_date);
  `);

  const workoutPlanColumns = db
    .prepare("PRAGMA table_info(workout_plans)")
    .all() as Array<{ name: string }>;
  const workoutPlanColumnNames = new Set(workoutPlanColumns.map((column) => column.name));

  if (!workoutPlanColumnNames.has("workout_days")) {
    db.exec("ALTER TABLE workout_plans ADD COLUMN workout_days INTEGER NOT NULL DEFAULT 5");
  }

  if (!workoutPlanColumnNames.has("exercises_per_workout")) {
    db.exec("ALTER TABLE workout_plans ADD COLUMN exercises_per_workout INTEGER NOT NULL DEFAULT 5");
  }

  const upsertExercise = db.prepare(`
    INSERT INTO exercises (
      id, name, description, category, muscle_groups_json, equipment_json,
      type, diagrams_json, cues_json, default_sets, default_reps, default_rest_seconds
    ) VALUES (
      @id, @name, @description, @category, @muscleGroupsJson, @equipmentJson,
      @type, @diagramsJson, @cuesJson, @defaultSets, @defaultReps, @defaultRestSeconds
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      category = excluded.category,
      muscle_groups_json = excluded.muscle_groups_json,
      equipment_json = excluded.equipment_json,
      type = excluded.type,
      diagrams_json = excluded.diagrams_json,
      cues_json = excluded.cues_json,
      default_sets = excluded.default_sets,
      default_reps = excluded.default_reps,
      default_rest_seconds = excluded.default_rest_seconds
  `);

  const syncExercises = db.transaction((exercises: Exercise[]) => {
    for (const exercise of exercises) {
      upsertExercise.run({
        id: exercise.id,
        name: exercise.name,
        description: exercise.description,
        category: exercise.category,
        muscleGroupsJson: JSON.stringify(exercise.muscleGroups),
        equipmentJson: JSON.stringify(exercise.equipment),
        type: exercise.type,
        diagramsJson: JSON.stringify(exercise.diagrams),
        cuesJson: JSON.stringify(exercise.cues),
        defaultSets: exercise.defaultSets,
        defaultReps: exercise.defaultReps,
        defaultRestSeconds: exercise.defaultRestSeconds,
      });
    }
  });

  syncExercises(exerciseCatalog);
}

export function getDb() {
  if (!global.__fitnessDb) {
    fs.mkdirSync(dataDir, { recursive: true });
    const db = new Database(dbPath);
    initDb(db);
    global.__fitnessDb = db;
  }

  return global.__fitnessDb;
}

function parseExerciseRow(row: Record<string, unknown>): Exercise {
  const id = String(row.id);

  return {
    id,
    name: String(row.name),
    description: String(row.description),
    category: row.category as Exercise["category"],
    muscleGroups: JSON.parse(String(row.muscle_groups_json)),
    equipment: JSON.parse(String(row.equipment_json)),
    type: row.type as Exercise["type"],
    diagrams: JSON.parse(String(row.diagrams_json)),
    imageUrls: getExerciseImageUrls(id),
    cues: JSON.parse(String(row.cues_json)),
    defaultSets: Number(row.default_sets),
    defaultReps: String(row.default_reps),
    defaultRestSeconds: Number(row.default_rest_seconds),
  };
}

export function listExercises(filters?: {
  query?: string;
  category?: string;
  equipment?: string;
  type?: string;
}) {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM exercises ORDER BY name ASC").all() as Record<string, unknown>[];
  const query = filters?.query?.toLowerCase().trim();

  return rows
    .map(parseExerciseRow)
    .filter((exercise) => {
      if (query && !exercise.name.toLowerCase().includes(query)) {
        return false;
      }
      if (filters?.category && filters.category !== "all" && exercise.category !== filters.category) {
        return false;
      }
      if (filters?.type && filters.type !== "all" && exercise.type !== filters.type) {
        return false;
      }
      if (
        filters?.equipment &&
        filters.equipment !== "all" &&
        !exercise.equipment.includes(filters.equipment)
      ) {
        return false;
      }
      return true;
    });
}

export function getExerciseById(id: string) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM exercises WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? parseExerciseRow(row) : null;
}

export function upsertWorkoutPlan(plan: WorkoutPlan) {
  const db = getDb();
  db.prepare(`
    INSERT INTO workout_plans (id, week_start_date, split, workout_days, exercises_per_workout, days_json)
    VALUES (@id, @weekStartDate, @split, @workoutDays, @exercisesPerWorkout, @daysJson)
    ON CONFLICT(week_start_date) DO UPDATE SET
      id = excluded.id,
      split = excluded.split,
      workout_days = excluded.workout_days,
      exercises_per_workout = excluded.exercises_per_workout,
      days_json = excluded.days_json
  `).run({
    id: plan.id,
    weekStartDate: plan.weekStartDate,
    split: plan.split,
    workoutDays: plan.workoutDays,
    exercisesPerWorkout: plan.exercisesPerWorkout,
    daysJson: JSON.stringify(plan.days),
  });
}

export function getWorkoutPlanByWeek(weekStartDate: string): WorkoutPlan | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM workout_plans WHERE week_start_date = ?")
    .get(weekStartDate) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    weekStartDate: String(row.week_start_date),
    split: row.split as SplitType,
    workoutDays: Number(row.workout_days) || 5,
    exercisesPerWorkout: Number(row.exercises_per_workout) || 5,
    days: JSON.parse(String(row.days_json)),
  };
}

export function saveWorkoutLog(log: WorkoutLog) {
  const db = getDb();
  db.prepare(`
    INSERT INTO workout_logs (
      id, date, day_name, week_start_date, plan_id, entries_json, total_volume, duration_minutes, notes
    ) VALUES (
      @id, @date, @dayName, @weekStartDate, @planId, @entriesJson, @totalVolume, @durationMinutes, @notes
    )
  `).run({
    id: log.id,
    date: log.date,
    dayName: log.dayName,
    weekStartDate: log.weekStartDate,
    planId: log.planId ?? null,
    entriesJson: JSON.stringify(log.entries),
    totalVolume: log.totalVolume,
    durationMinutes: log.durationMinutes ?? null,
    notes: log.notes ?? null,
  });
}

export function getWorkoutLogs(limit = 30): WorkoutLog[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM workout_logs ORDER BY date DESC, created_at DESC LIMIT ?")
    .all(limit) as Record<string, unknown>[];

  return rows.map((row) => ({
    id: String(row.id),
    date: String(row.date),
    dayName: String(row.day_name),
    weekStartDate: String(row.week_start_date),
    planId: row.plan_id ? String(row.plan_id) : null,
    entries: JSON.parse(String(row.entries_json)),
    totalVolume: Number(row.total_volume),
    durationMinutes: row.duration_minutes ? Number(row.duration_minutes) : null,
    notes: row.notes ? String(row.notes) : null,
  }));
}

export function getLastWeightForExercise(exerciseId: string) {
  const logs = getWorkoutLogs(100);

  for (const log of logs) {
    const entry = log.entries.find((item) => item.exerciseId === exerciseId);
    const lastWeightedSet = entry?.sets.find((set) => typeof set.weight === "number");

    if (lastWeightedSet?.weight) {
      return lastWeightedSet.weight;
    }
  }

  return null;
}

export function getLastExerciseEntry(exerciseId: string) {
  const logs = getWorkoutLogs(100);

  for (const log of logs) {
    const entry = log.entries.find((item) => item.exerciseId === exerciseId);

    if (entry) {
      return {
        date: log.date,
        sets: entry.sets,
        actualSetCount: entry.actualSetCount,
      };
    }
  }

  return null;
}

export function getExerciseHistory(exerciseId: string) {
  return getWorkoutLogs(120)
    .map((log) => {
      const entry = log.entries.find((item) => item.exerciseId === exerciseId);

      if (!entry) {
        return null;
      }

      return {
        date: log.date,
        sets: entry.sets,
        totalVolume: entry.sets.reduce((sum, set) => {
          if (typeof set.weight === "number" && typeof set.reps === "number") {
            return sum + set.weight * set.reps;
          }
          return sum;
        }, 0),
      };
    })
    .filter((item): item is { date: string; sets: WorkoutLog["entries"][number]["sets"]; totalVolume: number } => item !== null);
}
