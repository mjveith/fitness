"use client";

import { useEffect, useState } from "react";

type ToastProps = {
  message: string | null;
  onDone: () => void;
};

export function Toast({ message, onDone }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      return;
    }

    setVisible(true);
    const hide = window.setTimeout(() => setVisible(false), 2200);
    const cleanup = window.setTimeout(() => onDone(), 2600);

    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(cleanup);
    };
  }, [message, onDone]);

  if (!message) {
    return null;
  }

  return (
    <div
      className={`fixed inset-x-4 top-4 z-50 mx-auto max-w-sm rounded-2xl border border-emerald-300/30 bg-slate-950/95 px-4 py-3 text-sm text-emerald-100 shadow-2xl shadow-slate-950/50 transition ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      }`}
    >
      {message}
    </div>
  );
}
