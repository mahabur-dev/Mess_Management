import { AttendanceStatus, MealName } from '@prisma/client';
import { normalizeMealAttendance } from './meal-policy';

export interface BulkMealUpdateInput {
  memberId: string;
  mealName: MealName;
  mealCount: number;
  expectedMealCount?: number;
}

export interface NormalizedBulkMealUpdate extends BulkMealUpdateInput {
  key: string;
  normalized: {
    status: AttendanceStatus;
    guests: number;
    mealCount: number;
  };
}

export function bulkMealUpdateKey(memberId: string, mealName: MealName) {
  return `${memberId}:${mealName}`;
}

export function normalizeBulkMealUpdates(
  updates: BulkMealUpdateInput[],
  defaultStatus: AttendanceStatus,
): NormalizedBulkMealUpdate[] {
  const seen = new Set<string>();

  return updates.map((update) => {
    const key = bulkMealUpdateKey(update.memberId, update.mealName);
    if (seen.has(key)) {
      throw new Error(
        `Duplicate bulk meal update for member ${update.memberId} and ${update.mealName}`,
      );
    }
    seen.add(key);

    const normalized = normalizeMealAttendance({
      mealName: update.mealName,
      mealCount: update.mealCount,
      defaultStatus,
    });

    return {
      ...update,
      key,
      normalized: {
        ...normalized,
        status: normalized.status as AttendanceStatus,
      },
    };
  });
}

export function mealCountFromAttendance(
  mealName: MealName,
  attendance?: {
    status: AttendanceStatus;
    guests: number | string | { toString(): string };
  },
) {
  if (!attendance || attendance.status !== AttendanceStatus.ON) return 0;
  return normalizeMealAttendance({
    mealName,
    status: AttendanceStatus.ON,
    guests: Number(attendance.guests),
  }).mealCount;
}
