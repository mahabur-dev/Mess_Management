'use client'

import Link from 'next/link'
import { Edit3, Plus, ReceiptText } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { IconActionLink } from '@/components/mobile/action-links'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { api } from '@/lib/api'
import { useAuth } from '../providers'

type ExpenseItem = {
  id: string
  itemName?: string | null
  category?: string
  amount?: string | number
  expense_date?: string
  expenseDate?: string
  mess?: { id: string; name: string }
}

export default function ExpensesPage() {
  const { user } = useAuth()
  const messId = useMemo(() => user?.memberships?.[0]?.mess_id ?? '', [user])
  const [items, setItems] = useState<ExpenseItem[]>([])

  useEffect(() => {
    if (!messId) return
    let alive = true
    api
      .getExpensesByMess(messId, { limit: 20, sortBy: 'expense_date', sortOrder: 'desc' })
      .then((res) => {
        if (!alive) return
        setItems(Array.isArray(res.data) ? res.data : [])
      })
      .catch(() => {
        if (!alive) return
        setItems([])
      })
    return () => {
      alive = false
    }
  }, [messId])

  return (
    <MobileShell>
      <TopScreen title="Expenses" subtitle="Recent expense entries" backHref="/" />
      <div className="screen space-y-4">
        <Link href="/add-expense" className="primary-btn flex items-center justify-center gap-2">
          <Plus size={18} /> Add Expense
        </Link>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="glass flex items-center gap-3 rounded-[24px] p-4">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#dff4f3]/12 text-[#008d8c]">
                <ReceiptText size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-extrabold text-[#123748]">{item.itemName ?? 'Expense'}</div>
                <div className="mt-1 text-xs text-[#65838b]">{item.category ?? ''}</div>
                <div className="mt-1 text-[11px] text-[#7da0a6]">{item.expenseDate ?? item.expense_date ?? ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-black text-[#008d8c]">BDT {Number(item.amount ?? 0).toLocaleString()}</div>
                <IconActionLink
                  href={`/edit-expense?expenseId=${encodeURIComponent(item.id)}&messId=${encodeURIComponent(messId)}`}
                  label="Edit expense"
                  icon={<Edit3 size={16} />}
                />
              </div>
            </div>
          ))}
          {!items.length ? <div className="rounded-[24px] bg-white/85 p-6 text-sm text-[#65838b]">No expenses loaded.</div> : null}
        </div>
      </div>
    </MobileShell>
  )
}
