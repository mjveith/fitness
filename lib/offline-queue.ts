export const pendingLogsQueueKey = "fp-pending-logs-v1";
export const failedLogsQueueKey = "fp-failed-logs-v1";

export type OfflineSyncOutcome = "clear" | "dead-letter" | "retry";

export type OfflineSyncResult =
  | { status: number }
  | { networkError: true };

export type OfflineLogQueueReadResult =
  | { kind: "missing"; logs: [] }
  | { kind: "empty"; logs: [] }
  | { kind: "corrupt"; logs: [] }
  | { kind: "ready"; logs: unknown[] };

export type OfflineQueueStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export function classifyOfflineSyncOutcome(result: OfflineSyncResult): OfflineSyncOutcome {
  if ("networkError" in result) {
    return "retry";
  }

  if (result.status >= 200 && result.status < 300) {
    return "clear";
  }

  if (result.status >= 400 && result.status < 500) {
    return "dead-letter";
  }

  return "retry";
}

export function readOfflineLogQueue(
  storage: OfflineQueueStorage,
  queueKey = pendingLogsQueueKey,
): OfflineLogQueueReadResult {
  const raw = storage.getItem(queueKey);

  if (!raw) {
    return { kind: "missing", logs: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    storage.removeItem(queueKey);
    return { kind: "corrupt", logs: [] };
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    storage.removeItem(queueKey);
    return { kind: "empty", logs: [] };
  }

  return { kind: "ready", logs: parsed };
}

export function clearOfflineLogQueue(
  storage: OfflineQueueStorage,
  queueKey = pendingLogsQueueKey,
) {
  storage.removeItem(queueKey);
}

function readExistingDeadLetterLogs(storage: OfflineQueueStorage, deadLetterKey: string) {
  const raw = storage.getItem(deadLetterKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function moveOfflineLogsToDeadLetter(
  storage: OfflineQueueStorage,
  logs: unknown[],
  queueKey = pendingLogsQueueKey,
  deadLetterKey = failedLogsQueueKey,
) {
  const existingFailedLogs = readExistingDeadLetterLogs(storage, deadLetterKey);
  storage.setItem(deadLetterKey, JSON.stringify([...existingFailedLogs, ...logs]));
  clearOfflineLogQueue(storage, queueKey);
}
