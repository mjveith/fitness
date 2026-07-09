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

const { createWorkoutPlan } = require(path.join(projectRoot, 'lib/plans.ts'));
const { exerciseCatalog } = require(path.join(projectRoot, 'lib/exercise-catalog.ts'));

const catalogWithoutShoulders = exerciseCatalog.filter((exercise) => exercise.category !== 'shoulders');

const planDeps = {
  listExercises: () => catalogWithoutShoulders,
  getPlanByWeek: () => null,
  upsertPlan: () => undefined
};

test('plan generation omits empty-category selections instead of emitting undefined exercises', () => {
  const plan = createWorkoutPlan(
    { split: 'ppl', workoutDays: 5, exercisesPerWorkout: 5 },
    '2026-07-06',
    planDeps
  );

  for (const day of plan.days) {
    assert.equal(
      day.exercises.some((exercise) => exercise == null),
      false,
      `expected no nullish exercises on ${day.workoutType}`
    );
  }

  const serialized = JSON.stringify(plan);
  const roundTripped = JSON.parse(serialized);

  for (const day of roundTripped.days) {
    assert.equal(
      day.exercises.some((exercise) => exercise == null),
      false,
      `expected no null exercise objects after JSON round-trip on ${day.workoutType}`
    );
  }
});
