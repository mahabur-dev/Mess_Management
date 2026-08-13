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
} from '@/components/ui/dialog' // Assuming shadcn/ui Dialog is available
import { useAuth } from '@/app/context/auth-context'
import {
  apiClient,
  type ExpenseCategory,
  type ExpensePaymentType,
  type MessMembershipWithDetails,
  type Mess,
} from '@/lib/api-client'
import {
  CalendarDays,
  ClipboardList,
  Edit3,
  Eye,
  MessageSquareWarning,
  Plus,
  Search,
  Upload,
  X,
  ShoppingBag,
  TrendingUp,
  Filter,
  Loader2,
  ReceiptText,
  Users,
  Banknote,
  Trash2,
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useEffect, useMemo, useState } from 'react'
import { useAutoDismissMessage } from '@/hooks/use-auto-dismiss-message'

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
const dashboardActionButtonClass =
  'gap-1 rounded-xl bg-gradient-to-r from-[var(--brand-dark)] to-[var(--brand)] font-black text-white shadow-[0_6px_15px_var(--brand-shadow)] transition hover:from-[var(--brand-darker)] hover:to-[var(--brand-dark)] hover:shadow-[0_8px_20px_var(--brand-shadow)]'

const expenseCategories: ExpenseCategory[] = ['FOOD', 'GROCERY']

const utilityCategories: ExpenseCategory[] = [
  'GAS',
  'ELECTRICITY',
  'RENT',
  'WIFI',
  'CLEANER',
  'MAINTENANCE',
  'BUABILL',
  'WATER',
  'OTHER',
]

type ExpenseItem = {
  id: string
  category: ExpenseCategory
  amount: string | number
  payment_type?: string
  description?: string | null
  receipt_url?: string | null
  buyer_id?: string | null
  purchased_by?: string | null
  item_name?: string | null
  quantity?: string | number | null
  unit?: string | null
  items?: Array<{
    id?: string
    itemName: string
    quantity?: string | number | null
    unit?: string | null
    amount: string | number
  }>
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
  purchaser?: {
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

type ExpenseFormMode = 'expense' | 'utility'

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
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
    case 'GAS':
      return 'bg-orange-50 text-orange-700 border-orange-200/50'
    case 'ELECTRICITY':
      return 'bg-amber-50 text-amber-700 border-amber-200/50'
    case 'WIFI':
      return 'bg-blue-50 text-blue-700 border-blue-200/50'
    case 'CLEANER':
      return 'bg-purple-50 text-purple-700 border-purple-200/50'
    case 'MAINTENANCE':
      return 'bg-pink-50 text-pink-700 border-pink-200/50'
    case 'RENT':
      return 'bg-red-50 text-red-700 border-red-200/50'
    case 'UTILITY':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200/50'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200/50'
  }
}

function isUtilityCategory(category: ExpenseCategory) {
  return utilityCategories.includes(category) && !expenseCategories.includes(category)
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default function FinancePage() {
  const { user } = useAuth()
  const [messes, setMesses] = useState<Mess[]>([])
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [messMembers, setMessMembers] = useState<MessMembershipWithDetails[]>([])

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [expenseFormMode, setExpenseFormMode] = useState<ExpenseFormMode>('expense')

  // ── Multi-item form state ──────────────────────────────
  const [sharedDate, setSharedDate] = useState(new Date().toISOString().slice(0, 10))
  const [expensePurchasedBy, setExpensePurchasedBy] = useState('')
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
  const [expensePaymentType, setExpensePaymentType] = useState<ExpensePaymentType>('FROM_DEPOSIT')
  // ──────────────────────────────────────────────────────

  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ExpenseCategory>('ALL')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [selectedDay, setSelectedDay] = useState<string>('')
  const [searchText, setSearchText] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [loading, setLoading] = useState(false)

  useAutoDismissMessage(message, messageType, setMessage, setMessageType)
  
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null)
  const [viewExpense, setViewExpense] = useState<ExpenseItem | null>(null)
  const [reviewExpense, setReviewExpense] = useState<ExpenseItem | null>(null)
  const [reviewMessage, setReviewMessage] = useState('')
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
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
  const purchasedByOptions = useMemo(
    () =>
      messMembers
        .filter((membership) => membership.is_active && membership.user)
        .map((membership) => membership.user!),
    [messMembers],
  )
  const resolveMemberNameById = useMemo(() => {
    const memberMap = new Map<string, string>()
    messMembers.forEach((membership) => {
      const name = membership.user?.name?.trim()
      if (membership.user_id && name) {
        memberMap.set(membership.user_id, name)
      }
    })

    return (userId?: string | null, fallback = 'Unknown') => {
      if (!userId) return fallback
      return memberMap.get(userId) ?? fallback
    }
  }, [messMembers])
  const purchasedByMemberOptions = purchasedByOptions.length > 0 ? purchasedByOptions : user ? [user] : []

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
        const active = list[0]
        const expenseRange = getMonthRange(selectedMonth)
        const expenseRes = await apiClient
          .getExpensesByMess(active.id, {
            ...expenseRange,
            limit: 1000,
            sortBy: 'expense_date',
            sortOrder: 'desc',
          })
          .catch(() => null)

        setExpenses(normalizeExpenses(expenseRes?.data as ExpenseListResponse | undefined))
        setExpensePurchasedBy(user?.id ?? '')

        const managerMembersRes = canManageMess
          ? await apiClient.getAllMembers({ limit: 1000 }).catch(() => null)
          : null
        const fetchedMembers = Array.isArray(managerMembersRes?.data)
          ? managerMembersRes.data
          : []
        const activeMembersFromApi = fetchedMembers.filter((member) => member.mess?.id === active.id)
        const fallbackMembers = active.memberships?.filter((membership) => membership.is_active && membership.user) ?? []
        setMessMembers(activeMembersFromApi.length > 0 ? activeMembersFromApi : fallbackMembers)
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
    const template = expenseItems[0]
    setRowCounter(id)
    setExpenseItems((prev) => [
      ...prev,
      { 
        id, 
        itemName: '', 
        quantity: '', 
        amount: '', 
        category: template?.category ?? 'FOOD',
        unit: '',
        description: template?.description ?? '',
        receipt: null 
      },
    ])
  }

  function removeExpenseItem(id: number) {
    setExpenseItems((prev) => prev.filter((i) => i.id !== id))
  }

  function updateExpenseItem(id: number, field: keyof Omit<ExpenseRow, 'id' | 'receipt'>, value: string) {
    setExpenseItems((prev) =>
      prev.map((i) =>
        field === 'category' || field === 'description'
          ? { ...i, [field]: value }
          : i.id === id
            ? { ...i, [field]: value }
            : i,
      ),
    )
  }

  function updateReceipt(id: number, file: File | null) {
    setExpenseItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, receipt: file } : i)),
    )
  }

  function resetForm() {
    setExpenseFormMode('expense')
    setExpensePurchasedBy(user?.id ?? '')
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
    setExpensePaymentType('FROM_DEPOSIT')
  }

  function openExpenseModal() {
    resetForm()
    setExpenseFormMode('expense')
    setIsAddModalOpen(true)
  }

  function openUtilityModal() {
    resetForm()
    setExpenseFormMode('utility')
    setExpensePurchasedBy(user?.id ?? '')
    setExpenseItems([{
      id: 1,
      itemName: '',
      quantity: '',
      amount: '',
      category: 'GAS',
      unit: '',
      description: '',
      receipt: null,
    }])
    setIsAddModalOpen(true)
  }

  function buildExpensePayload(items: ExpenseRow[], includeMessId = true) {
    const isUtilityMode = expenseFormMode === 'utility'
    const firstItem = items[0]
    const payload: Record<string, unknown> = {
      ...(includeMessId ? { messId: activeMess?.id } : {}),
      purchasedBy: expensePurchasedBy || user?.id,
      category: firstItem.category,
      items: items.map((item) => ({
        itemName: isUtilityMode ? item.itemName || item.category : item.itemName,
        amount: Number(item.amount),
        quantity: item.quantity ? Number(item.quantity) : undefined,
        unit: item.unit || undefined,
      })),
      description: firstItem.description || undefined,
      expenseDate: sharedDate,
      paymentType: expensePaymentType,
    }

    const receipt = items.find((item) => item.receipt)?.receipt
    if (!receipt) return payload

    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(
          key,
          Array.isArray(value) || typeof value === 'object'
            ? JSON.stringify(value)
            : String(value),
        )
      }
    })
    formData.append('receipt', receipt)

    return formData
  }

  async function submitAllExpenses() {
    if (!activeMess) return
    const invalid = expenseItems.filter(
      (i) =>
        (expenseFormMode !== 'utility' && !i.itemName.trim()) ||
        !i.amount ||
        Number(i.amount) <= 0,
    )
    if (invalid.length) {
      setMessageType('error')
      setMessage('Please provide a name and valid line amount for every item.')
      return
    }
    if (expenseItems.filter((item) => item.receipt).length > 1) {
      setMessageType('error')
      setMessage('Attach one receipt for the complete purchase transaction.')
      return
    }

    setLoading(true)
    setMessage('')
    try {
      const wasEditing = Boolean(editingExpense)
      const wasUtility = expenseFormMode === 'utility' && !wasEditing
      const submittedCount = expenseItems.length
      if (editingExpense) {
        await apiClient.updateExpense(
          editingExpense.id,
          buildExpensePayload(expenseItems, false),
        )
      } else {
        await apiClient.createExpense(buildExpensePayload(expenseItems))
      }
      resetForm()
      setIsAddModalOpen(false)
      setMessageType('success')
      setMessage(
        wasEditing
          ? 'Expense updated successfully.'
          : wasUtility
            ? 'Utility added successfully.'
          : `${submittedCount} item(s) saved in one expense transaction.`,
      )
      await load()
    } catch (error) {
      setMessageType('error')
      setMessage(getErrorMessage(error, 'Failed to save expense.'))
    } finally {
      setLoading(false)
    }
  }

  function openEditExpenseModal(expense: ExpenseItem) {
    const nextFormMode = isUtilityCategory(expense.category) ? 'utility' : 'expense'
    setExpenseFormMode(nextFormMode)
    setEditingExpense(expense)
    setSharedDate(new Date(expense.expense_date).toISOString().slice(0, 10))
    setExpensePurchasedBy(expense.purchased_by ?? expense.creator?.id ?? user?.id ?? '')
    const existingItems = expense.items?.length
      ? expense.items
      : [{
          itemName: expense.item_name ?? '',
          quantity: expense.quantity,
          amount: expense.amount,
          unit: expense.unit,
        }]
    setExpenseItems(existingItems.map((item, index) => ({
      id: index + 1,
      itemName: item.itemName,
      quantity: item.quantity == null ? '' : String(item.quantity),
      amount: String(item.amount ?? ''),
      category: expense.category,
      unit: item.unit ?? '',
      description: expense.description ?? '',
      receipt: null,
    })))
    setRowCounter(existingItems.length)
    setIsAddModalOpen(true)
  }

  function openReviewModal(expense: ExpenseItem) {
    setReviewExpense(expense)
    setReviewMessage('')
    setIsReviewModalOpen(true)
  }

  function openViewModal(expense: ExpenseItem) {
    setViewExpense(expense)
    setIsViewModalOpen(true)
  }

  async function handleDeleteExpense(id: string) {
    if (!confirm('Are you sure you want to delete this expense?')) return
    setMessage('')
    try {
      await apiClient.deleteExpense(id)
      setMessageType('success')
      setMessage('Expense deleted successfully.')
      await load()
    } catch (error) {
      setMessageType('error')
      setMessage(getErrorMessage(error, 'Failed to delete expense.'))
    }
  }

  async function submitPriceReviewRequest() {
    if (!reviewExpense || !reviewMessage.trim()) {
      setMessageType('error')
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
      setMessageType('success')
      setMessage('Price review request sent successfully.')
    } catch (error) {
      setMessageType('error')
      setMessage(getErrorMessage(error, 'Failed to send price review request.'))
    } finally {
      setLoading(false)
    }
  }
  // ─── Payment Type indicator for display ───────────────
  function getPaymentTypeStyle(paymentType?: string) {
    if (paymentType === 'PERSONAL') {
      return {
        badge: 'bg-purple-50 text-purple-700 border-purple-200/50',
        label: 'Personal',
        icon: '👤',
      }
    }
    return {
      badge: 'bg-blue-50 text-blue-700 border-blue-200/50',
      label: 'From Deposit',
      icon: '🏦',
    }
  }
  // ──────────────────────────────────────────────────────

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const expenseMonth = new Date(item.expense_date).toISOString().slice(0, 7)
      const matchMonth = expenseMonth === selectedMonth
      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory
      const expenseDay = new Date(item.expense_date).getDate().toString().padStart(2, '0')
      const matchDay = selectedDay === 'ALL' || !selectedDay || expenseDay === selectedDay
      const searchableText =
        `${item.item_name ?? ''} 
        ${item.description ?? ''} 
        ${item.category}
        ${item.creator?.name ?? ''}
        ${item.purchaser?.name ?? resolveMemberNameById(item.purchased_by, '')}`
        .toLowerCase()

      const matchSearch = searchableText.includes(searchText.toLowerCase())
      return matchMonth && matchCategory && matchDay && matchSearch
    })
  }, [expenses, selectedCategory, selectedMonth, selectedDay, searchText])

  // function canEditExpense(item: ExpenseItem) {
  //   return Boolean(user?.id && item.creator?.id === user.id)
  // }
  function canEditExpense(item: ExpenseItem) {
    if (!user?.id) return false

    // Manager/Admin/Organizer can edit everyone
    if (canManageMess) return true

    // Member can edit only own expense
    return (item.purchased_by ?? item.creator?.id) === user.id
  }

  function canRequestExpenseReview(item: ExpenseItem) {
    return Boolean(
      canManageMess &&
        (item.purchased_by ?? item.creator?.id) &&
        user?.id &&
        (item.purchased_by ?? item.creator?.id) !== user.id,
    )
  }

  // Summary calculations
  const summary = useMemo(() => {
    return {
      total: filteredExpenses.reduce((s, item) => s + Number(item.amount || 0), 0),
      count: filteredExpenses.length,
      categories: new Set(filteredExpenses.map(e => e.category)).size,
    }
  }, [filteredExpenses])

  return (
    <div className="min-h-screen bg-[#fafcff]">
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
          <div
            className={`mb-5 rounded-xl px-4 py-3 text-sm font-bold shadow-sm ${
              messageType === 'error'
                ? 'border border-red-200/70 bg-red-50 text-red-700'
                : 'border border-emerald-200/60 bg-emerald-50 text-emerald-700'
            }`}
          >
            {message}
          </div>
        )}

        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-50 to-red-100 shadow-sm">
              <ShoppingBag size={24} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#172554]">All Bazar & Expenses</h2>
              <p className="mt-0.5 text-xs font-semibold text-[#6b7a99]">
                Showing {filteredExpenses.length} expenses for selected month
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards - Desktop/Tablet */}
        {filteredExpenses.length > 0 && (
          <div className="hidden md:grid mb-6 grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#6b7a99]">
                <ReceiptText size={13} className="text-[#2f80ed]" />
                Total Items
              </p>
              <p className="mt-1.5 text-2xl font-black text-[#172554]">{summary.count}</p>
            </div>
            <div className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#6b7a99]">
                <Filter size={13} className="text-[#8b5cf6]" />
                Categories
              </p>
              <p className="mt-1.5 text-2xl font-black text-[#172554]">{summary.categories}</p>
            </div>
            <div className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm sm:col-span-2">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#6b7a99]">
                <TrendingUp size={13} className="text-red-500" />
                Total Amount
              </p>
              <p className="mt-1.5 text-2xl font-black text-red-500">{money(summary.total)}</p>
            </div>
          </div>
        )}

        {/* Desktop/Tablet - Filters & Table inside same container */}
        <div className="hidden md:block rounded-xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
          {/* Filters & Buttons header - matches table width */}
          <div className="flex flex-col gap-2 p-4 border-b border-[#e6ebf4] bg-[#f8faff]">
            {/* Row 1: Search + Month + Add buttons */}
            <div className="flex flex-row flex-wrap items-center gap-2">
              <div className="relative w-44">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c70a8]" />
                <input
                  className="h-[38px] w-full rounded-xl border border-[#d8e6f8] bg-white pl-9 pr-3 text-xs font-semibold text-[#172554] shadow-sm outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                  placeholder="Search item..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              <label className="flex h-[38px] items-center gap-1.5 rounded-xl border border-[#d8e6f8] bg-white px-3 shadow-sm transition hover:border-[#a9ccfb]">
                <CalendarDays size={15} className="text-[#2f80ed]" />
                <input
                  className="bg-transparent text-xs font-bold text-[#172554] outline-none w-[110px]"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </label>

              {canAddExpense && (
                <>
                  <Button
                    type="button"
                    onClick={openUtilityModal}
                    className={`h-[38px] px-3.5 text-[11px] ${dashboardActionButtonClass}`}
                  >
                    <Plus size={15} />
                    Add Utility
                  </Button>
                  <Button
                    type="button"
                    onClick={openExpenseModal}
                    className={`h-[38px] px-3.5 text-[11px] ${dashboardActionButtonClass}`}
                  >
                    <Plus size={15} />
                    Add Expenses
                  </Button>
                </>
              )}
            </div>

            {/* Row 2: Day + Category filters */}
            <div className="flex flex-row flex-wrap items-center gap-2">
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger className="h-[38px] w-[120px] rounded-xl border border-[#d8e6f8] bg-white px-3 text-xs font-bold text-[#172554] shadow-none outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10">
                  <SelectValue placeholder="All Days" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-[#d8e6f8] bg-white shadow-[0_20px_45px_rgba(65,103,153,0.18)]">
                  <SelectItem value="ALL" className="text-xs font-bold text-[#172554] hover:bg-[#e7f1ff] focus:bg-[#e7f1ff]">All Days</SelectItem>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={String(day).padStart(2, '0')} className="text-xs font-bold text-[#172554] hover:bg-[#e7f1ff] focus:bg-[#42474e]">
                      Day {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val as 'ALL' | ExpenseCategory)}>
                <SelectTrigger className="h-[38px] w-[160px] rounded-xl border border-[#d8e6f8] bg-white px-3 text-xs font-bold text-[#172554] shadow-none outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-[#d8e6f8] bg-white shadow-[0_20px_45px_rgba(65,103,153,0.18)]">
                  <SelectItem value="ALL" className="text-xs font-bold text-[#172554] hover:bg-[#e7f1ff] focus:bg-[#e7f1ff]">All Categories</SelectItem>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item} className="text-xs font-bold text-[#172554] hover:bg-[#e7f1ff] focus:bg-[#42474e]">
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Scrollable table section */}
          <div className="overflow-x-auto monthly-bills-table-scroll pb-2">
            <div className="min-w-[900px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e6ebf4] bg-[#f8faff]">
                    <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Item</th>
                    <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Category</th>
                    <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Quantity</th>
                    <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Date</th>
                    <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Purchased By</th>
                    <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Added By</th>
                    <th className="whitespace-nowrap px-5 py-4 text-right text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Amount</th>
                    <th className="whitespace-nowrap px-5 py-4 text-right text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6ebf4]">
                  {loading && (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#6b7a99]">
                          <Loader2 size={18} className="animate-spin text-[#2f80ed]" />
                          Loading expenses...
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <ShoppingBag size={40} className="text-[#d8e6f8]" />
                          <p className="text-sm font-bold text-[#6b7a99]">No expenses found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    filteredExpenses.map((item) => (
                      <tr key={item.id} className="transition hover:bg-[#f8faff] group">
                        <td className="px-5 py-4">
                          <p className="font-bold text-[#172554]">
                            {item.item_name || 'Unnamed Expense'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${getCategoryStyle(item.category)}`}
                          >
                            {item.category}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-[#6b7a99]">
                          {item.quantity ? `${item.quantity} ${item.unit ?? ''}` : '-'}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#6b7a99]">
                            <CalendarDays size={14} className="text-[#ffb84d]" />
                            {formatDate(item.expense_date)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand)]/80 to-[var(--brand-bright)]/80 text-[10px] font-black text-white shadow-sm">
                              {(item.purchaser?.name?.[0] || item.creator?.name?.[0] || '?').toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-[#6b7a99]">
                              {item.purchaser?.name ?? resolveMemberNameById(item.purchased_by, item.creator?.name ?? 'Unknown')}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand)]/80 to-[var(--brand-bright)]/80 text-[10px] font-black text-white shadow-sm">
                              {(item.creator?.name?.[0] || '?').toUpperCase()}
                            </div>
                            <span className="text-sm font-semibold text-[#6b7a99]">
                              {item.creator?.name ?? 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right text-sm font-black text-red-500">
                          {money(item.amount)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openViewModal(item)}
                              className="h-8 rounded-lg border-[#2f80ed]/30 bg-[#e7f1ff] text-[11px] font-bold text-[#2f80ed] hover:border-[#2f80ed]/50 hover:bg-[#276bc4]"
                            >
                              <Eye size={13} className="mr-1" />
                              View
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={!canEditExpense(item)}
                              title={
                                canEditExpense(item)
                                  ? 'Edit your expense'
                                  : 'Only the user who purchased this expense can edit it'
                              }
                              onClick={() => {
                                if (canEditExpense(item)) openEditExpenseModal(item)
                              }}
                              className={`h-8 rounded-lg text-[11px] font-bold ${
                                canEditExpense(item)
                                  ? 'border-[#2f80ed]/30 bg-[#e7f1ff] text-[#2f80ed] hover:border-[#2f80ed]/50 hover:bg-[#276bc4]'
                                  : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-700 opacity-70'
                              }`}
                            >
                              <Edit3 size={13} className="mr-1" />
                              Edit
                            </Button>
                            {canManageMess && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleDeleteExpense(item.id)}
                                className="h-8 rounded-lg border-red-500/20 bg-red-50 text-[11px] font-bold text-red-600 hover:border-red-500/40 hover:bg-red-100"
                                title="Delete Expense"
                              >
                                <Trash2 size={13} />
                              </Button>
                            )}
                            {canRequestExpenseReview(item) && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => openReviewModal(item)}
                                className="h-8 rounded-lg bg-amber-50 text-[11px] font-bold text-amber-700 border border-amber-200/50 hover:bg-amber-100"
                              >
                                <MessageSquareWarning size={13} className="mr-1" />
                                Review
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {/* Footer Summary */}
              {!loading && filteredExpenses.length > 0 && (
                <div className="border-t-2 border-[#d8e6f8] bg-[#f8faff] px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#6b7a99]">
                      <Users size={14} />
                      <span><span className="text-[#172554]">{filteredExpenses.length}</span> items</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Banknote size={14} className="text-red-500" />
                      <span className="text-red-500">Total: {money(summary.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile cards - visible on mobile only */}
        <div className="space-y-4 md:hidden">
          {/* Summary Cards - Mobile */}
          {filteredExpenses.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#e6ebf4] bg-white p-3 shadow-sm">
                <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wide text-[#6b7a99]">
                  <ReceiptText size={11} className="text-[#2f80ed]" />
                  Total Items
                </p>
                <p className="mt-1 text-xl font-black text-[#172554]">{summary.count}</p>
              </div>
              <div className="rounded-xl border border-[#e6ebf4] bg-white p-3 shadow-sm">
                <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wide text-[#6b7a99]">
                  <Filter size={11} className="text-[#8b5cf6]" />
                  Categories
                </p>
                <p className="mt-1 text-xl font-black text-[#172554]">{summary.categories}</p>
              </div>
              <div className="col-span-2 rounded-xl border border-[#e6ebf4] bg-white p-3 shadow-sm">
                <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wide text-[#6b7a99]">
                  <TrendingUp size={11} className="text-red-500" />
                  Total Amount
                </p>
                <p className="mt-1 text-xl font-black text-red-500">{money(summary.total)}</p>
              </div>
            </div>
          )}

          {/* Mobile Search & Month Picker - Single Row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c70a8]" />
              <input
                className="h-[42px] w-full rounded-xl border border-[#d8e6f8] bg-white pl-9 pr-3 text-xs font-semibold text-[#172554] shadow-sm outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                placeholder="Search item..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <label className="flex h-[42px] w-[130px] shrink-0 items-center gap-1.5 rounded-xl border border-[#d8e6f8] bg-white px-3 shadow-sm transition hover:border-[#a9ccfb]">
              <CalendarDays size={15} className="text-[#2f80ed]" />
              <input
                className="bg-transparent text-xs font-bold text-[#172554] outline-none w-full"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </label>
          </div>

          {/* Mobile Filters Row */}
          <div className="flex flex-row flex-wrap items-center gap-2">
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger className="h-[42px] w-[120px] rounded-xl border border-[#d8e6f8] bg-white px-3 text-xs font-bold text-[#172554] shadow-none outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10">
                <SelectValue placeholder="All Days" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-[#d8e6f8] bg-white shadow-[0_20px_45px_rgba(65,103,153,0.18)]">
                <SelectItem value="ALL" className="text-xs font-bold text-[#172554] hover:bg-[#e7f1ff] focus:bg-[#e7f1ff]">All Days</SelectItem>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={String(day).padStart(2, '0')} className="text-xs font-bold text-[#172554] hover:bg-[#e7f1ff] focus:bg-[#42474e]">
                    Day {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val as 'ALL' | ExpenseCategory)}>
              <SelectTrigger className="h-[42px] flex-1 min-w-[140px] rounded-xl border border-[#d8e6f8] bg-white px-3 text-xs font-bold text-[#172554] shadow-none outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-[#d8e6f8] bg-white shadow-[0_20px_45px_rgba(65,103,153,0.18)]">
                <SelectItem value="ALL" className="text-xs font-bold text-[#172554] hover:bg-[#e7f1ff] focus:bg-[#e7f1ff]">All Categories</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item} value={item} className="text-xs font-bold text-[#172554] hover:bg-[#e7f1ff] focus:bg-[#42474e]">
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Add Buttons */}
          {canAddExpense && (
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={openUtilityModal}
                className={`flex-1 h-[42px] px-3 text-[11px] ${dashboardActionButtonClass}`}
              >
                <Plus size={15} />
                Add Utility
              </Button>
              <Button
                type="button"
                onClick={openExpenseModal}
                className={`flex-1 h-[42px] px-3 text-[11px] ${dashboardActionButtonClass}`}
              >
                <Plus size={15} />
                Add Expenses
              </Button>
            </div>
          )}

          {/* Mobile Expense Cards */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#2f80ed]" />
            </div>
          )}
          {!loading && filteredExpenses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingBag size={40} className="mb-2 text-[#d8e6f8]" />
              <p className="text-sm font-bold text-[#6b7a99]">No expenses found.</p>
            </div>
          )}
          {!loading &&
            filteredExpenses.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm transition hover:border-[#a9ccfb] hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-[#172554]">
                      {item.item_name || 'Unnamed Expense'}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#6b7a99]">
                      <CalendarDays size={13} className="text-[#ffb84d]" />
                      {formatDate(item.expense_date)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getCategoryStyle(item.category)}`}
                  >
                    {item.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#f8faff] p-3">
                  <div>
                    <p className="text-[10px] font-black uppercase text-[#6b7a99]">
                      Quantity
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#172554]">
                      {item.quantity ? `${item.quantity} ${item.unit ?? ''}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-[#6b7a99]">
                      Amount
                    </p>
                    <p className="mt-1 text-sm font-black text-red-500">
                      {money(item.amount)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-[#6b7a99]">
                  <span>Purchased by</span>
                  <span className="text-[#172554]">
                    {item.purchaser?.name ?? resolveMemberNameById(item.purchased_by, item.creator?.name ?? 'Unknown')}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-[#6b7a99]">
                  <span>Added by</span>
                  <span className="text-[#172554]">
                    {item.creator?.name ?? 'Unknown'}
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openViewModal(item)}
                    className="flex-1 h-9 rounded-xl border-[#2f80ed]/30 bg-[#e7f1ff] text-xs font-bold text-[#2f80ed]"
                  >
                    <Eye size={13} className="mr-1" />
                    View
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!canEditExpense(item)}
                    title={
                      canEditExpense(item)
                        ? 'Edit your expense'
                        : 'Only the user who purchased this expense can edit it'
                    }
                    onClick={() => {
                      if (canEditExpense(item)) openEditExpenseModal(item)
                    }}
                    className={`flex-1 h-9 rounded-xl text-xs font-bold ${
                      canEditExpense(item)
                        ? 'border-[#2f80ed]/30 bg-[#e7f1ff] text-[#2f80ed]'
                        : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 opacity-70'
                    }`}
                  >
                    <Edit3 size={13} className="mr-1" />
                    Edit
                  </Button>
                  {canManageMess && (
                    <Button
                      type="button"
                      onClick={() => handleDeleteExpense(item.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-50 text-red-600"
                      title="Delete Expense"
                    >
                      <Trash2 size={13} />
                    </Button>
                  )}
                  {canRequestExpenseReview(item) && (
                    <Button
                      type="button"
                      onClick={() => openReviewModal(item)}
                      className="flex-1 h-9 rounded-xl bg-amber-50 text-xs font-bold text-amber-700 border border-amber-200/50 hover:bg-amber-100"
                    >
                      <MessageSquareWarning size={13} className="mr-1" />
                      Review
                    </Button>
                  )}
                </div>
              </div>
            ))}
          {/* Footer Summary - Mobile */}
          {!loading && filteredExpenses.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-[#e6ebf4] bg-[#f8faff] px-4 py-3">
              <p className="text-xs font-bold text-[#6b7a99]"><span className="text-[#172554]">{filteredExpenses.length}</span> items</p>
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <Banknote size={14} className="text-red-500" />
                <span className="text-red-500">Total: {money(summary.total)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs - Modals for Add, Edit, View, Review */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing
                ? expenseFormMode === 'utility'
                  ? 'Edit Utility'
                  : 'Edit Bazar / Expense'
                : expenseFormMode === 'utility'
                  ? 'Add Utility'
                  : 'Add Bazar / Expenses'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? expenseFormMode === 'utility'
                  ? 'Update utility cost, description, or receipt.'
                  : 'Update your own expense. Upload a new receipt only if you want to replace the old one.'
                : expenseFormMode === 'utility'
                  ? 'Add utility cost with category, price, and description.'
                  : 'Add one or multiple items. You can attach receipt images.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Payment Type Toggle */}
            <div className="rounded-2xl border border-slate-200 bg-[#faf9ff] p-5">
              <label className="mb-3 block text-sm font-black text-[#0a1433]">Payment Type</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setExpensePaymentType('FROM_DEPOSIT')}
                  className={`flex-1 h-12 rounded-xl border-2 text-sm font-black transition ${
                    expensePaymentType === 'FROM_DEPOSIT'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300'
                  }`}
                >
                  🏦 From Deposit
                </button>
                <button
                  type="button"
                  onClick={() => setExpensePaymentType('PERSONAL')}
                  className={`flex-1 h-12 rounded-xl border-2 text-sm font-black transition ${
                    expensePaymentType === 'PERSONAL'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-purple-300'
                  }`}
                >
                  👤 Personal
                </button>
              </div>
              <p className="mt-2 text-[10px] font-semibold text-[#6b7a99]">
                {expensePaymentType === 'FROM_DEPOSIT'
                  ? 'Amount will be split among all members in monthly bill calculation.'
                  : 'Amount will be added as your personal deposit contribution. Not split with others.'}
              </p>
            </div>

            {expenseFormMode === 'utility' && (
              <div className="rounded-2xl border border-slate-200 bg-[#faf9ff] p-5">
              <div className="grid gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-black text-[#0a1433]">Category</label>
                    <select
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0a1433]"
                      value={expenseItems[0].category}
                      onChange={(e) =>
                        updateExpenseItem(1, 'category', e.target.value as ExpenseCategory)
                      }
                    >
                      {utilityCategories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {canManageMess && purchasedByMemberOptions.length > 0 && (
                    <div>
                      <label className="mb-1.5 block text-sm font-black text-[#0a1433]">
                        Purchased By
                      </label>
                      <select
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0a1433]"
                        value={expensePurchasedBy}
                        onChange={(e) => setExpensePurchasedBy(e.target.value)}
                      >
                        {purchasedByMemberOptions.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-sm font-black text-[#0a1433]">Price (৳)</label>
                    <input
                      type="number"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0a1433]"
                      placeholder="Amount"
                      value={expenseItems[0].amount}
                      onChange={(e) => updateExpenseItem(1, 'amount', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-black text-[#0a1433]">
                      Description
                    </label>
                    <textarea
                      className="min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0a1433]"
                      placeholder="Add utility note..."
                      value={expenseItems[0].description}
                      onChange={(e) => updateExpenseItem(1, 'description', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-black text-[#0a1433]">
                      Receipt Image/PDF (Optional)
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold hover:border-violet-400">
                        <Upload size={18} />
                        Upload Receipt
                        <input
                          type="file"
                          accept="image/*,application/pdf,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null
                            updateReceipt(1, file)
                          }}
                        />
                      </label>
                      {expenseItems[0].receipt && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <span className="truncate">{expenseItems[0].receipt.name}</span>
                          <button
                            type="button"
                            onClick={() => updateReceipt(1, null)}
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
            )}

            {expenseFormMode !== 'utility' && (
              <>
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

            {canManageMess && purchasedByMemberOptions.length > 0 && (
              <div className="rounded-2xl bg-[#faf9ff] p-4">
                <label className="mb-2 block text-sm font-black text-[#0a1433]">
                  Purchased By
                </label>
                <select
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#0a1433] outline-none transition focus:border-[#6f3df4] focus:ring-4 focus:ring-violet-100"
                  value={expensePurchasedBy}
                  onChange={(e) => setExpensePurchasedBy(e.target.value)}
                >
                  {purchasedByMemberOptions.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

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

                  {expenseItems.length > 1 && (
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
                        {(isEditing ? categories : expenseCategories).map((c) => (
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

            <Button
              variant="outline"
              onClick={addExpenseItem}
              className="w-full h-11 border-dashed"
            >
              <Plus size={16} className="mr-2" />
              Add another item
            </Button>
              </>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                onClick={submitAllExpenses}
                disabled={loading}
                className={`flex-1 h-12 ${dashboardActionButtonClass}`}
              >
                {loading
                  ? 'Saving...'
                  : isEditing
                    ? expenseFormMode === 'utility'
                      ? 'Update Utility'
                      : 'Update Expense'
                    : expenseFormMode === 'utility'
                      ? 'Submit Utility'
                    : `Submit ${expenseItems.length} Item(s)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              Send a push notification to the member who purchased this expense.
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
              className={`h-12 w-full ${dashboardActionButtonClass}`}
            >
              Send Review Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isViewModalOpen}
        onOpenChange={(open) => {
          setIsViewModalOpen(open)
          if (!open) setViewExpense(null)
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogDescription>
              View expense or utility description and receipt information.
            </DialogDescription>
          </DialogHeader>

          {viewExpense && (
            <div className="space-y-4 py-4">
              <div className="rounded-2xl bg-[#faf9ff] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wide text-[#6b7a99]">
                      {viewExpense.category}
                    </p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-black text-[#172554]">
                        {viewExpense.item_name || viewExpense.category || 'Unnamed Expense'}
                      </h3>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getPaymentTypeStyle(viewExpense.payment_type).badge}`}>
                        {getPaymentTypeStyle(viewExpense.payment_type).icon} {getPaymentTypeStyle(viewExpense.payment_type).label}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#6b7a99]">
                      <CalendarDays size={13} className="text-[#ffb84d]" />
                      {formatDate(viewExpense.expense_date)}
                    </p>
                  </div>
                  <p className="text-xl font-black text-red-500">
                    {money(viewExpense.amount)}
                  </p>
                </div>
              </div>

              {viewExpense.items?.length ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-black uppercase text-[#6b7a99]">Purchased Items</p>
                    <span className="text-xs font-bold text-[#6b7a99]">{viewExpense.items.length} {viewExpense.items.length === 1 ? 'item' : 'items'}</span>
                  </div>
                  {viewExpense.items.map((item, index) => (
                    <div key={item.id ?? `${item.itemName}-${index}`} className="flex items-center justify-between gap-4 border-t border-slate-100 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#172554]">{item.itemName}</p>
                        {item.quantity != null ? <p className="mt-0.5 text-xs font-semibold text-[#6b7a99]">{item.quantity} {item.unit ?? ''}</p> : null}
                      </div>
                      <span className="shrink-0 text-sm font-black text-[#008d8c]">{money(item.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-black uppercase text-[#6b7a99]">Purchased By</p>
                  <p className="mt-1 text-sm font-bold text-[#172554]">
                    {viewExpense.purchaser?.name ?? resolveMemberNameById(viewExpense.purchased_by, viewExpense.creator?.name ?? 'Unknown')}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-[10px] font-black uppercase text-[#6b7a99]">Added By</p>
                  <p className="mt-1 text-sm font-bold text-[#172554]">
                    {viewExpense.creator?.name ?? 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-black uppercase text-[#6b7a99]">Description</p>
                <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-[#172554]">
                  {viewExpense.description || 'No description added.'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[10px] font-black uppercase text-[#6b7a99]">Receipt</p>
                {viewExpense.receipt_url ? (
                  <div className="mt-3 space-y-3">
                    {/\.(png|jpe?g|webp|gif)(\?|$)/i.test(viewExpense.receipt_url) && (
                      <img
                        src={viewExpense.receipt_url}
                        alt={`${viewExpense.item_name || viewExpense.category} receipt`}
                        className="max-h-80 w-full rounded-xl border border-slate-200 object-contain"
                      />
                    )}
                    <a
                      href={viewExpense.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-[#2f80ed]/30 bg-[#e7f1ff] px-4 text-sm font-bold text-[#2f80ed]"
                    >
                      View Receipt
                    </a>
                  </div>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-[#6b7a99]">
                    No receipt uploaded.
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
