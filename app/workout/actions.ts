"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSingleWorkout } from "@/lib/plans";
import { formatDate } from "@/lib/date";
import { singleWorkoutRequestSchema } from "@/lib/validation";

export async function generateWorkoutAction(formData: FormData) {
  const parsed = singleWorkoutRequestSchema.safeParse({
    workoutType: formData.get("workoutType") ?? "full-body",
    exerciseCount: formData.get("exerciseCount") ?? 5,
  });
  const config = parsed.success ? parsed.data : { workoutType: "full-body" as const, exerciseCount: 5 };
  const date = formatDate(new Date());
  const plan = createSingleWorkout(config, date);

  revalidatePath("/workout");
  revalidatePath("/log");
  redirect(`/log?weekStartDate=${encodeURIComponent(plan.weekStartDate)}&date=${encodeURIComponent(plan.days[0].date)}&actualDate=${encodeURIComponent(date)}`);
}
