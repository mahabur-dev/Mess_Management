import { dictionaries } from './dictionaries'
import { DEFAULT_LOCALE, type Locale, type MessageNamespace, type TranslationValues } from './types'

function readMessage(source: unknown, path: string): string | undefined {
  let current = source
  for (const segment of path.split('.')) {
    if (!current || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return typeof current === 'string' ? current : undefined
}

function interpolate(message: string, values?: TranslationValues) {
  if (!values) return message
  return message.replace(/\{([A-Za-z0-9_]+)\}/g, (placeholder, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : placeholder,
  )
}

const warnedKeys = new Set<string>()

export function translate(
  locale: Locale,
  namespace: MessageNamespace,
  key: string,
  values?: TranslationValues,
) {
  const localized = readMessage(dictionaries[locale][namespace], key)
  const fallback = readMessage(dictionaries[DEFAULT_LOCALE][namespace], key)
  const message = localized ?? fallback
  const fullKey = `${namespace}.${key}`

  if (!localized && process.env.NODE_ENV !== 'production') {
    const warningKey = `${locale}:${fullKey}`
    if (!warnedKeys.has(warningKey)) {
      warnedKeys.add(warningKey)
      console.warn(`[i18n] Missing ${locale} translation for ${fullKey}; using the English fallback.`)
    }
  }

  if (!message) {
    const warningKey = `all:${fullKey}`
    if (process.env.NODE_ENV !== 'production' && !warnedKeys.has(warningKey)) {
      warnedKeys.add(warningKey)
      console.warn(`[i18n] Missing translation: ${fullKey}`)
    }
    return fullKey
  }

  return interpolate(message, values)
}
