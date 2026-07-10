import { getWorkoutLogs } from "@/lib/db";

export function getRecentSummary(limit = 20) {
  const logs = getWorkoutLogs(limit);

  return {
    completedSessions: logs.length,
    totalVolume: logs.reduce((sum, log) => sum + log.totalVolume, 0),
    totalExercisesLogged: logs.reduce((sum, log) => sum + log.entries.length, 0),
  };
}

export const getWeeklySummary = getRecentSummary;
