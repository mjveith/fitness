const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    const base = path.join(projectRoot, request.slice(2));
    const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.json`, path.join(base, 'index.ts')];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = function compileTs(module, filename) {
    const source = fs.readFileSync(filename, 'utf8');
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        resolveJsonModule: true
      },
      fileName: filename
    });

    module._compile(output.outputText, filename);
  };
}

const { parseExerciseEntries } = require(path.join(projectRoot, 'lib/log-entry-parse.ts'));
const { offlineLogsSyncPayloadSchema, swapPayloadSchema } = require(path.join(projectRoot, 'lib/validation.ts'));

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
    'bench-press-0-notes': 'smooth',
    ...overrides
  };
}

test('parseExerciseEntries parses dynamic set fields and trims notes', () => {
  const entries = parseExerciseEntries({
    exerciseIds: ['bench-press'],
    exerciseNames: ['Bench Press'],
    exerciseTypes: ['strength'],
    getValue: (key) => validLog({ 'bench-press-0-notes': ' smooth ' })[key]
  });

  assert.deepEqual(entries, [
    {
      exerciseId: 'bench-press',
      name: 'Bench Press',
      type: 'strength',
      completed: true,
      status: 'completed',
      actualSetCount: 1,
      sets: [{ reps: 8, weight: 135, duration: undefined, notes: 'smooth' }]
    }
  ]);
});

test('sync payload schema accepts a valid offline log payload', () => {
  const result = offlineLogsSyncPayloadSchema.safeParse({ logs: [validLog()] });
  assert.equal(result.success, true);
});

test('sync payload schema rejects a log missing date', () => {
  const { date, ...logWithoutDate } = validLog();
  const result = offlineLogsSyncPayloadSchema.safeParse({ logs: [logWithoutDate] });

  assert.equal(result.success, false);
  assert.equal(result.error.issues.some((issue) => issue.path.join('.') === 'logs.0.date'), true);
});

test('swap payload schema rejects negative indexes', () => {
  const result = swapPayloadSchema.safeParse({
    weekStartDate: '2026-05-11',
    dayIndex: -1,
    exerciseIndex: 0,
    newExerciseId: 'squat'
  });

  assert.equal(result.success, false);
});
