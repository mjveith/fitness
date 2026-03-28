"use server";

import { revalidatePath } from "next/cache";
import { createWorkoutPlan } from "@/lib/plans";
import { SplitType } from "@/lib/types";

export async function generatePlanAction(formData: FormData) {
  const split = String(formData.get("split") ?? "ppl") as SplitType;
  createWorkoutPlan(split);
  revalidatePath("/schedule");
  revalidatePath("/log");
  revalidatePath("/progress");
}
