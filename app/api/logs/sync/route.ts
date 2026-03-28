import { NextRequest, NextResponse } from "next/server";
import { saveWorkoutLog } from "@/lib/db";
import { WorkoutLog } from "@/lib/types";

function valueAt<T>(value: unknown, index: number) {
  return Array.isArray(value) ? value[index] : value;
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as { logs?: Array<Record<string, unknown>> };
  const logs = payload.logs ?? [];

  for (const item of logs) {
    const exerciseIds = Array.isArray(item.exerciseId) ? item.exerciseId.map(String) : [];
    const exerciseNames = Array.isArray(item.exerciseName) ? item.exerciseName.map(String) : [];
    const exerciseTypes = Array.isArray(item.exerciseType) ? item.exerciseType.map(String) : [];
    const entries = exerciseIds.map((exerciseId, index) => {
      const sets = Array.from({ length: 4 }, (_, setIndex) => {
        const reps = valueAt(item[`${exerciseId}-${setIndex}-reps`], 0);
        const weight = valueAt(item[`${exerciseId}-${setIndex}-weight`], 0);
        const duration = valueAt(item[`${exerciseId}-${setIndex}-duration`], 0);
        const notes = valueAt(item[`${exerciseId}-${setIndex}-notes`], 0);
        return {
          reps: reps ? Number(reps) : undefined,
          weight: weight ? Number(weight) : undefined,
          duration: duration ? Number(duration) : undefined,
          notes: notes ? String(notes) : undefined,
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

    saveWorkoutLog({
      id: `log-${String(item.date)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: String(item.date),
      dayName: String(item.dayName),
      weekStartDate: String(item.weekStartDate),
      planId: item.planId ? String(item.planId) : null,
      entries: entries.filter((entry) => entry.completed),
      totalVolume,
      durationMinutes: item.durationMinutes ? Number(item.durationMinutes) : null,
      notes: item.sessionNotes ? String(item.sessionNotes) : null,
    });
  }

  return NextResponse.json({ synced: logs.length });
}
