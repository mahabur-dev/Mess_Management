'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, CircleDollarSign, ReceiptText, UtensilsCrossed, WalletCards, Zap } from 'lucide-react'
import { LoadingIndicator } from '@/components/loading-indicator'
import {
  BillingCalculationNotice,
  billingCalculationIsPending,
  type BillingCalculationStatus,
} from '@/components/mobile/billing-status-notice'
import { MemberDetailsView } from '@/components/mobile/member-details'
import type { MobileMember } from '@/components/mobile/member-card'
import { ExpenseBreakdownList, ExpenseSurface, ExpenseSummaryCard } from '@/components/mobile/expense-ui'
import { ExpenseReviewActions } from '@/components/mobile/expense-approval'
import { InlineNotice } from '@/components/mobile/meals-design'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import { useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '@/app/providers'

export default function MemberDetailsPage() {
  const membersCopy = useTranslations('members')
  const billing = useTranslations('billing')
  const format = useLocaleFormatters()
  const memberNotice = useLocalizedNotice('members')
  const billNotice = useLocalizedNotice('billing')
  const { user } = useAuth()
  const searchParams = useQueryParams()
  const memberId = searchParams.get('memberId') ?? ''
  const messId = searchParams.get('messId') ?? ''
  const month = searchParams.get('month') ?? ''
  const [member, setMember] = useState<MobileMember | null>(null)
  const [bill, setBill] = useState<BillRecord | null>(null)
  const [billingStatus, setBillingStatus] = useState<BillingCalculationStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [billLoading, setBillLoading] = useState(false)
  const [reviewBusy, setReviewBusy] = useState(false)

  useEffect(() => {
    if (!memberId || !messId) {
      memberNotice.showMessage('memberInformationMissing', 'danger')
      return
    }

    let active = true
    setLoading(true)
    memberNotice.clearNotice()

    api
      .getAllMembers({ limit: 500 })
      .then((response) => {
        if (!active) return
        const members = Array.isArray(response.data) ? response.data : []
        const found =
          members.find(
            (item: MobileMember) =>
              item.user_id === memberId && (item.mess_id === messId || item.mess?.id === messId),
          ) ?? null

        if (found || !month) setMember(found)
        if (!found && !month) memberNotice.showMessage('memberNotFound', 'danger')
      })
      .catch((error) => {
        if (!active) return
        if (!month) setMember(null)
        if (month) memberNotice.clearNotice()
        else memberNotice.showError(error, 'loadMemberDetailsFailed')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [memberId, memberNotice.clearNotice, memberNotice.showError, memberNotice.showMessage, messId, month])

  useEffect(() => {
    if (!memberId || !messId || !/^\d{4}-\d{2}$/.test(month)) return

    let active = true
    let billingTimer: ReturnType<typeof setTimeout> | null = null
    setBillLoading(true)
    setBillingStatus(null)
    billNotice.clearNotice()

    const loadBill = () => api
      .getBillsByMess(messId, { month: `${month}-01`, memberId, limit: 1 })
      .then((response) => {
        if (!active) return
        const list = Array.isArray(response.data) ? (response.data as BillRecord[]) : []
        const nextBill = list[0] ?? null
        const billMember = nextBill?.member
        setBill(nextBill)
        setBillingStatus(response.billing?.status ?? null)
        if (billMember) {
          setMember((current) => current ?? {
            id: `${messId}:${billMember.id}`,
            user_id: billMember.id,
            mess_id: messId,
            role: 'MEMBER',
            is_active: true,
            user: {
              id: billMember.id,
              name: billMember.name || membersCopy('memberFallback'),
              email: billMember.email || '',
              avatar_url: billMember.avatar_url ?? null,
            },
          })
        }
        if (!nextBill && !billingCalculationIsPending(response.billing?.status)) {
          billNotice.showMessage('noMemberBill')
        }
        if (response.billing && response.billing.status !== 'READY' && response.billing.status !== 'FAILED') {
          billingTimer = setTimeout(loadBill, 1500)
        }
      })
      .catch((error) => {
        if (!active) return
        setBill(null)
        billNotice.showError(error, 'loadMemberBillFailed')
      })
      .finally(() => {
        if (active) setBillLoading(false)
      })

    loadBill()

    return () => {
      active = false
      if (billingTimer) clearTimeout(billingTimer)
    }
  }, [billNotice.clearNotice, billNotice.showError, billNotice.showMessage, memberId, membersCopy, messId, month])

  const monthLabel = /^\d{4}-\d{2}$/.test(month)
    ? format.month(`${month}-01`)
    : ''
  const totalCost = bill ? toNumber(bill.food_bill) + toNumber(bill.seat_rent) + toNumber(bill.utility_share) : 0
  const totalDeposit = bill ? toNumber(bill.deposit_total) + toNumber(bill.paid_amount) : 0
  const currentMonthBalance = Number((totalCost - totalDeposit).toFixed(2))
  const closeRequest = bill?.close_requests?.[0] ?? null

  const reviewCloseRequest = async (status: 'APPROVED' | 'REJECTED') => {
    if (!bill || !closeRequest || reviewBusy) return
    setReviewBusy(true)
    billNotice.clearNotice()
    try {
      const response = await api.reviewMonthlyBillCloseRequest(closeRequest.id, status)
      const reviewed = response.data as BillCloseRequest
      setBill((current) => current ? {
        ...current,
        ...(status === 'APPROVED' ? { balance: 0, final_due: 0 } : {}),
        close_requests: [reviewed],
      } : current)
      billNotice.showMessage(
        status === 'APPROVED' ? 'closeApprovedByManager' : 'closeRejectedByManager',
        status === 'APPROVED' ? 'success' : 'danger',
      )
    } catch (error) {
      billNotice.showError(error, 'reviewCloseFailed')
    } finally {
      setReviewBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title={membersCopy('memberDetails')} subtitle={monthLabel || member?.user?.name || membersCopy('memberOverview')} backHref={month ? '/monthly-bill' : '/members'} />
      <div className="screen space-y-4">
        {loading ? <LoadingIndicator variant="card" label={membersCopy('loadingMemberDetails')} /> : null}
        {memberNotice.notice ? <InlineNotice tone={memberNotice.notice.tone}>{memberNotice.notice.message}</InlineNotice> : null}
        {member ? <MemberDetailsView member={member} showActions={!month && canManageMess(user)} /> : null}

        {month ? (
          <ExpenseSurface title={billing('memberMonthlyBillDetails')}>
            {billLoading ? <LoadingIndicator variant="card" label={billing('loadingMemberBill')} /> : null}
            {billNotice.notice && !billLoading ? <InlineNotice tone={billNotice.notice.tone}>{billNotice.notice.message}</InlineNotice> : null}
            {!billLoading ? <BillingCalculationNotice status={billingStatus} /> : null}
            {bill && !billLoading ? (
              <div className="space-y-4">
                <div className="expense-summary-grid">
                  <ExpenseSummaryCard icon={UtensilsCrossed} label={billing('totalMeals')} value={format.number(toNumber(bill.total_meals))} />
                  <ExpenseSummaryCard icon={ReceiptText} label={billing('totalCost')} value={format.money(totalCost)} accent="blue" />
                  <ExpenseSummaryCard icon={CircleDollarSign} label={billing('deposit')} value={format.money(totalDeposit)} accent="green" />
                  <ExpenseSummaryCard icon={WalletCards} label={billing('finalDue')} value={format.money(bill.final_due)} accent="violet" />
                </div>
                <ExpenseBreakdownList
                  items={[
                    { icon: CalendarDays, label: billing('month'), value: monthLabel },
                    { icon: ReceiptText, label: billing('foodAndMeal'), value: format.money(bill.food_bill) },
                    { icon: WalletCards, label: billing('roomRent'), value: format.money(bill.seat_rent), accent: 'violet' },
                    { icon: Zap, label: billing('utilityShare'), value: format.money(bill.utility_share), accent: 'blue' },
                    { icon: CircleDollarSign, label: billing('previousBalance'), value: format.money(bill.prev_balance), accent: 'green' },
                    { icon: WalletCards, label: billing('currentMonthBalance'), value: format.money(currentMonthBalance), accent: 'orange' },
                    { icon: WalletCards, label: billing('carryForwardBalance'), value: format.money(bill.balance), accent: 'violet' },
                  ]}
                />
                {closeRequest ? (
                  <div className="space-y-3">
                    {closeRequest.status === 'PENDING' ? (
                      <InlineNotice tone="warning">
                        {billing('memberCloseRequest', { balance: format.money(closeRequest.original_balance) })}
                      </InlineNotice>
                    ) : null}
                    {closeRequest.status === 'APPROVED' ? (
                      <InlineNotice tone="success">
                        {billing('closedAtZero', { balance: format.money(closeRequest.original_balance) })}
                      </InlineNotice>
                    ) : null}
                    {closeRequest.status === 'REJECTED' ? (
                      <InlineNotice tone="danger">{billing('closeRequestRejected')}</InlineNotice>
                    ) : null}
                    {closeRequest.status === 'PENDING' && canManageMess(user) ? (
                      <ExpenseReviewActions
                        busy={reviewBusy}
                        onApprove={() => reviewCloseRequest('APPROVED')}
                        onReject={() => reviewCloseRequest('REJECTED')}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </ExpenseSurface>
        ) : null}
      </div>
    </MobileShell>
  )
}

type BillRecord = {
  id: string
  month: string
  member?: {
    id: string
    name?: string | null
    email?: string | null
    avatar_url?: string | null
  }
  total_meals?: string | number | null
  food_bill?: string | number | null
  seat_rent?: string | number | null
  utility_share?: string | number | null
  deposit_total?: string | number | null
  paid_amount?: string | number | null
  final_due?: string | number | null
  prev_balance?: string | number | null
  balance?: string | number | null
  close_requests?: BillCloseRequest[]
}

type BillCloseRequest = {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  original_balance?: string | number | null
  review_note?: string | null
}

function toNumber(value?: string | number | null) {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}
