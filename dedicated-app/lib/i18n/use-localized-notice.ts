'use client'

import { useCallback, useMemo, useState } from 'react'
import { localizedErrorMessage } from './errors'
import { useLocale, useTranslations } from './locale-provider'
import type { MessageKey, MessageNamespace, TranslationValues } from './types'

export type NoticeTone = 'info' | 'warning' | 'success' | 'danger'

type MessageNotice<Namespace extends MessageNamespace> = {
  kind: 'message'
  key: MessageKey<Namespace>
  tone: NoticeTone
  values?: TranslationValues
}

type ErrorNotice<Namespace extends MessageNamespace> = {
  kind: 'error'
  error: unknown
  fallbackKey: MessageKey<Namespace>
  tone: 'danger'
}

type LocalizedNotice<Namespace extends MessageNamespace> =
  | MessageNotice<Namespace>
  | ErrorNotice<Namespace>

export function useLocalizedNotice<Namespace extends MessageNamespace>(namespace: Namespace) {
  const { locale } = useLocale()
  const translate = useTranslations(namespace)
  const [notice, setNotice] = useState<LocalizedNotice<Namespace> | null>(null)

  const clearNotice = useCallback(() => setNotice(null), [])
  const showMessage = useCallback(
    (key: MessageKey<Namespace>, tone: NoticeTone = 'info', values?: TranslationValues) =>
      setNotice({ kind: 'message', key, tone, values }),
    [],
  )
  const showError = useCallback(
    (error: unknown, fallbackKey: MessageKey<Namespace>) =>
      setNotice({ kind: 'error', error, fallbackKey, tone: 'danger' }),
    [],
  )

  const localizedNotice = useMemo(() => {
    if (!notice) return null
    const message = notice.kind === 'message'
      ? translate(notice.key, notice.values)
      : localizedErrorMessage(errorForNotice(notice), locale, translate(notice.fallbackKey))
    return { message, tone: notice.tone }
  }, [locale, notice, translate])

  return { notice: localizedNotice, clearNotice, showMessage, showError }
}

function errorForNotice<Namespace extends MessageNamespace>(notice: ErrorNotice<Namespace>) {
  return notice.error
}
