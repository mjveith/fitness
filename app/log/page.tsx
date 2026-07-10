export const dynamic = "force-dynamic";
import Link from "next/link";
import { cookies } from "next/headers";
import { SectionHeader } from "@/components/section-header";
import { WorkoutLogForm } from "@/components/workout-log-form";
import { getExerciseById, getLastExerciseEntry, listExercises } from "@/lib/db";
import { formatDate } from "@/lib/date";
import { getWorkoutPlanForDate } from "@/lib/plans";
import { saveWorkoutLogAction } from "@/app/log/actions";
import { Exercise, LoggedSet } from "@/lib/types";

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
  lastEntrySets: LoggedSet[] | null;
};

export default function LogPage({
  searchParams,
}: {
  searchParams: { date?: string; actualDate?: string; weekStartDate?: string };
}) {
  const selectedDate = searchParams.date ?? formatDate(new Date());
  const activeWeekStartDate = searchParams.weekStartDate ?? cookies().get("fitness-active-week-start")?.value ?? null;
  const plan = getWorkoutPlanForDate(selectedDate, activeWeekStartDate);
  const actualDate = searchParams.actualDate ?? selectedDate;
  const selectedDay = plan.days.find((day) => day.date === selectedDate) ?? plan.days[0];
  const detailedExercises = selectedDay.exercises
    .map((item) => {
      const exercise = getExerciseById(item.exerciseId);
      return exercise
        ? {
            planExercise: item,
            exercise,
            lastEntrySets: getLastExerciseEntry(exercise.id)?.sets ?? null,
          }
        : null;
    })
    .filter((item): item is DetailedExercise => item !== null);
  const cardioOptions = listExercises({ category: "cardio" }).map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
  }));

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Session Capture"
        title="Log"
        description="Quick-log the generated workout while keeping prior workout data read-only under Last time."
      />
      <section className="glass-panel flex items-center justify-between gap-3 rounded-3xl p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Current workout</p>
          <p className="mt-1 text-lg font-semibold text-white">{selectedDay.workoutType}</p>
          <p className="mt-1 text-sm text-slate-400">{selectedDay.focus}</p>
        </div>
        <Link href="/workout" className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-200">
          Generate new
        </Link>
      </section>
      <section className="glass-panel rounded-3xl p-4">
        <WorkoutLogForm
          action={saveWorkoutLogAction}
          scheduledDate={selectedDay.date}
          actualDate={actualDate}
          dayName={selectedDay.workoutType}
          weekStartDate={plan.weekStartDate}
          dayIndex={selectedDay.dayOfWeek}
          planId={plan.id}
          focus={selectedDay.focus}
          exercises={detailedExercises.map((item) => ({
            exerciseId: item.exercise.id,
            name: item.exercise.name,
            category: item.exercise.category,
            type: item.exercise.type,
            diagrams: item.exercise.diagrams,
            imageUrls: item.exercise.imageUrls,
            equipment: item.exercise.equipment,
            lastEntrySets: item.lastEntrySets,
            plannedSets: item.planExercise.sets,
            plannedReps: item.planExercise.reps,
            restSeconds: item.planExercise.restSeconds,
          }))}
          cardioOptions={cardioOptions}
        />
      </section>
    </div>
  );
}
