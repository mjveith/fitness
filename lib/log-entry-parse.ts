import { WorkoutLog } from "@/lib/types";
import { hasCompletedSetData } from "@/lib/workout-completion";

export type LogEntryValue = FormDataEntryValue | string | number | boolean | null | undefined;

// Hard cap on sets per exercise. Requests are untrusted: without this cap a
// single payload with a huge setCount makes Array.from allocate that many
// entries server-side (memory-exhaustion DoS).
export const maxSetsPerExercise = 50;

export type ParseExerciseEntriesParams = {
  exerciseIds: string[];
  exerciseNames: string[];
  exerciseTypes: string[];
  getValue: (key: string) => LogEntryValue | LogEntryValue[];
};

function valueAt(value: LogEntryValue | LogEntryValue[], index: number) {
  return Array.isArray(value) ? value[index] : value;
}

export function numberOrUndefined(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseExerciseEntries(params: ParseExerciseEntriesParams): WorkoutLog["entries"] {
  const { exerciseIds, exerciseNames, exerciseTypes, getValue } = params;

  return exerciseIds.map((exerciseId, index) => {
    const requestedCount = numberOrUndefined(valueAt(getValue(`${exerciseId}-setCount`), 0)) ?? 0;
    const setCount = Math.min(maxSetsPerExercise, Math.max(0, Math.floor(requestedCount)));
    const sets = Array.from({ length: setCount }, (_, setIndex) => {
      const prefix = `${exerciseId}-${setIndex}`;
      return {
        reps: numberOrUndefined(valueAt(getValue(`${prefix}-reps`), 0)),
        weight: numberOrUndefined(valueAt(getValue(`${prefix}-weight`), 0)),
        duration: numberOrUndefined(valueAt(getValue(`${prefix}-duration`), 0)),
        notes: String(valueAt(getValue(`${prefix}-notes`), 0) ?? "").trim() || undefined,
      };
    }).filter((set) => set.reps || set.weight || set.duration || set.notes);

    const status = String(valueAt(getValue(`${exerciseId}-status`), 0) ?? "completed") as WorkoutLog["entries"][number]["status"];
    const completedFromPayload = String(valueAt(getValue(`${exerciseId}-completed`), 0) ?? "false") === "true";
    const completedFromSetData = setCount > 0 && sets.length === setCount && sets.every(hasCompletedSetData);
    const completed = completedFromPayload || (status === "completed" && completedFromSetData);

    return {
      exerciseId,
      name: exerciseNames[index],
      type: exerciseTypes[index] as WorkoutLog["entries"][number]["type"],
      completed,
      status,
      actualSetCount: setCount,
      sets,
    };
  });
}
