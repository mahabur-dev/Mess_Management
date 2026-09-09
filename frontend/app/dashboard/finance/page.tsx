'use client'

import { EnterpriseAsyncState } from '@/components/ui/enterprise-async-state'
import { DashboardHeader } from '@/components/dashboard-header'
import { ExpenseApprovalControl } from '@/components/expense-approval-control'
import { Card } from '@/components/ui/card'
import { EnterpriseDetailsDrawer } from '@/components/ui/enterprise-details-drawer'
import { EnterpriseButton } from '@/components/ui/enterprise-button'
import { EnterpriseDrawerAction, EnterpriseDrawerFooter } from '@/components/ui/enterprise-drawer-footer'
import { EnterpriseIconButton } from '@/components/ui/enterprise-icon-button'
import { EnterpriseSelect } from '@/components/ui/enterprise-select'
import { EnterpriseDatePicker, EnterpriseMonthPicker } from '@/components/ui/enterprise-date-picker'
import { EnterpriseTableActionCell, EnterpriseTableActionHeader } from '@/components/ui/enterprise-table-actions'
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
  type ExpenseApprovalStatus,
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
  Clock3,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAutoDismissMessage } from '@/hooks/use-auto-dismiss-message'
import { clearAiCommandDraft, readAiCommandDraft, type AiCommandDraft } from '@/lib/ai-quick-add'
import { useRouter, useSearchParams } from 'next/navigation'
import { formatIsoDate, domainLabel, localizedErrorMessage, useLocale, useLocaleFormatters, useTranslations } from '@/lib/i18n'

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
  status?: 'DRAFT' | 'CONFIRMED' | 'CANCELLED'
  approvalStatus?: ExpenseApprovalStatus
  reviewedBy?: string | null
  reviewedAt?: string | null
  reviewNote?: string | null
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
      return 'bg-primary/10 text-primary border-primary/30'
    case 'GAS':
      return 'bg-primary/10 text-primary border-primary/30'
    case 'ELECTRICITY':
      return 'bg-primary/10 text-primary border-primary/30'
    case 'WIFI':
      return 'bg-primary/10 text-primary border-primary/30'
    case 'CLEANER':
      return 'bg-primary/10 text-primary border-primary/30'
    case 'MAINTENANCE':
      return 'bg-primary/10 text-primary border-primary/30'
    case 'RENT':
      return 'bg-primary/10 text-primary border-primary/30'
    case 'UTILITY':
      return 'bg-primary/10 text-primary border-primary/30'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

function isUtilityCategory(category: ExpenseCategory) {
  return utilityCategories.includes(category) && !expenseCategories.includes(category)
}

function getExpenseApprovalStatus(expense: ExpenseItem): ExpenseApprovalStatus {
  if (expense.approvalStatus) return expense.approvalStatus
  if (expense.status === 'DRAFT') return 'PENDING'
  if (expense.status === 'CANCELLED') return 'REJECTED'
  return 'APPROVED'
}

export default function FinancePage() {
  const t = useTranslations('operations')
  const common = useTranslations('common')
  const [loadError, setLoadError] = useState<unknown>(null)
  const { locale } = useLocale()
  const formatters = useLocaleFormatters()
  const money = (value: number | string | undefined | null) => formatters.money(value)
  const formatDate = (value: string) => formatters.date(value, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const aiCommandId = searchParams.get('aiCommand')
  const [messes, setMesses] = useState<Mess[]>([])
  const [expenses, setExpenses] = useState<ExpenseItem[]>([])
  const [messMembers, setMessMembers] = useState<MessMembershipWithDetails[]>([])

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [expenseFormMode, setExpenseFormMode] = useState<ExpenseFormMode>('expense')

  // ── Multi-item form state ──────────────────────────────
  const [sharedDate, setSharedDate] = useState(formatIsoDate())
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
  const [selectedMonth, setSelectedMonth] = useState(formatIsoDate().slice(0, 7))
  const [selectedDay, setSelectedDay] = useState<string>('ALL')
  const [searchText, setSearchText] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [loading, setLoading] = useState(false)
  const [reviewingExpenseId, setReviewingExpenseId] = useState<string | null>(null)
  const [aiDraft, setAiDraft] = useState<AiCommandDraft | null>(null)

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

    return (userId?: string | null, fallback = t('finance.unknown')) => {
      if (!userId) return fallback
      return memberMap.get(userId) ?? fallback
    }
  }, [messMembers, t])
  const purchasedByMemberOptions = purchasedByOptions.length > 0 ? purchasedByOptions : user ? [user] : []

  async function load() {
    setLoadError(null)
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
    } catch (error) {
      setLoadError(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user, selectedMonth])

  useEffect(() => {
    if (!aiCommandId || !activeMess || !user || aiDraft) return
    const draft = readAiCommandDraft(aiCommandId)
    if (!draft || !['EXPENSE_CREATE', 'UTILITY_CREATE'].includes(draft.intent) || !draft.payload) return
    const payload = draft.payload
    const isUtility = draft.intent === 'UTILITY_CREATE'
    const payloadItems = Array.isArray(payload.items) ? payload.items : []
    const fallbackCategory = String(payload.category ?? (isUtility ? 'GAS' : 'FOOD')) as ExpenseCategory
    const allowedCategories = isUtility ? utilityCategories : expenseCategories
    const rows: ExpenseRow[] = (payloadItems.length ? payloadItems : [{
      itemName: payload.itemName ?? payload.utilityType ?? '',
      amount: payload.amount ?? '',
      quantity: payload.quantity,
      unit: payload.unit,
    }]).map((raw, index) => {
      const item = raw as Record<string, unknown>
      const itemCategory = String(item.category ?? fallbackCategory) as ExpenseCategory
      return {
        id: index + 1,
        itemName: String(item.itemName ?? item.name ?? (isUtility ? payload.utilityType ?? fallbackCategory : '')),
        amount: String(item.amount ?? ''),
        quantity: item.quantity == null ? '' : String(item.quantity),
        unit: item.unit == null ? '' : String(item.unit),
        category: allowedCategories.includes(itemCategory) ? itemCategory : allowedCategories[0],
        description: String(item.description ?? payload.description ?? ''),
        receipt: null,
      }
    })
    const paidFrom = String(payload.paidFrom ?? payload.paymentType ?? 'FROM_DEPOSIT')
    setExpenseFormMode(isUtility ? 'utility' : 'expense')
    setSharedDate(String(payload.expenseDate ?? formatIsoDate()).slice(0, 10))
    setExpensePurchasedBy(String(payload.purchasedBy ?? user.id))
    setExpenseItems(rows)
    setRowCounter(rows.length)
    setExpensePaymentType(
      paidFrom === 'PERSONAL' || paidFrom === 'COLLECTED_FUND' ? paidFrom : 'FROM_DEPOSIT',
    )
    setEditingExpense(null)
    setAiDraft(draft)
    setIsAddModalOpen(true)
  }, [activeMess, aiCommandId, aiDraft, user])

  function finishAiDraft() {
    if (!aiDraft) return
    clearAiCommandDraft(aiDraft.id)
    setAiDraft(null)
    router.replace('/dashboard/finance')
  }

  function closeExpenseForm() {
    setIsAddModalOpen(false)
    resetForm()
    if (aiDraft) {
      void apiClient.cancelAiCommand(aiDraft.id).catch(() => null)
      finishAiDraft()
    }
  }

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
    setSharedDate(formatIsoDate())
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
        !Number.isFinite(Number(i.amount)) ||
        Number(i.amount) <= 0,
    )
    if (invalid.length) {
      setMessageType('error')
      setMessage(t('finance.invalidItems'))
      return
    }
    if (expenseItems.filter((item) => item.receipt).length > 1) {
      setMessageType('error')
      setMessage(t('finance.singleReceipt'))
      return
    }
    if (aiDraft && expenseItems.some((item) => item.receipt)) {
      setMessageType('error')
      setMessage(t('finance.aiReceipt'))
      return
    }

    setLoading(true)
    setMessage('')
    try {
      const wasEditing = Boolean(editingExpense)
      if (editingExpense) {
        await apiClient.updateExpense(
          editingExpense.id,
          buildExpensePayload(expenseItems, false),
        )
      } else if (aiDraft) {
        const payload = buildExpensePayload(expenseItems)
        if (payload instanceof FormData) throw new Error('Receipt upload is not available during AI confirmation.')
        const utilityTypeByCategory: Partial<Record<ExpenseCategory, string>> = {
          ELECTRICITY: 'ELECTRICITY',
          GAS: 'GAS',
          WATER: 'WATER',
          WIFI: 'WIFI',
          CLEANER: 'CLEANING',
          OTHER: 'OTHER',
        }
        await apiClient.confirmAiCommand(aiDraft.id, {
          ...payload,
          type: expenseFormMode === 'utility' ? 'UTILITY' : 'EXPENSE',
          paidFrom: expensePaymentType,
          utilityType: expenseFormMode === 'utility'
            ? aiDraft.payload?.utilityType ?? utilityTypeByCategory[expenseItems[0]?.category] ?? 'OTHER'
            : undefined,
        })
      } else {
        await apiClient.createExpense(buildExpensePayload(expenseItems))
      }
      const completedWithAi = Boolean(aiDraft)
      resetForm()
      setIsAddModalOpen(false)
      if (completedWithAi) finishAiDraft()
      setMessageType('success')
      setMessage(
        wasEditing
          ? t('finance.successUpdated')
          : completedWithAi
            ? t('feedback.aiConfirmed')
            : expenseFormMode === 'utility'
              ? t('feedback.utilityAdded')
              : t('feedback.itemsSaved', { count: formatters.number(expenseItems.length) }),
      )
      await load()
    } catch (error) {
      setMessageType('error')
      setMessage(localizedErrorMessage(error, locale, t('finance.errorSave')))
    } finally {
      setLoading(false)
    }
  }

  function openEditExpenseModal(expense: ExpenseItem) {
    const nextFormMode = isUtilityCategory(expense.category) ? 'utility' : 'expense'
    setExpensePaymentType(expense.payment_type === 'PERSONAL' || expense.payment_type === 'COLLECTED_FUND' ? expense.payment_type : 'FROM_DEPOSIT')
    setExpenseFormMode(nextFormMode)
    setEditingExpense(expense)
    setSharedDate(formatIsoDate(expense.expense_date))
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
    if (!confirm(t('feedback.deleteExpense'))) return
    setMessage('')
    try {
      await apiClient.deleteExpense(id)
      setMessageType('success')
      setMessage(t('finance.successDeleted'))
      await load()
    } catch (error) {
      setMessageType('error')
      setMessage(localizedErrorMessage(error, locale, t('finance.errorDelete')))
    }
  }

  async function submitPriceReviewRequest() {
    if (!reviewExpense || !reviewMessage.trim()) {
      setMessageType('error')
      setMessage(t('feedback.reviewRequired'))
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
      setMessage(t('finance.successReview'))
    } catch (error) {
      setMessageType('error')
      setMessage(localizedErrorMessage(error, locale, t('finance.errorReview')))
    } finally {
      setLoading(false)
    }
  }

  async function handleExpenseApprovalChange(
    expense: ExpenseItem,
    status: Exclude<ExpenseApprovalStatus, 'PENDING'>,
  ) {
    if (!canManageMess || getExpenseApprovalStatus(expense) !== 'PENDING') return
    if (
      status === 'REJECTED' &&
      !confirm(t('feedback.rejectExpense'))
    ) {
      return
    }

    setReviewingExpenseId(expense.id)
    setMessage('')
    try {
      const response = await apiClient.reviewExpense(expense.id, { status })
      const reviewedExpense = response.data
      const nextExpense: ExpenseItem = {
        ...expense,
        status: reviewedExpense.status,
        approvalStatus: reviewedExpense.approvalStatus,
      }

      setExpenses((current) =>
        current.map((item) => (item.id === expense.id ? { ...item, ...nextExpense } : item)),
      )
      setViewExpense((current) =>
        current?.id === expense.id ? { ...current, ...nextExpense } : current,
      )
      setMessageType('success')
      setMessage(
        status === 'APPROVED'
          ? t('feedback.expenseApproved')
          : t('feedback.expenseRejected'),
      )
    } catch (error) {
      setMessageType('error')
      setMessage(localizedErrorMessage(error, locale, t('finance.errorApproval')))
    } finally {
      setReviewingExpenseId(null)
    }
  }
  // ─── Payment Type indicator for display ───────────────
  function getPaymentTypeStyle(paymentType?: string) {
    if (paymentType === 'PERSONAL') {
      return {
        badge: 'bg-primary/10 text-primary border-primary/30',
        label: 'Personal',
        icon: '👤',
      }
    }
    return {
      badge: 'bg-primary/10 text-primary border-primary/30',
      label: 'From Deposit',
      icon: '🏦',
    }
  }
  // ──────────────────────────────────────────────────────

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      const expenseMonth = formatIsoDate(item.expense_date).slice(0, 7)
      const matchMonth = expenseMonth === selectedMonth
      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory
      const expenseDay = formatIsoDate(item.expense_date).slice(8, 10)
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
      pendingBazar: filteredExpenses.filter(
        (item) => expenseCategories.includes(item.category) && getExpenseApprovalStatus(item) === 'PENDING',
      ).length,
    }
  }, [filteredExpenses])

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        title={canManageMess ? t('finance.title') : t('finance.memberTitle')}
        description={
            activeMess ? t('finance.messDescription', { name: activeMess.name }) : t('finance.memberDescription')
        }
      />

      <div className="p-4 sm:p-6 lg:p-8">
        {loadError != null && <EnterpriseAsyncState status="error" description={localizedErrorMessage(loadError, locale, t('feedback.loadFailed'))} action={<EnterpriseButton onClick={() => void load()}>{common('retry')}</EnterpriseButton>} className="mb-5" />}
        {message && (
          <div
            className={`mb-5 rounded-xl px-4 py-3 text-sm font-semibold  ${
              messageType === 'error'
                ? 'border border-destructive/30 bg-destructive/10 text-destructive'
                : 'border border-primary/30 bg-primary/10 text-primary'
            }`}
          >
            {message}
          </div>
        )}

        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="dashboard-section-icon size-12 rounded-lg">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t('finance.allExpenses')}</h2>
              <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                {t('finance.showing', { count: formatters.number(filteredExpenses.length) })}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards - Desktop/Tablet */}
        {filteredExpenses.length > 0 && (
          <div className="mb-6 hidden grid-cols-2 gap-3 md:grid lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-background p-4 ">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <ReceiptText size={13} className="text-primary" />
                {t('finance.totalItems')}
              </p>
              <p className="mt-1.5 text-2xl font-semibold text-foreground">{summary.count}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4 ">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Filter size={13} className="text-primary" />
                {t('finance.categories')}
              </p>
              <p className="mt-1.5 text-2xl font-semibold text-foreground">{summary.categories}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <TrendingUp size={13} className="text-primary" />
                {t('finance.totalAmount')}
              </p>
              <p className="mt-1.5 text-2xl font-semibold text-primary">{money(summary.total)}</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Clock3 size={13} className="text-primary" />
                {t('finance.pendingBazar')}
              </p>
              <p className="mt-1.5 text-2xl font-semibold text-foreground">{summary.pendingBazar}</p>
            </div>
          </div>
        )}

        {/* Desktop/Tablet - Filters & Table inside same container */}
        <div className="dashboard-table-frame hidden md:block">
          {/* Filters & Buttons header - matches table width */}
          <div className="flex flex-col gap-2 p-4 border-b border-border bg-muted">
            {/* Row 1: Search + Month + Add buttons */}
            <div className="flex flex-row flex-wrap items-center gap-2">
              <div className="relative w-44">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-[38px] w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs font-semibold text-foreground  outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                  placeholder={t('finance.searchPlaceholder')}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              <EnterpriseMonthPicker value={selectedMonth} onValueChange={setSelectedMonth} shortLabel className="h-[38px] w-[154px] text-xs font-semibold" align="start" />

              {canAddExpense && (
                <>
                  <EnterpriseButton size="sm" onClick={openUtilityModal}>
                    <Plus size={15} />
                    {t('finance.addUtility')}
                  </EnterpriseButton>
                  <EnterpriseButton size="sm" onClick={openExpenseModal}>
                    <Plus size={15} />
                    {t('finance.addExpenses')}
                  </EnterpriseButton>
                </>
              )}
            </div>

            {/* Row 2: Day + Category filters */}
            <div className="flex flex-row flex-wrap items-center gap-2">
              <EnterpriseSelect
                className="h-[38px] w-[120px] text-xs font-semibold"
                value={selectedDay}
                onValueChange={setSelectedDay}
                options={[{ value: 'ALL', label: t('finance.allDays') }, ...Array.from({ length: 31 }, (_, index) => ({ value: String(index + 1).padStart(2, '0'), label: t('finance.day', { day: index + 1 }) }))]}
              />

              <EnterpriseSelect
                className="h-[38px] w-[160px] text-xs font-semibold"
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value as 'ALL' | ExpenseCategory)}
                options={[{ value: 'ALL', label: t('finance.allCategories') }, ...categories.map((category) => ({ value: category, label: domainLabel(category, locale) }))]}
              />
            </div>
          </div>

          <div className="overflow-hidden">
              <table className="w-full table-fixed border-separate border-spacing-0">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    {[
                      { id: 'category', label: t('finance.category') },
                      { id: 'quantity', label: t('finance.quantity') },
                      { id: 'added-by', label: t('finance.addedBy') },
                      { id: 'expense-date', label: t('finance.expenseDate') },
                      { id: 'amount', label: t('finance.amount') },
                      { id: 'approval', label: t('finance.approval') },
                      { id: 'action', label: t('monthlyBills.action') },
                    ].map(({ id, label }, index, headings) =>
                      index === headings.length - 1
                        ? <EnterpriseTableActionHeader key={id} size="compact">{label}</EnterpriseTableActionHeader>
                        : <th key={id} className={`px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground ${index === 4 ? 'text-right' : ''}`}>{label}</th>,
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center">
                        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
                          <Loader2 size={18} className="animate-spin text-primary" />
                          {t('finance.loading')}
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <ShoppingBag size={40} className="text-muted-foreground" />
                          <p className="text-sm font-semibold text-muted-foreground">{t('finance.empty')}</p>
                          <p className="text-xs font-semibold text-muted-foreground">{t('finance.emptyDescription')}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    filteredExpenses.map((item) => (
                      <tr key={item.id} className="transition hover:bg-muted group">
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getCategoryStyle(item.category)}`}
                          >
                            {domainLabel(item.category, locale)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-muted-foreground">
                          {item.quantity ? `${item.quantity} ${item.unit ?? ''}` : '-'}
                        </td>
                        <td className="px-4 py-4">
                          <p className="truncate text-sm font-semibold text-foreground">{item.creator?.name ?? t('finance.unknown')}</p>
                          <p className="truncate text-xs font-semibold text-muted-foreground">{item.creator?.email ?? ''}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                            <CalendarDays size={14} className="text-primary" />
                            {formatDate(item.expense_date)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-semibold text-foreground">
                          {money(item.amount)}
                        </td>
                        <td className="px-4 py-4">
                          <ExpenseApprovalControl
                            status={getExpenseApprovalStatus(item)}
                            canReview={canManageMess}
                            updating={reviewingExpenseId === item.id}
                            onStatusChange={(status) => void handleExpenseApprovalChange(item, status)}
                          />
                        </td>
                        <EnterpriseTableActionCell size="compact">
                            <EnterpriseIconButton label={t('finance.viewExpense')} tone="primary" onClick={() => openViewModal(item)}>
                              <Eye size={16} />
                            </EnterpriseIconButton>
                        </EnterpriseTableActionCell>
                      </tr>
                    ))}
                </tbody>
              </table>
              {/* Footer Summary */}
              {!loading && filteredExpenses.length > 0 && (
                <div className="border-t-2 border-border bg-muted px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <Users size={14} />
                      <span><span className="text-foreground">{filteredExpenses.length}</span> {t('finance.itemCounts')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <Banknote size={14} className="text-primary" />
                      <span className="text-primary">{t('finance.totalAmount')}: {money(summary.total)}</span>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Mobile cards - visible on mobile only */}
        <div className="space-y-4 md:hidden">
          {/* Summary Cards - Mobile */}
          {filteredExpenses.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-background p-3 ">
                <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <ReceiptText size={11} className="text-primary" />
                  {t('finance.totalItems')}
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">{summary.count}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3 ">
                <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Filter size={11} className="text-primary" />
                  {t('finance.categories')}
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">{summary.categories}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <TrendingUp size={11} className="text-primary" />
                  {t('finance.totalAmount')}
                </p>
                <p className="mt-1 text-xl font-semibold text-primary">{money(summary.total)}</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Clock3 size={11} className="text-primary" />
                  {t('finance.pendingBazar')}
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">{summary.pendingBazar}</p>
              </div>
            </div>
          )}

          {/* Mobile Search & Month Picker - Single Row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-[42px] w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs font-semibold text-foreground  outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                placeholder={t('finance.searchPlaceholder')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <EnterpriseMonthPicker value={selectedMonth} onValueChange={setSelectedMonth} shortLabel className="h-[42px] w-[142px] shrink-0 text-xs font-semibold" align="end" />
          </div>

          {/* Mobile Filters Row */}
          <div className="flex flex-row flex-wrap items-center gap-2">
            <EnterpriseSelect
              className="h-[42px] w-[120px] text-xs font-semibold"
              value={selectedDay}
              onValueChange={setSelectedDay}
              options={[{ value: 'ALL', label: t('finance.allDays') }, ...Array.from({ length: 31 }, (_, index) => ({ value: String(index + 1).padStart(2, '0'), label: t('finance.day', { day: index + 1 }) }))]}
            />

            <EnterpriseSelect
              className="h-[42px] min-w-[140px] flex-1 text-xs font-semibold"
              value={selectedCategory}
              onValueChange={(value) => setSelectedCategory(value as 'ALL' | ExpenseCategory)}
              options={[{ value: 'ALL', label: t('finance.allCategories') }, ...categories.map((category) => ({ value: category, label: domainLabel(category, locale) }))]}
            />
          </div>

          {/* Mobile Add Buttons */}
          {canAddExpense && (
            <div className="flex gap-2">
              <EnterpriseButton size="sm" onClick={openUtilityModal} className="flex-1">
                <Plus size={15} />
                {t('finance.addUtility')}
              </EnterpriseButton>
              <EnterpriseButton size="sm" onClick={openExpenseModal} className="flex-1">
                <Plus size={15} />
                {t('finance.addExpenses')}
              </EnterpriseButton>
            </div>
          )}

          {/* Mobile Expense Cards */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          )}
          {!loading && filteredExpenses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingBag size={40} className="mb-2 text-muted-foreground" />
              <p className="text-sm font-semibold text-muted-foreground">{t('finance.empty')}</p>
              <p className="text-xs font-semibold text-muted-foreground">{t('finance.emptyDescription')}</p>
            </div>
          )}
          {!loading &&
            filteredExpenses.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-background p-4  transition hover:border-primary "
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-foreground">
                      {item.item_name || t('finance.unknown')}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <CalendarDays size={13} className="text-primary" />
                      {formatDate(item.expense_date)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getCategoryStyle(item.category)}`}
                  >
                    {domainLabel(item.category, locale)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted p-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                      {t('finance.quantity')}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {item.quantity ? `${item.quantity} ${item.unit ?? ''}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                      {t('finance.amount')}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {money(item.amount)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
                  <span>{t('finance.addedBy')}</span>
                  <span className="truncate font-semibold text-foreground">{item.creator?.name ?? t('finance.unknown')}</span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                  <span className="text-xs font-semibold text-muted-foreground">{t('finance.approval')}</span>
                  <ExpenseApprovalControl
                    status={getExpenseApprovalStatus(item)}
                    canReview={canManageMess}
                    updating={reviewingExpenseId === item.id}
                    onStatusChange={(status) => void handleExpenseApprovalChange(item, status)}
                  />
                </div>

                <div className="mt-3 flex justify-end">
                  <EnterpriseIconButton label={t('finance.viewExpense')} tone="primary" onClick={() => openViewModal(item)}><Eye size={16} /></EnterpriseIconButton>
                </div>
              </div>
            ))}
          {/* Footer Summary - Mobile */}
          {!loading && filteredExpenses.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted px-4 py-3">
              <p className="text-xs font-semibold text-muted-foreground"><span className="text-foreground">{filteredExpenses.length}</span> {t('finance.itemCounts')}</p>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Banknote size={14} className="text-primary" />
                <span className="text-primary">{t('finance.totalAmount')}: {money(summary.total)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs - Modals for Add, Edit, View, Review */}
      <EnterpriseDetailsDrawer
        open={isAddModalOpen}
        onOpenChange={(open) => {
          if (open) setIsAddModalOpen(true)
          else closeExpenseForm()
        }}
        eyebrow={isEditing ? t('finance.editExpense') : t('finance.newExpense')}
        title={isEditing ? (expenseFormMode === 'utility' ? t('finance.updateUtility') : t('finance.updateExpense')) : (expenseFormMode === 'utility' ? t('finance.addUtility') : t('finance.addExpenses'))}
        description={t('feedback.formDescription')}
        headerIcon={<ReceiptText className="size-5" />}
        footer={<EnterpriseDrawerFooter>
          {expenseFormMode !== 'utility' && <EnterpriseDrawerAction tone="secondary" onClick={addExpenseItem}><Plus size={16} /> {t('finance.addItem')}</EnterpriseDrawerAction>}
          <EnterpriseDrawerAction tone="secondary" onClick={closeExpenseForm} disabled={loading}>{t('finance.cancel')}</EnterpriseDrawerAction>
          <EnterpriseDrawerAction priority="primary" tone="primary" onClick={submitAllExpenses} disabled={loading}>{loading ? <Loader2 size={16} className="animate-spin" /> : <ReceiptText size={16} />}{loading ? t('finance.saving') : isEditing ? expenseFormMode === 'utility' ? t('finance.updateUtility') : t('finance.updateExpense') : aiDraft ? t('finance.confirmAiEntry') : expenseFormMode === 'utility' ? t('finance.submitUtility') : t('finance.submitItems', { count: expenseItems.length })}</EnterpriseDrawerAction>
        </EnterpriseDrawerFooter>}
      >
          <div className="space-y-6">
            {message && messageType === 'error' && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{message}</p>}
            {/* Payment Type Toggle */}
            <div className="rounded-2xl border border-border bg-muted p-5">
              <label className="mb-3 block text-sm font-semibold text-foreground">{t('finance.paymentType')}</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  aria-pressed={expensePaymentType === 'FROM_DEPOSIT'}
                  onClick={() => setExpensePaymentType('FROM_DEPOSIT')}
                  className={`flex-1 h-12 rounded-xl border-2 text-sm font-semibold transition ${
                    expensePaymentType === 'FROM_DEPOSIT'
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {t('finance.fromDeposit')}
                </button>
                <button
                  type="button"
                  aria-pressed={expensePaymentType === 'PERSONAL'}
                  onClick={() => setExpensePaymentType('PERSONAL')}
                  className={`flex-1 h-12 rounded-xl border-2 text-sm font-semibold transition ${
                    expensePaymentType === 'PERSONAL'
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  {t('finance.personal')}
                </button>
              </div>
              <p className="mt-2 text-[10px] font-semibold text-muted-foreground">
                {expensePaymentType === 'FROM_DEPOSIT'
                  ? t('finance.fromDepositHint')
                  : t('finance.personalHint')}
              </p>
            </div>

            {expenseFormMode === 'utility' && (
              <div className="rounded-2xl border border-border bg-muted p-5">
              <div className="grid gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-foreground">{t('finance.category')}</label>
                    <EnterpriseSelect
                      className="h-11 border-border bg-background text-foreground"
                      value={expenseItems[0].category}
                      onValueChange={(value) => updateExpenseItem(1, 'category', value as ExpenseCategory)}
                      options={utilityCategories.map((category) => ({ value: category, label: domainLabel(category, locale) }))}
                    />
                  </div>

                  {canManageMess && purchasedByMemberOptions.length > 0 && (
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-foreground">
                        {t('finance.purchasedBy')}
                      </label>
                      <EnterpriseSelect
                        className="h-11 border-border bg-background text-foreground"
                        value={expensePurchasedBy}
                        onValueChange={setExpensePurchasedBy}
                        options={purchasedByMemberOptions.map((member) => ({ value: member.id, label: member.name }))}
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-foreground">{t('feedback.priceLabel')}</label>
                    <input
                      type="number"
                      className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground"
                      placeholder={t('finance.pricePlaceholder')}
                      value={expenseItems[0].amount}
                      onChange={(e) => updateExpenseItem(1, 'amount', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-foreground">
                      {t('finance.description')}
                    </label>
                    <textarea
                      className="min-h-28 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground"
                      placeholder={t('finance.utilityNote')}
                      value={expenseItems[0].description}
                      onChange={(e) => updateExpenseItem(1, 'description', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-foreground">
                      {t('finance.receiptOptional')}
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm font-semibold hover:border-primary/30">
                        <Upload size={18} />
                        {t('finance.uploadReceipt')}
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
                        <div className="flex items-center gap-2 text-sm text-primary">
                          <span className="truncate">{expenseItems[0].receipt.name}</span>
                          <button
                            type="button"
                            aria-label={t('feedback.removeReceipt')}
                            onClick={() => updateReceipt(1, null)}
                            className="text-destructive hover:text-destructive"
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
            <div className="rounded-2xl bg-muted p-4">
              <label className="mb-2 block text-sm font-semibold text-foreground">
                {t('finance.expenseDate')}
              </label>
              <EnterpriseDatePicker value={sharedDate} onValueChange={setSharedDate} surface="white" className="h-12 w-full" align="start" ariaLabel={t('finance.selectExpenseDate')} />
            </div>

            {canManageMess && purchasedByMemberOptions.length > 0 && (
              <div className="rounded-2xl bg-muted p-4">
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  {t('finance.purchasedBy')}
                </label>
                <EnterpriseSelect
                  className="border-border bg-background text-foreground"
                  value={expensePurchasedBy}
                  onValueChange={setExpensePurchasedBy}
                  options={purchasedByMemberOptions.map((member) => ({ value: member.id, label: member.name }))}
                />
              </div>
            )}

            {/* Dynamic item rows */}
            <div className="space-y-4">
              {expenseItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="relative rounded-2xl border border-border bg-muted p-5"
                >
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('finance.item', { number: idx + 1 })}
                  </p>

                  {expenseItems.length > 1 && (
                    <button
                      type="button"
                      aria-label={t('finance.removeItem')}
                      onClick={() => removeExpenseItem(item.id)}
                      className="absolute right-4 top-4 text-muted-foreground hover:text-destructive"
                    >
                      <X size={18} />
                    </button>
                  )}

                  <div className="grid gap-4">
                    {/* Item Name */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-foreground">
                        {t('finance.itemName')}
                      </label>
                      <input
                        className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground"
                        placeholder={t('finance.itemPlaceholder')}
                        value={item.itemName}
                        onChange={(e) => updateExpenseItem(item.id, 'itemName', e.target.value)}
                      />
                    </div>

                    {/* Qty / Unit / Price */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">{t('finance.quantity')}</label>
                        <input
                          type="number"
                          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                          placeholder={t('finance.qtyPlaceholder')}
                          value={item.quantity}
                          onChange={(e) => updateExpenseItem(item.id, 'quantity', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">{t('finance.unit')}</label>
                        <input
                          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                          placeholder={t('finance.unitPlaceholder')}
                          value={item.unit}
                          onChange={(e) => updateExpenseItem(item.id, 'unit', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold">{t('feedback.priceLabel')}</label>
                        <input
                          type="number"
                          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm"
                          placeholder={t('finance.pricePlaceholder')}
                          value={item.amount}
                          onChange={(e) => updateExpenseItem(item.id, 'amount', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold">{t('finance.category')}</label>
                      <EnterpriseSelect
                        className="h-11 border-border bg-background text-foreground"
                        value={item.category}
                        onValueChange={(value) => updateExpenseItem(item.id, 'category', value as ExpenseCategory)}
                        options={(isEditing ? categories : expenseCategories).map((category) => ({ value: category, label: domainLabel(category, locale) }))}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-foreground">
                        {t('finance.description')}
                      </label>
                      <textarea
                        className="min-h-24 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground"
                        placeholder={t('finance.descriptionPlaceholder')}
                        value={item.description}
                        onChange={(e) => updateExpenseItem(item.id, 'description', e.target.value)}
                      />
                    </div>

                    {/* Receipt Image Upload */}
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-foreground">
                        {t('finance.receiptOptional')}
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm font-semibold hover:border-primary/30">
                          <Upload size={18} />
                          {t('finance.uploadReceipt')}
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
                          <div className="flex items-center gap-2 text-sm text-primary">
                            <span>{item.receipt.name}</span>
                            <button
                              type="button"
                              aria-label={t('feedback.removeReceipt')}
                              onClick={() => updateReceipt(item.id, null)}
                              className="text-destructive hover:text-destructive"
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
              </>
            )}
          </div>
      </EnterpriseDetailsDrawer>

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
            <DialogTitle>{t('finance.requestPriceReview')}</DialogTitle>
            <DialogDescription>
              {t('finance.requestPriceReviewDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-2xl bg-muted p-4 text-sm font-semibold text-foreground">
              {reviewExpense?.item_name || domainLabel(reviewExpense?.category, locale) || t('finance.memberTitle')} -{' '}
              {money(reviewExpense?.amount)}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
              {t('finance.message')}
              </label>
              <textarea
                className="min-h-32 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/20"
                placeholder={t('finance.reviewMessagePlaceholder')}
                value={reviewMessage}
                onChange={(event) => setReviewMessage(event.target.value)}
              />
            </div>

            <EnterpriseButton fullWidth size="lg" onClick={submitPriceReviewRequest} disabled={loading || !reviewMessage.trim()}>
              {t('finance.sendReviewRequest')}
            </EnterpriseButton>
          </div>
        </DialogContent>
      </Dialog>

      <EnterpriseDetailsDrawer
        open={isViewModalOpen}
        onOpenChange={(open) => {
          setIsViewModalOpen(open)
          if (!open) setViewExpense(null)
        }}
        eyebrow={t('finance.details')}
          title={t('finance.details')}
          description={t('feedback.formDescription')}
        headerIcon={<ReceiptText className="size-5" />}
        footer={viewExpense ? <EnterpriseDrawerFooter>
          {canEditExpense(viewExpense) && <EnterpriseDrawerAction priority="primary" tone="primary" onClick={() => { const expense = viewExpense; setIsViewModalOpen(false); setViewExpense(null); openEditExpenseModal(expense) }}><Edit3 size={16} /> {t('payments.editAction')}</EnterpriseDrawerAction>}
          {canRequestExpenseReview(viewExpense) && <EnterpriseDrawerAction tone="secondary" onClick={() => { const expense = viewExpense; setIsViewModalOpen(false); setViewExpense(null); openReviewModal(expense) }}><MessageSquareWarning size={16} /> {t('finance.requestPriceReview')}</EnterpriseDrawerAction>}
          {canManageMess && <EnterpriseDrawerAction tone="danger" onClick={() => { const expense = viewExpense; setIsViewModalOpen(false); setViewExpense(null); void handleDeleteExpense(expense.id) }}><Trash2 size={16} /> {t('finance.delete')}</EnterpriseDrawerAction>}
        </EnterpriseDrawerFooter> : undefined}
      >
          {viewExpense && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-4 ">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {domainLabel(viewExpense.category, locale)}
                    </p>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-foreground">
                        {viewExpense.item_name || domainLabel(viewExpense.category, locale) || t('finance.unknown')}
                      </h3>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${getPaymentTypeStyle(viewExpense.payment_type).badge}`}>
                        {getPaymentTypeStyle(viewExpense.payment_type).icon} {domainLabel(viewExpense.payment_type ?? 'FROM_DEPOSIT', locale)}
                      </span>
                      <ExpenseApprovalControl
                        status={getExpenseApprovalStatus(viewExpense)}
                        canReview={canManageMess}
                        updating={reviewingExpenseId === viewExpense.id}
                        onStatusChange={(status) => void handleExpenseApprovalChange(viewExpense, status)}
                      />
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <CalendarDays size={13} className="text-primary" />
                      {formatDate(viewExpense.expense_date)}
                    </p>
                  </div>
                  <p className="text-xl font-semibold text-foreground">
                    {money(viewExpense.amount)}
                  </p>
                </div>
              </div>

              {viewExpense.items?.length ? (
                <div className="overflow-hidden rounded-xl border border-border bg-background">
                  <div className="flex items-center justify-between bg-muted px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">{t('finance.purchasedItems')}</p>
                    <span className="text-xs font-semibold text-muted-foreground">{viewExpense.items.length} {viewExpense.items.length === 1 ? t('finance.itemCount') : t('finance.itemCounts')}</span>
                  </div>
                  {viewExpense.items.map((item, index) => (
                    <div key={item.id ?? `${item.itemName}-${index}`} className="flex items-center justify-between gap-4 border-t border-border px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{item.itemName}</p>
                        {item.quantity != null ? <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{item.quantity} {item.unit ?? ''}</p> : null}
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-primary">{money(item.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">{t('finance.purchasedBy')}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {viewExpense.purchaser?.name ?? resolveMemberNameById(viewExpense.purchased_by, viewExpense.creator?.name ?? t('finance.unknown'))}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">{t('finance.addedBy')}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {viewExpense.creator?.name ?? t('finance.unknown')}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">{t('finance.description')}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-foreground">
                  {viewExpense.description || t('finance.noDescription')}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">{t('finance.receipt')}</p>
                {viewExpense.receipt_url ? (
                  <div className="mt-3 space-y-3">
                    {/\.(png|jpe?g|webp|gif)(\?|$)/i.test(viewExpense.receipt_url) && (
                      <img
                        src={viewExpense.receipt_url}
                        alt={t('feedback.receiptFor', { name: viewExpense.item_name || domainLabel(viewExpense.category, locale) })}
                        className="max-h-80 w-full rounded-xl border border-border object-contain"
                      />
                    )}
                    <a
                      href={viewExpense.receipt_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-muted px-4 text-sm font-semibold text-primary"
                    >
                      {t('finance.viewReceipt')}
                    </a>
                  </div>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-muted-foreground">
                    {t('finance.noReceipt')}
                  </p>
                )}
              </div>
            </div>
          )}
      </EnterpriseDetailsDrawer>
    </div>
  )
}
