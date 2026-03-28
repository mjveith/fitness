"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { DiagramCard } from "@/components/diagram-card";
import { RestTimer } from "@/components/rest-timer";
import { SessionTimer } from "@/components/session-timer";
import { Toast } from "@/components/toast";
import type { SaveWorkoutLogActionState } from "@/app/log/actions";
import type { ExerciseType } from "@/lib/types";

const queueKey = "fp-pending-logs-v1";
const initialState: SaveWorkoutLogActionState = {
  status: "idle",
  message: null,
  savedAt: null,
};

type WorkoutLogFormExercise = {
  exerciseId: string;
  name: string;
  type: ExerciseType;
  diagrams: string[];
  lastWeight: number | null;
  plannedSets: number;
  plannedReps: string;
  restSeconds: number;
};

type WorkoutLogFormProps = {
  action: (
    state: SaveWorkoutLogActionState,
    formData: FormData,
  ) => Promise<SaveWorkoutLogActionState>;
  date: string;
  dayName: string;
  weekStartDate: string;
  planId: string;
  focus: string;
  exercises: WorkoutLogFormExercise[];
};

type ExerciseSetState = {
  reps: string;
  weight: string;
  duration: string;
  notes: string;
};

type ExerciseState = {
  sets: ExerciseSetState[];
  manualComplete: boolean | null;
};

type ActiveRestTimer = {
  exerciseId: string;
  exerciseName: string;
  durationSeconds: number;
  startedAt: number;
};

function createEmptySet(defaultWeight?: number | null): ExerciseSetState {
  return {
    reps: "",
    weight: typeof defaultWeight === "number" ? String(defaultWeight) : "",
    duration: "",
    notes: "",
  };
}

function buildInitialExerciseState(exercises: WorkoutLogFormExercise[]) {
  return Object.fromEntries(
    exercises.map((exercise) => [
      exercise.exerciseId,
      {
        sets: Array.from({ length: exercise.plannedSets }, () => createEmptySet(exercise.lastWeight)),
        manualComplete: null,
      },
    ]),
  ) as Record<string, ExerciseState>;
}

function appendToQueue(payload: Record<string, unknown>) {
  const existing = window.localStorage.getItem(queueKey);
  const queue = existing ? (JSON.parse(existing) as unknown[]) : [];
  queue.push(payload);
  window.localStorage.setItem(queueKey, JSON.stringify(queue));
}

function serializeFormData(formData: FormData) {
  const serialized: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (serialized[key]) {
      const current = serialized[key];
      serialized[key] = Array.isArray(current) ? [...current, value] : [current, value];
    } else {
      serialized[key] = value;
    }
  }

  return serialized;
}

function isSetEmpty(set: ExerciseSetState) {
  return !set.reps.trim() && !set.weight.trim() && !set.duration.trim() && !set.notes.trim();
}

function hasLoggedReps(set: ExerciseSetState) {
  return set.reps.trim().length > 0;
}

function formatPlannedScheme(exercise: WorkoutLogFormExercise) {
  return `${exercise.plannedSets} sets planned · ${exercise.plannedReps} · ${exercise.restSeconds}s rest`;
}

function CelebrationBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-4">
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-200">Session Complete</p>
          <p className="mt-1 text-sm font-medium text-emerald-50">
            All exercises are marked complete. Wrap up and save the workout.
          </p>
        </div>
        <div className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-100">
          Nice work
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 14 }, (_, index) => (
          <span
            key={index}
            className="absolute confetti-piece"
            style={
              {
                left: `${6 + index * 6.5}%`,
                animationDelay: `${(index % 5) * 120}ms`,
                background:
                  index % 3 === 0 ? "#38bdf8" : index % 3 === 1 ? "#22c55e" : "#facc15",
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save Workout Log"}
    </button>
  );
}

export function WorkoutLogForm({
  action,
  date,
  dayName,
  weekStartDate,
  planId,
  focus,
  exercises,
}: WorkoutLogFormProps) {
  const [formState, formAction] = useFormState(action, initialState);
  const [status, setStatus] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [sessionNow, setSessionNow] = useState(() => Date.now());
  const [sessionNotes, setSessionNotes] = useState("");
  const [activeRestTimer, setActiveRestTimer] = useState<ActiveRestTimer | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [exerciseState, setExerciseState] = useState<Record<string, ExerciseState>>(() =>
    buildInitialExerciseState(exercises),
  );

  const completionMap = useMemo(() => {
    return Object.fromEntries(
      exercises.map((exercise) => {
        const state = exerciseState[exercise.exerciseId];
        const autoComplete =
          state.sets.length > 0 && state.sets.every((set) => hasLoggedReps(set));
        const complete = state.manualComplete ?? autoComplete;
        return [exercise.exerciseId, complete];
      }),
    );
  }, [exerciseState, exercises]);

  const allExercisesComplete =
    exercises.length > 0 && exercises.every((exercise) => completionMap[exercise.exerciseId]);

  useEffect(() => {
    if (formState.status === "success" && formState.message) {
      setToastMessage(formState.message);
    }
  }, [formState]);

  useEffect(() => {
    if (!sessionStartedAt) {
      return;
    }

    const interval = window.setInterval(() => setSessionNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [sessionStartedAt]);

  useEffect(() => {
    if (formState.status !== "success" || !formState.savedAt) {
      return;
    }

    setExerciseState(buildInitialExerciseState(exercises));
    setSessionStartedAt(null);
    setActiveRestTimer(null);
    setSessionNotes("");
    setStatus(null);
  }, [exercises, formState.savedAt, formState.status]);

  useEffect(() => {
    if (!allExercisesComplete) {
      setShowCelebration(false);
      return;
    }

    setShowCelebration(true);
    const timeout = window.setTimeout(() => setShowCelebration(false), 3200);
    return () => window.clearTimeout(timeout);
  }, [allExercisesComplete]);

  const elapsedMinutes = sessionStartedAt
    ? Math.max(1, Math.round((sessionNow - sessionStartedAt) / 60000))
    : "";

  function ensureSessionStarted(value?: string) {
    if (!sessionStartedAt && value && value.trim().length > 0) {
      setSessionStartedAt(Date.now());
    }
  }

  function updateSet(exerciseId: string, setIndex: number, key: keyof ExerciseSetState, value: string) {
    ensureSessionStarted(value);
    setStatus(null);

    setExerciseState((current) => {
      const next = { ...current };
      const exercise = next[exerciseId];
      const sets = exercise.sets.map((set, index) => (index === setIndex ? { ...set, [key]: value } : set));
      next[exerciseId] = { ...exercise, sets };
      return next;
    });
  }

  function addSet(exercise: WorkoutLogFormExercise) {
    ensureSessionStarted("1");
    setStatus(null);
    setExerciseState((current) => ({
      ...current,
      [exercise.exerciseId]: {
        ...current[exercise.exerciseId],
        sets: [...current[exercise.exerciseId].sets, createEmptySet(exercise.lastWeight)],
      },
    }));
  }

  function removeSet(exerciseId: string, setIndex: number) {
    setStatus(null);
    setExerciseState((current) => {
      const exercise = current[exerciseId];
      if (exercise.sets.length === 1 || !isSetEmpty(exercise.sets[setIndex])) {
        return current;
      }

      return {
        ...current,
        [exerciseId]: {
          ...exercise,
          sets: exercise.sets.filter((_, index) => index !== setIndex),
        },
      };
    });
  }

  function toggleComplete(exerciseId: string) {
    ensureSessionStarted("1");
    setStatus(null);
    setExerciseState((current) => {
      const exercise = current[exerciseId];
      const autoComplete = exercise.sets.length > 0 && exercise.sets.every((set) => hasLoggedReps(set));
      const currentComplete = exercise.manualComplete ?? autoComplete;

      return {
        ...current,
        [exerciseId]: {
          ...exercise,
          manualComplete: !currentComplete,
        },
      };
    });
  }

  function handleRepsBlur(exercise: WorkoutLogFormExercise, value: string) {
    if (!value.trim() || exercise.restSeconds <= 0) {
      return;
    }

    setActiveRestTimer({
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.name,
      durationSeconds: exercise.restSeconds,
      startedAt: Date.now(),
    });
  }

  return (
    <>
      <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      <form
        action={formAction}
        className="grid gap-5"
        onSubmit={(event) => {
          if (navigator.onLine) {
            return;
          }

          event.preventDefault();
          const form = event.currentTarget;
          const formData = new FormData(form);
          appendToQueue(serializeFormData(formData));
          setExerciseState(buildInitialExerciseState(exercises));
          setSessionStartedAt(null);
          setActiveRestTimer(null);
          setSessionNotes("");
          setStatus("Offline: workout queued and will sync when the device reconnects.");
          setToastMessage("Workout queued offline.");
        }}
      >
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="dayName" value={dayName} />
        <input type="hidden" name="weekStartDate" value={weekStartDate} />
        <input type="hidden" name="planId" value={planId} />
        <input type="hidden" name="durationMinutes" value={String(elapsedMinutes)} />

        <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/45 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-50">{dayName}</h2>
              <p className="mt-2 text-sm text-slate-300">{focus}</p>
            </div>
            <SessionTimer startedAt={sessionStartedAt} />
          </div>
          {showCelebration ? <CelebrationBanner /> : null}
          {status ? (
            <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {status}
            </p>
          ) : null}
        </div>

        {exercises.length > 0 ? (
          exercises.map((exercise) => {
            const state = exerciseState[exercise.exerciseId];
            const complete = completionMap[exercise.exerciseId];
            const hideWeight = exercise.type !== "strength";
            const showDuration = exercise.type === "cardio" || exercise.type === "plyo";

            return (
              <article
                key={exercise.exerciseId}
                className={`rounded-3xl border bg-slate-950/60 p-4 transition ${
                  complete
                    ? "border-emerald-400/45 opacity-85 shadow-[0_0_0_1px_rgba(74,222,128,0.15)]"
                    : "border-white/10"
                }`}
              >
                <input type="hidden" name="exerciseId" value={exercise.exerciseId} />
                <input type="hidden" name="exerciseName" value={exercise.name} />
                <input type="hidden" name="exerciseType" value={exercise.type} />
                <input type="hidden" name={`${exercise.exerciseId}-setCount`} value={state.sets.length} />
                <input
                  type="hidden"
                  name={`${exercise.exerciseId}-completed`}
                  value={complete ? "true" : "false"}
                />
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-sky-300">{exercise.type}</p>
                      <h3 className="mt-2 text-lg font-semibold text-slate-50">{exercise.name}</h3>
                      <p className="mt-2 text-sm text-slate-400">{formatPlannedScheme(exercise)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleComplete(exercise.exerciseId)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                        complete
                          ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100"
                          : "border-white/10 bg-white/5 text-slate-300"
                      }`}
                    >
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                          complete
                            ? "border-emerald-300/50 bg-emerald-300/20 text-emerald-50"
                            : "border-white/15 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      {complete ? "Completed" : "Mark complete"}
                    </button>
                  </div>

                  <DiagramCard svg={exercise.diagrams[0]} title="Inline setup diagram" />

                  <div className="grid gap-3">
                    {state.sets.map((set, setIndex) => {
                      const canRemove = state.sets.length > 1 && isSetEmpty(set);
                      return (
                        <div key={setIndex} className="grid gap-3 rounded-2xl border border-white/10 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-slate-100">Set {setIndex + 1}</p>
                            <button
                              type="button"
                              onClick={() => removeSet(exercise.exerciseId, setIndex)}
                              disabled={!canRemove}
                              className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <input
                              type="number"
                              inputMode="numeric"
                              name={`${exercise.exerciseId}-${setIndex}-reps`}
                              value={set.reps}
                              onChange={(event) =>
                                updateSet(exercise.exerciseId, setIndex, "reps", event.target.value)
                              }
                              onBlur={(event) => handleRepsBlur(exercise, event.target.value)}
                              placeholder="Reps"
                              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
                            />
                            {!hideWeight ? (
                              <input
                                type="number"
                                step="0.5"
                                inputMode="decimal"
                                name={`${exercise.exerciseId}-${setIndex}-weight`}
                                value={set.weight}
                                onChange={(event) =>
                                  updateSet(exercise.exerciseId, setIndex, "weight", event.target.value)
                                }
                                placeholder="Weight"
                                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
                              />
                            ) : (
                              <input
                                type="number"
                                inputMode="numeric"
                                name={`${exercise.exerciseId}-${setIndex}-duration`}
                                value={set.duration}
                                onChange={(event) =>
                                  updateSet(exercise.exerciseId, setIndex, "duration", event.target.value)
                                }
                                placeholder={showDuration ? "Duration (sec)" : "Duration (optional)"}
                                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
                              />
                            )}
                          </div>
                          <input
                            type="text"
                            name={`${exercise.exerciseId}-${setIndex}-notes`}
                            value={set.notes}
                            onChange={(event) =>
                              updateSet(exercise.exerciseId, setIndex, "notes", event.target.value)
                            }
                            placeholder="Quick note"
                            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => addSet(exercise)}
                      className="rounded-full border border-sky-300/25 bg-sky-400/10 px-4 py-2 text-xs font-semibold text-sky-100 transition hover:border-sky-300/45"
                    >
                      Add Set
                    </button>
                    <p className="text-xs text-slate-400">
                      Actual count: <span className="font-medium text-slate-200">{state.sets.length}</span>
                    </p>
                  </div>

                  {activeRestTimer?.exerciseId === exercise.exerciseId ? (
                    <RestTimer
                      exerciseName={activeRestTimer.exerciseName}
                      durationSeconds={activeRestTimer.durationSeconds}
                      startedAt={activeRestTimer.startedAt}
                      onDismiss={() => setActiveRestTimer(null)}
                    />
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
            No scheduled work for this day. Use it for recovery or regenerate the week.
          </p>
        )}

        <input
          type="text"
          name="sessionNotes"
          value={sessionNotes}
          onChange={(event) => {
            const nextValue = event.target.value;
            setSessionNotes(nextValue);
            ensureSessionStarted(nextValue);
            setStatus(null);
          }}
          placeholder="Session notes"
          className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
        />
        <SubmitButton />
      </form>
    </>
  );
}
