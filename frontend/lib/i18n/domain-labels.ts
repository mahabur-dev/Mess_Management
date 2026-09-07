import { getDictionary } from './dictionaries'
import type { Locale, MessageKey } from './types'

type DomainKey = MessageKey<'domain'>

const keys = {
  ADMIN: 'admin', MANAGER: 'manager', MEMBER: 'member',
  PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected', ACTIVE: 'active', INACTIVE: 'inactive',
  PROCESSING: 'processing', SOLVED: 'solved', PAID: 'paid', PARTIAL: 'partial', OPEN: 'open', CLOSED: 'closed',
  COMPLETED: 'completed', AVAILABLE: 'available', ASSIGNED: 'assigned', FINISHED: 'finished', CANCELLED: 'cancelled',
  DRAFT: 'draft', PAUSED: 'paused', ENDED: 'ended', CONTACTED: 'contacted', RESOLVED: 'resolved',
  BREAKFAST: 'breakfast', LUNCH: 'lunch', DINNER: 'dinner',
  SATURDAY: 'saturday', SUNDAY: 'sunday', MONDAY: 'monday', TUESDAY: 'tuesday',
  WEDNESDAY: 'wednesday', THURSDAY: 'thursday', FRIDAY: 'friday',
  GROCERY: 'grocery', UTILITY: 'utility', RENT: 'rent', FOOD: 'food', GAS: 'gas',
  ELECTRICITY: 'electricity', WIFI: 'wifi', INTERNET: 'wifi', CLEANER: 'cleaner', CLEANING: 'cleaner',
  MAINTENANCE: 'maintenance', BUABILL: 'buaBill', WATER: 'water', OTHER: 'other',
  FROM_DEPOSIT: 'fromDeposit', MESS_DEPOSIT: 'fromDeposit', PERSONAL: 'personal', COLLECTED_FUND: 'collectedFund',
  CASH: 'cash', BKASH: 'bkash', NAGAD: 'nagad', ROCKET: 'rocket', BANK: 'bank',
  MEAL: 'meal', PAYMENT: 'payment', EMERGENCY: 'emergency', MEETING: 'meeting', RULE_UPDATE: 'ruleUpdate', GENERAL: 'general',
  MEAL_CORRECTION: 'mealCorrection', PAYMENT_CORRECTION: 'paymentCorrection', LEAVE_REQUEST: 'leaveRequest',
  ROOM_ISSUE: 'roomIssue', FOOD_ISSUE: 'foodIssue', MAINTENANCE_ISSUE: 'maintenanceIssue',
  TRIAL: 'trial', MONTHLY: 'monthly', YEARLY: 'yearly',
  EVERY_DAY: 'everyDay', SPECIFIC_WEEKDAYS: 'specificWeekdays', CUSTOM_DATES: 'customDates',
} as const satisfies Record<string, DomainKey>

function fallbackEnumLabel(value: string | null | undefined) {
  if (!value) return ''
  return value.trim().toLowerCase().split('_').filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

export function domainLabel(value: string | null | undefined, locale: Locale) {
  const key = (keys as Readonly<Record<string, DomainKey>>)[String(value ?? '').toUpperCase()]
  return key ? getDictionary(locale).domain[key] : fallbackEnumLabel(value)
}

export const roleLabel = domainLabel
export const statusLabel = domainLabel
export const mealNameLabel = domainLabel
export const weekdayLabel = domainLabel
export const expenseCategoryLabel = domainLabel
export const expensePaymentSourceLabel = domainLabel
export const paymentMethodLabel = domainLabel
export const noticeTypeLabel = domainLabel
export const complaintCategoryLabel = domainLabel
export const subscriptionPlanLabel = domainLabel
export const bazarFrequencyLabel = domainLabel
