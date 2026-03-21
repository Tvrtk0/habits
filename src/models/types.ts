export interface Habit {
  id: string;
  name: string;
  description?: string;
  type: "boolean" | "counter" | "timer";
  target?: number;
  frequency: "daily" | "weekdays" | "weekends" | "custom";
  customDays?: number[]; // 0=Sun, 1=Mon, etc.
  category?: string;
  color: string;
  icon?: string;
  reminderTime?: string; // HH:mm
  archived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Completion {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD local date
  type: "boolean" | "counter" | "timer";
  value: number; // 1 for boolean, count for counter, seconds for timer
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

export type ThemeMode = "light" | "dark" | "system";
