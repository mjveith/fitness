export const dynamic = "force-dynamic";
import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { formatDisplayDate, normalizeWeekStartDay, weekStartDayOptions } from "@/lib/date";
import { getWorkoutPlanByWeek } from "@/lib/db";
import { getOrCreateCurrentPlan } from "@/lib/plans";
import { generatePlanAction, swapWorkoutDaysAction } from "@/app/schedule/actions";

type SchedulePageProps = {
  searchParams?: {
    weekStartDate?: string;
  };
};

const dayLabelsForForm = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SchedulePage({ searchParams }: SchedulePageProps) {
  const requestedPlan = searchParams?.weekStartDate ? getWorkoutPlanByWeek(searchParams.weekStartDate) : null;
  const plan = requestedPlan ?? getOrCreateCurrentPlan();
  const selectedWeekStartDay = normalizeWeekStartDay(new Date(`${plan.weekStartDate}T00:00:00`).getDay());
  const selectedWeekStartLabel = weekStartDayOptions.find((option) => option.value === selectedWeekStartDay)?.label ?? "Monday";
  const athleticWork = plan.athleticWork ?? {
    frequency: 0,
    intensity: "moderate",
    modalities: ["sprints", "jumps", "agility"],
    placementMode: "auto",
    preferredDays: [],
  };
  const modalityOptions = [
    { value: "sprints", label: "Sprints" },
    { value: "jumps", label: "Jumps / plyos" },
    { value: "agility", label: "Ladder / agility" },
    { value: "conditioning", label: "Athletic conditioning" },
  ];

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
          <label className="grid gap-2 text-sm text-slate-300">
            Week starts on
            <select
              name="weekStartDay"
              defaultValue={String(selectedWeekStartDay)}
              className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
            >
              {weekStartDayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <p className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
            Current plan starts {selectedWeekStartLabel}, {formatDisplayDate(plan.weekStartDate)}.
          </p>
          <div className="sm:col-span-2 rounded-3xl border border-sky-400/20 bg-sky-400/5 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-sky-200">Athletic work</p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="grid gap-2 text-sm text-slate-300">
                Frequency / week
                <input
                  type="number"
                  name="athleticFrequency"
                  min={0}
                  max={4}
                  defaultValue={athleticWork.frequency}
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                Intensity
                <select
                  name="athleticIntensity"
                  defaultValue={athleticWork.intensity}
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
                >
                  <option value="low">Low / technique</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High / power</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm text-slate-300">
                Placement
                <select
                  name="athleticPlacementMode"
                  defaultValue={athleticWork.placementMode}
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-100 outline-none"
                >
                  <option value="auto">Generate around recovery</option>
                  <option value="preferred">Prefer selected days</option>
                  <option value="locked">Lock to selected days</option>
                </select>
              </label>
              <fieldset className="grid gap-2 text-sm text-slate-300 md:col-span-3">
                <legend className="text-sm">Modalities</legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {modalityOptions.map((option) => (
                    <label key={option.value} className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-xs leading-snug">
                      <input
                        type="checkbox"
                        name="athleticModalities"
                        value={option.value}
                        defaultChecked={athleticWork.modalities.includes(option.value as never)}
                        className="shrink-0"
                      />
                      <span className="min-w-0 break-words">{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset className="grid gap-2 text-sm text-slate-300 md:col-span-3">
                <legend className="text-sm">Preferred / locked days</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  {dayLabelsForForm.map((label, index) => (
                    <label key={label} className="flex min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-xs leading-snug">
                      <input
                        type="checkbox"
                        name="athleticPreferredDays"
                        value={index}
                        defaultChecked={athleticWork.preferredDays.includes(index)}
                        className="shrink-0"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
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
                    {exercise.prescription ? (
                      <div className="mt-2 rounded-xl border border-sky-400/10 bg-sky-400/5 px-3 py-2 text-xs text-slate-300">
                        <p className="font-medium text-sky-100">
                          {exercise.modality} · {exercise.mediaKind} · {exercise.prescription.intensity}
                        </p>
                        <p className="mt-1">
                          {exercise.prescription.distanceOrTime} · {exercise.prescription.reps} · {exercise.prescription.sets} · rest {exercise.prescription.rest}
                        </p>
                        <p className="mt-1 text-slate-400">{exercise.prescription.notes}</p>
                        {exercise.safetyNotes ? <p className="mt-1 text-amber-100/80">Safety: {exercise.safetyNotes}</p> : null}
                      </div>
                    ) : null}
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
