const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');

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

test.beforeEach(() => {
  savedLogs.length = 0;
  findExistingWorkoutLog = () => null;
});

test('logs sync route rejects malformed JSON with 400', async () => {
  const response = await POST({ json: async () => { throw new SyntaxError('bad json'); } });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(body, { error: 'invalid JSON' });
  assert.equal(savedLogs.length, 0);
});

test('logs sync route rejects invalid logs before saving any batch entries', async () => {
  const { date, ...logWithoutDate } = validLog();
  const response = await POST({ json: async () => ({ logs: [validLog(), logWithoutDate] }) });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, 'invalid payload');
  assert.equal(savedLogs.length, 0);
});

test('logs sync route reports duplicates in skippedDuplicates instead of synced', async () => {
  findExistingWorkoutLog = () => ({ id: 'existing-log' });

  const response = await POST({ json: async () => ({ logs: [validLog()] }) });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { synced: 0, skippedDuplicates: 1 });
  assert.equal(savedLogs.length, 0);
});
