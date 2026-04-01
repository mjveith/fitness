"use client";

import { useEffect, useMemo, useState } from "react";
import { swapExerciseAction } from "@/app/schedule/actions";
import type { Exercise, ExerciseCategory } from "@/lib/types";

const categoryOrder: Array<ExerciseCategory | "all"> = [
  "all",
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "core",
  "cardio",
  "plyo",
];

type ExerciseSwapModalProps = {
  open: boolean;
  onClose: () => void;
  currentExerciseId: string;
  currentExerciseName: string;
  initialCategory: ExerciseCategory;
  weekStartDate: string;
  dayIndex: number;
  exerciseIndex: number;
};

export function ExerciseSwapModal({
  open,
  onClose,
  currentExerciseId,
  currentExerciseName,
  initialCategory,
  weekStartDate,
  dayIndex,
  exerciseIndex,
}: ExerciseSwapModalProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeCategory, setActiveCategory] = useState<ExerciseCategory | "all">(initialCategory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveCategory(initialCategory);
  }, [initialCategory, open]);

  useEffect(() => {
    if (!open || exercises.length > 0) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/exercises")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load exercises.");
        }

        return (await response.json()) as { exercises: Exercise[] };
      })
      .then((data) => {
        if (!cancelled) {
          setExercises(data.exercises);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Unable to load exercises right now.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [exercises.length, open]);

  const filteredExercises = useMemo(
    () =>
      exercises.filter((exercise) => {
        if (exercise.id === currentExerciseId) {
          return false;
        }

        return activeCategory === "all" ? true : exercise.category === activeCategory;
      }),
    [activeCategory, currentExerciseId, exercises],
  );

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm">
      <div className="flex h-full flex-col bg-slate-950/95">
        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-sky-300">Current: {currentExerciseName}</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-50">Swap Exercise</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:text-slate-100"
            >
              Close
            </button>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {categoryOrder.map((category) => {
              const active = category === activeCategory;
              const label = category === "all" ? "All" : category.replace("-", " ");

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold capitalize transition ${
                    active
                      ? "border-sky-300 bg-sky-300 text-slate-950"
                      : "border-white/10 bg-slate-950/70 text-slate-300"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? <p className="text-sm text-slate-400">Loading exercise catalog...</p> : null}
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          {!loading && !error ? (
            <div className="grid gap-3 pb-8">
              {filteredExercises.map((exercise) => (
                <article
                  key={exercise.id}
                  className="glass-panel rounded-3xl border border-white/10 bg-slate-950/70 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-50">{exercise.name}</h3>
                        <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">
                          {exercise.category}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">{exercise.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {exercise.equipment.map((item) => (
                          <span
                            key={`${exercise.id}-${item}`}
                            className="rounded-full border border-white/10 bg-slate-900/80 px-2 py-1 text-[11px] text-slate-300"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <form action={swapExerciseAction}>
                      <input type="hidden" name="weekStartDate" value={weekStartDate} />
                      <input type="hidden" name="dayIndex" value={dayIndex} />
                      <input type="hidden" name="exerciseIndex" value={exerciseIndex} />
                      <input type="hidden" name="newExerciseId" value={exercise.id} />
                      <button
                        type="submit"
                        className="rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950"
                      >
                        Select
                      </button>
                    </form>
                  </div>
                </article>
              ))}

              {filteredExercises.length === 0 ? (
                <p className="rounded-3xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                  No alternate exercises match this filter.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
