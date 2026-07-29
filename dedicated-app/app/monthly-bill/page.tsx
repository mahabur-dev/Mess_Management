'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, CalendarDays, CookingPot, FilePlus2, House, Info, Landmark, Pencil, WalletCards, Zap } from 'lucide-react'
import { ExpenseListItem, ScreenHeader, formatTaka, type ExpenseListRecord } from '@/components/mobile/expense-design'
import { ExpenseBreakdownList, ExpenseMetric, ExpenseSummaryCard, ExpenseSurface } from '@/components/mobile/expense-ui'
import { MobileShell } from '@/components/mobile-shell'
import { api } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import { LABELS, type BillStatus } from '@/lib/form-options'
import { useAuth } from '../providers'

type MyExpenseDetails = {
  month?: string
  foodBill?: number
  utilityBill?: number
  roomRent?: number
  total?: number
  personalExpenseAmount?: number
  transactionCount?: number
  history?: ExpenseListRecord[]
}

type BillItem = {
  id: string
  month: string
  status: BillStatus
  final_due?: string
  member?: { id: string; name: string }
}

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })

function monthLabel(value: string) {
  const date = new Date(`${value}-01T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? value : MONTH_FORMATTER.format(date)
}

export default function MonthlyBillPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const isManager = canManageMess(user)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [details, setDetails] = useState<MyExpenseDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [bills, setBills] = useState<BillItem[]>([])
  const [generating, setGenerating] = useState(false)
  const [billingMessage, setBillingMessage] = useState('')

  useEffect(() => {
    if (!messId) return
    let active = true
    setLoading(true)
    setMessage('')

    api
      .getMyExpenseDetails(messId, `${month}-01`)
      .then((response) => {
        if (active) setDetails(response.data as MyExpenseDetails)
      })
      .catch((error) => {
        if (active) setMessage(error instanceof Error ? error.message : 'Failed to load your expense details.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [messId, month])

  useEffect(() => {
    if (!messId || !isManager) return
    let active = true

    api
      .getBillsByMess(messId, { month: `${month}-01`, limit: 20, sortBy: 'generated_at', sortOrder: 'desc' })
      .then((response) => {
        if (active) setBills(Array.isArray(response.data) ? (response.data as BillItem[]) : [])
      })
      .catch(() => {
        if (active) setBills([])
      })

    return () => {
      active = false
    }
  }, [generating, isManager, messId, month])

  async function generateBills() {
    if (!messId || generating) return
    setGenerating(true)
    setBillingMessage('')
    try {
      await api.generateMonthlyBills({ messId, month: `${month}-01` })
      setBillingMessage(`Monthly bills generated for ${monthLabel(month)}.`)
    } catch (error) {
      setBillingMessage(error instanceof Error ? error.message : 'Failed to generate monthly bills.')
    } finally {
      setGenerating(false)
    }
  }

  const history = details?.history ?? []
  const personalPaid = history.filter((item) => String(item.paymentType ?? item.payment_method).toUpperCase() === 'PERSONAL').length
  const fromDeposit = history.filter((item) => String(item.paymentType ?? item.payment_method).toUpperCase().includes('DEPOSIT')).length

  return (
    <MobileShell showBottomNavigation>
      <ScreenHeader title="My Expense Details" subtitle="Personal summary" backHref="/expenses" />

      <div className="screen expense-screen">
        <label className="relative flex h-12 w-[min(100%,190px)] items-center gap-3 rounded-full border border-white/90 bg-[#008d8c] px-4 text-label font-bold text-white shadow-[0_12px_24px_rgba(0,119,122,0.2)]">
          <CalendarDays size={19} />
          <span className="min-w-0 flex-1 truncate">{monthLabel(month)}</span>
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Billing month" />
        </label>

        {message ? <div className="rounded-2xl border border-[#f4c7c7] bg-[#fff5f5] px-4 py-3 text-label font-semibold text-[#b42318]">{message}</div> : null}

        <div className="expense-summary-grid">
          <ExpenseSummaryCard icon={CookingPot} label="Food" value={loading ? '...' : formatTaka(details?.foodBill)} />
          <ExpenseSummaryCard icon={Zap} label="Utility" value={loading ? '...' : formatTaka(details?.utilityBill)} accent="blue" />
          <ExpenseSummaryCard icon={House} label="Rent" value={loading ? '...' : formatTaka(details?.roomRent)} accent="violet" />
          <ExpenseSummaryCard icon={WalletCards} label="Total" value={loading ? '...' : formatTaka(details?.total)} caption={`${details?.transactionCount ?? 0} txns`} accent="green" />
        </div>

        <ExpenseSurface title="My Cost Breakdown">
          <ExpenseBreakdownList
            items={[
              { icon: CookingPot, label: 'Food', value: formatTaka(details?.foodBill) },
              { icon: Zap, label: 'Utility', value: formatTaka(details?.utilityBill), accent: 'blue' },
              { icon: House, label: 'Rent', value: formatTaka(details?.roomRent), accent: 'violet' },
              { icon: Landmark, label: 'Paid', value: formatTaka(details?.personalExpenseAmount), accent: 'orange' },
            ]}
          />
        </ExpenseSurface>

        <div className="expense-info-strip"><Info size={18} className="shrink-0 text-[#008d8c]" /> Own allocated costs only.</div>

        <ExpenseSurface title="History">
          <div className="flush-list flush-list--home-panel">
            {history.map((item) => (
              <ExpenseListItem key={item.id} item={item} variant="horizontal" />
            ))}
            {!loading && !history.length ? <div className="expense-empty-state mx-3">No expense history for {monthLabel(month)}.</div> : null}
          </div>

          <h3 className="mt-4 text-body font-extrabold text-[#123748]">Activity</h3>
          <div className="mt-3 grid grid-cols-3">
            <ExpenseMetric label="Transactions" value={details?.transactionCount ?? 0} />
            <ExpenseMetric label="Personal Paid" value={personalPaid} color="#f07818" />
            <ExpenseMetric label="From Deposit" value={fromDeposit} />
          </div>
        </ExpenseSurface>

        {isManager ? (
          <ExpenseSurface
            title="Manager Billing Tools"
            aside={
              <button type="button" onClick={() => void generateBills()} disabled={generating} className="flex items-center gap-1.5 rounded-full bg-[#008d8c] px-3 py-2 text-caption font-bold text-white disabled:opacity-60">
                <FilePlus2 size={15} /> {generating ? 'Generating...' : 'Generate Bills'}
              </button>
            }
          >
            {billingMessage ? <div className="mb-3 rounded-[14px] border border-[#cfeeed] bg-[#edfafa] px-3 py-2.5 text-label font-semibold text-[#008d8c]">{billingMessage}</div> : null}
            <div className="overflow-hidden rounded-[15px] border border-[#edf1f4]">
              {bills.map((bill) => (
                <div key={bill.id} className="flex items-center gap-3 border-b border-[#edf1f4] bg-white px-3 py-3 last:border-b-0">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#e6f7f6] text-[#008d8c]"><BadgeCheck size={17} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-label font-bold text-[#123748]">{bill.member?.name ?? 'Member Bill'}</span><span className="block text-caption font-medium text-[#65838b]">{LABELS.BILL_STATUSES[bill.status]}</span></span>
                  <span className="text-label font-bold text-[#008d8c]">{formatTaka(bill.final_due)}</span>
                  <Link href={`/edit-monthly-bill?billId=${encodeURIComponent(bill.id)}&messId=${encodeURIComponent(messId)}`} className="grid h-9 w-9 place-items-center rounded-full bg-[#edfafa] text-[#008d8c]" aria-label={`Update ${bill.member?.name ?? 'member'} bill`}><Pencil size={15} /></Link>
                </div>
              ))}
              {!bills.length ? <div className="expense-empty-state">No generated bills for this month.</div> : null}
            </div>
          </ExpenseSurface>
        ) : null}
      </div>
    </MobileShell>
  )
}
