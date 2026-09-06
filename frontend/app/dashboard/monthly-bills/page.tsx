'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { EnterpriseButton } from '@/components/ui/enterprise-button'
import { EnterpriseDetailsDrawer } from '@/components/ui/enterprise-details-drawer'
import { EnterpriseIconButton } from '@/components/ui/enterprise-icon-button'
import { EnterpriseMonthPicker } from '@/components/ui/enterprise-date-picker'
import { EnterpriseTableActionCell, EnterpriseTableActionHeader } from '@/components/ui/enterprise-table-actions'
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
  Search,
  Eye,
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
  return Number(bill.food_bill || 0) + Number(bill.seat_rent || 0) + Number(bill.utility_share || 0)
}

function getRemainingBalance(bill: MonthlyBill) {
  if (bill.credit_balance !== undefined) return Number(bill.credit_balance || 0)
  return Math.max(-Number(bill.balance || 0), 0)
}

function carryForwardText(value: number | string) {
  const balance = Number(value || 0)
  if (balance > 0) return `Due · ${money(balance)}`
  if (balance < 0) return `Credit · ${money(Math.abs(balance))}`
  return 'Settled'
}

function CarryForwardAmount({ value }: { value: number | string }) {
  const balance = Number(value || 0)
  return (
    <span
      className={`inline-flex items-center text-sm font-bold tabular-nums ${
        balance > 0
          ? 'text-primary'
          : balance < 0
            ? 'text-primary'
            : 'text-muted-foreground'
      }`}
    >
      {carryForwardText(balance)}
    </span>
  )
}

const STATUS_CONFIG = {
  PAID: { label: 'Paid', icon: <CheckCircle2 size={14} />, bg: 'bg-primary/10', text: 'text-primary', border: 'color-mix(in srgb, var(--primary) 30%, transparent)' },
  PARTIAL: { label: 'Partial', icon: <AlertTriangle size={14} />, bg: 'bg-primary/10', text: 'text-primary', border: 'color-mix(in srgb, var(--primary) 30%, transparent)' },
  PENDING: { label: 'Pending', icon: <XCircle size={14} />, bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30' },
}

export default function MonthlyBillPage() {
  const { user } = useAuth()
  const [messes, setMesses] = useState<Mess[]>([])
  const [bills, setBills] = useState<MonthlyBill[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [memberSearch, setMemberSearch] = useState('')
  const [viewingBill, setViewingBill] = useState<MonthlyBill | null>(null)
  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const billMonth = `${selectedMonth}-01`

  function normalizeBills(payload: any) {
    if (Array.isArray(payload)) return payload
    return Array.isArray(payload?.data) ? payload.data : []
  }

  async function load() {
    if (!user) return
    setLoading(true)
    try {
      const messRes = await apiClient.getMesses().catch(() => null)
      const list = Array.isArray(messRes?.data) ? messRes.data : messRes?.data ? [messRes.data] : ((user?.memberships?.map((i: any) => i.mess).filter(Boolean) ?? []) as Mess[])
      setMesses(list)
      if (list[0]) {
        const billRes = await apiClient.getBillsByMess(list[0].id, { month: billMonth, limit: 100, sortBy: 'generated_at', sortOrder: 'desc' }).catch(() => null)
        setBills(normalizeBills(billRes?.data))
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [user?.id, user?.role, selectedMonth])

  async function recalculateBills() {
    if (!activeMess) return
    setGenerating(true)
    try {
      const billRes = await apiClient.generateMonthlyBill({ messId: activeMess.id, month: billMonth })
      setBills(Array.isArray(billRes.data) ? billRes.data : [])
    } finally { setGenerating(false) }
  }

  const filteredBills = useMemo(() => {
    const monthBills = bills.filter((bill) => new Date(bill.month).toISOString().slice(0, 7) === selectedMonth)
    const searchTerm = memberSearch.trim().toLowerCase()

    if (!searchTerm) return monthBills

    return monthBills.filter((bill) => {
      const memberName = bill.member?.name?.toLowerCase() ?? ''
      return memberName.includes(searchTerm)
    })
  }, [bills, memberSearch, selectedMonth])

  const summary = useMemo(() => ({
    totalFood: filteredBills.reduce((s, b) => s + Number(b.food_bill || 0), 0),
    totalRent: filteredBills.reduce((s, b) => s + Number(b.seat_rent || 0), 0),
    totalUtility: filteredBills.reduce((s, b) => s + Number(b.utility_share || 0), 0),
    totalCost: filteredBills.reduce((s, b) => s + getTotalCost(b), 0),
    totalDue: filteredBills.reduce((s, b) => s + Number(b.final_due || 0), 0),
    previousBalance: filteredBills.reduce((s, b) => s + Number(b.prev_balance || 0), 0),
  }), [filteredBills])
  const viewingBillStatus = viewingBill ? (STATUS_CONFIG[viewingBill.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING) : null

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Monthly Bills" description={activeMess ? `${activeMess.name} bill overview` : 'Monthly bill calculation from meals, rent, utilities, and payments'} />
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="dashboard-section-icon size-12 rounded-lg">
              <ReceiptText size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">All Monthly Bills</h2>
              <p className="mt-0.5 text-xs font-semibold text-muted-foreground">Showing bills for {formatMonth(`${selectedMonth}-01`)}</p>
            </div>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-none sm:flex sm:items-center">
            {isManager && activeMess && (
              <EnterpriseButton onClick={recalculateBills} disabled={generating} className="w-full gap-2 sm:w-auto">
                {generating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                {generating ? 'Calculating' : 'Recalculate'}
              </EnterpriseButton>
            )}
            <EnterpriseMonthPicker value={selectedMonth} onValueChange={setSelectedMonth} surface="white" className="h-[45px] w-full font-bold sm:w-[190px]" />
            <div className="flex h-[45px] w-full items-center justify-center gap-2 rounded-xl border border-border  bg-muted  px-4 text-xs font-semibold text-primary  sm:w-auto">
              <ClipboardList size={16} /> {filteredBills.length} Bill{filteredBills.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative w-full sm:max-w-xl">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
              placeholder="Search member by name"
              className="h-[42px] w-full rounded-xl border border-border bg-background pl-9 pr-10 text-xs font-semibold text-foreground  outline-none placeholder:text-muted-foreground transition focus:border-primary focus:ring-4 focus:ring-primary/20"
            />
            {memberSearch.trim() && <EnterpriseIconButton label="Clear member search" className="absolute right-1.5 top-1/2 size-7 -translate-y-1/2 rounded-lg" onClick={() => setMemberSearch('')}><XCircle size={15} /></EnterpriseIconButton>}
          </label>
          <p className="px-1 text-[11px] font-semibold text-muted-foreground">Searches member name only</p>
        </div>

        {/* Summary Cards - same icons, same font */}
        {filteredBills.length > 0 && (
          <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="dashboard-subtle-card rounded-xl p-4 ">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"><TrendingUp size={13} className="text-primary" /> Food</p>
              <p className="mt-1.5 text-base font-bold text-foreground">{money(summary.totalFood)}</p>
            </div>
            <div className="dashboard-subtle-card rounded-xl p-4 ">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"><Banknote size={13} className="text-primary" /> Rent</p>
              <p className="mt-1.5 text-base font-bold text-foreground">{money(summary.totalRent)}</p>
            </div>
            <div className="dashboard-subtle-card rounded-xl p-4 ">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"><Banknote size={13} className="text-primary" /> Utility</p>
              <p className="mt-1.5 text-base font-bold text-foreground">{money(summary.totalUtility)}</p>
            </div>
            <div className="dashboard-subtle-card rounded-xl p-4 ">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary"><CheckCircle2 size={13} /> Total</p>
              <p className="mt-1.5 text-base font-bold text-primary">{money(summary.totalCost)}</p>
            </div>
            <div className="dashboard-subtle-card rounded-xl p-4 ">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-destructive"><XCircle size={13} /> Due</p>
              <p className="mt-1.5 text-base font-bold text-destructive">{money(summary.totalDue)}</p>
            </div>
            <div className="dashboard-subtle-card rounded-xl p-4 ">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary"><RefreshCw size={13} /> Carry forward</p>
              <div className="mt-1.5"><CarryForwardAmount value={summary.previousBalance} /></div>
            </div>
          </div>
        )}

        {/* Desktop Table */}
        <div className="dashboard-table-frame hidden sm:block">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-border bg-muted">
                  {['Member', 'Meals', 'Total cost', 'Previous balance', 'Deposit', 'Due', 'Action'].map((heading) =>
                    heading === 'Action'
                      ? <EnterpriseTableActionHeader key={heading} size="compact" />
                      : <th key={heading} className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{heading}</th>,
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && (<tr><td colSpan={7} className="px-5 py-12 text-center"><div className="flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground"><Loader2 size={18} className="animate-spin text-primary" /> Loading monthly bills...</div></td></tr>)}
                {!loading && filteredBills.length === 0 && (<tr><td colSpan={7} className="px-5 py-12 text-center"><div className="flex flex-col items-center gap-2"><ReceiptText size={40} className="text-muted-foreground" /><p className="text-sm font-bold text-muted-foreground">No bills found for this month.</p></div></td></tr>)}
                {!loading && filteredBills.map((bill) => {
                  return (
                    <tr key={bill.id} onClick={() => setViewingBill(bill)} className="cursor-pointer transition hover:bg-muted">
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-foreground">{bill.member?.name ?? 'My Bill'}</p>
                        {bill.member?.email && <p className="mt-0.5 text-xs font-bold text-muted-foreground">{bill.member.email}</p>}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-muted px-2 text-sm font-bold text-primary">{bill.total_meals}</span>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-foreground">{money(getTotalCost(bill))}</td>
                      <td className="px-4 py-4"><CarryForwardAmount value={bill.prev_balance} /></td>
                      <td className="px-4 py-4 text-sm font-bold text-primary">{money(Number(bill.deposit_total) + Number(bill.paid_amount))}</td>
                      <td className="px-4 py-4">
                        <span className={`text-sm font-bold ${Number(bill.final_due) > 0 ? 'text-destructive' : 'text-primary'}`}>{money(bill.final_due)}</span>
                      </td>
                      <EnterpriseTableActionCell size="compact">
                          <EnterpriseIconButton label="View monthly bill" tone="primary" onClick={(event) => { event.stopPropagation(); setViewingBill(bill) }}>
                            <Eye size={16} />
                          </EnterpriseIconButton>
                      </EnterpriseTableActionCell>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          {!loading && filteredBills.length > 0 && (
            <div className="border-t-2 border-border bg-muted px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><Users size={14} /> <span><span className="text-foreground">{filteredBills.length}</span> bills</span></div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-primary">Total Cost: {money(summary.totalCost)}</span>
                  <span className="text-destructive">Due: {money(summary.totalDue)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Cards */}
        <div className="space-y-3 sm:hidden">
          {loading && <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>}
          {!loading && filteredBills.length === 0 && (<div className="flex flex-col items-center justify-center py-12"><ReceiptText size={40} className="mb-2 text-muted-foreground" /><p className="text-sm font-bold text-muted-foreground">No bills found for this month.</p></div>)}
          {!loading && filteredBills.map((bill) => {
            const statusConf = STATUS_CONFIG[bill.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
            const initials = bill.member?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'MB'
            return (
              <div key={bill.id} className="overflow-hidden rounded-xl border border-border bg-background  transition hover:border-primary">
                <div className="border-b border-border bg-muted p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-semibold"
                        style={{
                          backgroundColor: 'color-mix(in srgb, var(--brand) 10%, transparent)',
                          borderColor: 'color-mix(in srgb, var(--brand) 34%, transparent)',
                          color: 'var(--brand)',
                        }}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">{bill.member?.name ?? 'My Bill'}</p>
                        {bill.member?.email && <p className="truncate text-xs font-bold text-muted-foreground">{bill.member.email}</p>}
                      </div>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>{statusConf.icon}{statusConf.label}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                    <CalendarDays size={12} className="text-primary" /> {formatMonth(bill.month)}
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-border bg-background p-3 text-center">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Meals</p>
                      <p className="mt-1 text-sm font-bold text-primary">{bill.total_meals}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-3 text-center">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Total</p>
                      <p className="mt-1 text-sm font-bold text-primary">{money(getTotalCost(bill))}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-3 text-center">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Deposit</p>
                      <p className="mt-1 text-sm font-bold text-primary">{money(Number(bill.deposit_total) + Number(bill.paid_amount))}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-3 text-center">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Due</p>
                      <p className={`mt-1 text-sm font-bold ${Number(bill.final_due) > 0 ? 'text-destructive' : 'text-primary'}`}>{money(bill.final_due)}</p>
                    </div>
                    <div className="col-span-2 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3 text-left">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Previous balance</p>
                        <p className="mt-1 text-[10px] font-semibold text-muted-foreground">Automatically included in this bill</p>
                      </div>
                      <CarryForwardAmount value={bill.prev_balance} />
                    </div>
                  </div>
                  <div className="hidden grid-cols-2 gap-2 rounded-xl border border-border bg-muted p-3 text-xs">
                    <div className="rounded-lg bg-background p-2.5"><p className="font-semibold uppercase text-muted-foreground">Food</p><p className="mt-0.5 font-bold text-foreground">{money(bill.food_bill)}</p></div>
                    <div className="rounded-lg bg-background p-2.5"><p className="font-semibold uppercase text-muted-foreground">Rent</p><p className="mt-0.5 font-bold text-foreground">{money(bill.seat_rent)}</p></div>
                    <div className="rounded-lg bg-background p-2.5"><p className="font-semibold uppercase text-muted-foreground">Utility</p><p className="mt-0.5 font-bold text-foreground">{money(bill.utility_share)}</p></div>
                    <div className="rounded-lg bg-background p-2.5">
                      <p className="font-semibold uppercase text-muted-foreground">Prev Bal.</p>
                      <p className={`mt-0.5 font-bold inline-flex items-center gap-0.5 ${Number(bill.prev_balance) > 0 ? 'text-primary' : Number(bill.prev_balance) < 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {Number(bill.prev_balance) > 0 && <span>+</span>}
                        {Number(bill.prev_balance) < 0 && <span>−</span>}
                        {Number(bill.prev_balance) === 0 ? <span className="text-[10px]">Paid</span> : money(Math.abs(Number(bill.prev_balance)))}
                      </p>
                    </div>
                    <div className="rounded-lg bg-background p-2.5"><p className="font-semibold uppercase text-muted-foreground">Deposit</p><p className="mt-0.5 font-bold text-primary">{money(Number(bill.deposit_total) + Number(bill.paid_amount))}</p></div>
                    <div className="rounded-lg bg-background p-2.5"><p className="font-semibold uppercase text-muted-foreground">Remaining</p><p className="mt-0.5 font-bold text-primary">{money(getRemainingBalance(bill))}</p></div>
                  </div>
                  <div className="mt-3 flex justify-end"><EnterpriseIconButton label="View monthly bill" tone="primary" onClick={() => setViewingBill(bill)}><Eye size={16} /></EnterpriseIconButton></div>
                </div>
              </div>
            )
          })}
          {!loading && filteredBills.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted px-4 py-3">
              <p className="text-xs font-bold text-muted-foreground"><span className="text-foreground">{filteredBills.length}</span> bills</p>
              <div className="flex gap-3 text-xs font-bold">
                <span className="text-primary">Total Cost: {money(summary.totalCost)}</span>
                <span className="text-destructive">Due: {money(summary.totalDue)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {viewingBill && viewingBillStatus && (
        <EnterpriseDetailsDrawer
          open={Boolean(viewingBill)}
          onOpenChange={(open) => !open && setViewingBill(null)}
          eyebrow="Monthly bill"
          title={`${formatMonth(viewingBill.month)} bill`}
          description={viewingBill.member?.email ?? viewingBill.member?.name ?? 'Member bill details'}
          headerIcon={<ReceiptText className="size-5" />}
          status={<span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${viewingBillStatus.bg} ${viewingBillStatus.text} ${viewingBillStatus.border}`}>{viewingBillStatus.icon}{viewingBillStatus.label}</span>}
        >
          <div className="space-y-5">
            <section className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-4  sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Member</p><h2 className="mt-1 truncate text-lg font-semibold text-foreground">{viewingBill.member?.name ?? 'My bill'}</h2><p className="mt-1 text-xs font-semibold text-muted-foreground">{formatMonth(viewingBill.month)}</p></div>
                <div className="rounded-xl bg-[var(--brand-softer)] px-3 py-2 text-right"><p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--brand)]">Final due</p><p className={`mt-0.5 text-xl font-semibold tabular-nums ${Number(viewingBill.final_due) > 0 ? 'text-destructive' : 'text-primary'}`}>{money(viewingBill.final_due)}</p></div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-[var(--dashboard-surface-subtle)] p-3"><p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Meals</p><p className="mt-1 text-base font-semibold tabular-nums text-foreground">{viewingBill.total_meals}</p></div>
                <div className="rounded-xl bg-[var(--dashboard-surface-subtle)] p-3"><p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Total cost</p><p className="mt-1 text-base font-semibold tabular-nums text-foreground">{money(getTotalCost(viewingBill))}</p></div>
                <div className="rounded-xl bg-[var(--dashboard-surface-subtle)] p-3"><p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Paid</p><p className="mt-1 text-base font-semibold tabular-nums text-primary">{money(Number(viewingBill.deposit_total) + Number(viewingBill.paid_amount))}</p></div>
              </div>
            </section>
            <section className="overflow-hidden rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] ">
              <div className="border-b border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] px-4 py-3"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Bill breakdown</p></div>
              <div className="grid divide-x-0 divide-y divide-[var(--dashboard-line)] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {[
                  ['Food bill', money(viewingBill.food_bill)],
                  ['Seat rent', money(viewingBill.seat_rent)],
                  ['Utility share', money(viewingBill.utility_share)],
                  ['Previous balance', carryForwardText(viewingBill.prev_balance)],
                  ['Deposit & paid', money(Number(viewingBill.deposit_total) + Number(viewingBill.paid_amount))],
                  ['Remaining balance', money(getRemainingBalance(viewingBill))],
                ].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 px-4 py-3"><span className="text-xs font-semibold text-muted-foreground">{label}</span><span className="text-sm font-semibold tabular-nums text-foreground">{value}</span></div>)}
              </div>
            </section>
          </div>
        </EnterpriseDetailsDrawer>
      )}
    </div>
  )
}
