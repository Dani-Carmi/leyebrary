const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A local calendar day as YYYY-MM-DD (no time zone shifts). */
export const toDateString = (date: Date): string =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

export const today = (): string => toDateString(new Date());

/** Parses YYYY-MM-DD as local midnight; null if it isn't a real date. */
export const parseDateString = (value: unknown): Date | null => {
  if (typeof value !== "string") return null;
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 && date.getDate() === day ? date : null;
};

export const isDateString = (value: unknown): value is string =>
  parseDateString(value) !== null;

/** "12 Mar 2025", in the device's locale. */
export const formatDay = (value: string): string =>
  parseDateString(value)?.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }) ?? value;

/** Whole days from `start` to `end`, counting both (same day = 1). */
export const daysSpanned = (start: string, end: string): number | null => {
  const a = parseDateString(start);
  const b = parseDateString(end);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
};
