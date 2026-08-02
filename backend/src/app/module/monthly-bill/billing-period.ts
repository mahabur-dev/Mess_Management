const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

function validDate(value: string | Date): Date {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError('Invalid billing date');
  return date;
}

export function billingMonthStart(value: string | Date): Date {
  if (typeof value === 'string') {
    const match = /^(\d{4})-(\d{2})/.exec(value);
    if (match)
      return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  }
  const date = validDate(value);
  const isDatabaseDate =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;
  const local = isDatabaseDate
    ? date
    : new Date(date.getTime() + DHAKA_OFFSET_MS);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1));
}

export function currentDhakaDate(now = new Date()): Date {
  const local = new Date(now.getTime() + DHAKA_OFFSET_MS);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()),
  );
}

export function currentDhakaMonth(now = new Date()): Date {
  const date = currentDhakaDate(now);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function billingMonthRange(value: string | Date) {
  const start = billingMonthStart(value);
  const end = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
  );
  return { start, end };
}
