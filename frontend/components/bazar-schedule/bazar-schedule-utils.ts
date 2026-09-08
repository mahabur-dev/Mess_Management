import type {
  BazarDateStatus,
  BazarDutySlotStatus,
  BazarFrequency,
  BazarRequestStatus,
} from '@/lib/api-client'
import { intlLocale, type Locale } from '@/lib/i18n'

export const WEEKDAYS = [
  { value: 6, short: 'Sat', label: 'Saturday' },
  { value: 0, short: 'Sun', label: 'Sunday' },
  { value: 1, short: 'Mon', label: 'Monday' },
  { value: 2, short: 'Tue', label: 'Tuesday' },
  { value: 3, short: 'Wed', label: 'Wednesday' },
  { value: 4, short: 'Thu', label: 'Thursday' },
  { value: 5, short: 'Fri', label: 'Friday' },
] as const

export const FREQUENCY_LABELS: Record<BazarFrequency, string> = {
  EVERY_DAY: 'Every day',
  SPECIFIC_WEEKDAYS: 'Specific weekdays',
  CUSTOM_DATES: 'Custom dates',
}

export function formatBazarDate(value: string, locale: Locale, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
    ...options,
  }).format(new Date(value))
}

export function monthLabel(year: number, month: number, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)))
}

export function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function slotStatus(slot: { status: BazarDutySlotStatus; effectiveStatus?: BazarDutySlotStatus }) {
  return slot.effectiveStatus ?? slot.status
}

export function dateStatus(date: { status: BazarDateStatus; effectiveStatus?: BazarDateStatus }) {
  return date.effectiveStatus ?? date.status
}

export function requestTone(status: BazarRequestStatus) {
  if (status === 'APPROVED') return 'border-primary/30 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/10 dark:text-primary'
  if (status === 'REJECTED') return 'border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/30 dark:bg-destructive/10 dark:text-destructive'
  if (status === 'CANCELLED') return 'border-border bg-muted text-muted-foreground dark:border-border dark:bg-muted dark:text-muted-foreground'
  return 'border-primary/30 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/10 dark:text-primary'
}
