'use client'

import { useAuth } from '@/app/providers'
import { AuthLanguageToggle } from '@/components/language-control'
import { MobileShell } from '@/components/mobile-shell'
import { MoreNavigation } from '@/components/mobile/more-navigation'
import { TopScreen } from '@/components/top-screen'
import { useTranslations } from '@/lib/i18n'

export default function MorePage() {
  const { logout, user } = useAuth()
  const navigation = useTranslations('navigation')

  return (
    <MobileShell showBottomNavigation>
      <TopScreen
        title={navigation('menuTitle')}
        leading={<span className="h-11 w-11" aria-hidden="true" />}
        trailing={<AuthLanguageToggle />}
      />

      {user ? <MoreNavigation user={user} onLogout={logout} /> : null}
    </MobileShell>
  )
}
