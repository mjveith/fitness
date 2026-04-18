export type ExerciseCategory =
  | "chest"
  | "back"
  | "shoulders"
  | "arms"
  | "legs"
  | "core"
  | "cardio"
  | "plyo";

export type ExerciseType = "strength" | "bodyweight" | "cardio" | "plyo";

export type SplitType = "ppl" | "upper-lower" | "full-body";

export type Exercise = {
  id: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  muscleGroups: string[];
  equipment: string[];
  type: ExerciseType;
  diagrams: string[];
  imageUrls?: [string, string] | null;
  cues: string[];
  defaultSets: number;
  defaultReps: string;
  defaultRestSeconds: number;
};

export type PlanExercise = {
  exerciseId: string;
  name: string;
  type: ExerciseType;
  sets: number;
  reps: string;
  restSeconds: number;
  category: ExerciseCategory;
};

export type WorkoutPlanDay = {
  dayOfWeek: number;
  date: string;
  label: string;
  workoutType: string;
  focus: string;
  exercises: PlanExercise[];
};

export type WorkoutPlan = {
  id: string;
  weekStartDate: string;
  split: SplitType;
  workoutDays: number;
  exercisesPerWorkout: number;
  days: WorkoutPlanDay[];
};

export type LoggedSet = {
  reps?: number;
  weight?: number;
  duration?: number;
  notes?: string;
};

export type WorkoutLogEntryStatus = "completed" | "skipped" | "removed";

export type WorkoutLogEntry = {
  exerciseId: string;
  name: string;
  type: ExerciseType;
  completed: boolean;
  status?: WorkoutLogEntryStatus;
  actualSetCount: number;
  sets: LoggedSet[];
};

export type WorkoutLog = {
  id: string;
  date: string;
  dayName: string;
  weekStartDate: string;
  planId?: string | null;
  entries: WorkoutLogEntry[];
  totalVolume: number;
  durationMinutes?: number | null;
  notes?: string | null;
};
