'use client'

import Link from 'next/link'
import { ChevronRight, KeyRound, ShieldCheck, UserRound } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { appHref } from '@/lib/routes'
import { useTranslations } from '@/lib/i18n'

export default function SettingsPage() {
  const navigation = useTranslations('navigation')
  const auth = useTranslations('auth')
  const profile = useTranslations('profile')

  return (
    <MobileShell>
      <TopScreen title={navigation('settings')} subtitle={profile('accountPreferences')} backHref="/" />
      <div className="screen space-y-4">
        <section className="ui-card overflow-hidden" style={{ padding: 0 }}>
          <div className="flex items-center gap-3 border-b border-[#e4eaec] px-4 py-3.5">
            <div className="ui-icon-tile ui-icon-tile--lg bg-[#dff4f3] text-[#008d8c]" aria-hidden="true"><ShieldCheck size={24} /></div>
            <div>
              <div className="ui-body font-bold">{profile('accountSecurity')}</div>
              <div className="ui-caption mt-0.5">{profile('manageProfilePassword')}</div>
            </div>
          </div>
          <Link href={appHref('/edit-profile')} className="flex items-center gap-3 border-b border-[#e4eaec] px-4 py-3.5 transition-colors active:bg-[#edfafa]" aria-label={profile('editProfile')}>
            <div className="ui-icon-tile ui-icon-tile--md bg-[#edfafa] text-[#008d8c]" aria-hidden="true"><UserRound size={19} /></div>
            <div className="min-w-0 flex-1"><div className="ui-label">{profile('title')}</div><div className="ui-caption mt-0.5">{profile('profileRowDescription')}</div></div>
            <ChevronRight size={18} className="shrink-0 text-[#78a4a9]" aria-hidden="true" />
          </Link>
          <Link href={appHref('/change-password')} className="flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-[#edfafa]" aria-label={profile('changePassword')}>
            <div className="ui-icon-tile ui-icon-tile--md bg-[#edfafa] text-[#008d8c]" aria-hidden="true"><KeyRound size={19} /></div>
            <div className="min-w-0 flex-1"><div className="ui-label">{auth('password')}</div><div className="ui-caption mt-0.5">{profile('passwordRowDescription')}</div></div>
            <ChevronRight size={18} className="shrink-0 text-[#78a4a9]" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </MobileShell>
  )
}
