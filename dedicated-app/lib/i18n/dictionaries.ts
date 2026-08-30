import bnMessages from './messages/bn.json'
import enMessages from './messages/en.json'
import type { Locale, Messages } from './types'

export const dictionaries: Record<Locale, Messages> = {
  en: enMessages,
  bn: bnMessages,
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale]
}
