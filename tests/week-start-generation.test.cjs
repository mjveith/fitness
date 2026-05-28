const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Module = require('module');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');
process.env.FITNESS_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'fitness-week-start-'));

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

const { formatDate, getWeekStart } = require(path.join(projectRoot, 'lib/date.ts'));
const { createWorkoutPlan, getOrCreateCurrentPlan, getWorkoutPlanForDate } = require(path.join(projectRoot, 'lib/plans.ts'));
const { getWorkoutPlanByWeek } = require(path.join(projectRoot, 'lib/db.ts'));

function createPlan(weekStartDate) {
  return createWorkoutPlan(
    { split: 'ppl', workoutDays: 5, exercisesPerWorkout: 5 },
    weekStartDate
  );
}

test('week start helper preserves existing Monday default', () => {
  assert.equal(formatDate(getWeekStart(new Date('2026-05-12T12:00:00'), 1)), '2026-05-11');
});

test('week start helper supports Sunday-start weeks', () => {
  assert.equal(formatDate(getWeekStart(new Date('2026-05-12T12:00:00'), 0)), '2026-05-10');
});

test('generated Monday-start week dates and labels align to Monday', () => {
  const plan = createPlan('2026-05-11');

  assert.equal(plan.weekStartDate, '2026-05-11');
  assert.deepEqual(
    plan.days.slice(0, 3).map((day) => `${day.label}:${day.date}`),
    ['Mon:2026-05-11', 'Tue:2026-05-12', 'Wed:2026-05-13']
  );
});

test('generated Sunday-start week dates and labels align to Sunday', () => {
  const plan = createPlan('2026-05-10');

  assert.equal(plan.weekStartDate, '2026-05-10');
  assert.deepEqual(
    plan.days.slice(0, 3).map((day) => `${day.label}:${day.date}`),
    ['Sun:2026-05-10', 'Mon:2026-05-11', 'Tue:2026-05-12']
  );
});

test('Wednesday-start generated plan persists and log resolution starts the selected Push day', () => {
  const mondayFallbackPlan = getOrCreateCurrentPlan();
  const generatedPlan = createPlan('2026-05-27');

  assert.equal(generatedPlan.weekStartDate, '2026-05-27');
  assert.equal(generatedPlan.days[0].date, '2026-05-27');
  assert.equal(generatedPlan.days[0].label, 'Wed');
  assert.equal(generatedPlan.days[0].workoutType, 'Push Strength');
  assert.notEqual(generatedPlan.days[0].workoutType, 'Core Strength');

  const persistedPlan = getWorkoutPlanByWeek('2026-05-27');
  assert.ok(persistedPlan, 'generated Wednesday-start plan should persist');
  assert.equal(persistedPlan.days[0].workoutType, 'Push Strength');

  const resolvedFromStartLink = getWorkoutPlanForDate('2026-05-27', '2026-05-27');
  const selectedDay = resolvedFromStartLink.days.find((day) => day.date === '2026-05-27');

  assert.equal(resolvedFromStartLink.id, generatedPlan.id);
  assert.equal(selectedDay?.workoutType, 'Push Strength');
  assert.deepEqual(
    selectedDay?.exercises.map((exercise) => exercise.exerciseId),
    generatedPlan.days[0].exercises.map((exercise) => exercise.exerciseId)
  );
  assert.notEqual(resolvedFromStartLink.id, mondayFallbackPlan.id);
});
