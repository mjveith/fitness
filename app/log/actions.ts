"use server";

import { revalidatePath } from "next/cache";
import { findExistingWorkoutLog, saveWorkoutLog } from "@/lib/db";
import { getWeekStart, formatDate } from "@/lib/date";
import { WorkoutLog } from "@/lib/types";

export type SaveWorkoutLogActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
  savedAt: number | null;
};

function numberOrUndefined(value: FormDataEntryValue | null) {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseExerciseEntries(params: {
  exerciseIds: string[];
  exerciseNames: string[];
  exerciseTypes: string[];
  getValue: (key: string) => FormDataEntryValue | null;
}) {
  const { exerciseIds, exerciseNames, exerciseTypes, getValue } = params;

  return exerciseIds.map((exerciseId, index) => {
    const requestedCount = numberOrUndefined(getValue(`${exerciseId}-setCount`)) ?? 0;
    const setCount = Math.max(0, requestedCount);
    const sets = Array.from({ length: setCount }, (_, setIndex) => {
      const prefix = `${exerciseId}-${setIndex}`;
      return {
        reps: numberOrUndefined(getValue(`${prefix}-reps`)),
        weight: numberOrUndefined(getValue(`${prefix}-weight`)),
        duration: numberOrUndefined(getValue(`${prefix}-duration`)),
        notes: String(getValue(`${prefix}-notes`) ?? "").trim() || undefined,
      };
    }).filter((set) => set.reps || set.weight || set.duration || set.notes);

    return {
      exerciseId,
      name: exerciseNames[index],
      type: exerciseTypes[index] as WorkoutLog["entries"][number]["type"],
      completed: String(getValue(`${exerciseId}-completed`) ?? "false") === "true",
      actualSetCount: setCount,
      sets,
    };
  });
}

export async function saveWorkoutLogAction(
  _previousState: SaveWorkoutLogActionState,
  formData: FormData,
): Promise<SaveWorkoutLogActionState> {
  const actualDate = String(formData.get("actualDate") ?? formData.get("scheduledDate") ?? formatDate(new Date()));
  const dayName = String(formData.get("dayName") ?? "Session");
  const weekStartDate = String(formData.get("weekStartDate") ?? formatDate(getWeekStart(new Date(actualDate))));
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
    entries: entries.filter((entry) => entry.completed),
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
