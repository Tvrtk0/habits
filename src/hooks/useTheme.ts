import { useState, useEffect } from "react";
import type { ThemeMode } from "../models/types";

const STORAGE_KEY = "habit-tracker-theme";

function getStoredTheme(): ThemeMode {
  return (localStorage.getItem(STORAGE_KEY) as ThemeMode) || "system";
}

function applyTheme(mode: ThemeMode) {
  const isDark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", isDark);
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(getStoredTheme);

  useEffect(() => {
    applyTheme(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  // Listen for system theme changes when in "system" mode
  useEffect(() => {
    if (mode !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  return { mode, setMode };
}
