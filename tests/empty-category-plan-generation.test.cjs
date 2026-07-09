const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

require('./helpers/ts-loader.cjs');

const projectRoot = path.resolve(__dirname, '..');

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
