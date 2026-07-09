"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { CardioLogSection } from "@/components/cardio-log-section";
import { ExerciseLogCard } from "@/components/exercise-log-card";
import { ExerciseSwapModal } from "@/components/exercise-swap-modal";
import { SessionTimer } from "@/components/session-timer";
import { Toast } from "@/components/toast";
import type { SaveWorkoutLogActionState } from "@/app/log/actions";
import { buildInitialExerciseState, useExerciseLogState, type ActiveRestTimer, type WorkoutLogFormExercise } from "@/hooks/use-exercise-log-state";
import { useOfflineLogQueue } from "@/hooks/use-offline-log-queue";
import { useSwapStatePersistence, type CardioStatus, type SavedSwapState } from "@/hooks/use-swap-state-persistence";
import type { ExerciseCategory } from "@/lib/types";

const initialState: SaveWorkoutLogActionState = {
  status: "idle",
  message: null,
  savedAt: null,
};

type WorkoutLogFormProps = {
  action: (state: SaveWorkoutLogActionState, formData: FormData) => Promise<SaveWorkoutLogActionState>;
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

type ActiveSwapTarget = {
  exerciseId: string;
  exerciseName: string;
  category: ExerciseCategory;
  exerciseIndex: number;
};

function getDefaultCardioExerciseId(cardioOptions: Array<{ id: string; name: string }>) {
  return cardioOptions.find((option) => option.id === "incline-walk")?.id ?? cardioOptions[0]?.id ?? "incline-walk";
}

function CelebrationBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-4">
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-emerald-200">Session Complete</p>
          <p className="mt-1 text-sm font-medium text-emerald-50">All exercises are marked complete. Wrap up and save the workout.</p>
        </div>
        <div className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-100">Nice work</div>
      </div>
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 14 }, (_, index) => (
          <span
            key={index}
            className="absolute confetti-piece"
            style={{
              left: `${6 + index * 6.5}%`,
              animationDelay: `${(index % 5) * 120}ms`,
              background: index % 3 === 0 ? "#38bdf8" : index % 3 === 1 ? "#22c55e" : "#facc15",
            } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Saving..." : "Save Workout Log"}</button>;
}

export function WorkoutLogForm({ action, scheduledDate, actualDate, dayName, weekStartDate, dayIndex, planId, focus, exercises, cardioOptions }: WorkoutLogFormProps) {
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
  const [activeSwapTarget, setActiveSwapTarget] = useState<ActiveSwapTarget | null>(null);
  const { appendFormDataToQueue } = useOfflineLogQueue();

  function ensureSessionStarted(value?: string) {
    if (!sessionStartedAt && value && value.trim().length > 0) setSessionStartedAt(Date.now());
  }

  const exerciseLog = useExerciseLogState({
    exercises,
    ensureSessionStarted,
    onStatusClear: () => setStatus(null),
    onRestTimerChange: setActiveRestTimer,
  });
  const { setExerciseState } = exerciseLog;

  const restoreSwapState = useCallback((saved: SavedSwapState) => {
    setExerciseState((current) => {
      const merged = { ...current };
      for (const [id, state] of Object.entries(saved.exerciseState)) if (merged[id]) merged[id] = state;
      return merged;
    });
    if (saved.sessionNotes) setSessionNotes(saved.sessionNotes);
    if (saved.cardioExerciseId) setCardioExerciseId(saved.cardioExerciseId);
    if (saved.cardioDuration) setCardioDuration(saved.cardioDuration);
    if (saved.cardioNotes) setCardioNotes(saved.cardioNotes);
    if (saved.cardioStatus) setCardioStatus(saved.cardioStatus);
    if (saved.logDate) setLogDate(saved.logDate);
    if (saved.sessionStartedAt) setSessionStartedAt(saved.sessionStartedAt);
  }, [setExerciseState]);
  const swapPersistence = useSwapStatePersistence({ onRestore: restoreSwapState });

  const cardioShouldSave = cardioStatus === "completed" || cardioStatus === "skipped";
  const cardioLabel = cardioOptions.find((option) => option.id === cardioExerciseId)?.name ?? "Incline Walk";
  const elapsedMinutes = sessionStartedAt ? Math.max(1, Math.round((sessionNow - sessionStartedAt) / 60000)) : "";

  useEffect(() => {
    if (!formState.message) return;
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
    if (!sessionStartedAt) return;
    const interval = window.setInterval(() => setSessionNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [sessionStartedAt]);

  useEffect(() => {
    if (formState.status !== "success" || !formState.savedAt) return;
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
  }, [actualDate, cardioOptions, exercises, formState.savedAt, formState.status, setExerciseState]);

  useEffect(() => setLogDate(actualDate), [actualDate, scheduledDate]);

  useEffect(() => {
    if (!exerciseLog.allExercisesComplete) {
      setShowCelebration(false);
      return;
    }
    setShowCelebration(true);
    const timeout = window.setTimeout(() => setShowCelebration(false), 3200);
    return () => window.clearTimeout(timeout);
  }, [exerciseLog.allExercisesComplete]);

  return (
    <>
      <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      <form action={formAction} className="grid gap-5" onSubmit={(event) => {
        if (navigator.onLine) return;
        event.preventDefault();
        appendFormDataToQueue(new FormData(event.currentTarget));
        exerciseLog.setExerciseState(buildInitialExerciseState(exercises));
        setSessionStartedAt(null);
        setActiveRestTimer(null);
        setSessionNotes("");
        setCardioExerciseId(getDefaultCardioExerciseId(cardioOptions));
        setCardioDuration("");
        setCardioNotes("");
        setCardioStatus("removed");
        setStatus("Offline: workout queued and will sync when the device reconnects.");
        setToastMessage("Workout queued offline.");
      }}>
        <input type="hidden" name="scheduledDate" value={scheduledDate} />
        <input type="hidden" name="actualDate" value={logDate} />
        <input type="hidden" name="dayName" value={dayName} />
        <input type="hidden" name="weekStartDate" value={weekStartDate} />
        <input type="hidden" name="planId" value={planId} />
        <input type="hidden" name="durationMinutes" value={String(elapsedMinutes)} />
        {cardioShouldSave ? <><input type="hidden" name="exerciseId" value={cardioExerciseId} /><input type="hidden" name="exerciseName" value={cardioLabel} /><input type="hidden" name="exerciseType" value="cardio" /><input type="hidden" name={`${cardioExerciseId}-setCount`} value={cardioStatus === "completed" ? "1" : "0"} /><input type="hidden" name={`${cardioExerciseId}-status`} value={cardioStatus} /><input type="hidden" name={`${cardioExerciseId}-completed`} value={cardioStatus === "completed" ? "true" : "false"} /><input type="hidden" name={`${cardioExerciseId}-0-duration`} value={cardioStatus === "completed" ? cardioDuration : ""} /><input type="hidden" name={`${cardioExerciseId}-0-notes`} value={cardioNotes} /></> : null}

        <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/45 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold text-slate-50">{dayName}</h2><p className="mt-2 text-sm text-slate-300">{focus}</p></div><SessionTimer startedAt={sessionStartedAt} /></div>
          <label className="grid gap-2 text-sm text-slate-300 sm:max-w-xs">Log this workout for<input type="date" name="actualDateInput" value={logDate} max="9999-12-31" onChange={(event) => { setLogDate(event.target.value); setStatus(null); }} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40" /></label>
          {showCelebration ? <CelebrationBanner /> : null}
          {status ? <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{status}</p> : null}
        </div>

        {exercises.length > 0 ? exercises.map((exercise, exerciseIndex) => <ExerciseLogCard key={exercise.exerciseId} exercise={exercise} exerciseIndex={exerciseIndex} state={exerciseLog.exerciseState[exercise.exerciseId]} complete={exerciseLog.completionMap[exercise.exerciseId]} recentlyReset={exerciseLog.recentlyResetExerciseId === exercise.exerciseId} activeRestTimer={activeRestTimer} onSwap={(target, index) => { setActiveSwapTarget({ exerciseId: target.exerciseId, exerciseName: target.name, category: target.category, exerciseIndex: index }); window.scrollTo({ top: 0 }); }} onReset={exerciseLog.resetExercise} onToggleComplete={exerciseLog.toggleComplete} onUpdateSet={exerciseLog.updateSet} onRemoveSet={exerciseLog.removeSet} onAddSet={exerciseLog.addSet} onRepsBlur={exerciseLog.handleRepsBlur} onDismissRestTimer={() => setActiveRestTimer(null)} />) : <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">No scheduled work for this day. Use it for recovery or regenerate the week.</p>}

        <CardioLogSection cardioOptions={cardioOptions} cardioExerciseId={cardioExerciseId} cardioDuration={cardioDuration} cardioNotes={cardioNotes} cardioStatus={cardioStatus} onCardioExerciseIdChange={setCardioExerciseId} onCardioDurationChange={setCardioDuration} onCardioNotesChange={setCardioNotes} onCardioStatusChange={setCardioStatus} ensureSessionStarted={ensureSessionStarted} onStatusClear={() => setStatus(null)} />
        <input type="text" name="sessionNotes" value={sessionNotes} onChange={(event) => { const nextValue = event.target.value; setSessionNotes(nextValue); ensureSessionStarted(nextValue); setStatus(null); }} placeholder="Session notes" className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition focus:border-sky-300/40" />
        <SubmitButton />
      </form>
      <ExerciseSwapModal open={activeSwapTarget !== null} onClose={() => setActiveSwapTarget(null)} currentExerciseId={activeSwapTarget?.exerciseId ?? ""} currentExerciseName={activeSwapTarget?.exerciseName ?? ""} initialCategory={activeSwapTarget?.category ?? "chest"} weekStartDate={weekStartDate} dayIndex={dayIndex} exerciseIndex={activeSwapTarget?.exerciseIndex ?? 0} onBeforeSwap={() => swapPersistence.saveSwapState({ exerciseState: exerciseLog.exerciseState, sessionNotes, cardioExerciseId, cardioDuration, cardioNotes, cardioStatus, logDate, sessionStartedAt })} />
    </>
  );
}
