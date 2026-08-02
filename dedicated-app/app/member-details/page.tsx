'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, CircleDollarSign, ReceiptText, UtensilsCrossed, WalletCards, Zap } from 'lucide-react'
import { LoadingIndicator } from '@/components/loading-indicator'
import { MemberDetailsView } from '@/components/mobile/member-details'
import type { MobileMember } from '@/components/mobile/member-card'
import { formatTaka } from '@/components/mobile/expense-design'
import { ExpenseBreakdownList, ExpenseSurface, ExpenseSummaryCard } from '@/components/mobile/expense-ui'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import { useQueryParams } from '@/lib/use-query-params'

export default function MemberDetailsPage() {
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

        setMember(found)
        if (!found) setMessage('Member not found.')
      })
      .catch((error) => {
        if (!active) return
        setMember(null)
        setMessage(error instanceof Error ? error.message : 'Failed to load member details.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [memberId, messId])

  useEffect(() => {
    if (!memberId || !messId || !/^\d{4}-\d{2}$/.test(month)) return

    let active = true
    setBillLoading(true)
    setBillMessage('')

    api
      .getBillsByMess(messId, { month: `${month}-01`, memberId, limit: 1 })
      .then((response) => {
        if (!active) return
        const list = Array.isArray(response.data) ? (response.data as BillRecord[]) : []
        setBill(list[0] ?? null)
        if (!list[0]) setBillMessage('No monthly bill found for this member.')
      })
      .catch((error) => {
        if (!active) return
        setBill(null)
        setBillMessage(error instanceof Error ? error.message : 'Failed to load member monthly bill.')
      })
      .finally(() => {
        if (active) setBillLoading(false)
      })

    return () => {
      active = false
    }
  }, [memberId, messId, month])

  const monthLabel = /^\d{4}-\d{2}$/.test(month)
    ? new Date(`${month}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : ''
  const totalCost = bill ? toNumber(bill.food_bill) + toNumber(bill.seat_rent) + toNumber(bill.utility_share) : 0

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
                  <ExpenseSummaryCard icon={CircleDollarSign} label="Deposit" value={formatTaka(toNumber(bill.deposit_total) + toNumber(bill.paid_amount))} accent="green" />
                  <ExpenseSummaryCard icon={WalletCards} label="Final Due" value={formatTaka(bill.final_due)} accent="violet" />
                </div>
                <ExpenseBreakdownList
                  items={[
                    { icon: CalendarDays, label: 'Month', value: monthLabel },
                    { icon: ReceiptText, label: 'Food / Meal', value: formatTaka(bill.food_bill) },
                    { icon: WalletCards, label: 'Room rent', value: formatTaka(bill.seat_rent), accent: 'violet' },
                    { icon: Zap, label: 'Utility share', value: formatTaka(bill.utility_share), accent: 'blue' },
                    { icon: CircleDollarSign, label: 'Previous balance', value: formatTaka(bill.prev_balance), accent: 'green' },
                    { icon: WalletCards, label: 'Current balance', value: formatTaka(bill.balance), accent: 'orange' },
                  ]}
                />
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
  total_meals?: string | number | null
  food_bill?: string | number | null
  seat_rent?: string | number | null
  utility_share?: string | number | null
  deposit_total?: string | number | null
  paid_amount?: string | number | null
  final_due?: string | number | null
  prev_balance?: string | number | null
  balance?: string | number | null
}

function toNumber(value?: string | number | null) {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}
