import Dexie, { type Table } from "dexie";
import type { Habit, Completion, Category } from "../models/types";

class HabitDatabase extends Dexie {
  habits!: Table<Habit, string>;
  completions!: Table<Completion, string>;
  categories!: Table<Category, string>;

  constructor() {
    super("HabitTrackerDB");

    this.version(1).stores({
      habits: "id, category, archived, sortOrder",
      completions: "id, habitId, date, [habitId+date]",
      categories: "id, sortOrder",
    });
  }
}

export const db = new HabitDatabase();
