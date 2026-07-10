"use client";

import { useEffect } from "react";

const queueKey = "fp-pending-logs-v1";

async function flushQueue() {
  const raw = window.localStorage.getItem(queueKey);

  if (!raw) {
    return;
  }

  const queued = JSON.parse(raw) as unknown[];

  if (!Array.isArray(queued) || queued.length === 0) {
    window.localStorage.removeItem(queueKey);
    return;
  }

  const response = await fetch("/api/logs/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ logs: queued }),
  });

  if (response.ok) {
    window.localStorage.removeItem(queueKey);
  }
}

export function OfflineLogSync() {
  useEffect(() => {
    void flushQueue();

    const handleOnline = () => {
      void flushQueue();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return null;
}
