'use client'

export function CompactLanguageToggle({
  locale,
  onToggle,
  disabled = false,
}: {
  locale: 'en' | 'bn'
  onToggle: () => void
  disabled?: boolean
}) {
  return (
    <div className="quick-add-language-select">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={locale === 'en' ? 'Switch to Bangla' : 'Switch to English'}
        title={locale === 'en' ? 'বাংলা' : 'English'}
      >
        {locale === 'en' ? 'En' : 'বাং'}
      </button>
    </div>
  )
}
