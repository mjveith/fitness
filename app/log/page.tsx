import { DiagramCard } from "@/components/diagram-card";
import { SectionHeader } from "@/components/section-header";
import { WorkoutLogForm } from "@/components/workout-log-form";
import { getExerciseById, getLastWeightForExercise } from "@/lib/db";
import { formatDate } from "@/lib/date";
import { getOrCreateCurrentPlan } from "@/lib/plans";
import { saveWorkoutLogAction } from "@/app/log/actions";
import { Exercise } from "@/lib/types";

type DetailedExercise = {
  planExercise: {
    exerciseId: string;
    name: string;
    type: Exercise["type"];
    sets: number;
    reps: string;
    restSeconds: number;
    category: Exercise["category"];
  };
  exercise: Exercise;
  lastWeight: number | null;
};

export default function LogPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const plan = getOrCreateCurrentPlan();
  const selectedDate = searchParams.date ?? formatDate(new Date());
  const selectedDay = plan.days.find((day) => day.date === selectedDate) ?? plan.days[0];
  const detailedExercises = selectedDay.exercises
    .map((item) => {
      const exercise = getExerciseById(item.exerciseId);
      return exercise
        ? {
            planExercise: item,
            exercise,
            lastWeight: exercise.type === "strength" ? getLastWeightForExercise(exercise.id) : null,
          }
        : null;
    })
    .filter((item): item is DetailedExercise => item !== null);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Session Capture"
        title="Log"
        description="Quick-log the scheduled session, with last used strength weights prefilled when available."
      />
      <section className="glass-panel rounded-3xl p-4">
        <div className="flex flex-wrap gap-2">
          {plan.days.map((day) => (
            <a
              key={day.date}
              href={`/log?date=${day.date}`}
              className={`rounded-full px-3 py-2 text-xs ${
                day.date === selectedDay.date
                  ? "bg-sky-400 text-slate-950"
                  : "border border-white/10 bg-slate-950 text-slate-300"
              }`}
            >
              {day.label}
            </a>
          ))}
        </div>
      </section>
      <section className="glass-panel rounded-3xl p-4">
        <WorkoutLogForm action={saveWorkoutLogAction}>
          <input type="hidden" name="date" value={selectedDay.date} />
          <input type="hidden" name="dayName" value={selectedDay.workoutType} />
          <input type="hidden" name="weekStartDate" value={plan.weekStartDate} />
          <input type="hidden" name="planId" value={plan.id} />
          <div>
            <h2 className="text-xl font-semibold text-slate-50">{selectedDay.workoutType}</h2>
            <p className="mt-2 text-sm text-slate-300">{selectedDay.focus}</p>
          </div>
          {detailedExercises.length > 0 ? (
            detailedExercises.map((item) => {
              if (!item) {
                return null;
              }
              const hideWeight = item.exercise.type !== "strength";
              const showDuration = item.exercise.type === "cardio" || item.exercise.type === "plyo";

              return (
                <article key={item.exercise.id} className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                  <input type="hidden" name="exerciseId" value={item.exercise.id} />
                  <input type="hidden" name="exerciseName" value={item.exercise.name} />
                  <input type="hidden" name="exerciseType" value={item.exercise.type} />
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-sky-300">{item.exercise.type}</p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-50">{item.exercise.name}</h3>
                    </div>
                    <DiagramCard svg={item.exercise.diagrams[0]} title="Inline setup diagram" />
                    <div className="grid gap-3">
                      {Array.from({ length: 4 }, (_, setIndex) => (
                        <div key={setIndex} className="grid gap-2 rounded-2xl border border-white/10 p-3">
                          <p className="text-sm font-medium text-slate-100">Set {setIndex + 1}</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <input
                              type="number"
                              name={`${item.exercise.id}-${setIndex}-reps`}
                              placeholder="Reps"
                              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none"
                            />
                            {!hideWeight ? (
                              <input
                                type="number"
                                step="0.5"
                                name={`${item.exercise.id}-${setIndex}-weight`}
                                defaultValue={item.lastWeight ?? ""}
                                placeholder="Weight"
                                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none"
                              />
                            ) : (
                              <input
                                type="number"
                                name={`${item.exercise.id}-${setIndex}-duration`}
                                placeholder={showDuration ? "Duration (sec)" : "Duration (optional)"}
                                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none"
                              />
                            )}
                          </div>
                          <input
                            type="text"
                            name={`${item.exercise.id}-${setIndex}-notes`}
                            placeholder="Quick note"
                            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
              No scheduled work for this day. Use it for recovery or regenerate the week.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="number"
              name="durationMinutes"
              placeholder="Session duration (min)"
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none"
            />
            <input
              type="text"
              name="sessionNotes"
              placeholder="Session notes"
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Save Workout Log
          </button>
        </WorkoutLogForm>
      </section>
    </div>
  );
}
