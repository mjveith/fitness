export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getOrCreateTodaysWorkout } from "@/lib/plans";

export async function GET() {
  return NextResponse.json({
    workout: getOrCreateTodaysWorkout(),
  });
}
