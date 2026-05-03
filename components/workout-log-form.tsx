"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { ExerciseDiagramToggle } from "@/components/exercise-diagram-toggle";
import { ExerciseSwapModal } from "@/components/exercise-swap-modal";
import { RestTimer } from "@/components/rest-timer";
import { SessionTimer } from "@/components/session-timer";
import { Toast } from "@/components/toast";
import type { SaveWorkoutLogActionState } from "@/app/log/actions";
import { createBlankSessionSet, deriveExerciseComplete } from "@/lib/workout-completion";
import type { ExerciseCategory, ExerciseType, LoggedSet } from "@/lib/types";

const queueKey = "fp-pending-logs-v1";
const swapStateKey = "fp-swap-state-v1";
const initialState: SaveWorkoutLogActionState = {
  status: "idle",
  message: null,
  savedAt: null,
};

type WorkoutLogFormExercise = {
  exerciseId: string;
  name: string;
  category: ExerciseCategory;
  type: ExerciseType;
  diagrams: string[];
  imageUrls?: [string, string] | null;
  equipment: string[];
  lastWeight: number | null;
  lastEntrySets?: LoggedSet[] | null;
  plannedSets: number;
  plannedReps: string;
  restSeconds: number;
};

type WorkoutLogFormProps = {
  action: (
    state: SaveWorkoutLogActionState,
    formData: FormData,
  ) => Promise<SaveWorkoutLogActionState>;
  scheduledDate: string;
  actualDate: string;
  dayName: string;
  weekStartDate: string;
  dayIndex: number;
  planId: string;
  focus: string;
  exercises: WorkoutLogFormExercise[];
  cardioOptions: Array<{ id: string; name: string }>;
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

type ActiveSwapTarget = {
  exerciseId: string;
  exerciseName: string;
  category: ExerciseCategory;
  exerciseIndex: number;
};

function createEmptySet(): ExerciseSetState {
  return createBlankSessionSet();
}

function buildInitialExerciseState(exercises: WorkoutLogFormExercise[]) {
  return Object.fromEntries(
    exercises.map((exercise) => {
      const setCount = Math.max(1, exercise.plannedSets || 3);
      return [
        exercise.exerciseId,
        {
          sets: Array.from({ length: setCount }, () => createEmptySet()),
          manualComplete: null,
        },
      ];
    }),
  ) as Record<string, ExerciseState>;
}

type CardioStatus = "completed" | "skipped" | "removed";

type SavedSwapState = {
  exerciseState: Record<string, ExerciseState>;
  sessionNotes: string;
  cardioExerciseId: string;
  cardioDuration: string;
  cardioNotes: string;
  cardioStatus: CardioStatus;
  logDate: string;
  sessionStartedAt: number | null;
};

function saveSwapState(state: SavedSwapState) {
  try {
    window.sessionStorage.setItem(swapStateKey, JSON.stringify(state));
  } catch { /* quota errors, etc */ }
}

function loadAndClearSwapState(): SavedSwapState | null {
  try {
    const raw = window.sessionStorage.getItem(swapStateKey);
    window.sessionStorage.removeItem(swapStateKey);
    return raw ? (JSON.parse(raw) as SavedSwapState) : null;
  } catch {
    return null;
  }
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

function getDefaultCardioExerciseId(cardioOptions: Array<{ id: string; name: string }>) {
  return cardioOptions.find((option) => option.id === "incline-walk")?.id ?? cardioOptions[0]?.id ?? "incline-walk";
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
  scheduledDate,
  actualDate,
  dayName,
  weekStartDate,
  dayIndex,
  planId,
  focus,
  exercises,
  cardioOptions,
}: WorkoutLogFormProps) {
  const [formState, formAction] = useFormState(action, initialState);
  const [status, setStatus] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [sessionNow, setSessionNow] = useState(() => Date.now());
  const [sessionNotes, setSessionNotes] = useState("");
  const [cardioExerciseId, setCardioExerciseId] = useState(() => getDefaultCardioExerciseId(cardioOptions));
  const [cardioDuration, setCardioDuration] = useState("");
  const [cardioNotes, setCardioNotes] = useState("");
  const [cardioStatus, setCardioStatus] = useState<CardioStatus>("removed");
  const [activeRestTimer, setActiveRestTimer] = useState<ActiveRestTimer | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [logDate, setLogDate] = useState(actualDate);
  const [recentlyResetExerciseId, setRecentlyResetExerciseId] = useState<string | null>(null);
  const [activeSwapTarget, setActiveSwapTarget] = useState<ActiveSwapTarget | null>(null);
  const resetFlashTimeoutRef = useRef<number | null>(null);
  const restoredRef = useRef(false);
  const [exerciseState, setExerciseState] = useState<Record<string, ExerciseState>>(() =>
    buildInitialExerciseState(exercises),
  );

  // Restore form state after a swap reload (runs once on mount, client-only)
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const saved = loadAndClearSwapState();
    if (!saved) return;
    // Merge: keep saved state for exercises that still exist, add fresh state for new ones
    setExerciseState((current) => {
      const merged = { ...current };
      for (const [id, state] of Object.entries(saved.exerciseState)) {
        if (merged[id]) {
          merged[id] = state;
        }
      }
      return merged;
    });
    if (saved.sessionNotes) setSessionNotes(saved.sessionNotes);
    if (saved.cardioExerciseId) setCardioExerciseId(saved.cardioExerciseId);
    if (saved.cardioDuration) setCardioDuration(saved.cardioDuration);
    if (saved.cardioNotes) setCardioNotes(saved.cardioNotes);
    if (saved.cardioStatus) setCardioStatus(saved.cardioStatus);
    if (saved.logDate) setLogDate(saved.logDate);
    if (saved.sessionStartedAt) setSessionStartedAt(saved.sessionStartedAt);
  }, []);

  const completionMap = useMemo(() => {
    return Object.fromEntries(
      exercises.map((exercise) => {
        const state = exerciseState[exercise.exerciseId];
        return [
          exercise.exerciseId,
          deriveExerciseComplete({ sets: state.sets, manualComplete: state.manualComplete }),
        ];
      }),
    );
  }, [exerciseState, exercises]);

  const allExercisesComplete =
    exercises.length > 0 && exercises.every((exercise) => completionMap[exercise.exerciseId]);
  const cardioHasData = cardioDuration.trim().length > 0 || cardioNotes.trim().length > 0;
  const cardioShouldSave = cardioStatus === "completed" || cardioStatus === "skipped";
  const cardioLabel = cardioOptions.find((option) => option.id === cardioExerciseId)?.name ?? "Incline Walk";

  useEffect(() => {
    if (!formState.message) {
      return;
    }

    if (formState.status === "success") {
      setToastMessage(formState.message);
      return;
    }

    if (formState.status === "error") {
      setStatus(formState.message);
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
    setLogDate(actualDate);
    setSessionStartedAt(null);
    setActiveRestTimer(null);
    setSessionNotes("");
    setCardioExerciseId(getDefaultCardioExerciseId(cardioOptions));
    setCardioDuration("");
    setCardioNotes("");
    setCardioStatus("removed");
    setStatus(null);
  }, [actualDate, cardioOptions, exercises, formState.savedAt, formState.status]);

  useEffect(() => {
    setLogDate(actualDate);
  }, [actualDate, scheduledDate]);

  useEffect(() => {
    return () => {
      if (resetFlashTimeoutRef.current) {
        window.clearTimeout(resetFlashTimeoutRef.current);
      }
    };
  }, []);

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
      next[exerciseId] = { ...exercise, sets, manualComplete: null };
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
        sets: [...current[exercise.exerciseId].sets, createEmptySet()],
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
      const currentComplete = deriveExerciseComplete({
        sets: exercise.sets,
        manualComplete: exercise.manualComplete,
      });

      return {
        ...current,
        [exerciseId]: {
          ...exercise,
          manualComplete: !currentComplete,
        },
      };
    });
  }

  function resetExercise(exercise: WorkoutLogFormExercise) {
    setStatus(null);
    setExerciseState((current) => ({
      ...current,
      [exercise.exerciseId]: {
        sets: Array.from({ length: current[exercise.exerciseId].sets.length }, () => createEmptySet()),
        manualComplete: null,
      },
    }));
    setActiveRestTimer((current) => (current?.exerciseId === exercise.exerciseId ? null : current));
    setRecentlyResetExerciseId(exercise.exerciseId);
    if (resetFlashTimeoutRef.current) {
      window.clearTimeout(resetFlashTimeoutRef.current);
    }
    resetFlashTimeoutRef.current = window.setTimeout(() => {
      setRecentlyResetExerciseId((current) => (current === exercise.exerciseId ? null : current));
    }, 650);
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
          setCardioExerciseId(getDefaultCardioExerciseId(cardioOptions));
          setCardioDuration("");
          setCardioNotes("");
          setCardioStatus("removed");
          setStatus("Offline: workout queued and will sync when the device reconnects.");
          setToastMessage("Workout queued offline.");
        }}
      >
        <input type="hidden" name="scheduledDate" value={scheduledDate} />
        <input type="hidden" name="actualDate" value={logDate} />
        <input type="hidden" name="dayName" value={dayName} />
        <input type="hidden" name="weekStartDate" value={weekStartDate} />
        <input type="hidden" name="planId" value={planId} />
        <input type="hidden" name="durationMinutes" value={String(elapsedMinutes)} />
        {cardioShouldSave ? (
          <>
            <input type="hidden" name="exerciseId" value={cardioExerciseId} />
            <input type="hidden" name="exerciseName" value={cardioLabel} />
            <input type="hidden" name="exerciseType" value="cardio" />
            <input type="hidden" name={`${cardioExerciseId}-setCount`} value={cardioStatus === "completed" ? "1" : "0"} />
            <input type="hidden" name={`${cardioExerciseId}-status`} value={cardioStatus} />
            <input type="hidden" name={`${cardioExerciseId}-completed`} value={cardioStatus === "completed" ? "true" : "false"} />
            <input type="hidden" name={`${cardioExerciseId}-0-duration`} value={cardioStatus === "completed" ? cardioDuration : ""} />
            <input type="hidden" name={`${cardioExerciseId}-0-notes`} value={cardioNotes} />
          </>
        ) : null}

        <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/45 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-50">{dayName}</h2>
              <p className="mt-2 text-sm text-slate-300">{focus}</p>
            </div>
            <SessionTimer startedAt={sessionStartedAt} />
          </div>
          <label className="grid gap-2 text-sm text-slate-300 sm:max-w-xs">
            Log this workout for
            <input
              type="date"
              name="actualDateInput"
              value={logDate}
              max="9999-12-31"
              onChange={(event) => {
                setLogDate(event.target.value);
                setStatus(null);
              }}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
            />
          </label>
          {showCelebration ? <CelebrationBanner /> : null}
          {status ? (
            <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {status}
            </p>
          ) : null}
        </div>

        {exercises.length > 0 ? (
          exercises.map((exercise, exerciseIndex) => {
            const state = exerciseState[exercise.exerciseId];
            const complete = completionMap[exercise.exerciseId];
            const hideWeight = exercise.type !== "strength";
            const showDuration = exercise.type === "cardio" || exercise.type === "plyo";

            return (
              <article
                key={exercise.exerciseId}
                className={`rounded-3xl border bg-slate-950/60 p-4 transition ${
                  recentlyResetExerciseId === exercise.exerciseId
                    ? "bg-sky-400/5 shadow-[0_0_0_1px_rgba(125,211,252,0.2)]"
                    : ""
                } ${
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
                      <p className="mt-2 text-xs text-slate-500">
                        Completed exercises save to history. Fill every set or tap Mark complete to save this exercise.
                      </p>
                      {exercise.lastEntrySets?.length ? (
                        <p className="mt-1 text-xs text-slate-500">Use Last time as a reference; today's inputs start blank.</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSwapTarget({
                            exerciseId: exercise.exerciseId,
                            exerciseName: exercise.name,
                            category: exercise.category,
                            exerciseIndex,
                          });
                          window.scrollTo({ top: 0 });
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-100 transition hover:border-sky-300/40"
                      >
                        Swap
                      </button>
                      <button
                        type="button"
                        onClick={() => resetExercise(exercise)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-300/35 hover:text-slate-100"
                      >
                        Reset
                      </button>
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
                        {complete ? "Completed · will save" : "Mark complete to save"}
                      </button>
                    </div>
                  </div>

                  <ExerciseDiagramToggle imageUrls={exercise.imageUrls} />

                  {exercise.lastEntrySets?.length ? (
                    <div className="rounded-2xl border border-sky-300/15 bg-sky-400/5 p-3">
                      <p className="text-xs uppercase tracking-[0.22em] text-sky-200">Last time</p>
                      <div className="mt-2 grid gap-1 text-xs text-slate-300">
                        {exercise.lastEntrySets.map((set, index) => (
                          <p key={index}>{formatLastTimeSet(set, index)}</p>
                        ))}
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
                                placeholder={exercise.type === "cardio" ? "Duration (min)" : showDuration ? "Duration (sec)" : "Duration (optional)"}
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

        <section className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/45 p-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-50">Cardio Add-On</h3>
            <p className="mt-1 text-sm text-slate-400">Keep cardio, mark it skipped, or remove it from this session entirely.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setCardioStatus("completed");
                ensureSessionStarted("1");
                setStatus(null);
              }}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                cardioStatus === "completed" ? "bg-sky-300 text-slate-950" : "border border-white/10 bg-white/5 text-slate-300"
              }`}
            >
              Complete cardio
            </button>
            <button
              type="button"
              onClick={() => {
                setCardioStatus("skipped");
                ensureSessionStarted("1");
                setStatus(null);
              }}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                cardioStatus === "skipped" ? "bg-amber-300 text-slate-950" : "border border-white/10 bg-white/5 text-slate-300"
              }`}
            >
              Mark skipped
            </button>
            <button
              type="button"
              onClick={() => {
                setCardioStatus("removed");
                setCardioDuration("");
                setCardioNotes("");
                setStatus(null);
              }}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                cardioStatus === "removed" ? "bg-slate-200 text-slate-950" : "border border-white/10 bg-white/5 text-slate-300"
              }`}
            >
              Remove cardio
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-300">
              Activity
              <select
                value={cardioExerciseId}
                onChange={(event) => {
                  setCardioExerciseId(event.target.value);
                  if (cardioStatus === "removed") {
                    setCardioStatus("completed");
                  }
                  setStatus(null);
                }}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
              >
                {cardioOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Duration (min)
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={cardioDuration}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setCardioDuration(nextValue);
                  if (nextValue.trim()) {
                    setCardioStatus("completed");
                  }
                  ensureSessionStarted(nextValue);
                  setStatus(null);
                }}
                placeholder="20"
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
              />
            </label>
          </div>
          <input
            type="text"
            value={cardioNotes}
            onChange={(event) => {
              const nextValue = event.target.value;
              setCardioNotes(nextValue);
              if (nextValue.trim() && cardioStatus === "removed") {
                setCardioStatus("skipped");
              }
              ensureSessionStarted(nextValue);
              setStatus(null);
            }}
            placeholder="Notes (incline, speed, distance, intervals, etc.)"
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40"
          />
        </section>

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
      <ExerciseSwapModal
        open={activeSwapTarget !== null}
        onClose={() => setActiveSwapTarget(null)}
        currentExerciseId={activeSwapTarget?.exerciseId ?? ""}
        currentExerciseName={activeSwapTarget?.exerciseName ?? ""}
        initialCategory={activeSwapTarget?.category ?? "chest"}
        weekStartDate={weekStartDate}
        dayIndex={dayIndex}
        exerciseIndex={activeSwapTarget?.exerciseIndex ?? 0}
        onBeforeSwap={() => {
          saveSwapState({
            exerciseState,
            sessionNotes,
            cardioExerciseId,
            cardioDuration,
            cardioNotes,
            cardioStatus,
            logDate,
            sessionStartedAt,
          });
        }}
      />
    </>
  );
}
