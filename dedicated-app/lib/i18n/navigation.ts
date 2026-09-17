import type { MessageKey } from './types'

const ROUTE_LABEL_KEYS: Record<string, MessageKey<'navigation'>> = {
  '/': 'home', '/create-mess': 'createMess', '/request-mess': 'requestMess',
  '/members': 'members', '/meals': 'meals', '/meal-pattern': 'mealPattern',
  '/bazar-schedule': 'bazarSchedule',
  '/quick-add': 'aiAssistant',
  '/expenses': 'expenses', '/payments': 'deposits', '/monthly-bill': 'monthlyBill',
  '/notices': 'notices', '/notifications': 'notifications', '/complaints': 'complaints', '/personal': 'personal',
  '/profile': 'profile', '/settings': 'settings', '/more': 'more',
  '/mess-management': 'messManagement', '/subscription': 'subscription',
  '/how-it-works': 'howItWorks', '/contact-us': 'contactUs',
  '/privacy-policy': 'privacyPolicy', '/terms-and-conditions': 'termsConditions',
}

const ROUTE_DESCRIPTION_KEYS: Record<string, MessageKey<'navigation'>> = {
  '/profile': 'profileDescription', '/settings': 'settingsDescription',
  '/meal-pattern': 'mealPatternDescription', '/personal': 'personalDescription',
  '/bazar-schedule': 'bazarScheduleDescription',
  '/complaints': 'complaintsDescription', '/mess-management': 'messManagementDescription',
  '/subscription': 'subscriptionDescription', '/how-it-works': 'howItWorksDescription',
  '/contact-us': 'contactUsDescription', '/privacy-policy': 'privacyPolicyDescription',
  '/terms-and-conditions': 'termsConditionsDescription',
}

type Translator = (key: MessageKey<'navigation'>, values?: Record<string, string | number>) => string

export function routeLabel(href: string, fallback: string, t: Translator) {
  const key = ROUTE_LABEL_KEYS[href]
  return key ? t(key) : fallback
}

export function routeDescription(href: string, fallback: string, t: Translator) {
  const key = ROUTE_DESCRIPTION_KEYS[href]
  return key ? t(key) : fallback
}
