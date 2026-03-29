export const dynamic = "force-dynamic";
import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { formatDisplayDate } from "@/lib/date";
import { getOrCreateCurrentPlan } from "@/lib/plans";
import { generatePlanAction, swapWorkoutDaysAction } from "@/app/schedule/actions";

export default function SchedulePage() {
  const plan = getOrCreateCurrentPlan();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Week Builder"
        title="Schedule"
        description="Generate and persist a 7-day plan with configurable workout frequency and exercise volume."
      />
      <section className="glass-panel rounded-3xl p-4">
        <form action={generatePlanAction} className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-sm text-slate-300">
            Split
            <select
              name="split"
              defaultValue={plan.split}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
            >
              <option value="ppl">Push / Pull / Legs</option>
              <option value="upper-lower">Upper / Lower</option>
              <option value="full-body">Full Body</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Workout Days
            <input
              type="number"
              name="workoutDays"
              min={1}
              max={7}
              defaultValue={plan.workoutDays}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Exercises per Workout
            <input
              type="number"
              name="exercisesPerWorkout"
              min={2}
              max={8}
              defaultValue={plan.exercisesPerWorkout}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
            />
          </label>
          <button
            type="submit"
            className="rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 sm:col-span-2"
          >
            Regenerate Week
          </button>
        </form>
      </section>
      <section className="grid gap-3">
        {plan.days.map((day) => (
          <article
            key={day.date}
            className="glass-panel rounded-3xl p-4 transition hover:border-sky-300/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.32em] text-slate-400">
                  {day.label} · {formatDisplayDate(day.date)}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-50">{day.workoutType}</h2>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <form action={swapWorkoutDaysAction}>
                  <input type="hidden" name="weekStartDate" value={plan.weekStartDate} />
                  <input type="hidden" name="sourceIndex" value={day.dayOfWeek} />
                  <input type="hidden" name="targetIndex" value={day.dayOfWeek - 1} />
                  <button
                    type="submit"
                    disabled={day.dayOfWeek === 0}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-200 transition disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Move up
                  </button>
                </form>
                <form action={swapWorkoutDaysAction}>
                  <input type="hidden" name="weekStartDate" value={plan.weekStartDate} />
                  <input type="hidden" name="sourceIndex" value={day.dayOfWeek} />
                  <input type="hidden" name="targetIndex" value={day.dayOfWeek + 1} />
                  <button
                    type="submit"
                    disabled={day.dayOfWeek === plan.days.length - 1}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-200 transition disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Move down
                  </button>
                </form>
                <Link
                  href={`/log?date=${day.date}`}
                  className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-medium text-sky-200"
                >
                  Start
                </Link>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-300">{day.focus}</p>
            {day.exercises.length > 0 ? (
              <ul className="mt-4 grid gap-2">
                {day.exercises.map((exercise) => (
                  <li
                    key={exercise.exerciseId}
                    className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-sm text-slate-300"
                  >
                    <span className="font-medium text-slate-100">{exercise.name}</span>{" "}
                    <span className="text-slate-400">
                      {exercise.sets} sets · {exercise.reps} · {exercise.restSeconds}s rest
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-white/10 px-3 py-4 text-sm text-slate-400">
                Recovery day. Walk, mobilize, and reset.
              </p>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
