import { ExerciseDiagramToggle } from "@/components/exercise-diagram-toggle";
import { RestTimer } from "@/components/rest-timer";
import { isSetEmpty, type ActiveRestTimer, type ExerciseSetState, type ExerciseState, type WorkoutLogFormExercise } from "@/hooks/use-exercise-log-state";
import type { LoggedSet } from "@/lib/types";

function formatPlannedScheme(exercise: WorkoutLogFormExercise) {
  return `${exercise.plannedSets} sets planned · ${exercise.plannedReps} · ${exercise.restSeconds}s rest`;
}

function formatLastTimeSet(set: LoggedSet, index: number) {
  const details = [
    typeof set.reps === "number" ? `${set.reps} reps` : null,
    typeof set.weight === "number" ? `${set.weight} lb` : null,
    typeof set.duration === "number" ? `${set.duration} min` : null,
    set.notes?.trim() ? set.notes.trim() : null,
  ].filter(Boolean);

  return `Set ${index + 1}: ${details.length ? details.join(" · ") : "logged"}`;
}

type ExerciseLogCardProps = {
  exercise: WorkoutLogFormExercise;
  exerciseIndex: number;
  state: ExerciseState;
  complete: boolean;
  recentlyReset: boolean;
  activeRestTimer: ActiveRestTimer | null;
  onSwap: (exercise: WorkoutLogFormExercise, exerciseIndex: number) => void;
  onReset: (exercise: WorkoutLogFormExercise) => void;
  onToggleComplete: (exerciseId: string) => void;
  onUpdateSet: (exerciseId: string, setIndex: number, key: keyof ExerciseSetState, value: string) => void;
  onRemoveSet: (exerciseId: string, setIndex: number) => void;
  onAddSet: (exercise: WorkoutLogFormExercise) => void;
  onRepsBlur: (exercise: WorkoutLogFormExercise, value: string) => void;
  onDismissRestTimer: () => void;
};

export function ExerciseLogCard({
  exercise,
  exerciseIndex,
  state,
  complete,
  recentlyReset,
  activeRestTimer,
  onSwap,
  onReset,
  onToggleComplete,
  onUpdateSet,
  onRemoveSet,
  onAddSet,
  onRepsBlur,
  onDismissRestTimer,
}: ExerciseLogCardProps) {
  const hideWeight = exercise.type !== "strength";
  const showDuration = exercise.type === "cardio" || exercise.type === "plyo";

  return (
    <article
      className={`rounded-3xl border bg-slate-950/60 p-4 transition ${
        recentlyReset ? "bg-sky-400/5 shadow-[0_0_0_1px_rgba(125,211,252,0.2)]" : ""
      } ${complete ? "border-emerald-400/45 opacity-85 shadow-[0_0_0_1px_rgba(74,222,128,0.15)]" : "border-white/10"}`}
    >
      <input type="hidden" name="exerciseId" value={exercise.exerciseId} />
      <input type="hidden" name="exerciseName" value={exercise.name} />
      <input type="hidden" name="exerciseType" value={exercise.type} />
      <input type="hidden" name={`${exercise.exerciseId}-setCount`} value={state.sets.length} />
      <input type="hidden" name={`${exercise.exerciseId}-completed`} value={complete ? "true" : "false"} />
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-sky-300">{exercise.type}</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-50">{exercise.name}</h3>
            <p className="mt-2 text-sm text-slate-400">{formatPlannedScheme(exercise)}</p>
            <p className="mt-2 text-xs text-slate-500">
              Completed exercises save to history. Fill every set or tap Mark complete to save this exercise.
            </p>
            {exercise.lastEntrySets?.length ? (
              <p className="mt-1 text-xs text-slate-500">Use Last time as a reference; today&apos;s inputs start blank.</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button type="button" onClick={() => onSwap(exercise, exerciseIndex)} className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:border-sky-300/40">Swap</button>
            <button type="button" onClick={() => onReset(exercise)} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-300/35 hover:text-slate-100">Reset</button>
            <button
              type="button"
              onClick={() => onToggleComplete(exercise.exerciseId)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${complete ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300"}`}
            >
              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${complete ? "border-emerald-300/50 bg-emerald-300/20 text-emerald-50" : "border-white/15 text-transparent"}`}>✓</span>
              {complete ? "Completed · will save" : "Mark complete to save"}
            </button>
          </div>
        </div>

        <ExerciseDiagramToggle imageUrls={exercise.imageUrls} />

        {exercise.lastEntrySets?.length ? (
          <div className="rounded-2xl border border-sky-300/15 bg-sky-400/5 p-3">
            <p className="text-xs uppercase tracking-[0.22em] text-sky-200">Last time</p>
            <div className="mt-2 grid gap-1 text-xs text-slate-300">
              {exercise.lastEntrySets.map((set, index) => <p key={index}>{formatLastTimeSet(set, index)}</p>)}
            </div>
          </div>
        ) : null}

        <div className="grid gap-3">
          {state.sets.map((set, setIndex) => {
            const canRemove = state.sets.length > 1 && isSetEmpty(set);
            return (
              <div key={setIndex} className="grid gap-3 rounded-2xl border border-white/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-100">Set {setIndex + 1}</p>
                  <button type="button" onClick={() => onRemoveSet(exercise.exerciseId, setIndex)} disabled={!canRemove} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition disabled:cursor-not-allowed disabled:opacity-35">Remove</button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input type="number" inputMode="numeric" name={`${exercise.exerciseId}-${setIndex}-reps`} value={set.reps} onChange={(event) => onUpdateSet(exercise.exerciseId, setIndex, "reps", event.target.value)} onBlur={(event) => onRepsBlur(exercise, event.target.value)} placeholder="Reps" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40" />
                  {!hideWeight ? (
                    <input type="number" step="0.5" inputMode="decimal" name={`${exercise.exerciseId}-${setIndex}-weight`} value={set.weight} onChange={(event) => onUpdateSet(exercise.exerciseId, setIndex, "weight", event.target.value)} placeholder="Weight" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40" />
                  ) : (
                    <input type="number" inputMode="numeric" name={`${exercise.exerciseId}-${setIndex}-duration`} value={set.duration} onChange={(event) => onUpdateSet(exercise.exerciseId, setIndex, "duration", event.target.value)} placeholder={exercise.type === "cardio" ? "Duration (min)" : showDuration ? "Duration (sec)" : "Duration (optional)"} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40" />
                  )}
                </div>
                <input type="text" name={`${exercise.exerciseId}-${setIndex}-notes`} value={set.notes} onChange={(event) => onUpdateSet(exercise.exerciseId, setIndex, "notes", event.target.value)} placeholder="Quick note" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40" />
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => onAddSet(exercise)} className="rounded-full border border-sky-300/25 bg-sky-400/10 px-4 py-2 text-xs font-semibold text-sky-100 transition hover:border-sky-300/45">Add Set</button>
          <p className="text-xs text-slate-400">Actual count: <span className="font-medium text-slate-200">{state.sets.length}</span></p>
        </div>

        {activeRestTimer?.exerciseId === exercise.exerciseId ? (
          <RestTimer exerciseName={activeRestTimer.exerciseName} durationSeconds={activeRestTimer.durationSeconds} startedAt={activeRestTimer.startedAt} onDismiss={onDismissRestTimer} />
        ) : null}
      </div>
    </article>
  );
}
