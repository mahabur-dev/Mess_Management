import { BazarFrequency } from '@prisma/client';

export const BAZAR_TIME_ZONE = 'Asia/Dhaka';

export type BazarSchedulePattern = {
  frequency: BazarFrequency;
  weekdays?: number[];
  customDays?: number[];
};

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function generateBazarDays(
  year: number,
  month: number,
  pattern: BazarSchedulePattern,
): number[] {
  const lastDay = daysInMonth(year, month);
  if (pattern.frequency === BazarFrequency.EVERY_DAY) {
    return Array.from({ length: lastDay }, (_, index) => index + 1);
  }

  if (pattern.frequency === BazarFrequency.CUSTOM_DATES) {
    return uniqueSorted(pattern.customDays ?? []).filter(
      (day) => day >= 1 && day <= lastDay,
    );
  }

  const allowedWeekdays = new Set(pattern.weekdays ?? []);
  return Array.from({ length: lastDay }, (_, index) => index + 1).filter(
    (day) =>
      allowedWeekdays.has(new Date(Date.UTC(year, month - 1, day)).getUTCDay()),
  );
}

export function bazarDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

export function dateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function dhakaDateKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BAZAR_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${read('year')}-${read('month')}-${read('day')}`;
}

export function currentDhakaMonth(now = new Date()) {
  const [year, month] = dhakaDateKey(now).split('-').map(Number);
  return { year, month };
}

export function daysUntil(date: Date, now = new Date()): number {
  const today = new Date(`${dhakaDateKey(now)}T00:00:00.000Z`);
  const target = new Date(`${dateKey(date)}T00:00:00.000Z`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function recommendedDutyCount(totalSlots: number, members: number) {
  return members > 0 ? Math.ceil(totalSlots / members) : 0;
}

function uniqueSorted(values: number[]) {
  return [...new Set(values)].sort((a, b) => a - b);
}
