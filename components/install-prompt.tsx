"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
};

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function handlePrompt(incoming: Event) {
      incoming.preventDefault();
      setEvent(incoming as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  if (!event || dismissed) {
    return null;
  }

  return (
    <div className="glass-panel mb-6 rounded-3xl p-4">
      <p className="text-sm font-medium text-slate-100">Install Fitness for offline gym access.</p>
      <p className="mt-2 text-sm text-slate-300">
        Add it to your home screen to keep one-workout generation, history, and the exercise library close at hand.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          className="rounded-2xl bg-sky-400 px-4 py-2 text-sm font-medium text-slate-950"
          onClick={() => void event.prompt()}
        >
          Install
        </button>
        <button
          type="button"
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-300"
          onClick={() => setDismissed(true)}
        >
          Later
        </button>
      </div>
    </div>
  );
}
