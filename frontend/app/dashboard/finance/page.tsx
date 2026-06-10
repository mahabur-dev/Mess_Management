'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/app/context/auth-context'
import {
  apiClient,
  type ExpenseCategory,
  type Mess,
  type MonthlyBill,
} from '@/lib/api-client'
import {
  BadgeDollarSign,
  CalendarDays,
  ClipboardList,
  Plus,
  ReceiptText,
  RefreshCcw,
  Search,
  ShoppingCart,
  WalletCards,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const categories: ExpenseCategory[] = [
  'GROCERY',
  'FOOD',
  'UTILITY',
  'RENT',
  'GAS',
  'ELECTRICITY',
  'WIFI',
  'CLEANER',
  'MAINTENANCE',
  'OTHER',
]

type ExpenseItem = {
  id: string
  category: ExpenseCategory
  amount: string | number
  description?: string | null
  receipt_url?: string | null
  buyer_id?: string | null
  item_name?: string | null
  quantity?: string | number | null
  unit?: string | null
  expense_date: string
  created_at: string
  mess?: {
    id: string
    name: string
  }
  creator?: {
    id: string
    name: string
    email: string
  }
}

type ExpenseRow = {
  id: number
  itemName: string
  quantity: string
  amount: string
  category: ExpenseCategory
  unit: string
}

function money(value: number | string | undefined | null) {
  return `৳ ${Number(value ?? 0).toLocaleString()}`
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getCategoryStyle(category: string) {
  switch (category) {
    case 'FOOD':
    case 'GROCERY':
      return 'bg-green-50 text-green-700 border-green-100'
    case 'GAS':
      return 'bg-orange-50 text-orange-700 border-orange-100'
    case 'ELECTRICITY':
      return 'bg-yellow-50 text-yellow-700 border-yellow-100'
    case 'WIFI':
      return 'bg-blue-50 text-blue-700 border-blue-100'
    case 'CLEANER':
      return 'bg-purple-50 text-purple-700 border-purple-100'
    case 'MAINTENANCE':
      return 'bg-pink-50 text-pink-700 border-pink-100'
    case 'RENT':
      return 'bg-red-50 text-red-700 border-red-100'
    case 'UTILITY':
      return 'bg-cyan-50 text-cyan-700 border-cyan-100'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-100'
  }
}

export default function FinancePage() {
  const { user } = useAuth()

  const [messes, setMesses] = useState<Mess[]>([])
  const [bills, setBills] = useState<MonthlyBill[]>([])
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])

  // ── Multi-item form state ──────────────────────────────
  const [sharedDate, setSharedDate] = useState(new Date().toISOString().slice(0, 10))
  const [expenseItems, setExpenseItems] = useState<ExpenseRow[]>([
    { id: 1, itemName: '', quantity: '', amount: '', category: 'FOOD', unit: '' },
  ])
  const [rowCounter, setRowCounter] = useState(1)
  // ──────────────────────────────────────────────────────

  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ExpenseCategory>('ALL')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [searchText, setSearchText] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess

  const isManager =
    user?.role === 'ADMIN' ||
    user?.role === 'MANAGER' ||
    user?.role === 'ORGANIZER'

  async function load() {
    if (!user) return
    setLoading(true)
    try {
      const messRes = await apiClient.getMesses().catch(() => null)
      const list = Array.isArray(messRes?.data)
        ? messRes.data
        : messRes?.data
          ? [messRes.data]
          : ((user?.memberships?.map((item) => item.mess).filter(Boolean) ?? []) as Mess[])

      setMesses(list)

      if (list[0]) {
        const [billRes, expenseRes] = await Promise.all([
          isManager
            ? apiClient.getBillsByMess(list[0].id).catch(() => null)
            : apiClient.getMyBills().catch(() => null),
          apiClient.getExpensesByMess(list[0].id).catch(() => null),
        ])

        setBills(Array.isArray(billRes?.data) ? billRes.data : [])
        setExpenses(Array.isArray(expenseRes?.data) ? expenseRes.data : [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user?.role])

  // ── Multi-item helpers ─────────────────────────────────
  function addExpenseItem() {
    const id = rowCounter + 1
    setRowCounter(id)
    setExpenseItems((prev) => [
      ...prev,
      { id, itemName: '', quantity: '', amount: '', category: 'FOOD', unit: '' },
    ])
  }

  function removeExpenseItem(id: number) {
    setExpenseItems((prev) => prev.filter((i) => i.id !== id))
  }

  function updateExpenseItem(id: number, field: keyof ExpenseRow, value: string) {
    setExpenseItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    )
  }

  function resetForm() {
    setExpenseItems([{ id: 1, itemName: '', quantity: '', amount: '', category: 'FOOD', unit: '' }])
    setRowCounter(1)
  }

  async function submitAllExpenses() {
    if (!activeMess) return
    const invalid = expenseItems.filter((i) => !i.amount)
    if (invalid.length) {
      setMessage('Please fill in the price for all items.')
      return
    }

    setLoading(true)
    setMessage('')
    try {
      await Promise.all(
        expenseItems.map((item) =>
          apiClient.createExpense({
            messId: activeMess.id,
            category: item.category,
            amount: Number(item.amount),
            itemName: item.itemName,
            quantity: item.quantity ? Number(item.quantity) : undefined,
            expenseDate: sharedDate,
          }),
        ),
      )
      resetForm()
      setMessage(`${expenseItems.length} expense(s) added successfully.`)
      await load()
    } finally {
      setLoading(false)
    }
  }
  // ──────────────────────────────────────────────────────

  async function generateBill() {
    if (!activeMess) return
    setLoading(true)
    setMessage('')
    try {
      await apiClient.generateMonthlyBill({
        messId: activeMess.id,
        month: `${selectedMonth}-01`,
      })
      setMessage('Monthly bills generated successfully.')
      await load()
    } finally {
      setLoading(false)
    }
  }

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const expenseMonth = new Date(item.expense_date).toISOString().slice(0, 7)
      const matchMonth = expenseMonth === selectedMonth
      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory
      const searchableText =
        `${item.item_name ?? ''} ${item.description ?? ''} ${item.category}`.toLowerCase()
      const matchSearch = searchableText.includes(searchText.toLowerCase())
      return matchMonth && matchCategory && matchSearch
    })
  }, [expenses, selectedCategory, selectedMonth, searchText])

  const totalDue = bills.reduce((sum, bill) => sum + Number(bill.final_due ?? 0), 0)
  const paid = bills.reduce((sum, bill) => sum + Number(bill.paid_amount ?? 0), 0)

  const totalExpense = filteredExpenses.reduce(
    (sum, item) => sum + Number(item.amount ?? 0),
    0,
  )
  const foodExpense = filteredExpenses
    .filter((item) => item.category === 'FOOD' || item.category === 'GROCERY')
    .reduce((sum, item) => sum + Number(item.amount ?? 0), 0)
  const extraExpense = filteredExpenses
    .filter((item) => item.category !== 'FOOD' && item.category !== 'GROCERY')
    .reduce((sum, item) => sum + Number(item.amount ?? 0), 0)

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title={isManager ? 'Bazar / Expenses' : 'Expenses'}
        description={
          activeMess
            ? `${activeMess.name} expense overview`
            : 'Track bazar, food cost and monthly expenses'
        }
      />

      <div className="p-4 sm:p-6 lg:p-8">
        {message && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
            {message}
          </div>
        )}

        {/* ── Summary Cards ── */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card className="dashboard-solid-card solid-blue">
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div>
                <p className="solid-label">Final Due</p>
                <p className="solid-value mt-2">{money(totalDue)}</p>
              </div>
              <span className="solid-icon"><WalletCards size={21} /></span>
            </div>
          </Card>

          <Card className="dashboard-solid-card solid-green">
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div>
                <p className="solid-label">Paid</p>
                <p className="solid-value mt-2">{money(paid)}</p>
              </div>
              <span className="solid-icon"><ReceiptText size={21} /></span>
            </div>
          </Card>

          <Card className="dashboard-solid-card solid-orange">
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div>
                <p className="solid-label">Food Bazar</p>
                <p className="solid-value mt-2">{money(foodExpense)}</p>
              </div>
              <span className="solid-icon"><ShoppingCart size={21} /></span>
            </div>
          </Card>

          <Card className="dashboard-solid-card solid-red">
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div>
                <p className="solid-label">Extra</p>
                <p className="solid-value mt-2">{money(extraExpense)}</p>
              </div>
              <span className="solid-icon"><BadgeDollarSign size={21} /></span>
            </div>
          </Card>

          <Card className="dashboard-solid-card solid-cyan">
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div>
                <p className="solid-label">Total Expense</p>
                <p className="solid-value mt-2">{money(totalExpense)}</p>
              </div>
              <span className="solid-icon"><ClipboardList size={21} /></span>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* ── Add Expense Form (Manager only) ── */}
          {isManager && (
            <div className="flex justify-center">
              <Card className="w-full max-w-[560px] overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-[0_18px_50px_rgba(45,27,105,0.10)]">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#eef2ff] via-[#f6f2ff] to-[#eef4ff] px-6 py-6 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-[#4f6df5] to-[#7c3aed] text-white shadow-lg">
                    <Plus size={24} />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-[#0a1433]">
                    Add Bazar / Expense
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    Add one or multiple items per submission.
                  </p>
                </div>

                <div className="p-5 sm:p-6">
                  {/* Shared date — once for all items */}
                  <div className="mb-5 rounded-2xl bg-[#faf9ff] p-4">
                    <label className="mb-2 block text-sm font-black text-[#0a1433]">
                      Expense Date
                    </label>
                    <input
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0a1433] outline-none transition focus:border-[#6f3df4] focus:ring-4 focus:ring-violet-100"
                      type="date"
                      value={sharedDate}
                      onChange={(e) => setSharedDate(e.target.value)}
                    />
                  </div>

                  {/* Dynamic item rows */}
                  <div className="space-y-3">
                    {expenseItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="relative rounded-2xl border border-slate-200 bg-[#faf9ff] p-4"
                      >
                        <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-400">
                          Item {idx + 1}
                        </p>

                        {/* Remove button — only when more than 1 row */}
                        {expenseItems.length > 1 && (
                          <button
                            onClick={() => removeExpenseItem(item.id)}
                            className="absolute right-3 top-3 text-slate-400 transition hover:text-red-500"
                            title="Remove item"
                          >
                            ✕
                          </button>
                        )}

                        {/* Item name */}
                        <div className="mb-3">
                          <label className="mb-1.5 block text-sm font-black text-[#0a1433]">
                            Item Name
                          </label>
                          <input
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0a1433] outline-none transition placeholder:text-slate-400 focus:border-[#6f3df4] focus:ring-4 focus:ring-violet-100"
                            placeholder="e.g. Rice, Eggs, Gas bill..."
                            value={item.itemName}
                            onChange={(e) =>
                              updateExpenseItem(item.id, 'itemName', e.target.value)
                            }
                          />
                        </div>

                        {/* Qty / Unit / Price */}
                        <div className="mb-3 grid grid-cols-3 gap-2">
                          <div>
                            <label className="mb-1.5 block text-sm font-black text-[#0a1433]">
                              Quantity
                            </label>
                            <input
                              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0a1433] outline-none transition placeholder:text-slate-400 focus:border-[#6f3df4] focus:ring-4 focus:ring-violet-100"
                              type="number"
                              placeholder="Qty"
                              min="0"
                              value={item.quantity}
                              onChange={(e) =>
                                updateExpenseItem(item.id, 'quantity', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-sm font-black text-[#0a1433]">
                              Unit
                            </label>
                            <input
                              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0a1433] outline-none transition placeholder:text-slate-400 focus:border-[#6f3df4] focus:ring-4 focus:ring-violet-100"
                              placeholder="kg, pcs..."
                              value={item.unit}
                              onChange={(e) =>
                                updateExpenseItem(item.id, 'unit', e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-sm font-black text-[#0a1433]">
                              Price (৳)
                            </label>
                            <input
                              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0a1433] outline-none transition placeholder:text-slate-400 focus:border-[#6f3df4] focus:ring-4 focus:ring-violet-100"
                              type="number"
                              placeholder="Amount"
                              min="0"
                              value={item.amount}
                              onChange={(e) =>
                                updateExpenseItem(item.id, 'amount', e.target.value)
                              }
                            />
                          </div>
                        </div>

                        {/* Category */}
                        <div>
                          <label className="mb-1.5 block text-sm font-black text-[#0a1433]">
                            Category
                          </label>
                          <select
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0a1433] outline-none transition focus:border-[#6f3df4] focus:ring-4 focus:ring-violet-100"
                            value={item.category}
                            onChange={(e) =>
                              updateExpenseItem(
                                item.id,
                                'category',
                                e.target.value as ExpenseCategory,
                              )
                            }
                          >
                            {categories.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add more item button */}
                  <Button
                    variant="outline"
                    onClick={addExpenseItem}
                    className="mt-3 h-11 w-full rounded-xl border border-dashed border-slate-300 text-sm font-black text-slate-600 transition hover:border-[#6f3df4] hover:text-[#fff]"
                  >
                    <Plus size={16} className="mr-2" />
                    Add more item
                  </Button>

                  {/* Submit & Generate buttons */}
                  <div className="mt-5 grid gap-3">
                    <Button
                      onClick={submitAllExpenses}
                      disabled={!activeMess || loading}
                      className="h-12 rounded-xl bg-gradient-to-r from-[#3b5bdb] via-[#5b4ef5] to-[#7c3aed] text-sm font-black text-white shadow-[0_10px_30px_rgba(91,78,245,0.30)] transition hover:scale-[1.01] hover:opacity-95"
                    >
                      <Plus size={17} className="mr-2" />
                      {loading
                        ? 'Saving...'
                        : `Submit ${expenseItems.length} item${expenseItems.length > 1 ? 's' : ''}`}
                    </Button>

                    <Button
                      onClick={generateBill}
                      disabled={!activeMess || loading}
                      variant="outline"
                      className="h-12 rounded-xl border border-slate-200 bg-white text-sm font-black text-[#0a1433] shadow-sm transition"
                    >
                      <RefreshCcw size={16} className="mr-2" />
                      Generate Monthly Bill
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ── Expenses Table ── */}
          <Card className="app-card overflow-hidden">
            <div className="border-b border-border p-4 sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-black text-[#0a1433]">
                    All Bazar & Expenses
                  </h2>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Showing {filteredExpenses.length} expenses for selected month.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:w-[560px]">
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      className="soft-input w-full pl-9"
                      placeholder="Search item..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                  </div>

                  <input
                    className="soft-input w-full"
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  />

                  <select
                    className="soft-input w-full"
                    value={selectedCategory}
                    onChange={(e) =>
                      setSelectedCategory(e.target.value as 'ALL' | ExpenseCategory)
                    }
                  >
                    <option value="ALL">ALL</option>
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-[#f8f7ff] text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-black">Item</th>
                    <th className="px-5 py-4 font-black">Category</th>
                    <th className="px-5 py-4 font-black">Quantity</th>
                    <th className="px-5 py-4 font-black">Date</th>
                    <th className="px-5 py-4 font-black">Added By</th>
                    <th className="px-5 py-4 text-right font-black">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-8 text-center text-sm font-semibold text-muted-foreground"
                      >
                        Loading expenses...
                      </td>
                    </tr>
                  )}
                  {!loading && filteredExpenses.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-8 text-center text-sm font-semibold text-muted-foreground"
                      >
                        No expenses found.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    filteredExpenses.map((item) => (
                      <tr key={item.id} className="transition hover:bg-[#faf9ff]">
                        <td className="px-5 py-4">
                          <p className="font-black text-[#0a1433]">
                            {item.item_name || 'Unnamed Expense'}
                          </p>
                          <p className="text-xs font-semibold text-muted-foreground">
                            {item.description || 'No description'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${getCategoryStyle(item.category)}`}
                          >
                            {item.category}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold">
                          {item.quantity ? `${item.quantity} ${item.unit ?? ''}` : '-'}
                        </td>
                        <td className="px-5 py-4 text-sm font-bold">
                          <span className="inline-flex items-center gap-2">
                            <CalendarDays size={15} className="text-[#6f3df4]" />
                            {formatDate(item.expense_date)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold">
                          {item.creator?.name ?? 'Unknown'}
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-black text-[#ef4444]">
                          {money(item.amount)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 p-4 md:hidden">
              {loading && (
                <p className="py-6 text-center text-sm font-semibold text-muted-foreground">
                  Loading expenses...
                </p>
              )}
              {!loading && filteredExpenses.length === 0 && (
                <p className="py-6 text-center text-sm font-semibold text-muted-foreground">
                  No expenses found.
                </p>
              )}
              {!loading &&
                filteredExpenses.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-violet-100 bg-white p-4 shadow-[0_8px_25px_rgba(36,21,120,0.06)]"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-base font-black text-[#0a1433]">
                          {item.item_name || 'Unnamed Expense'}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                          <CalendarDays size={13} />
                          {formatDate(item.expense_date)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${getCategoryStyle(item.category)}`}
                      >
                        {item.category}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#f8f7ff] p-3">
                      <div>
                        <p className="text-[11px] font-black uppercase text-slate-500">
                          Quantity
                        </p>
                        <p className="mt-1 text-sm font-black text-[#0a1433]">
                          {item.quantity ? `${item.quantity} ${item.unit ?? ''}` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase text-slate-500">
                          Amount
                        </p>
                        <p className="mt-1 text-sm font-black text-[#ef4444]">
                          {money(item.amount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs font-bold text-muted-foreground">
                      <span>Added by</span>
                      <span className="text-[#0a1433]">
                        {item.creator?.name ?? 'Unknown'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
