const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

require('./helpers/ts-loader.cjs');

const projectRoot = path.resolve(__dirname, '..');
const {
  createBlankSessionSet,
  deriveExerciseComplete,
  getEntriesWithUnsavedData,
  hasCompletedSetData,
  shouldPersistWorkoutEntry
} = require(path.join(projectRoot, 'lib/workout-completion.ts'));

test('committed set data marks an exercise complete without dirty/touched state', () => {
  const complete = deriveExerciseComplete({
    manualComplete: null,
    sets: [
      { reps: '10', duration: '' },
      { reps: '10', duration: '' },
      { reps: '8', duration: '' }
    ]
  });

  assert.equal(complete, true);
});

test('completion is derived again after cleared values are re-populated', () => {
  const cleared = deriveExerciseComplete({
    manualComplete: null,
    sets: [
      { reps: '', duration: '' },
      { reps: '10', duration: '' }
    ]
  });
  const repopulated = deriveExerciseComplete({
    manualComplete: null,
    sets: [
      { reps: '10', duration: '' },
      { reps: '10', duration: '' }
    ]
  });

  assert.equal(cleared, false);
  assert.equal(repopulated, true);
});

test('an explicit complete/incomplete lifecycle override still wins until data changes reset it', () => {
  assert.equal(
    deriveExerciseComplete({
      manualComplete: false,
      sets: [{ reps: '10', duration: '' }]
    }),
    false
  );
  assert.equal(
    deriveExerciseComplete({
      manualComplete: true,
      sets: [{ reps: '', duration: '' }]
    }),
    true
  );
});

test('duration-only logged work can complete non-strength sets', () => {
  assert.equal(hasCompletedSetData({ reps: '', duration: '60' }), true);
});

test('parsed numeric set data can drive server-side completion fallback', () => {
  assert.equal(hasCompletedSetData({ reps: 10, duration: undefined }), true);
});

test('new session workout inputs start blank instead of carrying prior history into editable fields', () => {
  assert.deepEqual(createBlankSessionSet(), {
    reps: '',
    weight: '',
    duration: '',
    notes: ''
  });
});

test('history persistence follows explicit completion state', () => {
  assert.equal(shouldPersistWorkoutEntry({ name: 'Squat', completed: true, status: 'completed', sets: [] }), true);
  assert.equal(shouldPersistWorkoutEntry({ name: 'Cardio', completed: false, status: 'skipped', sets: [] }), true);
  assert.equal(shouldPersistWorkoutEntry({ name: 'Bench', completed: false, status: 'completed', sets: [{ reps: 8 }] }), false);
});

test('logged data that would be skipped is surfaced instead of silently dropped', () => {
  const entries = [
    { name: 'Bench', completed: false, status: 'completed', sets: [{ reps: 8 }] },
    { name: 'Squat', completed: true, status: 'completed', sets: [{ reps: 10 }] }
  ];

  assert.deepEqual(getEntriesWithUnsavedData(entries).map((entry) => entry.name), ['Bench']);
});
