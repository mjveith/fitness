import { useEffect, useRef } from "react";
import type { ExerciseState } from "@/hooks/use-exercise-log-state";

const swapStateKey = "fp-swap-state-v1";

export type CardioStatus = "completed" | "skipped" | "removed";

export type SavedSwapState = {
  exerciseState: Record<string, ExerciseState>;
  sessionNotes: string;
  cardioExerciseId: string;
  cardioDuration: string;
  cardioNotes: string;
  cardioStatus: CardioStatus;
  logDate: string;
  sessionStartedAt: number | null;
};

export function saveSwapState(state: SavedSwapState) {
  try {
    window.sessionStorage.setItem(swapStateKey, JSON.stringify(state));
  } catch { /* quota errors, etc */ }
}

export function loadAndClearSwapState(): SavedSwapState | null {
  try {
    const raw = window.sessionStorage.getItem(swapStateKey);
    window.sessionStorage.removeItem(swapStateKey);
    return raw ? (JSON.parse(raw) as SavedSwapState) : null;
  } catch {
    return null;
  }
}

type UseSwapStatePersistenceParams = {
  onRestore: (saved: SavedSwapState) => void;
};

export function useSwapStatePersistence({ onRestore }: UseSwapStatePersistenceParams) {
  const restoredRef = useRef(false);

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const saved = loadAndClearSwapState();
    if (!saved) return;
    onRestore(saved);
  }, [onRestore]);

  return { saveSwapState };
}
