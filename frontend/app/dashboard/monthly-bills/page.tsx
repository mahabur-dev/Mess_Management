'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type Mess, type MonthlyBill } from '@/lib/api-client'
import {
  CalendarDays,
  ClipboardList,
  ReceiptText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Users,
  TrendingUp,
  Banknote,
  RefreshCw,
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

function getTotalCost(bill: MonthlyBill) {
  return (
    Number(bill.food_bill || 0) +
    Number(bill.seat_rent || 0) +
    Number(bill.utility_share || 0)
  )
}

const STATUS_CONFIG = {
  PAID: { label: 'Paid', icon: <CheckCircle2 size={14} />, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/50' },
  PARTIAL: { label: 'Partial', icon: <AlertTriangle size={14} />, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/50' },
  PENDING: { label: 'Pending', icon: <XCircle size={14} />, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200/50' },
}

export default function MonthlyBillPage() {
  const { user } = useAuth()

  const [messes, setMesses] = useState<Mess[]>([])
  const [bills, setBills] = useState<MonthlyBill[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7),
  )

  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess

  const isManager =
    user?.role === 'ADMIN' ||
    user?.role === 'MANAGER' ||
    user?.role === 'ORGANIZER'

  const billMonth = `${selectedMonth}-01`

  function normalizeBills(payload: MonthlyBill[] | { data?: MonthlyBill[] } | undefined) {
    if (Array.isArray(payload)) return payload
    return Array.isArray(payload?.data) ? payload.data : []
  }

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
        const params = {
          month: billMonth,
          limit: 100,
          sortBy: 'generated_at',
          sortOrder: 'desc',
        }
        const billRes = isManager
          ? await apiClient.getBillsByMess(list[0].id, params).catch(() => null)
          : await apiClient.getMyBills(params).catch(() => null)

        setBills(normalizeBills(billRes?.data))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user?.id, user?.role, selectedMonth])

  async function recalculateBills() {
    if (!activeMess) return

    setGenerating(true)
    try {
      const billRes = await apiClient.generateMonthlyBill({
        messId: activeMess.id,
        month: billMonth,
      })
      setBills(Array.isArray(billRes.data) ? billRes.data : [])
    } finally {
      setGenerating(false)
    }
  }

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const billMonth = new Date(bill.month).toISOString().slice(0, 7)
      return billMonth === selectedMonth
    })
  }, [bills, selectedMonth])

  const summary = useMemo(() => {
    return {
      totalFood: filteredBills.reduce((s, b) => s + Number(b.food_bill || 0), 0),
      totalRent: filteredBills.reduce((s, b) => s + Number(b.seat_rent || 0), 0),
      totalUtility: filteredBills.reduce((s, b) => s + Number(b.utility_share || 0), 0),
      totalCost: filteredBills.reduce((s, b) => s + getTotalCost(b), 0),
      totalDue: filteredBills.reduce((s, b) => s + Number(b.final_due || 0), 0),
    }
  }, [filteredBills])

  return (
    <div className="min-h-screen bg-[#fafcff]">
      <DashboardHeader
        title={isManager ? 'Monthly Bills' : 'My Monthly Bill'}
        description={
          activeMess
            ? `${activeMess.name} bill overview`
            : 'Monthly bill calculation from meals, rent, utilities, and payments'
        }
      />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-green-100 shadow-sm">
              <ReceiptText size={24} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#172554]">
                {isManager ? 'All Monthly Bills' : 'My Monthly Bills'}
              </h2>
              <p className="mt-0.5 text-xs font-semibold text-[#6b7a99]">
                Showing bills for {formatMonth(`${selectedMonth}-01`)}
              </p>
            </div>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-none sm:flex sm:items-center">
            {isManager && activeMess && (
              <button
                type="button"
                onClick={recalculateBills}
                disabled={generating}
                className="inline-flex h-[45px] w-full items-center justify-center gap-2 rounded-xl bg-[#2f80ed] px-4 text-xs font-black text-white shadow-sm transition hover:bg-[#1f6fd8] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {generating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                {generating ? 'Calculating' : 'Recalculate'}
              </button>
            )}
            <label className="flex h-[45px] w-full items-center gap-2.5 rounded-xl border border-[#d8e6f8] bg-white px-4 shadow-sm transition hover:border-[#a9ccfb] sm:w-auto">
              <CalendarDays size={17} className="text-[#2f80ed]" />
              <input
                type="month"
                className="w-full bg-transparent text-sm font-bold text-[#172554] outline-none sm:w-auto"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </label>
            <div className="flex h-[45px] w-full items-center justify-center gap-2 rounded-xl border border-[#d8e6f8] bg-gradient-to-r from-[#e7f1ff] to-[#f0fdf4] px-4 text-xs font-black text-[#2f80ed] shadow-sm sm:w-auto">
              <ClipboardList size={16} />
              {filteredBills.length} Bill{filteredBills.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {filteredBills.length > 0 && (
          <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#6b7a99]">
                <TrendingUp size={13} className="text-[#2f80ed]" />
                Food
              </p>
              <p className="mt-1.5 text-lg font-black text-[#172554]">{money(summary.totalFood)}</p>
            </div>
            <div className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#6b7a99]">
                <Banknote size={13} className="text-[#f59e0b]" />
                Rent
              </p>
              <p className="mt-1.5 text-lg font-black text-[#172554]">{money(summary.totalRent)}</p>
            </div>
            <div className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#6b7a99]">
                <Banknote size={13} className="text-[#ec4899]" />
                Utility
              </p>
              <p className="mt-1.5 text-lg font-black text-[#172554]">{money(summary.totalUtility)}</p>
            </div>
            <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                <CheckCircle2 size={13} />
                Total Cost
              </p>
              <p className="mt-1.5 text-lg font-black text-emerald-700">{money(summary.totalCost)}</p>
            </div>
            <div className="rounded-xl border border-red-200/60 bg-red-50/50 p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-red-600">
                <XCircle size={13} />
                Due
              </p>
              <p className="mt-1.5 text-lg font-black text-red-600">{money(summary.totalDue)}</p>
            </div>
          </div>
        )}

        {/* Bills Table - Desktop */}
        <div className="hidden overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)] sm:block">
          <div className="monthly-bills-table-scroll overflow-x-auto pb-2">
            <table className="w-full min-w-[1120px]">
              <thead>
                <tr className="border-b border-[#e6ebf4] bg-[#f8faff]">
                  <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Member</th>
                  <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Month</th>
                  <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Meals</th>
                  <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Food</th>
                  <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Rent</th>
                  <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Utilities</th>
                  <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Total Cost</th>
                  <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Deposit</th>
                  <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-red-500">Due</th>
                  <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#e6ebf4]">
                {loading && (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#6b7a99]">
                        <Loader2 size={18} className="animate-spin text-[#2f80ed]" />
                        Loading monthly bills...
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && filteredBills.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ReceiptText size={40} className="text-[#d8e6f8]" />
                        <p className="text-sm font-bold text-[#6b7a99]">No bills found for this month.</p>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredBills.map((bill) => {
                    const statusConf = STATUS_CONFIG[bill.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING

                    return (
                      <tr key={bill.id} className="transition hover:bg-[#f8faff]">
                        <td className="px-5 py-4">
                          <p className="font-bold text-[#172554]">
                            {bill.member?.name ?? 'My Bill'}
                          </p>
                          {bill.member?.email && (
                            <p className="mt-0.5 text-xs font-semibold text-[#6b7a99]">
                              {bill.member.email}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#6b7a99]">
                            <CalendarDays size={14} className="text-[#ffb84d]" />
                            {formatMonth(bill.month)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-[#e7f1ff] px-2.5 text-sm font-bold text-[#2f80ed]">
                            {bill.total_meals}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm font-bold text-[#172554]">{money(bill.food_bill)}</td>
                        <td className="px-5 py-4 text-sm font-bold text-[#172554]">{money(bill.seat_rent)}</td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-[#172554]">{money(bill.utility_share)}</p>
                          {/* <p className="mt-0.5 text-[11px] font-semibold text-[#6b7a99]">
                            E {money(bill.electricity_bill)} / G {money(bill.gas_bill)} / W {money(bill.wifi_bill)} / C {money(bill.cleaner_bill)} / X {money(bill.extra_cost)}
                          </p> */}
                        </td>

                        <td className="px-5 py-4 text-sm font-black text-[#172554]">{money(getTotalCost(bill))}</td>

                        <td className="px-5 py-4 text-sm font-bold text-emerald-600">{money(bill.paid_amount)}</td>

                        <td className="px-5 py-4">
                          <span className={`text-sm font-black ${Number(bill.final_due) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {money(bill.final_due)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-bold ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                            {statusConf.icon}
                            {statusConf.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>

          {/* Footer Summary */}
          {!loading && filteredBills.length > 0 && (
            <div className="border-t-2 border-[#d8e6f8] bg-[#f8faff] px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#6b7a99]">
                  <Users size={14} />
                  <span><span className="text-[#172554]">{filteredBills.length}</span> bills</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-emerald-600">Total Cost: {money(summary.totalCost)}</span>
                  <span className="text-red-500">Due: {money(summary.totalDue)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bills - Mobile Cards */}
        <div className="space-y-3 sm:hidden">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#2f80ed]" />
            </div>
          )}
          {!loading && filteredBills.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <ReceiptText size={40} className="mb-2 text-[#d8e6f8]" />
              <p className="text-sm font-bold text-[#6b7a99]">No bills found for this month.</p>
            </div>
          )}
          {!loading && filteredBills.map((bill) => {
            const statusConf = STATUS_CONFIG[bill.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
            const avatarBg = '#2f80ed'
            const initials = bill.member?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'MB'
            
            return (
              <div key={bill.id} className="overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-sm transition hover:border-[#a9ccfb]">
                <div className="border-b border-[#e6ebf4] bg-[#f8faff] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-black" style={{ backgroundColor: `${avatarBg}18`, borderColor: `${avatarBg}55`, color: avatarBg }}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#172554]">{bill.member?.name ?? 'My Bill'}</p>
                        {bill.member?.email && (
                          <p className="truncate text-xs font-semibold text-[#6b7a99]">{bill.member.email}</p>
                        )}
                      </div>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                      {statusConf.icon}
                      {statusConf.label}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#6b7a99]">
                    <CalendarDays size={12} className="text-[#ffb84d]" />
                    <span>{formatMonth(bill.month)}</span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-3 grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-[#e6ebf4] bg-white p-3 text-center">
                      <p className="text-[10px] font-black uppercase text-[#6b7a99]">Meals</p>
                      <p className="mt-1 text-sm font-bold text-[#2f80ed]">{bill.total_meals}</p>
                    </div>
                    <div className="rounded-xl border border-[#e6ebf4] bg-white p-3 text-center">
                      <p className="text-[10px] font-black uppercase text-[#6b7a99]">Total</p>
                      <p className="mt-1 text-sm font-bold text-emerald-600">{money(getTotalCost(bill))}</p>
                    </div>
                    <div className="rounded-xl border border-[#e6ebf4] bg-white p-3 text-center">
                      <p className="text-[10px] font-black uppercase text-[#6b7a99]">Due</p>
                      <p className={`mt-1 text-sm font-black ${Number(bill.final_due) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{money(bill.final_due)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-[#e6ebf4] bg-[#f8faff] p-3 text-xs">
                    <div className="rounded-lg bg-white p-2.5">
                      <p className="font-black uppercase text-[#6b7a99]">Food</p>
                      <p className="mt-0.5 font-bold text-[#172554]">{money(bill.food_bill)}</p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5">
                      <p className="font-black uppercase text-[#6b7a99]">Rent</p>
                      <p className="mt-0.5 font-bold text-[#172554]">{money(bill.seat_rent)}</p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5">
                      <p className="font-black uppercase text-[#6b7a99]">Utility</p>
                      <p className="mt-0.5 font-bold text-[#172554]">{money(bill.utility_share)}</p>
                    </div>
                    <div className="rounded-lg bg-white p-2.5">
                      <p className="font-black uppercase text-[#6b7a99]">Deposit</p>
                      <p className="mt-0.5 font-bold text-emerald-600">{money(bill.paid_amount)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {!loading && filteredBills.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-[#e6ebf4] bg-[#f8faff] px-4 py-3">
              <p className="text-xs font-bold text-[#6b7a99]"><span className="text-[#172554]">{filteredBills.length}</span> bills</p>
              <div className="flex gap-3 text-xs font-bold">
                <span className="text-emerald-600">Total Cost: {money(summary.totalCost)}</span>
                <span className="text-red-500">Due: {money(summary.totalDue)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
