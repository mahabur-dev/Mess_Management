import enMessages from './messages/en.json'

export const SUPPORTED_LOCALES = ['en', 'bn'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'
export const LOCALE_STORAGE_KEY = 'messzen:locale'
export const LEGACY_LOCALE_STORAGE_KEYS = ['messzen:personal-locale', 'messzen:ai-locale'] as const

export type Messages = typeof enMessages
export type MessageNamespace = keyof Messages

type StringKeyOf<T> = Extract<keyof T, string>
type NestedStringKey<T> = {
  [Key in StringKeyOf<T>]: T[Key] extends string
    ? Key
    : T[Key] extends Record<string, unknown>
      ? `${Key}.${NestedStringKey<T[Key]>}`
      : never
}[StringKeyOf<T>]

export type MessageKey<Namespace extends MessageNamespace> = NestedStringKey<Messages[Namespace]>
export type TranslationValues = Record<string, string | number>

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Locale)
}

export function intlLocale(locale: Locale) {
  return locale === 'bn' ? 'bn-BD' : 'en-BD'
}
