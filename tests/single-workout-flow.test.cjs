const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Module = require('module');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');
process.env.FITNESS_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'fitness-single-workout-'));

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    const base = path.join(projectRoot, request.slice(2));
    const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.json`, path.join(base, 'index.ts')];
    for (const candidate of candidates) if (fs.existsSync(candidate)) return candidate;
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

const { createSingleWorkout, getWorkoutHistoryGuidance, getWorkoutPlanForDate } = require(path.join(projectRoot, 'lib/plans.ts'));
const { getWorkoutPlanByWeek, saveWorkoutLog, getWorkoutLogs } = require(path.join(projectRoot, 'lib/db.ts'));

test('single workout generator accepts only type and exercise count', () => {
  const plan = createSingleWorkout({ workoutType: 'push', exerciseCount: 4 }, '2026-05-29');

  assert.equal(plan.weekStartDate, '2026-05-29');
  assert.equal(plan.workoutDays, 1);
  assert.equal(plan.exercisesPerWorkout, 4);
  assert.equal(plan.days.length, 1);
  assert.equal(plan.days[0].workoutType, 'Push');
  assert.equal(plan.days[0].exercises.length, 4);

  const persisted = getWorkoutPlanByWeek('2026-05-29');
  assert.equal(persisted.days[0].workoutType, 'Push');
  assert.deepEqual(
    persisted.days[0].exercises.map((exercise) => exercise.exerciseId),
    plan.days[0].exercises.map((exercise) => exercise.exerciseId)
  );
});

test('generated workout can be resolved for logging and saved to history', () => {
  const plan = createSingleWorkout({ workoutType: 'core', exerciseCount: 3 }, '2026-05-30');
  const resolved = getWorkoutPlanForDate('2026-05-30', '2026-05-30');

  assert.equal(resolved.id, plan.id);
  assert.equal(resolved.days[0].workoutType, 'Core');

  saveWorkoutLog({
    id: 'log-core-2026-05-30',
    date: '2026-05-30',
    dayName: resolved.days[0].workoutType,
    weekStartDate: resolved.weekStartDate,
    planId: resolved.id,
    entries: resolved.days[0].exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      type: exercise.type,
      completed: true,
      status: 'completed',
      actualSetCount: 1,
      sets: [{ reps: 10, weight: 0 }]
    })),
    totalVolume: 0,
    durationMinutes: 20,
    notes: 'test log'
  });

  const logs = getWorkoutLogs(5);
  assert.equal(logs[0].dayName, 'Core');
  assert.equal(logs[0].planId, resolved.id);
  assert.equal(logs[0].entries.length, 3);
});

test('history guidance avoids recent focuses and rotates core targets', () => {
  const logs = [
    { date: '2026-05-30', dayName: 'Core', entries: [{ exerciseId: 'front-plank', name: 'Front Plank', type: 'bodyweight', completed: true, actualSetCount: 1, sets: [] }], weekStartDate: '2026-05-30', totalVolume: 0 },
    { date: '2026-05-29', dayName: 'Push', entries: [], weekStartDate: '2026-05-29', totalVolume: 0 },
    { date: '2026-05-28', dayName: 'Pull', entries: [], weekStartDate: '2026-05-28', totalVolume: 0 },
  ];

  const guidance = getWorkoutHistoryGuidance(logs);

  assert.equal(guidance.recommendation, 'legs');
  assert.notEqual(guidance.nextCoreFocus, 'plank');
  assert.equal(guidance.recent[0].focus, 'core');
});
