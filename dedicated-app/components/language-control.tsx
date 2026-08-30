'use client'

import { Languages } from 'lucide-react'
import { useLocale, useTranslations } from '@/lib/i18n'

export function AuthLanguageToggle() {
  const { locale, toggleLocale } = useLocale()
  const common = useTranslations('common')
  return (
    <button
      type="button"
      className="auth-language-toggle"
      onClick={toggleLocale}
      aria-label={common('language')}
      title={locale === 'en' ? common('bangla') : common('english')}
    >
      <Languages size={15} aria-hidden="true" />
      <span>{locale === 'en' ? 'EN' : 'বাং'}</span>
    </button>
  )
}
