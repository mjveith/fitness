export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getExerciseById, getWorkoutPlanByWeek, upsertWorkoutPlan } from "@/lib/db";
import { swapPayloadSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const parsed = swapPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const { weekStartDate, dayIndex, exerciseIndex, newExerciseId } = parsed.data;

    const newExercise = getExerciseById(newExerciseId);
    if (!newExercise) {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    const plan = getWorkoutPlanByWeek(weekStartDate);
    if (!plan || !plan.days[dayIndex] || !plan.days[dayIndex].exercises[exerciseIndex]) {
      return NextResponse.json({ error: "Plan or position not found" }, { status: 404 });
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

    return NextResponse.json({ ok: true, swapped: newExercise.name });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
