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
        <WorkoutLogForm
          action={saveWorkoutLogAction}
          date={selectedDay.date}
          dayName={selectedDay.workoutType}
          weekStartDate={plan.weekStartDate}
          planId={plan.id}
          focus={selectedDay.focus}
          exercises={detailedExercises.map((item) => ({
            exerciseId: item.exercise.id,
            name: item.exercise.name,
            type: item.exercise.type,
            diagrams: item.exercise.diagrams,
            lastWeight: item.lastWeight,
            plannedSets: item.planExercise.sets,
            plannedReps: item.planExercise.reps,
            restSeconds: item.planExercise.restSeconds,
          }))}
        />
      </section>
    </div>
  );
}
