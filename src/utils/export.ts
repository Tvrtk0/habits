import { db } from "../db";
import { format } from "date-fns";
import type { Habit, Completion, Category } from "../models/types";

interface ExportData {
  version: number;
  exportedAt: string;
  habits: Habit[];
  completions: Completion[];
  categories: Category[];
}

export async function exportData() {
  const [habits, completions, categories] = await Promise.all([
    db.habits.toArray(),
    db.completions.toArray(),
    db.categories.toArray(),
  ]);

  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    habits,
    completions,
    categories,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `habits-backup-${format(new Date(), "yyyy-MM-dd")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function validateExport(data: unknown): data is ExportData {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  if (typeof d.version !== "number") return false;
  if (!Array.isArray(d.habits)) return false;
  if (!Array.isArray(d.completions)) return false;
  if (!Array.isArray(d.categories)) return false;
  // Validate required fields on habits
  for (const h of d.habits) {
    if (!h.id || !h.name || !h.type || !h.color) return false;
  }
  return true;
}

export async function importData(
  file: File,
  mode: "merge" | "replace",
): Promise<{ habits: number; completions: number }> {
  const text = await file.text();
  const data = JSON.parse(text);

  if (!validateExport(data)) {
    throw new Error("Invalid backup file format");
  }

  if (mode === "replace") {
    await db.transaction("rw", db.habits, db.completions, db.categories, async () => {
      await db.habits.clear();
      await db.completions.clear();
      await db.categories.clear();
      await db.habits.bulkAdd(data.habits);
      await db.completions.bulkAdd(data.completions);
      await db.categories.bulkAdd(data.categories);
    });
    return { habits: data.habits.length, completions: data.completions.length };
  }

  // Merge: skip duplicate IDs
  let habitsAdded = 0;
  let completionsAdded = 0;

  await db.transaction("rw", db.habits, db.completions, db.categories, async () => {
    for (const cat of data.categories) {
      const exists = await db.categories.get(cat.id);
      if (!exists) await db.categories.add(cat);
    }
    for (const habit of data.habits) {
      const exists = await db.habits.get(habit.id);
      if (!exists) {
        await db.habits.add(habit);
        habitsAdded++;
      }
    }
    for (const comp of data.completions) {
      const exists = await db.completions.get(comp.id);
      if (!exists) {
        await db.completions.add(comp);
        completionsAdded++;
      }
    }
  });

  return { habits: habitsAdded, completions: completionsAdded };
}

export async function clearAllData() {
  await db.transaction("rw", db.habits, db.completions, db.categories, async () => {
    await db.habits.clear();
    await db.completions.clear();
    await db.categories.clear();
  });
}
