'use client'

import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { useAuth } from '../providers'
import { ChevronRight, House, LogOut, User } from 'lucide-react'
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
        <div className="glass rounded-[28px] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-[#dff4f3]/12 text-[#008d8c]">
              <User size={24} />
            </div>
            <div>
              <div className="text-body font-bold text-[#245d66]">{user?.name ?? 'Manager'}</div>
              <div className="text-caption font-medium text-[#6a858c]">{user?.email ?? ''}</div>
            </div>
          </div>
        </div>

        <div className="glass rounded-[28px] overflow-hidden">
          <Link href={appHref('/')} className="flex items-center justify-between px-4 py-4 transition-colors active:bg-[#edfafa]">
            <div className="flex items-center gap-3">
              <House size={18} className="text-[#009796]" />
              <div className="text-label font-bold text-[#245d66]">Back to Home</div>
            </div>
            <ChevronRight size={18} className="text-[#78a4a9]" />
          </Link>
        </div>

        <div className="glass rounded-[28px] overflow-hidden">
          {links.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={appHref(href)} className="flex items-center justify-between border-b border-[#cfeeed] px-4 py-4 transition-colors last:border-b-0 active:bg-[#edfafa]">
              <div className="flex items-center gap-3">
                <Icon size={18} className="text-[#009796]" />
                <div className="text-label font-bold text-[#245d66]">{label}</div>
              </div>
              <ChevronRight size={18} className="text-[#78a4a9]" />
            </Link>
          ))}
        </div>

        <button className="primary-btn flex w-full items-center justify-center gap-2" onClick={logout}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    </MobileShell>
  )
}
