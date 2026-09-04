import type {
  BazarDateStatus,
  BazarDutySlotStatus,
  BazarFrequency,
  BazarRequestStatus,
} from '@/lib/api-client'

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

export function formatBazarDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
    ...options,
  }).format(new Date(value))
}

export function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat('en-US', {
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
  if (status === 'APPROVED') return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300'
  if (status === 'REJECTED') return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300'
  if (status === 'CANCELLED') return 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-400/20 dark:bg-slate-400/10 dark:text-slate-300'
  return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300'
}
