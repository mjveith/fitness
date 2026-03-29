"use server";

import { revalidatePath } from "next/cache";
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
