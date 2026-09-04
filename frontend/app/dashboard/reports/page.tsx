'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { apiClient, type Mess, type MessDashboard } from '@/lib/api-client'
import { useAuth } from '@/app/context/auth-context'
import { BarChart3, ClipboardList, CreditCard, UtensilsCrossed, WalletCards, TrendingUp, Users, DollarSign, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'

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

  return (
    <div className="min-h-screen bg-transparent">
      <DashboardHeader title="Reports" description={mess ? `${mess.name} reporting center` : 'Reports and analytics'} />
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-7 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f80ed]/15 to-[#8b5cf6]/15 shadow-sm">
            <BarChart3 size={24} className="text-[#8b5cf6]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#172554]">Dashboard Reports</h2>
            <p className="mt-0.5 text-xs font-semibold text-[#6b7a99]">
              {mess ? `${mess.name} - Summary overview` : 'Reports and analytics'}
            </p>
          </div>
        </div>

        {/* Report Cards */}
        <div className="dashboard-report-grid grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value, Icon, tone]) => {
            return (
              <div
                key={label}
                data-tone={tone}
                className="dashboard-card dashboard-stat-card report-stat-card group relative flex min-h-[112px] items-center overflow-hidden p-4 sm:p-[1.125rem]"
              >
                <div className="absolute -right-7 -top-9 size-24 rounded-full bg-[var(--card-accent)]/10 blur-2xl transition-colors duration-300 group-hover:bg-[var(--card-accent)]/15" />
                <div className="relative z-10 flex w-full items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-2 text-[1.75rem] font-semibold leading-none tracking-[-0.03em] text-foreground">
                        {value}
                      </p>
                    </div>
                    <div className="dashboard-stat-icon flex size-11 shrink-0 items-center justify-center rounded-[0.875rem]">
                      <Icon size={20} strokeWidth={2.2} />
                    </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Info Card */}
        <div className="dashboard-panel mt-7 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)] shadow-sm">
                <FileText size={22} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">PDF/Excel Export Ready</h3>
                <p className="mt-1.5 text-sm font-semibold leading-relaxed text-muted-foreground">
                  The report dashboard is connected to backend summary data and ready for export buttons.
                  All key metrics—meal counts, expenses, dues, and payments—are pulled from live data.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1.5 text-[11px] font-bold text-[var(--brand)]">
                    <FileText size={13} />
                    PDF Export
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1.5 text-[11px] font-bold text-[var(--brand)]">
                    <FileText size={13} />
                    Excel Export
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-1.5 text-[11px] font-bold text-[var(--brand)]">
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
