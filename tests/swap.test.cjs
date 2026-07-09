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

const { swapPlanExercise } = require(path.join(projectRoot, 'lib/swap.ts'));

function makeExercise(overrides = {}) {
  return {
    id: 'new-exercise',
    name: 'New Exercise',
    description: 'demo',
    category: 'chest',
    muscleGroups: ['chest'],
    equipment: ['barbell'],
    type: 'strength',
    diagrams: [],
    cues: [],
    defaultSets: 4,
    defaultReps: '8-10',
    defaultRestSeconds: 120,
    ...overrides
  };
}

function makePlan(overrides = {}) {
  return {
    id: 'plan-1',
    weekStartDate: '2026-07-06',
    split: 'ppl',
    workoutDays: 2,
    exercisesPerWorkout: 2,
    days: [
      {
        dayOfWeek: 0,
        date: '2026-07-06',
        label: 'Mon',
        workoutType: 'Push',
        focus: 'Chest',
        exercises: [
          {
            exerciseId: 'old-exercise',
            name: 'Old Exercise',
            type: 'strength',
            sets: 3,
            reps: '10',
            restSeconds: 90,
            category: 'chest'
          }
        ]
      }
    ],
    ...overrides
  };
}

test('swapPlanExercise swaps a valid plan position immutably and persists the updated plan', () => {
  const originalPlan = makePlan();
  const upsertedPlans = [];

  const result = swapPlanExercise(
    {
      weekStartDate: '2026-07-06',
      dayIndex: 0,
      exerciseIndex: 0,
      newExerciseId: 'new-exercise'
    },
    {
      getExerciseById: () => makeExercise(),
      getPlanByWeek: () => originalPlan,
      upsertPlan: (plan) => upsertedPlans.push(plan)
    }
  );

  assert.deepEqual(result, { ok: true, swapped: 'New Exercise' });
  assert.equal(upsertedPlans.length, 1);
  assert.notEqual(upsertedPlans[0], originalPlan);
  assert.notEqual(upsertedPlans[0].days, originalPlan.days);
  assert.notEqual(upsertedPlans[0].days[0], originalPlan.days[0]);
  assert.notEqual(upsertedPlans[0].days[0].exercises, originalPlan.days[0].exercises);
  assert.deepEqual(upsertedPlans[0].days[0].exercises[0], {
    exerciseId: 'new-exercise',
    name: 'New Exercise',
    type: 'strength',
    sets: 4,
    reps: '8-10',
    restSeconds: 120,
    category: 'chest'
  });
  assert.equal(originalPlan.days[0].exercises[0].exerciseId, 'old-exercise');
});

test('swapPlanExercise returns exercise-not-found when the requested exercise is missing', () => {
  let didUpsert = false;

  const result = swapPlanExercise(
    {
      weekStartDate: '2026-07-06',
      dayIndex: 0,
      exerciseIndex: 0,
      newExerciseId: 'missing-exercise'
    },
    {
      getExerciseById: () => null,
      getPlanByWeek: () => makePlan(),
      upsertPlan: () => { didUpsert = true; }
    }
  );

  assert.deepEqual(result, { ok: false, reason: 'exercise-not-found' });
  assert.equal(didUpsert, false);
});

test('swapPlanExercise returns plan-position-not-found when the day index is out of bounds', () => {
  let didUpsert = false;

  const result = swapPlanExercise(
    {
      weekStartDate: '2026-07-06',
      dayIndex: 3,
      exerciseIndex: 0,
      newExerciseId: 'new-exercise'
    },
    {
      getExerciseById: () => makeExercise(),
      getPlanByWeek: () => makePlan(),
      upsertPlan: () => { didUpsert = true; }
    }
  );

  assert.deepEqual(result, { ok: false, reason: 'plan-position-not-found' });
  assert.equal(didUpsert, false);
});

test('swapPlanExercise returns plan-position-not-found when the exercise index is out of bounds', () => {
  let didUpsert = false;

  const result = swapPlanExercise(
    {
      weekStartDate: '2026-07-06',
      dayIndex: 0,
      exerciseIndex: 5,
      newExerciseId: 'new-exercise'
    },
    {
      getExerciseById: () => makeExercise(),
      getPlanByWeek: () => makePlan(),
      upsertPlan: () => { didUpsert = true; }
    }
  );

  assert.deepEqual(result, { ok: false, reason: 'plan-position-not-found' });
  assert.equal(didUpsert, false);
});
