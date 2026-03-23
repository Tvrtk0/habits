import { useState, useEffect } from "react";
import { X, Check, Tally5, Timer, Trash2, Archive } from "lucide-react";
import type { Habit } from "../../models/types";
import { useCategories } from "../../hooks/useCategories";
import { PRESET_COLORS } from "../../utils/colors";

type HabitType = Habit["type"];
type Frequency = Habit["frequency"];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface HabitFormProps {
  habit?: Habit;
  onSave: (
    data: Omit<Habit, "id" | "createdAt" | "updatedAt" | "sortOrder" | "archived">,
  ) => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onClose: () => void;
}

export function HabitForm({ habit, onSave, onDelete, onArchive, onClose }: HabitFormProps) {
  const { categories, addCategory } = useCategories();

  const [name, setName] = useState(habit?.name ?? "");
  const [description, setDescription] = useState(habit?.description ?? "");
  const [type, setType] = useState<HabitType>(habit?.type ?? "boolean");
  const [target, setTarget] = useState<string>(habit?.target?.toString() ?? "");
  const [frequency, setFrequency] = useState<Frequency>(habit?.frequency ?? "daily");
  const [customDays, setCustomDays] = useState<number[]>(habit?.customDays ?? [1, 2, 3, 4, 5]);
  const [category, setCategory] = useState(habit?.category ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [color, setColor] = useState(habit?.color ?? PRESET_COLORS[7]);
  const [reminderTime, setReminderTime] = useState(habit?.reminderTime ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = `-${window.scrollY}px`;
    const scrollY = window.scrollY;
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.top = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      target: type !== "boolean" && target ? Number(target) : undefined,
      frequency,
      customDays: frequency === "custom" ? customDays : undefined,
      category: category || undefined,
      color,
      reminderTime: reminderTime || undefined,
    });
  }

  async function handleAddCategory() {
    if (!newCategory.trim()) return;
    const cat = await addCategory(newCategory.trim(), color);
    setCategory(cat.id);
    setNewCategory("");
    setShowNewCategory(false);
  }

  function toggleDay(day: number) {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  const typeOptions: { value: HabitType; icon: typeof Check; label: string }[] = [
    { value: "boolean", icon: Check, label: "Yes/No" },
    { value: "counter", icon: Tally5, label: "Counter" },
    { value: "timer", icon: Timer, label: "Timer" },
  ];

  const frequencyOptions: { value: Frequency; label: string }[] = [
    { value: "daily", label: "Daily" },
    { value: "weekdays", label: "Weekdays" },
    { value: "weekends", label: "Weekends" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in" style={{ height: "100dvh" }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} onTouchMove={(e) => e.preventDefault()} />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#2c2c2e] rounded-t-2xl flex flex-col animate-slide-up" style={{ maxHeight: "85dvh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#3a3a3c]">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {habit ? "Edit Habit" : "New Habit"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-5" style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}>
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Read for 30 minutes"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#3a3a3c] bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#3a3a3c] bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <div className="flex gap-2">
              {typeOptions.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    type === value
                      ? "bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-gray-100 ring-1 ring-indigo-200 dark:ring-white/20"
                      : "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-500"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Target (counter/timer only) */}
          {type !== "boolean" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target {type === "counter" ? "(times)" : "(minutes)"}
              </label>
              <input
                type="number"
                min="1"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={type === "counter" ? "e.g. 8" : "e.g. 30"}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#3a3a3c] bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
          )}

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frequency
            </label>
            <div className="flex gap-2 flex-wrap">
              {frequencyOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFrequency(value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    frequency === value
                      ? "bg-indigo-50 dark:bg-white/10 text-indigo-600 dark:text-gray-100 ring-1 ring-indigo-200 dark:ring-white/20"
                      : "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {frequency === "custom" && (
              <div className="flex gap-1.5 mt-3">
                {DAYS.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                      customDays.includes(idx)
                        ? "bg-indigo-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {label.charAt(0)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            {!showNewCategory ? (
              <div className="flex gap-2">
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === "__new__") {
                      setShowNewCategory(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#3a3a3c] bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="">None</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="__new__">+ New category</option>
                </select>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Category name"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#3a3a3c] bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3 py-2 bg-indigo-500 text-white text-sm rounded-lg"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewCategory(false)}
                  className="px-3 py-2 text-gray-500 text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    color === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-[#2c2c2e]" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Reminder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reminder <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#3a3a3c] bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 pb-4">
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-2.5 bg-indigo-500 text-white text-sm font-medium rounded-lg disabled:opacity-40 transition-opacity"
            >
              {habit ? "Save Changes" : "Create Habit"}
            </button>
          </div>

          {/* Edit-only actions */}
          {habit && (
            <div className="flex gap-2 pb-6">
              <button
                type="button"
                onClick={onArchive}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg"
              >
                <Archive size={15} />
                Archive
              </button>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 rounded-lg"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-white bg-red-500 rounded-lg"
                >
                  <Trash2 size={15} />
                  Confirm Delete
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
