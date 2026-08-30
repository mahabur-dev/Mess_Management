import { getDictionary } from './dictionaries'
import type { Locale } from './types'

type LocaleDocument = Pick<Document, 'documentElement' | 'title' | 'querySelector'>

export function synchronizeLocaleDocument(document: LocaleDocument, locale: Locale) {
  const dictionary = getDictionary(locale)
  document.documentElement.lang = locale
  document.documentElement.dataset.locale = locale
  document.title = dictionary.common.appTitle
  document.querySelector('meta[name="description"]')?.setAttribute('content', dictionary.common.appDescription)
  document.querySelector('meta[name="application-name"]')?.setAttribute('content', dictionary.common.pwaName)
  document.querySelector('meta[name="apple-mobile-web-app-title"]')?.setAttribute('content', dictionary.common.pwaName)
  document.querySelector('link[rel="manifest"]')?.setAttribute('href', `/manifest-${locale}.webmanifest`)
}
