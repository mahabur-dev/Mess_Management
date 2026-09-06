'use client'

import { DashboardHeader } from '@/components/dashboard-header'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type Mess, type MessRoom, type SubscriptionPlan, type SubscriptionStatus } from '@/lib/api-client'
import { APP_FEATURES } from '@/lib/feature-flags'
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Home,
  Loader2,
  MapPin,
  Plus,
  Save,
  Send,
  Settings2,
  Tags,
  UtensilsCrossed,
  Eye,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAutoDismissMessage } from '@/hooks/use-auto-dismiss-message'

type RoomDraft = {
  id: string
  roomName: string
  perPerson: string
  roomPrice: string
}

type RoomPayload = {
  roomName: string
  perPerson?: number
  roomPrice?: number
}

type SetupState = {
  messName: string
  address: string
  totalSeats: string
  monthlyRent: string
  messCategory: string
  paymentDeadlineDay: string
  mealOffDeadline: string
  bazarRules: string
  rooms: RoomDraft[]
}

type MessSubscriptionSummary = {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  start_date: string
  end_date: string | null
}

const createRoomDraft = (room?: Partial<RoomDraft>): RoomDraft => ({
  id: room?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  roomName: room?.roomName ?? '',
  perPerson: room?.perPerson ?? '',
  roomPrice: room?.roomPrice ?? '',
})

const createEmptySetup = (): SetupState => ({
  messName: '',
  address: '',
  totalSeats: '',
  monthlyRent: '',
  messCategory: '',
  paymentDeadlineDay: '10',
  mealOffDeadline: '22:00',
  bazarRules: '',
  rooms: [createRoomDraft()],
})

function normalizeRooms(rooms?: MessRoom[] | null): RoomDraft[] {
  if (!Array.isArray(rooms) || rooms.length === 0) {
    return [createRoomDraft()]
  }

  return rooms.map((room) =>
    createRoomDraft({
      roomName: room?.roomName ?? '',
      perPerson: room?.perPerson !== undefined && room?.perPerson !== null ? String(room.perPerson) : '',
      roomPrice: room?.roomPrice !== undefined && room?.roomPrice !== null ? String(room.roomPrice) : '',
    }),
  )
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getDaysRemaining(endDate: string | null | undefined) {
  if (!endDate) return null
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function planLabel(plan?: SubscriptionPlan | null) {
  if (!plan) return 'N/A'
  if (plan === 'MONTHLY') return 'Monthly'
  if (plan === 'YEARLY') return 'Yearly'
  return 'Trial'
}

export default function MessManagementPage() {
  const { user, refreshUser } = useAuth()
  const [messes, setMesses] = useState<Mess[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  useAutoDismissMessage(message, messageType, setMessage, setMessageType)
  
  const [requestForm, setRequestForm] = useState({
    messName: '',
    address: '',
    totalSeats: '',
    monthlyRent: '',
    description: '',
  })
  const [setup, setSetup] = useState<SetupState>(createEmptySetup)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingMessId, setDeletingMessId] = useState<string | null>(null)
  const [viewingMess, setViewingMess] = useState<Mess | null>(null)
  const [subscription, setSubscription] = useState<MessSubscriptionSummary | null>(null)
  const activeMess = messes[0]
  const isAdmin = user?.role === 'ADMIN'
  const isManager = user?.role === 'MANAGER'

  async function load() {
    setLoading(true)
    try {
      const response = isAdmin
        ? await apiClient.getAllMesses({ limit: 100 }).catch(() => null)
        : await apiClient.getMesses().catch(() => null)
      const list = response?.data
        ? Array.isArray(response.data)
          ? response.data
          : [response.data]
        : []
      setMesses(list)
      setSubscription(null)

      if (list[0]) {
        if (isManager && APP_FEATURES.subscriptions) {
          const subscriptionResponse = await apiClient.getMessSubscription(list[0].id).catch(() => null)
          const data = subscriptionResponse?.data
          if (data && typeof data === 'object' && 'plan' in data) {
            setSubscription({
              plan: data.plan as SubscriptionPlan,
              status: data.status as SubscriptionStatus,
              start_date: data.start_date,
              end_date: data.end_date,
            })
          }
        }

        setSetup({
          messName: list[0].name ?? '',
          address: list[0].address ?? '',
          totalSeats: String(list[0].total_seats ?? ''),
          monthlyRent: String(list[0].monthly_rent ?? ''),
          messCategory: list[0].mess_category ?? '',
          paymentDeadlineDay: String(list[0].payment_deadline_day ?? 10),
          mealOffDeadline: list[0].meal_off_deadline ?? '22:00',
          bazarRules: list[0].bazar_rules ?? '',
          rooms: normalizeRooms(list[0].rooms),
        })
      } else {
        setSetup(createEmptySetup())
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [user?.role])

  async function submitRequest() {
    setMessage('')
    setSubmitting(true)
    try {
      const response = await apiClient.createMess({
        messName: requestForm.messName,
        messLocation: requestForm.address,
        totalSeats: requestForm.totalSeats ? Number(requestForm.totalSeats) : undefined,
        monthlyRent: requestForm.monthlyRent ? Number(requestForm.monthlyRent) : undefined,
        description: requestForm.description || undefined,
      })
      if (response.data) setMesses([response.data])
      await refreshUser()
      setRequestForm({ messName: '', address: '', totalSeats: '', monthlyRent: '', description: '' })
      setMessage('Mess created successfully. Your 30-day free trial has started.')
      setMessageType('success')
      await load()
    } catch {
      setMessage('Failed to create mess. Please try again.')
      setMessageType('error')
    } finally {
      setSubmitting(false)
    }
  }

  async function saveSetup() {
    if (!activeMess) return

    setMessage('')
    setSaving(true)

    try {
      const rooms: RoomPayload[] = setup.rooms
        .map((room): RoomPayload | null => {
          const roomName = room.roomName.trim()
          const perPerson = room.perPerson.trim()
          const roomPrice = room.roomPrice.trim()

          if (!roomName && !perPerson && !roomPrice) return null

          return {
            roomName,
            perPerson: perPerson ? Number(perPerson) : undefined,
            roomPrice: roomPrice ? Number(roomPrice) : undefined,
          }
        })
        .filter((room): room is RoomPayload => room !== null)

      await apiClient.updateMessSetup(activeMess.id, {
        messName: setup.messName,
        address: setup.address,
        totalSeats: setup.totalSeats ? Number(setup.totalSeats) : undefined,
        monthlyRent: setup.monthlyRent ? Number(setup.monthlyRent) : undefined,
        messCategory: setup.messCategory || undefined,
        rooms: rooms.length ? rooms : undefined,
        paymentDeadlineDay: setup.paymentDeadlineDay ? Number(setup.paymentDeadlineDay) : undefined,
        mealOffDeadline: setup.mealOffDeadline,
        bazarRules: setup.bazarRules,
        mealTypes: ['BREAKFAST', 'LUNCH', 'DINNER'],
        mealRateMethod: 'EXPENSE_DIVIDED_BY_MEAL_COUNT',
      })
      setMessage('Mess setup saved successfully.')
      setMessageType('success')
      await load()
    } catch {
      setMessage('Failed to save setup. Please try again.')
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  function updateRoom(index: number, field: keyof RoomDraft, value: string) {
    setSetup((current) => ({
      ...current,
      rooms: current.rooms.map((room, roomIndex) =>
        roomIndex === index ? { ...room, [field]: value } : room,
      ),
    }))
  }

  function addRoom() {
    setSetup((current) => ({
      ...current,
      rooms: [...current.rooms, createRoomDraft()],
    }))
  }

  async function deleteMess(messId: string) {
    if (!confirm('Are you sure you want to delete this mess? This action cannot be undone.')) return
    setDeletingMessId(messId)
    try {
      await apiClient.deleteMess(messId)
      setMessage('Mess deleted successfully.')
      setMessageType('success')
      await load()
    } catch {
      setMessage('Failed to delete mess.')
      setMessageType('error')
    } finally {
      setDeletingMessId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        title={isAdmin ? 'All Messes' : isManager ? 'Mess Settings' : 'Create Mess'}
        description={isAdmin ? 'Super admin mess overview' : 'Manage setup, rooms, billing defaults, and subscription status'}
      />
      <div className="p-4 sm:p-6 lg:p-8">
        {message && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold  ${
              messageType === 'success'
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }`}
          >
            {messageType === 'success' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
            {message}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm font-bold text-muted-foreground">
            <Loader2 className="animate-spin text-primary" size={20} />
            Loading mess data...
          </div>
        ) : isAdmin ? (
          <div>
            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl r bg-primary/10  ">
                <Building2 size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">All Registered Messes</h2>
                <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                  {messes.length} mess{messes.length !== 1 ? 'es' : ''} found
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {messes.map((mess) => {
                const isDeleting = deletingMessId === mess.id
                return (
                <div
                  key={mess.id}
                  className="group relative overflow-hidden rounded-lg border border-border bg-background transition-colors hover:border-primary"
                >
                  <div className="absolute inset-x-0 top-0 h-1  bg-primary  " />
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl r bg-primary/10  ">
                        <Home size={20} className="text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-foreground">{mess.name}</h3>
                        <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                          <MapPin size={12} className="shrink-0 text-primary" />
                          {mess.address || 'No address'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-muted p-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">Members</p>
                        <p className="mt-0.5 text-sm font-bold text-foreground">{mess._count?.memberships ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">Status</p>
                        <span
                          className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            mess.settings_completed
                              ? 'border border-primary/30 bg-primary/10 text-primary'
                              : 'border border-primary/30 bg-primary/10 text-primary'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${mess.settings_completed ? 'bg-primary/100' : 'bg-primary/100'}`} />
                          {mess.settings_completed ? 'Complete' : 'Incomplete'}
                        </span>
                      </div>
                    </div>
                    {/* Bottom action buttons */}
                    <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
                      <button
                        onClick={() => setViewingMess(mess)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary/10"
                      >
                        <Eye size={13} />
                        View
                      </button>
                      <button
                        onClick={() => deleteMess(mess.id)}
                        disabled={isDeleting}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 text-xs font-bold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                      >
                        {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          </div>
        ) : isManager && activeMess ? (
          <div className="grid gap-7 xl:grid-cols-[1fr_380px]">
            <div className="overflow-hidden rounded-xl border border-border bg-background ">
              <div className="border-b border-border  bg-muted via-white  px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl r bg-primary/10  ">
                    <Settings2 size={22} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Configuration</p>
                    <h2 className="mt-1 text-lg font-semibold text-foreground">Complete Mess Setup</h2>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Mess Name
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                      value={setup.messName}
                      onChange={(e) => setSetup((current) => ({ ...current, messName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Address
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                      value={setup.address}
                      onChange={(e) => setSetup((current) => ({ ...current, address: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Mess Category
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                      placeholder="flat, mess"
                      value={setup.messCategory}
                      onChange={(e) => setSetup((current) => ({ ...current, messCategory: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Total Seats
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                      type="number"
                      value={setup.totalSeats}
                      onChange={(e) => setSetup((current) => ({ ...current, totalSeats: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Monthly Rent
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                      type="number"
                      value={setup.monthlyRent}
                      onChange={(e) => setSetup((current) => ({ ...current, monthlyRent: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Payment Deadline Day
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                      type="number"
                      value={setup.paymentDeadlineDay}
                      onChange={(e) => setSetup((current) => ({ ...current, paymentDeadlineDay: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Meal Off Deadline
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                      value={setup.mealOffDeadline}
                      onChange={(e) => setSetup((current) => ({ ...current, mealOffDeadline: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Rooms
                    </label>
                    <div className="space-y-4">
                      {setup.rooms.map((room, index) => (
                        <div key={room.id} className="rounded-xl border border-border bg-muted p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                              Room {index + 1}
                            </p>
                          </div>
                          <div className="grid gap-4 md:grid-cols-3">
                            <div>
                              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                Room Name
                              </label>
                              <input
                                className="h-[44px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                                value={room.roomName}
                                onChange={(e) => updateRoom(index, 'roomName', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                Total Person
                              </label>
                              <input
                                className="h-[44px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                                type="number"
                                value={room.perPerson}
                                onChange={(e) => updateRoom(index, 'perPerson', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                Room Price
                              </label>
                              <input
                                className="h-[44px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                                type="number"
                                value={room.roomPrice}
                                onChange={(e) => updateRoom(index, 'roomPrice', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addRoom}
                      className="mt-4 inline-flex h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 text-sm font-semibold text-primary transition hover:border-primary hover:bg-background"
                    >
                      <Plus size={16} />
                      Add More Room
                    </button>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Bazar Rules
                    </label>
                    <textarea
                      className="min-h-[120px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                      value={setup.bazarRules}
                      onChange={(e) => setSetup((current) => ({ ...current, bazarRules: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={saveSetup}
                    disabled={saving}
                    className="inline-flex h-[48px] items-center justify-center gap-2 rounded-xl  bg-primary  px-6 font-semibold text-primary-foreground  transition  disabled:opacity-70"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Setup'}
                  </button>
                </div>
              </div>
            </div>

            <div className="h-fit overflow-hidden rounded-xl border border-border bg-background ">
              <div className="border-b border-border  bg-muted via-white  px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl r bg-primary  ">
                    <Home size={22} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Overview</p>
                    <h2 className="mt-1 text-lg font-semibold text-foreground">{activeMess.name}</h2>
                  </div>
                </div>
              </div>
              <div className="p-6">
                  <div className="space-y-4">
                    {APP_FEATURES.subscriptions && <div className="rounded-xl border border-border r bg-muted to-white p-4 ">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Subscription</p>
                          <h3 className="mt-1 text-base font-semibold text-foreground">
                            {subscription ? planLabel(subscription.plan) : 'Subscription not loaded'}
                          </h3>
                        </div>
                        {subscription && (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                              subscription.status === 'ACTIVE'
                                ? 'bg-primary/10 text-primary'
                                : subscription.status === 'EXPIRED'
                                  ? 'bg-destructive/10 text-destructive'
                                  : subscription.status === 'CANCELLED'
                                    ? 'bg-muted text-muted-foreground'
                                    : 'bg-primary/10 text-primary'
                            }`}
                          >
                            {subscription.status}
                          </span>
                        )}
                      </div>

                      {subscription ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border border-border bg-background p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Started</p>
                            <p className="mt-1 text-sm font-bold text-foreground">{formatDate(subscription.start_date)}</p>
                          </div>
                          <div className="rounded-lg border border-border bg-background p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ends</p>
                            <p className="mt-1 text-sm font-bold text-foreground">{formatDate(subscription.end_date)}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-xs font-semibold text-muted-foreground">No subscription details found for this mess.</p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-bold text-muted-foreground">
                          Days left: {subscription && subscription.end_date ? `${Math.max(getDaysRemaining(subscription.end_date) ?? 0, 0)} days` : 'N/A'}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-bold text-muted-foreground">
                          Plan: {planLabel(subscription?.plan)}
                        </span>
                      </div>
                    </div>}

                    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-4">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg r bg-primary ">
                        <CheckCircle2 size={16} className="text-primary" />
                      </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Setup Status</p>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {activeMess.settings_completed ? 'Setup completed' : 'Setup incomplete'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand)]">
                      <Tags size={17} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Mess Category</p>
                      <p className="text-xs font-semibold text-muted-foreground">{activeMess.mess_category || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg r bg-primary ">
                      <Settings2 size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Rooms</p>
                      <p className="text-xs font-semibold text-muted-foreground">{activeMess.rooms?.length ?? 0} room sections</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg r bg-primary ">
                      <CalendarDays size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Payment Deadline</p>
                      <p className="text-xs font-semibold text-muted-foreground">Day {activeMess.payment_deadline_day ?? 10} of each month</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive">
                      <UtensilsCrossed size={17} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Meal Off Deadline</p>
                      <p className="text-xs font-semibold text-muted-foreground">{activeMess.meal_off_deadline ?? '22:00'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl">
            <div className="overflow-hidden rounded-xl border border-border bg-background ">
              <div className="border-b border-border  bg-muted via-white  px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl r bg-primary/10  ">
                    <Building2 size={22} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">New Mess</p>
                    <h2 className="mt-1 text-lg font-semibold text-foreground">Create Mess</h2>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="mb-6 text-sm font-semibold leading-relaxed text-muted-foreground">
                  Create your mess instantly. Admins will be notified, and your free trial starts immediately.
                </p>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Mess Name
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                      placeholder="Enter mess name"
                      value={requestForm.messName}
                      onChange={(e) => setRequestForm((current) => ({ ...current, messName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Address
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                      placeholder="Enter mess address"
                      value={requestForm.address}
                      onChange={(e) => setRequestForm((current) => ({ ...current, address: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Total Seats
                      </label>
                      <input
                        className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                        type="number"
                        placeholder="e.g. 10"
                        value={requestForm.totalSeats}
                        onChange={(e) => setRequestForm((current) => ({ ...current, totalSeats: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Monthly Rent (৳)
                      </label>
                      <input
                        className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                        type="number"
                        placeholder="e.g. 5000"
                        value={requestForm.monthlyRent}
                        onChange={(e) => setRequestForm((current) => ({ ...current, monthlyRent: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Description
                    </label>
                    <textarea
                      className="min-h-[120px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                      placeholder="Add any additional details about your mess..."
                      value={requestForm.description}
                      onChange={(e) => setRequestForm((current) => ({ ...current, description: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={submitRequest}
                    disabled={submitting || !requestForm.messName.trim() || !requestForm.address.trim()}
                    className="inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-xl  bg-primary  px-6 font-semibold text-primary-foreground  transition  disabled:opacity-70 sm:w-auto"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {submitting ? 'Creating...' : 'Create Mess'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Detail Modal */}
        {viewingMess && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={(e) => e.target === e.currentTarget && setViewingMess(null)}
          >
            <div className="relative w-full max-w-[520px] overflow-hidden rounded-lg border border-border bg-background">
              <div className="absolute inset-x-0 top-0 h-1.5  bg-primary  " />
              
              <div className="relative flex items-center justify-between border-b border-border px-5 py-5 sm:px-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Mess Details</p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground truncate">{viewingMess.name}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingMess(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted text-primary transition hover:border-primary hover:bg-muted"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="relative max-h-[calc(100vh-120px)] overflow-y-auto p-5 sm:p-6">
                {/* Basic info */}
                <div className="mb-4 space-y-3">
                  <div className="rounded-lg border border-border bg-muted p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Mess Name</p>
                    <p className="mt-1 text-sm font-bold text-foreground">{viewingMess.name}</p>
                  </div>
                  {viewingMess.address && (
                    <div className="rounded-lg border border-border bg-muted p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Address</p>
                      <p className="mt-1 text-sm font-bold text-foreground">{viewingMess.address}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-muted p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Members</p>
                      <p className="mt-1 text-sm font-bold text-foreground">{viewingMess._count?.memberships ?? 0}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Total Seats</p>
                      <p className="mt-1 text-sm font-bold text-foreground">{viewingMess.total_seats ?? '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-muted p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Monthly Rent</p>
                      <p className="mt-1 text-sm font-bold text-foreground">৳ {Number(viewingMess.monthly_rent ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Category</p>
                      <p className="mt-1 text-sm font-bold text-foreground">{viewingMess.mess_category || 'Not set'}</p>
                    </div>
                  </div>
                </div>

                {/* Setup status */}
                <div className="mb-4 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-muted-foreground">Setup Status</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      viewingMess.settings_completed
                        ? 'border border-primary/30 bg-primary/10 text-primary'
                        : 'border border-primary/30 bg-primary/10 text-primary'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${viewingMess.settings_completed ? 'bg-primary/100' : 'bg-primary/100'}`} />
                      {viewingMess.settings_completed ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                </div>

                {/* Rooms */}
                {Array.isArray(viewingMess.rooms) && viewingMess.rooms.length > 0 && (
                  <div className="mb-4 rounded-lg border border-border p-3">
                    <p className="mb-2 text-xs font-bold text-muted-foreground">Rooms ({viewingMess.rooms.length})</p>
                    <div className="space-y-2">
                      {viewingMess.rooms.map((room, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs">
                          <span className="font-bold text-foreground">{room?.roomName || `Room ${idx + 1}`}</span>
                          <div className="flex gap-3">
                            <span className="font-semibold text-muted-foreground">Seats: {room?.perPerson ?? 1}</span>
                            {room?.roomPrice && <span className="font-semibold text-primary">৳{Number(room.roomPrice).toLocaleString()}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {viewingMess.description && (
                  <div className="mb-4 rounded-lg border border-border bg-muted p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Description</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{viewingMess.description}</p>
                  </div>
                )}

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setViewingMess(null)}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl  bg-primary  px-6 font-semibold text-primary-foreground  transition "
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
