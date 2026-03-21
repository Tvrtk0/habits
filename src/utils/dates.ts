import { format, addDays, subDays, isToday, parseISO } from "date-fns";

export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function today(): string {
  return toDateString(new Date());
}

export function formatDisplayDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  return format(date, "EEE, MMM d");
}

export function shiftDate(dateStr: string, days: number): string {
  const date = parseISO(dateStr);
  const shifted = days > 0 ? addDays(date, days) : subDays(date, Math.abs(days));
  return toDateString(shifted);
}

export function getDayOfWeek(dateStr: string): number {
  return parseISO(dateStr).getDay(); // 0=Sun
}

export function isScheduledForDate(
  frequency: string,
  customDays: number[] | undefined,
  dateStr: string,
): boolean {
  const day = getDayOfWeek(dateStr);
  switch (frequency) {
    case "daily":
      return true;
    case "weekdays":
      return day >= 1 && day <= 5;
    case "weekends":
      return day === 0 || day === 6;
    case "custom":
      return customDays?.includes(day) ?? false;
    default:
      return true;
  }
}

export function daysBackFromToday(dateStr: string): number {
  const now = new Date();
  const date = parseISO(dateStr);
  const diff = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diff;
}
