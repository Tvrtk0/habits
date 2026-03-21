import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isToday as checkIsToday,
} from "date-fns";
import { db } from "../db";
import { useHabits } from "../hooks/useHabits";
import { toDateString } from "../utils/dates";
import { calculateStreak } from "../utils/streaks";

export function MonthPage() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedHabitId, setSelectedHabitId] = useState<string | "__all__">("__all__");

  const { habits } = useHabits();

  const monthDate = useMemo(() => {
    const now = new Date();
    if (monthOffset < 0) return subMonths(now, Math.abs(monthOffset));
    if (monthOffset > 0) return addMonths(now, monthOffset);
    return now;
  }, [monthOffset]);

  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Build calendar day grid
  const calDays = useMemo(() => {
    const days: Date[] = [];
    let d = calStart;
    while (d <= calEnd) {
      days.push(d);
      d = addDays(d, 1);
    }
    return days;
  }, [calStart.getTime(), calEnd.getTime()]);

  const dateRange = useMemo(
    () => [toDateString(calStart), toDateString(calEnd)] as const,
    [calStart.getTime(), calEnd.getTime()],
  );

  const completions = useLiveQuery(
    () =>
      db.completions
        .where("date")
        .between(dateRange[0], dateRange[1], true, true)
        .toArray(),
    [dateRange[0], dateRange[1]],
  );

  const allCompletions = useLiveQuery(() => db.completions.toArray());

  // Build lookup: date -> aggregated value
  const dayValues = useMemo(() => {
    const map = new Map<string, number>();
    if (!completions || !habits) return map;

    for (const day of calDays) {
      const dateStr = toDateString(day);
      if (!isSameMonth(day, monthDate)) continue;

      if (selectedHabitId === "__all__") {
        // Count completed habits for that day
        const dayComps = completions.filter((c) => c.date === dateStr);
        const done = dayComps.filter((c) => {
          const habit = habits.find((h) => h.id === c.habitId);
          if (!habit) return false;
          if (habit.type === "boolean") return c.value >= 1;
          if (habit.target) return c.value >= (habit.type === "timer" ? habit.target * 60 : habit.target);
          return c.value > 0;
        }).length;
        if (done > 0) map.set(dateStr, done / Math.max(habits.length, 1));
      } else {
        const comp = completions.find(
          (c) => c.date === dateStr && c.habitId === selectedHabitId,
        );
        if (comp) {
          const habit = habits.find((h) => h.id === selectedHabitId);
          if (habit) {
            if (habit.type === "boolean") {
              map.set(dateStr, comp.value >= 1 ? 1 : 0);
            } else {
              const target = habit.type === "timer" ? (habit.target ?? 1) * 60 : (habit.target ?? 1);
              map.set(dateStr, Math.min(comp.value / target, 1));
            }
          }
        }
      }
    }
    return map;
  }, [completions, habits, selectedHabitId, calDays, monthDate]);

  // Streak for selected habit
  const streakInfo = useMemo(() => {
    if (!habits || !allCompletions || selectedHabitId === "__all__") return null;
    const habit = habits.find((h) => h.id === selectedHabitId);
    if (!habit) return null;
    return calculateStreak(habit, allCompletions);
  }, [habits, allCompletions, selectedHabitId]);

  const selectedHabit = habits?.find((h) => h.id === selectedHabitId);
  const accentColor = selectedHabit?.color ?? "#6366f1";

  return (
    <div className="pb-4">
      {/* Habit selector */}
      <div className="mb-4">
        <select
          value={selectedHabitId}
          onChange={(e) => setSelectedHabitId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#3a3a3c] bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        >
          <option value="__all__">All habits</option>
          {habits?.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setMonthOffset((o) => o - 1)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => setMonthOffset(0)}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {format(monthDate, "MMMM yyyy")}
        </button>
        <button
          onClick={() => setMonthOffset((o) => o + 1)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          disabled={monthOffset >= 0}
        >
          <ChevronRight size={20} className={monthOffset >= 0 ? "opacity-30" : ""} />
        </button>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div
            key={i}
            className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calDays.map((day, i) => {
          const dateStr = toDateString(day);
          const inMonth = isSameMonth(day, monthDate);
          const value = dayValues.get(dateStr) ?? 0;
          const isCurrentDay = checkIsToday(day);

          return (
            <div
              key={i}
              className={`aspect-square rounded-md flex items-center justify-center text-xs transition-colors ${
                !inMonth ? "opacity-20" : ""
              } ${isCurrentDay ? "ring-1 ring-indigo-500" : ""}`}
              style={
                inMonth && value > 0
                  ? {
                      backgroundColor: `${accentColor}${Math.round(value * 200 + 55).toString(16).padStart(2, "0")}`,
                      color: value > 0.5 ? "white" : undefined,
                    }
                  : undefined
              }
            >
              <span
                className={
                  inMonth && value === 0
                    ? "text-gray-500 dark:text-gray-500"
                    : ""
                }
              >
                {format(day, "d")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Streak info */}
      {streakInfo && (
        <div className="mt-4 flex gap-4 justify-center">
          <div className="flex items-center gap-1.5 text-sm">
            <Flame size={16} className="text-orange-500" />
            <span className="text-gray-700 dark:text-gray-300">
              Current: <span className="font-semibold">{streakInfo.current}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Flame size={16} className="text-yellow-500" />
            <span className="text-gray-700 dark:text-gray-300">
              Best: <span className="font-semibold">{streakInfo.best}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
