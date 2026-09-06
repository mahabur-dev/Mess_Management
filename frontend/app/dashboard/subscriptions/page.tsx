'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { EnterpriseDatePicker } from '@/components/ui/enterprise-date-picker'
import { EnterpriseSelect } from '@/components/ui/enterprise-select'
import { EnterpriseTableActionCell, EnterpriseTableActionHeader } from '@/components/ui/enterprise-table-actions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { apiClient, type Mess, type SubscriptionPlan, type SubscriptionPlanInfo, type SubscriptionPlanUpdate, type SubscriptionRecord, type SubscriptionStatus } from '@/lib/api-client'
import { APP_FEATURES } from '@/lib/feature-flags'
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
  TRIAL: { bg: 'bg-muted', text: 'text-muted-foreground', icon: Clock3 },
  MONTHLY: { bg: 'bg-primary/10', text: 'text-primary', icon: CreditCard },
  YEARLY: { bg: 'bg-primary/10', text: 'text-primary', icon: Sparkles },
}

const STATUS_STYLES: Record<SubscriptionStatus, { label: string; bg: string; text: string; border: string }> = {
  ACTIVE: { label: 'Active', bg: 'bg-primary/10', text: 'text-primary', border: 'color-mix(in srgb, var(--primary) 30%, transparent)' },
  EXPIRED: { label: 'Expired', bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  PENDING: { label: 'Pending', bg: 'bg-primary/10', text: 'text-primary', border: 'color-mix(in srgb, var(--primary) 30%, transparent)' },
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
  const router = useRouter()
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
    if (!APP_FEATURES.subscriptions) {
      setLoading(false)
      return
    }

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
    if (!APP_FEATURES.subscriptions) {
      router.replace('/dashboard')
      return
    }

    void loadData()
  }, [loadData, router])

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

  if (!APP_FEATURES.subscriptions) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-background p-5  lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              <BadgeCheck size={12} />
              Subscription management
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Subscriptions</h1>
            <p className="max-w-2xl text-sm font-semibold text-muted-foreground">
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
                  ? 'border-border bg-muted text-foreground '
                  : 'border-border bg-background text-foreground'
              }`}
            >
              <Sparkles size={15} className="text-primary" />
              {activePlansOpen ? 'Hide active subscription' : 'Active subscription'}
            </Button>
            <Button
              type="button"
              onClick={openCreateModal}
              className="h-11 rounded-xl  bg-primary  px-4 font-bold text-primary-foreground  transition hover:bg-primary  hover:text-primary-foreground"
            >
              <Plus size={15} />
              New subscription
            </Button>
          </div>
        </div>

        {banner && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold  ${
              banner.type === 'success'
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
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
              background: 'bg-primary',
            },
            {
              label: 'Active',
              value: stats.active,
              icon: CheckCircle2,
              background: 'bg-primary',
            },
            {
              label: 'Expiring soon',
              value: stats.expiringSoon,
              icon: CalendarDays,
              background: 'bg-primary',
            },
            {
              label: 'Cancelled',
              value: stats.cancelled,
              icon: X,
              background: 'bg-destructive',
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-2xl border border-border bg-background p-4 ">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{item.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.background} text-primary-foreground`}>
                    <Icon size={18} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-background p-4 ">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_180px_180px]">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by mess name, address, or subscription id"
                className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
              />
            </div>

            <EnterpriseSelect
              value={filterPlan || 'ALL'}
              onValueChange={(value) => setFilterPlan(value === 'ALL' ? '' : value as SubscriptionPlan)}
              ariaLabel="Filter subscriptions by plan"
              icon={<Filter size={16} />}
              options={[
                { value: 'ALL', label: 'All plans' },
                { value: 'TRIAL', label: 'Trial' },
                { value: 'MONTHLY', label: 'Monthly' },
                { value: 'YEARLY', label: 'Yearly' },
              ]}
            />

            <EnterpriseSelect
              value={filterStatus || 'ALL'}
              onValueChange={(value) => setFilterStatus(value === 'ALL' ? '' : value as SubscriptionStatus)}
              ariaLabel="Filter subscriptions by status"
              icon={<Filter size={16} />}
              options={[
                { value: 'ALL', label: 'All status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'EXPIRED', label: 'Expired' },
                { value: 'CANCELLED', label: 'Cancelled' },
                { value: 'PENDING', label: 'Pending' },
              ]}
            />
          </div>
        </div>

        <div className="dashboard-table-frame mt-6">
          {activePlansOpen ? (
            <>
              <div className="border-b border-border px-5 py-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Active Subscription</p>
                    <h2 className="text-lg font-semibold text-foreground">Plan pricing and duration</h2>
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground">Click edit on any plan to change the price or duration.</p>
                </div>
              </div>
              <div className="grid gap-4 p-4 xl:grid-cols-3">
                {planCards.map(({ plan, info, style }) => {
                  const Icon = style.icon
                  return (
                    <div
                      key={plan}
                      className="rounded-lg border border-border bg-muted p-5 text-left transition-colors hover:border-primary"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${style.bg} ${style.text}`}
                        >
                          <Icon size={12} />
                          {info?.label ?? plan}
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-foreground">{info?.label ?? plan}</h3>
                          <p className="mt-1 text-sm font-semibold leading-6 text-muted-foreground">
                            {info?.description ?? 'Subscription plan details are available from the backend plan registry.'}
                          </p>
                        </div>
                      </div>
                      {info?.features && info.features.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Features</p>
                          {info.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm font-semibold text-foreground">
                              <CheckCircle2 size={14} className="text-primary shrink-0" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="rounded-xl border border-border bg-background px-3 py-2 text-right">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Price</p>
                          <p className="mt-1 text-lg font-semibold text-foreground">{info ? formatMoney(info.price) : 'N/A'}</p>
                          <p className="text-xs font-semibold text-muted-foreground">{info ? `${info.days} days` : 'Plan data pending'}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openPlanEditor(plan)}
                          className="h-9 rounded-lg border border-border bg-background px-3 text-xs font-bold text-muted-foreground transition hover:border-primary hover:bg-muted hover:text-foreground"
                        >
                          <Edit3 size={13} />
                          Edit
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-border px-5 py-4 text-xs font-semibold text-muted-foreground">
                Plans are kept in sync with the backend configuration. If you change the backend plan data, this panel updates automatically after refresh.
              </div>
            </>
          ) : (
            <>
            {/* Desktop table - visible on desktop and above */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Mess</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Plan</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Status</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Members</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Start</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">End</th>
                    <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Days left</th>
                    <EnterpriseTableActionHeader size="wide" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 size={22} className="animate-spin text-primary" />
                          <p className="text-sm font-semibold text-muted-foreground">Loading subscriptions...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <CreditCard size={34} className="text-muted-foreground" />
                          <p className="text-sm font-bold text-muted-foreground">No subscriptions found</p>
                          <p className="text-xs font-semibold text-muted-foreground">Try changing the filters or create a new one.</p>
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
                        <tr key={subscription.id} className="transition hover:bg-muted">
                          <td className="px-5 py-4">
                            <div>
                              <p className="text-sm font-bold text-foreground">{subscription.mess.name}</p>
                              <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{subscription.mess.address || 'No address set'}</p>
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
                                    ? 'bg-primary/100'
                                    : subscription.status === 'EXPIRED'
                                      ? 'bg-destructive/100'
                                      : subscription.status === 'CANCELLED'
                                        ? 'bg-muted'
                                        : 'bg-primary/100'
                                }`}
                              />
                              {statusStyle.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm font-bold text-foreground">{memberCount}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-muted-foreground">{formatDate(subscription.start_date)}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-muted-foreground">{formatDate(subscription.end_date)}</td>
                          <td className="px-5 py-4">
                            {daysLeft === null ? (
                              <span className="text-sm font-semibold text-muted-foreground">N/A</span>
                            ) : (
                              <span
                                className={`text-sm font-bold ${
                                  isExpired ? 'text-destructive' : isExpiringSoon ? 'text-primary' : 'text-primary'
                                }`}
                              >
                                {isExpired ? 'Expired' : `${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                              </span>
                            )}
                          </td>
                          <EnterpriseTableActionCell size="wide">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openDetails(subscription)}
                                className="h-8 rounded-lg border border-border bg-background px-3 text-xs font-bold text-muted-foreground transition hover:border-primary hover:bg-muted hover:text-foreground"
                              >
                                <Eye size={13} />
                                View
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(subscription)}
                                className="h-8 rounded-lg border border-border bg-background px-3 text-xs font-bold text-muted-foreground transition hover:border-primary hover:bg-muted hover:text-foreground"
                              >
                                <Edit3 size={13} />
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => askDelete(subscription)}
                                className="h-8 rounded-lg px-3 text-xs font-bold text-primary-foreground transition hover:bg-destructive hover:text-primary-foreground"
                              >
                                <Trash2 size={13} />
                                Delete
                              </Button>
                          </EnterpriseTableActionCell>
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
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : filteredSubscriptions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <CreditCard size={34} className="text-muted-foreground" />
                  <p className="text-sm font-bold text-muted-foreground">No subscriptions found</p>
                  <p className="text-xs font-semibold text-muted-foreground">Try changing the filters or create a new one.</p>
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
                    <div key={subscription.id} className="rounded-xl border border-border bg-background p-4  transition hover:border-primary ">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-base font-bold text-foreground">{subscription.mess.name}</p>
                          {subscription.mess.address && (
                            <p className="mt-0.5 text-xs font-semibold text-muted-foreground">{subscription.mess.address}</p>
                          )}
                        </div>
                        <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${planStyle.bg} ${planStyle.text}`}>
                          <PlanIcon size={13} />
                          {subscriptionPlans[subscription.plan]?.label ?? subscription.plan}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted p-3 mb-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Status</p>
                          <span className={`mt-1 inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-bold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              subscription.status === 'ACTIVE' ? 'bg-primary/100' :
                              subscription.status === 'EXPIRED' ? 'bg-destructive/100' :
                              subscription.status === 'CANCELLED' ? 'bg-muted' : 'bg-primary/100'
                            }`} />
                            {statusStyle.label}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Members</p>
                          <p className="mt-1 text-sm font-bold text-foreground">{memberCount}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Period</p>
                          <p className="mt-1 text-xs font-semibold text-muted-foreground">{formatDate(subscription.start_date)} - {formatDate(subscription.end_date)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Days left</p>
                          <p className={`mt-1 text-sm font-bold ${
                            isExpired ? 'text-destructive' : isExpiringSoon ? 'text-primary' : 'text-primary'
                          }`}>
                            {daysLeft === null ? 'N/A' : isExpired ? 'Expired' : `${daysLeft} day${daysLeft === 1 ? '' : 's'}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openDetails(subscription)}
                          className="flex-1 h-9 rounded-xl border border-border bg-background text-xs font-bold text-muted-foreground transition hover:border-primary hover:bg-muted hover:text-foreground"
                        >
                          <Eye size={13} className="inline mr-1" />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(subscription)}
                          className="flex-1 h-9 rounded-xl border border-border bg-background text-xs font-bold text-muted-foreground transition hover:border-primary hover:bg-muted hover:text-foreground"
                        >
                          <Edit3 size={13} className="inline mr-1" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => askDelete(subscription)}
                          className="flex-1 h-9 rounded-xl bg-destructive/10 text-xs font-bold text-destructive border border-destructive/30 transition hover:bg-destructive/10"
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
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl border border-border bg-background p-0 ">
            <div className="border-b border-border px-6 py-5">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-semibold text-foreground">
                  {mode === 'create' ? 'Create Subscription' : 'Edit Subscription'}
                </DialogTitle>
                <DialogDescription className="text-sm font-semibold text-muted-foreground">
                  {mode === 'create'
                    ? 'Create a paid subscription or initialize a trial for a mess.'
                    : 'Update the plan, status, days, start date, and end date. Changing the plan will auto-sync the duration.'}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Mess</label>
                  <EnterpriseSelect
                    value={form.messId}
                    onValueChange={(messId) => setForm((current) => ({ ...current, messId }))}
                    disabled={mode === 'edit'}
                    placeholder="Select a mess"
                    ariaLabel="Select a mess"
                    icon={<Building2 size={16} />}
                    options={messes.map((mess) => ({ value: mess.id, label: mess.name }))}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Plan</label>
                  <EnterpriseSelect
                    value={form.plan}
                    onValueChange={(value) => handlePlanChange(value as SubscriptionPlan)}
                    ariaLabel="Select subscription plan"
                    icon={<CreditCard size={16} />}
                    options={[
                      { value: 'TRIAL', label: 'Trial' },
                      { value: 'MONTHLY', label: 'Monthly' },
                      { value: 'YEARLY', label: 'Yearly' },
                    ]}
                  />
                </div>
              </div>

              {mode === 'edit' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Status</label>
                    <EnterpriseSelect
                      value={form.status}
                      onValueChange={(value) => setForm((current) => ({ ...current, status: value as SubscriptionStatus }))}
                      ariaLabel="Select subscription status"
                      options={[
                        { value: 'ACTIVE', label: 'Active' },
                        { value: 'PENDING', label: 'Pending' },
                        { value: 'EXPIRED', label: 'Expired' },
                        { value: 'CANCELLED', label: 'Cancelled' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Days</label>
                    <input
                      type="number"
                      min={1}
                      value={form.days}
                      onChange={(event) => handleDaysChange(event.target.value)}
                      className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                      placeholder="30"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Start Date</label>
                    <EnterpriseDatePicker
                      value={form.startDate}
                      onValueChange={handleStartDateChange}
                      surface="white"
                      align="start"
                      className="h-12 w-full px-4 text-sm font-semibold"
                      ariaLabel="Select subscription start date"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">End Date</label>
                    <EnterpriseDatePicker
                      value={form.endDate}
                      onValueChange={handleEndDateChange}
                      surface="white"
                      align="start"
                      className="h-12 w-full px-4 text-sm font-semibold"
                      ariaLabel="Select subscription end date"
                    />
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-border bg-muted p-4 text-sm font-semibold text-muted-foreground">
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

            <DialogFooter className="border-t border-border bg-muted px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                className="h-11 rounded-xl border border-border bg-background px-4 font-bold text-muted-foreground transition hover:border-primary hover:bg-muted hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void saveSubscription()}
                disabled={saving || !form.messId}
                className="h-11 rounded-xl  bg-primary  px-5 font-bold text-primary-foreground "
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {saving ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl border border-border bg-background p-0 ">
            <div className="border-b border-border px-6 py-5">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-semibold text-foreground">Subscription details</DialogTitle>
                <DialogDescription className="text-sm font-semibold text-muted-foreground">
                  Full subscription record for {selectedSubscription?.mess.name ?? 'the selected mess'}.
                </DialogDescription>
              </DialogHeader>
            </div>

            {selectedSubscription && (
              <div className="space-y-5 px-6 py-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-muted p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Mess</p>
                    <p className="mt-1 text-base font-semibold text-foreground">{selectedSubscription.mess.name}</p>
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">{selectedSubscription.mess.address || 'No address set'}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Subscription ID</p>
                    <p className="mt-1 break-all text-sm font-semibold text-foreground">{selectedSubscription.id}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className={`rounded-2xl border p-4 ${PLAN_STYLES[selectedSubscription.plan].bg}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Plan</p>
                    <p className={`mt-1 text-base font-semibold ${PLAN_STYLES[selectedSubscription.plan].text}`}>{subscriptionLabel(selectedSubscription, subscriptionPlans)}</p>
                  </div>
                  <div className={`rounded-2xl border p-4 ${STATUS_STYLES[selectedSubscription.status].bg}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Status</p>
                    <p className={`mt-1 text-base font-semibold ${STATUS_STYLES[selectedSubscription.status].text}`}>{STATUS_STYLES[selectedSubscription.status].label}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-muted p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Members</p>
                    <p className="mt-1 text-base font-semibold text-foreground">{selectedSubscription.mess._count?.memberships ?? 0}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Started</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{formatDate(selectedSubscription.start_date)}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ends</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{formatDate(selectedSubscription.end_date)}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Cancelled at</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{formatDate(selectedSubscription.cancelled_at)}</p>
                  </div>
                </div>

                <DialogFooter className="border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => selectedSubscription && openEditModal(selectedSubscription)}
                    className="h-11 rounded-xl border border-border bg-background px-4 font-bold text-muted-foreground transition hover:border-primary hover:bg-muted hover:text-foreground"
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
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl border border-border bg-background p-0 ">
            <div className="border-b border-border px-6 py-5">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-semibold text-foreground">
                  Edit {editingPlan ? (subscriptionPlans[editingPlan]?.label ?? editingPlan) : 'Plan'}
                </DialogTitle>
                <DialogDescription className="text-sm font-semibold text-muted-foreground">
                  Update the plan card values. For example, lower Monthly from 499 to 399.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-4 px-6 py-6">
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Label</label>
                <input
                  value={planEditForm.label}
                  onChange={(event) => setPlanEditForm((current) => ({ ...current, label: event.target.value }))}
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Price</label>
                  <input
                    type="number"
                    value={planEditForm.price}
                    onChange={(event) => setPlanEditForm((current) => ({ ...current, price: event.target.value }))}
                    className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Days</label>
                  <input
                    type="number"
                    value={planEditForm.days}
                    onChange={(event) => setPlanEditForm((current) => ({ ...current, days: event.target.value }))}
                    className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Currency</label>
                <input
                  value={planEditForm.currency}
                  onChange={(event) => setPlanEditForm((current) => ({ ...current, currency: event.target.value }))}
                  className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Description</label>
                <textarea
                  value={planEditForm.description}
                  onChange={(event) => setPlanEditForm((current) => ({ ...current, description: event.target.value }))}
                  className="min-h-[120px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Features</label>
                  <button
                    type="button"
                    onClick={() =>
                      setPlanEditForm((current) => ({ ...current, features: [...current.features, ''] }))
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[10px] font-bold text-primary transition hover:border-primary hover:bg-muted"
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
                        className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
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
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive transition hover:bg-destructive/10"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {planEditForm.features.length === 0 && (
                    <p className="text-xs font-semibold text-muted-foreground">No features added. Click "Add more" to add plan features.</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-border bg-muted px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPlanEditOpen(false)}
                className="h-11 rounded-xl border border-border bg-background px-4 font-bold text-muted-foreground transition hover:border-primary hover:bg-muted hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void savePlanEdit()}
                disabled={planEditSaving || !editingPlan}
                className="h-11 rounded-xl  bg-primary  px-5 font-bold text-primary-foreground "
              >
                {planEditSaving ? <Loader2 size={15} className="animate-spin" /> : <Edit3 size={15} />}
                {planEditSaving ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent className="rounded-2xl border border-border bg-background ">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-left text-xl font-semibold text-foreground">Delete subscription?</AlertDialogTitle>
              <AlertDialogDescription className="text-left text-sm font-semibold text-muted-foreground">
                This will permanently remove the subscription for {selectedSubscription?.mess.name ?? 'the selected mess'}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="h-11 rounded-xl border border-border bg-background px-4 font-bold text-muted-foreground transition hover:border-primary hover:bg-muted hover:text-foreground">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault()
                  void deleteSubscription()
                }}
                className="h-11 rounded-xl bg-destructive px-4 font-bold text-primary-foreground hover:bg-destructive"
              >
                {deleting ? <Loader2 size={15} className="mr-2 animate-spin" /> : <Trash2 size={15} className="mr-2" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* {messes.length > 0 && !loading && subscriptions.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted p-5 text-sm font-semibold text-muted-foreground">
            No subscriptions exist yet. Use <span className="font-semibold text-foreground">New subscription</span> to create one, or initialize a trial for a mess.
          </div>
        )} */}

        {/* {messes.length === 0 && !loading && (
          <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-5 text-sm font-semibold text-primary">
            No messes are available to assign a subscription to yet. Create or approve a mess first, then come back here to add a subscription.
          </div>
        )} */}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
          <span>Loaded {filteredSubscriptions.length} of {subscriptions.length} subscription(s)</span>
          {/* <span>Backend controls plan pricing and trial duration.</span> */}
        </div>
      </div>
    </div>
  )
}
