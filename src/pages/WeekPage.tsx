import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { startOfWeek, addDays, subWeeks, addWeeks, format, isToday as checkIsToday } from "date-fns";
import { db } from "../db";
import { useHabits } from "../hooks/useHabits";
import { toDateString, isScheduledForDate } from "../utils/dates";

export function WeekPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const navigate = useNavigate();

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    if (weekOffset < 0) return subWeeks(base, Math.abs(weekOffset));
    if (weekOffset > 0) return addWeeks(base, weekOffset);
    return base;
  }, [weekOffset]);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const dayStrings = useMemo(() => days.map(toDateString), [days]);

  const { habits } = useHabits();

  const completions = useLiveQuery(
    () =>
      db.completions
        .where("date")
        .between(dayStrings[0], dayStrings[6], true, true)
        .toArray(),
    [dayStrings[0], dayStrings[6]],
  );

  const compMap = useMemo(() => {
    const map = new Map<string, { value: number }>();
    if (!completions) return map;
    for (const c of completions) {
      map.set(`${c.habitId}:${c.date}`, c);
    }
    return map;
  }, [completions]);

  const weekLabel = `${format(days[0], "MMM d")} – ${format(days[6], "MMM d")}`;

  async function handleCellTap(habitId: string, date: string, habit: NonNullable<typeof habits>[number]) {
    if (habit.type === "boolean") {
      const existing = await db.completions.where("[habitId+date]").equals([habitId, date]).first();
      const now = new Date().toISOString();
      if (existing) {
        await db.completions.delete(existing.id);
      } else {
        await db.completions.add({
          id: crypto.randomUUID(),
          habitId,
          date,
          type: "boolean",
          value: 1,
          createdAt: now,
          updatedAt: now,
        });
      }
    } else {
      // Counter and timer — navigate to Today view with that date
      navigate(`/?date=${date}`);
    }
  }

  return (
    <div className="pb-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset((o) => o - 1)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => setWeekOffset(0)}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {weekLabel}
        </button>
        <button
          onClick={() => setWeekOffset((o) => o + 1)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          disabled={weekOffset >= 0}
        >
          <ChevronRight size={20} className={weekOffset >= 0 ? "opacity-30" : ""} />
        </button>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[minmax(0,1fr)_repeat(7,2.5rem)] gap-1 mb-2 justify-center">
        <div />
        {days.map((d, i) => (
          <div
            key={i}
            className={`text-center text-xs font-medium ${
              checkIsToday(d)
                ? "text-indigo-500"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            <div>{format(d, "EEE").charAt(0)}</div>
            <div>{format(d, "d")}</div>
          </div>
        ))}
      </div>

      {/* Habit rows */}
      {!habits || habits.length === 0 ? (
        <div className="text-center text-gray-400 dark:text-gray-600 py-16">
          <p className="text-sm">No habits yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="grid grid-cols-[minmax(0,1fr)_repeat(7,2.5rem)] gap-1 items-center justify-center"
            >
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate pr-1">
                {habit.name}
              </p>
              {dayStrings.map((dateStr, i) => {
                const scheduled = isScheduledForDate(habit.frequency, habit.customDays, dateStr);
                if (!scheduled) {
                  return (
                    <div key={i} className="flex justify-center">
                      <div className="w-6 h-6 rounded-md bg-gray-50 dark:bg-[#2c2c2e]" />
                    </div>
                  );
                }
                const comp = compMap.get(`${habit.id}:${dateStr}`);
                const value = comp?.value ?? 0;
                let opacity = 0;
                let label = "";

                if (habit.type === "boolean") {
                  opacity = value >= 1 ? 1 : 0;
                } else if (habit.type === "counter") {
                  const target = habit.target ?? 1;
                  opacity = Math.min(value / target, 1);
                  label = `${value}`;
                } else {
                  const targetSec = (habit.target ?? 1) * 60;
                  opacity = Math.min(value / targetSec, 1);
                  label = value > 0 ? `${Math.floor(value / 60)}` : "";
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleCellTap(habit.id, dateStr, habit)}
                    className="flex items-center justify-center"
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-semibold transition-colors"
                      style={{
                        backgroundColor:
                          opacity > 0
                            ? `${habit.color}${Math.round(opacity * 200 + 55).toString(16).padStart(2, "0")}`
                            : undefined,
                        color: opacity > 0.5 ? "white" : undefined,
                      }}
                    >
                      {habit.type === "boolean" ? (
                        opacity > 0 ? (
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                            <path d="M3 7l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <div className="w-6 h-6 rounded-md border border-gray-200 dark:border-[#3a3a3c]" />
                        )
                      ) : (
                        <span className={opacity === 0 ? "text-gray-300 dark:text-gray-600" : ""}>
                          {label || "·"}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
