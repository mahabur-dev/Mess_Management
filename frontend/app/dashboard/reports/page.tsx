'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { apiClient, type Mess, type MessDashboard } from '@/lib/api-client'
import { useAuth } from '@/app/context/auth-context'
import { BarChart3, ClipboardList, CreditCard, UtensilsCrossed, WalletCards } from 'lucide-react'
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
    ['Daily Meal Report', dashboard?.todayTotalMeals ?? 0, UtensilsCrossed, 'solid-blue'],
    ['Monthly Expense Report', `৳ ${Number(dashboard?.currentMonthTotalBazar ?? 0).toLocaleString()}`, WalletCards, 'solid-orange'],
    ['Member Due Report', `৳ ${Number(dashboard?.totalDue ?? 0).toLocaleString()}`, ClipboardList, 'solid-red'],
    ['Payment Report', dashboard?.pendingPayments ?? 0, CreditCard, 'solid-green'],
  ] as const

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Reports" description={mess ? `${mess.name} reporting center` : 'Reports and analytics'} />
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([label, value, Icon, tone]) => (
            <Card key={label} className={`dashboard-solid-card ${tone}`}>
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div>
                  <p className="solid-label">{label}</p>
                  <p className="solid-value mt-2">{value}</p>
                </div>
                <span className="solid-icon"><Icon size={21} /></span>
              </div>
            </Card>
          ))}
        </div>
        <Card className="app-card mt-6 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#efe9ff] text-[#6f3df4]"><BarChart3 /></span>
            <div>
              <h2 className="text-lg font-black">PDF/Excel Export Ready</h2>
              <p className="text-sm font-semibold text-muted-foreground">The report dashboard is connected to backend summary data and ready for export buttons.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
