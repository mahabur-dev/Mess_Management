'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Card } from '@/components/ui/card'
import { EnterpriseButton } from '@/components/ui/enterprise-button'
import { EnterpriseDetailsDrawer } from '@/components/ui/enterprise-details-drawer'
import { EnterpriseDrawerAction, EnterpriseDrawerFooter } from '@/components/ui/enterprise-drawer-footer'
import { EnterpriseIconButton } from '@/components/ui/enterprise-icon-button'
import { EnterpriseSelect } from '@/components/ui/enterprise-select'
import { EnterpriseDatePicker, EnterpriseMonthPicker } from '@/components/ui/enterprise-date-picker'
import { EnterpriseTableActionCell, EnterpriseTableActionHeader } from '@/components/ui/enterprise-table-actions'
import { apiClient, type Mess, type MessMembershipWithDetails, type Payment, type PaymentMethod, type ExpenseCategory } from '@/lib/api-client'
import { useAuth } from '@/app/context/auth-context'
import { Check, CreditCard, Loader2, Plus, X, Wallet, Banknote, Smartphone, Landmark, Building2, CalendarDays, User, Ban, Search, Filter, Trash2, Eye, Edit3 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAutoDismissMessage } from '@/hooks/use-auto-dismiss-message'
import { clearAiCommandDraft, readAiCommandDraft, type AiCommandDraft } from '@/lib/ai-quick-add'
import { useRouter, useSearchParams } from 'next/navigation'

const methods: PaymentMethod[] = ['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK']

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; color: string; bg: string }[] = [
  { value: 'GROCERY', label: 'Grocery', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  { value: 'UTILITY', label: 'Utility', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  { value: 'RENT', label: 'Rent', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  { value: 'FOOD', label: 'Food', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  { value: 'GAS', label: 'Gas', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  { value: 'ELECTRICITY', label: 'Electricity', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  { value: 'WIFI', label: 'WiFi', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  { value: 'CLEANER', label: 'Cleaner', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  { value: 'BUABILL', label: 'Bua Bill', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  { value: 'WATER', label: 'Water', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  { value: 'OTHER', label: 'Other', color: 'var(--muted-foreground)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
]

const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  CASH: { label: 'Cash', icon: <Banknote size={14} />, color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  BKASH: { label: 'bKash', icon: <Smartphone size={14} />, color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  NAGAD: { label: 'Nagad', icon: <Smartphone size={14} />, color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  ROCKET: { label: 'Rocket', icon: <Smartphone size={14} />, color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
  BANK: { label: 'Bank', icon: <Landmark size={14} />, color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)' },
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)', border: 'color-mix(in srgb, var(--primary) 30%, transparent)' },
  APPROVED: { label: 'Approved', color: 'var(--primary)', bg: 'color-mix(in srgb, var(--primary) 10%, transparent)', border: 'color-mix(in srgb, var(--primary) 30%, transparent)' },
  REJECTED: { label: 'Rejected', color: 'var(--destructive)', bg: 'color-mix(in srgb, var(--destructive) 10%, transparent)', border: 'color-mix(in srgb, var(--destructive) 30%, transparent)' },
}

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDateShort = (iso: string) => {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function money(value: number | string | undefined | null) {
  return `৳ ${Number(value ?? 0).toLocaleString()}`
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default function PaymentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const aiCommandId = searchParams.get('aiCommand')
  const [messes, setMesses] = useState<Mess[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [messMembers, setMessMembers] = useState<MessMembershipWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('BKASH')
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentPurchasedBy, setPaymentPurchasedBy] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { user } = useAuth()
  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess
  const activeMembership = user?.memberships?.find(
    (membership) =>
      membership.mess_id === activeMess?.id || membership.mess?.id === activeMess?.id,
  )
  const isAdmin = user?.role === 'ADMIN'
  const isManager =
    user?.role === 'ADMIN' ||
    user?.role === 'MANAGER' ||
    activeMembership?.role === 'MANAGER'
  const purchasedByOptions = useMemo(
    () =>
      messMembers
        .filter((membership) => membership.is_active && membership.user)
        .map((membership) => membership.user!),
    [messMembers],
  )
  const purchasedByMemberOptions = purchasedByOptions.length > 0 ? purchasedByOptions : user ? [user] : []
  const [showModal, setShowModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [searchText, setSearchText] = useState('')
  const [aiDraft, setAiDraft] = useState<AiCommandDraft | null>(null)

  useAutoDismissMessage(message, messageType, setMessage, setMessageType)

  async function load() {
    setLoading(true)
    try {
      if (isAdmin) {
        const paymentRes = await apiClient.getAllPayments().catch(() => null)
        setPayments(Array.isArray(paymentRes?.data) ? paymentRes.data : [])
        return
      }

      const messRes = await apiClient.getMesses().catch(() => null)
      const list = Array.isArray(messRes?.data)
        ? messRes.data
        : messRes?.data
          ? [messRes.data]
          : ((user?.memberships?.map((item) => item.mess).filter(Boolean) ?? []) as Mess[])
      setMesses(list)
      setPaymentPurchasedBy(user?.id ?? '')
      if (list[0]) {
        const paymentRes = isManager ? await apiClient.getPaymentsByMess(list[0].id).catch(() => null) : await apiClient.getMyPayments().catch(() => null)
        setPayments(Array.isArray(paymentRes?.data) ? paymentRes.data : [])
        const managerMembersRes = isManager ? await apiClient.getAllMembers({ limit: 1000 }).catch(() => null) : null
        const fetchedMembers = Array.isArray(managerMembersRes?.data) ? managerMembersRes.data : []
        const activeMembersFromApi = fetchedMembers.filter((member) => member.mess?.id === list[0].id)
        const fallbackMembers = list[0].memberships?.filter((membership) => membership.is_active && membership.user) ?? []
        setMessMembers(activeMembersFromApi.length > 0 ? activeMembersFromApi : fallbackMembers)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user, isManager])

  useEffect(() => {
    if (!aiCommandId || !activeMess || !user || aiDraft) return
    const draft = readAiCommandDraft(aiCommandId)
    if (!draft || draft.intent !== 'DEPOSIT_CREATE' || !draft.payload) return
    const payload = draft.payload
    const nextMethod = String(payload.method ?? 'BKASH') as PaymentMethod
    setAmount(String(payload.amount ?? ''))
    setMethod(methods.includes(nextMethod) ? nextMethod : 'BKASH')
    setPaymentDate(String(payload.date ?? payload.paymentDate ?? new Date().toISOString().slice(0, 10)).slice(0, 10))
    setPaymentPurchasedBy(String(payload.memberId ?? payload.purchasedBy ?? user.id))
    setSelectedCategories(Array.isArray(payload.categories) ? payload.categories.map(String) : [])
    setEditingPayment(null)
    setAiDraft(draft)
    setShowModal(true)
  }, [activeMess, aiCommandId, aiDraft, user])

  function finishAiDraft() {
    if (!aiDraft) return
    clearAiCommandDraft(aiDraft.id)
    setAiDraft(null)
    router.replace('/dashboard/payments')
  }

  function closeDepositForm() {
    setShowModal(false)
    setSelectedCategories([])
    setEditingPayment(null)
    if (aiDraft) {
      void apiClient.cancelAiCommand(aiDraft.id).catch(() => null)
      finishAiDraft()
    }
  }

  async function submitPayment() {
    if ((!activeMess && !editingPayment) || !amount) return
    setSubmitting(true)
    setMessage('')
    try {
      if (editingPayment) {
        await apiClient.updatePayment(editingPayment.id, {
          amount: Number(amount),
          method,
          paymentDate: paymentDate || undefined,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        })
      } else if (aiDraft) {
        await apiClient.confirmAiCommand(aiDraft.id, {
          messId: activeMess!.id,
          memberId: paymentPurchasedBy || user?.id,
          purchasedBy: paymentPurchasedBy || user?.id,
          amount: Number(amount),
          method,
          date: paymentDate || new Date().toISOString().slice(0, 10),
          paymentDate: paymentDate || new Date().toISOString().slice(0, 10),
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        })
      } else {
        await apiClient.submitPayment({
          messId: activeMess!.id,
          purchasedBy: paymentPurchasedBy || user?.id,
          amount: Number(amount),
          method,
          paymentDate: paymentDate || undefined,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        })
      }
      setAmount('')
      setPaymentDate('')
      setSelectedCategories([])
      setPaymentPurchasedBy(user?.id ?? '')
      setEditingPayment(null)
      setShowModal(false)
      const completedWithAi = Boolean(aiDraft)
      if (completedWithAi) finishAiDraft()
      setMessageType('success')
      setMessage(editingPayment ? 'Deposit updated successfully.' : completedWithAi ? 'AI deposit confirmed successfully.' : 'Deposit submitted successfully.')
      await load()
    } catch (error) {
      setMessageType('error')
      setMessage(getErrorMessage(error, 'Failed to submit deposit.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function review(id: string, status: 'APPROVED' | 'REJECTED') {
    setReviewingId(id)
    setMessage('')
    try {
      await apiClient.reviewPayment(id, { status })
      setMessageType('success')
      setMessage(`Deposit ${status.toLowerCase()} successfully.`)
      await load()
    } catch (error) {
      setMessageType('error')
      setMessage(getErrorMessage(error, 'Failed to review deposit.'))
    } finally {
      setReviewingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this deposit?')) return
    setDeletingId(id)
    setMessage('')
    try {
      await apiClient.deletePayment(id)
      setMessageType('success')
      setMessage('Deposit deleted successfully.')
      await load()
    } catch (error) {
      setMessageType('error')
      setMessage(getErrorMessage(error, 'Failed to delete deposit.'))
    } finally {
      setDeletingId(null)
    }
  }

  function toggleCategory(cat: string) {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  function openEditPayment(payment: Payment) {
    setEditingPayment(payment)
    setAmount(String(payment.amount ?? ''))
    setMethod(payment.method)
    setPaymentDate(payment.payment_date?.slice(0, 10) ?? '')
    setSelectedCategories(payment.categories ?? [])
    setShowViewModal(false)
    setViewingPayment(null)
    setShowModal(true)
  }

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const paymentMonth = payment.payment_date
        ? new Date(payment.payment_date).toISOString().slice(0, 7)
        : new Date(payment.created_at).toISOString().slice(0, 7)
      const matchMonth = paymentMonth === selectedMonth
      const searchableText = `${payment.member?.name ?? ''} ${payment.member?.email ?? ''} ${payment.creator?.name ?? ''} ${payment.method} ${payment.status} ${(payment.categories ?? []).join(' ')}`.toLowerCase()
      const matchSearch = searchableText.includes(searchText.toLowerCase())
      return matchMonth && matchSearch
    })
  }, [payments, selectedMonth, searchText])

  // Summary calculations
  const pendingCount = filteredPayments.filter(p => p.status === 'PENDING').length
  const approvedCount = filteredPayments.filter(p => p.status === 'APPROVED').length
  const totalAmount = filteredPayments.reduce((s, p) => s + Number(p.amount || 0), 0)

  function CheckIcon({ size, className }: { size: number; className?: string }) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader title="Deposits" description="Review member deposits and track their approval status" />

      <div className="p-4 sm:p-6 lg:p-8">
        {message && (
          <div className={`mb-5 rounded-xl px-4 py-3 text-sm font-bold  ${messageType === 'error' ? 'border border-destructive/30 bg-destructive/10 text-destructive' : 'border border-primary/30 bg-primary/10 text-primary'}`}>
            {message}
          </div>
        )}

        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="dashboard-section-icon size-12 rounded-lg">
              <Wallet size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Deposits</h2>
              <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{payments.length} deposit{payments.length !== 1 ? 's' : ''} recorded</p>
            </div>
          </div>
          <EnterpriseButton onClick={() => { setEditingPayment(null); setAmount(''); setPaymentDate(''); setSelectedCategories([]); setPaymentPurchasedBy(user?.id ?? ''); setShowModal(true) }} className="gap-2">
            <Plus size={18} /> Add Deposit
          </EnterpriseButton>
        </div>

        {/* Summary Cards */}
        {!loading && payments.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="dashboard-subtle-card rounded-xl p-4 ">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"><CreditCard size={13} className="text-primary" /> Total</p>
              <p className="mt-1.5 text-2xl font-semibold text-foreground">{payments.length}</p>
            </div>
            <div className="dashboard-subtle-card rounded-xl p-4 ">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary"><Loader2 size={13} /> Pending</p>
              <p className="mt-1.5 text-2xl font-semibold text-primary">{pendingCount}</p>
            </div>
            <div className="dashboard-subtle-card rounded-xl p-4 ">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary"><Check size={13} /> Approved</p>
              <p className="mt-1.5 text-2xl font-semibold text-primary">{approvedCount}</p>
            </div>
            <div className="dashboard-subtle-card rounded-xl p-4 ">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"><Banknote size={13} className="text-primary" /> Total Amount</p>
              <p className="mt-1.5 text-2xl font-semibold text-foreground">{money(totalAmount)}</p>
            </div>
          </div>
        )}

        {/* Desktop Filter Toolbar */}
        <div className="hidden sm:flex flex-row flex-wrap items-center gap-2 mb-4">
          <div className="relative w-52">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="h-[38px] w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs font-semibold text-foreground  outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20" placeholder="Search by name, method, status..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          </div>
          <EnterpriseMonthPicker value={selectedMonth} onValueChange={setSelectedMonth} shortLabel className="h-[38px] w-[154px] text-xs font-bold" align="start" />
          {(searchText || selectedMonth !== new Date().toISOString().slice(0, 7)) && (
            <span className="text-[10px] font-semibold text-muted-foreground">Showing {filteredPayments.length} of {payments.length} deposits</span>
          )}
        </div>

        {/* Deposits Table - Desktop */}
        <div className="dashboard-table-frame hidden sm:block">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-border bg-muted">
                {['Paid by', 'Added by', 'Amount', 'Status', 'Action'].map((heading) =>
                  heading === 'Action'
                    ? <EnterpriseTableActionHeader key={heading} />
                    : <th key={heading} className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{heading}</th>,
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr><td colSpan={5} className="px-5 py-12 text-center"><div className="flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground"><Loader2 size={18} className="animate-spin text-primary" /> Loading deposits...</div></td></tr>
              )}
              {!loading && filteredPayments.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2"><Wallet size={40} className="text-muted-foreground" />
                    <p className="text-sm font-bold text-muted-foreground">{payments.length === 0 ? 'No deposit records yet.' : 'No deposits match your filters.'}</p>
                    <p className="text-xs font-semibold text-muted-foreground">{payments.length === 0 ? 'Click "Add Deposit" to add one.' : 'Try changing the month or search term.'}</p>
                  </div>
                </td></tr>
              )}
              {!loading && filteredPayments.map((payment) => {
                const statusCfg = STATUS_CONFIG[payment.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
                const canDelete = payment.member?.id === user?.id || isManager
                const isDeleting = deletingId === payment.id

                return (
                  <tr key={payment.id} onClick={() => { setViewingPayment(payment); setShowViewModal(true) }} className="cursor-pointer transition hover:bg-muted focus-within:bg-muted">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{(payment.member?.name?.[0] || 'M').toUpperCase()}</div>
                        <div><p className="text-sm font-bold text-foreground">{payment.member?.name ?? 'Unknown Member'}</p><p className="text-xs font-semibold text-muted-foreground">{payment.member?.email ?? ''}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{(payment.creator?.name?.[0] || 'M').toUpperCase()}</div>
                        <div><p className="text-sm font-bold text-foreground">{payment.creator?.name ?? 'Unknown'}</p><p className="text-xs font-semibold text-muted-foreground">{payment.creator?.email ?? ''}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-foreground">{money(payment.amount)}</td>
                    <td className="px-4 py-4">
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: statusCfg.bg, color: statusCfg.color, borderColor: statusCfg.border }}>
                          {payment.status === 'PENDING' && <Loader2 size={11} className="animate-spin" />}
                          {payment.status === 'APPROVED' && <Check size={11} />}
                          {payment.status === 'REJECTED' && <Ban size={11} />}
                          {statusCfg.label}
                        </span>
                      </div>
                    </td>
                    <EnterpriseTableActionCell contentClassName="gap-1.5">
                        <EnterpriseIconButton label="View deposit" tone="primary" onClick={(event) => { event.stopPropagation(); setViewingPayment(payment); setShowViewModal(true) }}>
                          <Eye size={16} />
                        </EnterpriseIconButton>
                        {canDelete && (
                          <EnterpriseIconButton label="Delete deposit" tone="danger" disabled={isDeleting} onClick={(event) => { event.stopPropagation(); void handleDelete(payment.id) }}>
                            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </EnterpriseIconButton>
                        )}
                    </EnterpriseTableActionCell>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Footer Summary */}
          {!loading && payments.length > 0 && (
            <div className="border-t-2 border-border bg-muted px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><User size={14} /> <span><span className="text-foreground">{payments.length}</span> deposits</span></div>
                <div className="flex items-center gap-4 text-xs font-bold"><span className="text-primary">{pendingCount} pending</span><span className="text-primary">{approvedCount} approved</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Filter Toolbar */}
        <div className="flex flex-col gap-3 sm:hidden mb-4">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="h-[46px] w-full rounded-xl border border-border bg-background pl-10 pr-3.5 text-sm font-semibold text-foreground  outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20" placeholder="Search by name, method, status..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          </div>
          <EnterpriseMonthPicker value={selectedMonth} onValueChange={setSelectedMonth} className="h-[46px] w-full font-bold" align="start" />
        </div>

        {/* Deposits - Mobile Cards */}
        <div className="space-y-3 sm:hidden">
          {loading && <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>}
          {!loading && filteredPayments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12"><Wallet size={40} className="mb-2 text-muted-foreground" /><p className="text-sm font-bold text-muted-foreground">{payments.length === 0 ? 'No deposit records yet.' : 'No deposits match your filters.'}</p><p className="text-xs font-semibold text-muted-foreground">{payments.length === 0 ? 'Click "Add Deposit" to add one.' : 'Try changing the month or search term.'}</p></div>
          )}
          {!loading && filteredPayments.map((payment) => {
            const methodCfg = PAYMENT_METHOD_CONFIG[payment.method as PaymentMethod] || PAYMENT_METHOD_CONFIG.CASH
            const statusCfg = STATUS_CONFIG[payment.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
            const isOwn = payment.member?.id === user?.id
            const canDelete = isOwn || isManager
            const isDeleting = deletingId === payment.id

            return (
              <div key={payment.id} className="rounded-xl border border-border bg-background p-4  transition hover:border-primary">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{(payment.member?.name?.[0] || 'M').toUpperCase()}</div>
                    <div className="min-w-0"><p className="truncate text-sm font-bold text-foreground">{payment.member?.name ?? 'Unknown Member'}</p><p className="truncate text-xs font-semibold text-muted-foreground">{payment.member?.email ?? ''}</p></div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: statusCfg.bg, color: statusCfg.color, borderColor: statusCfg.border }}>
                    {payment.status === 'PENDING' && <Loader2 size={10} className="animate-spin" />}
                    {payment.status === 'APPROVED' && <Check size={10} />}
                    {payment.status === 'REJECTED' && <Ban size={10} />}
                    {statusCfg.label}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-muted p-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold" style={{ backgroundColor: methodCfg.bg, color: methodCfg.color, borderColor: 'var(--border)' }}>{methodCfg.icon}{methodCfg.label}</span>
                    <div className="text-xs font-semibold text-muted-foreground">
                      <span><CalendarDays size={11} className="inline mr-1 text-primary" />{formatDate(payment.created_at)}</span>
                      {payment.payment_date && <div className="text-[10px] text-muted-foreground mt-0.5"><CalendarDays size={9} className="inline mr-1 text-muted-foreground" />For: {formatDateShort(payment.payment_date)}</div>}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{money(payment.amount)}</p>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Paid by</span>
                  <span className="text-foreground">
                    {payment.member?.name ?? 'Unknown Member'}
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Added by</span>
                  <span className="text-foreground">
                    {payment.creator?.name ?? 'Unknown'}
                  </span>
                </div>

                {(payment.categories ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {payment.categories.map((cat) => {
                      const cfg = EXPENSE_CATEGORIES.find(c => c.value === cat)
                      return <span key={cat} className="inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold" style={{ backgroundColor: cfg?.bg ?? 'var(--primary)', color: cfg?.color ?? 'var(--muted-foreground)', borderColor: 'var(--border)' }}>{cfg?.label ?? cat}</span>
                    })}
                  </div>
                )}

                <div className="mt-3 flex justify-end gap-2">
                  <EnterpriseIconButton label="View deposit" tone="primary" onClick={() => { setViewingPayment(payment); setShowViewModal(true) }}><Eye size={16} /></EnterpriseIconButton>
                  {payment.status === 'PENDING' && isManager && (
                    <>
                      <EnterpriseIconButton label="Approve deposit" tone="success" disabled={reviewingId === payment.id} onClick={() => void review(payment.id, 'APPROVED')}>{reviewingId === payment.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}</EnterpriseIconButton>
                      <EnterpriseIconButton label="Reject deposit" tone="danger" disabled={reviewingId === payment.id} onClick={() => void review(payment.id, 'REJECTED')}><X size={16} /></EnterpriseIconButton>
                    </>
                  )}
                  {canDelete && (
                    <EnterpriseIconButton label="Delete deposit" tone="danger" disabled={isDeleting} onClick={() => void handleDelete(payment.id)}>{isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}</EnterpriseIconButton>
                  )}
                </div>
              </div>
            )
          })}
          {!loading && payments.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted px-4 py-3"><p className="text-xs font-bold text-muted-foreground"><span className="text-foreground">{payments.length}</span> deposits</p><div className="flex gap-3 text-xs font-bold"><span className="text-primary">{pendingCount} pending</span><span className="text-primary">{approvedCount} approved</span></div></div>
          )}
        </div>
      </div>

      {/* View Deposit Drawer */}
      {viewingPayment && (
        <EnterpriseDetailsDrawer
          open={showViewModal}
          onOpenChange={(open) => { setShowViewModal(open); if (!open) setViewingPayment(null) }}
          eyebrow="Deposit"
          title="Deposit details"
          description={viewingPayment.member?.email ?? 'Deposit record and transaction information.'}
          headerIcon={<CreditCard className="size-5" />}
          footer={<EnterpriseDrawerFooter>{(isManager || viewingPayment.creator?.id === user?.id) && <EnterpriseDrawerAction priority="primary" tone="primary" onClick={() => openEditPayment(viewingPayment)}><Edit3 size={16} /> Edit deposit</EnterpriseDrawerAction>}{viewingPayment.status === 'PENDING' && isManager && <><EnterpriseDrawerAction tone="success" disabled={reviewingId === viewingPayment.id} onClick={() => { void review(viewingPayment.id, 'APPROVED'); setShowViewModal(false); setViewingPayment(null) }}>{reviewingId === viewingPayment.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Approve</EnterpriseDrawerAction><EnterpriseDrawerAction tone="danger" disabled={reviewingId === viewingPayment.id} onClick={() => { void review(viewingPayment.id, 'REJECTED'); setShowViewModal(false); setViewingPayment(null) }}><X size={16} /> Reject</EnterpriseDrawerAction></>}</EnterpriseDrawerFooter>}
        >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{(viewingPayment.member?.name?.[0] || 'M').toUpperCase()}</div>
                  <div><p className="text-base font-bold text-foreground">{viewingPayment.member?.name ?? 'Unknown'}</p><p className="text-xs font-semibold text-muted-foreground">{viewingPayment.member?.email ?? ''}</p></div>
                </div>
                <div className="rounded-xl  bg-muted to-white border border-border p-4">
                  <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-muted-foreground">Amount</span><span className="text-2xl font-semibold text-foreground">{money(viewingPayment.amount)}</span></div>
                  <div className="flex items-center justify-between"><span className="text-xs font-bold text-muted-foreground">Method</span>
                    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: PAYMENT_METHOD_CONFIG[viewingPayment.method as PaymentMethod]?.bg ?? 'var(--primary)', color: PAYMENT_METHOD_CONFIG[viewingPayment.method as PaymentMethod]?.color ?? 'var(--muted-foreground)', borderColor: 'var(--border)' }}>
                      {PAYMENT_METHOD_CONFIG[viewingPayment.method as PaymentMethod]?.icon}{PAYMENT_METHOD_CONFIG[viewingPayment.method as PaymentMethod]?.label ?? viewingPayment.method}
                    </span>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Paid by</p>
                    <p className="mt-1 text-sm font-bold text-foreground">{viewingPayment.member?.name ?? 'Unknown Member'}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">Added By</p>
                    <p className="mt-1 text-sm font-bold text-foreground">{viewingPayment.creator?.name ?? 'Unknown'}</p>
                  </div>
                </div>
                {viewingPayment.categories && viewingPayment.categories.length > 0 && (
                  <div><p className="mb-2 text-xs font-bold text-muted-foreground">Categories</p>
                    <div className="flex flex-wrap gap-1.5">{viewingPayment.categories.map((cat) => {
                      const cfg = EXPENSE_CATEGORIES.find(c => c.value === cat)
                      return <span key={cat} className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: cfg?.bg ?? 'var(--primary)', color: cfg?.color ?? 'var(--muted-foreground)', borderColor: 'var(--border)' }}>{cfg?.label ?? cat}</span>
                    })}</div>
                  </div>
                )}
                {viewingPayment.note && <div><p className="mb-1 text-xs font-bold text-muted-foreground">Note</p><p className="rounded-xl bg-muted p-3 text-sm font-semibold text-muted-foreground">{viewingPayment.note}</p></div>}
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground"><CalendarDays size={13} className="text-primary" /> Submitted: {formatDate(viewingPayment.created_at)}</p>
              </div>
        </EnterpriseDetailsDrawer>
      )}

      {/* Add Deposit Drawer */}
      {showModal && (
        <EnterpriseDetailsDrawer
          open={showModal}
          onOpenChange={(open) => { if (open) setShowModal(true); else closeDepositForm() }}
          eyebrow="Deposit"
          title={editingPayment ? 'Edit deposit' : 'Add deposit'}
          description={editingPayment ? 'Update this deposit amount, method, date, or categories.' : 'Record a deposit with its method, date, and categories.'}
          headerIcon={<CreditCard className="size-5" />}
          footer={<EnterpriseDrawerFooter><EnterpriseDrawerAction tone="secondary" onClick={closeDepositForm} disabled={submitting}>Cancel</EnterpriseDrawerAction><EnterpriseDrawerAction priority="primary" tone="primary" onClick={submitPayment} disabled={submitting || !amount || (!activeMess && !editingPayment)}>{submitting ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}{submitting ? 'Saving...' : editingPayment ? 'Save changes' : aiDraft ? 'Confirm AI deposit' : 'Add deposit'}</EnterpriseDrawerAction></EnterpriseDrawerFooter>}
        >
            <div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Amount (৳)</label>
                  <input className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20" type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Deposit Date</label>
                  <EnterpriseDatePicker value={paymentDate} onValueChange={setPaymentDate} surface="white" className="h-[48px] w-full" align="start" ariaLabel="Select deposit date" />
                </div>

                {isManager && purchasedByMemberOptions.length > 0 && (
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Paid by</label>
                    <EnterpriseSelect value={paymentPurchasedBy} onValueChange={setPaymentPurchasedBy} options={purchasedByMemberOptions.map((member) => ({ value: member.id, label: member.name }))} />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Deposit Method</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {methods.map((m) => {
                      const cfg = PAYMENT_METHOD_CONFIG[m]
                      const selected = method === m
                      return (
                        <button key={m} type="button" onClick={() => setMethod(m)} className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-bold transition active:scale-[0.98] ${selected ? 'border-border bg-muted text-primary ' : 'border-border bg-background text-muted-foreground hover:border-primary hover:bg-muted'}`}>
                          <span className="text-base">{cfg.icon}</span>{cfg.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Deposit Category (optional - select multiple)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {EXPENSE_CATEGORIES.map((cat) => {
                      const selected = selectedCategories.includes(cat.value)
                      return (
                        <button key={cat.value} type="button" onClick={() => toggleCategory(cat.value)} className={`flex items-center gap-1.5 rounded-xl border py-2.5 px-3 text-xs font-bold transition active:scale-[0.98] ${selected ? 'border-border bg-muted text-primary ' : 'border-border bg-background text-muted-foreground hover:border-primary hover:bg-muted'}`}>
                          {selected && <CheckIcon size={12} className="shrink-0" />}{cat.label}
                        </button>
                      )
                    })}
                  </div>
                  {selectedCategories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {selectedCategories.map((cat) => {
                        const cfg = EXPENSE_CATEGORIES.find(c => c.value === cat)
                        return (
                          <span key={cat} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: cfg?.bg ?? 'var(--primary)', color: cfg?.color ?? 'var(--muted-foreground)', borderColor: 'var(--border)' }}>
                            {cfg?.label ?? cat}<button onClick={() => toggleCategory(cat)} className="hover:opacity-70"><X size={10} /></button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
        </EnterpriseDetailsDrawer>
      )}
    </div>
  )
}
