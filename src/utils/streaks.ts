import { subDays } from "date-fns";
import { toDateString, isScheduledForDate } from "./dates";
import type { Completion, Habit } from "../models/types";

export function calculateStreak(
  habit: Habit,
  completions: Completion[],
): { current: number; best: number } {
  const completionSet = new Set(
    completions
      .filter((c) => c.habitId === habit.id)
      .map((c) => c.date),
  );

  let current = 0;
  let best = 0;
  let streak = 0;
  const now = new Date();

  // Walk back up to 365 days
  for (let i = 0; i <= 365; i++) {
    const dateStr = toDateString(subDays(now, i));
    const scheduled = isScheduledForDate(habit.frequency, habit.customDays, dateStr);
    if (!scheduled) continue;

    const completed = completionSet.has(dateStr);

    if (completed) {
      streak++;
      if (i <= 1 || current > 0) {
        // Still counting current streak (allow today or yesterday as start)
        current = streak;
      }
    } else {
      // For current streak: skip today if not yet completed
      if (i === 0) {
        continue;
      }
      best = Math.max(best, streak);
      if (current === 0) current = 0;
      streak = 0;
      // Once current streak is broken, we need to keep scanning for best
      if (current > 0) {
        // Current streak ended
        break;
      }
    }
  }
  best = Math.max(best, streak);

  return { current, best };
}

export function calculateCurrentStreak(
  habit: Habit,
  completions: Completion[],
): number {
  return calculateStreak(habit, completions).current;
}
