import { intlLocale, type Locale } from './types'

export type DateInput = Date | string | number
export const DEFAULT_TIME_ZONE = 'Asia/Dhaka'

const BANGLA_DIGITS = '০১২৩৪৫৬৭৮৯'

export function normalizeLocalizedDigits(value: string) {
  return value.replace(/[০-৯]/g, (digit) => String(BANGLA_DIGITS.indexOf(digit)))
}

function toDate(value: DateInput) {
  if (value instanceof Date) return value
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00+06:00`)
  }
  return new Date(value)
}

function validDate(value: DateInput) {
  const date = toDate(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatIsoDate(value: DateInput = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  const date = validDate(value)
  if (!date) return String(value)
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone,
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function formatNumber(
  value: number | string | null | undefined,
  locale: Locale,
  options: Intl.NumberFormatOptions = {},
) {
  const number = Number(value ?? 0)
  return new Intl.NumberFormat(intlLocale(locale), options).format(Number.isFinite(number) ? number : 0)
}

export function formatMoney(
  value: number | string | null | undefined,
  locale: Locale,
  options: Intl.NumberFormatOptions = {},
) {
  const amount = formatNumber(value, locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
    style: 'decimal',
  })
  return `৳\u202f${amount}`
}

export function formatDate(
  value: DateInput,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = {},
) {
  const date = validDate(value)
  if (!date) return String(value)
  return new Intl.DateTimeFormat(intlLocale(locale), {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: DEFAULT_TIME_ZONE, ...options,
  }).format(date)
}

export function formatTime(
  value: DateInput,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = {},
) {
  const date = validDate(value)
  if (!date) return String(value)
  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: 'numeric', minute: '2-digit', timeZone: DEFAULT_TIME_ZONE, ...options,
  }).format(date)
}

export function formatMonth(
  value: DateInput,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = {},
) {
  const date = validDate(value)
  if (!date) return String(value)
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: 'long', year: 'numeric', timeZone: DEFAULT_TIME_ZONE, ...options,
  }).format(date)
}

export function formatWeekday(
  value: DateInput,
  locale: Locale,
  width: 'long' | 'short' | 'narrow' = 'long',
) {
  const date = validDate(value)
  if (!date) return String(value)
  return new Intl.DateTimeFormat(intlLocale(locale), { weekday: width, timeZone: DEFAULT_TIME_ZONE }).format(date)
}

export function formatRelativeTime(value: DateInput, locale: Locale, relativeTo: DateInput = new Date()) {
  const date = validDate(value)
  const base = validDate(relativeTo)
  if (!date || !base) return String(value)
  const seconds = (date.getTime() - base.getTime()) / 1000
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365], ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7], ['day', 60 * 60 * 24],
    ['hour', 60 * 60], ['minute', 60], ['second', 1],
  ]
  const [unit, divisor] = units.find(([, size]) => Math.abs(seconds) >= size) ?? units[units.length - 1]!
  return new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: 'auto' }).format(
    Math.round(seconds / divisor), unit,
  )
}
