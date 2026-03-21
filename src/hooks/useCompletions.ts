import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import type { Completion } from "../models/types";

export function useCompletions(date: string) {
  const completions = useLiveQuery(
    () => db.completions.where("date").equals(date).toArray(),
    [date],
  );

  async function getCompletion(
    habitId: string,
    dateStr: string,
  ): Promise<Completion | undefined> {
    return db.completions.where("[habitId+date]").equals([habitId, dateStr]).first();
  }

  async function toggleBoolean(habitId: string, dateStr: string) {
    const existing = await getCompletion(habitId, dateStr);
    if (existing) {
      await db.completions.delete(existing.id);
    } else {
      const now = new Date().toISOString();
      await db.completions.add({
        id: crypto.randomUUID(),
        habitId,
        date: dateStr,
        type: "boolean",
        value: 1,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  async function setCounter(habitId: string, dateStr: string, value: number) {
    const existing = await getCompletion(habitId, dateStr);
    const now = new Date().toISOString();
    if (value <= 0 && existing) {
      await db.completions.delete(existing.id);
    } else if (value > 0 && existing) {
      await db.completions.update(existing.id, { value, updatedAt: now });
    } else if (value > 0) {
      await db.completions.add({
        id: crypto.randomUUID(),
        habitId,
        date: dateStr,
        type: "counter",
        value,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  async function setTimer(habitId: string, dateStr: string, seconds: number) {
    const existing = await getCompletion(habitId, dateStr);
    const now = new Date().toISOString();
    if (existing) {
      await db.completions.update(existing.id, { value: seconds, updatedAt: now });
    } else {
      await db.completions.add({
        id: crypto.randomUUID(),
        habitId,
        date: dateStr,
        type: "timer",
        value: seconds,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  async function setNote(habitId: string, dateStr: string, note: string) {
    const existing = await getCompletion(habitId, dateStr);
    if (existing) {
      await db.completions.update(existing.id, {
        note: note || undefined,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return { completions, toggleBoolean, setCounter, setTimer, setNote };
}
