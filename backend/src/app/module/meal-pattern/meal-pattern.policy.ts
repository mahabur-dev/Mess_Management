import { BadRequestException } from '@nestjs/common';
import { MealName, MealPatternType } from '@prisma/client';

export const WEEKDAYS = [
  'SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY',
] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export type MealSchedule = Record<MealName, number>;
export type WeeklySchedule = Record<Weekday, MealSchedule>;

export const EMPTY_SCHEDULE: MealSchedule = {
  BREAKFAST: 0, LUNCH: 0, DINNER: 0,
};

export function dateKey(value: Date | string): string {
  return typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

export function parseDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new BadRequestException('Dates must use YYYY-MM-DD format');
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || dateKey(date) !== value) throw new BadRequestException('Invalid calendar date');
  return date;
}

function normalizeMealSchedule(value: unknown, label: string): MealSchedule {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException(`${label} must be an object`);
  const input = value as Record<string, unknown>;
  const result = { ...EMPTY_SCHEDULE };
  for (const meal of Object.keys(result) as MealName[]) {
    const raw = input[meal];
    if (raw === undefined || raw === null || raw === false) { result[meal] = 0; continue; }
    const value = raw === true ? (meal === 'BREAKFAST' ? 0.5 : 1) : Number(raw);
    const step = meal === 'BREAKFAST' ? 0.5 : 1;
    if (!Number.isFinite(value) || value < 0 || value > 20 || Math.round(value / step) !== value / step) throw new BadRequestException(`${label}.${meal} must use increments of ${step}`);
    result[meal] = Number(value.toFixed(2));
  }
  return result;
}

export function normalizeSchedule(type: MealPatternType, daily: unknown, weekly: unknown) {
  if (type === MealPatternType.DAILY) {
    if (daily === undefined || daily === null) throw new BadRequestException('dailySchedule is required for a daily pattern');
    return { dailySchedule: normalizeMealSchedule(daily, 'dailySchedule'), weeklySchedule: null };
  }
  if (!weekly || typeof weekly !== 'object' || Array.isArray(weekly)) throw new BadRequestException('weeklySchedule is required for a weekly pattern');
  const input = weekly as Record<string, unknown>;
  const result = {} as WeeklySchedule;
  for (const day of WEEKDAYS) result[day] = normalizeMealSchedule(input[day] ?? EMPTY_SCHEDULE, `weeklySchedule.${day}`);
  return { dailySchedule: null, weeklySchedule: result };
}

export function scheduleForDate(pattern: { pattern_type: MealPatternType; daily_schedule: unknown; weekly_schedule: unknown }, value: Date): MealSchedule {
  if (pattern.pattern_type === MealPatternType.DAILY) return normalizeMealSchedule(pattern.daily_schedule, 'dailySchedule');
  const day = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dhaka', weekday: 'long' }).format(value).toUpperCase() as Weekday;
  return normalizeMealSchedule((pattern.weekly_schedule as Record<string, unknown>)[day], `weeklySchedule.${day}`);
}
