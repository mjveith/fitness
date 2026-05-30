"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSingleWorkout } from "@/lib/plans";
import { formatDate } from "@/lib/date";

export async function generateWorkoutAction(formData: FormData) {
  const workoutType = String(formData.get("workoutType") ?? "full-body");
  const exerciseCount = Number(formData.get("exerciseCount") ?? 5);
  const date = formatDate(new Date());
  const plan = createSingleWorkout({ workoutType, exerciseCount }, date);

  revalidatePath("/workout");
  revalidatePath("/log");
  redirect(`/log?weekStartDate=${encodeURIComponent(plan.weekStartDate)}&date=${encodeURIComponent(plan.days[0].date)}&actualDate=${encodeURIComponent(date)}`);
}
