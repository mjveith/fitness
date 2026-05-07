const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const Module = require('module');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');
const testDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fitness-core-balance-'));
process.env.FITNESS_DATA_DIR = testDataDir;

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

const { createWorkoutPlan } = require(path.join(projectRoot, 'lib/plans.ts'));

const OBLIQUE_NAMES = new Set([
  'Side Plank',
  'Side Plank Reach-Through',
  'Copenhagen Side Plank',
  'Bicycle Crunch',
  'Heel Tap Crunch'
]);

function coreExercises(plan) {
  return plan.days.flatMap((day) => day.exercises).filter((exercise) => exercise.category === 'core');
}

let planCounter = 0;

function planFor(split, workoutDays = 5, exercisesPerWorkout = 5) {
  planCounter += 1;
  return createWorkoutPlan(
    { split, workoutDays, exercisesPerWorkout },
    `2026-06-${String(planCounter).padStart(2, '0')}`
  );
}

test('dedicated core workouts use a balanced pool instead of oblique-first defaults', () => {
  const plan = planFor('ppl', 5, 5);
  const coreDay = plan.days.find((day) => day.workoutType === 'Core Strength');

  assert.ok(coreDay, 'expected a dedicated core day');

  const coreNames = coreDay.exercises.map((exercise) => exercise.name);
  const obliqueCount = coreNames.filter((name) => OBLIQUE_NAMES.has(name)).length;

  assert.equal(coreDay.exercises.length, 5);
  assert.ok(obliqueCount > 0, `expected obliques to remain eligible, got ${coreNames.join(', ')}`);
  assert.ok(obliqueCount <= 1, `expected obliques not to dominate first core selection, got ${coreNames.join(', ')}`);
  assert.ok(coreNames.some((name) => /crunch|v-up|hollow/i.test(name)), `expected abs-focused work, got ${coreNames.join(', ')}`);
  assert.ok(coreNames.some((name) => /plank|bear crawl|dead bug|hanging knee/i.test(name)), `expected plank/stability work, got ${coreNames.join(', ')}`);
});

test('generated plans across splits are not dominated by oblique core exercises', () => {
  const plans = [
    planFor('ppl', 5, 5),
    planFor('upper-lower', 5, 5),
    planFor('full-body', 5, 5),
    planFor('full-body', 3, 5),
    planFor('upper-lower', 4, 5)
  ];

  for (const plan of plans) {
    const core = coreExercises(plan);
    const obliques = core.filter((exercise) => OBLIQUE_NAMES.has(exercise.name));

    assert.ok(core.length > 0, `expected core exercises for ${plan.id}`);
    assert.ok(
      obliques.length <= Math.ceil(core.length / 3),
      `expected obliques to be a minority in ${plan.id}; got ${obliques.length}/${core.length}: ${core.map((exercise) => exercise.name).join(', ')}`
    );
  }
});

test('Ab Wheel Rollouts participate in the balanced core pool without becoming a default', () => {
  const defaultPlan = planFor('ppl', 5, 5);
  const defaultCoreDay = defaultPlan.days.find((day) => day.workoutType === 'Core Strength');
  const defaultCoreNames = defaultCoreDay.exercises.map((exercise) => exercise.name);

  assert.equal(
    defaultCoreNames.includes('Ab Wheel Rollout'),
    false,
    `expected ab wheel not to be forced into the default 5-exercise core day, got ${defaultCoreNames.join(', ')}`
  );

  const expandedPlan = planFor('ppl', 5, 8);
  const expandedCore = coreExercises(expandedPlan).map((exercise) => exercise.name);

  assert.ok(
    expandedCore.includes('Ab Wheel Rollout'),
    `expected ab wheel to be eligible in the expanded balanced core pool, got ${expandedCore.join(', ')}`
  );
});

test('Russian Twists stay out of generated plans', () => {
  const plans = [
    planFor('ppl', 7, 8),
    planFor('upper-lower', 7, 8),
    planFor('full-body', 7, 8)
  ];

  const names = plans.flatMap((plan) => plan.days.flatMap((day) => day.exercises.map((exercise) => exercise.name)));
  assert.equal(names.some((name) => /russian twist/i.test(name)), false);
});
