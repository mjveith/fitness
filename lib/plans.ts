import { getWeekStart, addDays, formatDate } from "@/lib/date";
import { getWorkoutPlanByWeek, listExercises, upsertWorkoutPlan } from "@/lib/db";
import { Exercise, SplitType, WorkoutPlan, WorkoutPlanDay } from "@/lib/types";

const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

function generateDays(split: SplitType, weekStartDate: string): WorkoutPlanDay[] {
  const exercises = listExercises();
  const monday = new Date(`${weekStartDate}T00:00:00`);
  const strengthMix = [
    ...chooseExercises(exercises, "chest", 2, 0),
    ...chooseExercises(exercises, "shoulders", 1, 1),
    ...chooseExercises(exercises, "arms", 1, 3),
  ];
  const pullMix = [
    ...chooseExercises(exercises, "back", 3, 1),
    ...chooseExercises(exercises, "arms", 1, 0),
    ...chooseExercises(exercises, "core", 1, 2),
  ];
  const legMix = [
    ...chooseExercises(exercises, "legs", 4, 0),
    ...chooseExercises(exercises, "core", 1, 0),
  ];
  const hiitMix = [
    ...chooseExercises(exercises, "cardio", 2, 0),
    ...chooseExercises(exercises, "plyo", 2, 0),
  ];
  const upperMix = [
    ...chooseExercises(exercises, "chest", 1, 2),
    ...chooseExercises(exercises, "back", 2, 0),
    ...chooseExercises(exercises, "shoulders", 1, 0),
    ...chooseExercises(exercises, "arms", 1, 5),
  ];
  const fullBodyMix = [
    ...chooseExercises(exercises, "legs", 2, 2),
    ...chooseExercises(exercises, "chest", 1, 4),
    ...chooseExercises(exercises, "back", 1, 3),
    ...chooseExercises(exercises, "core", 1, 4),
  ];

  const templates: Record<SplitType, Array<{ workoutType: string; focus: string; exercises: Exercise[] }>> = {
    ppl: [
      { workoutType: "Push Strength", focus: "Chest, shoulders, triceps", exercises: strengthMix },
      { workoutType: "Pull Strength", focus: "Back and biceps", exercises: pullMix },
      { workoutType: "Leg Strength", focus: "Quads, glutes, hamstrings", exercises: legMix },
      { workoutType: "HIIT", focus: "Sprints and explosive conditioning", exercises: hiitMix },
      { workoutType: "Push Volume", focus: "Pressing volume and accessories", exercises: [...strengthMix].reverse() },
      { workoutType: "Pull Volume", focus: "Rows, pulldowns, arm finishers", exercises: [...pullMix].reverse() },
      { workoutType: "Rest / Recovery", focus: "Walk, mobility, and soft tissue work", exercises: [] },
    ],
    "upper-lower": [
      { workoutType: "Upper Strength", focus: "Chest, back, shoulders, arms", exercises: upperMix },
      { workoutType: "Lower Strength", focus: "Squat and hinge emphasis", exercises: legMix },
      { workoutType: "HIIT", focus: "Conditioning and power", exercises: hiitMix },
      { workoutType: "Upper Volume", focus: "Pull and press accessories", exercises: [...upperMix].reverse() },
      { workoutType: "Lower Volume", focus: "Single-leg work and posterior chain", exercises: [...legMix].reverse() },
      { workoutType: "Full Body", focus: "Mixed strength circuit", exercises: fullBodyMix },
      { workoutType: "Rest / Recovery", focus: "Restore and prepare for next week", exercises: [] },
    ],
    "full-body": [
      { workoutType: "Full Body A", focus: "Squat, press, row", exercises: fullBodyMix },
      { workoutType: "Cardio Intervals", focus: "Work capacity and pace changes", exercises: hiitMix },
      { workoutType: "Full Body B", focus: "Hinge, pull, unilateral work", exercises: [...fullBodyMix].reverse() },
      { workoutType: "Plyometric Session", focus: "Elasticity and landing mechanics", exercises: chooseExercises(exercises, "plyo", 5, 3) },
      { workoutType: "Full Body C", focus: "Strength plus trunk stability", exercises: [...fullBodyMix, ...chooseExercises(exercises, "arms", 1, 2)] },
      { workoutType: "Steady Conditioning", focus: "Aerobic support and recovery", exercises: chooseExercises(exercises, "cardio", 4, 4) },
      { workoutType: "Rest / Recovery", focus: "Easy movement only", exercises: [] },
    ],
  };

  return templates[split].map((template, index) =>
    buildDay(index, formatDate(addDays(monday, index)), template.workoutType, template.focus, template.exercises),
  );
}

export function getOrCreateCurrentPlan(split: SplitType = "ppl") {
  const weekStartDate = formatDate(getWeekStart());
  const existing = getWorkoutPlanByWeek(weekStartDate);

  if (existing) {
    return existing;
  }

  return createWorkoutPlan(split, weekStartDate);
}

export function createWorkoutPlan(split: SplitType, weekStartDate = formatDate(getWeekStart())) {
  const plan: WorkoutPlan = {
    id: `plan-${weekStartDate}-${split}`,
    weekStartDate,
    split,
    days: generateDays(split, weekStartDate),
  };

  upsertWorkoutPlan(plan);
  return plan;
}
