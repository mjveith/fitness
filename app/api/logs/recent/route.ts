export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getWorkoutLogs } from "@/lib/db";

export function GET() {
  return NextResponse.json({
    logs: getWorkoutLogs(20),
  });
}
