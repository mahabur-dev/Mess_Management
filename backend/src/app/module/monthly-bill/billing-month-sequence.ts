function monthStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function buildBillingMonthSequence(
  requestedDates: Date[],
  existingBillMonths: Date[] = [],
): Date[] {
  const requestedMonths = requestedDates
    .filter((date) => !Number.isNaN(date.getTime()))
    .map(monthStart);

  if (!requestedMonths.length) return [];

  const earliestRequested = Math.min(
    ...requestedMonths.map((month) => month.getTime()),
  );
  const uniqueMonths = new Map<string, Date>();

  for (const month of [...requestedMonths, ...existingBillMonths]) {
    if (Number.isNaN(month.getTime())) continue;
    const normalized = monthStart(month);
    if (normalized.getTime() < earliestRequested) continue;
    uniqueMonths.set(normalized.toISOString(), normalized);
  }

  return [...uniqueMonths.values()].sort(
    (left, right) => left.getTime() - right.getTime(),
  );
}
