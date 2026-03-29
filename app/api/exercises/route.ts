export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { listExercises } from "@/lib/db";

export function GET() {
  return NextResponse.json({
    exercises: listExercises(),
  });
}
