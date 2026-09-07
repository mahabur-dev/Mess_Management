import { getDictionary } from './dictionaries'
import type { Locale } from './types'

type LocaleDocument = Pick<Document, 'documentElement' | 'title' | 'querySelector'>

export function synchronizeLocaleDocument(document: LocaleDocument, locale: Locale) {
  const dictionary = getDictionary(locale)
  document.documentElement.lang = locale
  document.documentElement.dataset.locale = locale
  document.title = dictionary.common.appTitle
  document.querySelector('meta[name="description"]')?.setAttribute('content', dictionary.common.appDescription)
}
