'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, CalendarDays, Tag } from 'lucide-react'
import {
  ExpenseListItem,
  ExpenseOverviewPanel,
  ExpenseOverviewTile,
  FilterPill,
  HeaderIconButton,
  ScreenHeader,
  SearchPanel,
  formatBDT,
  type ExpenseListRecord,
} from '@/components/mobile/expense-design'
import { MobileShell } from '@/components/mobile-shell'
import { api } from '@/lib/api'
import { useAuth } from '../providers'

export default function ExpensesPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '', [user])
  const [items, setItems] = useState<ExpenseListRecord[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!messId) return

    let alive = true
    setLoading(true)
    setMessage('')
    api
      .getExpensesByMess(messId, { limit: 100, sortBy: 'expense_date', sortOrder: 'desc' })
      .then((res: any) => {
        if (!alive) return
        setItems(Array.isArray(res.data) ? res.data : [])
      })
      .catch((error) => {
        if (!alive) return
        setItems([])
        setMessage(error instanceof Error ? error.message : 'Failed to load expenses.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [messId])

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return items
    return items.filter((item) => {
      const text = `${item.itemName ?? ''} ${item.category ?? ''} ${item.paymentType ?? ''}`.toLowerCase()
      return text.includes(term)
    })
  }, [items, search])

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + Number(item.amount ?? 0), 0), [items])

  return (
    <MobileShell>
      <ScreenHeader
        title="Expenses"
        subtitle="Track and manage all expenses"
        backHref="/"
        right={
          <HeaderIconButton
            label="Notifications"
            icon={
              <>
                <Bell size={18} />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#ff3b30]" />
              </>
            }
          />
        }
      />

      <div className="screen space-y-5">
        <ExpenseOverviewPanel>
          <ExpenseOverviewTile
            href="/add-expense"
            value="Add Expense"
          />
          <ExpenseOverviewTile
            href="/add-utility"
            value="Add Utility"
            accent="blue"
          />
          <ExpenseOverviewTile
            label="Total Items"
            value={loading ? '...' : items.length}
          />
          <ExpenseOverviewTile
            label="Total Amount"
            value={loading ? '...' : formatBDT(totalAmount)}
            accent="blue"
          />
        </ExpenseOverviewPanel>

        <SearchPanel search={search} onSearch={setSearch}>
          <FilterPill icon={CalendarDays} label="This Month" active />
          <FilterPill icon={CalendarDays} label="All Days" />
          <FilterPill icon={Tag} label="All Categories" />
        </SearchPanel>

        {message ? <div className="rounded-2xl border border-[#bfe7e6] bg-[#edfafa] px-4 py-3 text-label font-semibold text-[#008d8c]">{message}</div> : null}

        <section className="flush-list">
          {loading ? <div className="rounded-[24px] bg-white/90 p-6 text-center text-label font-bold text-[#65838b]">Loading expenses...</div> : null}
          {!loading &&
            filteredItems.map((item) => (
              <ExpenseListItem
                key={item.id}
                item={item}
                href={`/expense-details?expenseId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`}
                variant="horizontal"
              />
            ))}
          {!loading && !filteredItems.length ? (
            <div className="rounded-[24px] bg-white/90 p-6 text-center text-label font-bold text-[#65838b]">No expenses found.</div>
          ) : null}
        </section>
      </div>
    </MobileShell>
  )
}
