import { getDictionary } from './dictionaries'
import type { Locale } from './types'

type ExpenseMessageKey = keyof ReturnType<typeof getDictionary>['expenses']
type PaymentMessageKey = keyof ReturnType<typeof getDictionary>['payments']
type BillingMessageKey = keyof ReturnType<typeof getDictionary>['billing']
type MemberMessageKey = keyof ReturnType<typeof getDictionary>['members']
type CommunicationMessageKey = keyof ReturnType<typeof getDictionary>['communication']
type MessMessageKey = keyof ReturnType<typeof getDictionary>['mess']
type SubscriptionMessageKey = keyof ReturnType<typeof getDictionary>['subscription']

const expenseCategoryKeys = {
  GROCERY: 'categoryGrocery',
  FOOD: 'categoryFood',
  UTILITY: 'categoryUtility',
  RENT: 'categoryRent',
  GAS: 'categoryGas',
  ELECTRICITY: 'categoryElectricity',
  WIFI: 'categoryWifi',
  CLEANER: 'categoryCleaner',
  MAINTENANCE: 'categoryMaintenance',
  BUABILL: 'categoryBuaBill',
  WATER: 'categoryWater',
  OTHER: 'categoryOther',
} as const satisfies Record<string, ExpenseMessageKey>

const utilityKeys = {
  RENT: 'categoryRent',
  ELECTRICITY: 'categoryElectricity',
  GAS: 'categoryGas',
  WATER: 'categoryWater',
  INTERNET: 'categoryWifi',
  WIFI: 'categoryWifi',
  CLEANER: 'categoryCleaner',
  CLEANING: 'utilityCleaning',
  MAINTENANCE: 'categoryMaintenance',
  OTHER: 'categoryOther',
} as const satisfies Record<string, ExpenseMessageKey>

const paymentSourceKeys = {
  FROM_DEPOSIT: 'fromDeposit',
  MESS_DEPOSIT: 'fromDeposit',
  PERSONAL: 'personal',
  COLLECTED_FUND: 'messFund',
} as const satisfies Record<string, ExpenseMessageKey>

const usedByKeys = {
  ALL_MEMBERS: 'allMembers',
  SELECTED_MEMBERS: 'specificMembers',
  MEAL_ON_MEMBERS: 'mealMembers',
} as const satisfies Record<string, ExpenseMessageKey>

const splitMethodKeys = {
  EQUAL: 'equal',
  MEAL_COUNT: 'byMealCount',
  CUSTOM: 'manualSplit',
} as const satisfies Record<string, ExpenseMessageKey>

const paymentMethodKeys = {
  CASH: 'cash',
  BKASH: 'bkash',
  NAGAD: 'nagad',
  ROCKET: 'rocket',
  BANK: 'bank',
} as const satisfies Record<string, PaymentMessageKey>

const paymentStatusKeys = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const satisfies Record<string, PaymentMessageKey>

const depositCategoryKeys = {
  MEAL_ADVANCE: 'mealAdvance',
  MEMBER_CONTRIBUTION: 'memberContribution',
} as const satisfies Record<string, PaymentMessageKey>

const billStatusKeys = {
  PENDING: 'statusPending',
  PAID: 'statusPaid',
  PARTIAL: 'statusPartial',
} as const satisfies Record<string, BillingMessageKey>

const closeRequestStatusKeys = {
  PENDING: 'statusPending',
  APPROVED: 'statusApproved',
  REJECTED: 'statusRejected',
} as const satisfies Record<string, BillingMessageKey>

const memberRoleKeys = {
  MEMBER: 'member',
  MANAGER: 'manager',
} as const satisfies Record<string, MemberMessageKey>

const noticeTypeKeys = {
  MEAL: 'typeMeal',
  PAYMENT: 'typePayment',
  EMERGENCY: 'typeEmergency',
  MEETING: 'typeMeeting',
  RULE_UPDATE: 'typeRuleUpdate',
  GENERAL: 'typeGeneral',
} as const satisfies Record<string, CommunicationMessageKey>

const complaintCategoryKeys = {
  MEAL_CORRECTION: 'categoryMealCorrection',
  PAYMENT_CORRECTION: 'categoryPaymentCorrection',
  LEAVE_REQUEST: 'categoryLeaveRequest',
  ROOM_ISSUE: 'categoryRoomIssue',
  FOOD_ISSUE: 'categoryFoodIssue',
  MAINTENANCE_ISSUE: 'categoryMaintenanceIssue',
  OTHER: 'categoryOther',
} as const satisfies Record<string, CommunicationMessageKey>

const complaintStatusKeys = {
  PENDING: 'statusPending',
  PROCESSING: 'statusProcessing',
  SOLVED: 'statusSolved',
  REJECTED: 'statusRejected',
} as const satisfies Record<string, CommunicationMessageKey>

const subscriptionStatusKeys = {
  ACTIVE: 'statusActive',
  EXPIRED: 'statusExpired',
  CANCELLED: 'statusCancelled',
  PENDING: 'statusPending',
} as const satisfies Record<string, SubscriptionMessageKey>

const messSubscriptionStatusKeys = {
  ACTIVE: 'statusActive',
  EXPIRED: 'statusExpired',
  CANCELLED: 'statusCancelled',
  PENDING: 'statusPending',
} as const satisfies Record<string, MessMessageKey>

const messPlanKeys = {
  MONTHLY: 'planMonthly',
  YEARLY: 'planYearly',
  TRIAL: 'planTrial',
} as const satisfies Record<string, MessMessageKey>

function fallbackEnumLabel(value: string | null | undefined) {
  if (!value) return ''
  return value
    .trim()
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function mappedLabel<Namespace extends 'expenses' | 'payments' | 'billing' | 'members' | 'communication' | 'mess' | 'subscription', Key extends string>(
  namespace: Namespace,
  keys: Readonly<Record<string, Key>>,
  value: string | null | undefined,
  locale: Locale,
) {
  const normalized = String(value || '').toUpperCase()
  const key = keys[normalized]
  if (!key) return fallbackEnumLabel(value)
  return getDictionary(locale)[namespace][key as keyof ReturnType<typeof getDictionary>[Namespace]] as string
}

export function expenseCategoryLabel(value: string | null | undefined, locale: Locale) {
  return mappedLabel('expenses', expenseCategoryKeys, value, locale)
}

export function utilityTypeLabel(value: string | null | undefined, locale: Locale) {
  return mappedLabel('expenses', utilityKeys, value, locale)
}

export function expensePaymentSourceLabel(value: string | null | undefined, locale: Locale) {
  return mappedLabel('expenses', paymentSourceKeys, value, locale)
}

export function expenseUsedByLabel(value: string | null | undefined, locale: Locale) {
  return mappedLabel('expenses', usedByKeys, value, locale)
}

export function expenseSplitMethodLabel(value: string | null | undefined, locale: Locale) {
  return mappedLabel('expenses', splitMethodKeys, value, locale)
}

export function paymentMethodLabel(value: string | null | undefined, locale: Locale) {
  return mappedLabel('payments', paymentMethodKeys, value, locale)
}

export function paymentStatusLabel(value: string | null | undefined, locale: Locale) {
  return mappedLabel('payments', paymentStatusKeys, value, locale)
}

export function depositCategoryLabel(value: string | null | undefined, locale: Locale) {
  return mappedLabel('payments', depositCategoryKeys, value, locale)
}

export function billStatusLabel(value: string | null | undefined, locale: Locale) {
  return mappedLabel('billing', billStatusKeys, value, locale)
}

export function closeRequestStatusLabel(value: string | null | undefined, locale: Locale) {
  return mappedLabel('billing', closeRequestStatusKeys, value, locale)
}

export function memberRoleLabel(value: string | null | undefined, locale: Locale) {
  return mappedLabel('members', memberRoleKeys, value, locale)
}

export function noticeTypeLabel(value: string | null | undefined, locale: Locale) {
  return mappedLabel('communication', noticeTypeKeys, value, locale)
}

export function complaintCategoryLabel(value: string | null | undefined, locale: Locale) {
  return mappedLabel('communication', complaintCategoryKeys, value, locale)
}

export function complaintStatusLabel(value: string | null | undefined, locale: Locale) {
  return mappedLabel('communication', complaintStatusKeys, value, locale)
}

export function subscriptionStatusLabel(value: string | null | undefined, locale: Locale) {
  return mappedLabel('subscription', subscriptionStatusKeys, value, locale)
}

export function messSubscriptionStatusLabel(value: string | null | undefined, locale: Locale) {
  return mappedLabel('mess', messSubscriptionStatusKeys, value, locale)
}

export function messPlanLabel(value: string | null | undefined, locale: Locale) {
  return mappedLabel('mess', messPlanKeys, value, locale)
}
