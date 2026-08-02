'use client'

import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { useAuth } from '../providers'
import { ChevronRight, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { getMoreLinks } from '@/lib/app-permissions'
import { appHref } from '@/lib/routes'

export default function MorePage() {
  const { user, logout } = useAuth()
  const links = getMoreLinks(user)

  return (
    <MobileShell>
      <TopScreen title="More" subtitle="Settings and support" backHref="/" />
      <div className="screen space-y-4">
        <div className="ui-card">
          <div className="flex items-center gap-3">
            <div className="ui-icon-tile ui-icon-tile--lg bg-[#dff4f3] text-[#008d8c]">
              <User size={24} />
            </div>
            <div>
              <div className="ui-body font-bold">{user?.name ?? 'Manager'}</div>
              <div className="ui-caption mt-0.5">{user?.email ?? ''}</div>
            </div>
          </div>
        </div>

        <div className="ui-card overflow-hidden" style={{ padding: 0 }}>
          {links.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={appHref(href)} className="flex items-center gap-3 border-b border-[#e4eaec] px-4 py-3.5 transition-colors last:border-b-0 active:bg-[#edfafa]">
              <Icon size={18} className="text-[#009796] shrink-0" />
              <span className="ui-label flex-1">{label}</span>
              <ChevronRight size={18} className="text-[#78a4a9]" />
            </Link>
          ))}
        </div>

        <button className="ui-btn ui-btn--primary w-full" onClick={logout}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    </MobileShell>
  )
}
