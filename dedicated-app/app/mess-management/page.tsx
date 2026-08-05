'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CircleDollarSign,
  Clock3,
  MapPin,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import { MobileShell } from '@/components/mobile-shell'
import { TopScreen } from '@/components/top-screen'
import { LoadingIndicator } from '@/components/loading-indicator'
import { FieldCard, SubmitButton, TextAreaField, TextField } from '@/components/mobile/form-controls'
import { api } from '@/lib/api'
import { useAuth } from '../providers'

type RoomDraft = {
  id: string
  roomName: string
  perPerson: string
  roomPrice: string
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

type SubscriptionSummary = {
  plan: string
  status: string
  start_date: string
  end_date: string | null
}

type SubscriptionPlanInfo = {
  label: string
  price: number
  days: number
  currency?: string
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

function normalizeRooms(rooms?: unknown): RoomDraft[] {
  if (!Array.isArray(rooms) || rooms.length === 0) return [createRoomDraft()]

  return rooms.map((room) => {
    const value = (room ?? {}) as Record<string, unknown>
    return createRoomDraft({
      roomName: typeof value.roomName === 'string' ? value.roomName : '',
      perPerson: value.perPerson !== undefined && value.perPerson !== null ? String(value.perPerson) : '',
      roomPrice: value.roomPrice !== undefined && value.roomPrice !== null ? String(value.roomPrice) : '',
    })
  })
}

function formatDate(value?: string | null) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getDaysRemaining(endDate?: string | null) {
  if (!endDate) return null
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return Math.max(days, 0)
}

function planLabel(plan?: string, planInfo?: SubscriptionPlanInfo) {
  if (planInfo?.label) return planInfo.label
  if (!plan) return 'N/A'
  if (plan === 'MONTHLY') return 'Monthly'
  if (plan === 'YEARLY') return 'Yearly'
  return 'Trial'
}

function StatusPill({ status }: { status?: string }) {
  const normalized = (status ?? '').toUpperCase()
  const tone =
    normalized === 'ACTIVE'
      ? 'ui-badge--success'
      : normalized === 'EXPIRED'
        ? 'ui-badge--danger'
        : normalized === 'CANCELLED'
          ? 'ui-badge--neutral'
          : 'ui-badge--warning'

  return <span className={`ui-badge ${tone}`}>{normalized || 'Unknown'}</span>
}

export default function MessManagementPage() {
  const { user } = useAuth()
  const messId = useMemo(
    () => user?.memberships?.[0]?.mess_id ?? user?.memberships?.[0]?.mess?.id ?? '',
    [user],
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [setup, setSetup] = useState<SetupState>(createEmptySetup)
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null)
  const [subscriptionPlans, setSubscriptionPlans] = useState<Record<string, SubscriptionPlanInfo>>({})

  useEffect(() => {
    let alive = true
    if (!messId) {
      setLoading(false)
      return
    }

    async function loadMessSettings(showLoader = true) {
      if (showLoader) setLoading(true)
      setMessage(null)

      const [messesResult, subscriptionResult, plansResult] = await Promise.allSettled([
        api.getMesses(),
        api.getMessSubscription(messId),
        api.getSubscriptionPlans(),
      ])

      if (!alive) return

      if (messesResult.status === 'fulfilled') {
        const list = Array.isArray(messesResult.value.data) ? messesResult.value.data : []
        const mess = list.find((item) => item?.id === messId) ?? list[0]

        if (mess) {
          setSetup({
            messName: mess?.name ?? '',
            address: mess?.address ?? '',
            totalSeats: mess?.total_seats !== undefined && mess?.total_seats !== null ? String(mess.total_seats) : '',
            monthlyRent: mess?.monthly_rent !== undefined && mess?.monthly_rent !== null ? String(mess.monthly_rent) : '',
            messCategory: mess?.mess_category ?? '',
            paymentDeadlineDay: String(mess?.payment_deadline_day ?? 10),
            mealOffDeadline: mess?.meal_off_deadline ?? '22:00',
            bazarRules: mess?.bazar_rules ?? '',
            rooms: normalizeRooms(mess?.rooms),
          })
        } else {
          setSetup(createEmptySetup())
        }
      } else {
        setSetup(createEmptySetup())
      }

      if (subscriptionResult.status === 'fulfilled') {
        const data = subscriptionResult.value?.data
        if (data && typeof data === 'object') {
          setSubscription({
            plan: data.plan ?? 'TRIAL',
            status: data.status ?? 'ACTIVE',
            start_date: data.start_date ?? '',
            end_date: data.end_date ?? null,
          })
        } else {
          setSubscription(null)
        }
      } else {
        setSubscription(null)
      }

      if (plansResult.status === 'fulfilled' && plansResult.value?.data) {
        setSubscriptionPlans(plansResult.value.data)
      }

      if (showLoader) setLoading(false)
    }

    void loadMessSettings()

    const refreshVisibleData = () => {
      if (document.visibilityState !== 'hidden') void loadMessSettings(false)
    }

    window.addEventListener('focus', refreshVisibleData)
    document.addEventListener('visibilitychange', refreshVisibleData)

    return () => {
      alive = false
      window.removeEventListener('focus', refreshVisibleData)
      document.removeEventListener('visibilitychange', refreshVisibleData)
    }
  }, [messId])

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

  function removeRoom(index: number) {
    setSetup((current) => ({
      ...current,
      rooms: current.rooms.length > 1 ? current.rooms.filter((_, roomIndex) => roomIndex !== index) : current.rooms,
    }))
  }

  async function handleSave() {
    if (!messId) return
    setMessage(null)
    setSaving(true)

    try {
      const rooms = setup.rooms
        .map((room) => {
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
        .filter((room): room is { roomName: string; perPerson: number | undefined; roomPrice: number | undefined } => room !== null)

      await api.updateMessSetup(messId, {
        messName: setup.messName.trim(),
        address: setup.address.trim(),
        totalSeats: setup.totalSeats ? Number(setup.totalSeats) : undefined,
        monthlyRent: setup.monthlyRent ? Number(setup.monthlyRent) : undefined,
        messCategory: setup.messCategory.trim() || undefined,
        rooms: rooms.length ? rooms : undefined,
        paymentDeadlineDay: setup.paymentDeadlineDay ? Number(setup.paymentDeadlineDay) : undefined,
        mealOffDeadline: setup.mealOffDeadline,
        bazarRules: setup.bazarRules,
        mealTypes: ['BREAKFAST', 'LUNCH', 'DINNER'],
        mealRateMethod: 'EXPENSE_DIVIDED_BY_MEAL_COUNT',
      })

      setMessage({ tone: 'success', text: 'Mess setup saved successfully.' })
    } catch (error) {
      setMessage({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to save mess setup.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <MobileShell>
      <TopScreen title="Mess Management" subtitle="Setup, rooms and billing defaults" backHref="/more" />

      <div className="screen space-y-4">
        {loading ? (
          <LoadingIndicator variant="card" label="Loading mess settings" />
        ) : (
          <>
            {/* ── Overview hero ── */}
            <section className="ui-card ui-card--hero" aria-labelledby="mess-overview-heading">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-[18px] bg-white/15 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.14)_inset]">
                  <Building2 size={26} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="ui-caption text-white/70">Workspace</p>
                  <h2 id="mess-overview-heading" className="ui-card-title mt-0.5 break-words !text-white">
                    {setup.messName || 'Your Mess'}
                  </h2>
                  <p className="ui-card-subtitle mt-0.5 flex items-center gap-1 !text-white/70">
                    <MapPin size={13} aria-hidden="true" />
                    <span className="truncate">{setup.address || 'Address not set'}</span>
                  </p>
                </div>
                <StatusPill status={subscription?.status} />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white/10 p-3 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset]">
                  <p className="text-caption font-semibold text-white/70">Plan</p>
                  <p className="mt-1 text-body font-bold text-white">{planLabel(subscription?.plan, subscription?.plan ? subscriptionPlans[subscription.plan] : undefined)}</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset]">
                  <p className="text-caption font-semibold text-white/70">Days Left</p>
                  <p className="mt-1 text-body font-bold text-white">
                    {subscription?.end_date ? `${getDaysRemaining(subscription.end_date) ?? 0}d` : 'N/A'}
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 p-3 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset]">
                  <p className="text-caption font-semibold text-white/70">Members</p>
                  <p className="mt-1 text-body font-bold text-white">{user?.memberships?.length ?? 0}</p>
                </div>
              </div>
            </section>

            {/* ── Subscription summary ── */}
            {subscription ? (
              <section className="ui-card" aria-labelledby="subscription-heading">
                <h2 id="subscription-heading" className="ui-section-title">
                  Subscription
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#cfeeed] bg-[#f9fdfd] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="ui-icon-tile ui-icon-tile--md bg-[#edfafa] text-[#008d8c]" aria-hidden="true">
                        <CircleDollarSign size={18} />
                      </div>
                      <div>
                        <p className="ui-label">Plan</p>
                        <p className="ui-caption mt-0.5">{planLabel(subscription.plan, subscriptionPlans[subscription.plan])}</p>
                      </div>
                    </div>
                    <StatusPill status={subscription.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-[#cfeeed] bg-[#f9fdfd] px-4 py-3">
                      <p className="ui-caption">Started</p>
                      <p className="ui-label mt-0.5">{formatDate(subscription.start_date)}</p>
                    </div>
                    <div className="rounded-2xl border border-[#cfeeed] bg-[#f9fdfd] px-4 py-3">
                      <p className="ui-caption">Ends</p>
                      <p className="ui-label mt-0.5">{formatDate(subscription.end_date)}</p>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {/* ── Setup form ── */}
            <section className="ui-card space-y-4" aria-labelledby="settings-heading">
              <h2 id="settings-heading" className="ui-section-title">
                Mess settings
              </h2>

              <TextField
                label="Mess Name"
                value={setup.messName}
                onChange={(messName) => setSetup((current) => ({ ...current, messName }))}
                placeholder="Green House Mess"
              />

              <TextField
                label="Address"
                value={setup.address}
                onChange={(address) => setSetup((current) => ({ ...current, address }))}
                placeholder="Narayanganj, Dhaka"
              />

              <div className="ui-grid-2">
                <TextField
                  label="Mess Category"
                  value={setup.messCategory}
                  onChange={(messCategory) => setSetup((current) => ({ ...current, messCategory }))}
                  placeholder="flat, mess"
                />
                <TextField
                  label="Total Seats"
                  value={setup.totalSeats}
                  onChange={(totalSeats) => setSetup((current) => ({ ...current, totalSeats }))}
                  placeholder="e.g. 12"
                  type="number"
                />
              </div>

              <div className="ui-grid-2">
                <TextField
                  label="Monthly Rent (৳)"
                  value={setup.monthlyRent}
                  onChange={(monthlyRent) => setSetup((current) => ({ ...current, monthlyRent }))}
                  placeholder="e.g. 50000"
                  type="number"
                />
                <TextField
                  label="Payment Deadline Day"
                  value={setup.paymentDeadlineDay}
                  onChange={(paymentDeadlineDay) => setSetup((current) => ({ ...current, paymentDeadlineDay }))}
                  placeholder="e.g. 10"
                  type="number"
                />
              </div>

              <FieldCard label="Meal Off Deadline" hint="Members must mark meals off before this time">
                <div className="relative">
                  <span className="field-icon field-icon--leading text-[#008d8c]" aria-hidden="true">
                    <Clock3 size={18} />
                  </span>
                  <input
                    type="time"
                    className="field min-h-14 pl-12"
                    value={setup.mealOffDeadline}
                    onChange={(event) =>
                      setSetup((current) => ({ ...current, mealOffDeadline: event.target.value }))
                    }
                  />
                </div>
              </FieldCard>

              <TextAreaField
                label="Bazar Rules"
                value={setup.bazarRules}
                onChange={(bazarRules) => setSetup((current) => ({ ...current, bazarRules }))}
                placeholder="Manager assigns weekly bazar turns."
                rows={3}
              />
            </section>

            {/* ── Rooms ── */}
            <section className="ui-card space-y-3" aria-labelledby="rooms-heading">
              <div className="flex items-center justify-between gap-3">
                <h2 id="rooms-heading" className="ui-section-title !mb-0">
                  Rooms
                </h2>
                <button
                  type="button"
                  onClick={addRoom}
                  className="flex min-h-9 items-center justify-center gap-1.5 rounded-[12px] bg-[#edfafa] px-3 text-caption font-bold text-[#008d8c] transition active:scale-[0.98]"
                >
                  <Plus size={14} strokeWidth={2.6} aria-hidden="true" />
                  Add Room
                </button>
              </div>

              {setup.rooms.map((room, index) => (
                <div
                  key={room.id}
                  className="rounded-2xl border border-[#cfeeed] bg-[#fbfefe] p-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="ui-caption font-bold !text-[#123748]">Room {index + 1}</p>
                    {setup.rooms.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeRoom(index)}
                        className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#fff1f1] text-[#d92d20] transition active:scale-[0.96]"
                        aria-label={`Remove room ${index + 1}`}
                      >
                        <Trash2 size={14} strokeWidth={2.3} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>

                  <div className="space-y-3">
                    <TextField
                      label="Room Name"
                      value={room.roomName}
                      onChange={(roomName) => updateRoom(index, 'roomName', roomName)}
                      placeholder="e.g. Room A"
                    />
                    <div className="ui-grid-2">
                      <TextField
                        label="Total Person"
                        value={room.perPerson}
                        onChange={(perPerson) => updateRoom(index, 'perPerson', perPerson)}
                        placeholder="e.g. 2"
                        type="number"
                      />
                      <TextField
                        label="Room Price (৳)"
                        value={room.roomPrice}
                        onChange={(roomPrice) => updateRoom(index, 'roomPrice', roomPrice)}
                        placeholder="e.g. 12000"
                        type="number"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {message ? (
              <div
                className={`ui-notice ${message.tone === 'success' ? 'ui-notice--success' : 'ui-notice--danger'}`}
                role="status"
              >
                {message.text}
              </div>
            ) : null}

            <SubmitButton busy={saving} onClick={() => void handleSave()}>
              <Save size={17} aria-hidden="true" />
              Save Setup
            </SubmitButton>
          </>
        )}
      </div>
    </MobileShell>
  )
}
