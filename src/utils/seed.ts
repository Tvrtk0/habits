import { db } from "../db";
import { subDays, format } from "date-fns";

const today = new Date();
const dateStr = (daysAgo: number) => format(subDays(today, daysAgo), "yyyy-MM-dd");
const now = new Date().toISOString();

const habits = [
  {
    id: "h1",
    name: "Morning meditation",
    type: "timer" as const,
    target: 15,
    frequency: "daily" as const,
    color: "#14b8a6",
    archived: false,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "h2",
    name: "Read a book",
    type: "boolean" as const,
    frequency: "daily" as const,
    color: "#6366f1",
    archived: false,
    sortOrder: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "h3",
    name: "Drink water",
    type: "counter" as const,
    target: 8,
    frequency: "daily" as const,
    color: "#3b82f6",
    archived: false,
    sortOrder: 2,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "h4",
    name: "Exercise",
    type: "boolean" as const,
    frequency: "weekdays" as const,
    color: "#ef4444",
    category: "cat1",
    archived: false,
    sortOrder: 3,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "h5",
    name: "Journal",
    type: "boolean" as const,
    frequency: "daily" as const,
    color: "#eab308",
    category: "cat1",
    archived: false,
    sortOrder: 4,
    createdAt: now,
    updatedAt: now,
  },
];

const categories = [
  { id: "cat1", name: "Self-care", color: "#ec4899", sortOrder: 0 },
];

function randomCompletions() {
  const completions: {
    id: string;
    habitId: string;
    date: string;
    type: "boolean" | "counter" | "timer";
    value: number;
    createdAt: string;
    updatedAt: string;
  }[] = [];

  let id = 0;

  for (let daysAgo = 30; daysAgo >= 0; daysAgo--) {
    const date = dateStr(daysAgo);
    const dayOfWeek = subDays(today, daysAgo).getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    // Meditation — ~70% chance, 8-18 min
    if (Math.random() < 0.7) {
      completions.push({
        id: `c${id++}`,
        habitId: "h1",
        date,
        type: "timer",
        value: (8 + Math.floor(Math.random() * 10)) * 60,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Read — ~80% chance
    if (Math.random() < 0.8) {
      completions.push({
        id: `c${id++}`,
        habitId: "h2",
        date,
        type: "boolean",
        value: 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Water — 4-10 glasses
    if (Math.random() < 0.85) {
      completions.push({
        id: `c${id++}`,
        habitId: "h3",
        date,
        type: "counter",
        value: 4 + Math.floor(Math.random() * 7),
        createdAt: now,
        updatedAt: now,
      });
    }

    // Exercise — weekdays only, ~60%
    if (isWeekday && Math.random() < 0.6) {
      completions.push({
        id: `c${id++}`,
        habitId: "h4",
        date,
        type: "boolean",
        value: 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Journal — ~65%
    if (Math.random() < 0.65) {
      completions.push({
        id: `c${id++}`,
        habitId: "h5",
        date,
        type: "boolean",
        value: 1,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return completions;
}

export async function seedData() {
  const count = await db.habits.count();
  if (count > 0) {
    console.log("DB already has data, skipping seed.");
    return;
  }

  await db.transaction("rw", db.habits, db.completions, db.categories, async () => {
    await db.categories.bulkAdd(categories);
    await db.habits.bulkAdd(habits);
    await db.completions.bulkAdd(randomCompletions());
  });

  console.log("Seed data added!");
}
