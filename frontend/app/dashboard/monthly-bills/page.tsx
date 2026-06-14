'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type Mess, type MonthlyBill } from '@/lib/api-client'
import {
  CalendarDays,
  ClipboardList,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

function money(value: number | string | undefined | null) {
  return `৳ ${Number(value ?? 0).toLocaleString()}`
}

function formatMonth(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

export default function MonthlyBillPage() {
  const { user } = useAuth()

  const [messes, setMesses] = useState<Mess[]>([])
  const [bills, setBills] = useState<MonthlyBill[]>([])
  const [loading, setLoading] = useState(false)

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  )

  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess

  const isManager =
    user?.role === 'ADMIN' ||
    user?.role === 'MANAGER' ||
    user?.role === 'ORGANIZER'

  async function load() {
    if (!user) return

    setLoading(true)

    try {
      const messRes = await apiClient.getMesses().catch(() => null)

      const list = Array.isArray(messRes?.data)
        ? messRes.data
        : messRes?.data
          ? [messRes.data]
          : ((user?.memberships?.map((item) => item.mess).filter(Boolean) ??
              []) as Mess[])

      setMesses(list)

      if (list[0]) {
        const billRes = isManager
          ? await apiClient.getBillsByMess(list[0].id).catch(() => null)
          : await apiClient.getMyBills().catch(() => null)

        setBills(Array.isArray(billRes?.data) ? billRes.data : [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user?.role])

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const billMonth = new Date(bill.month).toISOString().slice(0, 7)
      return billMonth === selectedMonth
    })
  }, [bills, selectedMonth])

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title={isManager ? 'Monthly Bills' : 'My Monthly Bill'}
        description={
          activeMess
            ? `${activeMess.name} bill overview`
            : 'Monthly bill calculation from meals, rent, utilities, and payments'
        }
      />

      <div className="p-4 sm:p-6 lg:p-8">
        <Card className="app-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-[#0a1433]">
                {isManager ? 'All Monthly Bills' : 'My Monthly Bills'}
              </h2>
              <p className="text-sm font-semibold text-muted-foreground">
                Showing bills for {formatMonth(`${selectedMonth}-01`)}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="month"
                className="soft-input h-11 rounded-lg px-4 font-bold"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />

              <div className="flex items-center justify-center gap-2 rounded-full bg-[#f4f7fb] px-3 py-1.5 text-xs font-black text-[#6f3df4]">
                <ClipboardList size={14} />
                {filteredBills.length} Bills
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-[#f8f7ff] text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-black">Member</th>
                  <th className="px-5 py-4 font-black">Month</th>
                  <th className="px-5 py-4 font-black">Meals</th>
                  <th className="px-5 py-4 font-black">Food</th>
                  <th className="px-5 py-4 font-black">Rent</th>
                  <th className="px-5 py-4 font-black">Utility</th>
                  <th className="px-5 py-4 font-black">Paid</th>
                  <th className="px-5 py-4 font-black">Due</th>
                  <th className="px-5 py-4 font-black">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {loading && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-8 text-center text-sm font-semibold text-muted-foreground"
                    >
                      Loading monthly bills...
                    </td>
                  </tr>
                )}

                {!loading && filteredBills.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-8 text-center text-sm font-semibold text-muted-foreground"
                    >
                      No bills found for this month.
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredBills.map((bill) => (
                    <tr key={bill.id} className="transition hover:bg-[#faf9ff]">
                      <td className="px-5 py-4">
                        <p className="font-black text-[#0a1433]">
                          {bill.member?.name ?? 'My Bill'}
                        </p>
                        <p className="text-xs font-semibold text-muted-foreground">
                          {bill.member?.email ?? ''}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm font-bold">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays size={15} className="text-[#6f3df4]" />
                          {formatMonth(bill.month)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm font-bold">
                        {bill.total_meals}
                      </td>

                      <td className="px-5 py-4 text-sm font-bold">
                        {money(bill.food_bill)}
                      </td>

                      <td className="px-5 py-4 text-sm font-bold">
                        {money(bill.seat_rent)}
                      </td>

                      <td className="px-5 py-4 text-sm font-bold">
                        {money(bill.utility_share)}
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-[#22b66f]">
                        {money(bill.paid_amount)}
                      </td>

                      <td className="px-5 py-4 text-sm font-black text-[#ef4444]">
                        {money(bill.final_due)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            bill.status === 'PAID'
                              ? 'bg-green-50 text-green-700'
                              : bill.status === 'PARTIAL'
                                ? 'bg-yellow-50 text-yellow-700'
                                : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {bill.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </div>
  )
}
