"use client";

import { useEffect, useState } from "react";

type SessionTimerProps = {
  startedAt: number | null;
};

function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  }

  return [minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

export function SessionTimer({ startedAt }: SessionTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) {
      return;
    }

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  const totalSeconds = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-right">
      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Session Timer</p>
      <p className="mt-2 text-2xl font-semibold text-slate-50">{formatDuration(totalSeconds)}</p>
      <p className="mt-1 text-xs text-slate-500">{startedAt ? "Running" : "Starts on first log"}</p>
    </div>
  );
}
