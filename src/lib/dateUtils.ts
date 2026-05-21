import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, format, isWithinInterval, parseISO } from 'date-fns';

export type TimePeriod = 'month' | 'quarter' | 'year' | 'custom';

export function getDateRange(period: TimePeriod, baseDate: Date, customStart?: Date, customEnd?: Date): { start: Date; end: Date } {
  switch (period) {
    case 'month':
      return { start: startOfMonth(baseDate), end: endOfMonth(baseDate) };
    case 'quarter':
      return { start: startOfQuarter(baseDate), end: endOfQuarter(baseDate) };
    case 'year':
      return { start: startOfYear(baseDate), end: endOfYear(baseDate) };
    case 'custom':
      return { 
        start: customStart || startOfYear(new Date()), 
        end: customEnd || new Date() 
      };
    default:
      return { start: startOfMonth(baseDate), end: endOfMonth(baseDate) };
  }
}

export function formatTransactionDate(dateStr: string): Date {
  return parseISO(dateStr);
}

export function isTransactionInLink(dateStr: string, start: Date, end: Date): boolean {
  const date = formatTransactionDate(dateStr);
  return isWithinInterval(date, { start, end });
}
