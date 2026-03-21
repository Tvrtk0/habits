import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useHabits } from "../hooks/useHabits";
import { useCompletions } from "../hooks/useCompletions";
import { useCategories } from "../hooks/useCategories";
import { HabitCard } from "../components/habits/HabitCard";
import { HabitForm } from "../components/habits/HabitForm";
import { today, shiftDate, formatDisplayDate, isScheduledForDate, daysBackFromToday } from "../utils/dates";
import { calculateCurrentStreak } from "../utils/streaks";
import { db } from "../db";
import type { Habit } from "../models/types";

export function TodayPage() {
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get("date") ?? today();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();

  const { habits, addHabit, updateHabit, deleteHabit, archiveHabit } = useHabits();
  const { completions, toggleBoolean, setCounter, setTimer, setNote } = useCompletions(selectedDate);
  const { categories } = useCategories();

  // All completions for streak calculations
  const allCompletions = useLiveQuery(() => db.completions.toArray());

  const isReadOnly = daysBackFromToday(selectedDate) > 7;
  const isToday = selectedDate === today();

  // Filter habits scheduled for selected date
  const scheduledHabits = useMemo(() => {
    if (!habits) return [];
    return habits.filter((h) =>
      isScheduledForDate(h.frequency, h.customDays, selectedDate),
    );
  }, [habits, selectedDate]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, Habit[]>();
    for (const h of scheduledHabits) {
      const key = h.category ?? "";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    }
    return map;
  }, [scheduledHabits]);

  const completionMap = useMemo(() => {
    const map = new Map<string, (typeof completions extends (infer T)[] | undefined ? T : never)>();
    if (!completions) return map;
    for (const c of completions) {
      map.set(c.habitId, c);
    }
    return map;
  }, [completions]);

  const doneCount = scheduledHabits.filter((h) => {
    const c = completionMap.get(h.id);
    if (!c) return false;
    if (h.type === "boolean") return c.value >= 1;
    if (h.target) {
      return c.value >= (h.type === "timer" ? h.target * 60 : h.target);
    }
    return c.value > 0;
  }).length;

  function getCategoryName(id: string): string {
    return categories?.find((c) => c.id === id)?.name ?? "";
  }

  function handleSave(data: Parameters<typeof addHabit>[0]) {
    if (editingHabit) {
      updateHabit(editingHabit.id, data);
    } else {
      addHabit(data);
    }
    setShowForm(false);
    setEditingHabit(undefined);
  }

  return (
    <div className="pb-4">
      {/* Date navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setSelectedDate((d) => shiftDate(d, -1))}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={() => setSelectedDate(today())}
          className="text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {formatDisplayDate(selectedDate)}
        </button>
        <button
          onClick={() => setSelectedDate((d) => shiftDate(d, 1))}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          disabled={isToday}
        >
          <ChevronRight size={20} className={isToday ? "opacity-30" : ""} />
        </button>
      </div>

      {/* Read-only label */}
      {isReadOnly && (
        <p className="text-xs text-center text-amber-500 dark:text-amber-400 mb-3">
          Editing locked — more than 7 days ago
        </p>
      )}

      {/* Progress bar */}
      {scheduledHabits.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>
              {doneCount} of {scheduledHabits.length} done
            </span>
            <span>
              {Math.round((doneCount / scheduledHabits.length) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{
                width: `${(doneCount / scheduledHabits.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Habit list */}
      {scheduledHabits.length === 0 ? (
        <div className="text-center py-16">
          {!habits || habits.length === 0 ? (
            <>
              <div className="text-4xl mb-3">
                <svg width="48" height="48" viewBox="0 0 100 100" className="mx-auto opacity-30">
                  <rect width="100" height="100" rx="20" fill="#6366f1"/>
                  <path d="M28 52l14 14 30-32" stroke="white" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Welcome to Habit Tracker</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Build better habits, one day at a time</p>
              <button
                onClick={() => { setEditingHabit(undefined); setShowForm(true); }}
                className="mt-4 px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg"
              >
                Create your first habit
              </button>
            </>
          ) : (
            <>
              <p className="text-lg text-gray-400 dark:text-gray-500">No habits scheduled</p>
              <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Nothing due on this day</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([catId, catHabits]) => (
            <div key={catId}>
              {catId && (
                <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  {getCategoryName(catId)}
                </p>
              )}
              <div className="space-y-2">
                {catHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    completion={completionMap.get(habit.id)}
                    streak={
                      allCompletions
                        ? calculateCurrentStreak(habit, allCompletions)
                        : 0
                    }
                    readOnly={isReadOnly}
                    onToggle={() => toggleBoolean(habit.id, selectedDate)}
                    onIncrement={(v) => setCounter(habit.id, selectedDate, v)}
                    onTimerUpdate={(s) => setTimer(habit.id, selectedDate, s)}
                    onNote={(n) => setNote(habit.id, selectedDate, n)}
                    onEdit={() => {
                      setEditingHabit(habit);
                      setShowForm(true);
                    }}
                    onArchive={() => archiveHabit(habit.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => {
          setEditingHabit(undefined);
          setShowForm(true);
        }}
        className="fixed bottom-20 right-4 w-14 h-14 bg-indigo-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-600 transition-colors z-40"
        style={{ marginBottom: "var(--safe-bottom)" }}
      >
        <Plus size={24} />
      </button>

      {/* Form modal */}
      {showForm && (
        <HabitForm
          habit={editingHabit}
          onSave={handleSave}
          onDelete={
            editingHabit
              ? () => {
                  deleteHabit(editingHabit.id);
                  setShowForm(false);
                  setEditingHabit(undefined);
                }
              : undefined
          }
          onArchive={
            editingHabit
              ? () => {
                  archiveHabit(editingHabit.id);
                  setShowForm(false);
                  setEditingHabit(undefined);
                }
              : undefined
          }
          onClose={() => {
            setShowForm(false);
            setEditingHabit(undefined);
          }}
        />
      )}
    </div>
  );
}
