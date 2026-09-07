'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useTranslations } from '@/lib/i18n'

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const common = useTranslations('common')
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={className}
      aria-label={isDark ? common('switchToLightMode') : common('switchToDarkMode')}
      title={isDark ? common('lightMode') : common('darkMode')}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </Button>
  )
}
