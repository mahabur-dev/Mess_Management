'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ReceiptText,
  UtensilsCrossed,
  WalletCards,
  Zap,
} from 'lucide-react'
import { LoadingIndicator } from '@/components/loading-indicator'
import { DepositListItem, type DepositListRecord } from '@/components/mobile/deposit-design'
import { ExpenseListItem, formatTaka, type ExpenseListRecord } from '@/components/mobile/expense-design'
import { ExpenseBreakdownList, ExpenseSurface } from '@/components/mobile/expense-ui'
import {
  InlineNotice,
  MealHistoryStats,
  MealMonthSelector,
  buildMemberMealHistory,
  currentMonthValue,
  monthBounds,
  normalizeMeals,
  summarizeMealHistory,
  type MealRecord,
} from '@/components/mobile/meals-design'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { Button } from '@/components/ui'
import { api } from '@/lib/api'
import { appHref } from '@/lib/routes'
import { useAuth } from '@/app/providers'

type BillItem = {
  id: string
  month: string
  total_meals?: string | number | null
  meal_charge?: string | number | null
  food_bill?: string | number | null
  seat_rent?: string | number | null
  utility_share?: string | number | null
  deposit_total?: string | number | null
  paid_amount?: string | number | null
  final_due?: string | number | null
  prev_balance?: string | number | null
  balance?: string | number | null
  status?: string | null
  member?: { id: string; name: string }
  close_requests?: BillCloseRequest[]
}

type BillCloseRequest = {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  original_balance?: string | number | null
  original_final_due?: string | number | null
  original_credit_balance?: string | number | null
  review_note?: string | null
  requested_at?: string | null
  reviewed_at?: string | null
}

type MyExpenseDetails = {
  foodBill?: number
  utilityBill?: number
  roomRent?: number
  total?: number
  transactionCount?: number
  assignedFoodExpenseTotal?: number
  assignedFoodExpenses?: Array<{
    id: string
    title: string
    expenseDate: string
    memberShare: number
    sharedWith: string
    splitRule: string
    note?: string | null
  }>
  history?: ExpenseListRecord[]
}

type PaymentItem = DepositListRecord & {
  status?: string
}

function initialMonth(value: string | null) {
  return /^\d{4}-\d{2}$/.test(value ?? '') ? (value as string) : currentMonthValue()
}

function toNumber(value?: string | number | null) {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}

function mealRate(bill?: BillItem | null) {
  const meals = toNumber(bill?.total_meals)
  return meals > 0 ? toNumber(bill?.meal_charge) / meals : 0
}

function AssignedFoodExpensesBreakdown({
  total,
  expenses,
  messId,
}: {
  total: number
  expenses: NonNullable<MyExpenseDetails['assignedFoodExpenses']>
  messId: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-[#edf1f4] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="expense-breakdown-row w-full text-left"
        aria-expanded={open}
      >
        <span className="expense-breakdown-row__icon bg-[#edfafa] text-[#0aa0a0]">
          <ReceiptText size={16} strokeWidth={2.35} />
        </span>
        <span className="min-w-0 flex-1 text-label font-medium text-[#3d5560]">Assigned Food Expenses</span>
        <span className="text-label font-semibold text-[#1d3a42]">{formatTaka(total)}</span>
        <ChevronDown size={17} className={`shrink-0 text-[#65838b] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="space-y-2 bg-[#f8fdfd] px-3 py-3">
          {expenses.map((expense) => (
            <Link
              key={expense.id}
              href={appHref(`/expense-details?expenseId=${encodeURIComponent(expense.id)}&messId=${encodeURIComponent(messId)}`)}
              className="flex items-center gap-3 rounded-[13px] border border-[#e4eaec] bg-white px-3 py-2.5"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-label font-semibold text-[#123748]">{expense.title}</span>
                <span className="mt-0.5 block text-caption font-medium text-[#65838b]">
                  {new Date(expense.expenseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                </span>
              </span>
              <span className="shrink-0 text-label font-bold text-[#00777a]">{formatTaka(expense.memberShare)}</span>
              <ChevronRight size={16} className="shrink-0 text-[#65838b]" />
            </Link>
          ))}
          {!expenses.length ? <div className="expense-empty-state">No assigned food expenses.</div> : null}
        </div>
      ) : null}
    </div>
  )
}

function MyMonthlyDetailsContent() {
  const params = useSearchParams()
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const [month, setMonth] = useState(initialMonth(params.get('month')))
  const [bill, setBill] = useState<BillItem | null>(null)
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [details, setDetails] = useState<MyExpenseDetails | null>(null)
  const [deposits, setDeposits] = useState<DepositListRecord[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [closeBusy, setCloseBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [closeMessage, setCloseMessage] = useState('')

  const range = useMemo(() => monthBounds(month), [month])

  useEffect(() => {
    if (!messId || !user?.id) return
    let alive = true
    let billingTimer: ReturnType<typeof setTimeout> | null = null

    const refreshBill = () => {
      api
        .getBillsByMess(messId, { month: `${month}-01`, memberId: user.id, limit: 1 })
        .then((response) => {
          if (!alive) return
          const bills = Array.isArray(response.data) ? (response.data as BillItem[]) : []
          setBill(bills[0] ?? null)
          if (response.billing && response.billing.status !== 'READY' && response.billing.status !== 'FAILED') {
            billingTimer = setTimeout(refreshBill, 1500)
          }
        })
        .catch(() => undefined)
    }

    setLoading(true)
    setMessage('')

    Promise.all([
      api.getBillsByMess(messId, { month: `${month}-01`, memberId: user.id, limit: 1 }).catch(() => ({ data: [], billing: null })),
      api.getMealsByMess(messId, { startDate: range.startDate, endDate: range.endDate, limit: 300 }).catch(() => ({ data: [] })),
      api.getMyExpenseDetails(messId, `${month}-01`).catch(() => ({ data: null })),
      api
        .getDepositsByMess(messId, { userId: user.id, billMonth: `${month}-01`, limit: 50, sortBy: 'date', sortOrder: 'desc' })
        .catch(() => ({ data: [] })),
      api
        .getPaymentsByMess(messId, { memberId: user.id, billMonth: `${month}-01`, limit: 50, sortBy: 'created_at', sortOrder: 'desc' })
        .catch(() => ({ data: [] })),
    ])
      .then(([billRes, mealRes, detailRes, depositRes, paymentRes]) => {
        if (!alive) return
        const billList = Array.isArray(billRes.data) ? (billRes.data as BillItem[]) : []
        setBill(billList[0] ?? null)
        setMeals(normalizeMeals(mealRes.data))
        setDetails((detailRes.data ?? null) as MyExpenseDetails | null)
        setDeposits(Array.isArray(depositRes.data) ? (depositRes.data as DepositListRecord[]) : [])
        setPayments(Array.isArray(paymentRes.data) ? (paymentRes.data as PaymentItem[]) : [])
        if (billRes.billing && billRes.billing.status !== 'READY' && billRes.billing.status !== 'FAILED') {
          billingTimer = setTimeout(refreshBill, 1500)
        }
      })
      .catch((error) => {
        if (!alive) return
        setMessage(error instanceof Error ? error.message : 'Failed to load monthly bill details.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
      if (billingTimer) clearTimeout(billingTimer)
    }
  }, [messId, month, range.endDate, range.startDate, user?.id])

  const history = useMemo(() => buildMemberMealHistory(meals, user?.id), [meals, user?.id])
  const mealSummary = useMemo(() => summarizeMealHistory(history), [history])
  const expenseHistory = details?.history ?? []
  const billMeals = toNumber(bill?.total_meals) || mealSummary.totalMeals
  const billMealRate = mealRate(bill)
  const assignedFoodExpenseTotal = toNumber(bill?.food_bill)
    ? Math.max(0, toNumber(bill?.food_bill) - toNumber(bill?.meal_charge))
    : toNumber(details?.assignedFoodExpenseTotal)
  const regularMealCharge = toNumber(bill?.meal_charge)
    || Math.max(0, toNumber(details?.foodBill) - assignedFoodExpenseTotal)
  const totalFoodBill = toNumber(bill?.food_bill) || toNumber(details?.foodBill)
  const latestCloseRequest = bill?.close_requests?.[0] ?? null
  const isCompletedMonth = month < currentMonthValue()
  const canRequestClose = Boolean(
    bill
      && isCompletedMonth
      && toNumber(bill.balance) !== 0
      && latestCloseRequest?.status !== 'PENDING'
      && latestCloseRequest?.status !== 'APPROVED',
  )

  const requestClose = async () => {
    if (!bill || closeBusy) return
    setCloseBusy(true)
    setCloseMessage('')
    try {
      const response = await api.requestMonthlyBillClose(bill.id)
      const request = response.data as BillCloseRequest
      setBill((current) => current ? { ...current, close_requests: [request] } : current)
      setCloseMessage('Request submitted. Your manager has been notified for approval.')
    } catch (error) {
      setCloseMessage(error instanceof Error ? error.message : 'Failed to submit close request.')
    } finally {
      setCloseBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="My Monthly Details" subtitle={range.month} backHref="/monthly-bill" />

      <div className="screen space-y-4">
        <MealMonthSelector month={month} onChange={setMonth} />

        {message ? <InlineNotice tone="danger">{message}</InlineNotice> : null}
        {loading ? <LoadingIndicator variant="card" label="Loading monthly details" /> : null}

        {!loading ? (
          <>
            <MealHistoryStats totalMeals={mealSummary.totalMeals} days={mealSummary.days} averagePerDay={mealSummary.averagePerDay} />

            <ExpenseSurface
              title="Meal Details"
              aside={
                <Link href={appHref(`/meals/details?month=${month}`)} className="inline-flex items-center gap-1 text-label font-bold text-[#008d8c]">
                  View <ChevronRight size={14} />
                </Link>
              }
            >
              <ExpenseBreakdownList
                items={[
                  { icon: UtensilsCrossed, label: 'Total meals eaten', value: billMeals },
                  { icon: WalletCards, label: 'Meal rate', value: formatTaka(billMealRate) },
                  { icon: ReceiptText, label: 'Meal total cost', value: formatTaka(regularMealCharge) },
                ]}
              />
            </ExpenseSurface>

            <ExpenseSurface title="Bill Breakdown">
              <ExpenseBreakdownList
                items={[
                  { icon: ReceiptText, label: 'Regular Meal Charge', value: formatTaka(regularMealCharge) },
                ]}
              />
              <AssignedFoodExpensesBreakdown
                total={assignedFoodExpenseTotal}
                expenses={details?.assignedFoodExpenses ?? []}
                messId={messId}
              />
              <ExpenseBreakdownList
                items={[
                  { icon: ReceiptText, label: 'Total Food Bill', value: formatTaka(totalFoodBill) },
                  { icon: WalletCards, label: 'Room rent', value: formatTaka(bill?.seat_rent ?? details?.roomRent), accent: 'violet' },
                  { icon: Zap, label: 'Utility', value: formatTaka(bill?.utility_share ?? details?.utilityBill), accent: 'blue' },
                  { icon: CalendarDays, label: 'Previous balance', value: formatTaka(bill?.prev_balance), accent: 'green' },
                  { icon: CircleDollarSign, label: 'Deposit + payment', value: formatTaka(toNumber(bill?.deposit_total) + toNumber(bill?.paid_amount)), accent: 'green' },
                  { icon: WalletCards, label: 'Final due', value: formatTaka(bill?.final_due), accent: 'orange' },
                ]}
              />
            </ExpenseSurface>

            {bill && isCompletedMonth ? (
              <ExpenseSurface title="Close Previous Calculation">
                <div className="space-y-3 px-3 py-3">
                  {latestCloseRequest?.status === 'PENDING' ? (
                    <InlineNotice tone="warning">Waiting for manager approval. Your current balance is unchanged until approval.</InlineNotice>
                  ) : null}
                  {latestCloseRequest?.status === 'APPROVED' ? (
                    <InlineNotice tone="success">
                      Calculation closed. Displayed and carry-forward balance is now {formatTaka(0)}. Original audit balance: {formatTaka(latestCloseRequest.original_balance)}.
                    </InlineNotice>
                  ) : null}
                  {latestCloseRequest?.status === 'REJECTED' ? (
                    <InlineNotice tone="danger">
                      The previous request was rejected{latestCloseRequest.review_note ? `: ${latestCloseRequest.review_note}` : '.'}
                    </InlineNotice>
                  ) : null}
                  {closeMessage ? <InlineNotice tone={latestCloseRequest?.status === 'PENDING' ? 'success' : 'danger'}>{closeMessage}</InlineNotice> : null}
                  {canRequestClose ? (
                    <>
                      <p className="text-label leading-6 text-[#65838b]">
                        Ask your manager to settle this month without carrying its positive or negative balance into the next month. The original amount will remain in audit history.
                      </p>
                      <Button type="button" className="w-full" busy={closeBusy} onClick={requestClose}>
                        Close Previous Calculation
                      </Button>
                    </>
                  ) : null}
                </div>
              </ExpenseSurface>
            ) : null}

            <ExpenseSurface title="Deposit Section">
              <div className="flush-list flush-list--home-card">
                {deposits.map((item, index) => (
                  <DepositListItem
                    key={item.id}
                    item={{ ...item, status: 'APPROVED', method: item.method ?? 'CASH', payment_date: item.payment_date ?? item.date ?? item.created_at }}
                    index={index}
                    variant="horizontal"
                  />
                ))}
                {!deposits.length ? <div className="expense-empty-state mx-3">No direct deposits found.</div> : null}
              </div>
            </ExpenseSurface>

            <ExpenseSurface title="Payment Section">
              <div className="flush-list flush-list--home-card">
                {payments.map((item, index) => (
                  <DepositListItem key={item.id} item={item} index={index} variant="horizontal" />
                ))}
                {!payments.length ? <div className="expense-empty-state mx-3">No payment submissions found.</div> : null}
              </div>
            </ExpenseSurface>

            <ExpenseSurface title="Expenses & Utility">
              <div className="flush-list flush-list--home-card">
                {expenseHistory.map((item) => (
                  <ExpenseListItem
                    key={item.id}
                    item={item}
                    href={`/expense-details?expenseId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`}
                    variant="horizontal"
                  />
                ))}
                {!expenseHistory.length ? <div className="expense-empty-state mx-3">No expenses or utility entries found.</div> : null}
              </div>
            </ExpenseSurface>
          </>
        ) : null}
      </div>
    </MobileShell>
  )
}

export default function MyMonthlyDetailsPage() {
  return (
    <Suspense fallback={<LoadingIndicator variant="screen" label="Loading monthly details" />}>
      <MyMonthlyDetailsContent />
    </Suspense>
  )
}
