'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { formatDate, formatMoney, formatMonth, formatNumber, formatRelativeTime, formatTime, formatWeekday } from './formatters'
import { synchronizeLocaleDocument } from './locale-document'
import { persistLocaleCookie, persistStoredLocale, resolveStoredLocale } from './locale-storage'
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

export function LocaleProvider({ children, initialLocale = DEFAULT_LOCALE }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const [isLocaleReady] = useState(true)
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
    persistLocaleCookie(document, next)
    synchronizeLocaleDocument(document, next)
  }, [])

  const applyUserLocale = useCallback((next: Locale) => {
    const scrollContainer = document.querySelector<HTMLElement>('.dashboard-scroll-viewport')
    const probeY = document.querySelector('.dashboard-header-clean') ? 84 : 88
    const anchor = document.elementFromPoint(Math.min(window.innerWidth / 2, window.innerWidth - 24), probeY) as HTMLElement | null
    const anchorTop = anchor?.getBoundingClientRect().top

    applyLocale(next, 'user')
    if (anchor && anchorTop != null) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!anchor.isConnected) return
        const offset = anchor.getBoundingClientRect().top - anchorTop
        if (Math.abs(offset) < 0.5) return
        if (scrollContainer) scrollContainer.scrollTop += offset
        else window.scrollBy({ top: offset, left: 0, behavior: 'instant' })
      }))
    }
  }, [applyLocale])

  useEffect(() => {
    let resolvedLocale: Locale = initialLocale
    try {
      resolvedLocale = resolveStoredLocale(window.localStorage, initialLocale)
    } catch {
      // Use browser language when storage access is restricted.
    }
    if (resolvedLocale !== initialLocale) applyLocale(resolvedLocale, 'bootstrap')
    else {
      persistStoredLocale(window.localStorage, resolvedLocale)
      persistLocaleCookie(document, resolvedLocale)
      synchronizeLocaleDocument(document, resolvedLocale)
    }
  }, [applyLocale, initialLocale])

  useEffect(() => synchronizeLocaleDocument(document, locale), [locale])

  const setLocale = useCallback((next: Locale) => applyUserLocale(next), [applyUserLocale])
  const toggleLocale = useCallback(
    () => applyUserLocale(locale === 'en' ? 'bn' : 'en'),
    [applyUserLocale, locale],
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
