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
  depositCategory,
  type DepositListRecord,
} from '@/components/mobile/deposit-design'
import { currentMonthValue, formatMonthLabel } from '@/components/mobile/meals-design'
import { api } from '@/lib/api'
import { type PaymentStatus } from '@/lib/form-options'
import { useQueryParams } from '@/lib/use-query-params'
import { useAuth } from '@/app/providers'
import { useLocale, useLocaleFormatters, useLocalizedNotice, useTranslations } from '@/lib/i18n'

type PaymentItem = DepositListRecord & {
  status: PaymentStatus
}

export default function AllDepositsPage() {
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('payments')
  const { notice, clearNotice, showError } = useLocalizedNotice('payments')
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
    clearNotice()
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
      .catch((error) => {
        if (!alive) return
        setItems([])
        showError(error, 'loadDepositsFailed')
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
      const category = depositCategory(item, locale)
      if (!query) return true
      const text = `${item.member?.name ?? ''} ${item.method ?? ''} ${item.note ?? ''} ${category}`.toLowerCase()
      return text.includes(query)
    })
  }, [items, locale, search, statusFilter])

  const totalAmount = visibleItems.reduce((total, item) => total + Number(item.amount ?? 0), 0)

  return (
    <MobileShell>
      <TopScreen title={t('allDeposits')} subtitle={formatMonthLabel(month, locale)} backHref="/payments" />
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

        <section className="app-section space-y-3">
          <DepositSectionTitle title={t('depositCount', { count: format.number(visibleItems.length) })} />
          {notice ? <div className="ui-notice ui-notice--danger">{notice.message}</div> : null}
          {loading ? <LoadingIndicator variant="card" label={t('loadingDeposits')} /> : null}
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
          {!loading && !visibleItems.length ? <div className="app-empty-state">{t('noDeposits')}</div> : null}
        </section>
      </div>
    </MobileShell>
  )
}
