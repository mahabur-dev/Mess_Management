'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Wallet2, Users, UtensilsCrossed, ClipboardList, BadgeInfo, MessageSquareWarning, Settings, Coins, ReceiptText } from 'lucide-react'
import { useAuth } from './providers'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'

type DashboardNotice = {
  id: string
  title: string
  created_at: string
}

type DashboardSummary = {
  activeMembers?: number
  todayTotalMeals?: number
  totalDue?: number
  currentMealRate?: number
  paidAmount?: number
  openComplaints?: number
  notices?: DashboardNotice[]
}

export default function HomePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  const activeMess = useMemo(() => user?.memberships?.[0]?.mess ?? null, [user])

  useEffect(() => {
    if (!isLoading && !user) router.push('/login')
  }, [isLoading, user, router])

  useEffect(() => {
    if (!activeMess?.id) return
    api.getMessDashboard(activeMess.id).then((res) => setSummary(res.data)).catch(() => setSummary(null))
  }, [activeMess?.id])

  if (isLoading || !user) {
    return <div className="grid min-h-screen place-items-center text-sm font-bold text-[#58717d]">Loading...</div>
  }

  return (
    <MobileShell>
      <TopScreen title="Dashboard" subtitle={activeMess?.name ?? 'No mess selected'} />
      <div className="screen">
        <section className="glass -mt-10 rounded-[28px] px-4 py-5">
          <div className="text-[13px] font-semibold text-[#58717d]">Good Morning, {user.name.split(' ')[0]}</div>
          <div className="mt-1 text-[22px] font-black text-[#14324a]">Here&apos;s what&apos;s happening today</div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Members', value: summary?.activeMembers ?? '--', icon: Users, color: '#0f7e86' },
              { label: 'Meals', value: summary?.todayTotalMeals ?? '--', icon: UtensilsCrossed, color: '#f59e0b' },
              { label: 'Due', value: summary?.totalDue ? `BDT ${summary.totalDue}` : '--', icon: Wallet2, color: '#ef4444' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl border border-[#d8ecec] bg-white px-3 py-4 shadow-sm">
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-2xl" style={{ backgroundColor: `${color}15`, color }}>
                  <Icon size={18} />
                </div>
                <div className="mt-3 text-center text-[11px] font-bold text-[#5e7481]">{label}</div>
                <div className="mt-1 text-center text-[18px] font-black text-[#14324a]">{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <div className="section-title">Quick Actions</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/add-member', label: 'Add Member', icon: Users },
              { href: '/add-expense', label: 'Add Expense', icon: CreditCard },
              { href: '/expenses', label: 'Expenses', icon: ReceiptText },
              { href: '/add-meal', label: 'Add Meal', icon: UtensilsCrossed },
              { href: '/notices', label: 'Send Notice', icon: ClipboardList },
              { href: '/payments', label: 'Payments', icon: Wallet2 },
              { href: '/complaints', label: 'Complaints', icon: MessageSquareWarning },
              { href: '/deposits', label: 'Deposits', icon: Coins },
              { href: '/settings', label: 'Settings', icon: Settings },
            ].map(({ href, label, icon: Icon }) => (
              <button key={label} onClick={() => router.push(href)} className="glass rounded-[22px] p-4 text-left">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0f7e86]/10 text-[#0f7e86]">
                  <Icon size={20} />
                </div>
                <div className="mt-3 text-sm font-extrabold text-[#14324a]">{label}</div>
                <div className="mt-1 text-[11px] font-medium text-[#667b8a]">Open form</div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5 glass rounded-[28px] p-4">
          <div className="section-title mb-2">Overview</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Meal Rate', summary?.currentMealRate ?? '--'],
              ['Paid', summary?.paidAmount ?? '--'],
              ['Members', summary?.activeMembers ?? '--'],
              ['Complaints', summary?.openComplaints ?? '--'],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-2xl bg-[#f7fbfd] px-4 py-3">
                <div className="text-[11px] font-bold text-[#667b8a]">{label}</div>
                <div className="mt-1 text-lg font-black text-[#14324a]">{String(value)}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 glass rounded-[28px] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title mb-0">Recent</div>
              <div className="text-base font-black text-[#14324a]">Notices & updates</div>
            </div>
            <BadgeInfo className="text-[#0f7e86]" />
          </div>
          <div className="mt-4 space-y-3">
            {(summary?.notices ?? []).slice(0, 3).map((notice) => (
              <div key={notice.id} className="rounded-2xl border border-[#d8ecec] bg-white px-4 py-3">
                <div className="text-sm font-extrabold text-[#14324a]">{notice.title}</div>
                <div className="mt-1 text-xs font-medium text-[#667b8a]">{new Date(notice.created_at).toLocaleDateString()}</div>
              </div>
            ))}
            {!(summary?.notices?.length) ? <div className="py-4 text-sm text-[#667b8a]">No notices loaded yet.</div> : null}
          </div>
        </section>
      </div>
    </MobileShell>
  )
}
