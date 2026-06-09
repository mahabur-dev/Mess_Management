'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type Mess, type MonthlyBill } from '@/lib/api-client'
import {
  BadgeDollarSign,
  CalendarDays,
  ClipboardList,
  CreditCard,
  ReceiptText,
  RefreshCcw,
  UtensilsCrossed,
  WalletCards,
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
  const [message, setMessage] = useState('')
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

  async function generateBill() {
    if (!activeMess) return

    setLoading(true)
    setMessage('')

    try {
      await apiClient.generateMonthlyBill({
        messId: activeMess.id,
        month: `${selectedMonth}-01`,
      })

      setMessage('Monthly bills generated successfully.')
      await load()
    } finally {
      setLoading(false)
    }
  }

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const billMonth = new Date(bill.month).toISOString().slice(0, 7)
      return billMonth === selectedMonth
    })
  }, [bills, selectedMonth])

  const totalDue = filteredBills.reduce(
    (sum, bill) => sum + Number(bill.final_due ?? 0),
    0,
  )

  const paidAmount = filteredBills.reduce(
    (sum, bill) => sum + Number(bill.paid_amount ?? 0),
    0,
  )

  const totalMeals = filteredBills.reduce(
    (sum, bill) => sum + Number(bill.total_meals ?? 0),
    0,
  )

  const totalFoodBill = filteredBills.reduce(
    (sum, bill) => sum + Number(bill.food_bill ?? 0),
    0,
  )

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
        {message && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
            {message}
          </div>
        )}

        <Card className="app-card mb-6 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-[#0a1433]">
                Bill Month
              </h2>
              <p className="text-sm font-semibold text-muted-foreground">
                Select month and generate or view monthly bills.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="month"
                className="soft-input h-11 rounded-lg px-4 font-bold"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />

              {isManager && (
                <Button
                  onClick={generateBill}
                  disabled={!activeMess || loading}
                  className="gradient-button h-11 rounded-lg font-bold"
                >
                  <RefreshCcw size={16} className="mr-2" />
                  {loading ? 'Generating...' : 'Generate Bill'}
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="app-card p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#efe9ff] text-[#6f3df4]">
              <BadgeDollarSign size={22} />
            </div>
            <p className="text-sm font-bold text-muted-foreground">
              Total Due
            </p>
            <p className="mt-2 text-2xl font-black text-[#0a1433]">
              {money(totalDue)}
            </p>
          </Card>

          <Card className="app-card p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8fff2] text-[#22b66f]">
              <CreditCard size={22} />
            </div>
            <p className="text-sm font-bold text-muted-foreground">
              Paid Amount
            </p>
            <p className="mt-2 text-2xl font-black text-[#0a1433]">
              {money(paidAmount)}
            </p>
          </Card>

          <Card className="app-card p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff3df] text-[#f59e0b]">
              <UtensilsCrossed size={22} />
            </div>
            <p className="text-sm font-bold text-muted-foreground">
              Total Meals
            </p>
            <p className="mt-2 text-2xl font-black text-[#0a1433]">
              {totalMeals}
            </p>
          </Card>

          <Card className="app-card p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f2ff] text-[#2f80ed]">
              <ReceiptText size={22} />
            </div>
            <p className="text-sm font-bold text-muted-foreground">
              Food Bill
            </p>
            <p className="mt-2 text-2xl font-black text-[#0a1433]">
              {money(totalFoodBill)}
            </p>
          </Card>
        </div>

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

            <div className="flex items-center gap-2 rounded-full bg-[#f4f7fb] px-3 py-1.5 text-xs font-black text-[#6f3df4]">
              <ClipboardList size={14} />
              {filteredBills.length} Bills
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

        <Card className="app-card mt-6 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#efe9ff] text-[#6f3df4]">
              <WalletCards size={20} />
            </div>

            <div>
              <h3 className="font-black text-[#0a1433]">Calculation Note</h3>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                Bills are calculated from meals, guest meals, food expenses,
                seat rent, utility share, extra cost, deposit, and approved
                payments.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}