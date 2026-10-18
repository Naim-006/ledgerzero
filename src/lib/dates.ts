import { format, parseISO, differenceInCalendarDays, addDays, isBefore, isAfter } from "date-fns";

export function formatDate(dateStr: string, formatPattern: string = "MMM d, yyyy"): string {
  try {
    return format(parseISO(dateStr), formatPattern);
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  return formatDate(dateStr, "MMM d");
}

export function getDaysDifference(dateStrTarget: string, dateStrReference: string): number {
  return differenceInCalendarDays(parseISO(dateStrTarget), parseISO(dateStrReference));
}

export function addDaysToDate(dateStr: string, days: number): string {
  const result = addDays(parseISO(dateStr), days);
  return format(result, "yyyy-MM-dd");
}

export function isDatePast(dateStr: string, referenceDateStr: string): boolean {
  return isBefore(parseISO(dateStr), parseISO(referenceDateStr));
}

export function isDateFuture(dateStr: string, referenceDateStr: string): boolean {
  return isAfter(parseISO(dateStr), parseISO(referenceDateStr));
}

export function getTodayDateString(): string {
  return format(new Date(), "yyyy-MM-dd");
}
