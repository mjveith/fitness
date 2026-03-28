"use server";

import { revalidatePath } from "next/cache";
import { saveWorkoutLog } from "@/lib/db";
import { getWeekStart, formatDate } from "@/lib/date";
import { WorkoutLog } from "@/lib/types";

function numberOrUndefined(value: FormDataEntryValue | null) {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function saveWorkoutLogAction(formData: FormData) {
  const date = String(formData.get("date") ?? formatDate(new Date()));
  const dayName = String(formData.get("dayName") ?? "Session");
  const weekStartDate = String(formData.get("weekStartDate") ?? formatDate(getWeekStart(new Date(date))));
  const planId = String(formData.get("planId") ?? "");
  const exerciseIds = formData.getAll("exerciseId").map(String);
  const exerciseNames = formData.getAll("exerciseName").map(String);
  const exerciseTypes = formData.getAll("exerciseType").map(String);

  const entries = exerciseIds.map((exerciseId, index) => {
    const sets = Array.from({ length: 4 }, (_, setIndex) => {
      const prefix = `${exerciseId}-${setIndex}`;
      return {
        reps: numberOrUndefined(formData.get(`${prefix}-reps`)),
        weight: numberOrUndefined(formData.get(`${prefix}-weight`)),
        duration: numberOrUndefined(formData.get(`${prefix}-duration`)),
        notes: String(formData.get(`${prefix}-notes`) ?? "").trim() || undefined,
      };
    }).filter((set) => set.reps || set.weight || set.duration || set.notes);

    return {
      exerciseId,
      name: exerciseNames[index],
      type: exerciseTypes[index] as WorkoutLog["entries"][number]["type"],
      completed: sets.length > 0,
      sets,
    };
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
    id: `log-${date}-${Date.now()}`,
    date,
    dayName,
    weekStartDate,
    planId: planId || null,
    entries: entries.filter((entry) => entry.completed),
    totalVolume,
    durationMinutes: numberOrUndefined(formData.get("durationMinutes")) ?? null,
    notes: String(formData.get("sessionNotes") ?? "").trim() || null,
  };

  saveWorkoutLog(log);
  revalidatePath("/log");
  revalidatePath("/progress");
}
