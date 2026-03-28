"use client";

import { useState } from "react";

const queueKey = "fp-pending-logs-v1";

type WorkoutLogFormProps = {
  action: (formData: FormData) => void;
  children: React.ReactNode;
};

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

export function WorkoutLogForm({ action, children }: WorkoutLogFormProps) {
  const [status, setStatus] = useState<string | null>(null);

  return (
    <form
      action={action}
      className="grid gap-5"
      onSubmit={(event) => {
        if (navigator.onLine) {
          return;
        }

        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        appendToQueue(serializeFormData(formData));
        form.reset();
        setStatus("Offline: workout queued and will sync when the device reconnects.");
      }}
    >
      {status ? (
        <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {status}
        </p>
      ) : null}
      {children}
    </form>
  );
}
