import { notFound } from "next/navigation";
import { ExerciseDiagramToggle } from "@/components/exercise-diagram-toggle";
import { SectionHeader } from "@/components/section-header";
import { getExerciseById } from "@/lib/db";
import { getExerciseHistory } from "@/lib/db";

export default function ExerciseDetailPage({
  params,
}: {
  params: { exerciseId: string };
}) {
  const exercise = getExerciseById(params.exerciseId);

  if (!exercise) {
    notFound();
  }

  const history = getExerciseHistory(exercise.id).slice(0, 5);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={exercise.category}
        title={exercise.name}
        description={exercise.description}
      />
      <ExerciseDiagramToggle diagrams={exercise.diagrams} />
      <section className="glass-panel rounded-3xl p-4">
        <h2 className="text-lg font-semibold text-slate-50">Coaching cues</h2>
        <ul className="mt-3 grid gap-2">
          {exercise.cues.map((cue) => (
            <li key={cue} className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 text-sm text-slate-300">
              {cue}
            </li>
          ))}
        </ul>
      </section>
      <section className="glass-panel rounded-3xl p-4">
        <h2 className="text-lg font-semibold text-slate-50">Default programming</h2>
        <p className="mt-3 text-sm text-slate-300">
          {exercise.defaultSets} sets · {exercise.defaultReps} reps · {exercise.defaultRestSeconds}s rest
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {exercise.equipment.map((item) => (
            <span key={item} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
              {item}
            </span>
          ))}
        </div>
      </section>
      <section className="glass-panel rounded-3xl p-4">
        <h2 className="text-lg font-semibold text-slate-50">Recent history</h2>
        {history.length > 0 ? (
          <ul className="mt-3 grid gap-2">
            {history.map((entry) => (
              <li key={entry.date} className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3 text-sm text-slate-300">
                <span className="font-medium text-slate-100">{entry.date}</span>{" "}
                <span className="text-slate-400">Volume {entry.totalVolume.toFixed(0)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-400">No logged sessions yet for this exercise.</p>
        )}
      </section>
    </div>
  );
}
