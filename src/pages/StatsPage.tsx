import { useState, useMemo } from "react";
import { Flame, TrendingUp, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { subDays, format } from "date-fns";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { db } from "../db";
import { useHabits } from "../hooks/useHabits";
import { toDateString, isScheduledForDate } from "../utils/dates";
import { calculateStreak } from "../utils/streaks";

type TimeRange = "7" | "30" | "90";

export function StatsPage() {
  const [range, setRange] = useState<TimeRange>("30");
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);

  const { habits } = useHabits();
  const allCompletions = useLiveQuery(() => db.completions.toArray());

  const rangeDays = Number(range);
  const now = new Date();

  // Generate date strings for the range
  const rangeDates = useMemo(
    () =>
      Array.from({ length: rangeDays }, (_, i) =>
        toDateString(subDays(now, rangeDays - 1 - i)),
      ),
    [rangeDays],
  );

  // Overall stats
  const overallStats = useMemo(() => {
    if (!habits || !allCompletions) return { total: 0, rate: 0, completions: 0 };

    let scheduledCount = 0;
    let completedCount = 0;

    for (const date of rangeDates) {
      for (const habit of habits) {
        if (!isScheduledForDate(habit.frequency, habit.customDays, date)) continue;
        scheduledCount++;
        const comp = allCompletions.find(
          (c) => c.habitId === habit.id && c.date === date,
        );
        if (comp) {
          if (habit.type === "boolean" && comp.value >= 1) completedCount++;
          else if (habit.type === "counter" && habit.target && comp.value >= habit.target) completedCount++;
          else if (habit.type === "timer" && habit.target && comp.value >= habit.target * 60) completedCount++;
          else if (!habit.target && comp.value > 0) completedCount++;
        }
      }
    }

    return {
      total: habits.length,
      rate: scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0,
      completions: allCompletions.length,
    };
  }, [habits, allCompletions, rangeDates]);

  // Daily completion rate trend data
  const trendData = useMemo(() => {
    if (!habits || !allCompletions) return [];

    return rangeDates.map((date) => {
      let scheduled = 0;
      let completed = 0;

      for (const habit of habits) {
        if (!isScheduledForDate(habit.frequency, habit.customDays, date)) continue;
        scheduled++;
        const comp = allCompletions.find(
          (c) => c.habitId === habit.id && c.date === date,
        );
        if (comp) {
          if (habit.type === "boolean" && comp.value >= 1) completed++;
          else if (habit.target && habit.type === "counter" && comp.value >= habit.target) completed++;
          else if (habit.target && habit.type === "timer" && comp.value >= habit.target * 60) completed++;
          else if (!habit.target && comp.value > 0) completed++;
        }
      }

      return {
        date: format(new Date(date), "MMM d"),
        rate: scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
      };
    });
  }, [habits, allCompletions, rangeDates]);

  // Per-habit stats
  function getHabitStats(habitId: string) {
    if (!habits || !allCompletions) return null;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return null;

    const streak = calculateStreak(habit, allCompletions);

    let scheduled = 0;
    let completed = 0;
    for (const date of rangeDates) {
      if (!isScheduledForDate(habit.frequency, habit.customDays, date)) continue;
      scheduled++;
      const comp = allCompletions.find(
        (c) => c.habitId === habit.id && c.date === date,
      );
      if (comp) {
        if (habit.type === "boolean" && comp.value >= 1) completed++;
        else if (habit.target && habit.type === "counter" && comp.value >= habit.target) completed++;
        else if (habit.target && habit.type === "timer" && comp.value >= habit.target * 60) completed++;
        else if (!habit.target && comp.value > 0) completed++;
      }
    }

    const rate = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0;

    // Chart data for this habit
    const chartData = rangeDates.map((date) => {
      const comp = allCompletions.find(
        (c) => c.habitId === habit.id && c.date === date,
      );
      return {
        date: format(new Date(date), "MMM d"),
        value: comp?.value ?? 0,
      };
    });

    return { streak, rate, completed, scheduled, chartData };
  }

  const rangeOptions: { value: TimeRange; label: string }[] = [
    { value: "7", label: "7d" },
    { value: "30", label: "30d" },
    { value: "90", label: "90d" },
  ];

  return (
    <div className="pb-4 space-y-6">
      {/* Range toggle */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {rangeOptions.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setRange(value)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              range === value
                ? "bg-white dark:bg-[#2c2c2e] text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#2c2c2e] rounded-lg p-3 shadow-sm text-center">
          <TrendingUp size={18} className="mx-auto mb-1 text-indigo-500" />
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {overallStats.total}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Habits</p>
        </div>
        <div className="bg-white dark:bg-[#2c2c2e] rounded-lg p-3 shadow-sm text-center">
          <CheckCircle2 size={18} className="mx-auto mb-1 text-green-500" />
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {overallStats.rate}%
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            Completion
          </p>
        </div>
        <div className="bg-white dark:bg-[#2c2c2e] rounded-lg p-3 shadow-sm text-center">
          <Flame size={18} className="mx-auto mb-1 text-orange-500" />
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {overallStats.completions}
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Total</p>
        </div>
      </div>

      {/* Trend chart */}
      <div className="bg-white dark:bg-[#2c2c2e] rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Daily Completion Rate
        </h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              interval={Math.max(Math.floor(rangeDays / 6) - 1, 0)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              width={35}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
              formatter={(value) => [`${value}%`, "Rate"]}
            />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-habit breakdown */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Per Habit
        </h3>
        <div className="space-y-2">
          {habits?.map((habit) => {
            const stats = getHabitStats(habit.id);
            if (!stats) return null;
            const isExpanded = expandedHabit === habit.id;

            return (
              <div
                key={habit.id}
                className="bg-white dark:bg-[#2c2c2e] rounded-lg shadow-sm overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedHabit(isExpanded ? null : habit.id)
                  }
                  className="w-full flex items-center gap-3 px-3 py-3"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: habit.color }}
                  />
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 text-left truncate">
                    {habit.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {stats.rate}%
                  </span>
                  <span className="flex items-center gap-0.5 text-xs text-orange-500">
                    <Flame size={12} />
                    {stats.streak.current}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3">
                    <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        Current streak:{" "}
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {stats.streak.current}
                        </span>
                      </span>
                      <span>
                        Best:{" "}
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {stats.streak.best}
                        </span>
                      </span>
                      <span>
                        Done:{" "}
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {stats.completed}/{stats.scheduled}
                        </span>
                      </span>
                    </div>
                    <ResponsiveContainer width="100%" height={100}>
                      <LineChart data={stats.chartData}>
                        <XAxis dataKey="date" hide />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            fontSize: 11,
                            borderRadius: 8,
                            border: "none",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={habit.color}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
