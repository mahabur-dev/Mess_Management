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
import {
  BillingCalculationNotice,
  billingCalculationIsPending,
  type BillingCalculationStatus,
} from '@/components/mobile/billing-status-notice'
import { DepositListItem, type DepositListRecord } from '@/components/mobile/deposit-design'
import { ExpenseReviewActions } from '@/components/mobile/expense-approval'
import { ExpenseListItem, type ExpenseListRecord } from '@/components/mobile/expense-design'
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
import { canManageMess } from '@/lib/app-permissions'
import { useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'
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
  const t = useTranslations('billing')
  const format = useLocaleFormatters()
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
        <span className="min-w-0 flex-1 text-label font-medium text-[#3d5560]">{t('assignedFoodExpenses')}</span>
        <span className="text-label font-semibold text-[#1d3a42]">{format.money(total)}</span>
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
                  {format.date(expense.expenseDate, { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </span>
              <span className="shrink-0 text-label font-semibold text-[#00777a]">{format.money(expense.memberShare)}</span>
              <ChevronRight size={16} className="shrink-0 text-[#65838b]" />
            </Link>
          ))}
          {!expenses.length ? <div className="expense-empty-state">{t('noAssignedFoodExpenses')}</div> : null}
        </div>
      ) : null}
    </div>
  )
}

function MyMonthlyDetailsContent() {
  const t = useTranslations('billing')
  const format = useLocaleFormatters()
  const loadNotice = useLocalizedNotice('billing')
  const closeNotice = useLocalizedNotice('billing')
  const params = useSearchParams()
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const memberId = params.get('memberId') || user?.id || ''
  const isOwnBill = memberId === user?.id
  const [month, setMonth] = useState(initialMonth(params.get('month')))
  const [bill, setBill] = useState<BillItem | null>(null)
  const [meals, setMeals] = useState<MealRecord[]>([])
  const [details, setDetails] = useState<MyExpenseDetails | null>(null)
  const [, setDeposits] = useState<DepositListRecord[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [billingStatus, setBillingStatus] = useState<BillingCalculationStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [closeBusy, setCloseBusy] = useState(false)
  const [reviewBusy, setReviewBusy] = useState(false)

  const range = useMemo(() => monthBounds(month), [month])

  useEffect(() => {
    if (!messId || !memberId) return
    let alive = true
    let billingTimer: ReturnType<typeof setTimeout> | null = null

    const refreshBill = () => {
      api
        .getBillsByMess(messId, { month: `${month}-01`, memberId, limit: 1 })
        .then((response) => {
          if (!alive) return
          const bills = Array.isArray(response.data) ? (response.data as BillItem[]) : []
          setBill(bills[0] ?? null)
          setBillingStatus(response.billing?.status ?? null)
          if (response.billing && response.billing.status !== 'READY' && response.billing.status !== 'FAILED') {
            billingTimer = setTimeout(refreshBill, 1500)
          }
        })
        .catch((error) => {
          if (alive) loadNotice.showError(error, 'loadDetailsFailed')
        })
    }

    setLoading(true)
    setBillingStatus(null)
    loadNotice.clearNotice()

    let firstLoadError: unknown = null
    const recordLoadError = (error: unknown) => {
      firstLoadError ??= error
    }

    Promise.all([
      api.getBillsByMess(messId, { month: `${month}-01`, memberId, limit: 1 }).catch((error) => {
        recordLoadError(error)
        return { data: [], billing: null }
      }),
      api.getMealsByMess(messId, { startDate: range.startDate, endDate: range.endDate, limit: 300 }).catch((error) => {
        recordLoadError(error)
        return { data: [] }
      }),
      api.getMemberExpenseDetails(messId, memberId, `${month}-01`).catch((error) => {
        recordLoadError(error)
        return { data: null }
      }),
      api
        .getDepositsByMess(messId, { userId: memberId, billMonth: `${month}-01`, limit: 50, sortBy: 'date', sortOrder: 'desc' })
        .catch((error) => {
          recordLoadError(error)
          return { data: [] }
        }),
      api
        .getPaymentsByMess(messId, { memberId, billMonth: `${month}-01`, limit: 50, sortBy: 'created_at', sortOrder: 'desc' })
        .catch((error) => {
          recordLoadError(error)
          return { data: [] }
        }),
    ])
      .then(([billRes, mealRes, detailRes, depositRes, paymentRes]) => {
        if (!alive) return
        const billList = Array.isArray(billRes.data) ? (billRes.data as BillItem[]) : []
        setBill(billList[0] ?? null)
        setBillingStatus(billRes.billing?.status ?? null)
        setMeals(normalizeMeals(mealRes.data))
        setDetails((detailRes.data ?? null) as MyExpenseDetails | null)
        setDeposits(Array.isArray(depositRes.data) ? (depositRes.data as DepositListRecord[]) : [])
        setPayments(Array.isArray(paymentRes.data) ? (paymentRes.data as PaymentItem[]) : [])
        if (billRes.billing && billRes.billing.status !== 'READY' && billRes.billing.status !== 'FAILED') {
          billingTimer = setTimeout(refreshBill, 1500)
        }
        if (firstLoadError) loadNotice.showError(firstLoadError, 'partialDetailsLoadFailed')
      })
      .catch((error) => {
        if (!alive) return
        loadNotice.showError(error, 'loadDetailsFailed')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
      if (billingTimer) clearTimeout(billingTimer)
    }
  }, [loadNotice.clearNotice, loadNotice.showError, memberId, messId, month, range.endDate, range.startDate])

  const history = useMemo(() => buildMemberMealHistory(meals, memberId), [meals, memberId])
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

  const closeUnavailableMessage = billingCalculationIsPending(billingStatus)
    ? null
    : latestCloseRequest?.status === 'PENDING' || latestCloseRequest?.status === 'APPROVED'
    ? null
    : !bill
      ? t('noBillToClose')
      : !isCompletedMonth
        ? t('closeAfterMonth')
        : toNumber(bill.balance) === 0
          ? t('noRemainingBalance')
          : null

  const requestClose = async () => {
    if (!isOwnBill || !bill || !canRequestClose || closeBusy) return
    setCloseBusy(true)
    closeNotice.clearNotice()
    try {
      const response = await api.requestMonthlyBillClose(bill.id)
      const request = response.data as BillCloseRequest
      setBill((current) => current ? { ...current, close_requests: [request] } : current)
      closeNotice.showMessage('closeRequestSubmitted', 'success')
    } catch (error) {
      closeNotice.showError(error, 'closeRequestFailed')
    } finally {
      setCloseBusy(false)
    }
  }

  const reviewCloseRequest = async (status: 'APPROVED' | 'REJECTED') => {
    if (!bill || !latestCloseRequest || reviewBusy || latestCloseRequest.status !== 'PENDING') return
    setReviewBusy(true)
    closeNotice.clearNotice()
    try {
      const response = await api.reviewMonthlyBillCloseRequest(latestCloseRequest.id, status)
      const reviewed = response.data as BillCloseRequest
      setBill((current) => current ? {
        ...current,
        ...(status === 'APPROVED' ? { balance: 0, final_due: 0 } : {}),
        close_requests: [reviewed],
      } : current)
      closeNotice.showMessage(
        status === 'APPROVED' ? 'closeApprovedByManager' : 'closeRejectedByManager',
        status === 'APPROVED' ? 'success' : 'danger',
      )
    } catch (error) {
      closeNotice.showError(error, 'reviewCloseFailed')
    } finally {
      setReviewBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen
        title={isOwnBill ? t('myMonthlyDetails') : (bill?.member?.name || t('memberMonthlyBillDetails'))}
        subtitle={format.month(`${month}-01`)}
        backHref="/monthly-bill"
      />

      <div className="screen space-y-4">
        <MealMonthSelector month={month} onChange={setMonth} />

        {loadNotice.notice ? <InlineNotice tone={loadNotice.notice.tone}>{loadNotice.notice.message}</InlineNotice> : null}
        <BillingCalculationNotice status={billingStatus} />
        {loading ? <LoadingIndicator variant="card" label={t('loadingMonthlyDetails')} /> : null}

        {!loading ? (
          <>
            <MealHistoryStats totalMeals={mealSummary.totalMeals} days={mealSummary.days} averagePerDay={mealSummary.averagePerDay} />

            <ExpenseSurface
              title={t('mealDetails')}
              aside={
                <Link href={appHref(`/meals/details?month=${month}&memberId=${encodeURIComponent(memberId)}&from=billing`)} className="inline-flex items-center gap-1 text-label font-semibold text-[#008d8c]">
                  {t('view')} <ChevronRight size={14} />
                </Link>
              }
            >
              <ExpenseBreakdownList
                items={[
                  { icon: UtensilsCrossed, label: t('totalMealsEaten'), value: format.number(billMeals) },
                  { icon: WalletCards, label: t('mealRate'), value: format.money(billMealRate) },
                  { icon: ReceiptText, label: t('mealTotalCost'), value: format.money(regularMealCharge) },
                ]}
              />
            </ExpenseSurface>

            <ExpenseSurface title={t('billBreakdown')}>
              <ExpenseBreakdownList
                items={[
                  { icon: ReceiptText, label: t('regularMealCharge'), value: format.money(regularMealCharge) },
                ]}
              />
              <AssignedFoodExpensesBreakdown
                total={assignedFoodExpenseTotal}
                expenses={details?.assignedFoodExpenses ?? []}
                messId={messId}
              />
              <ExpenseBreakdownList
                items={[
                  { icon: ReceiptText, label: t('totalFoodBill'), value: format.money(totalFoodBill) },
                  { icon: WalletCards, label: t('roomRent'), value: format.money(bill?.seat_rent ?? details?.roomRent), accent: 'violet' },
                  { icon: Zap, label: t('utility'), value: format.money(bill?.utility_share ?? details?.utilityBill), accent: 'blue' },
                  { icon: CalendarDays, label: t('previousBalance'), value: format.money(bill?.prev_balance), accent: 'green' },
                  { icon: CircleDollarSign, label: t('depositAndPayment'), value: format.money(toNumber(bill?.deposit_total) + toNumber(bill?.paid_amount)), accent: 'green' },
                  { icon: WalletCards, label: t('finalDue'), value: format.money(bill?.final_due), accent: 'orange' },
                ]}
              />
            </ExpenseSurface>

            {isOwnBill ? <ExpenseSurface title={t('closePreviousCalculation')}>
              <div className="space-y-3 px-3 py-3">
                {latestCloseRequest?.status === 'PENDING' ? (
                  <InlineNotice tone="warning">{t('closePendingMessage')}</InlineNotice>
                ) : null}
                {latestCloseRequest?.status === 'APPROVED' ? (
                  <InlineNotice tone="success">
                    {t('closeApprovedMessage', {
                      effectiveBalance: format.money(0),
                      originalBalance: format.money(latestCloseRequest.original_balance),
                    })}
                  </InlineNotice>
                ) : null}
                {latestCloseRequest?.status === 'REJECTED' ? (
                  <InlineNotice tone="danger">
                    {latestCloseRequest.review_note
                      ? t('closeRejectedWithNote', { note: latestCloseRequest.review_note })
                      : t('closeRejected')}
                  </InlineNotice>
                ) : null}
                {closeUnavailableMessage ? <InlineNotice tone="warning">{closeUnavailableMessage}</InlineNotice> : null}
                {closeNotice.notice ? <InlineNotice tone={closeNotice.notice.tone}>{closeNotice.notice.message}</InlineNotice> : null}
                <p className="text-label leading-6 text-[#65838b]">
                  {t('closeExplanation')}
                </p>
                <Button
                  type="button"
                  className="w-full"
                  busy={closeBusy}
                  disabled={!canRequestClose}
                  onClick={requestClose}
                >
                  {t('closePreviousCalculation')}
                </Button>
              </div>
            </ExpenseSurface> : null}

            {!isOwnBill && latestCloseRequest ? (
              <ExpenseSurface title={t('closePreviousCalculation')}>
                <div className="space-y-3 px-3 py-3">
                  {latestCloseRequest.status === 'PENDING' ? (
                    <InlineNotice tone="warning">
                      {t('memberCloseRequest', { balance: format.money(latestCloseRequest.original_balance) })}
                    </InlineNotice>
                  ) : null}
                  {latestCloseRequest.status === 'APPROVED' ? (
                    <InlineNotice tone="success">
                      {t('closedAtZero', { balance: format.money(latestCloseRequest.original_balance) })}
                    </InlineNotice>
                  ) : null}
                  {latestCloseRequest.status === 'REJECTED' ? <InlineNotice tone="danger">{t('closeRequestRejected')}</InlineNotice> : null}
                  {closeNotice.notice ? <InlineNotice tone={closeNotice.notice.tone}>{closeNotice.notice.message}</InlineNotice> : null}
                  {latestCloseRequest.status === 'PENDING' && canManageMess(user) ? (
                    <ExpenseReviewActions
                      busy={reviewBusy}
                      onApprove={() => reviewCloseRequest('APPROVED')}
                      onReject={() => reviewCloseRequest('REJECTED')}
                    />
                  ) : null}
                </div>
              </ExpenseSurface>
            ) : null}

            <ExpenseSurface title={t('depositSection')}>
              <div className="flush-list flush-list--home-card">
                {payments.map((item, index) => (
                  <DepositListItem key={item.id} item={item} index={index} variant="horizontal" />
                ))}
                {!payments.length ? <div className="expense-empty-state mx-3">{t('noPaymentSubmissions')}</div> : null}
              </div>
            </ExpenseSurface>

            <ExpenseSurface title={t('expensesAndUtility')}>
              <div className="flush-list flush-list--home-card">
                {expenseHistory.map((item) => (
                  <ExpenseListItem
                    key={item.id}
                    item={item}
                    href={`/expense-details?expenseId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`}
                    variant="horizontal"
                  />
                ))}
                {!expenseHistory.length ? <div className="expense-empty-state mx-3">{t('noExpensesOrUtility')}</div> : null}
              </div>
            </ExpenseSurface>
          </>
        ) : null}
      </div>
    </MobileShell>
  )
}

export default function MyMonthlyDetailsPage() {
  const t = useTranslations('billing')
  return (
    <Suspense fallback={<LoadingIndicator variant="screen" label={t('loadingMonthlyDetails')} />}>
      <MyMonthlyDetailsContent />
    </Suspense>
  )
}
