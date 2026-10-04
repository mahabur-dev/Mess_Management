export const MEAL_TIME_ZONE = 'Asia/Dhaka';
export const DEFAULT_MEAL_WINDOW_START = '09:00';
export const DEFAULT_MEAL_WINDOW_END = '17:00';
export const MAX_GUEST_MEALS = 20;

export type MealKind = 'BREAKFAST' | 'LUNCH' | 'DINNER';
export type AttendanceChoice = 'ON' | 'OFF';

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const MEAL_BASE_VALUE: Record<MealKind, number> = {
  BREAKFAST: 0.5,
  LUNCH: 1,
  DINNER: 1,
};

export interface MealDecisionWindow {
  decisionDate: string;
  targetDate: string;
  startTime: string;
  endTime: string;
  windowStart: Date;
  windowEnd: Date;
  isTargetDateEditable: boolean;
  isWindowOpen: boolean;
}

export interface NormalizeMealAttendanceInput {
  mealName: MealKind;
  status?: AttendanceChoice;
  mealCount?: number;
  guests?: number;
  defaultStatus?: AttendanceChoice;
}

export interface NormalizedMealAttendance {
  status: AttendanceChoice;
  guests: number;
  mealCount: number;
}

function parseDateKey(value: string): [number, number, number] {
  const match = DATE_KEY_PATTERN.exec(value);
  if (!match) throw new Error('Date must use YYYY-MM-DD format');

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error('Date is not a valid calendar date');
  }

  return [year, month, day];
}

export function parseTimeToMinutes(value: string): number {
  const match = TIME_PATTERN.exec(value);
  if (!match) throw new Error('Time must use 24-hour HH:mm format');
  return Number(match[1]) * 60 + Number(match[2]);
}

export function assertValidMealWindow(startTime: string, endTime: string): void {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === end) {
    throw new Error('Meal decision window must have a non-zero duration');
  }
}

export function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = parseDateKey(dateKey);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function getDhakaDateKey(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MEAL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export function parseMealDate(value: string | Date): Date {
  const dateKey =
    typeof value === 'string'
      ? value.slice(0, 10)
      : value.toISOString().slice(0, 10);
  const [year, month, day] = parseDateKey(dateKey);
  return new Date(Date.UTC(year, month - 1, day));
}

function buildDhakaInstant(dateKey: string, time: string): Date {
  const [year, month, day] = parseDateKey(dateKey);
  const minutes = parseTimeToMinutes(time);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  // Bangladesh Standard Time is UTC+06:00 and does not observe DST.
  return new Date(Date.UTC(year, month - 1, day, hour - 6, minute));
}

export function getMealDecisionWindow(
  targetDate: string,
  startTime: string,
  endTime: string,
  now: Date = new Date(),
): MealDecisionWindow {
  assertValidMealWindow(startTime, endTime);
  parseDateKey(targetDate);

  const decisionDate = shiftDateKey(targetDate, -1);
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  const windowStart = buildDhakaInstant(decisionDate, startTime);
  const windowEnd =
    endMinutes > startMinutes
      ? buildDhakaInstant(decisionDate, endTime)
      : buildDhakaInstant(targetDate, endTime);
  const isWindowOpen = now >= windowStart && now <= windowEnd;

  return {
    decisionDate,
    targetDate,
    startTime,
    endTime,
    windowStart,
    windowEnd,
    isTargetDateEditable: isWindowOpen,
    isWindowOpen,
  };
}

export function isMemberMealDateEditable(
  targetDate: string,
  startTime: string,
  endTime: string,
  now: Date = new Date(),
): boolean {
  const today = getDhakaDateKey(now);
  parseDateKey(targetDate);

  if (targetDate > today) return true;
  if (targetDate < today) return false;

  return getMealDecisionWindow(targetDate, startTime, endTime, now).isWindowOpen;
}

export function getMealBaseValue(mealName: MealKind): number {
  return MEAL_BASE_VALUE[mealName];
}

function roundMealValue(value: number): number {
  return Number(value.toFixed(2));
}

function assertFiniteRange(
  field: string,
  value: number,
  minimum: number,
  maximum: number,
): void {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${field} must be between ${minimum} and ${maximum}`);
  }
}

export function normalizeMealAttendance(
  input: NormalizeMealAttendanceInput,
): NormalizedMealAttendance {
  const baseValue = getMealBaseValue(input.mealName);
  const derivedStatus =
    input.mealCount !== undefined
      ? input.mealCount === 0
        ? 'OFF'
        : 'ON'
      : undefined;
  const status = input.status ?? derivedStatus ?? input.defaultStatus ?? 'ON';

  if (status === 'OFF') {
    if (input.mealCount !== undefined && input.mealCount !== 0) {
      throw new Error('mealCount must be 0 when meal status is OFF');
    }
    if (input.guests !== undefined && input.guests !== 0) {
      throw new Error('guests must be 0 when meal status is OFF');
    }
    return { status, guests: 0, mealCount: 0 };
  }

  const guestsFromCount =
    input.mealCount === undefined
      ? undefined
      : roundMealValue(input.mealCount - baseValue);
  const guests = roundMealValue(input.guests ?? guestsFromCount ?? 0);

  assertFiniteRange('guests', guests, 0, MAX_GUEST_MEALS);
  const mealCount = roundMealValue(baseValue + guests);

  if (
    input.mealCount !== undefined &&
    Math.abs(input.mealCount - mealCount) > 0.001
  ) {
    throw new Error(
      `mealCount must equal the ${baseValue} base meal plus guests`,
    );
  }

  return { status, guests, mealCount };
}
