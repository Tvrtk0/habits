import { useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";

export function useNotifications(enabled: boolean) {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const habits = useLiveQuery(() =>
    db.habits.filter((h) => !h.archived && !!h.reminderTime).toArray(),
  );

  useEffect(() => {
    // Clear previous timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (!enabled || !habits || Notification.permission !== "granted") return;

    for (const habit of habits) {
      if (!habit.reminderTime) continue;

      const [hours, minutes] = habit.reminderTime.split(":").map(Number);
      const now = new Date();
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);

      // If time already passed today, schedule for tomorrow
      if (target <= now) {
        target.setDate(target.getDate() + 1);
      }

      const ms = target.getTime() - now.getTime();

      const timer = setTimeout(() => {
        new Notification(`Time to: ${habit.name}`, {
          body: habit.description || "Don't forget your habit!",
          icon: "/favicon.svg",
        });
      }, ms);

      timersRef.current.push(timer);
    }

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [enabled, habits]);
}

export async function requestPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}
