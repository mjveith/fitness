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
      <ExerciseDiagramToggle diagrams={exercise.diagrams} imageUrls={exercise.imageUrls} />
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
          <ul className="mt-3 grid gap-3">
            {history.map((entry) => (
              <li key={entry.date} className="rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-100">{entry.date}</span>
                  <span className="text-xs text-slate-400">Vol {entry.totalVolume.toFixed(0)}</span>
                </div>
                {entry.sets.length > 0 && (
                  <ul className="mt-2 grid gap-1">
                    {entry.sets.map((set, setIdx) => (
                      <li key={setIdx} className="flex items-center gap-2 text-xs text-slate-300">
                        <span className="w-10 shrink-0 text-slate-500">Set {setIdx + 1}</span>
                        {typeof set.reps === "number" && typeof set.weight === "number" ? (
                          <span>{set.reps} × {set.weight} lbs</span>
                        ) : typeof set.reps === "number" ? (
                          <span>{set.reps} reps</span>
                        ) : typeof set.duration === "number" ? (
                          <span>{exercise.type === "cardio" ? `${set.duration}m` : `${set.duration}s`}</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                        {set.notes && <span className="text-slate-500 italic">({set.notes})</span>}
                      </li>
                    ))}
                  </ul>
                )}
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
