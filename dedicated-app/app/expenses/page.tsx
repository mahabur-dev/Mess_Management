'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, CalendarDays, ChevronRight, Plus, Users } from 'lucide-react'
import {
  ExpenseListItem,
  ExpenseOverviewPanel,
  ExpenseOverviewTile,
  HeaderIconButton,
  ScreenHeader,
  formatTaka,
  type ExpenseListRecord,
} from '@/components/mobile/expense-design'
import { MobileShell } from '@/components/mobile-shell'
import { api } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import { useAuth } from '../providers'
import Link from 'next/link'

type ExpenseSummary = {
  month?: string
  myView?: {
    foodBill?: number
    utilityBill?: number
    roomRent?: number
    total?: number
    transactionCount?: number
  }
  managerView?: {
    totalExpenses?: number
    transactionCount?: number
  } | null
  recentExpenses?: ExpenseListRecord[]
}

type ManagerOverview = {
  totals?: {
    totalExpenses?: number
    totalUtility?: number
    fromDeposit?: number
    members?: number
  }
  members?: Array<{
    member?: { id: string; name?: string; email?: string }
    totalCost?: number
    depositPaid?: number
    due?: number
    status?: string
  }>
}

export default function ExpensesPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const isManager = canManageMess(user)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [view, setView] = useState<'MY' | 'MANAGER'>('MY')
  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [managerData, setManagerData] = useState<ManagerOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!messId) return
    let alive = true
    setLoading(true)
    setMessage('')

    api
      .getExpenseSummary(messId, `${month}-01`)
      .then((res) => {
        if (alive) setSummary(res.data as ExpenseSummary)
      })
      .catch((error) => {
        if (alive) setMessage(error instanceof Error ? error.message : 'Failed to load expense summary.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [messId, month])

  useEffect(() => {
    if (!messId || !isManager || view !== 'MANAGER') return
    let alive = true

    api
      .getManagerMemberExpenses(messId, `${month}-01`)
      .then((res) => {
        if (alive) setManagerData(res.data as ManagerOverview)
      })
      .catch(() => {
        if (alive) setManagerData(null)
      })

    return () => {
      alive = false
    }
  }, [isManager, messId, month, view])

  const my = summary?.myView
  const manager = managerData?.totals

  return (
    <MobileShell showBottomNavigation>
      <ScreenHeader
        title="Expense & Utility Center"
        subtitle="Track, manage & stay in control"
        backHref="/"
        right={
          <HeaderIconButton
            label="Notifications"
            icon={
              <span className="relative">
                <Bell size={18} />
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#ff3b30]" />
              </span>
            }
          />
        }
      />

      <div className="screen space-y-5">
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <label className="flex h-12 items-center gap-2 rounded-[15px] border border-white/80 bg-white px-4 text-label font-bold text-[#123748] shadow-[0_10px_24px_rgba(18,55,72,0.06)]">
            <CalendarDays size={17} className="text-[#008d8c]" />
            <input className="min-w-0 flex-1 bg-transparent outline-none" value={month} onChange={(event) => setMonth(event.target.value)} type="month" />
          </label>
          {isManager ? (
            <div className="flex h-12 rounded-[15px] bg-white p-1 shadow-[0_10px_24px_rgba(18,55,72,0.06)]">
              <button type="button" onClick={() => setView('MY')} className={`rounded-[12px] px-3 text-caption font-bold ${view === 'MY' ? 'bg-[#008d8c] text-white' : 'text-[#65838b]'}`}>
                My View
              </button>
              <button type="button" onClick={() => setView('MANAGER')} className={`rounded-[12px] px-3 text-caption font-bold ${view === 'MANAGER' ? 'bg-[#008d8c] text-white' : 'text-[#65838b]'}`}>
                Manager
              </button>
            </div>
          ) : null}
        </div>

        {message ? <div className="rounded-2xl border border-[#f4c7c7] bg-[#fff5f5] px-4 py-3 text-label font-semibold text-[#b42318]">{message}</div> : null}

        {view === 'MY' ? (
          <>
            <ExpenseOverviewPanel title="My View">
              <ExpenseOverviewTile label="My Food Bill" value={loading ? '...' : formatTaka(my?.foodBill)} caption={`${my?.transactionCount ?? 0} Transactions`} />
              <ExpenseOverviewTile label="My Utility Bill" value={loading ? '...' : formatTaka(my?.utilityBill)} accent="blue" />
              <ExpenseOverviewTile label="My Room Rent" value={loading ? '...' : formatTaka(my?.roomRent)} accent="blue" />
              <ExpenseOverviewTile label="This Month Total" value={loading ? '...' : formatTaka(my?.total)} />
            </ExpenseOverviewPanel>

            <Link href="/monthly-bill" className="block rounded-[18px] bg-[#008d8c] p-4 text-white shadow-[0_14px_30px_rgba(0,141,140,0.22)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-body font-extrabold">View Details - Your All Expenses</div>
                  <div className="mt-1 text-label font-medium text-white/85">Explore food, utility, rent and transaction history.</div>
                </div>
                <ChevronRight size={22} />
              </div>
            </Link>
          </>
        ) : (
          <>
            <ExpenseOverviewPanel title="Manager View">
              <ExpenseOverviewTile label="Total Expenses" value={formatTaka(manager?.totalExpenses)} />
              <ExpenseOverviewTile label="Utility" value={formatTaka(manager?.totalUtility)} accent="blue" />
              <ExpenseOverviewTile label="From Deposit" value={formatTaka(manager?.fromDeposit)} />
              <ExpenseOverviewTile label="Members" value={manager?.members ?? 0} accent="blue" />
            </ExpenseOverviewPanel>

            <section className="home-panel">
              <div className="flex items-center justify-between">
                <div className="section-title">Member Expense Overview</div>
                <div className="text-caption font-semibold text-[#65838b]">Tap a member to inspect</div>
              </div>
              <div className="flush-list flush-list--panel mt-3">
                {(managerData?.members ?? []).map((item) => (
                  <div key={item.member?.id} className="flex items-center gap-3 border-y border-[#cfeeed] bg-white/95 px-3 py-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#edfafa] text-label font-bold text-[#008d8c]">
                      {(item.member?.name ?? 'M').slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-label font-bold text-[#123748]">{item.member?.name ?? 'Member'}</div>
                      <div className="truncate text-caption font-semibold text-[#65838b]">{item.member?.email}</div>
                    </div>
                    <div className="text-right text-caption font-bold">
                      <div className="text-[#008d8c]">{formatTaka(item.totalCost)}</div>
                      <div className={Number(item.due ?? 0) > 0 ? 'text-[#f04438]' : 'text-[#12a150]'}>{formatTaka(item.due)}</div>
                    </div>
                    <ChevronRight size={17} className="text-[#65838b]" />
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {isManager ? (
          <div className="grid grid-cols-2 gap-3">
            <Link href="/add-expense" className="flex h-12 items-center justify-center gap-2 rounded-[15px] bg-[#008d8c] text-label font-bold text-white">
              <Plus size={18} />
              Add Expense
            </Link>
            <Link href="/add-utility" className="flex h-12 items-center justify-center gap-2 rounded-[15px] border border-[#008d8c] bg-white text-label font-bold text-[#008d8c]">
              <Users size={18} />
              Add Utility
            </Link>
          </div>
        ) : null}

        <section className="home-panel">
          <div className="section-title">Recent Expenses</div>
          <div className="flush-list flush-list--panel mt-3">
            {(summary?.recentExpenses ?? []).map((item) => (
              <ExpenseListItem key={item.id} item={item} href={`/expense-details?expenseId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`} variant="horizontal" />
            ))}
            {!summary?.recentExpenses?.length ? <div className="mx-2.5 rounded-[18px] bg-[#edfafa] px-4 py-5 text-center text-label font-bold text-[#65838b]">No expenses found.</div> : null}
          </div>
        </section>
      </div>
    </MobileShell>
  )
}
