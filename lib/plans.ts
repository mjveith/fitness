import { getWeekStart, addDays, formatDate } from "@/lib/date";
import { getWorkoutPlanByWeek, listExercises, upsertWorkoutPlan } from "@/lib/db";
import { Exercise, SplitType, WorkoutPlan, WorkoutPlanDay } from "@/lib/types";

const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const defaultWorkoutDays = 5;
const defaultExercisesPerWorkout = 5;
const minWorkoutDays = 1;
const maxWorkoutDays = 7;
const minExercisesPerWorkout = 2;
const maxExercisesPerWorkout = 8;
const conflictMap = {
  chest: new Set<Exercise["category"]>(["shoulders", "arms"]),
  shoulders: new Set<Exercise["category"]>(["chest", "arms"]),
  arms: new Set<Exercise["category"]>(["chest", "back", "shoulders"]),
  back: new Set<Exercise["category"]>(["arms"]),
  legs: new Set<Exercise["category"]>(),
  core: new Set<Exercise["category"]>(),
  cardio: new Set<Exercise["category"]>(),
  plyo: new Set<Exercise["category"]>(),
} satisfies Record<Exercise["category"], Set<Exercise["category"]>>;

type PlanConfig = {
  split: SplitType;
  workoutDays: number;
  exercisesPerWorkout: number;
};

type DayTemplate = {
  workoutType: string;
  focus: string;
  groups: Array<Exercise["category"]>;
  exercises: Exercise[];
};

const coreFocusSuffix = "Intentional core work for trunk strength and control";

function chooseExercises(exercises: Exercise[], category: Exercise["category"], count: number, cursor: number) {
  const matching = exercises.filter((exercise) => exercise.category === category);
  return Array.from({ length: count }, (_, index) => matching[(cursor + index) % matching.length]);
}

function buildDay(
  index: number,
  date: string,
  workoutType: string,
  focus: string,
  selections: Exercise[],
): WorkoutPlanDay {
  return {
    dayOfWeek: index,
    date,
    label: labels[index],
    workoutType,
    focus,
    exercises: selections.map((exercise) => ({
      exerciseId: exercise.id,
      name: exercise.name,
      type: exercise.type,
      sets: exercise.defaultSets,
      reps: exercise.defaultReps,
      restSeconds: exercise.defaultRestSeconds,
      category: exercise.category,
    })),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hasConflict(previous: DayTemplate | null, next: DayTemplate) {
  if (!previous) {
    return false;
  }

  return previous.groups.some((group) =>
    next.groups.some((nextGroup) => conflictMap[group].has(nextGroup) || conflictMap[nextGroup].has(group)),
  );
}

function trimExercises(exercises: Exercise[], count: number) {
  return exercises.slice(0, count);
}

function createTemplate(
  workoutType: string,
  focus: string,
  groups: Array<Exercise["category"]>,
  exercises: Exercise[],
  count: number,
): DayTemplate {
  return {
    workoutType,
    focus,
    groups,
    exercises: trimExercises(exercises, count),
  };
}

function addCoreTag(template: DayTemplate) {
  return {
    ...template,
    workoutType: template.workoutType.includes("Core") ? template.workoutType : `${template.workoutType} + Core`,
    focus: template.focus.includes(coreFocusSuffix) ? template.focus : `${template.focus}. ${coreFocusSuffix}`,
    groups: template.groups.includes("core") ? template.groups : [...template.groups, "core"],
  };
}

function injectCoreExercise(template: DayTemplate, coreExercise: Exercise, count: number) {
  const nextExercises = trimExercises(template.exercises, count);

  if (nextExercises.length < count) {
    nextExercises.push(coreExercise);
  } else {
    const replaceIndex = nextExercises.findLastIndex((exercise) => exercise.category !== "core");
    nextExercises[replaceIndex === -1 ? nextExercises.length - 1 : replaceIndex] = coreExercise;
  }

  return {
    ...addCoreTag(template),
    exercises: nextExercises,
  };
}

function applyCoreDistribution(workoutSequence: DayTemplate[], coreExercises: Exercise[], exercisesPerWorkout: number, workoutDays: number) {
  if (workoutDays >= 5) {
    return workoutSequence;
  }

  const targetedPlacements = Math.min(
    workoutDays >= 3 ? 3 : Math.min(workoutDays, 2),
    workoutSequence.length,
  );
  const targetIndexes = workoutSequence
    .map((template, index) => ({ template, index }))
    .filter(({ template }) => template.exercises.length > 0 && !template.workoutType.includes("Cardio"))
    .slice(0, targetedPlacements)
    .map(({ index }) => index);

  return workoutSequence.map((template, index) => {
    const targetPosition = targetIndexes.indexOf(index);

    if (targetPosition === -1) {
      return template;
    }

    return injectCoreExercise(
      template,
      coreExercises[targetPosition % coreExercises.length],
      exercisesPerWorkout,
    );
  });
}

function pickStrengthTemplates(templates: DayTemplate[], count: number) {
  const selected: DayTemplate[] = [];
  const remaining = [...templates];

  while (selected.length < count && remaining.length > 0) {
    const previous = selected.at(-1) ?? null;
    const nextIndex = remaining.findIndex((candidate) => !hasConflict(previous, candidate));
    const fallbackIndex = nextIndex === -1 ? 0 : nextIndex;
    selected.push(remaining.splice(fallbackIndex, 1)[0]);
  }

  return selected;
}

function buildWorkoutSequence(
  strengthTemplates: DayTemplate[],
  cardioTemplate: DayTemplate,
  coreTemplate: DayTemplate,
  workoutDays: number,
) {
  if (workoutDays === 5) {
    const chosenStrength = pickStrengthTemplates(strengthTemplates, 4);
    return [
      ...chosenStrength.slice(0, 2),
      coreTemplate,
      ...chosenStrength.slice(2),
    ];
  }

  const cardioCount = workoutDays > 3 ? 1 : 0;
  const strengthCount = Math.max(0, workoutDays - cardioCount);
  const chosenStrength = pickStrengthTemplates(strengthTemplates, strengthCount);

  if (cardioCount === 0) {
    return chosenStrength;
  }

  const separatorIndex = chosenStrength.length >= 4 ? 3 : Math.max(1, chosenStrength.length - 1);
  return [
    ...chosenStrength.slice(0, separatorIndex),
    cardioTemplate,
    ...chosenStrength.slice(separatorIndex),
  ].slice(0, workoutDays);
}

function generateDays(config: PlanConfig, weekStartDate: string): WorkoutPlanDay[] {
  const exercises = listExercises();
  const monday = new Date(`${weekStartDate}T00:00:00`);
  const exercisesPerWorkout = clamp(config.exercisesPerWorkout, minExercisesPerWorkout, maxExercisesPerWorkout);
  const workoutDays = clamp(config.workoutDays, minWorkoutDays, maxWorkoutDays);

  const pushMix = [
    ...chooseExercises(exercises, "chest", 3, 0),
    ...chooseExercises(exercises, "shoulders", 2, 0),
    ...chooseExercises(exercises, "arms", 2, 0),
    ...chooseExercises(exercises, "core", 1, 0),
  ];
  const pullMix = [
    ...chooseExercises(exercises, "back", 5, 0),
    ...chooseExercises(exercises, "core", 2, 1),
    ...chooseExercises(exercises, "shoulders", 1, 2),
  ];
  const legMix = [
    ...chooseExercises(exercises, "legs", 6, 0),
    ...chooseExercises(exercises, "core", 2, 0),
  ];
  const cardioMix = [
    ...chooseExercises(exercises, "cardio", 4, 0),
    ...chooseExercises(exercises, "plyo", 4, 0),
  ];
  const upperMix = [
    ...chooseExercises(exercises, "chest", 2, 2),
    ...chooseExercises(exercises, "back", 2, 1),
    ...chooseExercises(exercises, "shoulders", 2, 1),
    ...chooseExercises(exercises, "arms", 1, 2),
    ...chooseExercises(exercises, "core", 1, 3),
  ];
  const fullBodyMix = [
    ...chooseExercises(exercises, "legs", 2, 2),
    ...chooseExercises(exercises, "chest", 2, 1),
    ...chooseExercises(exercises, "back", 2, 3),
    ...chooseExercises(exercises, "core", 2, 2),
  ];
  const lowerVolumeMix = [
    ...chooseExercises(exercises, "legs", 5, 3),
    ...chooseExercises(exercises, "core", 2, 1),
    ...chooseExercises(exercises, "plyo", 1, 2),
  ];
  const coreMix = chooseExercises(exercises, "core", 6, 0);

  const cardioTemplate = createTemplate(
    "Sprint / Cardio",
    "Sprints, intervals, and conditioning only",
    ["cardio", "plyo"],
    cardioMix,
    exercisesPerWorkout,
  );
  const coreTemplate = createTemplate(
    "Core Strength",
    "Dedicated abs and trunk stability work",
    ["core"],
    coreMix,
    exercisesPerWorkout,
  );

  const templates: Record<SplitType, DayTemplate[]> = {
    ppl: [
      createTemplate("Push Strength", "Chest-led pressing with shoulder support", ["chest"], pushMix, exercisesPerWorkout),
      createTemplate("Pull Strength", "Back emphasis with trunk support", ["back"], pullMix, exercisesPerWorkout),
      createTemplate("Leg Strength", "Quads, glutes, hamstrings", ["legs"], legMix, exercisesPerWorkout),
      createTemplate("Upper", "Balanced press and pull accessories", ["chest", "back"], upperMix, exercisesPerWorkout),
      createTemplate("Lower Volume", "Single-leg work and posterior chain", ["legs"], lowerVolumeMix, exercisesPerWorkout),
      createTemplate("Shoulders + Core", "Delts, posture, and trunk control", ["shoulders"], [...chooseExercises(exercises, "shoulders", 5, 0), ...chooseExercises(exercises, "core", 3, 0)], exercisesPerWorkout),
    ],
    "upper-lower": [
      createTemplate("Upper Strength", "Chest, back, and shoulders", ["chest", "back", "shoulders"], upperMix, exercisesPerWorkout),
      createTemplate("Lower Strength", "Squat and hinge emphasis", ["legs"], legMix, exercisesPerWorkout),
      createTemplate("Upper Volume", "Pull and press accessories", ["back", "shoulders"], [...upperMix].reverse(), exercisesPerWorkout),
      createTemplate("Lower Volume", "Posterior chain and unilateral work", ["legs"], lowerVolumeMix, exercisesPerWorkout),
      createTemplate("Full Body", "Mixed strength circuit", ["legs", "chest", "back", "core"], fullBodyMix, exercisesPerWorkout),
      createTemplate("Upper Pump", "Pressing and rowing density", ["chest", "back"], [...pushMix, ...pullMix], exercisesPerWorkout),
    ],
    "full-body": [
      createTemplate("Full Body A", "Squat, press, row", ["legs", "chest", "back", "core"], fullBodyMix, exercisesPerWorkout),
      createTemplate("Full Body B", "Hinge, pull, unilateral work", ["legs", "chest", "back", "core"], [...fullBodyMix].reverse(), exercisesPerWorkout),
      createTemplate("Full Body C", "Strength plus trunk stability", ["legs", "chest", "back", "core"], [...fullBodyMix, ...chooseExercises(exercises, "core", 2, 4)], exercisesPerWorkout),
      createTemplate("Lower Power", "Jump, hinge, and squat emphasis", ["legs"], lowerVolumeMix, exercisesPerWorkout),
      createTemplate("Upper Balance", "Press, row, and scapular control", ["chest", "back"], upperMix, exercisesPerWorkout),
      createTemplate("Full Body D", "Mixed compound strength", ["legs", "chest", "back", "core"], [...fullBodyMix, ...chooseExercises(exercises, "legs", 2, 5)], exercisesPerWorkout),
    ],
  };

  const workoutSequence = applyCoreDistribution(
    buildWorkoutSequence(templates[config.split], cardioTemplate, coreTemplate, workoutDays),
    coreMix,
    exercisesPerWorkout,
    workoutDays,
  );
  const restDays = Array.from({ length: 7 - workoutSequence.length }, () =>
    createTemplate("Rest / Recovery", "Walk, mobility, and easy recovery work", [], [], exercisesPerWorkout),
  );

  return [...workoutSequence, ...restDays].map((template, index) =>
    buildDay(index, formatDate(addDays(monday, index)), template.workoutType, template.focus, template.exercises),
  );
}

export function getOrCreateCurrentPlan(split: SplitType = "ppl") {
  const weekStartDate = formatDate(getWeekStart());
  const existing = getWorkoutPlanByWeek(weekStartDate);

  if (existing) {
    return existing;
  }

  return createWorkoutPlan({
    split,
    workoutDays: defaultWorkoutDays,
    exercisesPerWorkout: defaultExercisesPerWorkout,
  }, weekStartDate);
}

export function createWorkoutPlan(config: PlanConfig, weekStartDate = formatDate(getWeekStart())) {
  const workoutDays = clamp(config.workoutDays, minWorkoutDays, maxWorkoutDays);
  const exercisesPerWorkout = clamp(
    config.exercisesPerWorkout,
    minExercisesPerWorkout,
    maxExercisesPerWorkout,
  );
  const plan: WorkoutPlan = {
    id: `plan-${weekStartDate}-${config.split}-${workoutDays}-${exercisesPerWorkout}`,
    weekStartDate,
    split: config.split,
    workoutDays,
    exercisesPerWorkout,
    days: generateDays(
      {
        split: config.split,
        workoutDays,
        exercisesPerWorkout,
      },
      weekStartDate,
    ),
  };

  upsertWorkoutPlan(plan);
  return plan;
}

export function swapWorkoutPlanDays(weekStartDate: string, sourceIndex: number, targetIndex: number) {
  const plan = getWorkoutPlanByWeek(weekStartDate) ?? getOrCreateCurrentPlan();
  const days = [...plan.days];

  if (
    sourceIndex < 0 ||
    targetIndex < 0 ||
    sourceIndex >= days.length ||
    targetIndex >= days.length ||
    sourceIndex === targetIndex
  ) {
    return plan;
  }

  const sourceDay = days[sourceIndex];
  const targetDay = days[targetIndex];

  days[sourceIndex] = {
    ...sourceDay,
    workoutType: targetDay.workoutType,
    focus: targetDay.focus,
    exercises: targetDay.exercises,
  };
  days[targetIndex] = {
    ...targetDay,
    workoutType: sourceDay.workoutType,
    focus: sourceDay.focus,
    exercises: sourceDay.exercises,
  };

  const nextPlan: WorkoutPlan = {
    ...plan,
    days,
  };

  upsertWorkoutPlan(nextPlan);
  return nextPlan;
}
