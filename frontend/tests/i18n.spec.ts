import { test, expect } from '@playwright/test'
import { formatDate, formatIsoDate, formatMoney, normalizeLocalizedDigits } from '../lib/i18n/formatters'
import { resolveStoredLocale, persistStoredLocale } from '../lib/i18n/locale-storage'
import { translate } from '../lib/i18n/translate'
import { localizedErrorMessage } from '../lib/i18n/errors'
import { domainLabel } from '../lib/i18n/domain-labels'
import { LOCALE_STORAGE_KEY, LEGACY_LOCALE_STORAGE_KEYS } from '../lib/i18n/types'
import { synchronizeLocaleDocument } from '../lib/i18n/locale-document'
import { localizedNotificationCopy } from '../lib/i18n/notification-copy'

test('Bangla digits normalize without changing member names or decimal values', () => {
  expect(normalizeLocalizedDigits('রহিম ১২৩৪.৫০')).toBe('রহিম 1234.50')
  expect(formatMoney(1234.5, 'bn')).toContain('১,২৩৪.৫')
  expect(formatMoney(1234.5, 'en')).toContain('1,234.5')
  expect(formatMoney(Number.NaN, 'bn')).not.toContain('NaN')
})

test('calendar keys follow Dhaka midnight and preserve date-only inputs', () => {
  expect(formatIsoDate('2026-08-31T18:05:00Z')).toBe('2026-09-01')
  expect(formatIsoDate('2026-08-31T17:59:59Z')).toBe('2026-08-31')
  expect(formatIsoDate('2026-09-01')).toBe('2026-09-01')
  expect(formatDate('2026-09-01', 'bn')).toMatch(/[০-৯]/)
  expect(formatDate('invalid-date', 'bn')).toBe('invalid-date')
})

test('stored preference takes precedence and legacy keys migrate', () => {
  const entries = new Map<string, string>()
  const storage = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => { entries.set(key, value) },
    removeItem: (key: string) => { entries.delete(key) },
  }
  expect(resolveStoredLocale(storage, 'bn-BD')).toBe('bn')
  entries.set(LEGACY_LOCALE_STORAGE_KEYS[0], 'en')
  expect(resolveStoredLocale(storage, 'bn-BD')).toBe('en')
  persistStoredLocale(storage, 'bn')
  expect(storage.getItem(LOCALE_STORAGE_KEY)).toBe('bn')
  for (const key of LEGACY_LOCALE_STORAGE_KEYS) expect(storage.getItem(key)).toBeNull()
  expect(resolveStoredLocale(storage, 'en-US')).toBe('bn')
})

test('interpolation preserves database content verbatim', () => {
  const name = 'Rahim <script> ১২৩'
  expect(translate('bn', 'operations', 'finance.messDescription', { name })).toContain(name)
  expect(domainLabel('PERSONAL', 'bn')).toBe('ব্যক্তিগত')
  expect(domainLabel('BKASH', 'en')).toMatch(/bKash/i)
})

test('API contract codes localize errors without exposing raw server messages', () => {
  const error = { code: 'AUTH_INVALID_CREDENTIALS', statusCode: 401, message: 'internal detail' }
  expect(localizedErrorMessage(error, 'bn')).toMatch(/[অ-৿]/)
  expect(localizedErrorMessage(error, 'bn')).not.toContain('internal detail')
  expect(localizedErrorMessage({ statusCode: 500 }, 'en')).not.toBe('')
})

test('language document updates include metadata and language attribute', () => {
  const attributes = new Map()
  const document = {
    documentElement: { lang: 'en', dataset: { locale: 'en' } },
    title: '',
    querySelector: () => ({ setAttribute: (key: string, value: string) => attributes.set(key, value) }),
  }
  synchronizeLocaleDocument(document as unknown as Document, 'bn')
  expect(document.documentElement.lang).toBe('bn')
  expect(document.title).toMatch(/[অ-৿]/)
  expect(attributes.get('content')).toMatch(/[অ-৿]/)
})

test('monthly report notifications localize their month and action state', () => {
  const item = {
    title: 'Monthly report ready for review',
    body: 'QA Test Mess monthly report is ready for review.',
    metadata: { source: 'MONTHLY_REPORT_READY', month: '2026-08-01T00:00:00.000Z' },
  }
  expect(localizedNotificationCopy(item, 'en')).toEqual({
    title: 'Monthly report ready for review',
    body: 'The August 2026 report is ready for manager review.',
  })
  const bangla = localizedNotificationCopy({
    ...item,
    metadata: { ...item.metadata, source: 'MONTHLY_REPORT_FINALIZED' },
  }, 'bn')
  expect(bangla.title).toBe('মাসিক রিপোর্ট চূড়ান্ত হয়েছে')
  expect(bangla.body).toContain('আগস্ট ২০২৬')
})
