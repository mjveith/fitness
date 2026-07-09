const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

require('./helpers/ts-loader.cjs');

const projectRoot = path.resolve(__dirname, '..');

const { createWorkoutPlan } = require(path.join(projectRoot, 'lib/plans.ts'));
const { exerciseCatalog } = require(path.join(projectRoot, 'lib/exercise-catalog.ts'));

const savedPlans = new Map();
const planDeps = {
  listExercises: () => exerciseCatalog,
  getPlanByWeek: (weekStartDate) => savedPlans.get(weekStartDate) ?? null,
  upsertPlan: (plan) => savedPlans.set(plan.weekStartDate, plan)
};

function athleticExercises(plan) {
  return plan.days.flatMap((day) => day.exercises.filter((exercise) => exercise.exerciseId.startsWith('athletic-')));
}

function daysWithAthleticWork(plan) {
  return plan.days.filter((day) => day.exercises.some((exercise) => exercise.exerciseId.startsWith('athletic-')));
}

test('athletic work can be generated alongside an existing strength split', () => {
  const plan = createWorkoutPlan({
    split: 'upper-lower',
    workoutDays: 4,
    exercisesPerWorkout: 5,
    athleticWork: {
      frequency: 2,
      intensity: 'moderate',
      modalities: ['sprints', 'agility'],
      placementMode: 'auto',
      preferredDays: []
    }
  }, '2026-05-11', planDeps);

  assert.equal(plan.split, 'upper-lower');
  assert.equal(plan.days.length, 7);
  assert.equal(daysWithAthleticWork(plan).length, 2);
  assert.equal(athleticExercises(plan).length, 4);
  assert.ok(plan.days.some((day) => /Athletic/.test(day.workoutType)));

  for (const day of daysWithAthleticWork(plan)) {
    const modalities = day.exercises.filter((exercise) => exercise.exerciseId.startsWith('athletic-')).map((exercise) => exercise.modality).sort();
    assert.deepEqual(modalities, ['agility', 'sprints']);
  }

  for (const exercise of athleticExercises(plan)) {
    assert.ok(exercise.prescription, `${exercise.name} missing prescription`);
    assert.ok(exercise.prescription.distanceOrTime);
    assert.ok(exercise.prescription.reps);
    assert.ok(exercise.prescription.sets);
    assert.ok(exercise.prescription.rest);
    assert.ok(exercise.prescription.intensity);
    assert.ok(exercise.safetyNotes);
    assert.ok(['description', 'diagram', 'image-pair'].includes(exercise.mediaKind));
  }
});

test('preferred locked placement puts athletic work on requested days without redefining split', () => {
  const plan = createWorkoutPlan({
    split: 'ppl',
    workoutDays: 5,
    exercisesPerWorkout: 5,
    athleticWork: {
      frequency: 2,
      intensity: 'high',
      modalities: ['jumps', 'agility'],
      placementMode: 'locked',
      preferredDays: [2, 5]
    }
  }, '2026-05-18', planDeps);

  assert.deepEqual(
    daysWithAthleticWork(plan).map((day) => `${day.label}:${day.date}`),
    ['Tue:2026-05-19', 'Fri:2026-05-22']
  );
  assert.deepEqual(
    daysWithAthleticWork(plan).map((day) => day.exercises.filter((exercise) => exercise.exerciseId.startsWith('athletic-')).map((exercise) => exercise.modality).sort()),
    [['agility', 'jumps'], ['agility', 'jumps']]
  );
  assert.equal(plan.split, 'ppl');
});

test('frequency one combines every selected athletic modality into one workout', () => {
  const plan = createWorkoutPlan({
    split: 'upper-lower',
    workoutDays: 4,
    exercisesPerWorkout: 5,
    athleticWork: {
      frequency: 1,
      intensity: 'moderate',
      modalities: ['sprints', 'jumps', 'agility', 'conditioning'],
      placementMode: 'auto',
      preferredDays: []
    }
  }, '2026-05-11', planDeps);

  const athleticDays = daysWithAthleticWork(plan);
  assert.equal(athleticDays.length, 1);
  assert.deepEqual(
    athleticDays[0].exercises.filter((exercise) => exercise.exerciseId.startsWith('athletic-')).map((exercise) => exercise.modality).sort(),
    ['agility', 'conditioning', 'jumps', 'sprints']
  );
});

test('athletic work settings persist with the generated week', () => {
  const saved = planDeps.getPlanByWeek('2026-05-18');

  assert.ok(saved);
  assert.equal(saved.athleticWork.frequency, 2);
  assert.deepEqual(saved.athleticWork.preferredDays, [2, 5]);
  assert.equal(daysWithAthleticWork(saved).length, 2);
  assert.equal(athleticExercises(saved).length, 4);
});
