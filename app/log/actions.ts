"use server";

import { revalidatePath } from "next/cache";
import { findExistingWorkoutLog, saveWorkoutLog } from "@/lib/db";
import { getWeekStart, formatDate } from "@/lib/date";
import { getEntriesWithUnsavedData, shouldPersistWorkoutEntry } from "@/lib/workout-completion";
import { numberOrUndefined, parseExerciseEntries } from "@/lib/log-entry-parse";
import { WorkoutLog } from "@/lib/types";

export type SaveWorkoutLogActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
  savedAt: number | null;
};

const dateStringPattern = /^\d{4}-\d{2}-\d{2}$/;

// Server actions are publicly invokable HTTP endpoints; never trust date
// strings from the form. Garbage input would otherwise propagate
// "NaN-NaN-NaN" week starts into the database.
function normalizeDateString(value: unknown, fallback: string) {
  const raw = String(value ?? "").trim();
  if (!dateStringPattern.test(raw)) return fallback;
  return Number.isNaN(new Date(`${raw}T00:00:00`).getTime()) ? fallback : raw;
}

export async function saveWorkoutLogAction(
  _previousState: SaveWorkoutLogActionState,
  formData: FormData,
): Promise<SaveWorkoutLogActionState> {
  const today = formatDate(new Date());
  const actualDate = normalizeDateString(formData.get("actualDate") ?? formData.get("scheduledDate"), today);
  const dayName = String(formData.get("dayName") ?? "Session").trim().slice(0, 100) || "Session";
  const weekStartDate = normalizeDateString(
    formData.get("weekStartDate"),
    formatDate(getWeekStart(new Date(`${actualDate}T00:00:00`))),
  );
  const planId = String(formData.get("planId") ?? "");
  const exerciseIds = formData.getAll("exerciseId").map(String);
  const exerciseNames = formData.getAll("exerciseName").map(String);
  const exerciseTypes = formData.getAll("exerciseType").map(String);
  const entries = parseExerciseEntries({
    exerciseIds,
    exerciseNames,
    exerciseTypes,
    getValue: (key) => formData.get(key),
  });

  const entriesWithUnsavedData = getEntriesWithUnsavedData(entries);
  if (entriesWithUnsavedData.length > 0) {
    return {
      status: "error",
      message: `These exercises have logged data but are not complete: ${entriesWithUnsavedData.map((entry) => entry.name).join(", ")}. Fill every set or tap Mark complete so they save to history.`,
      savedAt: null,
    };
  }

  const totalVolume = entries.reduce((sum, entry) => {
    return (
      sum +
      entry.sets.reduce((entrySum, set) => {
        if (typeof set.weight === "number" && typeof set.reps === "number") {
          return entrySum + set.weight * set.reps;
        }
        return entrySum;
      }, 0)
    );
  }, 0);

  const log: WorkoutLog = {
    id: `log-${actualDate}-${Date.now()}`,
    date: actualDate,
    dayName,
    weekStartDate,
    planId: planId || null,
    entries: entries.filter(shouldPersistWorkoutEntry),
    totalVolume,
    durationMinutes: numberOrUndefined(formData.get("durationMinutes")) ?? null,
    notes: String(formData.get("sessionNotes") ?? "").trim() || null,
  };

  const existingLog = findExistingWorkoutLog({
    date: actualDate,
    dayName,
    planId: planId || null,
  });

  if (existingLog) {
    return {
      status: "error",
      message: "This workout has already been saved for that day.",
      savedAt: null,
    };
  }

  try {
    saveWorkoutLog(log);
    revalidatePath("/log");
    revalidatePath("/progress");

    return {
      status: "success",
      message: "Workout saved successfully.",
      savedAt: Date.now(),
    };
  } catch {
    return {
      status: "error",
      message: "Workout save failed. Try again.",
      savedAt: null,
    };
  }
}
