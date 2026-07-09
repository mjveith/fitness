import { useEffect, useMemo, useRef, useState } from "react";
import { createBlankSessionSet, deriveExerciseComplete } from "@/lib/workout-completion";
import type { ExerciseCategory, ExerciseType, LoggedSet } from "@/lib/types";

export type WorkoutLogFormExercise = {
  exerciseId: string;
  name: string;
  category: ExerciseCategory;
  type: ExerciseType;
  diagrams: string[];
  imageUrls?: [string, string] | null;
  equipment: string[];
  lastEntrySets?: LoggedSet[] | null;
  plannedSets: number;
  plannedReps: string;
  restSeconds: number;
};

export type ExerciseSetState = {
  reps: string;
  weight: string;
  duration: string;
  notes: string;
};

export type ExerciseState = {
  sets: ExerciseSetState[];
  manualComplete: boolean | null;
};

export type ActiveRestTimer = {
  exerciseId: string;
  exerciseName: string;
  durationSeconds: number;
  startedAt: number;
};

export function createEmptySet(): ExerciseSetState {
  return createBlankSessionSet();
}

export function buildInitialExerciseState(exercises: WorkoutLogFormExercise[]) {
  return Object.fromEntries(
    exercises.map((exercise) => {
      const setCount = Math.max(1, exercise.plannedSets || 3);
      return [
        exercise.exerciseId,
        {
          sets: Array.from({ length: setCount }, () => createEmptySet()),
          manualComplete: null,
        },
      ];
    }),
  ) as Record<string, ExerciseState>;
}

export function isSetEmpty(set: ExerciseSetState) {
  return !set.reps.trim() && !set.weight.trim() && !set.duration.trim() && !set.notes.trim();
}

type UseExerciseLogStateParams = {
  exercises: WorkoutLogFormExercise[];
  ensureSessionStarted: (value?: string) => void;
  onStatusClear: () => void;
  onRestTimerChange: (updater: (current: ActiveRestTimer | null) => ActiveRestTimer | null) => void;
};

export function useExerciseLogState({
  exercises,
  ensureSessionStarted,
  onStatusClear,
  onRestTimerChange,
}: UseExerciseLogStateParams) {
  const resetFlashTimeoutRef = useRef<number | null>(null);
  const [recentlyResetExerciseId, setRecentlyResetExerciseId] = useState<string | null>(null);
  const [exerciseState, setExerciseState] = useState<Record<string, ExerciseState>>(() =>
    buildInitialExerciseState(exercises),
  );

  const completionMap = useMemo(() => {
    return Object.fromEntries(
      exercises.map((exercise) => {
        const state = exerciseState[exercise.exerciseId];
        return [
          exercise.exerciseId,
          deriveExerciseComplete({ sets: state.sets, manualComplete: state.manualComplete }),
        ];
      }),
    ) as Record<string, boolean>;
  }, [exerciseState, exercises]);

  const allExercisesComplete =
    exercises.length > 0 && exercises.every((exercise) => completionMap[exercise.exerciseId]);

  useEffect(() => {
    return () => {
      if (resetFlashTimeoutRef.current) {
        window.clearTimeout(resetFlashTimeoutRef.current);
      }
    };
  }, []);

  function updateSet(exerciseId: string, setIndex: number, key: keyof ExerciseSetState, value: string) {
    ensureSessionStarted(value);
    onStatusClear();

    setExerciseState((current) => {
      const next = { ...current };
      const exercise = next[exerciseId];
      const sets = exercise.sets.map((set, index) => (index === setIndex ? { ...set, [key]: value } : set));
      next[exerciseId] = { ...exercise, sets, manualComplete: null };
      return next;
    });
  }

  function addSet(exercise: WorkoutLogFormExercise) {
    ensureSessionStarted("1");
    onStatusClear();
    setExerciseState((current) => ({
      ...current,
      [exercise.exerciseId]: {
        ...current[exercise.exerciseId],
        sets: [...current[exercise.exerciseId].sets, createEmptySet()],
      },
    }));
  }

  function removeSet(exerciseId: string, setIndex: number) {
    onStatusClear();
    setExerciseState((current) => {
      const exercise = current[exerciseId];
      if (exercise.sets.length === 1 || !isSetEmpty(exercise.sets[setIndex])) {
        return current;
      }

      return {
        ...current,
        [exerciseId]: {
          ...exercise,
          sets: exercise.sets.filter((_, index) => index !== setIndex),
        },
      };
    });
  }

  function toggleComplete(exerciseId: string) {
    ensureSessionStarted("1");
    onStatusClear();
    setExerciseState((current) => {
      const exercise = current[exerciseId];
      const currentComplete = deriveExerciseComplete({
        sets: exercise.sets,
        manualComplete: exercise.manualComplete,
      });

      return {
        ...current,
        [exerciseId]: {
          ...exercise,
          manualComplete: !currentComplete,
        },
      };
    });
  }

  function resetExercise(exercise: WorkoutLogFormExercise) {
    onStatusClear();
    setExerciseState((current) => ({
      ...current,
      [exercise.exerciseId]: {
        sets: Array.from({ length: current[exercise.exerciseId].sets.length }, () => createEmptySet()),
        manualComplete: null,
      },
    }));
    onRestTimerChange((current) => (current?.exerciseId === exercise.exerciseId ? null : current));
    setRecentlyResetExerciseId(exercise.exerciseId);
    if (resetFlashTimeoutRef.current) {
      window.clearTimeout(resetFlashTimeoutRef.current);
    }
    resetFlashTimeoutRef.current = window.setTimeout(() => {
      setRecentlyResetExerciseId((current) => (current === exercise.exerciseId ? null : current));
    }, 650);
  }

  function handleRepsBlur(exercise: WorkoutLogFormExercise, value: string) {
    if (!value.trim() || exercise.restSeconds <= 0) {
      return;
    }

    onRestTimerChange(() => ({
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.name,
      durationSeconds: exercise.restSeconds,
      startedAt: Date.now(),
    }));
  }

  return {
    exerciseState,
    setExerciseState,
    completionMap,
    allExercisesComplete,
    recentlyResetExerciseId,
    updateSet,
    addSet,
    removeSet,
    toggleComplete,
    resetExercise,
    handleRepsBlur,
  };
}
