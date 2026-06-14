'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog' // Assuming shadcn/ui Dialog is available
import { useAuth } from '@/app/context/auth-context'
import {
  apiClient,
  type ExpenseCategory,
  type Mess,
} from '@/lib/api-client'
import {
  CalendarDays,
  Edit3,
  MessageSquareWarning,
  Plus,
  Search,
  Upload,
  X,
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
  description: string
  receipt?: File | null // New: image file per item
}

type ExpenseListResponse =
  | ExpenseItem[]
  | {
      data?: ExpenseItem[]
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

function getMonthRange(monthValue: string) {
  const [year, month] = monthValue.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()

  return {
    startDate: `${monthValue}-01`,
    endDate: `${monthValue}-${String(lastDay).padStart(2, '0')}`,
  }
}

function normalizeExpenses(payload: ExpenseListResponse | undefined) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
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
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // ── Multi-item form state ──────────────────────────────
  const [sharedDate, setSharedDate] = useState(new Date().toISOString().slice(0, 10))
  const [expenseItems, setExpenseItems] = useState<ExpenseRow[]>([
    { 
      id: 1, 
      itemName: '', 
      quantity: '', 
      amount: '', 
      category: 'FOOD', 
      unit: '',
      description: '',
      receipt: null 
    },
  ])
  const [rowCounter, setRowCounter] = useState(1)
  // ──────────────────────────────────────────────────────

  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ExpenseCategory>('ALL')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [searchText, setSearchText] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null)
  const [reviewExpense, setReviewExpense] = useState<ExpenseItem | null>(null)
  const [reviewMessage, setReviewMessage] = useState('')
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)

  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess

  const activeMembership = user?.memberships?.find(
    (membership) =>
      membership.mess_id === activeMess?.id || membership.mess?.id === activeMess?.id,
  )

  const canManageMess =
    user?.role === 'ADMIN' ||
    user?.role === 'MANAGER' ||
    user?.role === 'ORGANIZER'||
    activeMembership?.role === 'MANAGER'

  const canAddExpense = Boolean(user && activeMess)
  const isMemberDashboard = !canManageMess
  const isEditing = Boolean(editingExpense)

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
        const expenseRange = getMonthRange(selectedMonth)
        const expenseRes = await apiClient
          .getExpensesByMess(list[0].id, {
            ...expenseRange,
            limit: 1000,
            sortBy: 'expense_date',
            sortOrder: 'desc',
          })
          .catch(() => null)

        setExpenses(normalizeExpenses(expenseRes?.data as ExpenseListResponse | undefined))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user, selectedMonth])

  // ── Multi-item helpers ─────────────────────────────────
  function addExpenseItem() {
    const id = rowCounter + 1
    setRowCounter(id)
    setExpenseItems((prev) => [
      ...prev,
      { 
        id, 
        itemName: '', 
        quantity: '', 
        amount: '', 
        category: 'FOOD', 
        unit: '',
        description: '',
        receipt: null 
      },
    ])
  }

  function removeExpenseItem(id: number) {
    setExpenseItems((prev) => prev.filter((i) => i.id !== id))
  }

  function updateExpenseItem(id: number, field: keyof Omit<ExpenseRow, 'id' | 'receipt'>, value: string) {
    setExpenseItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    )
  }

  function updateReceipt(id: number, file: File | null) {
    setExpenseItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, receipt: file } : i)),
    )
  }

  function resetForm() {
    setExpenseItems([{
      id: 1,
      itemName: '',
      quantity: '',
      amount: '',
      category: 'FOOD',
      unit: '',
      description: '',
      receipt: null
    }])
    setRowCounter(1)
    setSharedDate(new Date().toISOString().slice(0, 10))
    setEditingExpense(null)
  }

  function buildExpensePayload(item: ExpenseRow, includeMessId = true) {
    const payload = {
      ...(includeMessId ? { messId: activeMess?.id } : {}),
      category: item.category,
      amount: Number(item.amount),
      itemName: item.itemName,
      quantity: item.quantity ? Number(item.quantity) : undefined,
      unit: item.unit || undefined,
      description: item.description || undefined,
      expenseDate: sharedDate,
    }

    if (!item.receipt) return payload

    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value))
      }
    })
    formData.append('receipt', item.receipt)

    return formData
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
      const wasEditing = Boolean(editingExpense)
      const submittedCount = expenseItems.length
      if (editingExpense) {
        const item = expenseItems[0]
        await apiClient.updateExpense(
          editingExpense.id,
          buildExpensePayload(item, false),
        )
      } else {
        await Promise.all(
          expenseItems.map((item) =>
            apiClient.createExpense(buildExpensePayload(item)),
          ),
        )
      }
      resetForm()
      setIsAddModalOpen(false)
      setMessage(
        wasEditing
          ? 'Expense updated successfully.'
          : `${submittedCount} expense(s) added successfully.`,
      )
      await load()
    } finally {
      setLoading(false)
    }
  }

  function openEditExpenseModal(expense: ExpenseItem) {
    setEditingExpense(expense)
    setSharedDate(new Date(expense.expense_date).toISOString().slice(0, 10))
    setExpenseItems([
      {
        id: 1,
        itemName: expense.item_name ?? '',
        quantity: expense.quantity ? String(expense.quantity) : '',
        amount: expense.amount ? String(expense.amount) : '',
        category: expense.category,
        unit: expense.unit ?? '',
        description: expense.description ?? '',
        receipt: null,
      },
    ])
    setRowCounter(1)
    setIsAddModalOpen(true)
  }

  function openReviewModal(expense: ExpenseItem) {
    setReviewExpense(expense)
    setReviewMessage('')
    setIsReviewModalOpen(true)
  }

  async function submitPriceReviewRequest() {
    if (!reviewExpense || !reviewMessage.trim()) {
      setMessage('Please write a message for the price review request.')
      return
    }

    setLoading(true)
    setMessage('')
    try {
      await apiClient.requestExpensePriceReview(reviewExpense.id, reviewMessage.trim())
      setIsReviewModalOpen(false)
      setReviewExpense(null)
      setReviewMessage('')
      setMessage('Price review request sent successfully.')
    } finally {
      setLoading(false)
    }
  }
  // ──────────────────────────────────────────────────────

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

  function canEditExpense(item: ExpenseItem) {
    return Boolean(user?.id && item.creator?.id === user.id)
  }

  function canRequestExpenseReview(item: ExpenseItem) {
    return Boolean(
      canManageMess &&
        item.creator?.id &&
        user?.id &&
        item.creator.id !== user.id,
    )
  }

  function shouldShowEditButton(item: ExpenseItem) {
    return isMemberDashboard || canEditExpense(item)
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title={canManageMess ? 'Bazar / Expenses' : 'Expenses'}
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

        {/* ── Expenses Table Section ── */}
        <Card className="app-card overflow-hidden">
          <div className="border-b border-border p-4 sm:p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                <h2 className="text-lg font-black text-[#0a1433]">
                  All Bazar & Expenses
                </h2>
                <p className="text-sm font-semibold text-muted-foreground">
                  Showing {filteredExpenses.length} expenses for selected month.
                </p>
                </div>

                {canAddExpense &&(
                  <Dialog
                    open={isAddModalOpen}
                    onOpenChange={(open) => {
                      setIsAddModalOpen(open)
                      if (!open) resetForm()
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        className="h-11 rounded-xl bg-gradient-to-r from-[#3b5bdb] via-[#5b4ef5] to-[#7c3aed] text-sm font-black text-white"
                      >
                        <Plus size={17} className="mr-2" />
                        Add Expenses
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {isEditing ? 'Edit Bazar / Expense' : 'Add Bazar / Expenses'}
                        </DialogTitle>
                        <DialogDescription>
                          {isEditing
                            ? 'Update your own expense. Upload a new receipt only if you want to replace the old one.'
                            : 'Add one or multiple items. You can attach receipt images.'}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6 py-4">
                        {/* Shared date */}
                        <div className="rounded-2xl bg-[#faf9ff] p-4">
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
                        <div className="space-y-4">
                          {expenseItems.map((item, idx) => (
                            <div
                              key={item.id}
                              className="relative rounded-2xl border border-slate-200 bg-[#faf9ff] p-5"
                            >
                              <p className="mb-4 text-xs font-black uppercase tracking-wide text-slate-400">
                                Item {idx + 1}
                              </p>

                              {!isEditing && expenseItems.length > 1 && (
                                <button
                                  onClick={() => removeExpenseItem(item.id)}
                                  className="absolute right-4 top-4 text-slate-400 hover:text-red-500"
                                >
                                  <X size={18} />
                                </button>
                              )}

                              <div className="grid gap-4">
                                {/* Item Name */}
                                <div>
                                  <label className="mb-1.5 block text-sm font-black text-[#0a1433]">
                                    Item Name
                                  </label>
                                  <input
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0a1433]"
                                    placeholder="e.g. Rice, Eggs..."
                                    value={item.itemName}
                                    onChange={(e) => updateExpenseItem(item.id, 'itemName', e.target.value)}
                                  />
                                </div>

                                {/* Qty / Unit / Price */}
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="mb-1.5 block text-sm font-black">Quantity</label>
                                    <input
                                      type="number"
                                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                                      placeholder="Qty"
                                      value={item.quantity}
                                      onChange={(e) => updateExpenseItem(item.id, 'quantity', e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1.5 block text-sm font-black">Unit</label>
                                    <input
                                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                                      placeholder="kg, pcs"
                                      value={item.unit}
                                      onChange={(e) => updateExpenseItem(item.id, 'unit', e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1.5 block text-sm font-black">Price (৳)</label>
                                    <input
                                      type="number"
                                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                                      placeholder="Amount"
                                      value={item.amount}
                                      onChange={(e) => updateExpenseItem(item.id, 'amount', e.target.value)}
                                    />
                                  </div>
                                </div>

                                {/* Category */}
                                <div>
                                  <label className="mb-1.5 block text-sm font-black">Category</label>
                                  <select
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
                                    value={item.category}
                                    onChange={(e) =>
                                      updateExpenseItem(item.id, 'category', e.target.value as ExpenseCategory)
                                    }
                                  >
                                    {categories.map((c) => (
                                      <option key={c} value={c}>{c}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-sm font-black text-[#0a1433]">
                                    Description
                                  </label>
                                  <textarea
                                    className="min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0a1433]"
                                    placeholder="Add useful note or market detail..."
                                    value={item.description}
                                    onChange={(e) => updateExpenseItem(item.id, 'description', e.target.value)}
                                  />
                                </div>

                                {/* Receipt Image Upload */}
                                <div>
                                  <label className="mb-1.5 block text-sm font-black text-[#0a1433]">
                                    Receipt Image/PDF (Optional)
                                  </label>
                                  <div className="flex items-center gap-3">
                                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold hover:border-violet-400">
                                      <Upload size={18} />
                                      Upload Receipt
                                      <input
                                        type="file"
                                        accept="image/*,application/pdf,.pdf"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0] || null
                                          updateReceipt(item.id, file)
                                        }}
                                      />
                                    </label>
                                    {item.receipt && (
                                      <div className="flex items-center gap-2 text-sm text-green-600">
                                        <span>{item.receipt.name}</span>
                                        <button
                                          onClick={() => updateReceipt(item.id, null)}
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {!isEditing && (
                          <Button
                            variant="outline"
                            onClick={addExpenseItem}
                            className="w-full h-11 border-dashed"
                          >
                            <Plus size={16} className="mr-2" />
                            Add another item
                          </Button>
                        )}

                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={submitAllExpenses}
                            disabled={loading}
                            className="flex-1 h-12 bg-gradient-to-r from-[#3b5bdb] to-[#7c3aed]"
                          >
                            {loading
                              ? 'Saving...'
                              : isEditing
                                ? 'Update Expense'
                                : `Submit ${expenseItems.length} Item(s)`}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                <Dialog
                  open={isReviewModalOpen}
                  onOpenChange={(open) => {
                    setIsReviewModalOpen(open)
                    if (!open) {
                      setReviewExpense(null)
                      setReviewMessage('')
                    }
                  }}
                >
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Request Price Review</DialogTitle>
                      <DialogDescription>
                        Send a push notification to the user who added this expense.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div className="rounded-2xl bg-[#faf9ff] p-4 text-sm font-bold text-[#0a1433]">
                        {reviewExpense?.item_name || reviewExpense?.category || 'Expense'} -{' '}
                        {money(reviewExpense?.amount)}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-black text-[#0a1433]">
                          Message
                        </label>
                        <textarea
                          className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0a1433] outline-none transition focus:border-[#6f3df4] focus:ring-4 focus:ring-violet-100"
                          placeholder="Explain what price or item data should be reviewed..."
                          value={reviewMessage}
                          onChange={(event) => setReviewMessage(event.target.value)}
                        />
                      </div>

                      <Button
                        onClick={submitPriceReviewRequest}
                        disabled={loading || !reviewMessage.trim()}
                        className="h-12 w-full rounded-xl bg-gradient-to-r from-[#3b5bdb] to-[#7c3aed] font-black text-white"
                      >
                        Send Review Request
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:w-[560px] lg:self-end">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
                     <th className="px-5 py-4 text-right font-black">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border">
                   {loading && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-8 text-center text-sm font-semibold text-muted-foreground"
                      >
                        Loading expenses...
                      </td>
                    </tr>
                  )}
                  {!loading && filteredExpenses.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
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
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {shouldShowEditButton(item) && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!canEditExpense(item)}
                                title={
                                  canEditExpense(item)
                                    ? 'Edit your expense'
                                    : 'Only the user who added this expense can edit it'
                                }
                                onClick={() => {
                                  if (canEditExpense(item)) openEditExpenseModal(item)
                                }}
                                className={`h-9 rounded-lg text-xs font-black ${
                                  canEditExpense(item)
                                    ? 'border-[#6f3df4] text-[#4c1d95] hover:bg-[#f3efff]'
                                    : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-70'
                                }`}
                              >
                                <Edit3 size={14} className="mr-1.5" />
                                Edit
                              </Button>
                            )}
                            {canRequestExpenseReview(item) && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => openReviewModal(item)}
                                className="h-9 rounded-lg bg-[#f59e0b] text-xs font-black text-white hover:bg-[#d97706]"
                              >
                                <MessageSquareWarning size={14} className="mr-1.5" />
                                Request Price Review
                              </Button>
                            )}
                          </div>
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

                    {(shouldShowEditButton(item) || canRequestExpenseReview(item)) && (
                      <div className="mt-4 grid gap-2">
                        {shouldShowEditButton(item) && (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={!canEditExpense(item)}
                            title={
                              canEditExpense(item)
                                ? 'Edit your expense'
                                : 'Only the user who added this expense can edit it'
                            }
                            onClick={() => {
                              if (canEditExpense(item)) openEditExpenseModal(item)
                            }}
                            className={`h-10 rounded-xl text-xs font-black ${
                              canEditExpense(item)
                                ? 'border-[#6f3df4] text-[#4c1d95] hover:bg-[#f3efff]'
                                : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-70'
                            }`}
                          >
                            <Edit3 size={14} className="mr-1.5" />
                            Edit
                          </Button>
                        )}
                        {canRequestExpenseReview(item) && (
                          <Button
                            type="button"
                            onClick={() => openReviewModal(item)}
                            className="h-10 rounded-xl bg-[#f59e0b] text-xs font-black text-white hover:bg-[#d97706]"
                          >
                            <MessageSquareWarning size={14} className="mr-1.5" />
                            Request Price Review
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
  )
}
