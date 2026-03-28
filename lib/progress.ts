import { getWeekStart, formatDate } from "@/lib/date";
import { getWorkoutLogs } from "@/lib/db";
import { getOrCreateCurrentPlan } from "@/lib/plans";

export function getWeeklySummary() {
  const weekStartDate = formatDate(getWeekStart());
  const plan = getOrCreateCurrentPlan();
  const logs = getWorkoutLogs(50).filter((log) => log.weekStartDate === weekStartDate);

  return {
    weekStartDate,
    plannedSessions: plan.days.filter((day) => day.exercises.length > 0).length,
    completedSessions: logs.length,
    totalVolume: logs.reduce((sum, log) => sum + log.totalVolume, 0),
    totalExercisesLogged: logs.reduce((sum, log) => sum + log.entries.length, 0),
  };
}
