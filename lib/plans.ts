import { formatDate } from "@/lib/date";
import { getWorkoutLogs, getWorkoutPlanByWeek, listExercises, upsertWorkoutPlan } from "@/lib/db";
import { AthleticModality, Exercise, PlanExercise, WorkoutLog, WorkoutPlan, WorkoutPlanDay } from "@/lib/types";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const minExercisesPerWorkout = 1;
const maxExercisesPerWorkout = 10;

export const workoutTypeOptions = [
  { value: "full-body", label: "Full body" },
  { value: "push", label: "Push" },
  { value: "pull", label: "Pull" },
  { value: "legs", label: "Legs" },
  { value: "core", label: "Core" },
  { value: "sprints", label: "Sprints" },
  { value: "athletic-conditioning", label: "Athletic conditioning" },
] as const;

export type SingleWorkoutType = (typeof workoutTypeOptions)[number]["value"];

export type SingleWorkoutConfig = {
  workoutType: SingleWorkoutType | string;
  exerciseCount: number;
};

type CoreFocus = "abs" | "plank" | "stability" | "rotation" | "obliques";

type WorkoutTemplate = {
  workoutType: string;
  focus: string;
  categories: Array<Exercise["category"]>;
  coreFocus?: CoreFocus;
  modality?: AthleticModality;
};

export type HistoryFocusSummary = {
  date: string;
  label: string;
  focus: SingleWorkoutType;
  coreFocus?: CoreFocus;
};

export type WorkoutHistoryGuidance = {
  recommendation: SingleWorkoutType;
  recommendationLabel: string;
  reason: string;
  nextCoreFocus: CoreFocus;
  recent: HistoryFocusSummary[];
  lastByFocus: Partial<Record<SingleWorkoutType, string>>;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeWorkoutType(value: unknown): SingleWorkoutType {
  const raw = String(value ?? "full-body").toLowerCase().trim().replace(/_/g, "-").replace(/\s+/g, "-");
  if (raw === "fullbody") return "full-body";
  if (raw === "conditioning" || raw === "athletic") return "athletic-conditioning";
  return workoutTypeOptions.some((option) => option.value === raw) ? raw as SingleWorkoutType : "full-body";
}

function chooseExercises(exercises: Exercise[], category: Exercise["category"], count: number, cursor = 0) {
  const matching = exercises.filter((exercise) => exercise.category === category);
  if (matching.length === 0) return [];
  return Array.from({ length: count }, (_, index) => matching[(cursor + index) % matching.length]);
}

function takeCycled<T>(items: T[], count: number, cursor = 0) {
  if (items.length === 0) return [];
  return Array.from({ length: count }, (_, index) => items[(cursor + index) % items.length]);
}

function classifyCoreExercise(exercise: Pick<Exercise, "name">): CoreFocus {
  const name = exercise.name.toLowerCase();
  if (name.includes("russian twist") || name.includes("reach-through") || name.includes("mountain climber")) return "rotation";
  if (name.includes("dead bug") || name.includes("bear crawl") || name.includes("hanging knee")) return "stability";
  if (name.includes("copenhagen") || name.includes("side plank") || name.includes("bicycle") || name.includes("heel tap")) return "obliques";
  if (name.includes("plank")) return "plank";
  return "abs";
}

const coreFocusOrder: CoreFocus[] = ["abs", "plank", "stability", "rotation", "obliques"];

function buildBalancedCoreMix(exercises: Exercise[], preferredFocus: CoreFocus = "abs") {
  const buckets: Record<CoreFocus, Exercise[]> = { abs: [], plank: [], stability: [], rotation: [], obliques: [] };
  exercises.filter((exercise) => exercise.category === "core").forEach((exercise) => buckets[classifyCoreExercise(exercise)].push(exercise));
  const order = [preferredFocus, ...coreFocusOrder.filter((focus) => focus !== preferredFocus)];
  const longestBucket = Math.max(...coreFocusOrder.map((focus) => buckets[focus].length));
  const balanced: Exercise[] = [];

  for (let round = 0; round < longestBucket; round += 1) {
    for (const focus of order) {
      const exercise = buckets[focus][round];
      if (exercise) balanced.push(exercise);
    }
  }

  return balanced;
}

function athleticExercise(params: {
  id: string;
  name: string;
  modality: AthleticModality;
  prescription: NonNullable<PlanExercise["prescription"]>;
  safetyNotes: string;
}): PlanExercise {
  return {
    exerciseId: `athletic-${params.id}`,
    name: params.name,
    type: params.modality === "sprints" || params.modality === "conditioning" ? "cardio" : "plyo",
    sets: Number.parseInt(params.prescription.sets, 10) || 1,
    reps: `${params.prescription.reps} · ${params.prescription.distanceOrTime}`,
    restSeconds: params.modality === "sprints" ? 150 : 90,
    category: params.modality === "sprints" || params.modality === "conditioning" ? "cardio" : "plyo",
    modality: params.modality,
    mediaKind: "description",
    prescription: params.prescription,
    safetyNotes: params.safetyNotes,
  };
}

function buildAthleticTemplates(type: SingleWorkoutType): PlanExercise[] {
  if (type === "sprints") {
    return [
      athleticExercise({
        id: "flying-20s",
        name: "Flying 20m Sprints",
        modality: "sprints",
        prescription: { distanceOrTime: "20m fly zone after 20m buildup", reps: "4-6 reps", sets: "1 sprint series", rest: "2-3 min walk-back rest", intensity: "85-95% crisp effort", notes: "Stop before mechanics degrade." },
        safetyNotes: "Warm up with skips, buildups, and hamstring prep before sprinting.",
      }),
      athleticExercise({
        id: "hill-sprint-repeats",
        name: "Hill Sprint Repeats",
        modality: "sprints",
        prescription: { distanceOrTime: "8-12 sec uphill sprint", reps: "6-8 reps", sets: "1 sprint series", rest: "90-150 sec walk-down rest", intensity: "Powerful but controlled", notes: "Use a moderate grade and stay tall through the hips." },
        safetyNotes: "Avoid max-speed work when calves, Achilles, or hamstrings feel irritated.",
      }),
    ];
  }

  return [
    athleticExercise({
      id: "box-jump-power",
      name: "Box Jump Power Sets",
      modality: "jumps",
      prescription: { distanceOrTime: "Controlled jump to stable box", reps: "3-5 reps", sets: "4 sets", rest: "90 sec", intensity: "Explosive but submaximal", notes: "Step down instead of jumping down." },
      safetyNotes: "Choose a box height you can land on quietly.",
    }),
    athleticExercise({
      id: "lateral-shuffle-deceleration",
      name: "Lateral Shuffle + Deceleration",
      modality: "agility",
      prescription: { distanceOrTime: "5-10-5 yd shuttle lane", reps: "4 reps per side", sets: "2 sets", rest: "60-90 sec", intensity: "Moderate-fast with clean braking", notes: "Own the stop before reversing." },
      safetyNotes: "Prioritize knee alignment and controlled cuts over speed.",
    }),
    athleticExercise({
      id: "tempo-carry-conditioning",
      name: "Tempo Carry Conditioning",
      modality: "conditioning",
      prescription: { distanceOrTime: "30-40 yd loaded carry", reps: "4-6 carries", sets: "1 conditioning block", rest: "60 sec", intensity: "RPE 7", notes: "Brace ribs down and walk with even steps." },
      safetyNotes: "Use a load you can carry without leaning or losing grip position.",
    }),
  ];
}

function templateFor(type: SingleWorkoutType, nextCoreFocus: CoreFocus): WorkoutTemplate {
  switch (type) {
    case "push":
      return { workoutType: "Push", focus: "Chest-led pressing with shoulder and triceps support", categories: ["chest", "shoulders", "arms"] };
    case "pull":
      return { workoutType: "Pull", focus: "Back-led rows/pulls with rear-delt and biceps support", categories: ["back", "shoulders", "arms"] };
    case "legs":
      return { workoutType: "Legs", focus: "Quads, glutes, hamstrings, and unilateral control", categories: ["legs", "plyo"] };
    case "core":
      return { workoutType: "Core", focus: `Dedicated trunk work with ${nextCoreFocus} first in the rotation`, categories: ["core"], coreFocus: nextCoreFocus };
    case "sprints":
      return { workoutType: "Sprints", focus: "Speed work with full recovery and crisp mechanics", categories: ["cardio"], modality: "sprints" };
    case "athletic-conditioning":
      return { workoutType: "Athletic Conditioning", focus: "Jumps, agility, carries, and conditioning for court/field readiness", categories: ["plyo", "cardio"], modality: "conditioning" };
    case "full-body":
    default:
      return { workoutType: "Full Body", focus: "Squat/hinge, press, pull, and trunk stability in one session", categories: ["legs", "chest", "back", "core"] };
  }
}

function exerciseToPlanExercise(exercise: Exercise): PlanExercise {
  return {
    exerciseId: exercise.id,
    name: exercise.name,
    type: exercise.type,
    sets: exercise.defaultSets,
    reps: exercise.defaultReps,
    restSeconds: exercise.defaultRestSeconds,
    category: exercise.category,
  };
}

function buildExerciseSelections(type: SingleWorkoutType, count: number, nextCoreFocus: CoreFocus) {
  const exercises = listExercises();
  const template = templateFor(type, nextCoreFocus);

  if (type === "sprints" || type === "athletic-conditioning") {
    return takeCycled(buildAthleticTemplates(type), count);
  }

  const coreMix = buildBalancedCoreMix(exercises, nextCoreFocus);
  const mixes: Record<SingleWorkoutType, Exercise[]> = {
    "full-body": [
      ...chooseExercises(exercises, "legs", 2, 2),
      ...chooseExercises(exercises, "chest", 2, 1),
      ...chooseExercises(exercises, "back", 2, 3),
      ...takeCycled(coreMix, 2, 0),
    ],
    push: [
      ...chooseExercises(exercises, "chest", 3, 0),
      ...chooseExercises(exercises, "shoulders", 2, 0),
      ...chooseExercises(exercises, "arms", 2, 0),
    ],
    pull: [
      ...chooseExercises(exercises, "back", 5, 0),
      ...chooseExercises(exercises, "shoulders", 1, 2),
      ...chooseExercises(exercises, "arms", 1, 3),
    ],
    legs: [
      ...chooseExercises(exercises, "legs", 6, 0),
      ...chooseExercises(exercises, "plyo", 2, 0),
    ],
    core: coreMix,
    sprints: [],
    "athletic-conditioning": [],
  };

  return takeCycled(mixes[type], count).map(exerciseToPlanExercise);
}

function buildSingleWorkoutDay(config: Required<SingleWorkoutConfig>, date: string, nextCoreFocus: CoreFocus): WorkoutPlanDay {
  const type = normalizeWorkoutType(config.workoutType);
  const template = templateFor(type, nextCoreFocus);
  return {
    dayOfWeek: 0,
    date,
    label: dayLabels[new Date(`${date}T00:00:00`).getDay()] ?? "Today",
    workoutType: template.workoutType,
    focus: template.focus,
    exercises: buildExerciseSelections(type, config.exerciseCount, nextCoreFocus),
  };
}

export function createSingleWorkout(config: SingleWorkoutConfig, date = formatDate(new Date())) {
  const type = normalizeWorkoutType(config.workoutType);
  const exerciseCount = clamp(Number(config.exerciseCount) || 5, minExercisesPerWorkout, maxExercisesPerWorkout);
  const guidance = getWorkoutHistoryGuidance();
  const day = buildSingleWorkoutDay({ workoutType: type, exerciseCount }, date, guidance.nextCoreFocus);
  const plan: WorkoutPlan = {
    id: `workout-${date}-${type}-${exerciseCount}-${Date.now()}`,
    weekStartDate: date,
    split: "full-body",
    workoutDays: 1,
    exercisesPerWorkout: exerciseCount,
    days: [day],
  };

  upsertWorkoutPlan(plan);
  return plan;
}

export function getOrCreateTodaysWorkout() {
  const today = formatDate(new Date());
  return getWorkoutPlanByWeek(today) ?? createSingleWorkout({ workoutType: getWorkoutHistoryGuidance().recommendation, exerciseCount: 5 }, today);
}

export function getWorkoutPlanForDate(date: string, preferredWeekStartDate?: string | null) {
  if (preferredWeekStartDate) {
    const preferred = getWorkoutPlanByWeek(preferredWeekStartDate);
    if (preferred?.days.some((day) => day.date === date)) return preferred;
  }

  return getWorkoutPlanByWeek(date) ?? getOrCreateTodaysWorkout();
}

function inferFocusFromLog(log: WorkoutLog): HistoryFocusSummary {
  const label = log.dayName || "Workout";
  const normalizedLabel = label.toLowerCase();
  let focus: SingleWorkoutType = "full-body";

  if (normalizedLabel.includes("push")) focus = "push";
  else if (normalizedLabel.includes("pull")) focus = "pull";
  else if (normalizedLabel.includes("leg") || normalizedLabel.includes("lower")) focus = "legs";
  else if (normalizedLabel.includes("core")) focus = "core";
  else if (normalizedLabel.includes("sprint")) focus = "sprints";
  else if (normalizedLabel.includes("athletic") || normalizedLabel.includes("conditioning")) focus = "athletic-conditioning";
  else {
    const categories = new Set(log.entries.map((entry) => {
      const exercise = listExercises().find((item) => item.id === entry.exerciseId);
      return exercise?.category;
    }).filter(Boolean));
    if (categories.has("core") && categories.size === 1) focus = "core";
    else if (categories.has("legs") && categories.size <= 2) focus = "legs";
    else if (categories.has("cardio") || categories.has("plyo")) focus = "athletic-conditioning";
  }

  const coreEntry = log.entries.find((entry) => listExercises().find((exercise) => exercise.id === entry.exerciseId)?.category === "core");
  return {
    date: log.date,
    label,
    focus,
    coreFocus: coreEntry ? classifyCoreExercise({ name: coreEntry.name }) : undefined,
  };
}

export function getWorkoutHistoryGuidance(logs = getWorkoutLogs(20)): WorkoutHistoryGuidance {
  const recent = logs.slice(0, 8).map(inferFocusFromLog);
  const lastByFocus: Partial<Record<SingleWorkoutType, string>> = {};

  for (const item of recent) {
    if (!lastByFocus[item.focus]) lastByFocus[item.focus] = item.date;
  }

  const strengthRotation: SingleWorkoutType[] = ["push", "pull", "legs", "full-body", "core", "sprints", "athletic-conditioning"];
  const recentFocuses = recent.slice(0, 3).map((item) => item.focus);
  const recommendation = strengthRotation.find((focus) => !recentFocuses.includes(focus)) ?? strengthRotation.find((focus) => !lastByFocus[focus]) ?? "full-body";
  const recentCoreFocuses = recent.map((item) => item.coreFocus).filter((item): item is CoreFocus => Boolean(item));
  const nextCoreFocus = coreFocusOrder.find((focus) => !recentCoreFocuses.slice(0, 3).includes(focus)) ?? coreFocusOrder[(coreFocusOrder.indexOf(recentCoreFocuses[0] ?? "abs") + 1) % coreFocusOrder.length];
  const recommendationLabel = workoutTypeOptions.find((option) => option.value === recommendation)?.label ?? "Full body";
  const lastDone = lastByFocus[recommendation];

  return {
    recommendation,
    recommendationLabel,
    reason: lastDone
      ? `${recommendationLabel} has not appeared since ${lastDone}, and the last three sessions were ${recentFocuses.join(", ") || "empty"}.`
      : `${recommendationLabel} is the first focus not present in your recent history.`,
    nextCoreFocus,
    recent,
    lastByFocus,
  };
}
