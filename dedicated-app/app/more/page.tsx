'use client'

import { useAuth } from '@/app/providers'
import { AuthLanguageToggle } from '@/components/language-control'
import { MobileShell } from '@/components/mobile-shell'
import { MoreNavigation } from '@/components/mobile/more-navigation'
import { TopScreen } from '@/components/top-screen'
import { useTranslations } from '@/lib/i18n'

export default function MorePage() {
  const { requestLogout, user } = useAuth()
  const navigation = useTranslations('navigation')

  return (
    <MobileShell showBottomNavigation>
      <TopScreen
        title={navigation('menuTitle')}
        subtitle={navigation('menuSubtitle')}
        trailing={<AuthLanguageToggle />}
      />

      {user ? <MoreNavigation user={user} onLogout={requestLogout} /> : null}
    </MobileShell>
  )
}
