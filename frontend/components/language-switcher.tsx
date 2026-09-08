'use client'

import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocale, useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type LanguageSwitcherProps = { className?: string; compact?: boolean }

export function LanguageSwitcher({ className, compact = false }: LanguageSwitcherProps) {
  const { locale, toggleLocale } = useLocale()
  const common = useTranslations('common')
  const targetLabel = locale === 'en' ? common('bangla') : common('english')
  const accessibleLabel = locale === 'en' ? common('switchToBangla') : common('switchToEnglish')

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? 'icon' : 'default'}
      onClick={toggleLocale}
      className={cn(!compact && 'gap-2 px-3', className)}
      data-language-switcher
      aria-label={accessibleLabel}
      title={accessibleLabel}
    >
      {compact ? (
        <span className="text-[11px] font-bold leading-none">{locale === 'en' ? 'বাং' : 'EN'}</span>
      ) : (
        <>
          <Languages size={17} aria-hidden="true" />
          <span>{targetLabel}</span>
        </>
      )}
    </Button>
  )
}
