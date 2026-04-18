"use client";

import { useState } from "react";
import Link from "next/link";
import type { WorkoutLog } from "@/lib/types";

function formatSet(
  set: { reps?: number; weight?: number; duration?: number; notes?: string },
  type: WorkoutLog["entries"][number]["type"],
) {
  if (typeof set.reps === "number" && typeof set.weight === "number") {
    return `${set.reps} × ${set.weight} lbs`;
  }
  if (typeof set.reps === "number") {
    return `${set.reps} reps`;
  }
  if (typeof set.duration === "number") {
    return type === "cardio" ? `${set.duration}m` : `${set.duration}s`;
  }
  return "—";
}

function exerciseVolume(sets: { reps?: number; weight?: number }[]) {
  return sets.reduce((sum, set) => {
    if (typeof set.reps === "number" && typeof set.weight === "number") {
      return sum + set.reps * set.weight;
    }
    return sum;
  }, 0);
}

export function WorkoutLogDetail({ log }: { log: WorkoutLog }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="rounded-2xl border border-white/10 bg-slate-950/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-4 text-left transition hover:bg-white/[0.02]"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-50">{log.dayName}</p>
            <p className="mt-1 text-sm text-slate-400">
              {log.date} · {log.entries.length} exercises · vol {log.totalVolume.toFixed(0)}
              {log.durationMinutes ? ` · ${log.durationMinutes}m` : ""}
            </p>
          </div>
          <span
            className={`shrink-0 text-xs text-slate-500 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/10 px-4 pb-4 pt-3 grid gap-3">
          {log.entries.map((entry) => {
            const vol = exerciseVolume(entry.sets);
            return (
              <div
                key={entry.exerciseId}
                className="rounded-2xl border border-white/10 bg-slate-900/50 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/exercises/${entry.exerciseId}`}
                      className="text-sm font-medium text-sky-200 hover:text-sky-100 transition"
                    >
                      {entry.name}
                    </Link>
                    {entry.status === "skipped" ? (
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-amber-300">Skipped</p>
                    ) : null}
                  </div>
                  {vol > 0 ? (
                    <span className="shrink-0 text-xs text-slate-500">
                      vol {vol.toFixed(0)}
                    </span>
                  ) : entry.status === "skipped" ? (
                    <span className="shrink-0 text-xs text-amber-300/80">not completed</span>
                  ) : null}
                </div>
                <ul className="mt-2 grid gap-1">
                  {entry.sets.map((set, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="w-10 shrink-0 text-slate-500">Set {idx + 1}</span>
                      <span>{formatSet(set, entry.type)}</span>
                      {set.notes && (
                        <span className="text-slate-500 italic">({set.notes})</span>
                      )}
                    </li>
                  ))}
                </ul>
                {entry.status === "skipped" && entry.sets.length === 0 ? (
                  <p className="mt-2 text-xs italic text-slate-400">Saved as intentionally skipped.</p>
                ) : null}
              </div>
            );
          })}
          {log.notes && (
            <p className="text-xs text-slate-400 italic">Notes: {log.notes}</p>
          )}
        </div>
      )}
    </li>
  );
}
