import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { getWorkoutLogs } from "@/lib/db";
import { getWeeklySummary } from "@/lib/progress";

export default function ProgressPage() {
  const summary = getWeeklySummary();
  const logs = getWorkoutLogs(20);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Trend View"
        title="Progress"
        description="Review weekly adherence, total volume, and drill into past sessions or exercise histories."
      />
      <section className="grid gap-3 sm:grid-cols-3">
        <article className="glass-panel rounded-3xl p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Completed</p>
          <p className="mt-3 text-3xl font-semibold text-slate-50">
            {summary.completedSessions}/{summary.plannedSessions}
          </p>
        </article>
        <article className="glass-panel rounded-3xl p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Volume</p>
          <p className="mt-3 text-3xl font-semibold text-slate-50">{summary.totalVolume.toFixed(0)}</p>
        </article>
        <article className="glass-panel rounded-3xl p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Exercises</p>
          <p className="mt-3 text-3xl font-semibold text-slate-50">{summary.totalExercisesLogged}</p>
        </article>
      </section>
      <section className="glass-panel rounded-3xl p-4">
        <h2 className="text-lg font-semibold text-slate-50">Past workouts</h2>
        {logs.length > 0 ? (
          <ul className="mt-3 grid gap-3">
            {logs.map((log) => (
              <li key={log.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-50">{log.dayName}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {log.date} · {log.entries.length} exercises · volume {log.totalVolume.toFixed(0)}
                    </p>
                  </div>
                  {log.entries[0] ? (
                    <Link
                      href={`/exercises/${log.entries[0].exerciseId}`}
                      className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300"
                    >
                      View exercise history
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-400">No workouts logged yet.</p>
        )}
      </section>
    </div>
  );
}
