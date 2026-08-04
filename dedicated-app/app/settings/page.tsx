'use client'

import Link from 'next/link'
import { ChevronRight, KeyRound, ShieldCheck, UserRound } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { appHref } from '@/lib/routes'

export default function SettingsPage() {
  return (
    <MobileShell>
      <TopScreen title="Settings" subtitle="Account preferences" backHref="/more" />
      <div className="screen space-y-4">
        <section className="ui-card overflow-hidden" style={{ padding: 0 }}>
          <div className="flex items-center gap-3 border-b border-[#e4eaec] px-4 py-3.5">
            <div className="ui-icon-tile ui-icon-tile--lg bg-[#dff4f3] text-[#008d8c]" aria-hidden="true">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="ui-body font-bold">Account & Security</div>
              <div className="ui-caption mt-0.5">Manage your profile and password</div>
            </div>
          </div>

          <Link
            href={appHref('/edit-profile')}
            className="flex items-center gap-3 border-b border-[#e4eaec] px-4 py-3.5 transition-colors last:border-b-0 active:bg-[#edfafa]"
            aria-label="Edit profile"
          >
            <div className="ui-icon-tile ui-icon-tile--md bg-[#edfafa] text-[#008d8c]" aria-hidden="true">
              <UserRound size={19} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="ui-label">Profile</div>
              <div className="ui-caption mt-0.5">Name, email, phone and profile photo</div>
            </div>
            <ChevronRight size={18} className="shrink-0 text-[#78a4a9]" aria-hidden="true" />
          </Link>

          <Link
            href={appHref('/change-password')}
            className="flex items-center gap-3 px-4 py-3.5 transition-colors last:border-b-0 active:bg-[#edfafa]"
            aria-label="Change password"
          >
            <div className="ui-icon-tile ui-icon-tile--md bg-[#edfafa] text-[#008d8c]" aria-hidden="true">
              <KeyRound size={19} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="ui-label">Password</div>
              <div className="ui-caption mt-0.5">Update your account password</div>
            </div>
            <ChevronRight size={18} className="shrink-0 text-[#78a4a9]" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </MobileShell>
  )
}