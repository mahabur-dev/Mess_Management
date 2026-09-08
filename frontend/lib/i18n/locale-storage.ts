import { DEFAULT_LOCALE, LEGACY_LOCALE_STORAGE_KEYS, LOCALE_COOKIE_KEY, LOCALE_STORAGE_KEY, isLocale, type Locale } from './types'

export type LocaleStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function resolveStoredLocale(storage: LocaleStorage, browserLanguage = ''): Locale {
  const stored = storage.getItem(LOCALE_STORAGE_KEY)
  if (isLocale(stored)) return stored
  for (const key of LEGACY_LOCALE_STORAGE_KEYS) {
    const legacy = storage.getItem(key)
    if (isLocale(legacy)) return legacy
  }
  return browserLanguage.toLowerCase().startsWith('bn') ? 'bn' : DEFAULT_LOCALE
}

export function persistStoredLocale(storage: LocaleStorage, locale: Locale) {
  storage.setItem(LOCALE_STORAGE_KEY, locale)
  for (const key of LEGACY_LOCALE_STORAGE_KEYS) storage.removeItem(key)
}

export function persistLocaleCookie(document: Pick<Document, 'cookie'>, locale: Locale) {
  document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`
}
