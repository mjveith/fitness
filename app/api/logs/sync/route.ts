import { NextRequest, NextResponse } from "next/server";
import { findExistingWorkoutLog, saveWorkoutLog } from "@/lib/db";
import { getEntriesWithUnsavedData, shouldPersistWorkoutEntry } from "@/lib/workout-completion";
import { numberOrUndefined, parseExerciseEntries } from "@/lib/log-entry-parse";
import { offlineLogsSyncPayloadSchema } from "@/lib/validation";
import { WorkoutLog } from "@/lib/types";

const maxBodyBytes = 1024 * 1024;

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
    return NextResponse.json({ error: "request body too large" }, { status: 413 });
  }

  let json: unknown;
  try {
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > maxBodyBytes) {
      return NextResponse.json({ error: "request body too large" }, { status: 413 });
    }
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const payload = offlineLogsSyncPayloadSchema.safeParse(json);
  if (!payload.success) {
    return NextResponse.json({ error: "invalid payload", issues: payload.error.issues }, { status: 400 });
  }

  const preparedLogs: WorkoutLog[] = [];

  for (const item of payload.data.logs) {
    const entries = parseExerciseEntries({
      exerciseIds: item.exerciseId,
      exerciseNames: item.exerciseName,
      exerciseTypes: item.exerciseType,
      getValue: (key) => item[key],
    });

    const entriesWithUnsavedData = getEntriesWithUnsavedData(entries);
    if (entriesWithUnsavedData.length > 0) {
      return NextResponse.json(
        {
          error: `These exercises have logged data but are not complete: ${entriesWithUnsavedData.map((entry) => entry.name).join(", ")}. Fill every set or tap Mark complete so they save to history.`,
        },
        { status: 400 },
      );
    }

    const totalVolume = entries.reduce((sum, entry) => {
      return (
        sum +
        entry.sets.reduce((entrySum, set) => {
          if (typeof set.weight === "number" && typeof set.reps === "number") {
            return entrySum + set.weight * set.reps;
          }
          return entrySum;
        }, 0)
      );
    }, 0);

    preparedLogs.push({
      id: `log-${item.date}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: item.date,
      dayName: item.dayName,
      weekStartDate: item.weekStartDate,
      planId: item.planId ? item.planId : null,
      entries: entries.filter(shouldPersistWorkoutEntry),
      totalVolume,
      durationMinutes: numberOrUndefined(item.durationMinutes) ?? null,
      notes: item.sessionNotes?.trim() || null,
    });
  }

  let synced = 0;
  let skippedDuplicates = 0;

  for (const log of preparedLogs) {
    if (
      findExistingWorkoutLog({
        date: log.date,
        dayName: log.dayName,
        planId: log.planId ?? null,
      })
    ) {
      skippedDuplicates += 1;
      continue;
    }

    saveWorkoutLog(log);
    synced += 1;
  }

  return NextResponse.json({ synced, skippedDuplicates });
}
