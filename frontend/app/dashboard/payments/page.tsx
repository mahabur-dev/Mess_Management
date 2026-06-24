'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { apiClient, type Mess, type Payment, type PaymentMethod } from '@/lib/api-client'
import { useAuth } from '@/app/context/auth-context'
import { Check, CreditCard, Loader2, Plus, X, Wallet, Banknote, Smartphone, Landmark, Building2, CalendarDays, User, Ban } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAutoDismissMessage } from '@/hooks/use-auto-dismiss-message'

const methods: PaymentMethod[] = ['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK']

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

function money(value: number | string | undefined | null) {
  return `৳ ${Number(value ?? 0).toLocaleString()}`
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export default function PaymentsPage() {
  const [messes, setMesses] = useState<Mess[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('BKASH')
  const { user } = useAuth()
  const activeMess = messes[0] ?? user?.memberships?.[0]?.mess
  const isAdmin = user?.role === 'ADMIN'
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'ORGANIZER'
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

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
      if (list[0]) {
        const paymentRes = isManager ? await apiClient.getPaymentsByMess(list[0].id).catch(() => null) : await apiClient.getMyPayments().catch(() => null)
        setPayments(Array.isArray(paymentRes?.data) ? paymentRes.data : [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user?.role])

  async function submitPayment() {
    if (!activeMess || !amount) return
    setSubmitting(true)
    setMessage('')
    try {
      await apiClient.submitPayment({ messId: activeMess.id, amount: Number(amount), method })
      setAmount('')
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

  // Summary calculations
  const pendingCount = payments.filter(p => p.status === 'PENDING').length
  const approvedCount = payments.filter(p => p.status === 'APPROVED').length
  const totalAmount = payments.reduce((s, p) => s + Number(p.amount || 0), 0)

  return (
    <div className="min-h-screen bg-[#fafcff]">
      <DashboardHeader title="Payments" description="Approve member payments and track transaction status" />

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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-green-100 shadow-sm">
              <Wallet size={24} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#172554]">Payment Requests</h2>
              <p className="mt-0.5 text-xs font-semibold text-[#6b7a99]">
                {payments.length} payment{payments.length !== 1 ? 's' : ''} recorded
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="h-[45px] gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-5 font-black text-white shadow-[0_8px_20px_rgba(47,128,237,0.25)] transition hover:shadow-[0_12px_28px_rgba(47,128,237,0.32)]"
          >
            <Plus size={18} />
            Submit Payment
          </Button>
        </div>

        {/* Summary Cards */}
        {!loading && payments.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#6b7a99]">
                <CreditCard size={13} className="text-[#2f80ed]" />
                Total
              </p>
              <p className="mt-1.5 text-2xl font-black text-[#172554]">{payments.length}</p>
            </div>
            <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-amber-700">
                <Loader2 size={13} />
                Pending
              </p>
              <p className="mt-1.5 text-2xl font-black text-amber-700">{pendingCount}</p>
            </div>
            <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                <Check size={13} />
                Approved
              </p>
              <p className="mt-1.5 text-2xl font-black text-emerald-700">{approvedCount}</p>
            </div>
            <div className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm">
              <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#6b7a99]">
                <Banknote size={13} className="text-[#58d68d]" />
                Total Amount
              </p>
              <p className="mt-1.5 text-2xl font-black text-[#172554]">{money(totalAmount)}</p>
            </div>
          </div>
        )}

        {/* Payments Table - Desktop */}
        <div className="hidden sm:block overflow-hidden rounded-xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e6ebf4] bg-[#f8faff]">
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Member</th>
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Method</th>
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Amount</th>
                <th className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Date</th>
                <th className="whitespace-nowrap px-5 py-4 text-center text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Status</th>
                {isManager && <th className="whitespace-nowrap px-5 py-4 text-right text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6ebf4]">
              {loading && (
                <tr>
                  <td colSpan={isManager ? 7 : 6} className="px-5 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm font-bold text-[#6b7a99]">
                      <Loader2 size={18} className="animate-spin text-[#2f80ed]" />
                      Loading payments...
                    </div>
                  </td>
                </tr>
              )}
              {!loading && payments.length === 0 && (
                <tr>
                  <td colSpan={isManager ? 7 : 6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Wallet size={40} className="text-[#d8e6f8]" />
                      <p className="text-sm font-bold text-[#6b7a99]">No payment records yet.</p>
                      <p className="text-xs font-semibold text-[#8a9bb5]">Click "Submit Payment" to add one.</p>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && payments.map((payment) => {
                const methodCfg = PAYMENT_METHOD_CONFIG[payment.method as PaymentMethod] || PAYMENT_METHOD_CONFIG.CASH
                const statusCfg = STATUS_CONFIG[payment.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
                const isReviewing = reviewingId === payment.id

                return (
                  <tr key={payment.id} className="transition hover:bg-[#f8faff] group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2f80ed]/80 to-[#58d68d]/80 text-[10px] font-black text-white shadow-sm">
                          {(payment.member?.name?.[0] || 'M').toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#172554]">{payment.member?.name ?? 'Unknown Member'}</p>
                          <p className="text-xs font-semibold text-[#6b7a99]">{payment.member?.email ?? ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold"
                        style={{ backgroundColor: methodCfg.bg, color: methodCfg.color, borderColor: `${methodCfg.color}33` }}
                      >
                        {methodCfg.icon}
                        {methodCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-black text-[#172554]">{money(payment.amount)}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b7a99]">
                        <CalendarDays size={13} className="text-[#ffb84d]" />
                        {formatDate(payment.created_at)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        <span
                          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold"
                          style={{ backgroundColor: statusCfg.bg, color: statusCfg.color, borderColor: statusCfg.border }}
                        >
                          {payment.status === 'PENDING' && <Loader2 size={11} className="animate-spin" />}
                          {payment.status === 'APPROVED' && <Check size={11} />}
                          {payment.status === 'REJECTED' && <Ban size={11} />}
                          {statusCfg.label}
                        </span>
                      </div>
                    </td>
                    {isManager && (
                      <td className="px-5 py-4">
                        {payment.status === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => review(payment.id, 'APPROVED')}
                              disabled={isReviewing}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-50 text-emerald-600 transition hover:border-emerald-500/40 hover:bg-emerald-100 disabled:opacity-60"
                              title="Approve Payment"
                            >
                              {isReviewing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            </button>
                            <button
                              onClick={() => review(payment.id, 'REJECTED')}
                              disabled={isReviewing}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-50 text-red-600 transition hover:border-red-500/40 hover:bg-red-100 disabled:opacity-60"
                              title="Reject Payment"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Footer Summary */}
          {!loading && payments.length > 0 && (
            <div className="border-t-2 border-[#d8e6f8] bg-[#f8faff] px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#6b7a99]">
                  <User size={14} />
                  <span><span className="text-[#172554]">{payments.length}</span> payments</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-amber-600">{pendingCount} pending</span>
                  <span className="text-emerald-600">{approvedCount} approved</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payments - Mobile Cards */}
        <div className="space-y-3 sm:hidden">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#2f80ed]" />
            </div>
          )}
          {!loading && payments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Wallet size={40} className="mb-2 text-[#d8e6f8]" />
              <p className="text-sm font-bold text-[#6b7a99]">No payment records yet.</p>
              <p className="text-xs font-semibold text-[#8a9bb5]">Click "Submit Payment" to add one.</p>
            </div>
          )}
          {!loading && payments.map((payment) => {
            const methodCfg = PAYMENT_METHOD_CONFIG[payment.method as PaymentMethod] || PAYMENT_METHOD_CONFIG.CASH
            const statusCfg = STATUS_CONFIG[payment.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING
            const isReviewing = reviewingId === payment.id
            
            return (
              <div key={payment.id} className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm transition hover:border-[#a9ccfb]">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2f80ed]/80 to-[#58d68d]/80 text-[10px] font-black text-white shadow-sm">
                      {(payment.member?.name?.[0] || 'M').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#172554]">{payment.member?.name ?? 'Unknown Member'}</p>
                      <p className="truncate text-xs font-semibold text-[#6b7a99]">{payment.member?.email ?? ''}</p>
                    </div>
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold"
                    style={{ backgroundColor: statusCfg.bg, color: statusCfg.color, borderColor: statusCfg.border }}
                  >
                    {payment.status === 'PENDING' && <Loader2 size={10} className="animate-spin" />}
                    {payment.status === 'APPROVED' && <Check size={10} />}
                    {payment.status === 'REJECTED' && <Ban size={10} />}
                    {statusCfg.label}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#f8faff] p-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold" style={{ backgroundColor: methodCfg.bg, color: methodCfg.color, borderColor: `${methodCfg.color}33` }}>
                      {methodCfg.icon}
                      {methodCfg.label}
                    </span>
                    <span className="text-xs font-semibold text-[#6b7a99]">
                      <CalendarDays size={11} className="inline mr-1 text-[#ffb84d]" />
                      {formatDate(payment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm font-black text-[#172554]">{money(payment.amount)}</p>
                </div>

                {isManager && payment.status === 'PENDING' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => review(payment.id, 'APPROVED')}
                      disabled={isReviewing}
                      className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-50 text-xs font-bold text-emerald-600 transition hover:border-emerald-500/40 hover:bg-emerald-100 disabled:opacity-60"
                    >
                      {isReviewing ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      Approve
                    </button>
                    <button
                      onClick={() => review(payment.id, 'REJECTED')}
                      disabled={isReviewing}
                      className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-500/20 bg-red-50 text-xs font-bold text-red-600 transition hover:border-red-500/40 hover:bg-red-100 disabled:opacity-60"
                    >
                      <X size={13} />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {!loading && payments.length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-[#e6ebf4] bg-[#f8faff] px-4 py-3">
              <p className="text-xs font-bold text-[#6b7a99]"><span className="text-[#172554]">{payments.length}</span> payments</p>
              <div className="flex gap-3 text-xs font-bold">
                <span className="text-amber-600">{pendingCount} pending</span>
                <span className="text-emerald-600">{approvedCount} approved</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Payment Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#120a33]/65 p-4 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="relative w-full max-w-[460px] overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-[0_28px_80px_rgba(65,103,153,0.26)] backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#2f80ed] via-[#58d68d] to-[#ffb84d]" />
            <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-[#2f80ed]/12 blur-2xl" />

            <div className="relative flex items-center justify-between border-b border-[#d8e6f8] px-5 py-5 sm:px-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f80ed]">Payment</p>
                <h2 className="mt-1 text-xl font-black text-[#172554]">Submit Payment</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8e6f8] bg-[#e7f1ff] text-[#2f80ed] transition hover:border-[#a9ccfb] hover:bg-[#dcebff]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative p-5 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                    Amount (৳)
                  </label>
                  <input
                    className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {methods.map((m) => {
                      const cfg = PAYMENT_METHOD_CONFIG[m]
                      const selected = method === m
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMethod(m)}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-bold transition active:scale-[0.98] ${
                            selected
                              ? 'border-[#2f80ed]/40 bg-[#e7f1ff] text-[#2f80ed] shadow-sm'
                              : 'border-[#d8e6f8] bg-white text-[#6b7a99] hover:border-[#a9ccfb] hover:bg-[#f8faff]'
                          }`}
                        >
                          <span className="text-base">{cfg.icon}</span>
                          {cfg.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.6fr]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="h-12 rounded-xl border border-[#d8e6f8] bg-white px-4 font-black text-[#53617d] transition hover:bg-[#edf5ff] disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitPayment}
                  disabled={submitting || !amount || !activeMess}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-4 font-black text-white shadow-[0_16px_35px_rgba(47,128,237,0.30)] transition hover:shadow-[0_20px_42px_rgba(47,128,237,0.38)] disabled:opacity-70"
                >
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
