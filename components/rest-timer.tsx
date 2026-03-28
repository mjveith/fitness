"use client";

import { useEffect, useRef, useState } from "react";

type RestTimerProps = {
  exerciseName: string;
  durationSeconds: number;
  startedAt: number;
  onDismiss: () => void;
};

function formatSeconds(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function RestTimer({ exerciseName, durationSeconds, startedAt, onDismiss }: RestTimerProps) {
  const [now, setNow] = useState(() => Date.now());
  const hasAlertedRef = useRef(false);
  const remainingSeconds = Math.max(0, durationSeconds - Math.floor((now - startedAt) / 1000));
  const isComplete = remainingSeconds === 0;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isComplete || hasAlertedRef.current) {
      return;
    }

    hasAlertedRef.current = true;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([180, 80, 180]);
    }
  }, [isComplete]);

  return (
    <div
      className={`rounded-2xl border px-4 py-3 transition ${
        isComplete
          ? "border-emerald-400/40 bg-emerald-400/10"
          : "border-sky-300/25 bg-sky-400/10 animate-pulse"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-sky-200">Rest Timer</p>
          <p className="mt-1 text-sm font-medium text-slate-50">{exerciseName}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-semibold ${isComplete ? "text-emerald-100" : "text-sky-100"}`}>
            {isComplete ? "Go" : formatSeconds(remainingSeconds)}
          </p>
          <p className="mt-1 text-xs text-slate-300">{isComplete ? "Rest complete" : "Recover between sets"}</p>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200"
        >
          {isComplete ? "Dismiss" : "Skip Rest"}
        </button>
      </div>
    </div>
  );
}
