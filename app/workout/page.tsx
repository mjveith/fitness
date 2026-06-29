export const dynamic = "force-dynamic";

import Link from "next/link";
import { getWorkoutHistoryGuidance, workoutTypeOptions } from "@/lib/plans";
import { generateWorkoutAction } from "@/app/workout/actions";

export default function WorkoutPage() {
  const guidance = getWorkoutHistoryGuidance();

  return (
    <div className="space-y-6">
      <section className="glass-panel space-y-4 rounded-3xl p-4">
        <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-sky-200">Suggested next</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{guidance.recommendationLabel}</h2>
          <p className="mt-2 text-sm text-slate-300">{guidance.reason}</p>
          <p className="mt-2 text-xs text-slate-400">Core rotation target: {guidance.nextCoreFocus}</p>
        </div>

        <form action={generateWorkoutAction} className="grid gap-4">
          <label className="grid gap-2 text-sm text-slate-300">
            Workout type
            <select
              name="workoutType"
              defaultValue={guidance.recommendation}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
            >
              {workoutTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            Number of exercises
            <input
              name="exerciseCount"
              type="number"
              min={1}
              max={10}
              defaultValue={5}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
            />
          </label>

          <button className="rounded-2xl bg-sky-400 px-4 py-3 font-semibold text-slate-950 shadow-glow" type="submit">
            Generate workout
          </button>
        </form>
      </section>

      <section className="glass-panel rounded-3xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">History check</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Recent focus</h2>
          </div>
          <Link href="/progress" className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-200">
            Full history
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {guidance.recent.length === 0 ? (
            <p className="text-sm text-slate-400">No completed workouts yet. Start with the suggested focus and history will guide the next one.</p>
          ) : guidance.recent.map((item) => (
            <div key={`${item.date}-${item.label}`} className="flex items-center justify-between rounded-2xl bg-slate-950/70 px-3 py-2 text-sm">
              <span className="text-slate-200">{item.label}</span>
              <span className="text-slate-500">{item.date}{item.coreFocus ? ` · core: ${item.coreFocus}` : ""}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
