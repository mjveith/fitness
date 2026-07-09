export function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export type WeekStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const weekStartDayOptions: Array<{ value: WeekStartDay; label: string }> = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

export function normalizeWeekStartDay(value: unknown): WeekStartDay {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 6 ? (parsed as WeekStartDay) : 1;
}

export function getWeekStart(input = new Date(), weekStartsOn: WeekStartDay = 1) {
  const date = new Date(input);
  const day = date.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - diff);
  return date;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatDisplayDate(dateString: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateString}T00:00:00`));
}
