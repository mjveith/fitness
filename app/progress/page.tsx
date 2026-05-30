export const dynamic = "force-dynamic";
import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { getWorkoutLogs } from "@/lib/db";
import { getWorkoutHistoryGuidance } from "@/lib/plans";
import { getRecentSummary } from "@/lib/progress";
import { WorkoutLogDetail } from "@/components/workout-log-detail";

export default function ProgressPage() {
  const summary = getRecentSummary();
  const logs = getWorkoutLogs(20);
  const guidance = getWorkoutHistoryGuidance(logs);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="History"
        title="Progress"
        description="Review completed workouts and use recent focus history to pick the next session."
      />
      <section className="grid gap-3 sm:grid-cols-3">
        <article className="glass-panel rounded-3xl p-4">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Logged</p>
          <p className="mt-3 text-3xl font-semibold text-slate-50">{summary.completedSessions}</p>
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-200">Next focus</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{guidance.recommendationLabel}</h2>
            <p className="mt-1 text-sm text-slate-400">{guidance.reason} Core target: {guidance.nextCoreFocus}.</p>
          </div>
          <Link href="/workout" className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-200">Generate</Link>
        </div>
      </section>
      <section className="glass-panel rounded-3xl p-4">
        <h2 className="text-lg font-semibold text-slate-50">Past workouts</h2>
        {logs.length > 0 ? (
          <ul className="mt-3 grid gap-3">
            {logs.map((log) => (
              <WorkoutLogDetail key={log.id} log={log} />
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-400">No workouts logged yet.</p>
        )}
      </section>
    </div>
  );
}
