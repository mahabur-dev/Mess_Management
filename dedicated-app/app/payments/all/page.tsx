'use client'

import { useEffect, useMemo, useState } from 'react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import {
  DepositAggregateSummary,
  DepositCompactFilters,
  DepositListItem,
  DepositSearchBar,
  DepositSectionTitle,
  type DepositListRecord,
} from '@/components/mobile/deposit-design'
import { api } from '@/lib/api'
import { type PaymentStatus } from '@/lib/form-options'
import { useAuth } from '@/app/providers'

type PaymentItem = DepositListRecord & {
  status: PaymentStatus
}

function currentMonthValue() {
  return new Date().toISOString().slice(0, 7)
}

function monthBounds(month: string) {
  const safeMonth = /^\d{4}-\d{2}$/.test(month) ? month : currentMonthValue()
  const [year, monthIndex] = safeMonth.split('-').map(Number)
  const start = new Date(year, monthIndex - 1, 1)
  const end = new Date(year, monthIndex, 0)

  return {
    label: new Date(`${safeMonth}-01T00:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

function categoryLabel(item: PaymentItem) {
  return item.categories?.[0]?.replaceAll('_', ' ') || item.note || 'Meal Advance'
}

export default function AllDepositsPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const [items, setItems] = useState<PaymentItem[]>([])
  const [month, setMonth] = useState(currentMonthValue())
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const range = useMemo(() => monthBounds(month), [month])

  useEffect(() => {
    if (!messId) return
    let alive = true

    setLoading(true)
    api
      .getPaymentsByMess(messId, {
        limit: 500,
        sortBy: 'created_at',
        sortOrder: 'desc',
        startDate: range.startDate,
        endDate: range.endDate,
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
  }, [messId, range.endDate, range.startDate])

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
      <TopScreen title="All Deposits" subtitle={range.label} backHref="/payments" />
      <div className="screen space-y-4">
        <DepositSearchBar value={search} onChange={setSearch} />

        <DepositCompactFilters status={statusFilter} onStatusChange={setStatusFilter} month={month} onMonthChange={setMonth} />

        <DepositAggregateSummary entries={visibleItems.length} amount={totalAmount} />

        <section className="space-y-3">
          <DepositSectionTitle title={`Deposits (${visibleItems.length})`} />
          {loading ? <div className="rounded-[18px] bg-white p-5 text-label font-semibold text-[#65838b]">Loading deposits...</div> : null}
          {!loading && visibleItems.map((item, index) => (
            <DepositListItem
              key={item.id}
              item={item}
              index={index}
              href={`/edit-payment?paymentId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`}
            />
          ))}
          {!loading && !visibleItems.length ? <div className="rounded-[18px] bg-white p-5 text-label font-semibold text-[#65838b]">No deposits found.</div> : null}
        </section>

        <div className="flex items-center gap-3 rounded-[18px] border border-[#cfeeed] bg-[#f3ffff] px-4 py-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#008d8c] text-title-sm font-bold text-white">i</div>
          <div className="min-w-0">
            <div className="text-label font-bold text-[#123748]">Showing deposits for {range.label}.</div>
            <div className="mt-1 text-label text-[#65838b]">Use search and filters to find specific deposits.</div>
          </div>
        </div>
      </div>
    </MobileShell>
  )
}
