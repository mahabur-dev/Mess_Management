'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { apiClient, type Mess, type SubscriptionPlan, type SubscriptionPlanInfo, type SubscriptionPlanUpdate, type SubscriptionRecord, type SubscriptionStatus } from '@/lib/api-client'
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Edit3,
  Eye,
  Filter,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
  Info,
} from 'lucide-react'

type SubscriptionFormState = {
  messId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  startDate: string
  endDate: string
  days: string
}

type BannerState = {
  type: 'success' | 'error'
  message: string
} | null

type PlanEditState = {
  label: string
  price: string
  days: string
  description: string
  currency: string
  features: string[]
}

const PLAN_ORDER: SubscriptionPlan[] = ['TRIAL', 'MONTHLY', 'YEARLY']

const PLAN_STYLES: Record<SubscriptionPlan, { bg: string; text: string; icon: typeof Clock3 }> = {
  TRIAL: { bg: 'bg-slate-50', text: 'text-slate-700', icon: Clock3 },
  MONTHLY: { bg: 'bg-blue-50', text: 'text-blue-700', icon: CreditCard },
  YEARLY: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Sparkles },
}

const STATUS_STYLES: Record<SubscriptionStatus, { label: string; bg: string; text: string; border: string }> = {
  ACTIVE: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/70' },
  EXPIRED: { label: 'Expired', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200/70' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200/70' },
  PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/70' },
}

function formatDate(value: string | null) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function toDateInputValue(value?: string | null) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

function addDaysToDate(dateValue: string, daysValue: string) {
  const days = Number(daysValue)
  if (!dateValue || Number.isNaN(days) || days <= 0) return ''
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function diffDays(startValue: string, endValue: string) {
  const start = new Date(startValue)
  const end = new Date(endValue)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return ''
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? String(diff) : ''
}

function formatMoney(amount: number, currency = 'BDT') {
  try {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}

function getDaysRemaining(endDate: string | null) {
  if (!endDate) return null
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function subscriptionLabel(value: SubscriptionRecord, plans: Record<string, SubscriptionPlanInfo>) {
  const info = plans[value.plan]
  return `${info?.label ?? value.plan} plan`
}

function emptyForm(messId = ''): SubscriptionFormState {
  return {
    messId,
    plan: 'MONTHLY',
    status: 'ACTIVE',
    startDate: '',
    endDate: '',
    days: '',
  }
}

function emptyPlanEdit(planInfo?: SubscriptionPlanInfo): PlanEditState {
  return {
    label: planInfo?.label ?? '',
    price: planInfo?.price !== undefined ? String(planInfo.price) : '',
    days: planInfo?.days !== undefined ? String(planInfo.days) : '',
    description: planInfo?.description ?? '',
    currency: planInfo?.currency ?? 'BDT',
    features: planInfo?.features ?? [],
  }
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([])
  const [subscriptionPlans, setSubscriptionPlans] = useState<Record<string, SubscriptionPlanInfo>>({})
  const [messes, setMesses] = useState<Mess[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filterPlan, setFilterPlan] = useState<'' | SubscriptionPlan>('')
  const [filterStatus, setFilterStatus] = useState<'' | SubscriptionStatus>('')
  const [banner, setBanner] = useState<BannerState>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [activePlansOpen, setActivePlansOpen] = useState(false)
  const [planEditOpen, setPlanEditOpen] = useState(false)
  const [planEditSaving, setPlanEditSaving] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [planEditForm, setPlanEditForm] = useState<PlanEditState>(emptyPlanEdit())
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionRecord | null>(null)
  const [form, setForm] = useState<SubscriptionFormState>(emptyForm())

  const loadData = useCallback(async () => {
    setLoading(true)

    try {
      const [subscriptionRes, planRes, messRes] = await Promise.all([
        apiClient.getSubscriptions({ limit: 500, sortBy: 'created_at', sortOrder: 'desc' }).catch(() => null),
        apiClient.getSubscriptionPlans().catch(() => null),
        apiClient.getAllMesses({ limit: 500 }).catch(() => null),
      ])

      const subscriptionList = Array.isArray(subscriptionRes?.data) ? subscriptionRes.data : []
      const plans = planRes?.data && typeof planRes.data === 'object' ? planRes.data : {}
      const messList = Array.isArray(messRes?.data) ? messRes.data : []

      setSubscriptions(subscriptionList)
      setSubscriptionPlans(plans)
      setMesses(messList)
    } catch {
      setSubscriptions([])
      setSubscriptionPlans({})
      setMesses([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredSubscriptions = useMemo(() => {
    const term = query.trim().toLowerCase()
    return subscriptions.filter((subscription) => {
      const matchesPlan = !filterPlan || subscription.plan === filterPlan
      const matchesStatus = !filterStatus || subscription.status === filterStatus
      const matchesSearch =
        !term ||
        subscription.mess.name.toLowerCase().includes(term) ||
        (subscription.mess.address ?? '').toLowerCase().includes(term) ||
        subscription.id.toLowerCase().includes(term)

      return matchesPlan && matchesStatus && matchesSearch
    })
  }, [filterPlan, filterStatus, query, subscriptions])

  const stats = useMemo(() => {
    const expiringSoon = subscriptions.filter((subscription) => {
      const days = getDaysRemaining(subscription.end_date)
      return typeof days === 'number' && days >= 0 && days <= 7
    }).length

    return {
      total: subscriptions.length,
      active: subscriptions.filter((subscription) => subscription.status === 'ACTIVE').length,
      expiringSoon,
      cancelled: subscriptions.filter((subscription) => subscription.status === 'CANCELLED').length,
    }
  }, [subscriptions])

  function openCreateModal() {
    const firstMess = messes[0]?.id ?? ''
    setMode('create')
    setSelectedSubscription(null)
    setForm(emptyForm(firstMess))
    setFormOpen(true)
  }

  function openEditModal(subscription: SubscriptionRecord) {
    setMode('edit')
    setSelectedSubscription(subscription)
    const startDate = toDateInputValue(subscription.start_date)
    const endDate = toDateInputValue(subscription.end_date)
    setForm({
      messId: subscription.mess_id,
      plan: subscription.plan,
      status: subscription.status,
      startDate,
      endDate,
      days: endDate ? diffDays(startDate, endDate) : '',
    })
    setFormOpen(true)
  }

  function handlePlanChange(plan: SubscriptionPlan) {
    setForm((current) => {
      const planInfo = subscriptionPlans[plan]
      const nextDays = planInfo?.days ? String(planInfo.days) : current.days
      return {
        ...current,
        plan,
        days: nextDays,
        endDate: current.startDate && nextDays ? addDaysToDate(current.startDate, nextDays) : current.endDate,
      }
    })
  }

  function handleStartDateChange(startDate: string) {
    setForm((current) => ({
      ...current,
      startDate,
      endDate: startDate && current.days ? addDaysToDate(startDate, current.days) : current.endDate,
    }))
  }

  function handleDaysChange(days: string) {
    setForm((current) => ({
      ...current,
      days,
      endDate: current.startDate && days ? addDaysToDate(current.startDate, days) : '',
    }))
  }

  function handleEndDateChange(endDate: string) {
    setForm((current) => ({
      ...current,
      endDate,
      days: current.startDate && endDate ? diffDays(current.startDate, endDate) : current.days,
    }))
  }

  function openDetails(subscription: SubscriptionRecord) {
    setSelectedSubscription(subscription)
    setDetailsOpen(true)
  }

  function askDelete(subscription: SubscriptionRecord) {
    setSelectedSubscription(subscription)
    setDeleteOpen(true)
  }

  async function saveSubscription() {
    if (!form.messId) {
      setBanner({ type: 'error', message: 'Please choose a mess first.' })
      return
    }

    setSaving(true)
    try {
      if (mode === 'create') {
        if (form.plan === 'TRIAL') {
          await apiClient.initializeTrial(form.messId)
        } else {
          await apiClient.createSubscription({ messId: form.messId, plan: form.plan })
        }
        setBanner({ type: 'success', message: 'Subscription created successfully.' })
      } else if (selectedSubscription) {
        await apiClient.updateSubscription(selectedSubscription.id, {
          plan: form.plan,
          status: form.status,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          days: form.days ? Number(form.days) : undefined,
        })
        setBanner({ type: 'success', message: 'Subscription updated successfully.' })
      }

      setFormOpen(false)
      setDetailsOpen(false)
      setSelectedSubscription(null)
      await loadData()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong.'
      setBanner({ type: 'error', message })
    } finally {
      setSaving(false)
    }
  }

  async function deleteSubscription() {
    if (!selectedSubscription) return

    setDeleting(true)
    try {
      await apiClient.deleteSubscription(selectedSubscription.id)
      setBanner({ type: 'success', message: 'Subscription deleted successfully.' })
      setDeleteOpen(false)
      setDetailsOpen(false)
      setSelectedSubscription(null)
      await loadData()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete subscription.'
      setBanner({ type: 'error', message })
    } finally {
      setDeleting(false)
    }
  }

  const planCards = PLAN_ORDER.map((plan) => {
    const info = subscriptionPlans[plan]
    const style = PLAN_STYLES[plan]
    return {
      plan,
      info,
      style,
    }
  })

  function openPlanEditor(plan: SubscriptionPlan) {
    const info = subscriptionPlans[plan]
    setEditingPlan(plan)
    setPlanEditForm(emptyPlanEdit(info))
    setPlanEditOpen(true)
  }

  async function savePlanEdit() {
    if (!editingPlan) return

    setPlanEditSaving(true)
    try {
      const label = planEditForm.label.trim()
      const description = planEditForm.description.trim()
      const currency = planEditForm.currency.trim()
      const payload: SubscriptionPlanUpdate = {
        label: label || undefined,
        price: planEditForm.price ? Number(planEditForm.price) : undefined,
        days: planEditForm.days ? Number(planEditForm.days) : undefined,
        description: description || undefined,
        currency: currency || undefined,
        features: planEditForm.features.filter((f) => f.trim() !== ''),
      }

      const response = await apiClient.updateSubscriptionPlan(editingPlan, payload)
      setSubscriptionPlans((current) => ({
        ...current,
        [editingPlan]: response.data as SubscriptionPlanInfo,
      }))
      await loadData()
      const planLabel = subscriptionPlans[editingPlan]?.label ?? editingPlan
      setBanner({ type: 'success', message: `${planLabel} plan updated successfully.` })
      setPlanEditOpen(false)
      setEditingPlan(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update plan.'
      setBanner({ type: 'error', message })
    } finally {
      setPlanEditSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafcff]">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#e6ebf4] bg-white p-5 shadow-[0_8px_30px_rgba(65,103,153,0.08)] lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d8e6f8] bg-[#f8faff] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#2f80ed]">
              <BadgeCheck size={12} />
              Subscription management
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#172554]">Subscriptions</h1>
            <p className="max-w-2xl text-sm font-semibold text-[#6b7a99]">
              Manage subscribed messes, inspect active plans, and create new subscriptions from one place.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[420px] lg:grid-cols-[1fr_1fr]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActivePlansOpen((current) => !current)}
              aria-pressed={activePlansOpen}
              className={`h-11 rounded-xl border px-4 font-bold transition ${
                activePlansOpen
                  ? 'border-[#2f80ed]/25 bg-[#eef5ff] text-[#172554] '
                  : 'border-[#d8e6f8] bg-white text-[#172554]'
              }`}
            >
              <Sparkles size={15} className="text-[#2f80ed]" />
              {activePlansOpen ? 'Hide active subscription' : 'Active subscription'}
            </Button>
            <Button
              type="button"
              onClick={openCreateModal}
              className="h-11 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-4 font-bold text-white shadow-[0_8px_20px_rgba(47,128,237,0.25)] transition hover:from-[#1f6de0] hover:to-[#2f80ed] hover:text-white"
            >
              <Plus size={15} />
              New subscription
            </Button>
          </div>
        </div>

        {banner && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm ${
              banner.type === 'success'
                ? 'border-emerald-200/70 bg-emerald-50 text-emerald-700'
                : 'border-red-200/70 bg-red-50 text-red-700'
            }`}
          >
            {banner.type === 'success' ? <CheckCircle2 size={16} /> : <X size={16} />}
            <span>{banner.message}</span>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="ml-auto rounded-lg px-2 py-1 text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Total',
              value: stats.total,
              icon: Building2,
              gradient: 'from-[#2f80ed] to-[#5b8def]',
            },
            {
              label: 'Active',
              value: stats.active,
              icon: CheckCircle2,
              gradient: 'from-[#10b981] to-[#34d399]',
            },
            {
              label: 'Expiring soon',
              value: stats.expiringSoon,
              icon: CalendarDays,
              gradient: 'from-[#f59e0b] to-[#fb923c]',
            },
            {
              label: 'Cancelled',
              value: stats.cancelled,
              icon: X,
              gradient: 'from-[#ef4444] to-[#f97316]',
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-2xl border border-[#e6ebf4] bg-white p-4 shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6b7a99]">{item.label}</p>
                    <p className="mt-1 text-2xl font-black text-[#172554]">{item.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r ${item.gradient} text-white`}>
                    <Icon size={18} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-[#e6ebf4] bg-white p-4 shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_180px_180px]">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a9bb5]" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by mess name, address, or subscription id"
                className="h-11 w-full rounded-xl border border-[#d8e6f8] bg-white pl-10 pr-4 text-sm font-semibold text-[#172554] outline-none placeholder:text-[#8a9bb5] focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
              />
            </div>

            <div className="relative">
              <Filter size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a9bb5]" />
              <select
                value={filterPlan}
                onChange={(event) => setFilterPlan(event.target.value as '' | SubscriptionPlan)}
                className="h-11 w-full appearance-none rounded-xl border border-[#d8e6f8] bg-white pl-10 pr-4 text-sm font-semibold text-[#53617d] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
              >
                <option value="">All plans</option>
                <option value="TRIAL">Trial</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <div className="relative">
              <Filter size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a9bb5]" />
              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value as '' | SubscriptionStatus)}
                className="h-11 w-full appearance-none rounded-xl border border-[#d8e6f8] bg-white pl-10 pr-4 text-sm font-semibold text-[#53617d] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
              >
                <option value="">All</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[#e6ebf4] bg-white shadow-[0_8px_30px_rgba(65,103,153,0.08)]">
          {activePlansOpen ? (
            <>
              <div className="border-b border-[#e6ebf4] px-5 py-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#2f80ed]">Active Subscription</p>
                    <h2 className="text-lg font-black text-[#172554]">Plan pricing and duration</h2>
                  </div>
                  <p className="text-xs font-semibold text-[#8a9bb5]">Click edit on any plan to change the price or duration.</p>
                </div>
              </div>
              <div className="grid gap-4 p-4 xl:grid-cols-3">
                {planCards.map(({ plan, info, style }) => {
                  const Icon = style.icon
                  return (
                    <div
                      key={plan}
                      className="rounded-2xl border border-[#e6ebf4] bg-[#fafcff] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#a9ccfb]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black ${style.bg} ${style.text}`}
                        >
                          <Icon size={12} />
                          {info?.label ?? plan}
                        </div>
                        <h3 className="mt-3 text-lg font-black text-[#172554]">{info?.label ?? plan}</h3>
                          <p className="mt-1 text-sm font-semibold leading-6 text-[#6b7a99]">
                            {info?.description ?? 'Subscription plan details are available from the backend plan registry.'}
                          </p>
                        </div>
                      </div>
                      {info?.features && info.features.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Features</p>
                          {info.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm font-semibold text-[#172554]">
                              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="rounded-xl border border-[#e6ebf4] bg-white px-3 py-2 text-right">
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Price</p>
                          <p className="mt-1 text-lg font-black text-[#172554]">{info ? formatMoney(info.price) : 'N/A'}</p>
                          <p className="text-xs font-semibold text-[#8a9bb5]">{info ? `${info.days} days` : 'Plan data pending'}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openPlanEditor(plan)}
                          className="h-9 rounded-lg border border-[#d8e6f8] bg-white px-3 text-xs font-bold text-[#53617d] transition hover:border-[#a9ccfb] hover:bg-[#eff6ff] hover:text-[#172554]"
                        >
                          <Edit3 size={13} />
                          Edit
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-[#e6ebf4] px-5 py-4 text-xs font-semibold text-[#8a9bb5]">
                Plans are kept in sync with the backend configuration. If you change the backend plan data, this panel updates automatically after refresh.
              </div>
            </>
          ) : (
            <>
            {/* Desktop table - visible on desktop and above */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#e6ebf4] bg-[#f8faff]">
                    <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Mess</th>
                    <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Plan</th>
                    <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Status</th>
                    <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Members</th>
                    <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Start</th>
                    <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">End</th>
                    <th className="px-5 py-4 text-left text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Days left</th>
                    <th className="px-5 py-4 text-right text-[11px] font-black uppercase tracking-[0.08em] text-[#6b7a99]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e6ebf4]">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 size={22} className="animate-spin text-[#2f80ed]" />
                          <p className="text-sm font-semibold text-[#6b7a99]">Loading subscriptions...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <CreditCard size={34} className="text-[#d8e6f8]" />
                          <p className="text-sm font-bold text-[#6b7a99]">No subscriptions found</p>
                          <p className="text-xs font-semibold text-[#8a9bb5]">Try changing the filters or create a new one.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSubscriptions.map((subscription) => {
                      const planStyle = PLAN_STYLES[subscription.plan]
                      const statusStyle = STATUS_STYLES[subscription.status]
                      const daysLeft = getDaysRemaining(subscription.end_date)
                      const isExpiringSoon = typeof daysLeft === 'number' && daysLeft > 0 && daysLeft <= 7
                      const isExpired = typeof daysLeft === 'number' && daysLeft <= 0
                      const memberCount = subscription.mess._count?.memberships ?? 0
                      const PlanIcon = planStyle.icon

                      return (
                        <tr key={subscription.id} className="transition hover:bg-[#f8faff]">
                          <td className="px-5 py-4">
                            <div>
                              <p className="text-sm font-bold text-[#172554]">{subscription.mess.name}</p>
                              <p className="mt-0.5 text-xs font-semibold text-[#8a9bb5]">{subscription.mess.address || 'No address set'}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${planStyle.bg} ${planStyle.text}`}
                            >
                            <PlanIcon size={13} />
                              {subscriptionPlans[subscription.plan]?.label ?? subscription.plan}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  subscription.status === 'ACTIVE'
                                    ? 'bg-emerald-500'
                                    : subscription.status === 'EXPIRED'
                                      ? 'bg-red-500'
                                      : subscription.status === 'CANCELLED'
                                        ? 'bg-slate-500'
                                        : 'bg-amber-500'
                                }`}
                              />
                              {statusStyle.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm font-bold text-[#172554]">{memberCount}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-[#53617d]">{formatDate(subscription.start_date)}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-[#53617d]">{formatDate(subscription.end_date)}</td>
                          <td className="px-5 py-4">
                            {daysLeft === null ? (
                              <span className="text-sm font-semibold text-[#8a9bb5]">N/A</span>
                            ) : (
                              <span
                                className={`text-sm font-bold ${
                                  isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-emerald-600'
                                }`}
                              >
                                {isExpired ? 'Expired' : `${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openDetails(subscription)}
                                className="h-8 rounded-lg border border-[#d8e6f8] bg-white px-3 text-xs font-bold text-[#53617d] transition hover:border-[#a9ccfb] hover:bg-[#eff6ff] hover:text-[#172554]"
                              >
                                <Eye size={13} />
                                View
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(subscription)}
                                className="h-8 rounded-lg border border-[#d8e6f8] bg-white px-3 text-xs font-bold text-[#53617d] transition hover:border-[#a9ccfb] hover:bg-[#eff6ff] hover:text-[#172554]"
                              >
                                <Edit3 size={13} />
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => askDelete(subscription)}
                                className="h-8 rounded-lg px-3 text-xs font-bold text-white transition hover:bg-red-700 hover:text-white"
                              >
                                <Trash2 size={13} />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet cards */}
            <div className="space-y-3 lg:hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-[#2f80ed]" />
                </div>
              ) : filteredSubscriptions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <CreditCard size={34} className="text-[#d8e6f8]" />
                  <p className="text-sm font-bold text-[#6b7a99]">No subscriptions found</p>
                  <p className="text-xs font-semibold text-[#8a9bb5]">Try changing the filters or create a new one.</p>
                </div>
              ) : (
                filteredSubscriptions.map((subscription) => {
                  const planStyle = PLAN_STYLES[subscription.plan]
                  const statusStyle = STATUS_STYLES[subscription.status]
                  const daysLeft = getDaysRemaining(subscription.end_date)
                  const isExpiringSoon = typeof daysLeft === 'number' && daysLeft > 0 && daysLeft <= 7
                  const isExpired = typeof daysLeft === 'number' && daysLeft <= 0
                  const memberCount = subscription.mess._count?.memberships ?? 0
                  const PlanIcon = planStyle.icon

                  return (
                    <div key={subscription.id} className="rounded-xl border border-[#e6ebf4] bg-white p-4 shadow-sm transition hover:border-[#a9ccfb] hover:shadow-md">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-base font-bold text-[#172554]">{subscription.mess.name}</p>
                          {subscription.mess.address && (
                            <p className="mt-0.5 text-xs font-semibold text-[#8a9bb5]">{subscription.mess.address}</p>
                          )}
                        </div>
                        <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${planStyle.bg} ${planStyle.text}`}>
                          <PlanIcon size={13} />
                          {subscriptionPlans[subscription.plan]?.label ?? subscription.plan}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#f8faff] p-3 mb-3">
                        <div>
                          <p className="text-[10px] font-black uppercase text-[#6b7a99]">Status</p>
                          <span className={`mt-1 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-bold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              subscription.status === 'ACTIVE' ? 'bg-emerald-500' :
                              subscription.status === 'EXPIRED' ? 'bg-red-500' :
                              subscription.status === 'CANCELLED' ? 'bg-slate-500' : 'bg-amber-500'
                            }`} />
                            {statusStyle.label}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-[#6b7a99]">Members</p>
                          <p className="mt-1 text-sm font-bold text-[#172554]">{memberCount}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-[#6b7a99]">Period</p>
                          <p className="mt-1 text-xs font-semibold text-[#53617d]">{formatDate(subscription.start_date)} - {formatDate(subscription.end_date)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase text-[#6b7a99]">Days left</p>
                          <p className={`mt-1 text-sm font-bold ${
                            isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {daysLeft === null ? 'N/A' : isExpired ? 'Expired' : `${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openDetails(subscription)}
                          className="flex-1 h-9 rounded-xl border border-[#d8e6f8] bg-white text-xs font-bold text-[#53617d] transition hover:border-[#a9ccfb] hover:bg-[#eff6ff] hover:text-[#172554]"
                        >
                          <Eye size={13} className="inline mr-1" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(subscription)}
                          className="flex-1 h-9 rounded-xl border border-[#d8e6f8] bg-white text-xs font-bold text-[#53617d] transition hover:border-[#a9ccfb] hover:bg-[#eff6ff] hover:text-[#172554]"
                        >
                          <Edit3 size={13} className="inline mr-1" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => askDelete(subscription)}
                          className="flex-1 h-9 rounded-xl bg-red-50 text-xs font-bold text-red-600 border border-red-200/50 transition hover:bg-red-100"
                        >
                          <Trash2 size={13} className="inline mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            </>
          )}
        </div>

        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl border border-[#d8e6f8] bg-white p-0 shadow-[0_28px_80px_rgba(65,103,153,0.26)]">
            <div className="border-b border-[#e6ebf4] px-6 py-5">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-black text-[#172554]">
                  {mode === 'create' ? 'Create Subscription' : 'Edit Subscription'}
                </DialogTitle>
                <DialogDescription className="text-sm font-semibold text-[#6b7a99]">
                  {mode === 'create'
                    ? 'Create a paid subscription or initialize a trial for a mess.'
                    : 'Update the plan, status, days, start date, and end date. Changing the plan will auto-sync the duration.'}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Mess</label>
                  <select
                    value={form.messId}
                    onChange={(event) => {
                      const messId = event.target.value
                      setForm((current) => ({ ...current, messId }))
                    }}
                    disabled={mode === 'edit'}
                    className="h-12 w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10 disabled:cursor-not-allowed disabled:bg-[#f8faff]"
                  >
                    <option value="">Select a mess</option>
                    {messes.map((mess) => (
                      <option key={mess.id} value={mess.id}>
                        {mess.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Plan</label>
                  <select
                    value={form.plan}
                    onChange={(event) => handlePlanChange(event.target.value as SubscriptionPlan)}
                    className="h-12 w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                  >
                    <option value="TRIAL">Trial</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              {mode === 'edit' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Status</label>
                    <select
                      value={form.status}
                      onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as SubscriptionStatus }))}
                      className="h-12 w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="PENDING">Pending</option>
                      <option value="EXPIRED">Expired</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Days</label>
                    <input
                      type="number"
                      min={1}
                      value={form.days}
                      onChange={(event) => handleDaysChange(event.target.value)}
                      className="h-12 w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                      placeholder="30"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Start Date</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(event) => handleStartDateChange(event.target.value)}
                      className="h-12 w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">End Date</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(event) => handleEndDateChange(event.target.value)}
                      className="h-12 w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                    />
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-[#e6ebf4] bg-[#f8faff] p-4 text-sm font-semibold text-[#6b7a99]">
                {form.plan === 'TRIAL' && mode === 'create' ? (
                  <p>
                    Trial plans use the backend trial initializer. If a subscription already exists for the mess, the existing one will be kept.
                  </p>
                ) : (
                  <p>
                    {mode === 'create'
                      ? 'New subscriptions are created with ACTIVE status by default.'
                      : 'Status changes are saved immediately when you update the subscription.'}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="border-t border-[#e6ebf4] bg-[#fafcff] px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                className="h-11 rounded-xl border border-[#d8e6f8] bg-white px-4 font-bold text-[#53617d] transition hover:border-[#a9ccfb] hover:bg-[#eff6ff] hover:text-[#172554]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void saveSubscription()}
                disabled={saving || !form.messId}
                className="h-11 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-5 font-bold text-white shadow-[0_8px_20px_rgba(47,128,237,0.25)]"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl border border-[#d8e6f8] bg-white p-0 shadow-[0_28px_80px_rgba(65,103,153,0.26)]">
            <div className="border-b border-[#e6ebf4] px-6 py-5">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-black text-[#172554]">Subscription details</DialogTitle>
                <DialogDescription className="text-sm font-semibold text-[#6b7a99]">
                  Full subscription record for {selectedSubscription?.mess.name ?? 'the selected mess'}.
                </DialogDescription>
              </DialogHeader>
            </div>

            {selectedSubscription && (
              <div className="space-y-5 px-6 py-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#e6ebf4] bg-[#f8faff] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Mess</p>
                    <p className="mt-1 text-base font-black text-[#172554]">{selectedSubscription.mess.name}</p>
                    <p className="mt-1 text-sm font-semibold text-[#6b7a99]">{selectedSubscription.mess.address || 'No address set'}</p>
                  </div>
                  <div className="rounded-2xl border border-[#e6ebf4] bg-[#f8faff] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Subscription ID</p>
                    <p className="mt-1 break-all text-sm font-semibold text-[#172554]">{selectedSubscription.id}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className={`rounded-2xl border p-4 ${PLAN_STYLES[selectedSubscription.plan].bg}`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Plan</p>
                    <p className={`mt-1 text-base font-black ${PLAN_STYLES[selectedSubscription.plan].text}`}>{subscriptionLabel(selectedSubscription, subscriptionPlans)}</p>
                  </div>
                  <div className={`rounded-2xl border p-4 ${STATUS_STYLES[selectedSubscription.status].bg}`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Status</p>
                    <p className={`mt-1 text-base font-black ${STATUS_STYLES[selectedSubscription.status].text}`}>{STATUS_STYLES[selectedSubscription.status].label}</p>
                  </div>
                  <div className="rounded-2xl border border-[#e6ebf4] bg-[#f8faff] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Members</p>
                    <p className="mt-1 text-base font-black text-[#172554]">{selectedSubscription.mess._count?.memberships ?? 0}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[#e6ebf4] bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Started</p>
                    <p className="mt-1 text-sm font-semibold text-[#172554]">{formatDate(selectedSubscription.start_date)}</p>
                  </div>
                  <div className="rounded-2xl border border-[#e6ebf4] bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Ends</p>
                    <p className="mt-1 text-sm font-semibold text-[#172554]">{formatDate(selectedSubscription.end_date)}</p>
                  </div>
                  <div className="rounded-2xl border border-[#e6ebf4] bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Cancelled at</p>
                    <p className="mt-1 text-sm font-semibold text-[#172554]">{formatDate(selectedSubscription.cancelled_at)}</p>
                  </div>
                </div>

                <DialogFooter className="border-t border-[#e6ebf4] pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => selectedSubscription && openEditModal(selectedSubscription)}
                    className="h-11 rounded-xl border border-[#d8e6f8] bg-white px-4 font-bold text-[#53617d] transition hover:border-[#a9ccfb] hover:bg-[#eff6ff] hover:text-[#172554]"
                  >
                    <Edit3 size={15} />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => selectedSubscription && askDelete(selectedSubscription)}
                    className="h-11 rounded-xl px-4 font-bold"
                  >
                    <Trash2 size={15} />
                    Delete
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={planEditOpen} onOpenChange={setPlanEditOpen}>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl border border-[#d8e6f8] bg-white p-0 shadow-[0_28px_80px_rgba(65,103,153,0.26)]">
            <div className="border-b border-[#e6ebf4] px-6 py-5">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-black text-[#172554]">
                  Edit {editingPlan ? (subscriptionPlans[editingPlan]?.label ?? editingPlan) : 'Plan'}
                </DialogTitle>
                <DialogDescription className="text-sm font-semibold text-[#6b7a99]">
                  Update the plan card values. For example, lower Monthly from 499 to 399.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-4 px-6 py-6">
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Label</label>
                <input
                  value={planEditForm.label}
                  onChange={(event) => setPlanEditForm((current) => ({ ...current, label: event.target.value }))}
                  className="h-12 w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Price</label>
                  <input
                    type="number"
                    value={planEditForm.price}
                    onChange={(event) => setPlanEditForm((current) => ({ ...current, price: event.target.value }))}
                    className="h-12 w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Days</label>
                  <input
                    type="number"
                    value={planEditForm.days}
                    onChange={(event) => setPlanEditForm((current) => ({ ...current, days: event.target.value }))}
                    className="h-12 w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Currency</label>
                <input
                  value={planEditForm.currency}
                  onChange={(event) => setPlanEditForm((current) => ({ ...current, currency: event.target.value }))}
                  className="h-12 w-full rounded-xl border border-[#d8e6f8] bg-white px-4 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Description</label>
                <textarea
                  value={planEditForm.description}
                  onChange={(event) => setPlanEditForm((current) => ({ ...current, description: event.target.value }))}
                  className="min-h-[120px] w-full rounded-xl border border-[#d8e6f8] bg-white px-4 py-3 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-[11px] font-black uppercase tracking-[0.12em] text-[#6b7a99]">Features</label>
                  <button
                    type="button"
                    onClick={() =>
                      setPlanEditForm((current) => ({ ...current, features: [...current.features, ''] }))
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-[#d8e6f8] bg-white px-2.5 py-1 text-[10px] font-bold text-[#2f80ed] transition hover:border-[#a9ccfb] hover:bg-[#eff6ff]"
                  >
                    <Plus size={12} />
                    Add more
                  </button>
                </div>
                <div className="space-y-2">
                  {planEditForm.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        value={feature}
                        onChange={(event) => {
                          const next = [...planEditForm.features]
                          next[index] = event.target.value
                          setPlanEditForm((current) => ({ ...current, features: next }))
                        }}
                        className="h-10 w-full rounded-xl border border-[#d8e6f8] bg-white px-3 text-sm font-semibold text-[#172554] outline-none focus:border-[#2f80ed]/60 focus:ring-4 focus:ring-[#2f80ed]/10"
                        placeholder="e.g. Unlimited members"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPlanEditForm((current) => ({
                            ...current,
                            features: current.features.filter((_, i) => i !== index),
                          }))
                        }
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200/50 bg-red-50 text-red-500 transition hover:bg-red-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {planEditForm.features.length === 0 && (
                    <p className="text-xs font-semibold text-[#8a9bb5]">No features added. Click "Add more" to add plan features.</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-[#e6ebf4] bg-[#fafcff] px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPlanEditOpen(false)}
                className="h-11 rounded-xl border border-[#d8e6f8] bg-white px-4 font-bold text-[#53617d] transition hover:border-[#a9ccfb] hover:bg-[#eff6ff] hover:text-[#172554]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void savePlanEdit()}
                disabled={planEditSaving || !editingPlan}
                className="h-11 rounded-xl bg-gradient-to-r from-[#2f80ed] to-[#3b8cff] px-5 font-bold text-white shadow-[0_8px_20px_rgba(47,128,237,0.25)]"
              >
                {planEditSaving ? <Loader2 size={15} className="animate-spin" /> : <Edit3 size={15} />}
                {planEditSaving ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent className="rounded-2xl border border-[#d8e6f8] bg-white shadow-[0_28px_80px_rgba(65,103,153,0.26)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-left text-xl font-black text-[#172554]">Delete subscription?</AlertDialogTitle>
              <AlertDialogDescription className="text-left text-sm font-semibold text-[#6b7a99]">
                This will permanently remove the subscription for {selectedSubscription?.mess.name ?? 'the selected mess'}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-11 rounded-xl border border-[#d8e6f8] bg-white px-4 font-bold text-[#53617d] transition hover:border-[#a9ccfb] hover:bg-[#eff6ff] hover:text-[#172554]">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault()
                  void deleteSubscription()
                }}
                className="h-11 rounded-xl bg-red-600 px-4 font-bold text-white hover:bg-red-700"
              >
                {deleting ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Trash2 size={15} className="mr-2" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* {messes.length > 0 && !loading && subscriptions.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-[#cfe0fb] bg-[#f8faff] p-5 text-sm font-semibold text-[#6b7a99]">
            No subscriptions exist yet. Use <span className="font-black text-[#172554]">New subscription</span> to create one, or initialize a trial for a mess.
          </div>
        )} */}

        {/* {messes.length === 0 && !loading && (
          <div className="mt-6 rounded-2xl border border-amber-200/70 bg-amber-50 p-5 text-sm font-semibold text-amber-800">
            No messes are available to assign a subscription to yet. Create or approve a mess first, then come back here to add a subscription.
          </div>
        )} */}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-[#8a9bb5]">
          <span>Loaded {filteredSubscriptions.length} of {subscriptions.length} subscription(s)</span>
          {/* <span>Backend controls plan pricing and trial duration.</span> */}
        </div>
      </div>
    </div>
  )
}
