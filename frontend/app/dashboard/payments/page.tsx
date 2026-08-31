'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EnterpriseDetailsDrawer } from '@/components/ui/enterprise-details-drawer'
import { apiClient, type Mess, type MessMembershipWithDetails, type Payment, type PaymentMethod, type ExpenseCategory } from '@/lib/api-client'
import { useAuth } from '@/app/context/auth-context'
import { Check, CreditCard, Loader2, Plus, X, Wallet, Banknote, Smartphone, Landmark, Building2, CalendarDays, User, Ban, Search, Filter, Trash2, Eye } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAutoDismissMessage } from '@/hooks/use-auto-dismiss-message'

const methods: PaymentMethod[] = ['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK']

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; color: string; bg: string }[] = [
  { value: 'GROCERY', label: 'Grocery', color: '#059669', bg: '#ecfdf5' },
  { value: 'UTILITY', label: 'Utility', color: '#d97706', bg: '#fffbeb' },
  { value: 'RENT', label: 'Rent', color: '#dc2626', bg: '#fef2f2' },
  { value: 'FOOD', label: 'Food', color: '#7c3aed', bg: '#f5f3ff' },
  { value: 'GAS', label: 'Gas', color: '#2563eb', bg: '#eff6ff' },
  { value: 'ELECTRICITY', label: 'Electricity', color: '#0891b2', bg: '#ecfeff' },
  { value: 'WIFI', label: 'WiFi', color: '#0d9488', bg: '#f0fdfa' },
  { value: 'CLEANER', label: 'Cleaner', color: '#be185d', bg: '#fdf2f8' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: '#b45309', bg: '#fff7ed' },
  { value: 'BUABILL', label: 'Bua Bill', color: '#1d4ed8', bg: '#eef2ff' },
  { value: 'WATER', label: 'Water', color: '#0284c7', bg: '#f0f9ff' },
  { value: 'OTHER', label: 'Other', color: '#6b7280', bg: '#f9fafb' },
]

const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  CASH: { label: 'Cash', icon: <Banknote size={14} />, color: '#059669', bg: '#ecfdf5' },
  BKASH: { label: 'bKash', icon: <Smartphone size={14} />, color: '#dc2626', bg: '#fef2f2' },
  NAGAD: { label: 'Nagad', icon: <Smartphone size={14} />, color: '#d97706', bg: '#fffbeb' },
  ROCKET: { label: 'Rocket', icon: <Smartphone size={14} />, color: '#7c3aed', bg: '#f5f3ff' },
  BANK: { label: 'Bank', icon: <Landmark size={14} />, color: '#2563eb', bg: '#eff6ff' },
}

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', color: '#d97706', bg: '#fffbeb', border: 'border-amber-200/60' },
  APPROVED: { label: 'Approved', color: '#059669', bg: '#ecfdf5', border: 'border-emerald-200/60' },
  REJECTED: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2', border: 'border-red-200/60' },
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
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewingPayment, setViewingPayment] = useState<Payment | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [searchText, setSearchText] = useState('')

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

  async function submitPayment() {
    if (!activeMess || !amount) return
    setSubmitting(true)
    setMessage('')
    try {
      await apiClient.submitPayment({
        messId: activeMess.id,
        purchasedBy: paymentPurchasedBy || user?.id,
        amount: Number(amount),
        method,
        paymentDate: paymentDate || undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
      })
      setAmount('')
      setPaymentDate('')
      setSelectedCategories([])
      setPaymentPurchasedBy(user?.id ?? '')
      setShowModal(false)
      setMessageType('success')
      setMessage('Payment submitted successfully.')
      await load()
    } catch (error) {
      setMessageType('error')
      setMessage(getErrorMessage(error, 'Failed to submit payment.'))
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
      setMessage(`Payment ${status.toLowerCase()} successfully.`)
      await load()
    } catch (error) {
      setMessageType('error')
      setMessage(getErrorMessage(error, 'Failed to review payment.'))
    } finally {
      setReviewingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this payment?')) return
    setDeletingId(id)
    setMessage('')
    try {
      await apiClient.deletePayment(id)
      setMessageType('success')
      setMessage('Payment deleted successfully.')
      await load()
    } catch (error) {
      setMessageType('error')
      setMessage(getErrorMessage(error, 'Failed to delete payment.'))
    } finally {
      setDeletingId(null)
    }
  }

  function toggleCategory(cat: string) {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
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
    <div className="min-h-screen bg-[#fafcff]">
      <DashboardHeader title="Payments" description="Approve member payments and track transaction status" />

      <div className="p-4 sm:p-6 lg:p-8">
        {message && (
          <div className={`mb-5 rounded-xl px-4 py-3 text-sm font-bold shadow-sm ${messageType === 'error' ? 'border border-red-200/70 bg-red-50 text-red-700' : 'border border-emerald-200/60 bg-emerald-50 text-emerald-700'}`}>
            {message}
          </div>
        )}

        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-green-100 shadow-sm">
              <Wallet size={24} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#172554]">Payment Requests</h2>
              <p className="mt-0.5 text-xs font-semibold text-[#6b7a99]">{payments.length} payment{payments.length !== 1 ? 's' : ''} recorded</p>
            </div>
          </div>
          <Button onClick={() => { setPaymentPurchasedBy(user?.id ?? ''); setShowModal(true) }} className="h-[45px] gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-5 font-black text-white shadow-[0_8px_20px_rgba(47,128,237,0.25)] transition hover:shadow-[0_12px_28px_rgba(47,128,237,0.32)]">
            <Plus size={18} /> Submit Payment
          </Button>
        </div>

        {/* Summary Cards */}
        {!loading && payments.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="dashboard-subtle-card rounded-xl p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#6b7a99]"><CreditCard size={13} className="text-[#2f80ed]" /> Total</p>
              <p className="mt-1.5 text-2xl font-black text-[#172554]">{payments.length}</p>
            </div>
            <div className="dashboard-subtle-card rounded-xl p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-amber-700"><Loader2 size={13} /> Pending</p>
              <p className="mt-1.5 text-2xl font-black text-amber-700">{pendingCount}</p>
            </div>
            <div className="dashboard-subtle-card rounded-xl p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-700"><Check size={13} /> Approved</p>
              <p className="mt-1.5 text-2xl font-black text-emerald-700">{approvedCount}</p>
            </div>
            <div className="dashboard-subtle-card rounded-xl p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#6b7a99]"><Banknote size={13} className="text-[#58d68d]" /> Total Amount</p>
              <p className="mt-1.5 text-2xl font-black text-[#172554]">{money(totalAmount)}</p>
            </div>
          </div>
        )}

        {/* Desktop Filter Toolbar */}
        <div className="hidden sm:flex flex-row flex-wrap items-center gap-2 mb-4">
          <div className="relative w-52">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7c70a8]" />
            <input className="h-[38px] w-full rounded-xl border border-[#d8e6f8] bg-white pl-9 pr-3 text-xs font-semibold text-[#172554] shadow-sm outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10" placeholder="Search by name, method, status..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          </div>
          <label className="box-border flex h-[38px] items-center gap-1.5 rounded-xl border border-[var(--brand-border)] bg-[var(--dashboard-surface)] px-3 shadow-sm transition hover:border-[var(--brand)] focus-within:border-[var(--brand)] focus-within:ring-4 focus-within:ring-[var(--brand-ring)]">
            <CalendarDays size={15} className="shrink-0 text-[var(--brand)]" />
            <input className="!min-h-0 h-full w-[110px] min-w-0 border-0 bg-transparent p-0 text-xs font-bold text-[var(--dashboard-ink)] outline-none ring-0" type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          </label>
          {(searchText || selectedMonth !== new Date().toISOString().slice(0, 7)) && (
            <span className="text-[10px] font-semibold text-[#6b7a99]">Showing {filteredPayments.length} of {payments.length} payments</span>
          )}
        </div>

        {/* Payments Table - Desktop */}
        <div className="hidden overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)] sm:block">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-[#e6ebf4] bg-[#f8faff]">
                {['Paid by', 'Added by', 'Amount', 'Status'].map((heading) => <th key={heading} className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">{heading}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6ebf4]">
              {loading && (
                <tr><td colSpan={4} className="px-5 py-12 text-center"><div className="flex items-center justify-center gap-2 text-sm font-bold text-[#6b7a99]"><Loader2 size={18} className="animate-spin text-[#2f80ed]" /> Loading payments...</div></td></tr>
              )}
              {!loading && filteredPayments.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center gap-2"><Wallet size={40} className="text-[#d8e6f8]" />
                    <p className="text-sm font-bold text-[#6b7a99]">{payments.length === 0 ? 'No payment records yet.' : 'No payments match your filters.'}</p>
                    <p className="text-xs font-semibold text-[#8a9bb5]">{payments.length === 0 ? 'Click "Submit Payment" to add one.' : 'Try changing the month or search term.'}</p>
                  </div>
                </td></tr>
              )}
              {!loading && filteredPayments.map((payment) => {
                const statusCfg = STATUS_CONFIG[payment.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING

                return (
                  <tr key={payment.id} onClick={() => { setViewingPayment(payment); setShowViewModal(true) }} className="cursor-pointer transition hover:bg-[#f8faff] focus-within:bg-[#f8faff]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2f80ed]/80 to-[#58d68d]/80 text-[10px] font-black text-white shadow-sm">{(payment.member?.name?.[0] || 'M').toUpperCase()}</div>
                        <div><p className="text-sm font-bold text-[#172554]">{payment.member?.name ?? 'Unknown Member'}</p><p className="text-xs font-semibold text-[#6b7a99]">{payment.member?.email ?? ''}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2f80ed]/80 to-[#58d68d]/80 text-[10px] font-black text-white shadow-sm">{(payment.creator?.name?.[0] || 'M').toUpperCase()}</div>
                        <div><p className="text-sm font-bold text-[#172554]">{payment.creator?.name ?? 'Unknown'}</p><p className="text-xs font-semibold text-[#6b7a99]">{payment.creator?.email ?? ''}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-black text-[#172554]">{money(payment.amount)}</td>
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
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Footer Summary */}
          {!loading && payments.length > 0 && (
            <div className="border-t-2 border-[#d8e6f8] bg-[#f8faff] px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#6b7a99]"><User size={14} /> <span><span className="text-[#172554]">{payments.length}</span> payments</span></div>
                <div className="flex items-center gap-4 text-xs font-bold"><span className="text-amber-600">{pendingCount} pending</span><span className="text-emerald-600">{approvedCount} approved</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Filter Toolbar */}
        <div className="flex flex-col gap-3 sm:hidden mb-4">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c70a8]" />
            <input className="h-[46px] w-full rounded-xl border border-[#d8e6f8] bg-white pl-10 pr-3.5 text-sm font-semibold text-[#172554] shadow-sm outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10" placeholder="Search by name, method, status..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          </div>
          <label className="box-border flex h-[46px] items-center gap-2 rounded-xl border border-[var(--brand-border)] bg-[var(--dashboard-surface)] px-3.5 shadow-sm transition hover:border-[var(--brand)] focus-within:border-[var(--brand)] focus-within:ring-4 focus-within:ring-[var(--brand-ring)]">
            <CalendarDays size={17} className="shrink-0 text-[var(--brand)]" />
            <input className="!min-h-0 h-full w-full min-w-0 border-0 bg-transparent p-0 text-sm font-bold text-[var(--dashboard-ink)] outline-none ring-0" type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
          </label>
        </div>

        {/* Payments - Mobile Cards */}
        <div className="space-y-3 sm:hidden">
          {loading && <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-[#2f80ed]" /></div>}
          {!loading && filteredPayments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12"><Wallet size={40} className="mb-2 text-[#d8e6f8]" /><p className="text-sm font-bold text-[#6b7a99]">{payments.length === 0 ? 'No payment records yet.' : 'No payments match your filters.'}</p><p className="text-xs font-semibold text-[#8a9bb5]">{payments.length === 0 ? 'Click "Submit Payment" to add one.' : 'Try changing the month or search term.'}</p></div>
          )}
          {!loading && filteredPayments.map((payment) => {
            const methodCfg = PAYMENT_METHOD_CONFIG[payment.method as PaymentMethod] || PAYMENT_METHOD_CONFIG.CASH
            const statusCfg = STATUS_CONFIG[payment.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
            const isOwn = payment.member?.id === user?.id
            const canDelete = isOwn || isManager
            const isDeleting = deletingId === payment.id

            return (
              <div key={payment.id} className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm transition hover:border-[#a9ccfb]">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2f80ed]/80 to-[#58d68d]/80 text-[10px] font-black text-white shadow-sm">{(payment.member?.name?.[0] || 'M').toUpperCase()}</div>
                    <div className="min-w-0"><p className="truncate text-sm font-bold text-[#172554]">{payment.member?.name ?? 'Unknown Member'}</p><p className="truncate text-xs font-semibold text-[#6b7a99]">{payment.member?.email ?? ''}</p></div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: statusCfg.bg, color: statusCfg.color, borderColor: statusCfg.border }}>
                    {payment.status === 'PENDING' && <Loader2 size={10} className="animate-spin" />}
                    {payment.status === 'APPROVED' && <Check size={10} />}
                    {payment.status === 'REJECTED' && <Ban size={10} />}
                    {statusCfg.label}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#f8faff] p-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold" style={{ backgroundColor: methodCfg.bg, color: methodCfg.color, borderColor: `${methodCfg.color}33` }}>{methodCfg.icon}{methodCfg.label}</span>
                    <div className="text-xs font-semibold text-[#6b7a99]">
                      <span><CalendarDays size={11} className="inline mr-1 text-[#ffb84d]" />{formatDate(payment.created_at)}</span>
                      {payment.payment_date && <div className="text-[10px] text-[#6b7a99]/70 mt-0.5"><CalendarDays size={9} className="inline mr-1 text-[#a0b4d6]" />For: {formatDateShort(payment.payment_date)}</div>}
                    </div>
                  </div>
                  <p className="text-sm font-black text-[#172554]">{money(payment.amount)}</p>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-[#6b7a99]">
                  <span>Purchased by</span>
                  <span className="text-[#172554]">
                    {payment.member?.name ?? 'Unknown Member'}
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between text-xs font-semibold text-[#6b7a99]">
                  <span>Added by</span>
                  <span className="text-[#172554]">
                    {payment.creator?.name ?? 'Unknown'}
                  </span>
                </div>

                {(payment.categories ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {payment.categories.map((cat) => {
                      const cfg = EXPENSE_CATEGORIES.find(c => c.value === cat)
                      return <span key={cat} className="inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold" style={{ backgroundColor: cfg?.bg ?? '#f9fafb', color: cfg?.color ?? '#6b7280', borderColor: `${cfg?.color ?? '#6b7280'}33` }}>{cfg?.label ?? cat}</span>
                    })}
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <button onClick={() => { setViewingPayment(payment); setShowViewModal(true) }} className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#2f80ed]/20 bg-[#e7f1ff] text-xs font-bold text-[#2f80ed] transition hover:border-[#2f80ed]/40 hover:bg-[#dcebff]"><Eye size={13} /> View</button>
                  {payment.status === 'PENDING' && isManager && (
                    <>
                      <button onClick={() => review(payment.id, 'APPROVED')} disabled={reviewingId === payment.id} className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-50 text-xs font-bold text-emerald-600 transition hover:border-emerald-500/40 hover:bg-emerald-100 disabled:opacity-60">{reviewingId === payment.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}Approve</button>
                      <button onClick={() => review(payment.id, 'REJECTED')} disabled={reviewingId === payment.id} className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-50 text-xs font-bold text-red-600 transition hover:border-red-500/40 hover:bg-red-100 disabled:opacity-60"><X size={13} /> Reject</button>
                    </>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDelete(payment.id)} disabled={isDeleting} className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-50 text-red-600 disabled:opacity-60"><Trash2 size={13} /></button>
                  )}
                </div>
              </div>
            )
          })}
          {!loading && payments.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-[#e6ebf4] bg-[#f8faff] px-4 py-3"><p className="text-xs font-bold text-[#6b7a99]"><span className="text-[#172554]">{payments.length}</span> payments</p><div className="flex gap-3 text-xs font-bold"><span className="text-amber-600">{pendingCount} pending</span><span className="text-emerald-600">{approvedCount} approved</span></div></div>
          )}
        </div>
      </div>

      {/* View Payment Modal */}
      {viewingPayment && (
        <EnterpriseDetailsDrawer
          open={showViewModal}
          onOpenChange={(open) => { setShowViewModal(open); if (!open) setViewingPayment(null) }}
          eyebrow="Payment"
          title="Payment details"
          description={viewingPayment.member?.email ?? 'Payment request and transaction information.'}
          headerIcon={<CreditCard className="size-5" />}
          footer={<div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setShowViewModal(false); setViewingPayment(null) }} className="min-h-11 flex-1 rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] px-4 font-black text-muted-foreground transition hover:bg-[var(--dashboard-hover)]">Close</button>{viewingPayment.status === 'PENDING' && isManager && <><button type="button" onClick={() => { void review(viewingPayment.id, 'APPROVED'); setShowViewModal(false); setViewingPayment(null) }} className="min-h-11 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-700">Approve</button><button type="button" onClick={() => { void review(viewingPayment.id, 'REJECTED'); setShowViewModal(false); setViewingPayment(null) }} className="min-h-11 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-600 hover:bg-rose-100">Reject</button></>}</div>}
        >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#2f80ed]/80 to-[#58d68d]/80 text-sm font-black text-white shadow-sm">{(viewingPayment.member?.name?.[0] || 'M').toUpperCase()}</div>
                  <div><p className="text-base font-bold text-[#172554]">{viewingPayment.member?.name ?? 'Unknown'}</p><p className="text-xs font-semibold text-[#6b7a99]">{viewingPayment.member?.email ?? ''}</p></div>
                </div>
                <div className="rounded-xl bg-gradient-to-r from-[#f8faff] to-white border border-[#e6ebf4] p-4">
                  <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-[#6b7a99]">Amount</span><span className="text-2xl font-black text-[#172554]">{money(viewingPayment.amount)}</span></div>
                  <div className="flex items-center justify-between"><span className="text-xs font-bold text-[#6b7a99]">Method</span>
                    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: PAYMENT_METHOD_CONFIG[viewingPayment.method as PaymentMethod]?.bg ?? '#f9fafb', color: PAYMENT_METHOD_CONFIG[viewingPayment.method as PaymentMethod]?.color ?? '#6b7280', borderColor: `${PAYMENT_METHOD_CONFIG[viewingPayment.method as PaymentMethod]?.color ?? '#6b7280'}33` }}>
                      {PAYMENT_METHOD_CONFIG[viewingPayment.method as PaymentMethod]?.icon}{PAYMENT_METHOD_CONFIG[viewingPayment.method as PaymentMethod]?.label ?? viewingPayment.method}
                    </span>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-black uppercase text-[#6b7a99]">Purchased By</p>
                    <p className="mt-1 text-sm font-bold text-[#172554]">{viewingPayment.member?.name ?? 'Unknown Member'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-[10px] font-black uppercase text-[#6b7a99]">Added By</p>
                    <p className="mt-1 text-sm font-bold text-[#172554]">{viewingPayment.creator?.name ?? 'Unknown'}</p>
                  </div>
                </div>
                {viewingPayment.categories && viewingPayment.categories.length > 0 && (
                  <div><p className="mb-2 text-xs font-bold text-[#6b7a99]">Categories</p>
                    <div className="flex flex-wrap gap-1.5">{viewingPayment.categories.map((cat) => {
                      const cfg = EXPENSE_CATEGORIES.find(c => c.value === cat)
                      return <span key={cat} className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold" style={{ backgroundColor: cfg?.bg ?? '#f9fafb', color: cfg?.color ?? '#6b7280', borderColor: `${cfg?.color ?? '#6b7280'}33` }}>{cfg?.label ?? cat}</span>
                    })}</div>
                  </div>
                )}
                {viewingPayment.note && <div><p className="mb-1 text-xs font-bold text-[#6b7a99]">Note</p><p className="rounded-xl bg-[#f8faff] p-3 text-sm font-semibold text-[#53617d]">{viewingPayment.note}</p></div>}
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6b7a99]"><CalendarDays size={13} className="text-[#ffb84d]" /> Submitted: {formatDate(viewingPayment.created_at)}</p>
              </div>
        </EnterpriseDetailsDrawer>
      )}

      {/* Submit Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#120a33]/65 p-4 backdrop-blur-md" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="relative w-full max-w-[520px] overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-[0_28px_80px_rgba(65,103,153,0.26)] backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#2f80ed] via-[#58d68d] to-[#ffb84d]" />
            <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-[#2f80ed]/12 blur-2xl" />

            <div className="relative flex items-center justify-between border-b border-[#d8e6f8] px-5 py-5 sm:px-6">
              <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f80ed]">Payment</p><h2 className="mt-1 text-xl font-black text-[#172554]">Submit Payment</h2></div>
              <button type="button" onClick={() => { setShowModal(false); setSelectedCategories([]) }} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8e6f8] bg-[#e7f1ff] text-[#2f80ed] transition hover:border-[#a9ccfb] hover:bg-[#dcebff]"><X size={18} /></button>
            </div>

            <div className="relative p-5 sm:p-6 max-h-[65vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Amount (৳)</label>
                  <input className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10" type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Payment Date</label>
                  <input className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                </div>

                {isManager && purchasedByMemberOptions.length > 0 && (
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Purchased By</label>
                    <select
                      className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      value={paymentPurchasedBy}
                      onChange={(e) => setPaymentPurchasedBy(e.target.value)}
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
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {methods.map((m) => {
                      const cfg = PAYMENT_METHOD_CONFIG[m]
                      const selected = method === m
                      return (
                        <button key={m} type="button" onClick={() => setMethod(m)} className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-bold transition active:scale-[0.98] ${selected ? 'border-[#2f80ed]/40 bg-[#e7f1ff] text-[#2f80ed] shadow-sm' : 'border-[#d8e6f8] bg-white text-[#6b7a99] hover:border-[#a9ccfb] hover:bg-[#f8faff]'}`}>
                          <span className="text-base">{cfg.icon}</span>{cfg.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Payment Category (optional - select multiple)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {EXPENSE_CATEGORIES.map((cat) => {
                      const selected = selectedCategories.includes(cat.value)
                      return (
                        <button key={cat.value} type="button" onClick={() => toggleCategory(cat.value)} className={`flex items-center gap-1.5 rounded-xl border py-2.5 px-3 text-xs font-bold transition active:scale-[0.98] ${selected ? 'border-[#2f80ed]/40 bg-[#e7f1ff] text-[#2f80ed] shadow-sm' : 'border-[#d8e6f8] bg-white text-[#6b7a99] hover:border-[#a9ccfb] hover:bg-[#f8faff]'}`}>
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
                          <span key={cat} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: cfg?.bg ?? '#f9fafb', color: cfg?.color ?? '#6b7280', borderColor: `${cfg?.color ?? '#6b7280'}33` }}>
                            {cfg?.label ?? cat}<button onClick={() => toggleCategory(cat)} className="hover:opacity-70"><X size={10} /></button>
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.6fr]">
                <button type="button" onClick={() => { setShowModal(false); setSelectedCategories([]) }} disabled={submitting} className="h-12 rounded-xl border border-[#d8e6f8] bg-white px-4 font-black text-[#53617d] transition hover:bg-[#edf5ff] disabled:opacity-60">Cancel</button>
                <button type="button" onClick={submitPayment} disabled={submitting || !amount || !activeMess} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-4 font-black text-white shadow-[0_16px_35px_rgba(47,128,237,0.30)] transition hover:shadow-[0_20px_42px_rgba(47,128,237,0.38)] disabled:opacity-70">
                  {submitting ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                  {submitting ? 'Submitting...' : 'Submit Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
