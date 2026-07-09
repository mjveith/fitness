const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

require('./helpers/ts-loader.cjs');

const projectRoot = path.resolve(__dirname, '..');

const { formatDate, getWeekStart } = require(path.join(projectRoot, 'lib/date.ts'));
const { createWorkoutPlan, generateDays } = require(path.join(projectRoot, 'lib/plans.ts'));
const { exerciseCatalog } = require(path.join(projectRoot, 'lib/exercise-catalog.ts'));

const planDeps = {
  listExercises: () => exerciseCatalog,
  getPlanByWeek: () => null,
  upsertPlan: () => undefined
};

function createPlan(weekStartDate) {
  return createWorkoutPlan(
    { split: 'ppl', workoutDays: 5, exercisesPerWorkout: 5 },
    weekStartDate,
    planDeps
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

function exerciseSignature(days) {
  return days
    .map((day) => day.exercises.map((exercise) => exercise.exerciseId).join(','))
    .join('|');
}

test('generated plans are deterministic for a fixed week start date', () => {
  const config = { split: 'ppl', workoutDays: 5, exercisesPerWorkout: 5 };
  const first = generateDays(config, '2026-05-11', exerciseCatalog);
  const second = generateDays(config, '2026-05-11', exerciseCatalog);

  assert.deepEqual(second, first);
});

test('generated plans rotate exercise selections across different weeks', () => {
  const config = { split: 'ppl', workoutDays: 5, exercisesPerWorkout: 5 };
  const firstWeek = generateDays(config, '2026-05-11', exerciseCatalog);
  const nextWeek = generateDays(config, '2026-05-18', exerciseCatalog);

  assert.notEqual(exerciseSignature(nextWeek), exerciseSignature(firstWeek));
});
