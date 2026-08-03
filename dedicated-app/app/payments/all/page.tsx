'use client'

import { useEffect, useMemo, useState } from 'react'
import { MobileShell } from '@/components/mobile-shell'
import { LoadingIndicator } from '@/components/loading-indicator'
import { TopScreen } from '@/components/top-screen'
import {
  DepositAggregateSummary,
  DepositCompactFilters,
  DepositListItem,
  DepositSearchBar,
  DepositSectionTitle,
  type DepositListRecord,
} from '@/components/mobile/deposit-design'
import { currentMonthValue, formatMonthLabel } from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { type PaymentStatus } from '@/lib/form-options'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '@/app/providers'

type PaymentItem = DepositListRecord & {
  status: PaymentStatus
}

function categoryLabel(item: PaymentItem) {
  return item.categories?.[0]?.replaceAll('_', ' ') || item.note || 'Meal Advance'
}

export default function AllDepositsPage() {
  const { user } = useAuth()
  const searchParams = useQueryParams()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const [items, setItems] = useState<PaymentItem[]>([])
  const [month, setMonth] = useState(() => {
    const queryMonth = searchParams.get('month')
    return /^\d{4}-\d{2}$/.test(queryMonth ?? '') ? queryMonth as string : currentMonthValue()
  })
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const queryMonth = searchParams.get('month')
    if (/^\d{4}-\d{2}$/.test(queryMonth ?? '')) setMonth(queryMonth as string)
  }, [searchParams])

  useEffect(() => {
    if (!messId) return
    let alive = true

    setLoading(true)
    api
      .getPaymentsByMess(messId, {
        billMonth: `${month}-01`,
        limit: 500,
        sortBy: 'created_at',
        sortOrder: 'desc',
      })
      .then((res) => {
        if (!alive) return
        setItems(Array.isArray(res.data) ? (res.data as PaymentItem[]) : [])
      })
      .catch(() => {
        if (!alive) return
        setItems([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [messId, month])

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false
      const category = categoryLabel(item)
      if (!query) return true
      const text = `${item.member?.name ?? ''} ${item.method ?? ''} ${item.note ?? ''} ${category}`.toLowerCase()
      return text.includes(query)
    })
  }, [items, search, statusFilter])

  const totalAmount = visibleItems.reduce((total, item) => total + Number(item.amount ?? 0), 0)

  return (
    <MobileShell>
      <TopScreen title="All Deposits" subtitle={formatMonthLabel(month)} backHref="/payments" />
      <div className="screen space-y-4">
        <DepositAggregateSummary entries={visibleItems.length} amount={totalAmount} />

        <DepositSearchBar value={search} onChange={setSearch} />

        <DepositCompactFilters
          status={statusFilter}
          onStatusChange={setStatusFilter}
          month={month}
          onMonthChange={setMonth}
          showLabels={false}
        />

        <section className="space-y-3">
          <DepositSectionTitle title={`Deposits (${visibleItems.length})`} />
          {loading ? <LoadingIndicator variant="card" label="Loading deposits" /> : null}
          {!loading && visibleItems.length ? (
            <div className="flush-list">
              {visibleItems.map((item, index) => (
                <DepositListItem
                  key={item.id}
                  item={item}
                  index={index}
                  href={`/edit-payment?paymentId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`}
                  variant="horizontal"
                />
              ))}
            </div>
          ) : null}
          {!loading && !visibleItems.length ? <div className="rounded-[18px] bg-white p-5 text-label font-semibold text-[#65838b]">No deposits found.</div> : null}
        </section>
      </div>
    </MobileShell>
  )
}
