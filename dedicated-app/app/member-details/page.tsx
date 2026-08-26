'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, CircleDollarSign, ReceiptText, UtensilsCrossed, WalletCards, Zap } from 'lucide-react'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MemberDetailsView } from '@/components/mobile/member-details'
import type { MobileMember } from '@/components/mobile/member-card'
import { formatTaka } from '@/components/mobile/expense-design'
import { ExpenseBreakdownList, ExpenseSurface, ExpenseSummaryCard } from '@/components/mobile/expense-ui'
import { ExpenseReviewActions } from '@/components/mobile/expense-approval'
import { InlineNotice } from '@/components/mobile/meals-design'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import { canManageMess } from '@/lib/app-permissions'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '@/app/providers'

export default function MemberDetailsPage() {
  const { user } = useAuth()
  const searchParams = useQueryParams()
  const memberId = searchParams.get('memberId') ?? ''
  const messId = searchParams.get('messId') ?? ''
  const month = searchParams.get('month') ?? ''
  const [member, setMember] = useState<MobileMember | null>(null)
  const [bill, setBill] = useState<BillRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [billLoading, setBillLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [billMessage, setBillMessage] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)

  useEffect(() => {
    if (!memberId || !messId) {
      setMessage('Member information is missing.')
      return
    }

    let active = true
    setLoading(true)
    setMessage('')

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
        if (!found && !month) setMessage('Member not found.')
      })
      .catch((error) => {
        if (!active) return
        if (!month) setMember(null)
        setMessage(month ? '' : error instanceof Error ? error.message : 'Failed to load member details.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [memberId, messId, month])

  useEffect(() => {
    if (!memberId || !messId || !/^\d{4}-\d{2}$/.test(month)) return

    let active = true
    let billingTimer: ReturnType<typeof setTimeout> | null = null
    setBillLoading(true)
    setBillMessage('')

    const loadBill = () => api
      .getBillsByMess(messId, { month: `${month}-01`, memberId, limit: 1 })
      .then((response) => {
        if (!active) return
        const list = Array.isArray(response.data) ? (response.data as BillRecord[]) : []
        const nextBill = list[0] ?? null
        const billMember = nextBill?.member
        setBill(nextBill)
        if (billMember) {
          setMember((current) => current ?? {
            id: `${messId}:${billMember.id}`,
            user_id: billMember.id,
            mess_id: messId,
            role: 'MEMBER',
            is_active: true,
            user: {
              id: billMember.id,
              name: billMember.name || 'Member',
              email: billMember.email || '',
              avatar_url: billMember.avatar_url ?? null,
            },
          })
        }
        if (!nextBill) setBillMessage('No monthly bill found for this member.')
        if (response.billing && response.billing.status !== 'READY' && response.billing.status !== 'FAILED') {
          billingTimer = setTimeout(loadBill, 1500)
        }
      })
      .catch((error) => {
        if (!active) return
        setBill(null)
        setBillMessage(error instanceof Error ? error.message : 'Failed to load member monthly bill.')
      })
      .finally(() => {
        if (active) setBillLoading(false)
      })

    loadBill()

    return () => {
      active = false
      if (billingTimer) clearTimeout(billingTimer)
    }
  }, [memberId, messId, month])

  const monthLabel = /^\d{4}-\d{2}$/.test(month)
    ? new Date(`${month}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''
  const totalCost = bill ? toNumber(bill.food_bill) + toNumber(bill.seat_rent) + toNumber(bill.utility_share) : 0
  const totalDeposit = bill ? toNumber(bill.deposit_total) + toNumber(bill.paid_amount) : 0
  const currentMonthBalance = Number((totalCost - totalDeposit).toFixed(2))
  const closeRequest = bill?.close_requests?.[0] ?? null

  const reviewCloseRequest = async (status: 'APPROVED' | 'REJECTED') => {
    if (!bill || !closeRequest || reviewBusy) return
    setReviewBusy(true)
    setBillMessage('')
    try {
      const response = await api.reviewMonthlyBillCloseRequest(closeRequest.id, status)
      const reviewed = response.data as BillCloseRequest
      setBill((current) => current ? {
        ...current,
        ...(status === 'APPROVED' ? { balance: 0, final_due: 0 } : {}),
        close_requests: [reviewed],
      } : current)
      setBillMessage(status === 'APPROVED'
        ? 'Calculation closed. The effective and carry-forward balance is now zero.'
        : 'Close request rejected.')
    } catch (error) {
      setBillMessage(error instanceof Error ? error.message : 'Failed to review close request.')
    } finally {
      setReviewBusy(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Member Details" subtitle={monthLabel || member?.user?.name || 'Member overview'} backHref={month ? '/monthly-bill' : '/members'} />
      <div className="screen space-y-4">
        {loading ? <LoadingIndicator variant="card" label="Loading member details" /> : null}
        {message ? <div className="ui-notice ui-notice--danger">{message}</div> : null}
        {member ? <MemberDetailsView member={member} showActions={!month} /> : null}

        {month ? (
          <ExpenseSurface title="Monthly Bill Details">
            {billLoading ? <LoadingIndicator variant="card" label="Loading member bill" /> : null}
            {billMessage && !billLoading ? <div className="ui-notice ui-notice--info">{billMessage}</div> : null}
            {bill && !billLoading ? (
              <div className="space-y-4">
                <div className="expense-summary-grid">
                  <ExpenseSummaryCard icon={UtensilsCrossed} label="Total Meals" value={toNumber(bill.total_meals)} />
                  <ExpenseSummaryCard icon={ReceiptText} label="Total Cost" value={formatTaka(totalCost)} accent="blue" />
                  <ExpenseSummaryCard icon={CircleDollarSign} label="Deposit" value={formatTaka(totalDeposit)} accent="green" />
                  <ExpenseSummaryCard icon={WalletCards} label="Final Due" value={formatTaka(bill.final_due)} accent="violet" />
                </div>
                <ExpenseBreakdownList
                  items={[
                    { icon: CalendarDays, label: 'Month', value: monthLabel },
                    { icon: ReceiptText, label: 'Food / Meal', value: formatTaka(bill.food_bill) },
                    { icon: WalletCards, label: 'Room rent', value: formatTaka(bill.seat_rent), accent: 'violet' },
                    { icon: Zap, label: 'Utility share', value: formatTaka(bill.utility_share), accent: 'blue' },
                    { icon: CircleDollarSign, label: 'Previous balance', value: formatTaka(bill.prev_balance), accent: 'green' },
                    { icon: WalletCards, label: 'Current month balance', value: formatTaka(currentMonthBalance), accent: 'orange' },
                    { icon: WalletCards, label: 'Carry-forward balance', value: formatTaka(bill.balance), accent: 'violet' },
                  ]}
                />
                {closeRequest ? (
                  <div className="space-y-3">
                    {closeRequest.status === 'PENDING' ? (
                      <InlineNotice tone="warning">
                        This member requested to close the calculation. Original carry-forward balance: {formatTaka(closeRequest.original_balance)}.
                      </InlineNotice>
                    ) : null}
                    {closeRequest.status === 'APPROVED' ? (
                      <InlineNotice tone="success">
                        Closed and settled at zero. Original audit balance: {formatTaka(closeRequest.original_balance)}.
                      </InlineNotice>
                    ) : null}
                    {closeRequest.status === 'REJECTED' ? (
                      <InlineNotice tone="danger">Close request rejected.</InlineNotice>
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
