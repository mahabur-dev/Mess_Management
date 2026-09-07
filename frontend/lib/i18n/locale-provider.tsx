'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { formatDate, formatMoney, formatMonth, formatNumber, formatRelativeTime, formatTime, formatWeekday } from './formatters'
import { synchronizeLocaleDocument } from './locale-document'
import { persistStoredLocale, resolveStoredLocale } from './locale-storage'
import { translate } from './translate'
import { DEFAULT_LOCALE, isLocale, type Locale, type MessageKey, type MessageNamespace, type TranslationValues } from './types'

export type LocaleChangeSource = 'bootstrap' | 'profile' | 'user'

type LocaleContextValue = {
  locale: Locale
  isLocaleReady: boolean
  changeSource: LocaleChangeSource
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  adoptLocale: (locale: Locale | null | undefined) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)
  const [isLocaleReady, setLocaleReady] = useState(false)
  const [changeSource, setChangeSource] = useState<LocaleChangeSource>('bootstrap')
  const sourceRef = useRef<LocaleChangeSource>('bootstrap')

  const applyLocale = useCallback((next: Locale, source: LocaleChangeSource) => {
    sourceRef.current = source
    setLocaleState(next)
    setChangeSource(source)
    try {
      persistStoredLocale(window.localStorage, next)
    } catch {
      // Locale still works for this session when browser storage is unavailable.
    }
    synchronizeLocaleDocument(document, next)
  }, [])

  useEffect(() => {
    let initialLocale: Locale = window.navigator.language.toLowerCase().startsWith('bn') ? 'bn' : DEFAULT_LOCALE
    try {
      initialLocale = resolveStoredLocale(window.localStorage, window.navigator.language)
    } catch {
      // Use browser language when storage access is restricted.
    }
    applyLocale(initialLocale, 'bootstrap')
    setLocaleReady(true)
  }, [applyLocale])

  useEffect(() => synchronizeLocaleDocument(document, locale), [locale])

  const setLocale = useCallback((next: Locale) => applyLocale(next, 'user'), [applyLocale])
  const toggleLocale = useCallback(
    () => applyLocale(locale === 'en' ? 'bn' : 'en', 'user'),
    [applyLocale, locale],
  )
  const adoptLocale = useCallback(
    (next: Locale | null | undefined) => {
      // A slow profile response must not undo a language explicitly chosen now.
      if (isLocale(next) && sourceRef.current !== 'user') applyLocale(next, 'profile')
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
    (key: MessageKey<Namespace>, values?: TranslationValues) => translate(locale, namespace, key, values),
    [locale, namespace],
  )
}

export function useLocaleFormatters() {
  const { locale } = useLocale()
  return useMemo(() => ({
    number: (value: Parameters<typeof formatNumber>[0], options?: Intl.NumberFormatOptions) => formatNumber(value, locale, options),
    money: (value: Parameters<typeof formatMoney>[0], options?: Intl.NumberFormatOptions) => formatMoney(value, locale, options),
    date: (value: Parameters<typeof formatDate>[0], options?: Intl.DateTimeFormatOptions) => formatDate(value, locale, options),
    time: (value: Parameters<typeof formatTime>[0], options?: Intl.DateTimeFormatOptions) => formatTime(value, locale, options),
    month: (value: Parameters<typeof formatMonth>[0], options?: Intl.DateTimeFormatOptions) => formatMonth(value, locale, options),
    weekday: (value: Parameters<typeof formatWeekday>[0], width?: Parameters<typeof formatWeekday>[2]) => formatWeekday(value, locale, width),
    relativeTime: (value: Parameters<typeof formatRelativeTime>[0], relativeTo?: Parameters<typeof formatRelativeTime>[2]) => formatRelativeTime(value, locale, relativeTo),
  }), [locale])
}
