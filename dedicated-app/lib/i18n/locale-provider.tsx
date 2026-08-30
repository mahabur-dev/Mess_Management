'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  formatDate,
  formatMoney,
  formatMonth,
  formatNumber,
  formatRelativeTime,
  formatTime,
  formatWeekday,
} from './formatters'
import { translate } from './translate'
import { persistStoredLocale, resolveStoredLocale } from './locale-storage'
import { synchronizeLocaleDocument } from './locale-document'
import {
  DEFAULT_LOCALE,
  isLocale,
  type Locale,
  type MessageKey,
  type MessageNamespace,
  type TranslationValues,
} from './types'

type LocaleChangeSource = 'bootstrap' | 'profile' | 'user'

type LocaleContextValue = {
  locale: Locale
  isLocaleReady: boolean
  changeSource: LocaleChangeSource
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  adoptLocale: (locale: Locale | null | undefined) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function initialBrowserLocale(): Locale {
  return resolveStoredLocale(window.localStorage, window.navigator.language)
}

function persistBrowserLocale(locale: Locale) {
  persistStoredLocale(window.localStorage, locale)
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [isLocaleReady, setLocaleReady] = useState(false)
  const [changeSource, setChangeSource] = useState<LocaleChangeSource>('bootstrap')

  const applyLocale = useCallback((next: Locale, source: LocaleChangeSource) => {
    setLocaleState(next)
    setChangeSource(source)
    persistBrowserLocale(next)
  }, [])

  useEffect(() => {
    applyLocale(initialBrowserLocale(), 'bootstrap')
    setLocaleReady(true)
  }, [applyLocale])

  useEffect(() => {
    synchronizeLocaleDocument(document, locale)
  }, [locale])

  const setLocale = useCallback((next: Locale) => applyLocale(next, 'user'), [applyLocale])
  const toggleLocale = useCallback(
    () => applyLocale(locale === 'en' ? 'bn' : 'en', 'user'),
    [applyLocale, locale],
  )
  const adoptLocale = useCallback(
    (next: Locale | null | undefined) => {
      if (isLocale(next)) applyLocale(next, 'profile')
    },
    [applyLocale],
  )

  const value = useMemo(
    () => ({ locale, isLocaleReady, changeSource, setLocale, toggleLocale, adoptLocale }),
    [adoptLocale, changeSource, isLocaleReady, locale, setLocale, toggleLocale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used inside LocaleProvider')
  return context
}

export function useTranslations<Namespace extends MessageNamespace>(namespace: Namespace) {
  const { locale } = useLocale()
  return useCallback(
    (key: MessageKey<Namespace>, values?: TranslationValues) =>
      translate(locale, namespace, key, values),
    [locale, namespace],
  )
}

export function useLocaleFormatters() {
  const { locale } = useLocale()
  return useMemo(
    () => ({
      number: (value: Parameters<typeof formatNumber>[0], options?: Intl.NumberFormatOptions) =>
        formatNumber(value, locale, options),
      money: (value: Parameters<typeof formatMoney>[0], options?: Intl.NumberFormatOptions) =>
        formatMoney(value, locale, options),
      date: (value: Parameters<typeof formatDate>[0], options?: Intl.DateTimeFormatOptions) =>
        formatDate(value, locale, options),
      time: (value: Parameters<typeof formatTime>[0], options?: Intl.DateTimeFormatOptions) =>
        formatTime(value, locale, options),
      month: (value: Parameters<typeof formatMonth>[0], options?: Intl.DateTimeFormatOptions) =>
        formatMonth(value, locale, options),
      weekday: (value: Parameters<typeof formatWeekday>[0], width?: Parameters<typeof formatWeekday>[2]) =>
        formatWeekday(value, locale, width),
      relativeTime: (
        value: Parameters<typeof formatRelativeTime>[0],
        relativeTo?: Parameters<typeof formatRelativeTime>[2],
      ) => formatRelativeTime(value, locale, relativeTo),
    }),
    [locale],
  )
}
