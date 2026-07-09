import { Exercise, PlanExercise, WorkoutPlan } from "@/lib/types";

export type SwapPlanExerciseInput = {
  weekStartDate: string;
  dayIndex: number;
  exerciseIndex: number;
  newExerciseId: string;
};

export type SwapPlanExerciseResult =
  | { ok: true; swapped: string }
  | { ok: false; reason: "exercise-not-found" | "plan-position-not-found" };

export type SwapPlanExerciseDeps = {
  getExerciseById?: (id: string) => Exercise | null | undefined;
  listExercises?: () => Exercise[];
  getPlanByWeek: (weekStartDate: string) => WorkoutPlan | null;
  upsertPlan: (plan: WorkoutPlan) => void;
};

function getDefaultSwapDeps(): Required<Pick<SwapPlanExerciseDeps, "getExerciseById">> & Omit<SwapPlanExerciseDeps, "getExerciseById"> {
  const db = require("@/lib/db") as typeof import("@/lib/db");

  return {
    getExerciseById: db.getExerciseById,
    listExercises: db.listExercises,
    getPlanByWeek: db.getWorkoutPlanByWeek,
    upsertPlan: db.upsertWorkoutPlan,
  };
}

function resolveExercise(id: string, deps: SwapPlanExerciseDeps): Exercise | null {
  const byId = deps.getExerciseById?.(id);
  if (byId) {
    return byId;
  }

  return deps.listExercises?.().find((exercise) => exercise.id === id) ?? null;
}

function toPlanExercise(exercise: Exercise): PlanExercise {
  return {
    exerciseId: exercise.id,
    name: exercise.name,
    type: exercise.type,
    sets: exercise.defaultSets,
    reps: exercise.defaultReps,
    restSeconds: exercise.defaultRestSeconds,
    category: exercise.category,
  };
}

export function swapPlanExercise(
  input: SwapPlanExerciseInput,
  deps: SwapPlanExerciseDeps = getDefaultSwapDeps(),
): SwapPlanExerciseResult {
  const newExercise = resolveExercise(input.newExerciseId, deps);
  if (!newExercise) {
    return { ok: false, reason: "exercise-not-found" };
  }

  const plan = deps.getPlanByWeek(input.weekStartDate);
  const day = plan?.days[input.dayIndex];
  const existingExercise = day?.exercises[input.exerciseIndex];
  if (!plan || !day || !existingExercise) {
    return { ok: false, reason: "plan-position-not-found" };
  }

  const updatedPlan: WorkoutPlan = {
    ...plan,
    days: plan.days.map((planDay, dayIndex) => {
      if (dayIndex !== input.dayIndex) {
        return planDay;
      }

      return {
        ...planDay,
        exercises: planDay.exercises.map((exercise, exerciseIndex) => {
          if (exerciseIndex !== input.exerciseIndex) {
            return exercise;
          }

          return toPlanExercise(newExercise);
        }),
      };
    }),
  };

  deps.upsertPlan(updatedPlan);

  return { ok: true, swapped: newExercise.name };
}
