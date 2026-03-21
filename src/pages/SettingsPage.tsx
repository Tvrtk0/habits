import { ArrowLeft, Moon, Sun, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import type { ThemeMode } from "../models/types";

const themeOptions: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { mode, setMode } = useTheme();

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-6 -ml-1"
      >
        <ArrowLeft size={16} />
        Back
      </button>

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

      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Data
        </h2>
        <div className="bg-white dark:bg-[#262626] rounded-lg shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
          <button className="w-full text-left px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
            Export All Data
          </button>
          <button className="w-full text-left px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
            Import Data
          </button>
          <button className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400">
            Clear All Data
          </button>
        </div>
      </section>

      <p className="text-center text-xs text-gray-400 dark:text-gray-600">
        Habit Tracker v1.0.0
      </p>
    </div>
  );
}
