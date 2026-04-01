"use server";

import { revalidatePath } from "next/cache";
import { getExerciseById, getWorkoutPlanByWeek, upsertWorkoutPlan } from "@/lib/db";
import { createWorkoutPlan, swapWorkoutPlanDays } from "@/lib/plans";
import { SplitType } from "@/lib/types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export async function generatePlanAction(formData: FormData) {
  const split = String(formData.get("split") ?? "ppl") as SplitType;
  const workoutDays = clamp(Number(formData.get("workoutDays") ?? 5) || 5, 1, 7);
  const exercisesPerWorkout = clamp(Number(formData.get("exercisesPerWorkout") ?? 5) || 5, 2, 8);
  createWorkoutPlan({
    split,
    workoutDays,
    exercisesPerWorkout,
  });
  revalidatePath("/schedule");
  revalidatePath("/log");
  revalidatePath("/progress");
}

export async function swapWorkoutDaysAction(formData: FormData) {
  const weekStartDate = String(formData.get("weekStartDate") ?? "");
  const sourceIndex = Number(formData.get("sourceIndex"));
  const targetIndex = Number(formData.get("targetIndex"));

  if (!weekStartDate || !Number.isInteger(sourceIndex) || !Number.isInteger(targetIndex)) {
    return;
  }

  swapWorkoutPlanDays(weekStartDate, sourceIndex, targetIndex);
  revalidatePath("/schedule");
  revalidatePath("/log");
  revalidatePath("/progress");
}

export async function swapExerciseAction(formData: FormData) {
  const weekStartDate = String(formData.get("weekStartDate") ?? "");
  const dayIndex = Number(formData.get("dayIndex"));
  const exerciseIndex = Number(formData.get("exerciseIndex"));
  const newExerciseId = String(formData.get("newExerciseId") ?? "");

  if (
    !weekStartDate ||
    !newExerciseId ||
    !Number.isInteger(dayIndex) ||
    !Number.isInteger(exerciseIndex)
  ) {
    return;
  }

  const newExercise = getExerciseById(newExerciseId);
  if (!newExercise) {
    return;
  }

  const plan = getWorkoutPlanByWeek(weekStartDate);
  if (!plan || !plan.days[dayIndex] || !plan.days[dayIndex].exercises[exerciseIndex]) {
    return;
  }

  plan.days[dayIndex].exercises[exerciseIndex] = {
    exerciseId: newExercise.id,
    name: newExercise.name,
    type: newExercise.type,
    sets: newExercise.defaultSets,
    reps: newExercise.defaultReps,
    restSeconds: newExercise.defaultRestSeconds,
    category: newExercise.category,
  };

  upsertWorkoutPlan(plan);
  revalidatePath("/schedule");
  revalidatePath("/log");
}
