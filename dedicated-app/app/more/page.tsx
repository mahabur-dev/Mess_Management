'use client'

import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { useAuth } from '../providers'
import { ChevronRight, LogOut, User, Settings, Bell, ReceiptText, CreditCard, AlertTriangle, Coins } from 'lucide-react'
import Link from 'next/link'

export default function MorePage() {
  const { user, logout } = useAuth()

  return (
    <MobileShell>
      <TopScreen title="More" subtitle="Settings and support" />
      <div className="screen space-y-4">
        <div className="glass rounded-[28px] p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-[#dff4f3]/12 text-[#008d8c]">
              <User size={24} />
            </div>
            <div>
              <div className="text-base font-black text-[#123748]">{user?.name ?? 'Manager'}</div>
              <div className="text-xs font-medium text-[#65838b]">{user?.email ?? ''}</div>
            </div>
          </div>
        </div>

        <div className="glass rounded-[28px] overflow-hidden">
          {[
            ['Profile', '/profile', User],
            ['Settings', '/settings', Settings],
            ['Payments', '/payments', CreditCard],
            ['Expenses', '/expenses', ReceiptText],
            ['Complaints', '/complaints', AlertTriangle],
            ['Deposits', '/deposits', Coins],
            ['Notifications', '/notices', Bell],
            ['Monthly Bill', '/monthly-bill', ReceiptText],
          ].map(([label, href, Icon]) => (
            <Link key={label as string} href={href as string} className="flex items-center justify-between border-b border-[#cfeeed] px-4 py-4 last:border-b-0">
              <div className="flex items-center gap-3">
                <Icon size={18} className="text-[#008d8c]" />
                <div className="text-sm font-bold text-[#123748]">{label as string}</div>
              </div>
              <ChevronRight size={18} className="text-[#7da0a6]" />
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
