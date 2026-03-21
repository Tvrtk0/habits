import { useState, useRef, useEffect, useCallback } from "react";
import { Flame, MessageSquare } from "lucide-react";
import type { Habit, Completion } from "../../models/types";

interface HabitCardProps {
  habit: Habit;
  completion?: Completion;
  streak: number;
  readOnly?: boolean;
  onToggle: () => void;
  onIncrement: (value: number) => void;
  onTimerUpdate: (seconds: number) => void;
  onNote: (note: string) => void;
  onEdit: () => void;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatTimerDisplay(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function HabitCard({
  habit,
  completion,
  streak,
  readOnly,
  onToggle,
  onIncrement,
  onTimerUpdate,
  onNote,
  onEdit,
}: HabitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [noteText, setNoteText] = useState(completion?.note ?? "");
  const [timerRunning, setTimerRunning] = useState(false);
  const timerStartRef = useRef<number>(0);
  const timerBaseRef = useRef<number>(completion?.value ?? 0);
  const [timerDisplay, setTimerDisplay] = useState(completion?.value ?? 0);

  // Sync note text with completion
  useEffect(() => {
    setNoteText(completion?.note ?? "");
  }, [completion?.note]);

  // Timer logic using Date.now() diffing
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timerStartRef.current) / 1000);
      setTimerDisplay(timerBaseRef.current + elapsed);
    }, 200);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const handleTimerToggle = useCallback(() => {
    if (timerRunning) {
      const elapsed = Math.floor((Date.now() - timerStartRef.current) / 1000);
      const total = timerBaseRef.current + elapsed;
      timerBaseRef.current = total;
      setTimerRunning(false);
      onTimerUpdate(total);
    } else {
      timerBaseRef.current = completion?.value ?? 0;
      timerStartRef.current = Date.now();
      setTimerRunning(true);
    }
  }, [timerRunning, completion?.value, onTimerUpdate]);

  const value = completion?.value ?? 0;
  const done =
    habit.type === "boolean"
      ? value >= 1
      : habit.target
        ? value >= (habit.type === "timer" ? habit.target * 60 : habit.target)
        : value > 0;

  return (
    <div
      className={`bg-white dark:bg-[#262626] rounded-lg shadow-sm overflow-hidden transition-colors ${
        done ? "opacity-80" : ""
      }`}
      style={{ borderLeft: `3px solid ${habit.color}` }}
    >
      <div className="flex items-center gap-3 px-3 py-3">
        {/* Type-specific input */}
        {habit.type === "boolean" && (
          <button
            onClick={readOnly ? undefined : onToggle}
            disabled={readOnly}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              done
                ? "border-transparent bg-green-500 text-white scale-100"
                : "border-gray-300 dark:border-gray-600"
            }`}
            style={done ? { backgroundColor: habit.color } : undefined}
          >
            {done && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3 7l3 3 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        )}

        {habit.type === "counter" && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => !readOnly && onIncrement(Math.max(0, value - 1))}
              disabled={readOnly || value <= 0}
              className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm font-bold flex items-center justify-center disabled:opacity-30"
            >
              -
            </button>
            <span
              className="text-sm font-semibold min-w-[2.5rem] text-center"
              style={{ color: done ? habit.color : undefined }}
            >
              {value}
              {habit.target ? `/${habit.target}` : ""}
            </span>
            <button
              onClick={() => !readOnly && onIncrement(value + 1)}
              disabled={readOnly}
              className="w-7 h-7 rounded-full text-white text-sm font-bold flex items-center justify-center disabled:opacity-30"
              style={{ backgroundColor: habit.color }}
            >
              +
            </button>
          </div>
        )}

        {habit.type === "timer" && (
          <button
            onClick={readOnly ? undefined : handleTimerToggle}
            disabled={readOnly}
            className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold flex-shrink-0 transition-colors ${
              timerRunning
                ? "text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            }`}
            style={timerRunning ? { backgroundColor: habit.color } : undefined}
          >
            {timerRunning
              ? formatTimer(timerDisplay)
              : value > 0
                ? formatTimerDisplay(value)
                : "Start"}
            {habit.target ? ` / ${habit.target}m` : ""}
          </button>
        )}

        {/* Habit name & expand area */}
        <button
          className="flex-1 text-left min-w-0"
          onClick={() => setExpanded(!expanded)}
        >
          <p
            className={`text-sm font-medium truncate ${
              done
                ? "line-through text-gray-400 dark:text-gray-500"
                : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {habit.name}
          </p>
        </button>

        {/* Streak badge */}
        {streak > 0 && (
          <span className="flex items-center gap-0.5 text-xs text-orange-500 flex-shrink-0">
            <Flame size={13} />
            {streak}
          </span>
        )}

        {/* Edit */}
        <button
          onClick={onEdit}
          className="p-1 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 flex-shrink-0"
        >
          <MessageSquare size={14} />
        </button>
      </div>

      {/* Expanded note */}
      {expanded && (
        <div className="px-3 pb-3">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onBlur={() => onNote(noteText)}
            placeholder="Add a note..."
            rows={2}
            className="w-full px-2 py-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/40"
          />
        </div>
      )}
    </div>
  );
}
