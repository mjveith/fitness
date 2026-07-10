import { pendingLogsQueueKey } from "@/lib/offline-queue";

function serializeFormData(formData: FormData) {
  const serialized: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};

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

function appendToQueue(payload: Record<string, FormDataEntryValue | FormDataEntryValue[]>) {
  const existing = window.localStorage.getItem(pendingLogsQueueKey);
  const queue = existing ? (JSON.parse(existing) as unknown[]) : [];
  queue.push(payload);
  window.localStorage.setItem(pendingLogsQueueKey, JSON.stringify(queue));
}

export function useOfflineLogQueue() {
  function appendFormDataToQueue(formData: FormData) {
    appendToQueue(serializeFormData(formData));
  }

  return { appendFormDataToQueue };
}
