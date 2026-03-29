export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getOrCreateCurrentPlan } from "@/lib/plans";

export function GET() {
  return NextResponse.json({
    plan: getOrCreateCurrentPlan(),
  });
}
