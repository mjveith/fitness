const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

require('./helpers/ts-loader.cjs');

const projectRoot = path.resolve(__dirname, '..');

class MemoryStorage {
  constructor(entries = []) {
    this.items = new Map(entries);
    this.removedKeys = [];
  }

  getItem(key) {
    return this.items.has(key) ? this.items.get(key) : null;
  }

  setItem(key, value) {
    this.items.set(key, value);
  }

  removeItem(key) {
    this.removedKeys.push(key);
    this.items.delete(key);
  }
}

const {
  failedLogsQueueKey,
  pendingLogsQueueKey,
  classifyOfflineSyncOutcome,
  readOfflineLogQueue,
} = require(path.join(projectRoot, 'lib/offline-queue.ts'));

test('readOfflineLogQueue removes corrupt JSON and returns no logs', () => {
  const storage = new MemoryStorage([[pendingLogsQueueKey, '{not valid json']]);

  const result = readOfflineLogQueue(storage);

  assert.deepEqual(result, { kind: 'corrupt', logs: [] });
  assert.equal(storage.getItem(pendingLogsQueueKey), null);
  assert.deepEqual(storage.removedKeys, [pendingLogsQueueKey]);
});

test('readOfflineLogQueue clears non-array payloads', () => {
  const storage = new MemoryStorage([[pendingLogsQueueKey, JSON.stringify({ logs: [] })]]);

  const result = readOfflineLogQueue(storage);

  assert.deepEqual(result, { kind: 'empty', logs: [] });
  assert.equal(storage.getItem(pendingLogsQueueKey), null);
});

test('readOfflineLogQueue returns queued logs when JSON is a non-empty array', () => {
  const logs = [{ date: '2026-07-09' }];
  const storage = new MemoryStorage([[pendingLogsQueueKey, JSON.stringify(logs)]]);

  const result = readOfflineLogQueue(storage);

  assert.deepEqual(result, { kind: 'ready', logs });
  assert.equal(storage.getItem(pendingLogsQueueKey), JSON.stringify(logs));
});

test('classifyOfflineSyncOutcome maps 2xx statuses to clear', () => {
  assert.equal(classifyOfflineSyncOutcome({ status: 200 }), 'clear');
  assert.equal(classifyOfflineSyncOutcome({ status: 204 }), 'clear');
});

test('classifyOfflineSyncOutcome maps 4xx statuses to dead-letter', () => {
  assert.equal(classifyOfflineSyncOutcome({ status: 400 }), 'dead-letter');
  assert.equal(classifyOfflineSyncOutcome({ status: 422 }), 'dead-letter');
});

test('classifyOfflineSyncOutcome maps 5xx statuses to retry', () => {
  assert.equal(classifyOfflineSyncOutcome({ status: 500 }), 'retry');
  assert.equal(classifyOfflineSyncOutcome({ status: 503 }), 'retry');
});

test('classifyOfflineSyncOutcome maps network errors to retry', () => {
  assert.equal(classifyOfflineSyncOutcome({ networkError: true }), 'retry');
});

test('moveToDeadLetter appends queued logs and clears the live queue', () => {
  const queued = [{ date: '2026-07-09' }];
  const previousFailed = [{ date: '2026-07-08' }];
  const storage = new MemoryStorage([
    [pendingLogsQueueKey, JSON.stringify(queued)],
    [failedLogsQueueKey, JSON.stringify(previousFailed)],
  ]);
  const { moveOfflineLogsToDeadLetter } = require(path.join(projectRoot, 'lib/offline-queue.ts'));

  moveOfflineLogsToDeadLetter(storage, queued);

  assert.equal(storage.getItem(pendingLogsQueueKey), null);
  assert.deepEqual(JSON.parse(storage.getItem(failedLogsQueueKey)), [...previousFailed, ...queued]);
});
