"use client";

import { useEffect, useRef, useState } from "react";
import { Toast } from "@/components/toast";
import {
  classifyOfflineSyncOutcome,
  clearOfflineLogQueue,
  moveOfflineLogsToDeadLetter,
  readOfflineLogQueue,
} from "@/lib/offline-queue";

const deadLetterToastMessage = "A queued workout could not sync. Please log it again.";

let flushInFlight = false;

async function flushQueue(onDeadLetter: () => void) {
  if (flushInFlight) {
    return;
  }

  flushInFlight = true;

  try {
    const queue = readOfflineLogQueue(window.localStorage);

    if (queue.kind !== "ready") {
      return;
    }

    const outcome = await fetch("/api/logs/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ logs: queue.logs }),
    })
      .then((response) => classifyOfflineSyncOutcome({ status: response.status }))
      .catch(() => classifyOfflineSyncOutcome({ networkError: true }));

    if (outcome === "clear") {
      clearOfflineLogQueue(window.localStorage);
      return;
    }

    if (outcome === "dead-letter") {
      moveOfflineLogsToDeadLetter(window.localStorage, queue.logs);
      onDeadLetter();
    }
  } finally {
    flushInFlight = false;
  }
}

export function OfflineLogSync() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const hasShownDeadLetterToast = useRef(false);

  useEffect(() => {
    const handleDeadLetter = () => {
      if (hasShownDeadLetterToast.current) {
        return;
      }

      hasShownDeadLetterToast.current = true;
      setToastMessage(deadLetterToastMessage);
    };

    void flushQueue(handleDeadLetter);

    const handleOnline = () => {
      void flushQueue(handleDeadLetter);
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return <Toast message={toastMessage} onDone={() => setToastMessage(null)} />;
}
