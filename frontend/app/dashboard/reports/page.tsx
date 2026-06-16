'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { apiClient, type Mess, type MessDashboard } from '@/lib/api-client'
import { useAuth } from '@/app/context/auth-context'
import { BarChart3, ClipboardList, CreditCard, UtensilsCrossed, WalletCards, TrendingUp, Users, DollarSign, FileText, ArrowUpRight } from 'lucide-react'
import { useEffect, useState } from 'react'

const CARD_STYLES = [
  {
    gradient: 'from-[#2f80ed]/90 to-[#3b8cff]/90',
    iconBg: 'bg-white/20',
    label: 'Daily Meal Report',
    icon: UtensilsCrossed,
  },
  {
    gradient: 'from-[#f59e0b]/90 to-[#fbbf24]/90',
    iconBg: 'bg-white/20',
    label: 'Monthly Expense Report',
    icon: WalletCards,
  },
  {
    gradient: 'from-[#ef4444]/90 to-[#f87171]/90',
    iconBg: 'bg-white/20',
    label: 'Member Due Report',
    icon: ClipboardList,
  },
  {
    gradient: 'from-[#10b981]/90 to-[#34d399]/90',
    iconBg: 'bg-white/20',
    label: 'Payment Report',
    icon: CreditCard,
  },
]

export default function ReportsPage() {
  const [mess, setMess] = useState<Mess | null>(null)
  const [dashboard, setDashboard] = useState<MessDashboard | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    async function load() {
      const messRes = user?.role === 'ADMIN'
        ? await apiClient.getAllMesses({ limit: 100 }).catch(() => null)
        : await apiClient.getMesses().catch(() => null)
      const list = Array.isArray(messRes?.data)
        ? messRes.data
        : messRes?.data
          ? [messRes.data]
          : ((user?.memberships?.map((item) => item.mess).filter(Boolean) ?? []) as Mess[])
      setMess(list[0] ?? null)
      if (list[0]) {
        const data = await apiClient.getMessDashboard(list[0].id).catch(() => null)
        setDashboard(data?.data ?? null)
      }
    }
    load()
  }, [user?.role])

  const cards = [
    ['Daily Meal Report', dashboard?.todayTotalMeals ?? 0, UtensilsCrossed, 'meal'],
    ['Monthly Expense Report', `৳ ${Number(dashboard?.currentMonthTotalBazar ?? 0).toLocaleString()}`, WalletCards, 'expense'],
    ['Member Due Report', `৳ ${Number(dashboard?.totalDue ?? 0).toLocaleString()}`, ClipboardList, 'due'],
    ['Payment Report', dashboard?.pendingPayments ?? 0, CreditCard, 'payment'],
  ] as const

  const CARD_GRADIENTS: Record<string, string> = {
    meal: 'from-[#2f80ed] to-[#58d68d]',
    expense: 'from-[#f59e0b] to-[#f97316]',
    due: 'from-[#ef4444] to-[#f43f5e]',
    payment: 'from-[#10b981] to-[#34d399]',
  }

  return (
    <div className="min-h-screen bg-[#fafcff]">
      <DashboardHeader title="Reports" description={mess ? `${mess.name} reporting center` : 'Reports and analytics'} />
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-7 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/15 to-[#8b5cf6]/15 shadow-sm">
            <BarChart3 size={24} className="text-[#8b5cf6]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#172554]">Dashboard Reports</h2>
            <p className="mt-0.5 text-xs font-semibold text-[#6b7a99]">
              {mess ? `${mess.name} - Summary overview` : 'Reports and analytics'}
            </p>
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value, Icon, tone]) => {
            const gradientClass = CARD_GRADIENTS[tone] || 'from-[#6366f1] to-[#8b5cf6]'
            return (
              <div
                key={label}
                className="group relative overflow-hidden rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass}`} />
                
                {/* Decorative elements */}
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
                <div className="absolute -bottom-8 -left-8 h-20 w-20 rounded-full bg-white/8 blur-xl" />
                
                <div className="relative z-10 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-[11px] font-black uppercase tracking-[0.1em] text-white/80">
                        {label}
                      </p>
                      <p className="mt-3 text-3xl font-black text-white">
                        {value}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                      <Icon size={22} className="text-white" />
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold text-white/70">
                    <ArrowUpRight size={13} />
                    <span>Live update</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Info Card */}
        <div className="mt-7 overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)] transition hover:border-[#a9ccfb] hover:shadow-md">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/10 to-[#8b5cf6]/10 shadow-sm">
                <FileText size={22} className="text-[#2f80ed]" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#172554]">PDF/Excel Export Ready</h3>
                <p className="mt-1.5 text-sm font-semibold leading-relaxed text-[#6b7a99]">
                  The report dashboard is connected to backend summary data and ready for export buttons.
                  All key metrics—meal counts, expenses, dues, and payments—are pulled from live data.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg border border-[#d8e6f8] bg-[#edf5ff] px-3 py-1.5 text-[11px] font-bold text-[#2f80ed]">
                    <FileText size={13} />
                    PDF Export
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-[#d8e6f8] bg-[#edf5ff] px-3 py-1.5 text-[11px] font-bold text-[#2f80ed]">
                    <FileText size={13} />
                    Excel Export
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-[#d8e6f8] bg-[#edf5ff] px-3 py-1.5 text-[11px] font-bold text-[#2f80ed]">
                    <TrendingUp size={13} />
                    Real-time Data
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}