import { WeekStartDay, getWeekStart, addDays, formatDate } from "@/lib/date";
import { AthleticIntensity, AthleticModality, AthleticPlacementMode, AthleticWorkConfig, Exercise, PlanExercise, SplitType, WorkoutPlan, WorkoutPlanDay } from "@/lib/types";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
  weekStartDay?: WeekStartDay;
  athleticWork?: Partial<AthleticWorkConfig>;
};

type PlanPersistenceDeps = {
  listExercises: () => Exercise[];
  getPlanByWeek: (weekStartDate: string) => WorkoutPlan | null;
  upsertPlan: (plan: WorkoutPlan) => void;
};

const weekStartDays: WeekStartDay[] = [0, 1, 2, 3, 4, 5, 6];

function getDefaultPlanDeps(): PlanPersistenceDeps {
  const db = require("@/lib/db") as typeof import("@/lib/db");

  return {
    listExercises: db.listExercises,
    getPlanByWeek: db.getWorkoutPlanByWeek,
    upsertPlan: db.upsertWorkoutPlan,
  };
}

type DayTemplate = {
  workoutType: string;
  focus: string;
  groups: Array<Exercise["category"]>;
  exercises: Exercise[];
};

type AthleticTemplate = {
  id: string;
  name: string;
  modality: AthleticModality;
  mediaKind: "image-pair" | "diagram" | "description";
  prescription: PlanExercise["prescription"];
  safetyNotes: string;
};

const coreFocusSuffix = "Intentional core work for trunk strength and control";
const defaultAthleticWork: AthleticWorkConfig = {
  frequency: 0,
  intensity: "moderate",
  modalities: ["sprints", "jumps", "agility"],
  placementMode: "auto",
  preferredDays: [],
};

const athleticTemplates: AthleticTemplate[] = [
  {
    id: "flying-20s",
    name: "Flying 20m Sprints",
    modality: "sprints",
    mediaKind: "description",
    prescription: {
      distanceOrTime: "20m fly zone after 20m buildup",
      reps: "4-6 reps",
      sets: "1 sprint series",
      rest: "2-3 min walk-back rest",
      intensity: "Fast but crisp: 85-95% effort",
      notes: "Stop if sprint mechanics degrade; keep every rep smooth.",
    },
    safetyNotes: "Warm up thoroughly with skips, buildups, and hamstring prep before sprinting.",
  },
  {
    id: "hill-sprint-repeats",
    name: "Hill Sprint Repeats",
    modality: "sprints",
    mediaKind: "description",
    prescription: {
      distanceOrTime: "8-12 sec uphill sprint",
      reps: "6-8 reps",
      sets: "1 sprint series",
      rest: "90-150 sec walk-down rest",
      intensity: "Powerful acceleration, 85-90% effort",
      notes: "Use a moderate grade and stay tall through the hips.",
    },
    safetyNotes: "Avoid max-speed work when calves, Achilles, or hamstrings feel irritated.",
  },
  {
    id: "box-jump-power",
    name: "Box Jump Power Sets",
    modality: "jumps",
    mediaKind: "image-pair",
    prescription: {
      distanceOrTime: "Controlled jump to stable box",
      reps: "3-5 reps",
      sets: "4 sets",
      rest: "90 sec between sets",
      intensity: "Explosive but submaximal; stick each landing",
      notes: "Step down instead of jumping down to manage joint stress.",
    },
    safetyNotes: "Choose a box height you can land on quietly without tucking excessively.",
  },
  {
    id: "broad-jump-sticks",
    name: "Broad Jump + Stick Landings",
    modality: "jumps",
    mediaKind: "image-pair",
    prescription: {
      distanceOrTime: "Horizontal jump with 2-sec landing stick",
      reps: "3 reps",
      sets: "5 sets",
      rest: "60-90 sec between sets",
      intensity: "Explosive takeoff, controlled landing",
      notes: "Reset fully between reps; quality beats fatigue.",
    },
    safetyNotes: "Land with knees tracking over toes and stop before landings get loud.",
  },
  {
    id: "ladder-in-in-out-out",
    name: "Ladder In-In-Out-Out Pattern",
    modality: "agility",
    mediaKind: "diagram",
    prescription: {
      distanceOrTime: "10-15 yd ladder pattern",
      reps: "3 passes each direction",
      sets: "2 rounds",
      rest: "45-60 sec between passes",
      intensity: "Quick feet at 70-85%; no tripping tempo",
      notes: "Diagram cue: two feet in each box, then two feet outside before advancing.",
    },
    safetyNotes: "Keep contacts light and reduce speed if foot placement gets sloppy.",
  },
  {
    id: "lateral-shuffle-deceleration",
    name: "Lateral Shuffle + Deceleration",
    modality: "agility",
    mediaKind: "diagram",
    prescription: {
      distanceOrTime: "5-10-5 yd shuttle lane",
      reps: "4 reps per side",
      sets: "2 sets",
      rest: "60-90 sec between reps",
      intensity: "Moderate-fast with clean braking",
      notes: "Plant outside foot, sink hips, and own the stop before reversing.",
    },
    safetyNotes: "Prioritize knee alignment and controlled cuts over speed.",
  },
  {
    id: "tempo-carry-conditioning",
    name: "Tempo Carry Conditioning",
    modality: "conditioning",
    mediaKind: "description",
    prescription: {
      distanceOrTime: "30-40 yd loaded carry",
      reps: "4-6 carries",
      sets: "1 conditioning block",
      rest: "60 sec between carries",
      intensity: "RPE 7: challenging but posture stays clean",
      notes: "Brace ribs down and walk with even steps.",
    },
    safetyNotes: "Use a load you can carry without leaning or losing grip position.",
  },
];

function chooseExercises(exercises: Exercise[], category: Exercise["category"], count: number, cursor: number) {
  const matching = exercises.filter((exercise) => exercise.category === category);

  if (matching.length === 0) {
    return [];
  }

  return Array.from({ length: count }, (_, index) => matching[(cursor + index) % matching.length]);
}

function deterministicStringHash(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededCursor(weekStartDate: string, salt: string, baseCursor: number) {
  return baseCursor + deterministicStringHash(`${weekStartDate}:${salt}`);
}

type CoreFocus = "abs" | "plank" | "stability" | "rotation" | "obliques";

const coreFocusOrder: CoreFocus[] = ["abs", "plank", "stability", "rotation", "obliques"];

function classifyCoreExercise(exercise: Exercise): CoreFocus {
  const name = exercise.name.toLowerCase();

  if (name.includes("russian twist")) {
    return "rotation";
  }

  if (name.includes("reach-through") || name.includes("mountain climber")) {
    return "rotation";
  }

  if (name.includes("dead bug") || name.includes("bear crawl") || name.includes("hanging knee")) {
    return "stability";
  }

  if (name.includes("copenhagen") || name.includes("side plank") || name.includes("bicycle") || name.includes("heel tap")) {
    return "obliques";
  }

  if (name.includes("plank")) {
    return "plank";
  }

  return "abs";
}

function buildBalancedCoreMix(exercises: Exercise[]) {
  const buckets: Record<CoreFocus, Exercise[]> = {
    abs: [],
    plank: [],
    stability: [],
    rotation: [],
    obliques: [],
  };

  for (const exercise of exercises) {
    if (exercise.category !== "core" || exercise.name.toLowerCase().includes("russian twist")) {
      continue;
    }

    buckets[classifyCoreExercise(exercise)].push(exercise);
  }

  // Equipment-specific additions such as ab wheel rollouts stay eligible, but should not
  // become the default first abs pick just because exercise rows are alphabetized.
  const firstAbs = buckets.abs.find((exercise) => !exercise.name.toLowerCase().includes("ab wheel"));
  const abWheelExercises = buckets.abs.filter((exercise) => exercise.name.toLowerCase().includes("ab wheel"));
  const remainingAbs = buckets.abs.filter((exercise) => exercise !== firstAbs && !exercise.name.toLowerCase().includes("ab wheel"));
  buckets.abs = firstAbs ? [firstAbs, ...abWheelExercises, ...remainingAbs] : [...abWheelExercises, ...remainingAbs];

  const longestBucket = Math.max(...coreFocusOrder.map((focus) => buckets[focus].length));
  const balanced: Exercise[] = [];

  for (let round = 0; round < longestBucket; round += 1) {
    for (const focus of coreFocusOrder) {
      const exercise = buckets[focus][round];

      if (exercise) {
        balanced.push(exercise);
      }
    }
  }

  return balanced;
}

function takeCycled<T>(items: T[], count: number, cursor = 0) {
  if (items.length === 0) {
    return [];
  }

  return Array.from({ length: count }, (_, index) => items[(cursor + index) % items.length]);
}

function normalizeAthleticWork(config?: Partial<AthleticWorkConfig>): AthleticWorkConfig {
  const validModalities = new Set<AthleticModality>(["sprints", "jumps", "agility", "conditioning"]);
  const validIntensities = new Set<AthleticIntensity>(["low", "moderate", "high"]);
  const validPlacementModes = new Set<AthleticPlacementMode>(["auto", "preferred", "locked"]);
  const modalities = (config?.modalities ?? defaultAthleticWork.modalities)
    .filter((modality): modality is AthleticModality => validModalities.has(modality));

  return {
    frequency: clamp(Number(config?.frequency ?? defaultAthleticWork.frequency) || 0, 0, 4),
    intensity: validIntensities.has(config?.intensity as AthleticIntensity) ? config?.intensity as AthleticIntensity : defaultAthleticWork.intensity,
    modalities: modalities.length ? modalities : defaultAthleticWork.modalities,
    placementMode: validPlacementModes.has(config?.placementMode as AthleticPlacementMode) ? config?.placementMode as AthleticPlacementMode : defaultAthleticWork.placementMode,
    preferredDays: Array.from(new Set((config?.preferredDays ?? [])
      .map((day) => Number(day))
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))),
  };
}

function athleticTemplateToExercise(template: AthleticTemplate, intensity: AthleticIntensity, index: number): PlanExercise {
  const intensityLabel = intensity === "high" ? template.prescription?.intensity ?? "High intensity" :
    intensity === "low" ? "Technique pace: 65-75% effort" : template.prescription?.intensity ?? "Moderate intensity";

  return {
    exerciseId: `athletic-${template.id}`,
    name: template.name,
    type: template.modality === "sprints" || template.modality === "conditioning" ? "cardio" : "plyo",
    sets: Number.parseInt(template.prescription?.sets ?? "1", 10) || 1,
    reps: `${template.prescription?.reps ?? "quality reps"} · ${template.prescription?.distanceOrTime ?? "field work"}`,
    restSeconds: intensity === "high" ? 150 : intensity === "low" ? 60 : 90,
    category: template.modality === "sprints" || template.modality === "conditioning" ? "cardio" : "plyo",
    modality: template.modality,
    mediaKind: template.mediaKind,
    prescription: template.prescription ? { ...template.prescription, intensity: intensityLabel } : undefined,
    safetyNotes: `${template.safetyNotes} Progression: add volume only after two clean sessions at this intensity. Block ${index + 1}.`,
  };
}

function chooseAthleticTemplatesForSession(config: AthleticWorkConfig, sessionIndex: number) {
  return config.modalities.map((modality) => {
    const matching = athleticTemplates.filter((template) => template.modality === modality);
    return takeCycled(matching.length ? matching : athleticTemplates, 1, sessionIndex + (config.intensity === "high" ? 1 : 0))[0];
  }).filter(Boolean);
}

function calendarDayToPlanIndex(days: WorkoutPlanDay[], calendarDay: number) {
  return days.findIndex((day) => new Date(`${day.date}T00:00:00`).getDay() === calendarDay);
}

function candidateAthleticIndexes(days: WorkoutPlanDay[], config: AthleticWorkConfig) {
  const preferred = config.preferredDays
    .map((calendarDay) => calendarDayToPlanIndex(days, calendarDay))
    .filter((day) => day >= 0 && day < days.length);

  if (config.placementMode === "locked" && preferred.length > 0) {
    return preferred;
  }

  const restIndexes = days
    .map((day, index) => ({ day, index }))
    .filter(({ day }) => day.exercises.length === 0)
    .map(({ index }) => index);
  const nonLegIndexes = days
    .map((day, index) => ({ day, index }))
    .filter(({ day }) => day.exercises.length > 0 && !/leg|lower/i.test(day.workoutType))
    .map(({ index }) => index);

  return [...preferred, ...restIndexes, ...nonLegIndexes, ...days.map((_, index) => index)]
    .filter((day, index, all) => all.indexOf(day) === index);
}

function applyAthleticWork(days: WorkoutPlanDay[], config: AthleticWorkConfig) {
  if (config.frequency <= 0) {
    return days;
  }

  const indexes = candidateAthleticIndexes(days, config).slice(0, config.frequency);

  return days.map((day, index) => {
    const placement = indexes.indexOf(index);

    if (placement === -1) {
      return day;
    }

    const athleticExercises = chooseAthleticTemplatesForSession(config, placement)
      .map((template, exerciseIndex) => athleticTemplateToExercise(template, config.intensity, placement + exerciseIndex));
    const isStandalone = day.exercises.length === 0;
    const modalitySummary = athleticExercises.map((exercise) => exercise.modality).filter(Boolean).join(" + ");
    const firstPrescription = athleticExercises[0]?.prescription;

    return {
      ...day,
      workoutType: isStandalone ? "Athletic Conditioning" : `${day.workoutType} + Athletic`,
      focus: isStandalone
        ? `Athletic work (${modalitySummary}) layered by ${config.placementMode} placement.`
        : `${day.focus}. Athletic finisher (${modalitySummary}): ${firstPrescription?.distanceOrTime}; ${firstPrescription?.rest} rest.`,
      exercises: isStandalone ? athleticExercises : [...day.exercises, ...athleticExercises],
    };
  });
}

function buildDay(
  index: number,
  date: string,
  workoutType: string,
  focus: string,
  selections: Array<Exercise | null | undefined>,
): WorkoutPlanDay {
  const selectedExercises = selections.filter((exercise): exercise is Exercise => exercise != null);

  return {
    dayOfWeek: index,
    date,
    label: dayLabels[new Date(`${date}T00:00:00`).getDay()],
    workoutType,
    focus,
    exercises: selectedExercises.map((exercise) => ({
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
  const coreCount = workoutDays >= 5 ? 1 : 0;
  const cardioCount = workoutDays > 3 && workoutDays !== 5 ? 1 : 0;
  const strengthCount = Math.max(0, workoutDays - cardioCount - coreCount);
  const chosenStrength = pickStrengthTemplates(strengthTemplates, strengthCount);

  if (coreCount === 0 && cardioCount === 0) {
    return chosenStrength;
  }

  if (coreCount === 1 && cardioCount === 0) {
    return [
      ...chosenStrength.slice(0, 2),
      coreTemplate,
      ...chosenStrength.slice(2),
    ].slice(0, workoutDays);
  }

  if (coreCount === 0 && cardioCount === 1) {
    const separatorIndex = chosenStrength.length >= 4 ? 3 : Math.max(1, chosenStrength.length - 1);
    return [
      ...chosenStrength.slice(0, separatorIndex),
      cardioTemplate,
      ...chosenStrength.slice(separatorIndex),
    ].slice(0, workoutDays);
  }

  const coreInsertIndex = Math.min(2, chosenStrength.length);
  const strengthWithCore = [
    ...chosenStrength.slice(0, coreInsertIndex),
    coreTemplate,
    ...chosenStrength.slice(coreInsertIndex),
  ];
  const cardioInsertIndex = strengthWithCore.length >= 5 ? 4 : Math.max(1, strengthWithCore.length - 1);

  return [
    ...strengthWithCore.slice(0, cardioInsertIndex),
    cardioTemplate,
    ...strengthWithCore.slice(cardioInsertIndex),
  ].slice(0, workoutDays);
}

export function generateDays(config: PlanConfig, weekStartDate: string, exercises: Exercise[]): WorkoutPlanDay[] {
  const startDate = new Date(`${weekStartDate}T00:00:00`);
  const exercisesPerWorkout = clamp(config.exercisesPerWorkout, minExercisesPerWorkout, maxExercisesPerWorkout);
  const workoutDays = clamp(config.workoutDays, minWorkoutDays, maxWorkoutDays);
  const cursor = (salt: string, baseCursor: number) => seededCursor(weekStartDate, salt, baseCursor);

  const coreMix = buildBalancedCoreMix(exercises);
  const pushMix = [
    ...chooseExercises(exercises, "chest", 3, cursor("push-chest", 0)),
    ...chooseExercises(exercises, "shoulders", 2, cursor("push-shoulders", 0)),
    ...chooseExercises(exercises, "arms", 2, cursor("push-arms", 0)),
  ];
  const pullMix = [
    ...chooseExercises(exercises, "back", 5, cursor("pull-back", 0)),
    ...chooseExercises(exercises, "shoulders", 1, cursor("pull-shoulders", 2)),
  ];
  const legMix = [
    ...chooseExercises(exercises, "legs", 6, cursor("legs", 0)),
  ];
  const cardioMix = [
    ...chooseExercises(exercises, "cardio", 4, cursor("cardio", 0)),
    ...chooseExercises(exercises, "plyo", 4, cursor("plyo", 0)),
  ];
  const upperMix = [
    ...chooseExercises(exercises, "chest", 2, cursor("upper-chest", 2)),
    ...chooseExercises(exercises, "back", 2, cursor("upper-back", 1)),
    ...chooseExercises(exercises, "shoulders", 2, cursor("upper-shoulders", 1)),
    ...chooseExercises(exercises, "arms", 1, cursor("upper-arms", 2)),
  ];
  const fullBodyMix = [
    ...chooseExercises(exercises, "legs", 2, cursor("full-legs", 2)),
    ...chooseExercises(exercises, "chest", 2, cursor("full-chest", 1)),
    ...chooseExercises(exercises, "back", 2, cursor("full-back", 3)),
    ...takeCycled(coreMix, 2, cursor("full-core", 0)),
  ];
  const lowerVolumeMix = [
    ...chooseExercises(exercises, "legs", 5, cursor("lower-legs", 3)),
    ...chooseExercises(exercises, "plyo", 1, cursor("lower-plyo", 2)),
  ];

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
      createTemplate("Shoulders + Core", "Delts, posture, and trunk control", ["shoulders"], [...chooseExercises(exercises, "shoulders", 5, cursor("shoulders-core-shoulders", 0)), ...takeCycled(coreMix, 3, cursor("shoulders-core-core", 2))], exercisesPerWorkout),
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
      createTemplate("Full Body C", "Strength plus trunk stability", ["legs", "chest", "back", "core"], [...fullBodyMix, ...takeCycled(coreMix, 2, cursor("full-c-core", 2))], exercisesPerWorkout),
      createTemplate("Lower Power", "Jump, hinge, and squat emphasis", ["legs"], lowerVolumeMix, exercisesPerWorkout),
      createTemplate("Upper Balance", "Press, row, and scapular control", ["chest", "back"], upperMix, exercisesPerWorkout),
      createTemplate("Full Body D", "Mixed compound strength", ["legs", "chest", "back", "core"], [...fullBodyMix, ...chooseExercises(exercises, "legs", 2, cursor("full-d-legs", 5))], exercisesPerWorkout),
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

  const strengthDays = [...workoutSequence, ...restDays].map((template, index) => {
    const day = buildDay(index, formatDate(addDays(startDate, index)), template.workoutType, template.focus, template.exercises);

    if (template.workoutType !== "Rest / Recovery" && day.exercises.length === 0) {
      console.warn(
        `No exercises generated for workout template "${template.workoutType}" (${template.focus}). Check exercise catalog coverage.`,
      );
    }

    return day;
  });

  return applyAthleticWork(strengthDays, normalizeAthleticWork(config.athleticWork));
}

export function resolveCurrentPlan(deps: PlanPersistenceDeps, today = new Date()) {
  const candidates = weekStartDays
    .map((weekStartDay) => formatDate(getWeekStart(today, weekStartDay)))
    .sort((left, right) => right.localeCompare(left));

  for (const weekStartDate of candidates) {
    const existing = deps.getPlanByWeek(weekStartDate);

    if (existing) {
      return existing;
    }
  }

  return null;
}

export function getOrCreateCurrentPlan(split: SplitType = "ppl", deps = getDefaultPlanDeps(), today = new Date()) {
  const existing = resolveCurrentPlan(deps, today);

  if (existing) {
    return existing;
  }

  const weekStartDay: WeekStartDay = 1;
  const weekStartDate = formatDate(getWeekStart(today, weekStartDay));

  return createWorkoutPlan({
    split,
    workoutDays: defaultWorkoutDays,
    exercisesPerWorkout: defaultExercisesPerWorkout,
    weekStartDay,
  }, weekStartDate, deps);
}

export function createWorkoutPlan(config: PlanConfig, weekStartDate = formatDate(getWeekStart()), deps = getDefaultPlanDeps()) {
  const workoutDays = clamp(config.workoutDays, minWorkoutDays, maxWorkoutDays);
  const exercisesPerWorkout = clamp(
    config.exercisesPerWorkout,
    minExercisesPerWorkout,
    maxExercisesPerWorkout,
  );
  const athleticWork = normalizeAthleticWork(config.athleticWork);
  const athleticId = athleticWork.frequency > 0
    ? `-athletic-${athleticWork.frequency}-${athleticWork.intensity}-${athleticWork.placementMode}-${athleticWork.modalities.join("_")}-${athleticWork.preferredDays.join("_")}`
    : "";
  const exercises = deps.listExercises();
  const plan: WorkoutPlan = {
    id: `plan-${weekStartDate}-${config.split}-${workoutDays}-${exercisesPerWorkout}${athleticId}`,
    weekStartDate,
    weekStartDay: config.weekStartDay ?? 1,
    split: config.split,
    workoutDays,
    exercisesPerWorkout,
    athleticWork,
    days: generateDays(
      {
        split: config.split,
        workoutDays,
        exercisesPerWorkout,
        athleticWork,
      },
      weekStartDate,
      exercises,
    ),
  };

  deps.upsertPlan(plan);
  return plan;
}

export function swapWorkoutPlanDays(weekStartDate: string, sourceIndex: number, targetIndex: number, deps = getDefaultPlanDeps()) {
  const plan = deps.getPlanByWeek(weekStartDate) ?? getOrCreateCurrentPlan("ppl", deps);
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

  deps.upsertPlan(nextPlan);
  return nextPlan;
}
