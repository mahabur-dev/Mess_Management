'use client'

import Link from 'next/link'
import { Edit3 } from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { useAuth } from '../providers'

export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <MobileShell>
      <TopScreen title="Profile" subtitle="Manager account" backHref="/more" />
      <div className="screen space-y-4">
        <div className="glass rounded-[28px] p-5">
          <div className="text-sm font-bold text-[#667b8a]">Name</div>
          <div className="mt-1 text-lg font-black text-[#14324a]">{user?.name ?? '-'}</div>
          <div className="mt-4 text-sm font-bold text-[#667b8a]">Email</div>
          <div className="mt-1 text-lg font-black text-[#14324a]">{user?.email ?? '-'}</div>
          <div className="mt-4 text-sm font-bold text-[#667b8a]">Phone</div>
          <div className="mt-1 text-lg font-black text-[#14324a]">{user?.phone ?? '-'}</div>
          <Link href="/settings" className="mt-5 primary-btn flex items-center justify-center gap-2">
            <Edit3 size={18} /> Edit Profile
          </Link>
        </div>
      </div>
    </MobileShell>
  )
}
