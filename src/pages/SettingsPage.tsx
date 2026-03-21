import { useState, useRef } from "react";
import { ArrowLeft, Moon, Sun, Monitor, Download, Upload, Trash2, Bell, BellOff, ArchiveRestore } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { useTheme } from "../hooks/useTheme";
import { useHabits } from "../hooks/useHabits";
import { requestPermission } from "../hooks/useNotifications";
import { exportData, importData, clearAllData } from "../utils/export";
import type { ThemeMode } from "../models/types";

const themeOptions: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();
  const { updateHabit, deleteHabit } = useHabits();
  const fileRef = useRef<HTMLInputElement>(null);

  const archivedHabits = useLiveQuery(async () => {
    const all = await db.habits.toArray();
    return all.filter((h) => h.archived);
  });

  const [importMode, setImportMode] = useState<"merge" | "replace" | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [clearStep, setClearStep] = useState(0); // 0=idle, 1=confirm, 2=type DELETE
  const [deleteText, setDeleteText] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem("habit-notifications") === "true",
  );

  function showMessage(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleExport() {
    await exportData();
    showMessage("Data exported!");
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportMode("merge"); // show mode selector
  }

  async function handleImport() {
    if (!importFile || !importMode) return;
    try {
      const result = await importData(importFile, importMode);
      showMessage(
        importMode === "replace"
          ? `Replaced with ${result.habits} habits, ${result.completions} completions`
          : `Imported ${result.habits} habits, ${result.completions} completions`,
      );
    } catch {
      showMessage("Invalid backup file");
    }
    setImportFile(null);
    setImportMode(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleClear() {
    await clearAllData();
    setClearStep(0);
    setDeleteText("");
    showMessage("All data cleared");
  }

  async function handleToggleNotifications() {
    if (!notificationsEnabled) {
      const granted = await requestPermission();
      if (!granted) {
        showMessage("Notification permission denied");
        return;
      }
    }
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    localStorage.setItem("habit-notifications", String(next));
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-6 -ml-1"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Toast message */}
      {message && (
        <div className="mb-4 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm rounded-lg text-center">
          {message}
        </div>
      )}

      {/* Appearance */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Appearance
        </h2>
        <div className="bg-white dark:bg-[#262626] rounded-lg shadow-sm overflow-hidden">
          <div className="p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Theme
            </p>
            <div className="flex gap-2">
              {themeOptions.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg text-xs font-medium transition-colors ${
                    mode === value
                      ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-500/30"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Notifications
        </h2>
        <div className="bg-white dark:bg-[#262626] rounded-lg shadow-sm overflow-hidden">
          <button
            onClick={handleToggleNotifications}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-2">
              {notificationsEnabled ? (
                <Bell size={16} className="text-indigo-500" />
              ) : (
                <BellOff size={16} className="text-gray-400" />
              )}
              <span className="text-sm text-gray-900 dark:text-gray-100">
                Reminders
              </span>
            </div>
            <div
              className={`w-10 h-6 rounded-full transition-colors relative ${
                notificationsEnabled ? "bg-indigo-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  notificationsEnabled ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </div>
          </button>
          <p className="px-4 pb-3 text-[11px] text-gray-400 dark:text-gray-500">
            Reminders only work while the app is open. Set per-habit reminder times in the habit edit screen.
          </p>
        </div>
      </section>

      {/* Archived Habits */}
      {archivedHabits && archivedHabits.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Archived ({archivedHabits.length})
          </h2>
          <div className="bg-white dark:bg-[#262626] rounded-lg shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
            {archivedHabits.map((habit) => (
              <div key={habit.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: habit.color }}
                />
                <span className="flex-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                  {habit.name}
                </span>
                <button
                  onClick={() => updateHabit(habit.id, { archived: false })}
                  className="p-1.5 text-indigo-500 hover:text-indigo-600"
                  title="Restore"
                >
                  <ArchiveRestore size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${habit.name}" permanently?`)) {
                      deleteHabit(habit.id);
                    }
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-500"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Data */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Data
        </h2>
        <div className="bg-white dark:bg-[#262626] rounded-lg shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
          >
            <Download size={16} className="text-gray-400" />
            Export All Data
          </button>

          <div>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
            >
              <Upload size={16} className="text-gray-400" />
              Import Data
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Import mode selector */}
            {importFile && (
              <div className="px-4 pb-3 space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {importFile.name}
                </p>
                <div className="flex gap-2">
                  {(["merge", "replace"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setImportMode(m)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        importMode === m
                          ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-500/30"
                          : "bg-gray-50 dark:bg-gray-800 text-gray-500"
                      }`}
                    >
                      {m === "merge" ? "Merge" : "Replace"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleImport}
                  className="w-full py-2 bg-indigo-500 text-white text-xs font-medium rounded-md"
                >
                  Import ({importMode})
                </button>
              </div>
            )}
          </div>

          <div>
            {clearStep === 0 && (
              <button
                onClick={() => setClearStep(1)}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 dark:text-red-400"
              >
                <Trash2 size={16} />
                Clear All Data
              </button>
            )}
            {clearStep === 1 && (
              <div className="px-4 py-3 space-y-2">
                <p className="text-xs text-red-500">
                  Are you sure? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setClearStep(2)}
                    className="flex-1 py-1.5 bg-red-500 text-white text-xs font-medium rounded-md"
                  >
                    Yes, continue
                  </button>
                  <button
                    onClick={() => setClearStep(0)}
                    className="flex-1 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs font-medium rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {clearStep === 2 && (
              <div className="px-4 py-3 space-y-2">
                <p className="text-xs text-red-500">
                  Type DELETE to confirm
                </p>
                <input
                  type="text"
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-red-300 dark:border-red-700 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 text-sm focus:outline-none"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleClear}
                    disabled={deleteText !== "DELETE"}
                    className="flex-1 py-1.5 bg-red-500 text-white text-xs font-medium rounded-md disabled:opacity-40"
                  >
                    Delete Everything
                  </button>
                  <button
                    onClick={() => { setClearStep(0); setDeleteText(""); }}
                    className="flex-1 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs font-medium rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-gray-400 dark:text-gray-600">
        Habit Tracker v1.0.0
      </p>
    </div>
  );
}
