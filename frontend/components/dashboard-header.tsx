'use client'

import { useAuth } from '@/app/context/auth-context'
import { Bell, CalendarDays, ChevronDown, Plus, LogOut, Settings, Mail, ChevronRight, X, Loader2, ShoppingBag, CreditCard, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { apiClient, type AppNotification, type PaymentMethod, type ExpenseCategory, type Mess } from '@/lib/api-client'

interface DashboardHeaderProps {
  title: string
  description?: string
  selectedMonth?: string
  onMonthChange?: (month: string) => void
  showUpgradeButton?: boolean
  upgradeHref?: string
}

function formatMonthLabel(month?: string) {
  const date = month ? new Date(`${month}-01T00:00:00`) : new Date()
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getCurrentMonthValue() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e']

const avatarColor = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const expenseCategories: ExpenseCategory[] = [
  'GROCERY', 'FOOD', 'UTILITY', 'RENT', 'GAS', 'ELECTRICITY', 'WIFI', 'CLEANER', 'MAINTENANCE', 'OTHER',
]

const paymentMethods: PaymentMethod[] = ['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK']

export function DashboardHeader({ title, description, selectedMonth, onMonthChange, showUpgradeButton, upgradeHref = '/dashboard/contact?source=UPGRADE&plan=MONTHLY' }: DashboardHeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [imageError, setImageError] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const monthInputRef = useRef<HTMLInputElement>(null)
  const avatarBg = avatarColor(user?.name || 'User')

  // Quick Add Modal state
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickAddTab, setQuickAddTab] = useState<'expense' | 'payment'>('expense')

  // Expense form state
  const [expItemName, setExpItemName] = useState('')
  const [expAmount, setExpAmount] = useState('')
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('FOOD')
  const [expQuantity, setExpQuantity] = useState('')
  const [expUnit, setExpUnit] = useState('')
  const [expSubmitting, setExpSubmitting] = useState(false)

  // Payment form state
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<PaymentMethod>('BKASH')
  const [paySubmitting, setPaySubmitting] = useState(false)

  const isAdmin = user?.role === 'ADMIN'
  const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'ORGANIZER'
  const canUseQuickAdd = !isAdmin // Hide for admin

  const loadNotifications = async () => {
    try {
      const [notificationResponse, countResponse] = await Promise.all([
        apiClient.getMyNotifications({ limit: 5 }),
        apiClient.getUnreadNotificationCount(),
      ])
      setNotifications(Array.isArray(notificationResponse.data) ? notificationResponse.data : [])
      setUnreadCount(countResponse.data?.count ?? 0)
    } catch {
      setNotifications([])
      setUnreadCount(0)
    }
  }

  useEffect(() => {
    void loadNotifications()
    const handleFocus = () => void loadNotifications()
    const handleNotificationsChanged = () => void loadNotifications()
    window.addEventListener('focus', handleFocus)
    window.addEventListener('notifications:changed', handleNotificationsChanged)
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('notifications:changed', handleNotificationsChanged)
    }
  }, [])

  const markAsRead = async (notification: AppNotification) => {
    const alreadyRead = notification.reads?.some((read) => read.user_id === user?.id)
    if (!alreadyRead) {
      setUnreadCount((current) => Math.max(0, current - 1))
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                reads: [
                  ...(item.reads ?? []),
                  { user_id: user?.id ?? '', read_at: new Date().toISOString() },
                ],
              }
            : item,
        ),
      )
      await apiClient.markNotificationAsRead(notification.id).catch(() => {
        void loadNotifications()
      })
    }
  }

  const openMonthPicker = () => {
    const input = monthInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null
    if (!input || !onMonthChange) return

    if (typeof input.showPicker === 'function') {
      input.showPicker()
      return
    }

    input.focus()
    input.click()
  }

  async function handleQuickAddExpense() {
    if (!expAmount || !expItemName) return
    setExpSubmitting(true)
    try {
      const messRes = await apiClient.getMesses().catch(() => null)
      const list = Array.isArray(messRes?.data) ? messRes.data : messRes?.data ? [messRes.data] : []
      const activeMess = list[0] ?? user?.memberships?.[0]?.mess
      if (!activeMess) return

      await apiClient.createExpense({
        messId: activeMess.id,
        category: expCategory,
        amount: Number(expAmount),
        itemName: expItemName,
        quantity: expQuantity ? Number(expQuantity) : undefined,
        unit: expUnit || undefined,
        expenseDate: new Date().toISOString().slice(0, 10),
      })
      setShowQuickAdd(false)
      resetExpenseForm()
    } finally {
      setExpSubmitting(false)
    }
  }

  async function handleQuickAddPayment() {
    if (!payAmount) return
    setPaySubmitting(true)
    try {
      const messRes = await apiClient.getMesses().catch(() => null)
      const list = Array.isArray(messRes?.data) ? messRes.data : messRes?.data ? [messRes.data] : []
      const activeMess = list[0] ?? user?.memberships?.[0]?.mess
      if (!activeMess) return

      await apiClient.submitPayment({ messId: activeMess.id, amount: Number(payAmount), method: payMethod })
      setShowQuickAdd(false)
      setPayAmount('')
    } finally {
      setPaySubmitting(false)
    }
  }

  function resetExpenseForm() {
    setExpItemName('')
    setExpAmount('')
    setExpCategory('FOOD')
    setExpQuantity('')
    setExpUnit('')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[#e6ebf4] bg-white shadow-sm">
      <div className="flex min-h-[72px] flex-col gap-2 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex gap-3 pr-3 top-0">
          <div>
            <h1 className="text-[20px] font-black tracking-tight text-[#172554]">{title}</h1>
            {description && <p className="mt-1 text-sm font-semibold text-[#6b7a99]">{description}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Picker */}
          {onMonthChange && (
            <button
              type="button"
              onClick={openMonthPicker}
              className="relative hidden h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#e6ebf4] bg-white px-4 text-sm font-bold text-[#53617d] shadow-sm transition hover:border-[#a9ccfb] hover:bg-[#f8faff] hover:shadow-md sm:flex"
            >
              <CalendarDays size={16} className="text-[#2f80ed]" />
              <span className="min-w-[120px]">{formatMonthLabel(selectedMonth)}</span>
              {onMonthChange && (
                <input
                  ref={monthInputRef}
                  type="month"
                  value={selectedMonth ?? getCurrentMonthValue()}
                  onChange={(event) => onMonthChange(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  className="absolute left-0 top-full h-0 w-0 opacity-0"
                  aria-label="Select dashboard month"
                />
              )}
            </button>
          )}

          {/* Quick Add Dropdown - Hidden for Admin */}
          {canUseQuickAdd && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#e6ebf4] bg-white px-4 text-sm font-bold text-[#53617d] shadow-sm transition hover:border-[#a9ccfb] hover:bg-[#f8faff] hover:shadow-md data-[state=open]:border-[#a9ccfb] data-[state=open]:bg-[#f8faff]"
                >
                  <Plus size={16} className="text-[#2f80ed]" />
                  Quick Add
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[280px] border border-[#e6ebf4] shadow-[0_8px_30px_rgba(65,103,153,0.12)] p-2">
                <DropdownMenuItem
                  onClick={() => router.push('/dashboard/finance')}
                  className="group cursor-pointer gap-4 rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-gradient-to-r hover:from-[#2f80ed] hover:to-[#3b8cff] focus:bg-gradient-to-r focus:from-[#2f80ed] focus:to-[#3b8cff]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-50 to-red-100 transition group-hover:bg-white/20">
                    <ShoppingBag size={18} className="text-red-500 transition group-hover:text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#172554] transition group-hover:text-white">Add Expense</p>
                    <p className="text-xs font-semibold text-[#6b7a99] transition group-hover:text-white/80">Record a new expense</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#e6ebf4] my-1.5" />
                <DropdownMenuItem
                  onClick={() => router.push('/dashboard/payments')}
                  className="group cursor-pointer gap-4 rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-gradient-to-r hover:from-[#2f80ed] hover:to-[#3b8cff] focus:bg-gradient-to-r focus:from-[#2f80ed] focus:to-[#3b8cff]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-green-100 transition group-hover:bg-white/20">
                    <CreditCard size={18} className="text-emerald-600 transition group-hover:text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#172554] transition group-hover:text-white">Submit Payment</p>
                    <p className="text-xs font-semibold text-[#6b7a99] transition group-hover:text-white/80">Record a new payment</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {showUpgradeButton && (
            <Button
              type="button"
              onClick={() => router.push(upgradeHref)}
              className="h-11 rounded-xl bg-gradient-to-r from-[#f59e0b] to-[#f97316] px-4 font-black text-white shadow-[0_8px_20px_rgba(245,158,11,0.25)] transition hover:from-[#ed8f07] hover:to-[#ea6b12]"
            >
              <Mail size={16} />
              Upgrade
            </Button>
          )}

          {/* Notifications */}
          <DropdownMenu onOpenChange={(open) => open && void loadNotifications()}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-[#e6ebf4] bg-white shadow-sm transition hover:border-[#a9ccfb] hover:bg-[#f8faff] hover:shadow-md data-[state=open]:border-[#a9ccfb] data-[state=open]:bg-[#f8faff]"
              >
                <Bell size={18} className="text-[#53617d]" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-[#ff4d4f] to-[#ff2e55] px-1 text-[9px] font-black leading-none text-white shadow-[0_4px_8px_rgba(255,77,79,0.3)]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[340px] p-2 border border-[#e6ebf4] shadow-[0_8px_30px_rgba(65,103,153,0.12)]">
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="p-0 text-sm font-black text-[#172554]">
                  Notifications
                </DropdownMenuLabel>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/notifications')}
                  className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold text-[#2f80ed] transition hover:bg-[#e7f1ff]"
                >
                  View all
                </button>
              </div>
              <DropdownMenuSeparator className="bg-[#e6ebf4]" />
              {notifications.length ? (
                notifications.map((notification) => {
                  const isRead = notification.reads?.some((read) => read.user_id === user?.id)
                  return (
                    <DropdownMenuItem
                      key={notification.id}
                      onClick={async () => {
                        await markAsRead(notification)
                        router.push('/dashboard/notifications')
                      }}
                      className="cursor-pointer items-start gap-3 rounded-lg p-3 transition hover:bg-[#f8faff] focus:bg-[#f8faff]"
                    >
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isRead ? 'bg-[#cbd5e1]' : 'bg-[#ff2e55]'}`} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-[#172554]">
                          {notification.title}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs font-semibold text-[#667085]">
                          {notification.body}
                        </span>
                      </span>
                    </DropdownMenuItem>
                  )
                })
              ) : (
                <div className="px-2 py-8 text-center text-sm font-semibold text-[#667085]">
                  No notifications yet.
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#e6ebf4] bg-white px-2 pr-3 shadow-sm transition hover:border-[#a9ccfb] hover:bg-[#f8faff] hover:shadow-md data-[state=open]:border-[#a9ccfb] data-[state=open]:bg-[#f8faff]"
              >
                {user?.avatar_url && !imageError ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="h-7 w-7 rounded-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black shadow-sm"
                    style={{
                      backgroundColor: `${avatarBg}20`,
                      color: avatarBg,
                    }}
                  >
                    {getInitials(user?.name || 'M')}
                  </div>
                )}
                <span className="hidden max-w-[100px] truncate text-sm font-bold text-[#172554] sm:inline">{user?.name}</span>
                <ChevronDown size={14} className="text-[#667085]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border border-[#e6ebf4] shadow-[0_8px_30px_rgba(65,103,153,0.12)]">
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-black"
                    style={{
                      backgroundColor: `${avatarBg}18`,
                      borderColor: `${avatarBg}55`,
                      color: avatarBg,
                    }}
                  >
                    {getInitials(user?.name || 'U')}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#172554]">{user?.name}</p>
                    <p className="truncate text-xs font-semibold text-[#6b7a99]">{user?.email}</p>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-[#e6ebf4]" />
              <DropdownMenuItem
                onClick={() => router.push('/dashboard/settings')}
                className="cursor-pointer gap-2 px-3 py-2.5 text-sm font-semibold text-[#53617d] transition hover:bg-[#f8faff]"
              >
                <Settings size={16} className="text-[#2f80ed]" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#e6ebf4]" />
              <DropdownMenuItem
                onClick={() => {
                  logout()
                  router.push('/login')
                }}
                className="cursor-pointer gap-2 px-3 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"
              >
                <LogOut size={16} />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#120a33]/65 p-4 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && setShowQuickAdd(false)}
        >
          <div className="relative w-full max-w-[480px] overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-[0_28px_80px_rgba(65,103,153,0.26)] backdrop-blur-xl">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#2f80ed] via-[#58d68d] to-[#ffb84d]" />
            <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-[#2f80ed]/12 blur-2xl" />

            {/* Modal Header */}
            <div className="relative flex items-center justify-between border-b border-[#d8e6f8] px-5 py-5 sm:px-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#2f80ed]">Quick Add</p>
                <h2 className="mt-1 text-xl font-black text-[#172554]">Add New Entry</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8e6f8] bg-[#e7f1ff] text-[#2f80ed] transition hover:border-[#a9ccfb] hover:bg-[#dcebff]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex border-b border-[#e6ebf4]">
              <button
                onClick={() => setQuickAddTab('expense')}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition ${
                  quickAddTab === 'expense'
                    ? 'text-[#2f80ed] border-b-2 border-[#2f80ed] bg-[#f8faff]'
                    : 'text-[#6b7a99] hover:text-[#2f80ed] hover:bg-[#f8faff]'
                }`}
              >
                <ShoppingBag size={16} />
                Add Expense
              </button>
              <button
                onClick={() => setQuickAddTab('payment')}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition ${
                  quickAddTab === 'payment'
                    ? 'text-[#2f80ed] border-b-2 border-[#2f80ed] bg-[#f8faff]'
                    : 'text-[#6b7a99] hover:text-[#2f80ed] hover:bg-[#f8faff]'
                }`}
              >
                <CreditCard size={16} />
                Submit Payment
              </button>
            </div>

            {/* Expense Form */}
            {quickAddTab === 'expense' && (
              <div className="p-5 sm:p-6 space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Item Name</label>
                  <input
                    className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                    placeholder="e.g. Rice, Eggs..."
                    value={expItemName}
                    onChange={(e) => setExpItemName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Qty</label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-3 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      placeholder="Qty"
                      value={expQuantity}
                      onChange={(e) => setExpQuantity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Unit</label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-3 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      placeholder="kg"
                      value={expUnit}
                      onChange={(e) => setExpUnit(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Price (৳)</label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-3 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      type="number"
                      placeholder="Amount"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Category</label>
                  <select
                    className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-bold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                  >
                    {expenseCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleQuickAddExpense}
                  disabled={expSubmitting || !expItemName || !expAmount}
                  className="inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-4 font-black text-white shadow-[0_16px_35px_rgba(47,128,237,0.30)] transition hover:shadow-[0_20px_42px_rgba(47,128,237,0.38)] disabled:opacity-70"
                >
                  {expSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
                  {expSubmitting ? 'Adding...' : 'Add Expense'}
                </button>
              </div>
            )}

            {/* Payment Form */}
            {quickAddTab === 'payment' && (
              <div className="p-5 sm:p-6 space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Amount (৳)</label>
                  <input
                    className="h-[48px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#7a8aaa] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                    type="number"
                    placeholder="Enter amount"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {paymentMethods.map((m) => {
                      const selected = payMethod === m
                      const labels: Record<string, string> = { CASH: 'Cash', BKASH: 'bKash', NAGAD: 'Nagad', ROCKET: 'Rocket', BANK: 'Bank' }
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPayMethod(m)}
                          className={`flex items-center justify-center gap-1.5 rounded-xl border py-3 text-xs font-bold transition active:scale-[0.98] ${
                            selected
                              ? 'border-[#2f80ed]/40 bg-[#e7f1ff] text-[#2f80ed] shadow-sm'
                              : 'border-[#d8e6f8] bg-white text-[#6b7a99] hover:border-[#a9ccfb] hover:bg-[#f8faff]'
                          }`}
                        >
                          <CreditCard size={14} />
                          {labels[m] || m}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleQuickAddPayment}
                  disabled={paySubmitting || !payAmount}
                  className="inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-4 font-black text-white shadow-[0_16px_35px_rgba(47,128,237,0.30)] transition hover:shadow-[0_20px_42px_rgba(47,128,237,0.38)] disabled:opacity-70"
                >
                  {paySubmitting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                  {paySubmitting ? 'Submitting...' : 'Submit Payment'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
