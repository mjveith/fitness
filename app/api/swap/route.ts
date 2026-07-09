export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { swapPlanExercise } from "@/lib/swap";
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
    const result = swapPlanExercise(parsed.data);

    if (result.ok) {
      return NextResponse.json({ ok: true, swapped: result.swapped });
    }

    if (result.reason === "exercise-not-found") {
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Plan or position not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
