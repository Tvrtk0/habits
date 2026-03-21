import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import type { Habit } from "../models/types";

export function useHabits() {
  const habits = useLiveQuery(async () => {
    const all = await db.habits.orderBy("sortOrder").toArray();
    return all.filter((h) => !h.archived);
  });

  const allHabits = useLiveQuery(() => db.habits.orderBy("sortOrder").toArray());

  async function addHabit(
    data: Omit<Habit, "id" | "createdAt" | "updatedAt" | "sortOrder" | "archived">,
  ) {
    const count = (await db.habits.count()) || 0;
    const now = new Date().toISOString();
    const habit: Habit = {
      ...data,
      id: crypto.randomUUID(),
      archived: false,
      sortOrder: count,
      createdAt: now,
      updatedAt: now,
    };
    await db.habits.add(habit);
    return habit;
  }

  async function updateHabit(id: string, data: Partial<Habit>) {
    await db.habits.update(id, { ...data, updatedAt: new Date().toISOString() });
  }

  async function deleteHabit(id: string) {
    await db.transaction("rw", db.habits, db.completions, async () => {
      await db.completions.where("habitId").equals(id).delete();
      await db.habits.delete(id);
    });
  }

  async function archiveHabit(id: string) {
    await updateHabit(id, { archived: true });
  }

  return { habits, allHabits, addHabit, updateHabit, deleteHabit, archiveHabit };
}
