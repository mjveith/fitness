export type CompletionSetLike = {
  reps?: string | number | null;
  duration?: string | number | null;
};

export type SessionSetDraft = {
  reps: string;
  weight: string;
  duration: string;
  notes: string;
};

export function createBlankSessionSet(): SessionSetDraft {
  return {
    reps: "",
    weight: "",
    duration: "",
    notes: "",
  };
}

function hasValue(value: string | number | null | undefined) {
  return typeof value === "number" ? Number.isFinite(value) : Boolean(value?.trim());
}

export function hasCompletedSetData(set: CompletionSetLike) {
  return hasValue(set.reps) || hasValue(set.duration);
}

export function deriveExerciseComplete(params: {
  sets: CompletionSetLike[];
  manualComplete: boolean | null;
}) {
  const autoComplete = params.sets.length > 0 && params.sets.every(hasCompletedSetData);
  return params.manualComplete ?? autoComplete;
}

export type CompletionPersistEntry = {
  name: string;
  completed: boolean;
  status?: string | null;
  sets: unknown[];
};

export function shouldPersistWorkoutEntry(entry: CompletionPersistEntry) {
  return entry.completed || entry.status === "skipped";
}

export function getEntriesWithUnsavedData(entries: CompletionPersistEntry[]) {
  return entries.filter((entry) => entry.sets.length > 0 && !shouldPersistWorkoutEntry(entry));
}
