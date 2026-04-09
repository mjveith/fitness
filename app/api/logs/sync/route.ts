import { NextRequest, NextResponse } from "next/server";
import { findExistingWorkoutLog, saveWorkoutLog } from "@/lib/db";
import { WorkoutLog } from "@/lib/types";

function valueAt<T>(value: unknown, index: number) {
  return Array.isArray(value) ? value[index] : value;
}

function numberOrUndefined(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { logs?: Array<Record<string, unknown>> };
  const logs = payload.logs ?? [];

  for (const item of logs) {
    const exerciseIds = Array.isArray(item.exerciseId) ? item.exerciseId.map(String) : [];
    const exerciseNames = Array.isArray(item.exerciseName) ? item.exerciseName.map(String) : [];
    const exerciseTypes = Array.isArray(item.exerciseType) ? item.exerciseType.map(String) : [];
    const entries = exerciseIds.map((exerciseId, index) => {
      const setCount = numberOrUndefined(valueAt(item[`${exerciseId}-setCount`], 0)) ?? 0;
      const sets = Array.from({ length: setCount }, (_, setIndex) => {
        const reps = valueAt(item[`${exerciseId}-${setIndex}-reps`], 0);
        const weight = valueAt(item[`${exerciseId}-${setIndex}-weight`], 0);
        const duration = valueAt(item[`${exerciseId}-${setIndex}-duration`], 0);
        const notes = valueAt(item[`${exerciseId}-${setIndex}-notes`], 0);
        return {
          reps: numberOrUndefined(reps),
          weight: numberOrUndefined(weight),
          duration: numberOrUndefined(duration),
          notes: notes ? String(notes) : undefined,
        };
      }).filter((set) => set.reps || set.weight || set.duration || set.notes);

      return {
        exerciseId,
        name: exerciseNames[index],
        type: exerciseTypes[index] as WorkoutLog["entries"][number]["type"],
        completed: String(valueAt(item[`${exerciseId}-completed`], 0) ?? "false") === "true",
        actualSetCount: setCount,
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

    const date = String(item.date);
    const dayName = String(item.dayName);
    const planId = item.planId ? String(item.planId) : null;

    if (
      findExistingWorkoutLog({
        date,
        dayName,
        planId,
      })
    ) {
      continue;
    }

    saveWorkoutLog({
      id: `log-${date}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date,
      dayName,
      weekStartDate: String(item.weekStartDate),
      planId,
      entries: entries.filter((entry) => entry.completed),
      totalVolume,
      durationMinutes: item.durationMinutes ? Number(item.durationMinutes) : null,
      notes: item.sessionNotes ? String(item.sessionNotes) : null,
    });
  }

  return NextResponse.json({ synced: logs.length });
}
