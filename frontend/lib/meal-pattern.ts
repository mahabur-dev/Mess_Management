import type {
  MealName,
  MealPattern,
  MealPatternSchedule,
  MealPatternStatus,
  MealPatternWeekday,
  MealPatternWeeklySchedule,
} from '@/lib/api-client'

export const MEAL_PATTERN_DAYS: MealPatternWeekday[] = [
  'SATURDAY',
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
]

export const MEAL_PATTERN_MEALS: MealName[] = ['BREAKFAST', 'LUNCH', 'DINNER']

export const MEAL_PATTERN_BASE_VALUE: Record<MealName, number> = {
  BREAKFAST: 0.5,
  LUNCH: 1,
  DINNER: 1,
}

export const MEAL_PATTERN_LABELS: Record<MealName, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
}

export const MEAL_PATTERN_DAY_LABELS: Record<MealPatternWeekday, string> = {
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
}

export const MEAL_PATTERN_STATUS_LABELS: Record<MealPatternStatus, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  DRAFT: 'Draft',
  ENDED: 'Finished',
  CANCELLED: 'Ended',
}

export const EMPTY_MEAL_PATTERN_SCHEDULE: MealPatternSchedule = {
  BREAKFAST: 0,
  LUNCH: 0,
  DINNER: 0,
}

export const DEFAULT_MEAL_PATTERN_SCHEDULE: MealPatternSchedule = {
  BREAKFAST: 0.5,
  LUNCH: 1,
  DINNER: 1,
}

export function cloneMealPatternSchedule(schedule: MealPatternSchedule): MealPatternSchedule {
  return { ...schedule }
}

export function createWeeklyMealPatternSchedule(
  schedule: MealPatternSchedule = DEFAULT_MEAL_PATTERN_SCHEDULE,
): MealPatternWeeklySchedule {
  return MEAL_PATTERN_DAYS.reduce((result, day) => {
    result[day] = cloneMealPatternSchedule(schedule)
    return result
  }, {} as MealPatternWeeklySchedule)
}

export function normalizeMealPatternSchedule(value: unknown): MealPatternSchedule {
  const input = value && typeof value === 'object' ? value as Partial<Record<MealName, unknown>> : {}
  return MEAL_PATTERN_MEALS.reduce((result, meal) => {
    const amount = Number(input[meal] ?? 0)
    result[meal] = Number.isFinite(amount) && amount > 0 ? amount : 0
    return result
  }, { ...EMPTY_MEAL_PATTERN_SCHEDULE })
}

export function normalizeWeeklyMealPatternSchedule(value: unknown): MealPatternWeeklySchedule {
  const input = value && typeof value === 'object'
    ? value as Partial<Record<MealPatternWeekday, unknown>>
    : {}
  return MEAL_PATTERN_DAYS.reduce((result, day) => {
    result[day] = normalizeMealPatternSchedule(input[day])
    return result
  }, {} as MealPatternWeeklySchedule)
}

export function getScheduleTotal(schedule: MealPatternSchedule): number {
  return Number(MEAL_PATTERN_MEALS.reduce((sum, meal) => sum + Number(schedule[meal] ?? 0), 0).toFixed(2))
}

export function getPatternWeeklyTotal(pattern: MealPattern): number {
  if (pattern.pattern_type === 'DAILY') {
    return Number((getScheduleTotal(normalizeMealPatternSchedule(pattern.daily_schedule)) * 7).toFixed(2))
  }
  const weekly = normalizeWeeklyMealPatternSchedule(pattern.weekly_schedule)
  return Number(MEAL_PATTERN_DAYS.reduce((sum, day) => sum + getScheduleTotal(weekly[day]), 0).toFixed(2))
}

export function getPatternCurrentVersion(patterns: MealPattern[]): MealPattern | null {
  if (!patterns.length) return null
  const sorted = [...patterns].sort((a, b) => b.version - a.version)
  return sorted.find((pattern) => pattern.status === 'ACTIVE')
    ?? sorted.find((pattern) => pattern.status === 'PAUSED')
    ?? sorted.find((pattern) => pattern.status === 'DRAFT')
    ?? sorted[0]
}

export function getDhakaDateKey(value = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function formatPatternDate(value?: string | null): string {
  if (!value) return 'No end date'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value))
}

export function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map((part) => part[0]).join('').toUpperCase().slice(0, 2) || 'M'
}

export function isPatternConfigurable(pattern?: MealPattern | null): boolean {
  return !pattern || !['ENDED', 'CANCELLED'].includes(pattern.status)
}
