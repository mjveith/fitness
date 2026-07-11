const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const Module = require('module');

require('./helpers/ts-loader.cjs');

const projectRoot = path.resolve(__dirname, '..');
const savedLogs = [];
let findExistingWorkoutLog = () => null;

const dbMock = {
  findExistingWorkoutLog: (query) => findExistingWorkoutLog(query),
  saveWorkoutLog: (log) => {
    savedLogs.push(log);
  }
};

const originalLoad = Module._load;
Module._load = function load(request, parent, isMain) {
  if (request === '@/lib/db') {
    return dbMock;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const { POST } = require(path.join(projectRoot, 'app/api/logs/sync/route.ts'));

function validLog(overrides = {}) {
  return {
    date: '2026-05-12',
    dayName: 'Tuesday',
    weekStartDate: '2026-05-11',
    planId: 'plan-1',
    durationMinutes: '42',
    sessionNotes: 'solid',
    exerciseId: ['bench-press'],
    exerciseName: ['Bench Press'],
    exerciseType: ['strength'],
    'bench-press-setCount': '1',
    'bench-press-completed': 'true',
    'bench-press-0-reps': '8',
    'bench-press-0-weight': '135',
    ...overrides
  };
}

function makeRequest(payload, { rawText, contentLength } = {}) {
  const text = rawText ?? JSON.stringify(payload);
  const headers = new Map();
  if (contentLength !== undefined) {
    headers.set('content-length', String(contentLength));
  }
  return {
    headers: { get: (key) => headers.get(key.toLowerCase()) ?? null },
    text: async () => text
  };
}

test.beforeEach(() => {
  savedLogs.length = 0;
  findExistingWorkoutLog = () => null;
});

test('logs sync route rejects malformed JSON with 400', async () => {
  const response = await POST(makeRequest(null, { rawText: '{not json' }));
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(body, { error: 'invalid JSON' });
  assert.equal(savedLogs.length, 0);
});

test('logs sync route rejects oversized bodies with 413', async () => {
  const declaredTooLarge = await POST(makeRequest({ logs: [] }, { contentLength: 2 * 1024 * 1024 }));
  assert.equal(declaredTooLarge.status, 413);

  const actuallyTooLarge = await POST(makeRequest(null, { rawText: 'x'.repeat(1024 * 1024 + 1) }));
  assert.equal(actuallyTooLarge.status, 413);
  assert.equal(savedLogs.length, 0);
});

test('logs sync route rejects set counts above the per-exercise cap', async () => {
  const response = await POST(makeRequest({ logs: [validLog({ 'bench-press-setCount': '1000000' })] }));
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, 'invalid payload');
  assert.equal(savedLogs.length, 0);
});

test('logs sync route rejects invalid logs before saving any batch entries', async () => {
  const { date, ...logWithoutDate } = validLog();
  const response = await POST(makeRequest({ logs: [validLog(), logWithoutDate] }));
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, 'invalid payload');
  assert.equal(savedLogs.length, 0);
});

test('logs sync route reports duplicates in skippedDuplicates instead of synced', async () => {
  findExistingWorkoutLog = () => ({ id: 'existing-log' });

  const response = await POST(makeRequest({ logs: [validLog()] }));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { synced: 0, skippedDuplicates: 1 });
  assert.equal(savedLogs.length, 0);
});
