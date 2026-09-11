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
import { statusLabel, subscriptionPlanLabel, useLocale, useLocaleFormatters, useTranslations } from '@/lib/i18n'

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

function getDaysRemaining(endDate: string | null | undefined) {
  if (!endDate) return null
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function MessManagementPage() {
  const { user, refreshUser } = useAuth()
  const { locale } = useLocale()
  const format = useLocaleFormatters()
  const t = useTranslations('messManagementPage')
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
      setMessage(t('createdSuccess'))
      setMessageType('success')
      await load()
    } catch {
      setMessage(t('createFailed'))
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
        // Send an empty array as well, so removing the final room clears the
        // saved configuration instead of leaving the previous rooms behind.
        rooms,
        paymentDeadlineDay: setup.paymentDeadlineDay ? Number(setup.paymentDeadlineDay) : undefined,
        mealOffDeadline: setup.mealOffDeadline,
        bazarRules: setup.bazarRules,
        mealTypes: ['BREAKFAST', 'LUNCH', 'DINNER'],
        mealRateMethod: 'EXPENSE_DIVIDED_BY_MEAL_COUNT',
      })
      setMessage(t('setupSaved'))
      setMessageType('success')
      await load()
    } catch {
      setMessage(t('setupSaveFailed'))
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

  function removeRoom(roomId: string) {
    setSetup((current) => ({
      ...current,
      rooms: current.rooms.filter((room) => room.id !== roomId),
    }))
  }

  async function deleteMess(messId: string) {
    if (!confirm(t('deleteConfirm'))) return
    setDeletingMessId(messId)
    try {
      await apiClient.deleteMess(messId)
      setMessage(t('deletedSuccess'))
      setMessageType('success')
      await load()
    } catch {
      setMessage(t('deleteFailed'))
      setMessageType('error')
    } finally {
      setDeletingMessId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        title={isAdmin ? t('allMesses') : isManager ? t('messSettings') : t('createMess')}
        description={isAdmin ? t('adminDescription') : t('managerDescription')}
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
            {t('loading')}
          </div>
        ) : isAdmin ? (
          <div>
            <div className="mb-7 flex items-center gap-4">
              <div className="dashboard-section-icon size-12 rounded-lg">
                <Building2 size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t('allRegistered')}</h2>
                <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
                  {t('foundCount', { count: format.number(messes.length) })}
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
                      <div className="dashboard-section-icon size-11 rounded-lg">
                        <Home size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-foreground">{mess.name}</h3>
                        <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                          <MapPin size={12} className="shrink-0 text-primary" />
                          {mess.address || t('noAddress')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-muted p-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">{t('members')}</p>
                        <p className="mt-0.5 text-sm font-bold text-foreground">{format.number(mess._count?.memberships ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">{t('status')}</p>
                        <span
                          className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            mess.settings_completed
                              ? 'border border-primary/30 bg-primary/10 text-primary'
                              : 'border border-primary/30 bg-primary/10 text-primary'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${mess.settings_completed ? 'bg-primary/100' : 'bg-primary/100'}`} />
                          {mess.settings_completed ? t('complete') : t('incomplete')}
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
                        {t('view')}
                      </button>
                      <button
                        onClick={() => deleteMess(mess.id)}
                        disabled={isDeleting}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 text-xs font-bold text-destructive transition hover:bg-destructive/10 disabled:opacity-60"
                      >
                        {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        {isDeleting ? t('deleting') : t('delete')}
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
                  <div className="dashboard-section-icon size-11 rounded-lg">
                    <Settings2 size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{t('configuration')}</p>
                    <h2 className="mt-1 text-lg font-semibold text-foreground">{t('completeSetup')}</h2>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                       {t('messName')}
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                      value={setup.messName}
                      onChange={(e) => setSetup((current) => ({ ...current, messName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                       {t('address')}
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                      value={setup.address}
                      onChange={(e) => setSetup((current) => ({ ...current, address: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                       {t('messCategory')}
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                      placeholder={t('categoryPlaceholder')}
                      value={setup.messCategory}
                      onChange={(e) => setSetup((current) => ({ ...current, messCategory: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                       {t('totalSeats')}
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
                       {t('monthlyRent')}
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
                       {t('paymentDeadlineDay')}
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
                       {t('mealOffDeadline')}
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                      value={setup.mealOffDeadline}
                      onChange={(e) => setSetup((current) => ({ ...current, mealOffDeadline: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                       {t('rooms')}
                    </label>
                    <div className="space-y-4">
                      {setup.rooms.map((room, index) => (
                        <div key={room.id} className="rounded-xl border border-border bg-muted p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                               {t('roomNumber', { number: format.number(index + 1) })}
                            </p>
                            <button
                              type="button"
                              onClick={() => removeRoom(room.id)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-destructive/30 bg-background px-2.5 text-xs font-semibold text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30"
                              aria-label={t('delete')}
                              title={t('delete')}
                            >
                              <Trash2 size={14} />
                              {t('delete')}
                            </button>
                          </div>
                          <div className="grid gap-4 md:grid-cols-3">
                            <div>
                              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                 {t('roomName')}
                              </label>
                              <input
                                className="h-[44px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                                value={room.roomName}
                                onChange={(e) => updateRoom(index, 'roomName', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                 {t('totalPerson')}
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
                                 {t('roomPrice')}
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
                       {t('addRoom')}
                    </button>
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                       {t('bazarRules')}
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
                     {saving ? t('saving') : t('saveSetup')}
                  </button>
                </div>
              </div>
            </div>

            <div className="h-fit overflow-hidden rounded-xl border border-border bg-background ">
              <div className="border-b border-border  bg-muted via-white  px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="dashboard-section-icon size-11 rounded-lg">
                    <Home size={22} />
                  </div>
                  <div>
                     <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{t('overview')}</p>
                    <h2 className="mt-1 text-lg font-semibold text-foreground">{activeMess.name}</h2>
                  </div>
                </div>
              </div>
              <div className="p-6">
                  <div className="space-y-4">
                    {APP_FEATURES.subscriptions && <div className="rounded-xl border border-border r bg-muted to-white p-4 ">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                           <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">{t('subscription')}</p>
                          <h3 className="mt-1 text-base font-semibold text-foreground">
                             {subscription ? subscriptionPlanLabel(subscription.plan, locale) : t('subscriptionNotLoaded')}
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
                            {statusLabel(subscription.status, locale)}
                          </span>
                        )}
                      </div>

                      {subscription ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border border-border bg-background p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('started')}</p>
                            <p className="mt-1 text-sm font-bold text-foreground">{format.date(subscription.start_date)}</p>
                          </div>
                          <div className="rounded-lg border border-border bg-background p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('ends')}</p>
                            <p className="mt-1 text-sm font-bold text-foreground">{subscription.end_date ? format.date(subscription.end_date) : t('notAvailable')}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 text-xs font-semibold text-muted-foreground">{t('noSubscription')}</p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-bold text-muted-foreground">
                          {t('daysLeft', { days: subscription && subscription.end_date ? format.number(Math.max(getDaysRemaining(subscription.end_date) ?? 0, 0)) : t('notAvailable') })}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-bold text-muted-foreground">
                          {t('plan', { plan: subscription?.plan ? subscriptionPlanLabel(subscription.plan, locale) : t('notAvailable') })}
                        </span>
                      </div>
                    </div>}

                    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-4">
                      <div className="dashboard-section-icon size-9 rounded-md">
                        <CheckCircle2 size={16} />
                      </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{t('setupStatus')}</p>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {activeMess.settings_completed ? t('setupCompleted') : t('setupIncomplete')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-4">
                    <div className="dashboard-section-icon size-9 rounded-md">
                      <Tags size={17} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{t('messCategory')}</p>
                      <p className="text-xs font-semibold text-muted-foreground">{activeMess.mess_category || t('notSet')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-4">
                    <div className="dashboard-section-icon size-9 rounded-md">
                      <Settings2 size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{t('rooms')}</p>
                      <p className="text-xs font-semibold text-muted-foreground">{t('roomSections', { count: format.number(activeMess.rooms?.length ?? 0) })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-4">
                    <div className="dashboard-section-icon size-9 rounded-md">
                      <CalendarDays size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{t('paymentDeadline')}</p>
                      <p className="text-xs font-semibold text-muted-foreground">{t('dayOfMonth', { day: format.number(activeMess.payment_deadline_day ?? 10) })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted p-4">
                    <div className="dashboard-section-icon size-9 rounded-md">
                      <UtensilsCrossed size={17} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{t('mealOffDeadline')}</p>
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
                  <div className="dashboard-section-icon size-11 rounded-lg">
                    <Building2 size={22} />
                  </div>
                  <div>
                     <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{t('newMess')}</p>
                     <h2 className="mt-1 text-lg font-semibold text-foreground">{t('createMess')}</h2>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="mb-6 text-sm font-semibold leading-relaxed text-muted-foreground">
                   {t('createDescription')}
                </p>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                       {t('messName')}
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                       placeholder={t('messNamePlaceholder')}
                      value={requestForm.messName}
                      onChange={(e) => setRequestForm((current) => ({ ...current, messName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                       {t('address')}
                    </label>
                    <input
                      className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                       placeholder={t('addressPlaceholder')}
                      value={requestForm.address}
                      onChange={(e) => setRequestForm((current) => ({ ...current, address: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                         {t('totalSeats')}
                      </label>
                      <input
                        className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                        type="number"
                        placeholder={t('seatsPlaceholder')}
                        value={requestForm.totalSeats}
                        onChange={(e) => setRequestForm((current) => ({ ...current, totalSeats: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                         {t('monthlyRentCurrency')}
                      </label>
                      <input
                        className="h-[48px] w-full rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                        type="number"
                        placeholder={t('rentPlaceholder')}
                        value={requestForm.monthlyRent}
                        onChange={(e) => setRequestForm((current) => ({ ...current, monthlyRent: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                       {t('descriptionLabel')}
                    </label>
                    <textarea
                      className="min-h-[120px] w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/20"
                       placeholder={t('descriptionPlaceholder')}
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
                     {submitting ? t('creating') : t('createMess')}
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
                   <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{t('messDetails')}</p>
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
                     <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t('messName')}</p>
                    <p className="mt-1 text-sm font-bold text-foreground">{viewingMess.name}</p>
                  </div>
                  {viewingMess.address && (
                    <div className="rounded-lg border border-border bg-muted p-3">
                       <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t('address')}</p>
                      <p className="mt-1 text-sm font-bold text-foreground">{viewingMess.address}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-muted p-3">
                       <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t('members')}</p>
                       <p className="mt-1 text-sm font-bold text-foreground">{format.number(viewingMess._count?.memberships ?? 0)}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted p-3">
                       <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t('totalSeats')}</p>
                       <p className="mt-1 text-sm font-bold text-foreground">{viewingMess.total_seats == null ? '-' : format.number(viewingMess.total_seats)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border bg-muted p-3">
                       <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t('monthlyRent')}</p>
                       <p className="mt-1 text-sm font-bold text-foreground">{format.money(viewingMess.monthly_rent ?? 0)}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted p-3">
                       <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t('category')}</p>
                       <p className="mt-1 text-sm font-bold text-foreground">{viewingMess.mess_category || t('notSet')}</p>
                    </div>
                  </div>
                </div>

                {/* Setup status */}
                <div className="mb-4 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                     <p className="text-xs font-bold text-muted-foreground">{t('setupStatus')}</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      viewingMess.settings_completed
                        ? 'border border-primary/30 bg-primary/10 text-primary'
                        : 'border border-primary/30 bg-primary/10 text-primary'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${viewingMess.settings_completed ? 'bg-primary/100' : 'bg-primary/100'}`} />
                       {viewingMess.settings_completed ? t('complete') : t('incomplete')}
                    </span>
                  </div>
                </div>

                {/* Rooms */}
                {Array.isArray(viewingMess.rooms) && viewingMess.rooms.length > 0 && (
                  <div className="mb-4 rounded-lg border border-border p-3">
                     <p className="mb-2 text-xs font-bold text-muted-foreground">{t('roomsCount', { count: format.number(viewingMess.rooms.length) })}</p>
                    <div className="space-y-2">
                      {viewingMess.rooms.map((room, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-xs">
                           <span className="font-bold text-foreground">{room?.roomName || t('roomNumber', { number: format.number(idx + 1) })}</span>
                          <div className="flex gap-3">
                             <span className="font-semibold text-muted-foreground">{t('seatsValue', { count: format.number(room?.perPerson ?? 1) })}</span>
                             {room?.roomPrice && <span className="font-semibold text-primary">{format.money(room.roomPrice)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {viewingMess.description && (
                  <div className="mb-4 rounded-lg border border-border bg-muted p-3">
                     <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t('descriptionLabel')}</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{viewingMess.description}</p>
                  </div>
                )}

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setViewingMess(null)}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl  bg-primary  px-6 font-semibold text-primary-foreground  transition "
                  >
                     {t('close')}
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
