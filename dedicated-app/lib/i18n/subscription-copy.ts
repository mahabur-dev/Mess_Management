import { getDictionary } from './dictionaries'
import type { Locale } from './types'

type SubscriptionMessages = ReturnType<typeof getDictionary>['subscription']
type SubscriptionKey = keyof SubscriptionMessages

const planTitleKeys = {
  TRIAL: 'planTrialTitle',
  MONTHLY: 'planMonthlyTitle',
  YEARLY: 'planYearlyTitle',
} as const satisfies Record<string, SubscriptionKey>

const planDescriptionKeys = {
  TRIAL: 'planTrialDescription',
  MONTHLY: 'planMonthlyDescription',
  YEARLY: 'planYearlyDescription',
} as const satisfies Record<string, SubscriptionKey>

const featureKeys = {
  'Smart Meal Tracking': ['featureSmartMealTracking', 'featureSmartMealTrackingDescription'],
  'Member Management': ['featureMemberManagement', 'featureMemberManagementDescription'],
  'Unlimited Member Management': ['featureUnlimitedMemberManagement', 'featureUnlimitedMemberManagementDescription'],
  'Bazar & Expense Control': ['featureBazarExpenseControl', 'featureBazarExpenseControlDescription'],
  'Advanced Expense Tracking': ['featureAdvancedExpenseTracking', 'featureAdvancedExpenseTrackingDescription'],
  'Auto Monthly Billing': ['featureAutoMonthlyBilling', 'featureAutoMonthlyBillingDescription'],
  'Notice & Communication': ['featureNoticeCommunication', 'featureNoticeCommunicationDescription'],
  'Dashboard & Reports': ['featureDashboardReports', 'featureDashboardReportsDescription'],
  'Priority Support': ['featurePrioritySupport', 'featurePrioritySupportDescription'],
  'Full Dashboard & Reports': ['featureFullDashboardReports', 'featureFullDashboardReportsDescription'],
  'Best Value Pricing': ['featureBestValuePricing', 'featureBestValuePricingDescription'],
} as const satisfies Record<string, readonly [SubscriptionKey, SubscriptionKey]>

export function subscriptionPlanTitle(code: string | null | undefined, fallback: string | undefined, locale: Locale) {
  const key = planTitleKeys[String(code || '').toUpperCase() as keyof typeof planTitleKeys]
  return key ? getDictionary(locale).subscription[key] : fallback || getDictionary(locale).subscription.summaryFallback
}

export function subscriptionPlanDescription(code: string | null | undefined, fallback: string | undefined, locale: Locale) {
  const key = planDescriptionKeys[String(code || '').toUpperCase() as keyof typeof planDescriptionKeys]
  return key ? getDictionary(locale).subscription[key] : fallback || ''
}

export function subscriptionFeatureCopy(feature: string, locale: Locale) {
  const [title] = feature.split('|', 1)
  const keys = featureKeys[title.trim() as keyof typeof featureKeys]
  if (!keys) return feature.replace('|', ' — ')
  const messages = getDictionary(locale).subscription
  return `${messages[keys[0]]} — ${messages[keys[1]]}`
}
